
const fineService = require('../services/fineService');
const { HTTP_STATUS } = require('../utils/constants');

class FineController {
  // Get all fines
  async getAllFines(req, res) {
    try {
      const result = await fineService.getAllFines();
      if (!result.success) {
        return res
          .status(HTTP_STATUS.INTERNAL_ERROR)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        fines: result.fines,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get fine by ID
  async getFineById(req, res) {
    try {
      const result = await fineService.getFineById(req.params.id);
      if (!result.success) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        fine: result.fine,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Mark fine as paid
  async markFinePaid(req, res) {
    try {
      const result = await fineService.markFinePaid(req.params.id);
      if (!result.success) {
        return res
          .status(HTTP_STATUS.CONFLICT)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Fine marked as paid',
        fine: result.fine,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new FineController();