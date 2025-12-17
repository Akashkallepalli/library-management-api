const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { validateRequest, memberSchema } = require('../middleware/validation');

// CRUD operations
router.post('/', validateRequest(memberSchema), memberController.createMember);
router.get('/', memberController.getAllMembers);
router.get('/:id', memberController.getMemberById);
router.put('/:id', memberController.updateMember);
router.delete('/:id', memberController.deleteMember);

// Get borrowed books by member
router.get('/:id/borrowed', memberController.getBorrowedBooks);

module.exports = router;