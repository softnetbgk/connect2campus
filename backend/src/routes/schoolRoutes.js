const express = require('express');
const router = express.Router();
const { createSchool, getSchools, getSchoolDetails, updateSchool, getMySchool, toggleSchoolStatus } = require('../controllers/schoolController');
const { authenticateToken, requireSuperAdmin, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

// School Admin Routes
router.get('/my-school', authorize('SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'STAFF', 'DRIVER', 'TRANSPORT_MANAGER'), getMySchool);

// Super Admin Routes (Protected)
router.post('/', requireSuperAdmin, createSchool);
router.get('/', requireSuperAdmin, getSchools);
router.get('/:id', requireSuperAdmin, getSchoolDetails);
router.put('/:id', requireSuperAdmin, updateSchool);
router.put('/:id/status', requireSuperAdmin, toggleSchoolStatus);

module.exports = router;
