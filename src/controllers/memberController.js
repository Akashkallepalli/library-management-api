const memberService = require('../services/memberService');
const { HTTP_STATUS } = require('../utils/constants');

class MemberController {
  // Create a new member
  async createMember(req, res, next) {
    try {
      const member = await memberService.createMember(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: member
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all members
  async getAllMembers(req, res, next) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      const result = await memberService.getAllMembers(filters, page, limit);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get member by ID
  async getMemberById(req, res, next) {
    try {
      const member = await memberService.getMemberById(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: member
      });
    } catch (error) {
      next(error);
    }
  }

  // Get borrowed books by member
  async getBorrowedBooks(req, res, next) {
    try {
      const result = await memberService.getBorrowedBooks(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Update member
  async updateMember(req, res, next) {
    try {
      const member = await memberService.updateMember(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: member
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete member
  async deleteMember(req, res, next) {
    try {
      const result = await memberService.deleteMember(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Update member status
  async updateMemberStatus(req, res, next) {
    try {
      const { status, reason } = req.body;
      if (!status) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Status is required'
        });
      }

      const member = await memberService.updateMemberStatus(req.params.id, status, reason);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: member,
        message: `Member status updated to ${status}`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MemberController();