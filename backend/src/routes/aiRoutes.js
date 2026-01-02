const express = require('express');
const router = express.Router();
const { generateQuestions } = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/authMiddleware');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Route: POST /api/ai/generate-questions
// Protected because it costs money/quota
// Use upload.array('files') to accept up to 5 images
router.post('/generate-questions', authenticateToken, upload.array('files', 5), generateQuestions);

module.exports = router;
