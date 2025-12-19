const express = require('express');
const router = express.Router();
const memberService = require('../services/memberService');

// POST /members - Create a new member
router.post('/', memberService.createMember);

// GET /members - Get all members
router.get('/', memberService.getAllMembers);

// GET /members/:id - Get a single member
router.get('/:id', memberService.getMemberById);

// GET /members/:id/borrowed - Get books borrowed by member
router.get('/:id/borrowed', memberService.getMemberBorrowedBooks);

// PUT /members/:id - Update a member
router.put('/:id', memberService.updateMember);

// DELETE /members/:id - Delete a member
router.delete('/:id', memberService.deleteMember);

module.exports = router;

