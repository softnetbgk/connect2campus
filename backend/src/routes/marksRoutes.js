const express = require('express');
const router = express.Router();
const marksController = require('../controllers/marksController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// Exam Types
router.get('/exam-types', marksController.getExamTypes);
router.post('/exam-types', marksController.createExamType);
router.put('/exam-types/:id', marksController.updateExamType);
router.delete('/exam-types/:id', marksController.deleteExamType);

// Marks Management
router.get('/my-marks', marksController.getMyMarks);
router.get('/', marksController.getMarks);
router.post('/save', marksController.saveMarks);

// Marksheets
router.get('/marksheet/years', marksController.getStudentResultYears);
router.get('/marksheet/student', marksController.getStudentMarksheet);
router.get('/marksheet/all', marksController.getAllMarksheets);

// Toppers List
router.get('/toppers', marksController.getToppers);
router.get('/student-all', marksController.getStudentAllMarks);

module.exports = router;

