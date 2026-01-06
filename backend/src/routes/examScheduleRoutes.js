const express = require('express');
const router = express.Router();
const examScheduleController = require('../controllers/examScheduleController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', examScheduleController.getExamSchedule);
router.post('/save', examScheduleController.saveExamSchedule);
router.put('/:id', examScheduleController.updateExamScheduleItem);

module.exports = router;
