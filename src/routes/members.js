const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { validate, schemas } = require('../middleware/validation');

// Public routes
router.get('/', memberController.getAllMembers);
router.get('/:id', memberController.getMemberById);
router.get('/:id/borrowed', memberController.getBorrowedBooks);

// Protected routes
router.post('/', validate(schemas.createMember), memberController.createMember);
router.put('/:id', validate(schemas.updateMember), memberController.updateMember);
router.delete('/:id', memberController.deleteMember);
router.patch('/:id/status', memberController.updateMemberStatus);

module.exports = router;