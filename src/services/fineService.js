const { Fine, Member, Transaction, sequelize } = require('../models');
const { BusinessError } = require('../middleware/errorHandler');
const { HTTP_STATUS } = require('../utils/constants');
const DateUtils = require('../utils/dateUtils');

class FineService {
  // Pay a fine
  async payFine(fineId, paymentData) {
    const transaction = await sequelize.transaction();
    
    try {
      const fine = await Fine.findByPk(fineId, {
        include: [
          { model: Member, as: 'member' },
          { model: Transaction, as: 'transaction' }
        ],
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!fine) {
        throw new BusinessError('Fine not found', HTTP_STATUS.NOT_FOUND, 'FINE_NOT_FOUND');
      }

      if (fine.status === 'paid') {
        throw new BusinessError('Fine has already been paid', HTTP_STATUS.CONFLICT, 'FINE_ALREADY_PAID');
      }

      if (fine.status === 'cancelled') {
        throw new BusinessError('Fine has been cancelled', HTTP_STATUS.CONFLICT, 'FINE_CANCELLED');
      }

      // Check payment amount
      if (paymentData.amount_paid < fine.amount) {
        throw new BusinessError(
          `Insufficient payment. Required: $${fine.amount}`,
          HTTP_STATUS.BAD_REQUEST,
          'INSUFFICIENT_PAYMENT'
        );
      }

      // Update fine
      fine.status = 'paid';
      fine.paid_at = DateUtils.getCurrentDate();
      fine.payment_method = paymentData.payment_method;
      fine.transaction_reference = paymentData.transaction_reference;
      fine.amount_paid = paymentData.amount_paid;
      
      if (paymentData.amount_paid > fine.amount) {
        fine.change_amount = paymentData.amount_paid - fine.amount;
      }

      await fine.save({ transaction });

      // Update member's fine totals
      await fine.member.increment('total_fines_paid', {
        by: fine.amount,
        transaction
      });

      await fine.member.decrement('total_fines_owed', {
        by: fine.amount,
        transaction
      });

      // Check if member should be reactivated (if suspended due to fines)
      if (fine.member.status === 'suspended') {
        const unpaidFines = await Fine.sum('amount', {
          where: {
            member_id: fine.member.id,
            status: 'pending'
          },
          transaction
        });

        if (unpaidFines === 0) {
          await fine.member.update({ 
            status: 'active',
            suspension_reason: null
          }, { transaction });
        }
      }

      await transaction.commit();

      return {
        fine,
        message: 'Fine paid successfully',
        change: fine.change_amount || 0,
        member_status: fine.member.status
      };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('Failed to process fine payment', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get all fines with filtering
  async getAllFines(filters = {}, page = 1, limit = 20) {
    try {
      const whereClause = {};
      
      // Apply filters
      if (filters.member_id) whereClause.member_id = filters.member_id;
      if (filters.status) whereClause.status = filters.status;
      if (filters.reason) whereClause.reason = { [Op.iLike]: `%${filters.reason}%` };
      
      if (filters.start_date || filters.end_date) {
        whereClause.createdAt = {};
        if (filters.start_date) whereClause.createdAt[Op.gte] = filters.start_date;
        if (filters.end_date) whereClause.createdAt[Op.lte] = filters.end_date;
      }

      const offset = (page - 1) * limit;
      
      const { count, rows: fines } = await Fine.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Member,
            as: 'member',
            attributes: ['id', 'name', 'email', 'membership_number']
          },
          {
            model: Transaction,
            as: 'transaction',
            include: [{
              model: require('../models').Book,
              as: 'book',
              attributes: ['id', 'title', 'author']
            }]
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      // Calculate totals
      const totals = await Fine.findAll({
        where: whereClause,
        attributes: [
          [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'pending' THEN amount ELSE 0 END")), 'total_pending'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'paid' THEN amount ELSE 0 END")), 'total_paid']
        ],
        raw: true
      });

      return {
        fines,
        totals: totals[0] || {
          total_amount: 0,
          total_pending: 0,
          total_paid: 0
        },
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      throw new BusinessError('Failed to fetch fines', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get fine by ID
  async getFineById(id) {
    try {
      const fine = await Fine.findByPk(id, {
        include: [
          {
            model: Member,
            as: 'member',
            attributes: ['id', 'name', 'email', 'membership_number', 'status']
          },
          {
            model: Transaction,
            as: 'transaction',
            include: [{
              model: require('../models').Book,
              as: 'book',
              attributes: ['id', 'title', 'author', 'isbn']
            }]
          }
        ]
      });

      if (!fine) {
        throw new BusinessError('Fine not found', HTTP_STATUS.NOT_FOUND, 'FINE_NOT_FOUND');
      }

      // Check if fine is overdue
      const fineObj = fine.toJSON();
      if (fineObj.status === 'pending' && fineObj.due_date) {
        const now = new Date();
        const dueDate = new Date(fineObj.due_date);
        
        if (now > dueDate) {
          fineObj.is_overdue = true;
          const diffDays = DateUtils.calculateOverdueDays(dueDate, now);
          fineObj.overdue_by_days = diffDays;
          // Could apply late payment penalty here
        }
      }

      return fineObj;
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('Failed to fetch fine', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get member's fines
  async getMemberFines(memberId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const { count, rows: fines } = await Fine.findAndCountAll({
        where: { member_id: memberId },
        include: [
          {
            model: Transaction,
            as: 'transaction',
            include: [{
              model: require('../models').Book,
              as: 'book',
              attributes: ['id', 'title', 'author']
            }]
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['status', 'ASC'], ['due_date', 'ASC']]
      });

      // Calculate summary
      const summary = await Fine.findAll({
        where: { member_id: memberId },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('amount')), 'total_owed'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'pending' THEN amount ELSE 0 END")), 'total_pending'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'paid' THEN amount ELSE 0 END")), 'total_paid'],
          [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'pending' THEN 1 END")), 'pending_count']
        ],
        raw: true
      });

      return {
        fines,
        summary: summary[0] || {
          total_owed: 0,
          total_pending: 0,
          total_paid: 0,
          pending_count: 0
        },
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      throw new BusinessError('Failed to fetch member fines', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Waive a fine (admin function)
  async waiveFine(fineId, reason = '') {
    const transaction = await sequelize.transaction();
    
    try {
      const fine = await Fine.findByPk(fineId, {
        include: [{ model: Member, as: 'member' }],
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!fine) {
        throw new BusinessError('Fine not found', HTTP_STATUS.NOT_FOUND, 'FINE_NOT_FOUND');
      }

      if (fine.status === 'paid') {
        throw new BusinessError('Cannot waive a paid fine', HTTP_STATUS.CONFLICT, 'FINE_ALREADY_PAID');
      }

      if (fine.status === 'cancelled') {
        throw new BusinessError('Fine already cancelled', HTTP_STATUS.CONFLICT, 'FINE_ALREADY_CANCELLED');
      }

      // Update fine
      fine.status = 'cancelled';
      fine.cancelled_at = DateUtils.getCurrentDate();
      fine.cancellation_reason = reason;
      await fine.save({ transaction });

      // Update member's fine totals
      await fine.member.decrement('total_fines_owed', {
        by: fine.amount,
        transaction
      });

      await transaction.commit();

      return {
        fine,
        message: 'Fine waived successfully',
        amount_waived: fine.amount
      };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('Failed to waive fine', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Generate fine report
  async generateFineReport(startDate, endDate) {
    try {
      const whereClause = {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      };

      const fines = await Fine.findAll({
        where: whereClause,
        include: [
          {
            model: Member,
            as: 'member',
            attributes: ['id', 'name', 'email', 'membership_number']
          },
          {
            model: Transaction,
            as: 'transaction',
            include: [{
              model: require('../models').Book,
              as: 'book',
              attributes: ['id', 'title', 'author']
            }]
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      // Calculate detailed statistics
      const statistics = await Fine.findAll({
        where: whereClause,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_fines'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'pending' THEN amount ELSE 0 END")), 'pending_amount'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'paid' THEN amount ELSE 0 END")), 'paid_amount'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'cancelled' THEN amount ELSE 0 END")), 'cancelled_amount'],
          [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'pending' THEN 1 END")), 'pending_count'],
          [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'paid' THEN 1 END")), 'paid_count'],
          [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'cancelled' THEN 1 END")), 'cancelled_count']
        ],
        raw: true
      });

      // Group by member
      const memberStats = await Fine.findAll({
        where: whereClause,
        attributes: [
          'member_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'fine_count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'pending' THEN amount ELSE 0 END")), 'pending_amount']
        ],
        group: ['member_id'],
        include: [{
          model: Member,
          as: 'member',
          attributes: ['name', 'email']
        }],
        raw: true,
        nest: true
      });

      return {
        report_period: {
          start_date: startDate,
          end_date: endDate
        },
        fines: fines,
        summary: statistics[0] || {},
        by_member: memberStats,
        generated_at: DateUtils.getCurrentDate()
      };
    } catch (error) {
      throw new BusinessError('Failed to generate fine report', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Calculate overdue fines for all transactions (cron job)
  async calculateOverdueFines() {
    const transaction = await sequelize.transaction();
    
    try {
      const { Transaction } = require('../models');
      const now = DateUtils.getCurrentDate();

      // Find all overdue transactions without fines
      const overdueTransactions = await Transaction.findAll({
        where: {
          status: 'overdue',
          returned_at: null
        },
        include: [{
          model: require('../models').Fine,
          as: 'fine',
          required: false
        }],
        transaction
      });

      const createdFines = [];

      for (const trans of overdueTransactions) {
        // Check if fine already exists
        if (trans.fine) continue;

        const overdueDays = DateUtils.calculateOverdueDays(trans.due_date, now);
        const fineAmount = DateUtils.calculateFine(overdueDays, 0.5);

        if (fineAmount > 0) {
          const fine = await Fine.create({
            member_id: trans.member_id,
            transaction_id: trans.id,
            amount: fineAmount,
            reason: `Daily overdue fine for ${overdueDays} day(s)`,
            status: 'pending',
            due_date: DateUtils.calculateDueDate(now, 30)
          }, { transaction });

          // Update member
          await require('../models').Member.increment('total_fines_owed', {
            by: fineAmount,
            where: { id: trans.member_id },
            transaction
          });

          createdFines.push(fine);
        }
      }

      await transaction.commit();

      return {
        message: 'Overdue fines calculated',
        fines_created: createdFines.length,
        fines: createdFines
      };
    } catch (error) {
      await transaction.rollback();
      throw new BusinessError('Failed to calculate overdue fines', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new FineService();