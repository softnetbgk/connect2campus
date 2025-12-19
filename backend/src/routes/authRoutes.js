const express = require('express');
const router = express.Router();
const { login, logout, forgotPassword, resetPassword } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/setup-admin', require('../controllers/authController').setupSuperAdmin);

module.exports = router;
