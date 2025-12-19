const { Member, Transaction, Fine, Book } = require('../models');
const { BusinessError } = require('../middleware/errorHandler');
const { MEMBER_STATUS, HTTP_STATUS, BUSINESS_RULES } = require('../utils/constants');
const { memberStateMachine } = require('../utils/stateMachine');

class MemberService {
  // Create a new member
  async createMember(memberData) {
    try {
      // Check if email already exists
      const existingEmail = await Member.findOne({ where: { email: memberData.email } });
      if (existingEmail) {
        throw new BusinessError('Email already exists', HTTP_STATUS.CONFLICT, 'DUPLICATE_EMAIL');
      }

      // Check if membership number already exists
      const existingMembership = await Member.findOne({ 
        where: { membership_number: memberData.membership_number } 
      });
      if (existingMembership) {
        throw new BusinessError(
          'Membership number already exists', 
          HTTP_STATUS.CONFLICT, 
          'DUPLICATE_MEMBERSHIP_NUMBER'
        );
      }

      const member = await Member.create(memberData);
      return member;
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('Failed to create member', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get all members with filtering and pagination
  async getAllMembers(filters = {}, page = 1, limit = 10) {
    try {
      const whereClause = {};
      
      // Apply filters
      if (filters.name) whereClause.name = { [Op.iLike]: `%${filters.name}%` };
      if (filters.email) whereClause.email = { [Op.iLike]: `%${filters.email}%` };
      if (filters.status) whereClause.status = filters.status;
      if (filters.membership_number) whereClause.membership_number = filters.membership_number;

      const offset = (page - 1) * limit;
      
      const { count, rows: members } = await Member.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Fine,
            as: 'fines',
            where: { status: 'pending' },
            required: false
          }
        ]
      });

      // Calculate total unpaid fines for each member
      const membersWithFines = members.map(member => {
        const memberObj = member.toJSON();
        memberObj.total_unpaid_fines = member.fines
          ? member.fines.reduce((sum, fine) => sum + parseFloat(fine.amount), 0)
          : 0;
        return memberObj;
      });

      return {
        members: membersWithFines,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      throw new BusinessError('Failed to fetch members', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get member by ID
  async getMemberById(id) {
    try {
      const member = await Member.findByPk(id, {
        include: [
          {
            model: Transaction,
            as: 'transactions',
            include: [{ model: Book, as: 'book' }],
            where: { status: 'active' },
            required: false,
            limit: 10
          },
          {
            model: Fine,
            as: 'fines',
            where: { status: 'pending' },
            required: false
          }
        ]
      });

      if (!member) {
        throw new BusinessError('Member not found', HTTP_STATUS.NOT_FOUND, 'MEMBER_NOT_FOUND');
      }

      const memberObj = member.toJSON();
      memberObj.current_borrow_count = member.transactions ? member.transactions.length : 0;
      memberObj.total_unpaid_fines = member.fines
        ? member.fines.reduce((sum, fine) => sum + parseFloat(fine.amount), 0)
        : 0;

      return memberObj;
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('Failed to fetch member', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get books borrowed by member
  async getBorrowedBooks(memberId) {
    try {
      const member = await this.getMemberById(memberId);
      
      const transactions = await Transaction.findAll({
        where: {
          member_id: memberId,
          status: 'active'
        },
        include: [
          {
            model: Book,
            as: 'book',
            attributes: ['id', 'title', 'author', 'isbn', 'category']
          }
        ],
        order: [['due_date', 'ASC']]
      });

      // Calculate overdue status for each transaction
      const borrowedBooks = transactions.map(transaction => {
        const book = transaction.toJSON();
        const now = new Date();
        const dueDate = new Date(transaction.due_date);
        
        book.is_overdue = now > dueDate;
        if (book.is_overdue) {
          const diffTime = Math.abs(now - dueDate);
          book.overdue_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          book.potential_fine = book.overdue_days * BUSINESS_RULES.OVERDUE_FINE_RATE;
        }
        
        return book;
      });

      return {
        member: {
          id: member.id,
          name: member.name,
          email: member.email,
          membership_number: member.membership_number
        },
        borrowed_books: borrowedBooks,
        total_borrowed: borrowedBooks.length
      };
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('Failed to fetch borrowed books', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Update member
  async updateMember(id, updateData) {
    try {
      const member = await this.getMemberById(id);
      
      // Validate state transition if status is being updated
      if (updateData.status && updateData.status !== member.status) {
        if (!memberStateMachine.canTransition(member.status, updateData.status)) {
          throw new BusinessError(
            `Invalid status transition from ${member.status} to ${updateData.status}`,
            HTTP_STATUS.CONFLICT,
            'INVALID_STATUS_TRANSITION'
          );
        }
      }

      // Check if email is being changed to an existing email
      if (updateData.email && updateData.email !== member.email) {
        const existingEmail = await Member.findOne({ 
          where: { email: updateData.email, id: { [Op.ne]: id } } 
        });
        if (existingEmail) {
          throw new BusinessError('Email already exists', HTTP_STATUS.CONFLICT, 'DUPLICATE_EMAIL');
        }
      }

      await member.update(updateData);
      return member;
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('Failed to update member', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Delete member
  async deleteMember(id) {
    try {
      const member = await this.getMemberById(id);
      
      // Check if member has active transactions
      const activeTransactions = await Transaction.count({
        where: {
          member_id: id,
          status: 'active'
        }
      });

      if (activeTransactions > 0) {
        throw new BusinessError(
          'Cannot delete member with active transactions',
          HTTP_STATUS.CONFLICT,
          'MEMBER_HAS_ACTIVE_TRANSACTIONS'
        );
      }

      // Check if member has unpaid fines
      const unpaidFines = await Fine.count({
        where: {
          member_id: id,
          status: 'pending'
        }
      });

      if (unpaidFines > 0) {
        throw new BusinessError(
          'Cannot delete member with unpaid fines',
          HTTP_STATUS.CONFLICT,
          'MEMBER_HAS_UNPAID_FINES'
        );
      }

      await member.destroy();
      return { success: true, message: 'Member deleted successfully' };
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('Failed to delete member', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Validate member can borrow books
  async canBorrowBooks(memberId) {
    try {
      const member = await this.getMemberById(id);
      
      // Check if member is active
      if (member.status !== MEMBER_STATUS.ACTIVE) {
        throw new BusinessError(
          `Member is ${member.status} and cannot borrow books`,
          HTTP_STATUS.FORBIDDEN,
          'MEMBER_NOT_ACTIVE'
        );
      }

      // Check borrowing limit
      const activeBorrows = await Transaction.count({
        where: {
          member_id: memberId,
          status: 'active'
        }
      });

      if (activeBorrows >= member.max_borrow_limit) {
        throw new BusinessError(
          `Borrowing limit reached. Maximum ${member.max_borrow_limit} books allowed`,
          HTTP_STATUS.FORBIDDEN,
          'BORROW_LIMIT_REACHED'
        );
      }

      // Check for unpaid fines
      const unpaidFines = await Fine.sum('amount', {
        where: {
          member_id: memberId,
          status: 'pending'
        }
      });

      if (unpaidFines > 0) {
        throw new BusinessError(
          `Member has unpaid fines of $${unpaidFines}. Cannot borrow books.`,
          HTTP_STATUS.FORBIDDEN,
          'UNPAID_FINES'
        );
      }

      // Check if member has 3 or more overdue books (should be suspended)
      const overdueBooks = await Transaction.count({
        where: {
          member_id: memberId,
          status: 'overdue'
        }
      });

      if (overdueBooks >= BUSINESS_RULES.SUSPENSION_THRESHOLD) {
        // Auto-suspend member
        await member.update({ status: MEMBER_STATUS.SUSPENDED });
        throw new BusinessError(
          'Member has 3 or more overdue books and has been suspended',
          HTTP_STATUS.FORBIDDEN,
          'AUTO_SUSPENDED'
        );
      }

      return true;
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('Failed to validate member', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Update member status
  async updateMemberStatus(id, newStatus, reason = '') {
    try {
      const member = await this.getMemberById(id);
      
      if (!memberStateMachine.canTransition(member.status, newStatus)) {
        throw new BusinessError(
          `Invalid status transition from ${member.status} to ${newStatus}`,
          HTTP_STATUS.CONFLICT,
          'INVALID_STATUS_TRANSITION'
        );
      }

      await member.update({ 
        status: newStatus,
        ...(reason && { suspension_reason: reason })
      });
      
      return member;
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('Failed to update member status', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new MemberService();