const express = require('express');
const router = express.Router();
const academicYearController = require('../controllers/academicYearController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Get all academic years
router.get('/', academicYearController.getAcademicYears);

// Get current active academic year
router.get('/current', academicYearController.getCurrentAcademicYear);

// Get specific academic year
router.get('/:id', academicYearController.getAcademicYear);

// Get academic year statistics
router.get('/:id/stats', academicYearController.getAcademicYearStats);

// Create new academic year
router.post('/', academicYearController.createAcademicYear);

// Update academic year
router.put('/:id', academicYearController.updateAcademicYear);

// Mark academic year as completed
router.post('/:id/complete', academicYearController.completeAcademicYear);

// Delete academic year
router.delete('/:id', academicYearController.deleteAcademicYear);

module.exports = router;
