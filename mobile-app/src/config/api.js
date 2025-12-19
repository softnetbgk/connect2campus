// API Configuration
export const API_CONFIG = {
    // For Android Emulator: use 10.0.2.2
    // For iOS Simulator: use localhost
    // For Physical Device: use your computer's IP address (e.g., 192.168.x.x)
    BASE_URL: 'http://10.60.101.164:5000/api',
    TIMEOUT: 30000,
};

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
    STUDENT_DOUBTS: '/doubts/my-doubts',
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
