const fineService = require('../services/fineService');
const { HTTP_STATUS } = require('../utils/constants');

class FineController {
  // Pay a fine
  async payFine(req, res, next) {
    try {
      const result = await fineService.payFine(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all fines
  async getAllFines(req, res, next) {
    try {
      const { page = 1, limit = 20, ...filters } = req.query;
      const result = await fineService.getAllFines(filters, page, limit);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get fine by ID
  async getFineById(req, res, next) {
    try {
      const fine = await fineService.getFineById(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: fine
      });
    } catch (error) {
      next(error);
    }
  }

  // Get member fines
  async getMemberFines(req, res, next) {
    try {
      const { member_id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const result = await fineService.getMemberFines(member_id, page, limit);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Waive a fine
  async waiveFine(req, res, next) {
    try {
      const { reason } = req.body;
      const result = await fineService.waiveFine(req.params.id, reason);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Generate fine report
  async generateFineReport(req, res, next) {
    try {
      const { start_date, end_date } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const result = await fineService.generateFineReport(start_date, end_date);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Calculate overdue fines (admin endpoint)
  async calculateOverdueFines(req, res, next) {
    try {
      const result = await fineService.calculateOverdueFines();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FineController();