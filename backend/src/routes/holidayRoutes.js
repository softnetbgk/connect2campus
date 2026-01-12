const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holidayController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Get all holidays
router.get('/', holidayController.getHolidays);

// Add a new holiday
router.post('/', holidayController.addHoliday);

// Update a holiday
router.put('/:id', holidayController.updateHoliday);

// Delete a holiday
router.delete('/:id', holidayController.deleteHoliday);

// Auto-mark holidays and Sundays for a month
router.post('/auto-mark', holidayController.autoMarkHolidays);

// Sync holidays from school calendar
router.post('/sync-from-calendar', holidayController.syncFromCalendar);

// Broadcast Holiday to ALL Schools (Super Admin)
router.post('/broadcast', holidayController.broadcastOfficialHoliday);
router.post('/broadcast-bulk', holidayController.broadcastBulkHolidays); // Bulk Broadcast Official Holidays
router.get('/fix-schema', holidayController.fixSchema); // Fix Schema Route
router.get('/school/:schoolId', holidayController.getSchoolHolidaysAdmin); // Fetch holidays for specific school

// Sync Holidays from One School to All Active Schools (Super Admin)
router.post('/sync-all', holidayController.syncHolidaysFromSchool);

// Test endpoint for debugging
const testController = require('../controllers/testController');
router.post('/test-auto-mark', testController.testAutoMark);

module.exports = router;
