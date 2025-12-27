import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Users, Calendar, BarChart3, LogOut, Check, ChevronRight, ChevronDown, User, DollarSign,
    LayoutDashboard, Settings, Bell, Search, Menu, Book, Home, Clock, Megaphone, Bus, UserPlus, Shield, ScanLine, X, IndianRupee
} from 'lucide-react';
import toast from 'react-hot-toast';

// Student Components
import Overview from '../components/dashboard/Overview';
import StudentManagement from '../components/dashboard/students/StudentManagement';
import StudentAttendanceMarking from '../components/dashboard/students/StudentAttendanceMarking';
import DailyAttendanceStatus from '../components/dashboard/students/DailyAttendanceStatus';
import StudentAttendanceReports from '../components/dashboard/students/StudentAttendanceReports';

// Teacher Components
import TeacherManagement from '../components/dashboard/teachers/TeacherManagement';
import TeacherAttendanceMarking from '../components/dashboard/teachers/TeacherAttendanceMarking';
import TeacherDailyStatus from '../components/dashboard/teachers/TeacherDailyStatus';
import TeacherAttendanceReports from '../components/dashboard/teachers/TeacherAttendanceReports';

// Staff Components
import StaffManagement from '../components/dashboard/staff/StaffManagement';
import StaffAttendanceMarking from '../components/dashboard/staff/StaffAttendanceMarking';
import StaffDailyStatus from '../components/dashboard/staff/StaffDailyStatus';
import StaffAttendanceReports from '../components/dashboard/staff/StaffAttendanceReports';

// Fee Components
import FeeConfiguration from '../components/dashboard/fees/FeeConfiguration';
import FeeCollection from '../components/dashboard/fees/FeeCollection';
import ExpenditureManagement from '../components/dashboard/finance/ExpenditureManagement';

// Library Components
import LibraryOverview from '../components/dashboard/library/LibraryOverview';
import BookManagement from '../components/dashboard/library/BookManagement';
import IssueReturn from '../components/dashboard/library/IssueReturn';

// Calendar Components
import SchoolCalendar from '../components/dashboard/calendar/SchoolCalendar';
import Announcements from '../components/dashboard/calendar/Announcements';

// Salary Components
import SalaryManagement from '../components/dashboard/salary/SalaryManagement';

// Leave Components
import LeaveManagement from '../components/dashboard/leaves/LeaveManagement';

// Academic Components
import TimetableManagement from '../components/dashboard/academics/TimetableManagement';
import MarksManagement from '../components/dashboard/academics/MarksManagement';
import ExamSchedule from '../components/dashboard/academics/ExamSchedule';
import QuestionPaperGenerator from '../components/dashboard/academics/question-paper/QuestionPaperGenerator';

// Hostel Components
import HostelOverview from '../components/dashboard/hostel/HostelOverview';
import RoomManagement from '../components/dashboard/hostel/RoomManagement';
import RoomAllocation from '../components/dashboard/hostel/RoomAllocation';
import HostelFinance from '../components/dashboard/hostel/HostelFinance';

// Certificate Component
import CertificateGenerator from '../components/dashboard/certificates/CertificateGenerator';
// Transport Component
import TransportManagement from '../components/dashboard/transport/TransportManagement';
// Admissions Component
import AdmissionCRM from '../components/dashboard/admissions/AdmissionCRM';
// Biometric Component
import BiometricManagement from '../components/dashboard/biometric/BiometricManagement';

const SchoolAdminDashboard = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [academicConfig, setAcademicConfig] = useState({ classes: [] });
    const [activeTab, setActiveTab] = useState('overview'); // Default to overview
    const [activeTabState, setActiveTabState] = useState(null); // Data passed between tabs
    const [pendingLeavesCount, setPendingLeavesCount] = useState(0);

    // Sidebar Expansion States
    const [expandedSections, setExpandedSections] = useState({
        students: false,
        teachers: false,
        staff: false,
        fees: false,
        library: false,
        salary: false,
        academics: false,
        hostel: false,
        calendar: false,
        admissions: false,
        biometric: false
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => {
            const isCurrentlyExpanded = prev[section];
            // If clicking an already expanded section, just close it
            if (isCurrentlyExpanded) {
                return { ...prev, [section]: false };
            }
            // Otherwise, close all sections and open only the clicked one
            const allClosed = Object.keys(prev).reduce((acc, key) => {
                acc[key] = false;
                return acc;
            }, {});
            return { ...allClosed, [section]: true };
        });
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
    };

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        fetchSchoolConfig();
        fetchPendingLeaves();

        // Poll for pending leaves every minute
        const interval = setInterval(fetchPendingLeaves, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchPendingLeaves = async () => {
        try {
            const res = await api.get('/leaves?status=Pending');
            setPendingLeavesCount(Array.isArray(res.data) ? res.data.length : 0);
        } catch (error) {
            console.error("Failed to fetch pending leaves count", error);
        }
    };

    const fetchSchoolConfig = async () => {
        try {
            const res = await api.get('/schools/my-school');
            setAcademicConfig(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load school configuration');
        }
    };

    const handleLogout = () => { logout(); navigate('/'); };

    return (
        <div className="relative min-h-screen w-full flex font-sans text-slate-900 overflow-hidden">
            {/* Global Background */}
            <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                <img
                    src="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2560&auto=format&fit=crop"
                    alt="Background"
                    className="w-full h-full object-cover animate-ken-burns opacity-60"
                />
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-[2px]"></div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar - Dark Glass Design */}
            <aside className={`w-72 bg-black/40 backdrop-blur-xl border-r border-white/10 text-gray-300 flex flex-col shadow-2xl z-50 transition-transform duration-300 
                fixed inset-y-0 left-0 h-screen overflow-y-auto custom-scrollbar print:hidden
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0 md:sticky md:top-0 md:flex`}>
                {/* Brand Area */}
                <div className="p-6 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-400/20 p-2.5 rounded-xl shadow-[0_0_15px_rgba(250,204,21,0.2)] border border-yellow-400/30">
                            <Users className="text-yellow-400 w-6 h-6" />
                        </div>
                        <div className="w-full">
                            <h1 className="text-xl font-serif font-black italic text-white tracking-wide leading-tight drop-shadow-md">{academicConfig.name || 'School Admin'}</h1>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-400/80">Admin Portal</p>
                        </div>
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="md:hidden text-gray-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1 flex-1">
                    <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-2">Main</p>
                    <NavButton
                        active={activeTab === 'overview'}
                        onClick={() => handleTabChange('overview')}
                        icon={LayoutDashboard}
                        label="Dashboard Overview"
                    />

                    <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">Management</p>
                    <NavGroup
                        label="Students"
                        icon={Users}
                        expanded={expandedSections.students}
                        onToggle={() => toggleSection('students')}
                    >
                        <NavSubButton active={activeTab === 'student-list'} onClick={() => handleTabChange('student-list')} label="Admission List" />
                        <NavSubButton active={activeTab === 'student-attendance'} onClick={() => handleTabChange('student-attendance')} label="Take Attendance" />
                        <NavSubButton active={activeTab === 'student-daily-status'} onClick={() => handleTabChange('student-daily-status')} label="Daily Status" />
                        <NavSubButton active={activeTab === 'student-report'} onClick={() => handleTabChange('student-report')} label="Reports" />
                    </NavGroup>

                    <NavGroup
                        label="Admissions"
                        icon={UserPlus}
                        expanded={expandedSections.admissions}
                        onToggle={() => toggleSection('admissions')}
                    >
                        <NavSubButton active={activeTab === 'admissions-crm'} onClick={() => handleTabChange('admissions-crm')} label="Enquiry CRM" />
                    </NavGroup>

                    <NavGroup
                        label="Teachers"
                        icon={User}
                        expanded={expandedSections.teachers}
                        onToggle={() => toggleSection('teachers')}
                    >
                        <NavSubButton active={activeTab === 'teacher-list'} onClick={() => handleTabChange('teacher-list')} label="Teacher List" />
                        <NavSubButton active={activeTab === 'teacher-attendance'} onClick={() => handleTabChange('teacher-attendance')} label="Mark Attendance" />
                        <NavSubButton active={activeTab === 'teacher-daily-status'} onClick={() => handleTabChange('teacher-daily-status')} label="Daily Status" />
                        <NavSubButton active={activeTab === 'teacher-report'} onClick={() => handleTabChange('teacher-report')} label="Reports" />
                    </NavGroup>

                    <NavGroup
                        label="Staff"
                        icon={User}
                        expanded={expandedSections.staff}
                        onToggle={() => toggleSection('staff')}
                    >
                        <NavSubButton active={activeTab === 'staff-list'} onClick={() => handleTabChange('staff-list')} label="Staff List" />
                        <NavSubButton active={activeTab === 'staff-attendance'} onClick={() => handleTabChange('staff-attendance')} label="Mark Attendance" />
                        <NavSubButton active={activeTab === 'staff-daily-status'} onClick={() => handleTabChange('staff-daily-status')} label="Daily Status" />
                        <NavSubButton active={activeTab === 'staff-report'} onClick={() => handleTabChange('staff-report')} label="Reports" />
                    </NavGroup>

                    <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">Finance</p>
                    <NavGroup
                        label="Fees & Accounts"
                        icon={IndianRupee}
                        expanded={expandedSections.fees}
                        onToggle={() => toggleSection('fees')}
                    >
                        <NavSubButton active={activeTab === 'fee-config'} onClick={() => handleTabChange('fee-config')} label="Fee Structure" />
                        <NavSubButton active={activeTab === 'fee-collection'} onClick={() => handleTabChange('fee-collection')} label="Collection Board" />
                    </NavGroup>
                    <NavButton
                        active={activeTab === 'expenditures'}
                        onClick={() => handleTabChange('expenditures')}
                        icon={IndianRupee}
                        label="Expenditures"
                    />

                    <NavGroup
                        label="Library"
                        icon={Book}
                        expanded={expandedSections.library}
                        onToggle={() => toggleSection('library')}
                    >
                        <NavSubButton active={activeTab === 'library-overview'} onClick={() => handleTabChange('library-overview')} label="Overview" />
                        <NavSubButton active={activeTab === 'library-books'} onClick={() => handleTabChange('library-books')} label="Books Catalog" />
                        <NavSubButton active={activeTab === 'library-issue-return'} onClick={() => handleTabChange('library-issue-return')} label="Issue / Return" />
                    </NavGroup>

                    <NavGroup
                        label="Salary"
                        icon={IndianRupee}
                        expanded={expandedSections.salary}
                        onToggle={() => toggleSection('salary')}
                    >
                        <NavSubButton active={activeTab === 'salary-management'} onClick={() => handleTabChange('salary-management')} label="Salary Management" />
                    </NavGroup>

                    <NavGroup
                        label="Academics"
                        icon={BarChart3}
                        expanded={expandedSections.academics}
                        onToggle={() => toggleSection('academics')}
                    >
                        <NavSubButton active={activeTab === 'timetable'} onClick={() => handleTabChange('timetable')} label="Timetable" />
                        <NavSubButton active={activeTab === 'marks'} onClick={() => handleTabChange('marks')} label="Marks" />
                        <NavSubButton active={activeTab === 'exam-schedule'} onClick={() => handleTabChange('exam-schedule')} label="Exam Schedule" />
                        <NavSubButton active={activeTab === 'question-generator'} onClick={() => handleTabChange('question-generator')} label="AI Question Paper" />
                    </NavGroup>

                    <NavGroup
                        label="Hostel"
                        icon={Home}
                        expanded={expandedSections.hostel}
                        onToggle={() => toggleSection('hostel')}
                    >
                        <NavSubButton active={activeTab === 'hostel-overview'} onClick={() => handleTabChange('hostel-overview')} label="Hostel Overview" />
                        <NavSubButton active={activeTab === 'hostel-rooms'} onClick={() => handleTabChange('hostel-rooms')} label="Room Management" />
                        <NavSubButton active={activeTab === 'hostel-allocation'} onClick={() => handleTabChange('hostel-allocation')} label="Room Allocation" />
                        <NavSubButton active={activeTab === 'hostel-finance'} onClick={() => handleTabChange('hostel-finance')} label="Hostel Finance" />
                    </NavGroup>

                    <NavGroup
                        label="Calendar & Events"
                        icon={Calendar}
                        expanded={expandedSections.calendar}
                        onToggle={() => toggleSection('calendar')}
                    >
                        <NavSubButton active={activeTab === 'school-calendar'} onClick={() => handleTabChange('school-calendar')} label="School Calendar" />
                    </NavGroup>

                    <div className="mt-2 space-y-1">
                        <NavButton
                            active={activeTab === 'announcements'}
                            onClick={() => handleTabChange('announcements')}
                            icon={Megaphone}
                            label="Announcements"
                        />
                        <NavButton
                            active={activeTab === 'leave-management'}
                            onClick={() => handleTabChange('leave-management')}
                            icon={Clock}
                            label="Leave Requests"
                            badge={pendingLeavesCount}
                        />
                    </div>

                    <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">Logistics</p>
                    <div className="mt-2">
                        <NavButton
                            active={activeTab === 'transport-management'}
                            onClick={() => handleTabChange('transport-management')}
                            icon={Bus}
                            label="Transport"
                        />
                    </div>

                    <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">Documents</p>
                    <div className="mt-2">
                        <NavButton
                            active={activeTab === 'certificates-generator'}
                            onClick={() => handleTabChange('certificates-generator')}
                            icon={Book}
                            label="Certificates"
                        />
                    </div>

                    <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">Biometric & Access</p>
                    <div className="mt-2">
                        <NavGroup
                            label="Access Control"
                            icon={Shield}
                            expanded={expandedSections.biometric}
                            onToggle={() => toggleSection('biometric')}
                        >
                            <NavSubButton active={activeTab === 'biometric-access'} onClick={() => handleTabChange('biometric-access')} label="Manage Devices" />
                        </NavGroup>
                    </div>
                </nav>

                {/* Footer User Profile */}
                <div className="p-4 border-t border-white/10 bg-black/20">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group border border-white/5 hover:border-white/20">
                        <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold shadow-md shadow-yellow-400/20">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{user?.email}</p>
                            <p className="text-xs text-gray-400">School Administrator</p>
                        </div>
                        <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f1f5f9] relative z-10">
                {/* Header */}
                <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm print:hidden">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden text-slate-600 hover:text-indigo-600 mr-2"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-slate-800">
                            {getTabTitle(activeTab)}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block group">
                            <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                placeholder="Search..."
                                className="bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-sm w-64 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder-slate-400"
                            />
                        </div>
                        <button className="relative p-2 text-slate-500 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50">
                            <Bell size={20} />
                            {/* <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span> */}
                        </button>
                    </div>
                </header>

                {/* Scrollable Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
                        {activeTab === 'overview' && <Overview config={academicConfig} />}
                        {activeTab === 'student-list' && <StudentManagement config={academicConfig} prefillData={activeTabState} />}
                        {activeTab === 'admissions-crm' && <AdmissionCRM onNavigate={(tab, data) => { setActiveTab(tab); setActiveTabState(data); }} />}
                        {activeTab === 'student-attendance' && <StudentAttendanceMarking config={academicConfig} />}
                        {activeTab === 'student-daily-status' && <DailyAttendanceStatus config={academicConfig} />}
                        {activeTab === 'student-report' && <StudentAttendanceReports config={academicConfig} />}

                        {activeTab === 'teacher-list' && <TeacherManagement config={academicConfig} />}
                        {activeTab === 'teacher-attendance' && <TeacherAttendanceMarking />}
                        {activeTab === 'teacher-daily-status' && <TeacherDailyStatus />}
                        {activeTab === 'teacher-report' && <TeacherAttendanceReports />}

                        {activeTab === 'staff-list' && <StaffManagement />}
                        {activeTab === 'staff-attendance' && <StaffAttendanceMarking />}
                        {activeTab === 'staff-daily-status' && <StaffDailyStatus />}
                        {activeTab === 'staff-report' && <StaffAttendanceReports />}

                        {activeTab === 'fee-config' && <FeeConfiguration config={academicConfig} />}
                        {activeTab === 'fee-collection' && <FeeCollection config={academicConfig} />}
                        {activeTab === 'expenditures' && <ExpenditureManagement />}

                        {activeTab === 'library-overview' && <LibraryOverview />}
                        {activeTab === 'library-books' && <BookManagement />}
                        {activeTab === 'library-issue-return' && <IssueReturn />}

                        {activeTab === 'salary-management' && <SalaryManagement />}

                        {activeTab === 'timetable' && <TimetableManagement config={academicConfig} />}
                        {activeTab === 'marks' && <MarksManagement config={academicConfig} />}
                        {activeTab === 'exam-schedule' && <ExamSchedule />}
                        {activeTab === 'question-generator' && <QuestionPaperGenerator config={academicConfig} />}

                        {activeTab === 'hostel-overview' && <HostelOverview />}
                        {activeTab === 'hostel-rooms' && <RoomManagement />}
                        {activeTab === 'hostel-allocation' && <RoomAllocation />}
                        {activeTab === 'hostel-finance' && <HostelFinance />}

                        {activeTab === 'school-calendar' && <SchoolCalendar />}
                        {activeTab === 'announcements' && <Announcements />}
                        {activeTab === 'leave-management' && <LeaveManagement onAction={fetchPendingLeaves} />}
                        {activeTab === 'certificates-generator' && <CertificateGenerator />}
                        {activeTab === 'transport-management' && <TransportManagement />}
                        {activeTab === 'biometric-access' && <BiometricManagement />}
                    </div>
                </main>
            </div>
        </div>
    );
};

// UI Components for Sidebar
const NavButton = ({ active, onClick, icon: Icon, label, badge }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${active
            ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 translate-x-1'
            : 'text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
            }`}
    >
        <Icon size={18} className={`${active ? 'text-black' : 'text-gray-400 group-hover:text-white px-0'}`} />
        <span className="flex-1 text-left">{label}</span>
        {
            badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                    {badge}
                </span>
            )
        }
        {active && <ChevronRight size={14} className="ml-auto opacity-50" />}
    </button >
);

const NavGroup = ({ label, icon: Icon, expanded, onToggle, children }) => (
    <div className="space-y-1">
        <button
            onClick={onToggle}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 group ${expanded ? 'text-white bg-white/5' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
        >
            <div className="flex items-center gap-3">
                <Icon size={18} className={`${expanded ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                {label}
            </div>
            <ChevronDown size={14} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>
        {
            expanded && (
                <div className="pl-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )
        }
    </div >
);

// UI SubComponent
const NavSubButton = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${active
            ? 'text-yellow-400 bg-white/5 border border-white/10 shadow-sm'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
    >
        <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${active ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'bg-gray-600'
            }`}></span>
        {label}
    </button>
);


const getTabTitle = (tab) => {
    const titles = {
        'overview': 'Dashboard Overview',
        'student-list': 'Student Admission List',
        'admissions-crm': 'Admissions Enquiry CRM',
        'student-attendance': 'Student Attendance',
        'student-daily-status': 'Daily Attendance Status',
        'student-report': 'Attendance Reports',
        'teacher-list': 'Teacher Management',
        'teacher-attendance': 'Teacher Attendance',
        'teacher-daily-status': 'Teacher Status',
        'teacher-report': 'Teacher Reports',
        'staff-list': 'Staff Management',
        'staff-attendance': 'Staff Attendance',
        'staff-daily-status': 'Staff Status',
        'staff-report': 'Staff Reports',
        'fee-config': 'Fee Structure Configuration',
        'fee-collection': 'Fee Collection & Dues',
        'expenditures': 'Office Expenditures',
        'library-overview': 'Library Information',
        'library-books': 'Book Management',
        'library-issue-return': 'Circulation Desk',
        'salary-management': 'Salary Management',
        'timetable': 'Timetable Management',
        'marks': 'Marks Management',
        'exam-schedule': 'Exam Schedule',
        'question-generator': 'AI Question Paper Generator',
        'hostel-overview': 'Hostel Management',
        'hostel-rooms': 'Room Configuration',
        'hostel-allocation': 'Student Allocation',
        'hostel-finance': 'Hostel Fees & Mess',
        'school-calendar': 'School Calendar',
        'announcements': 'Announcements & Notice Board',
        'leave-management': 'Leave Management',
        'certificates-generator': 'Certificate Generator',
        'transport-management': 'Transport & Live Tracking',
        'biometric-access': 'Biometric & Access Control'
    };
    return titles[tab] || 'Dashboard';
}

const styles = `
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    aside .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
    
    .label {font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem; display: block;}
    
    .input {
        width: 100%; 
        padding: 0.6rem 0.85rem; 
        border: 1px solid #e2e8f0; 
        border-radius: 0.75rem; 
        font-size: 0.875rem; 
        outline: none; 
        transition: all 0.2s; 
        background: white; 
        color: #1e293b;
    }
    .input:focus {border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);}
    
    .btn-primary {
        background: linear-gradient(135deg, #00C9FC 0%, #06b6d4 100%); 
        color: white; 
        padding: 0.6rem 1.2rem; 
        border-radius: 0.75rem; 
        font-weight: 600; 
        transition: all 0.2s; 
        box-shadow: 0 4px 6px -1px rgba(6, 182, 212, 0.4);}
    .btn-primary:hover {transform: translateY(-1px); box-shadow: 0 8px 12px -1px rgba(6, 182, 212, 0.5);}
    
    .btn-secondary {
        background-color: white; 
        color: #475569; 
        padding: 0.6rem 1.2rem; 
        border-radius: 0.75rem; 
        font-weight: 600; 
        border: 1px solid #e2e8f0; 
        transition: all 0.2s;
    }
    .btn-secondary:hover {background-color: #f8fafc; border-color: #cbd5e1;}
`;

export default function WrappedSchoolAdminDashboard() {
    return (
        <>
            <style>{styles}</style>
            <SchoolAdminDashboard />
        </>
    );
};
