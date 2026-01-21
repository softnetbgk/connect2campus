const express = require('express');
const router = express.Router();
const { login, logout, forgotPassword, getUserDetails, verifyOTP, resetPassword, registerFcmToken, changePassword } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.post('/forgot-password', forgotPassword);
router.post('/get-user-details', getUserDetails);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticateToken, changePassword);
router.post('/register-fcm', authenticateToken, registerFcmToken);
router.post('/setup-admin', require('../controllers/authController').setupSuperAdmin);

module.exports = router;
