const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// Events
router.get('/events', calendarController.getEvents);
router.post('/events', authorize('SCHOOL_ADMIN'), calendarController.addEvent);
router.delete('/events/:id', authorize('SCHOOL_ADMIN'), calendarController.deleteEvent);

// Announcements
router.get('/announcements', calendarController.getAnnouncements);
router.get('/announcements/options', calendarController.getAnnouncementOptions);
router.get('/announcements/count', authorize('SCHOOL_ADMIN'), calendarController.getAudienceCount);
router.post('/announcements', authorize('SCHOOL_ADMIN'), calendarController.addAnnouncement);
router.delete('/announcements/:id', authorize('SCHOOL_ADMIN'), calendarController.deleteAnnouncement);

module.exports = router;
