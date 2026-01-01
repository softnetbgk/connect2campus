const express = require('express');
const router = express.Router();
const { generateQuestions } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// Route: POST /api/ai/generate-questions
// Protected because it costs money/quota
router.post('/generate-questions', protect, generateQuestions);

module.exports = router;
