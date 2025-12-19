const memberService = require('../services/memberService');
const { HTTP_STATUS } = require('../utils/constants');

class MemberController {
  // Create member
  async createMember(req, res) {
    try {
      const result = await memberService.createMember(req.body);
      if (!result.success) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Member created successfully',
        member: result.member,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get all members
  async getAllMembers(req, res) {
    try {
      const result = await memberService.getAllMembers();
      if (!result.success) {
        return res
          .status(HTTP_STATUS.INTERNAL_ERROR)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        members: result.members,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get member by ID
  async getMemberById(req, res) {
    try {
      const result = await memberService.getMemberById(req.params.id);
      if (!result.success) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        member: result.member,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Update member
  async updateMember(req, res) {
    try {
      const result = await memberService.updateMember(req.params.id, req.body);
      if (!result.success) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Member updated successfully',
        member: result.member,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Delete member
  async deleteMember(req, res) {
    try {
      const result = await memberService.deleteMember(req.params.id);
      if (!result.success) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get borrowed books
  async getBorrowedBooks(req, res) {
    try {
      const result = await memberService.getBorrowedBooks(req.params.id);
      if (!result.success) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        transactions: result.transactions,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new MemberController();