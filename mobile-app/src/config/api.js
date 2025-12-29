// API Configuration with Environment Support
// 
// USAGE:
// - For LOCAL testing: Set USE_LOCAL_SERVER = true (line 8)
// - For PRODUCTION: Set USE_LOCAL_SERVER = false (line 8)
// - Then rebuild ONCE and it will work for that environment

const USE_LOCAL_SERVER = true; // ← Change this to switch environments

const LOCAL_IP = '172.23.101.71'; // Your computer's local IP
const PRODUCTION_URL = 'https://school-software-backend-z86u.onrender.com';

export const API_CONFIG = {
    BASE_URL: USE_LOCAL_SERVER
        ? `http://${LOCAL_IP}:5000/api`
        : `${PRODUCTION_URL}/api`,
    TIMEOUT: 30000,
    ENVIRONMENT: USE_LOCAL_SERVER ? 'LOCAL' : 'PRODUCTION',
};

// Log current environment on app start (helps with debugging)
console.log(`📡 API Environment: ${API_CONFIG.ENVIRONMENT}`);
console.log(`🌐 API Base URL: ${API_CONFIG.BASE_URL}`);

export const ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    VERIFY_TOKEN: '/auth/verify',

    // Students
    STUDENT_PROFILE: '/students/profile',
    STUDENT_ATTENDANCE: '/students/my-attendance',
    STUDENT_FEES: '/students/my-fees',
    STUDENT_MARKS: '/marks/my-marks',
    STUDENT_TIMETABLE: '/timetable/my-schedule',
    STUDENT_LIBRARY: '/library/my-books',
    STUDENT_TRANSPORT: '/transport/my-route',
    STUDENT_HOSTEL: '/hostel/my-details',
    STUDENT_CERTIFICATES: '/certificates/my-certificates',
    STUDENT_LEAVES: '/leaves/my-leaves',
    STUDENT_DOUBTS: '/doubts',
    STUDENT_CALENDAR: '/calendar/events',

    // Teachers
    TEACHER_PROFILE: '/teachers/profile',
    TEACHER_ATTENDANCE: '/teachers/my-attendance',
    TEACHER_SALARY: '/salary/my-salary',
    TEACHER_TIMETABLE: '/timetable/my-schedule',
    TEACHER_STUDENTS: '/teachers/my-students',
    TEACHER_LEAVES: '/leaves/my-leaves',
    TEACHER_DOUBTS: '/doubts/teacher-doubts',
    TEACHER_DAILY_STATUS: '/teachers/daily-status',
    TEACHER_LIBRARY: '/library/teacher-books',

    // Staff
    STAFF_PROFILE: '/staff/profile',
    STAFF_ATTENDANCE: '/staff/my-attendance',
    STAFF_SALARY: '/salary/my-salary',
    STAFF_LEAVES: '/staff/my-leaves',
    STAFF_DAILY_STATUS: '/staff/daily-status',
};
