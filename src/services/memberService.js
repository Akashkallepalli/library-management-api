const Member = require('../models/Member');
const Transaction = require('../models/Transaction');
const { MEMBER_STATUS, TRANSACTION_STATUS } = require('../utils/constants');
const { v4: uuidv4 } = require('uuid');

class MemberService {
  // Create new member
  async createMember(memberData) {
    try {
      const member = await Member.create({
        name: memberData.name,
        email: memberData.email,
        membership_number: `MEM-${uuidv4().substring(0, 8).toUpperCase()}`,
        status: MEMBER_STATUS.ACTIVE,
      });
      return { success: true, member };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all members
  async getAllMembers() {
    try {
      const members = await Member.findAll();
      return { success: true, members };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get member by ID
  async getMemberById(memberId) {
    try {
      const member = await Member.findByPk(memberId);
      if (!member) {
        return { success: false, error: 'Member not found' };
      }
      return { success: true, member };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update member
  async updateMember(memberId, updateData) {
    try {
      const member = await Member.findByPk(memberId);
      if (!member) {
        return { success: false, error: 'Member not found' };
      }

      await member.update(updateData);
      return { success: true, member };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete member
  async deleteMember(memberId) {
    try {
      const member = await Member.findByPk(memberId);
      if (!member) {
        return { success: false, error: 'Member not found' };
      }

      await member.destroy();
      return { success: true, message: 'Member deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get borrowed books by member
  async getBorrowedBooks(memberId) {
    try {
      const transactions = await Transaction.findAll({
        where: {
          member_id: memberId,
          status: TRANSACTION_STATUS.ACTIVE,
        },
      });

      return { success: true, transactions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get current borrow count
  async getCurrentBorrowCount(memberId) {
    try {
      const count = await Transaction.count({
        where: {
          member_id: memberId,
          status: TRANSACTION_STATUS.ACTIVE,
        },
      });
      return { success: true, count };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Check if member is suspended
  async isMemberSuspended(memberId) {
    try {
      const member = await Member.findByPk(memberId);
      if (!member) {
        return { success: false, error: 'Member not found' };
      }
      return { success: true, isSuspended: member.status === MEMBER_STATUS.SUSPENDED };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Suspend member
  async suspendMember(memberId) {
    try {
      const member = await Member.findByPk(memberId);
      if (!member) {
        return { success: false, error: 'Member not found' };
      }

      await member.update({ status: MEMBER_STATUS.SUSPENDED });
      return { success: true, member };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Activate member
  async activateMember(memberId) {
    try {
      const member = await Member.findByPk(memberId);
      if (!member) {
        return { success: false, error: 'Member not found' };
      }

      await member.update({ status: MEMBER_STATUS.ACTIVE });
      return { success: true, member };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new MemberService();