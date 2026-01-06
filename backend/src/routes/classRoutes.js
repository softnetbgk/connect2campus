const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', classController.getAllClasses);
router.get('/:classId/sections', classController.getSections);
router.get('/:classId/subjects', classController.getSubjects);
router.get('/:classId/sections/:sectionId/subjects', classController.getSubjects);

module.exports = router;
