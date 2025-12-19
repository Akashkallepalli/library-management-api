const Fine = require('../models/Fine');
const Member = require('../models/Member');
const { MEMBER_STATUS } = require('../utils/constants');
const memberService = require('./memberService');

class FineService {
  // Create fine
  async createFine(memberId, transactionId, amount) {
    try {
      const fine = await Fine.create({
        member_id: memberId,
        transaction_id: transactionId,
        amount: amount,
        paid_at: null,
      });

      // Check if member should be suspended
      await this.checkAndUpdateMemberSuspensionStatus(memberId);

      return { success: true, fine };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all fines
  async getAllFines() {
    try {
      const fines = await Fine.findAll();
      return { success: true, fines };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get fine by ID
  async getFineById(fineId) {
    try {
      const fine = await Fine.findByPk(fineId);
      if (!fine) {
        return { success: false, error: 'Fine not found' };
      }
      return { success: true, fine };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get member unpaid fines
  async getMemberUnpaidFines(memberId) {
    try {
      const fines = await Fine.findAll({
        where: {
          member_id: memberId,
          paid_at: null,
        },
      });
      return { success: true, fines };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Mark fine as paid
  async markFinePaid(fineId) {
    try {
      const fine = await Fine.findByPk(fineId);
      if (!fine) {
        return { success: false, error: 'Fine not found' };
      }

      if (fine.paid_at) {
        return { success: false, error: 'Fine already paid' };
      }

      fine.paid_at = new Date();
      await fine.save();

      // Check if member can be reactivated
      await this.checkAndUpdateMemberSuspensionStatus(fine.member_id);

      return { success: true, fine };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Check and update member suspension status
  async checkAndUpdateMemberSuspensionStatus(memberId) {
    try {
      // Get count of overdue books
      const Transaction = require('../models/Transaction');
      const { TRANSACTION_STATUS } = require('../utils/constants');
      const moment = require('moment');

      const transactions = await Transaction.findAll({
        where: {
          member_id: memberId,
          status: TRANSACTION_STATUS.ACTIVE,
        },
      });

      let overdueCount = 0;
      for (const transaction of transactions) {
        if (moment().isAfter(moment(transaction.due_date))) {
          overdueCount++;
        }
      }

      const member = await Member.findByPk(memberId);
      if (!member) return;

      // Suspend if 3 or more overdue
      if (overdueCount >= 3 && member.status !== MEMBER_STATUS.SUSPENDED) {
        await memberService.suspendMember(memberId);
      }

      // Check if can be reactivated
      if (overdueCount < 3 && member.status === MEMBER_STATUS.SUSPENDED) {
        const unpaidFines = await this.getMemberUnpaidFines(memberId);
        if (unpaidFines.success && unpaidFines.fines.length === 0) {
          await memberService.activateMember(memberId);
        }
      }
    } catch (error) {
      console.error('Error updating member suspension status:', error.message);
    }
  }
}

module.exports = new FineService();