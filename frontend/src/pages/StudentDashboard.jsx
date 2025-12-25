import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, BookOpen, Home, Bus, FileText, Calendar, DollarSign,
    LogOut, User, Bell, GraduationCap, Clock, Award, MessageSquare, Menu, X
} from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../api/axios';
import StudentDoubts from '../components/dashboard/students/StudentDoubts';
import SchoolCalendar from '../components/dashboard/calendar/SchoolCalendar';
import StudentLibraryStatus from '../components/dashboard/students/StudentLibraryStatus';
import StudentAcademics from '../components/dashboard/students/StudentAcademics';
import StudentMyAttendance from '../components/dashboard/students/StudentMyAttendance';
import StudentHostel from '../components/dashboard/students/StudentHostel';
import StudentFees from '../components/dashboard/students/StudentFees';
import StudentTransport from '../components/dashboard/students/StudentTransport';
import StudentCertificates from '../components/dashboard/students/StudentCertificates';
import StudentLeaves from '../components/dashboard/students/StudentLeaves';
import ViewAnnouncements from '../components/dashboard/calendar/ViewAnnouncements';

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [studentData, setStudentData] = useState(null);
    const [schoolName, setSchoolName] = useState('');
    const [leaveNotifications, setLeaveNotifications] = useState([]);
    const [overviewStats, setOverviewStats] = useState({
        attendance: { percentage: 0, present: 0, total: 0 },
        library: { active: 0, overdue: 0 },
        fees: { totalDue: 0, status: 'Checking' },
        bus: { route: 'Not Assigned', status: 'N/A' }
    });

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);

        // Mark leave notifications as read when user visits leaves page
        if (tab === 'leaves') {
            localStorage.setItem('lastLeaveCheck', new Date().toISOString());
            setLeaveNotifications([]); // Clear the badge immediately
        }
    };

    useEffect(() => {
        const fetchSchoolInfo = async () => {
            try {
                const res = await api.get('/schools/my-school');
                setSchoolName(res.data.name);
            } catch (error) {
                console.error("Failed to load school info", error);
            }
        };

        const fetchProfile = async () => {
            try {
                const res = await api.get('/students/profile');
                setStudentData(res.data);
            } catch (err) {
                console.error("Failed to load profile", err);
            }
        };

        const fetchData = async () => {
            const today = new Date();
            const month = today.getMonth() + 1;
            const year = today.getFullYear();

            // Default Stats
            let newStats = {
                attendance: { percentage: 0, present: 0, total: 0 },
                library: { active: 0, overdue: 0 },
                fees: { totalDue: 0, status: 'Paid' },
                hostel: { isAllocated: false, room: 'N/A', pendingBills: 0 },
                bus: { route: 'Not Assigned', status: 'N/A' }
            };

            try {
                const [attResult, libResult, feeResult, hostelResult, busResult] = await Promise.allSettled([
                    // remove params to get overall attendance stats (Academic Year)
                    api.get('/students/attendance/my-report'),
                    api.get('/library/my-books'),
                    api.get('/fees/my-status'),
                    api.get('/hostel/my-details'),
                    api.get('/transport/my-route')
                ]);

                // 1. Attendance
                if (attResult.status === 'fulfilled' && attResult.value.data) {
                    // Backend returns flat object: { attendancePercentage, totalDays, presentDays, ... }
                    // OR { stats: { ... } } depending on version?
                    // Checked studentController.js: It returns flat object { attendancePercentage, totalDays, presentDays, ... }
                    // Logic below handles flat structure.
                    const data = attResult.value.data;
                    const present = data.presentDays || data.stats?.present || 0;
                    const total = data.totalDays || data.stats?.total || 0;
                    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
                    newStats.attendance = { percentage, present, total };
                }

                // 2. Library
                if (libResult.status === 'fulfilled') {
                    // Checked libraryController.js: Returns { books: [...] }
                    const data = libResult.value.data;
                    const books = Array.isArray(data) ? data : (data.books || []);

                    if (Array.isArray(books)) {
                        newStats.library = {
                            active: books.length,
                            overdue: books.filter(b => new Date(b.due_date) < new Date() && b.status === 'Issued').length
                        };
                    }
                }

                // 3. Fees
                if (feeResult.status === 'fulfilled' && Array.isArray(feeResult.value.data)) {
                    const totalDue = feeResult.value.data.reduce((sum, f) => sum + parseFloat(f.balance), 0);
                    newStats.fees = { totalDue, status: totalDue > 0 ? 'Pending' : 'Paid' };
                } else if (feeResult.status === 'rejected') {
                    // Keep default or set to 'Error'
                    console.error("Fees fetch failed", feeResult.reason);
                }

                // 4. Hostel
                if (hostelResult.status === 'fulfilled') {
                    const hData = hostelResult.value.data;
                    if (hData.is_allocated || hData.allocation_id) {
                        const pendingBills = hData.bills ? hData.bills.filter(b => b.status === 'Pending').length : 0;
                        newStats.hostel = {
                            isAllocated: true,
                            room: hData.room_number,
                            pendingBills
                        };
                    }
                }

                // 5. Transport
                if (busResult.status === 'fulfilled') {
                    const bData = busResult.value.data;
                    newStats.bus = {
                        route: bData.route_name || 'Assigned',
                        status: bData.vehicle_status || 'Active'
                    };
                }

                setOverviewStats(newStats);

            } catch (err) {
                console.error("Unexpected error in dashboard fetch", err);
            }
        };

        const fetchLeaveNotifications = async () => {
            try {
                const res = await api.get('/leaves/my-leaves');
                // Get the last time user checked leaves from localStorage
                const lastChecked = localStorage.getItem('lastLeaveCheck');
                const lastCheckedTime = lastChecked ? new Date(lastChecked) : new Date(0);

                // Filter only recently approved/rejected leaves that are newer than last check
                const recent = res.data.filter(leave => {
                    if (leave.status === 'Pending') return false;
                    const updatedDate = new Date(leave.updated_at || leave.created_at);
                    return updatedDate > lastCheckedTime;
                });
                setLeaveNotifications(recent);
            } catch (error) {
                console.error('Failed to fetch leave notifications', error);
            }
        };

        fetchSchoolInfo();
        fetchProfile();
        fetchData();
        fetchLeaveNotifications();

        // Poll for new notifications every 2 minutes
        const interval = setInterval(fetchLeaveNotifications, 120000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => { logout(); navigate('/'); };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 relative">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`w-64 bg-slate-900 text-slate-300 flex flex-col fixed inset-y-0 left-0 z-50 h-full transition-transform duration-300 
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="p-6 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <GraduationCap className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <div className="w-full">
                                <h1 className="text-xl font-serif font-black italic text-white tracking-wide leading-tight drop-shadow-md">{schoolName || 'Student Portal'}</h1>
                            </div>
                            <p className="text-sm font-medium text-white">{studentData?.name || user?.name}</p>
                            <p className="text-xs text-slate-500 font-bold">ID: {studentData?.admission_no || 'Pending'}</p>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="md:hidden text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                    <NavButton active={activeTab === 'overview'} onClick={() => handleTabChange('overview')} icon={LayoutDashboard} label="Dashboard" />
                    <NavButton active={activeTab === 'academics'} onClick={() => handleTabChange('academics')} icon={BookOpen} label="Academics & Exams" />
                    <NavButton active={activeTab === 'doubts'} onClick={() => handleTabChange('doubts')} icon={MessageSquare} label="Ask Doubts" />
                    <NavButton
                        active={activeTab === 'leaves'}
                        onClick={() => handleTabChange('leaves')}
                        icon={Calendar}
                        label="Apply Leave"
                        badge={leaveNotifications.length}
                    />
                    <NavButton active={activeTab === 'attendance'} onClick={() => handleTabChange('attendance')} icon={Clock} label="Attendance" />
                    <NavButton active={activeTab === 'library'} onClick={() => handleTabChange('library')} icon={FileText} label="Library Books" />
                    <NavButton active={activeTab === 'hostel'} onClick={() => handleTabChange('hostel')} icon={Home} label="Hostel Rooms" />
                    <NavButton active={activeTab === 'fees'} onClick={() => handleTabChange('fees')} icon={DollarSign} label="My Fees" />
                    <NavButton active={activeTab === 'transport'} onClick={() => handleTabChange('transport')} icon={Bus} label="Track Your School Bus" />
                    <NavButton active={activeTab === 'certificates'} onClick={() => handleTabChange('certificates')} icon={Award} label="Certificates" />
                    <NavButton active={activeTab === 'announcements'} onClick={() => handleTabChange('announcements')} icon={Bell} label="Notice Board" />
                    <NavButton active={activeTab === 'calendar'} onClick={() => handleTabChange('calendar')} icon={Calendar} label="School Calendar" />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all font-medium">
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 ml-0 p-8 overflow-y-auto h-screen">
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden text-slate-500 hover:text-indigo-600"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <Menu size={24} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">{getTabTitle(activeTab)}</h2>
                            <p className="text-slate-500 text-sm hidden md:block">Manage your academic journey here</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('leaves')}
                            className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all relative"
                            title={leaveNotifications.length > 0 ? `${leaveNotifications.length} leave update(s)` : 'No new notifications'}
                        >
                            <Bell size={20} />
                            {leaveNotifications.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                                    {leaveNotifications.length}
                                </span>
                            )}
                        </button>
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
                            {user?.name?.[0]}
                        </div>
                    </div>
                </header>

                <div className="max-w-6xl mx-auto">
                    {activeTab === 'overview' && <StudentOverview schoolName={schoolName} stats={overviewStats} />}
                    {activeTab === 'doubts' && <StudentDoubts />}
                    {activeTab === 'leaves' && <StudentLeaves />}
                    {activeTab === 'transport' && <StudentTransport />}
                    {activeTab === 'library' && <StudentLibraryStatus />}
                    {activeTab === 'hostel' && <StudentHostel />}
                    {activeTab === 'fees' && <StudentFees student={studentData} schoolName={schoolName} />}
                    {activeTab === 'certificates' && <StudentCertificates student={studentData} schoolName={schoolName} />}
                    {activeTab === 'academics' && <StudentAcademics />}
                    {activeTab === 'attendance' && <StudentMyAttendance />}
                    {activeTab === 'announcements' && <ViewAnnouncements />}
                    {activeTab === 'calendar' && <SchoolCalendar />}
                </div>
            </main>
        </div>
    );
};

// --- Sub Components (Placeholders for now, will expand) ---

const StudentOverview = ({ schoolName, stats }) => (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="col-span-full mb-6">
            <div className="overflow-hidden w-full bg-white/50 rounded-xl p-3 border border-slate-100 shadow-inner">
                <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 animate-marquee-fast uppercase tracking-widest font-serif italic drop-shadow-sm">
                    {schoolName}
                </h3>
            </div>
            <p className="text-slate-500 text-sm mt-2 ml-1">Your Personal Dashboard</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="font-bold text-indigo-100 mb-1">Attendance</h3>
            <div className="text-3xl font-bold">{stats?.attendance?.percentage || 0}%</div>
            <div className="text-xs text-indigo-200 mt-2">Present {stats?.attendance?.present || 0}/{stats?.attendance?.total || 0}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-500 mb-1">Library</h3>
            <div className="text-3xl font-bold text-slate-800">{stats?.library?.active || 0} <span className="text-sm text-slate-400 font-normal">Issued</span></div>
            <div className="text-xs text-rose-500 mt-2 font-bold">{stats?.library?.overdue > 0 ? `${stats.library.overdue} Overdue` : 'No Overdue'}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-500 mb-1">Fees</h3>
            {stats?.fees?.status === 'Checking' ? (
                <div className="text-sm text-slate-400 font-medium animate-pulse mt-2">Syncing records...</div>
            ) : (
                <>
                    <div className={`text-2xl font-black ${stats?.fees?.totalDue > 0 ? 'text-rose-600' : 'text-emerald-500'}`}>
                        {stats?.fees?.totalDue > 0 ? `₹${stats?.fees?.totalDue.toLocaleString()}` : 'Paid'}
                    </div>
                    <div className={`text-xs mt-2 font-bold ${stats?.fees?.totalDue > 0 ? 'text-rose-400' : 'text-emerald-500'}`}>
                        {stats?.fees?.totalDue > 0 ? `Total Dues` : 'No Dues'}
                    </div>
                </>
            )}
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-500 mb-1">Hostel</h3>
            <div className={`text-xl font-bold ${stats?.hostel?.isAllocated ? 'text-slate-800' : 'text-slate-400'}`}>
                {stats?.hostel?.isAllocated ? `Room ${stats.hostel.room}` : 'N/A'}
            </div>
            <div className="text-xs text-slate-500 mt-2 font-bold">
                {stats?.hostel?.isAllocated ? (
                    <span className={stats.hostel.pendingBills > 0 ? 'text-rose-500' : 'text-emerald-500'}>
                        {stats.hostel.pendingBills > 0 ? `${stats.hostel.pendingBills} Bills Due` : 'All Paid'}
                    </span>
                ) : 'Not Allocated'}
            </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-500 mb-1">Transport</h3>
            <div className="text-xl font-bold text-slate-800">{stats?.bus?.route || 'N/A'}</div>
            <div className="text-xs text-emerald-600 mt-2 font-bold">{stats?.bus?.status || 'Active'}</div>
        </div>
    </div>
);












// Helper Component
const NavButton = ({ active, onClick, icon: Icon, label, badge }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm mb-1 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
    >
        <Icon size={18} />
        <span className="flex-1 text-left">{label}</span>
        {badge > 0 && (
            <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {badge}
            </span>
        )}
    </button>
);

const getTabTitle = (tab) => {
    switch (tab) {
        case 'overview': return 'Student Dashboard';
        case 'transport': return 'Track Your School Bus';
        case 'library': return 'My Issued Books';
        case 'hostel': return 'My Hostel Room';
        case 'fees': return 'Fee Status';
        case 'certificates': return 'My Certificates';
        case 'academics': return 'Academics';
        case 'doubts': return 'My Doubts & Questions';
        case 'leaves': return 'Leave Application';
        case 'attendance': return 'Attendance';
        case 'calendar': return 'Academic Calendar';
        default: return 'Dashboard';
    }
};

export default StudentDashboard;
