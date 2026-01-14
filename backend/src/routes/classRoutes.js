const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// Class Routes
router.get('/', classController.getAllClasses);
router.post('/', classController.createClass);
router.put('/:id', classController.updateClass);
router.delete('/:id', classController.deleteClass);

// Section Routes
router.get('/:classId/sections', classController.getSections);
router.post('/:classId/sections', classController.createSection);
router.delete('/:classId/sections/:sectionId', classController.deleteSection);

// Subject Routes (Read-only here, usually managed via Subject routes if they exist)
router.get('/:classId/subjects', classController.getSubjects);
// Alias for consistency with some frontend calls that might try to get by section (though subjects are by class)
router.get('/:classId/sections/:sectionId/subjects', classController.getSubjects);

module.exports = router;
