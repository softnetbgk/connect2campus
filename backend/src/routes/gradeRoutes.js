const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', gradeController.getGrades);
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), gradeController.saveGrades);

module.exports = router;
