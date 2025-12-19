import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Calendar,
    LogOut, Bell, GraduationCap,
    CheckSquare, Clock, Bus, MessageSquare, MapPin, BookOpen, Menu, X
} from 'lucide-react';
import api from '../api/axios';
import StudentAttendanceMarking from '../components/dashboard/students/StudentAttendanceMarking';
import TeacherMyTimetable from '../components/dashboard/teachers/TeacherMyTimetable';
import TeacherMySalary from '../components/dashboard/teachers/TeacherMySalary';

import TeacherMyAttendance from '../components/dashboard/teachers/TeacherMyAttendance';
import TeacherDoubts from '../components/dashboard/teachers/TeacherDoubts';
import TeacherTransportMap from '../components/dashboard/teachers/TeacherTransportMap';
import TeacherLeaveApplication from '../components/dashboard/teachers/TeacherLeaveApplication';
import SchoolCalendar from '../components/dashboard/calendar/SchoolCalendar';
import TeacherLibraryStatus from '../components/dashboard/teachers/TeacherLibraryStatus';
import ViewAnnouncements from '../components/dashboard/calendar/ViewAnnouncements';

const TeacherDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [teacherProfile, setTeacherProfile] = useState(null);
    const [schoolName, setSchoolName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
        fetchSchoolInfo();
    }, []);

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
            const res = await api.get('/teachers/profile');
            setTeacherProfile(res.data);
        } catch (error) {
            console.error("Failed to load teacher profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => { logout(); navigate('/'); };

    // Construct Config for StudentAttendanceMarking based on assigned class
    const attendanceConfig = teacherProfile?.assigned_class_id ? {
        classes: [{
            class_id: teacherProfile.assigned_class_id,
            class_name: teacherProfile.class_name,
            sections: [{
                id: teacherProfile.assigned_section_id,
                name: teacherProfile.section_name
            }]
        }]
    } : { classes: [] };

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
                        <div className="bg-emerald-600 p-2 rounded-lg">
                            <GraduationCap className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <div className="w-full">
                                <h1 className="text-xl font-serif font-black italic text-white tracking-wide leading-tight drop-shadow-md">{schoolName || 'Teacher Portal'}</h1>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-xs font-medium text-slate-500">Welcome, {teacherProfile?.name || user?.name}</p>
                                {teacherProfile?.employee_id && (
                                    <p className="text-[10px] text-emerald-500 font-mono mt-0.5">ID: {teacherProfile.employee_id}</p>
                                )}
                            </div>
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
                    <NavButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={LayoutDashboard} label="Dashboard" />
                    <NavButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={CheckSquare} label="Mark Attendance" />
                    <NavButton active={activeTab === 'my-attendance'} onClick={() => setActiveTab('my-attendance')} icon={Clock} label="My Attendance" />
                    <NavButton active={activeTab === 'timetable'} onClick={() => setActiveTab('timetable')} icon={Calendar} label="My Timetable" />
                    <NavButton active={activeTab === 'salary'} onClick={() => setActiveTab('salary')} icon={Users} label="My Salary" />
                    <NavButton active={activeTab === 'transport'} onClick={() => setActiveTab('transport')} icon={Bus} label="Track My School Bus" />
                    <NavButton active={activeTab === 'doubts'} onClick={() => setActiveTab('doubts')} icon={MessageSquare} label="Student Doubts" />
                    <NavButton active={activeTab === 'library'} onClick={() => setActiveTab('library')} icon={BookOpen} label="Library Books" />
                    <NavButton active={activeTab === 'leaves'} onClick={() => setActiveTab('leaves')} icon={Clock} label="Leave Applications" />
                    <NavButton active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} icon={Bell} label="Notice Board" />
                    <NavButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={Calendar} label="School Calendar" />
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
                            className="md:hidden text-slate-500 hover:text-emerald-600"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <Menu size={24} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">{getTabTitle(activeTab)}</h2>
                            <p className="text-slate-500 text-sm hidden md:block">Manage your class and academic activities</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all relative">
                            <Bell size={20} />
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold border-2 border-white shadow-sm">
                            {user?.name?.[0]}
                        </div>
                    </div>
                </header>

                <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
                    {loading ? (
                        <div className="text-center py-20 text-slate-400">Loading profile...</div>
                    ) : (
                        <>
                            {activeTab === 'overview' && <TeacherOverview profile={teacherProfile} schoolName={schoolName} />}

                            {activeTab === 'attendance' && (
                                teacherProfile?.assigned_class_id ?
                                    <StudentAttendanceMarking config={attendanceConfig} /> :
                                    <div className="p-12 border-2 border-dashed border-slate-300 rounded-2xl text-center text-slate-400 font-bold">
                                        You are not assigned as a Class Teacher to mark attendance.
                                    </div>
                            )}

                            {activeTab === 'my-attendance' && <TeacherMyAttendance />}
                            {activeTab === 'salary' && <TeacherMySalary />}

                            {activeTab === 'timetable' && <TeacherMyTimetable />}

                            {activeTab === 'transport' && <TeacherTransportView profile={teacherProfile} />}

                            {activeTab === 'doubts' && <TeacherDoubts />}
                            {activeTab === 'library' && <TeacherLibraryStatus />}
                            {activeTab === 'leaves' && <TeacherLeaveApplication />}
                            {activeTab === 'announcements' && <ViewAnnouncements />}
                            {activeTab === 'calendar' && <SchoolCalendar />}
                        </>
                    )}
                </div>
            </main >
        </div >
    );
};

// --- Sub Components ---

const TeacherOverview = ({ profile, schoolName }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-full mb-6">
            <div className="overflow-hidden w-full bg-white/50 rounded-xl p-3 border border-slate-100 shadow-inner">
                <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 animate-marquee-fast uppercase tracking-widest font-serif italic drop-shadow-sm">
                    {schoolName}
                </h3>
            </div>
            <p className="text-slate-500 text-sm mt-2 ml-1">Overview of your academic responsibilities</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all"></div>
            <h3 className="font-bold text-emerald-100 mb-1 relative z-10">My Assigned Class</h3>
            {profile?.class_name ? (
                <>
                    <div className="text-3xl font-bold relative z-10">{profile.class_name} - {profile.section_name}</div>
                    <div className="text-xs text-emerald-200 mt-2 relative z-10 font-medium bg-emerald-700/30 inline-block px-2 py-1 rounded">Class Teacher</div>
                </>
            ) : (
                <div className="text-xl font-bold opacity-80 mt-2">No Class Assigned</div>
            )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <h3 className="font-bold text-slate-500 mb-1">Today's Attendance</h3>
            <div className="text-3xl font-bold text-slate-800">-- / --</div>
            <div className="text-xs text-slate-400 mt-2">View details in Attendance tab</div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <h3 className="font-bold text-slate-500 mb-1">Subject Specialization</h3>
            <div className="text-2xl font-bold text-slate-800 truncate" title={profile?.subject_specialization}>
                {profile?.subject_specialization || 'General'}
            </div>
            <div className="text-xs text-slate-400 mt-2">Primary Subject</div>
        </div>
    </div>
);

const TeacherTransportView = ({ profile }) => (
    <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2"><Bus className="text-emerald-600" /> Assigned Transport</h3>

            {profile?.transport_route_id ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="text-xs text-slate-500 font-bold uppercase mb-1">Route & Vehicle</div>
                        <div className="text-lg font-bold text-slate-800">{profile.transport_route}</div>
                        <div className="text-sm font-medium text-emerald-600 mt-1">{profile.vehicle_number}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="text-xs text-slate-500 font-bold uppercase mb-1">Driver Details</div>
                        <div className="text-lg font-bold text-slate-800">{profile.driver_name}</div>
                        <div className="text-sm font-mono text-slate-600 mt-1">{profile.driver_phone}</div>
                    </div>

                    <div className="col-span-full">
                        <TeacherTransportMap vehicle={profile} />
                    </div>
                </div>
            ) : (
                <div className="h-40 bg-slate-50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold">Self Transport / Not Assigned</p>
                </div>
            )}
        </div>
    </div>
);

// Helper Component
const NavButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm mb-1 ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
    >
        <Icon size={18} />
        {label}
    </button>
);

const getTabTitle = (tab) => {
    switch (tab) {
        case 'overview': return 'Teacher Dashboard';
        case 'attendance': return 'Mark Student Attendance';
        case 'my-attendance': return 'My Daily Attendance';
        case 'salary': return 'My Details & Salary Info';
        case 'timetable': return 'Class Timetable';
        case 'transport': return 'Track My School Bus';
        case 'doubts': return 'Student Doubts & Questions';
        case 'library': return 'My Issued Books';
        case 'leaves': return 'Leave Applications';
        case 'calendar': return 'Academic Calendar';
        default: return 'Dashboard';
    }
};

export default TeacherDashboard;
