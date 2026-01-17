const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const schoolRoutes = require('./routes/schoolRoutes');

const app = express();

// Trust Proxy (Required for Rate Limiting behind Render/Vercel Load Balancers)
app.set('trust proxy', 1);

// Middleware
app.use(compression()); // Gzip compression (Faster Response)

// Configure Helmet with relaxed CSP for production
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP to allow cross-origin requests
    crossOriginEmbedderPolicy: false,
}));

// Configure CORS to allow all origins (for development and production)
app.use(cors({
    origin: true, // Allow ALL origins (Fix for Mobile App)
    credentials: true, // Allow credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Debug Middleware: Log Origin and Headers for troubleshooting
app.use((req, res, next) => {
    console.log(`📡 Request: ${req.method} ${req.url}`);
    console.log(`   Origin: ${req.headers.origin || 'No Origin'}`);
    next();
});

app.use(morgan('dev')); // Logger
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies (Increased for Base64 Images)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public'))); // Serve static files (APKs, etc.)

// Rate Limiter (Prevent Crashing from DoS/Spam)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased limit to prevent false positives
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Routes (Handle both /api prefix and root for Firebase compatibility)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/schools', '/schools'], schoolRoutes);
app.use(['/api/classes', '/classes'], require('./routes/classRoutes'));
app.use(['/api/students', '/students'], require('./routes/studentRoutes'));
app.use(['/api/teachers', '/teachers'], require('./routes/teacherRoutes'));
app.use(['/api/staff', '/staff'], require('./routes/staffRoutes'));
app.use(['/api/fees', '/fees'], require('./routes/feeRoutes'));
app.use('/api/library', require('./routes/libraryRoutes'));
app.use('/api/salary', require('./routes/salaryRoutes'));
app.use('/api/holidays', require('./routes/holidayRoutes'));
app.use('/api/timetable', require('./routes/timetableRoutes'));
app.use('/api/marks', require('./routes/marksRoutes'));
app.use('/api/exam-schedule', require('./routes/examScheduleRoutes'));
app.use('/api/hostel', require('./routes/hostelRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/calendar', require('./routes/calendarRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/transport', require('./routes/transportRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/admissions', require('./routes/admissionsRoutes'));
app.use('/api/biometric', require('./routes/biometricRoutes'));
app.use('/api/doubts', require('./routes/doubtRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/grades', require('./routes/gradeRoutes'));
app.use('/api/academic-years', require('./routes/academicYearRoutes'));

// --- ADMS / Biometric Device Default Routes ---
// Many devices (Secureye, ZKTeco) hardcode these paths if "Request URL" isn't configurable.
const { handleExternalDeviceLog } = require('./controllers/biometricController');
app.all('/iclock/cdata', handleExternalDeviceLog);      // Main Attendance Log URL
app.all('/iclock/getrequest', (req, res) => res.send('OK')); // Command checks
app.all('/iclock/devicecmd', (req, res) => res.send('OK'));  // Device commands
app.all('/iclock/options', (req, res) => res.send('OK'));    // Configuration checks

// --- Mobile App "Switchboard" Route ---
// The APK points here. We redirect it to wherever the frontend is currently hosted.
// If we change hosting, we just update this URL. No APK rebuild needed!
app.get('/app-launch', (req, res) => {
    res.redirect('https://connecttocampus-c98e4.web.app');
});

// Download App Route
app.get('/download-app', (req, res) => {
    const file = path.join(__dirname, '../public/app.apk');
    res.download(file, 'SchoolApp.apk', (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(404).send('App file not found on server.');
        }
    });
});

// Health Check (Handles both prefixed and non-prefixed roots)
app.get('/api', (req, res) => res.json({ message: 'School API is live (prefixed) 🚀' }));
app.get('/', (req, res) => res.json({ message: 'School API is live (root) 🚀' }));


// Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 Global Error Handler:', err);
    res.status(500).json({
        message: 'Something went wrong on the server',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = app;
