import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
    LayoutDashboard, CheckSquare, Bus, Calendar,
    FileText, LogOut, Bell, Briefcase, Navigation, Radio, MapPin, Menu, X
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import SchoolCalendar from '../components/dashboard/calendar/SchoolCalendar';
import ViewAnnouncements from '../components/dashboard/calendar/ViewAnnouncements';
import StaffMyAttendance from '../components/dashboard/staff/StaffMyAttendance';
import TeacherTransportMap from '../components/dashboard/teachers/TeacherTransportMap';
import StaffSalarySlips from '../components/dashboard/staff/StaffSalarySlips';
import AdminLiveMap from '../components/dashboard/admin/AdminLiveMap';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { MobileHeader, MobileFooter } from '../components/layout/MobileAppFiles';

const StaffDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [isMobileApp, setIsMobileApp] = useState(false);

    // Detect Mobile App context
    useEffect(() => {
        const checkMobile = () => {
            if (Capacitor.isNativePlatform()) {
                setIsMobileApp(true);
                return;
            }
            const params = new URLSearchParams(window.location.search);
            const isAppStr = params.get('is_mobile_app') === 'true';
            if (isAppStr || localStorage.getItem('is_mobile_app') === 'true') {
                setIsMobileApp(true);
                if (isAppStr) localStorage.setItem('is_mobile_app', 'true');
            }
        };
        checkMobile();
    }, []);

    const [schoolName, setSchoolName] = useState('');
    const [staffProfile, setStaffProfile] = useState(null);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
    };

    // Driver Specific State
    const [profileLoading, setProfileLoading] = useState(true);
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [isTracking, setIsTracking] = useState(false);
    const [logs, setLogs] = useState([]);
    const [location, setLocation] = useState(null);
    const watchIdRef = useRef(null);

    const isDriver = user?.role === 'DRIVER' ||
        user?.role === 'SCHOOL_ADMIN' ||
        staffProfile?.role?.toLowerCase().includes('driver') ||
        staffProfile?.role?.toLowerCase().includes('transport') ||
        staffProfile?.designation?.toLowerCase().includes('driver') ||
        staffProfile?.department?.toLowerCase().includes('transport') ||
        staffProfile?.vehicle_id ||
        staffProfile?.transport_route_id ||
        (staffProfile && Object.values(staffProfile).some(val =>
            typeof val === 'string' && (val.toLowerCase().includes('driver') || val.toLowerCase().includes('transport'))
        ));

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
            setProfileLoading(true);
            try {
                const res = await api.get('/staff/profile');
                setStaffProfile(res.data);
            } catch (error) {
                console.error("Failed to load profile", error);
            } finally {
                setProfileLoading(false);
            }
        };

        fetchSchoolInfo();
        fetchProfile();

        return () => {
            if (isDriver) stopTracking();
        };
    }, [activeTab, user?.role]); // Use user role as dependency

    // Update vehicles when profile loads and identifies as driver
    useEffect(() => {
        if (isDriver) {
            fetchVehicles();
        }
    }, [isDriver]);

    const fetchVehicles = async () => {
        try {
            const res = await api.get('/transport/vehicles');
            setVehicles(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load vehicles');
        }
    };

    const startTracking = async () => {
        if (!selectedVehicle) return toast.error('Please select a vehicle first');

        try {
            if (isMobileApp) {
                const perm = await Geolocation.checkPermissions();
                if (perm.location !== 'granted') {
                    const req = await Geolocation.requestPermissions();
                    if (req.location !== 'granted') {
                        return toast.error('Location permission denied. Please enable it in phone settings.');
                    }
                }
            } else if (!navigator.geolocation) {
                return toast.error('Geolocation is not supported by your browser');
            }

            setIsTracking(true);
            addLog('Tracking started...');

            const id = await Geolocation.watchPosition(
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                },
                async (position, err) => {
                    if (err) {
                        console.error('GPS Watch Error:', err);
                        addLog(`GPS Error: ${err.message}`);
                        return;
                    }
                    if (position) {
                        const { latitude, longitude } = position.coords;
                        setLocation({ lat: latitude, lng: longitude });
                        sendLocationUpdate(latitude, longitude);
                    }
                }
            );
            watchIdRef.current = id;
        } catch (err) {
            console.error('Failed to start tracking', err);
            toast.error('Could not start GPS. Please check settings.');
        }
    };

    const stopTracking = async () => {
        if (watchIdRef.current !== null) {
            try {
                await Geolocation.clearWatch({ id: watchIdRef.current });
            } catch (err) {
                console.error('Clear watch failed', err);
            }
            watchIdRef.current = null;
        }
        setIsTracking(false);
        addLog('Tracking stopped.');
    };

    const sendLocationUpdate = async (lat, lng) => {
        try {
            await api.put(`/transport/vehicles/${selectedVehicle}/location`, { lat, lng });
            addLog(`Updated: ${lat.toFixed(5)}, ${lng.toFixed(5)} at ${new Date().toLocaleTimeString()}`);
        } catch (error) {
            console.error(error);
            addLog('Failed to send update to server');
        }
    };

    const addLog = (msg) => setLogs(prev => [msg, ...prev].slice(0, 50));

    const handleLogout = () => {
        if (isDriver) stopTracking();
        logout();
        navigate('/');
    };

    return (
        <div className="relative min-h-screen w-full flex font-sans text-slate-900 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar - Blue Gradient Theme */}
            <aside className={`w-72 bg-gradient-to-b from-sky-500 to-blue-600 text-white flex flex-col shadow-2xl transition-transform duration-300 
                fixed inset-y-0 left-0 h-screen overflow-y-auto custom-scrollbar print:hidden
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                ${isMobileApp ? 'z-[80]' : 'z-50'}
                md:translate-x-0 md:sticky md:top-0 md:flex`}>

                {/* Brand Area */}
                <div className="p-6 flex items-center justify-between border-b border-white/20 pt-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2.5 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.2)] border border-white/30 backdrop-blur-sm">
                            <Briefcase className="text-white w-6 h-6" />
                        </div>
                        <div className="w-full">
                            <h1 className="text-sm font-black text-white tracking-widest leading-none drop-shadow-md uppercase">Connect to Campus</h1>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100 mt-1 opacity-80">{schoolName || 'Software'}</p>
                        </div>
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="md:hidden text-blue-100 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
                    <p className="px-4 text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 mt-2">Main</p>
                    <NavButton active={activeTab === 'overview'} onClick={() => handleTabChange('overview')} icon={LayoutDashboard} label="Dashboard" />

                    <p className="px-4 text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 mt-6">Work</p>
                    <NavButton active={activeTab === 'attendance'} onClick={() => handleTabChange('attendance')} icon={Calendar} label="My Attendance" />

                    <p className="px-4 text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 mt-6">Transport</p>
                    <NavButton active={activeTab === 'fleet-map'} onClick={() => handleTabChange('fleet-map')} icon={Navigation} label="Live Fleet Map" />
                    <div className="px-4 py-2">
                        <button
                            onClick={() => navigate('/driver-tracking')}
                            className="w-full flex items-center justify-center gap-2 p-3 bg-white text-indigo-600 rounded-xl text-sm font-black shadow-lg hover:bg-indigo-50 transition-all border-b-4 border-indigo-200 active:border-b-0 active:translate-y-1"
                        >
                            <Navigation size={18} className="animate-pulse" />
                            START GPS MODE
                        </button>
                    </div>

                    <p className="px-4 text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 mt-6">Finance</p>
                    <NavButton active={activeTab === 'salary'} onClick={() => handleTabChange('salary')} icon={FileText} label="Salary Slips" />

                    <p className="px-4 text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 mt-6">General</p>
                    <NavButton active={activeTab === 'announcements'} onClick={() => handleTabChange('announcements')} icon={Bell} label="Notice Board" />
                    <NavButton active={activeTab === 'calendar'} onClick={() => handleTabChange('calendar')} icon={Calendar} label="School Calendar" />
                </nav>

                {/* Footer User Profile */}
                <div className="p-4 border-t border-white/20 bg-black/10">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer group border border-white/10 hover:border-white/30">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold shadow-lg">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{staffProfile?.name || user?.name}</p>
                            <p className="text-[10px] text-blue-100 uppercase font-bold tracking-tight">{isDriver ? 'Driver' : 'Staff Member'}: {staffProfile?.employee_id || '--'}</p>
                            <p className="text-[10px] text-blue-200">School ID: {user?.schoolId}</p>
                        </div>
                        <button onClick={handleLogout} className="text-blue-200 hover:text-white transition-colors">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area - LIGHT THEME */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f1f5f9] relative z-10">
                {/* Mobile Header (App Mode Only) */}
                {isMobileApp && (
                    <MobileHeader
                        title={getTabTitle(activeTab, isDriver)}
                        schoolName={schoolName}
                        onMenuClick={() => setIsMobileMenuOpen(true)}
                        onBack={activeTab !== 'overview' ? () => setActiveTab('overview') : null}
                    />
                )}

                {/* Header */}
                {!isMobileApp && (
                    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 min-h-[5rem] flex items-end justify-between px-6 sticky top-0 z-20 shadow-sm print:hidden safe-area-top pb-3">
                        <div className="flex items-center gap-4 py-2">
                            <button
                                className="text-slate-800 hover:text-indigo-600 bg-slate-100 p-2.5 rounded-xl md:hidden"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                <Menu size={22} />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {getTabTitle(activeTab, isDriver)}
                                </h2>
                                <p className="text-xs text-slate-500 md:block hidden">Manage your work and profile</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 py-2">
                            <NotificationBell />
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold border border-orange-200">
                                {user?.name?.[0]}
                            </div>
                        </div>
                    </header>
                )}

                {/* Scrollable Content */}
                <div className={`flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar ${isMobileApp ? 'pt-[calc(4rem+var(--sat)+1rem)] pb-[calc(4rem+var(--sab)+1rem)]' : 'pt-[calc(var(--sat)+1rem)]'}`}>


                    <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
                        {activeTab === 'overview' && <StaffOverview isDriver={isDriver} schoolName={schoolName} />}
                        {activeTab === 'attendance' && <StaffMyAttendance />}

                        {/* Unified Transport View */}
                        {activeTab === 'transport' && isDriver && (
                            <DriverTrackingView
                                vehicles={vehicles}
                                selectedVehicle={selectedVehicle}
                                setSelectedVehicle={setSelectedVehicle}
                                startTracking={startTracking}
                                stopTracking={stopTracking}
                                isTracking={isTracking}
                                location={location}
                                logs={logs}
                            />
                        )}
                        {activeTab === 'fleet-map' && <AdminLiveMap />}

                        {activeTab === 'salary' && <StaffSalarySlips />}
                        {activeTab === 'announcements' && <ViewAnnouncements />}
                        {activeTab === 'calendar' && <SchoolCalendar />}
                    </div>
                </div>
            </main>

            {/* Mobile Tab Bar (App Mode Only) */}
            {isMobileApp && (
                <MobileFooter
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onMenuToggle={() => setIsMobileMenuOpen(true)}
                    tabs={[
                        { id: 'overview', label: 'Home', icon: LayoutDashboard },
                        { id: 'attendance', label: 'Attendance', icon: Calendar },
                        ...(isDriver ? [{ id: 'transport', label: 'Trip', icon: Bus }] : [{ id: 'salary', label: 'Salary', icon: FileText }]),
                        { id: 'announcements', label: 'Notices', icon: Bell },
                    ]}
                />
            )}
        </div>
    );
};

// --- Sub Components ---

const StaffOverview = ({ isDriver, schoolName }) => {
    const navigate = useNavigate();
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-full mb-6">
                <div className="overflow-hidden w-full bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 -translate-y-1/2 translate-x-1/2"></div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight font-serif italic relative z-10">
                        {schoolName}
                    </h3>
                </div>
                <p className="text-slate-500 text-sm mt-2 ml-1">{isDriver ? 'Driver Dashboard' : 'Staff Dashboard'}</p>
            </div>

            <div className="col-span-full mb-6 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 transform hover:scale-[1.01] transition-all">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <Navigation size={40} className="animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Start Your Trip</h2>
                        <p className="text-blue-100 text-sm">Turn on your GPS so students can track your bus.</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/driver-tracking')}
                    className="w-full md:w-auto px-8 py-4 bg-white text-indigo-600 rounded-xl font-black text-lg shadow-lg hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                    <Radio size={24} className="animate-bounce" />
                    START GPS MODE
                </button>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-500 mb-1">Attendance</h3>
                <div className="text-3xl font-bold text-slate-800">92%</div>
                <div className="text-xs text-emerald-500 mt-2 font-bold">Excellent</div>
            </div>
        </div>
    );
};

const DriverTrackingView = ({ vehicles, selectedVehicle, setSelectedVehicle, startTracking, stopTracking, isTracking, location, logs }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-indigo-600 p-6 text-white text-center">
                <Bus size={48} className="mx-auto mb-2 opacity-90" />
                <h2 className="text-2xl font-bold">Trip Tracker</h2>
                <p className="text-indigo-200 text-sm">Select your bus and start driving</p>
            </div>

            <div className="p-6 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Select Vehicle</label>
                    <select
                        className="w-full p-3 border rounded-lg bg-slate-50 text-slate-700 font-medium disabled:opacity-50"
                        value={selectedVehicle}
                        onChange={(e) => setSelectedVehicle(e.target.value)}
                        disabled={isTracking}
                    >
                        <option value="">-- Choose Bus --</option>
                        {vehicles.map(v => (
                            <option key={v.id} value={v.id}>
                                {v.vehicle_number} ({v.vehicle_model})
                            </option>
                        ))}
                    </select>
                </div>

                <div className={`flex items-center justify-center gap-3 p-4 rounded-lg border ${isTracking ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                    <span className="font-bold text-sm">
                        {isTracking ? 'TRACKING ACTIVE' : 'Status: Offline'}
                    </span>
                </div>

                {!isTracking ? (
                    <button onClick={startTracking} disabled={!selectedVehicle} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed">
                        <Navigation size={20} /> START TRACKING
                    </button>
                ) : (
                    <button onClick={stopTracking} className="w-full py-4 bg-red-500 hover:bg-red-600 active:scale-95 transition-all text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2">
                        <Radio size={20} /> STOP TRACKING
                    </button>
                )}

                {location && (
                    <div className="text-center text-xs text-slate-400">
                        GPS: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </div>
                )}
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 h-96 overflow-hidden flex flex-col">
            <h3 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-2">
                <MapPin size={14} /> Activity Log
            </h3>
            <div className="flex-1 overflow-y-auto bg-slate-50 rounded-lg p-3 space-y-1 text-xs font-mono text-slate-600 custom-scrollbar">
                {logs.length === 0 && <span className="text-slate-400 italic">No activity yet...</span>}
                {logs.map((log, i) => (
                    <div key={i} className="border-b border-slate-100 last:border-0 pb-1">
                        {log}
                    </div>
                ))}
            </div>
        </div>
    </div>
);



// Helper Component
const NavButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${active
            ? 'bg-white text-blue-600 shadow-lg translate-x-1'
            : 'text-blue-100 hover:bg-white/10 hover:text-white hover:translate-x-1'
            }`}
    >
        <Icon size={18} className={`${active ? 'text-blue-600' : 'text-blue-200 group-hover:text-white px-0'}`} />
        <span className="flex-1 text-left">{label}</span>
        {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600/20"></span>}
    </button>
);

const getTabTitle = (tab, isDriver) => {
    switch (tab) {
        case 'overview': return isDriver ? 'Driver Dashboard' : 'Staff Dashboard';

        case 'attendance': return 'Attendance History';
        case 'transport': return 'Trip Tracking';
        case 'fleet-map': return 'Live Fleet Tracking';
        case 'salary': return 'Salary & Payslips';
        case 'calendar': return 'Academic Calendar';
        case 'announcements': return 'Announcements';
        default: return 'Dashboard';
    }
};

// Styles for custom scrollbar (injected here to ensure consistency)
/* 
   Note: Ideally move to index.css, but this ensures it works immediately 
   without touching global files.
*/
const styles = `
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    aside .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
`;

export default function WrappedStaffDashboard() {
    return (
        <>
            <style>{styles}</style>
            <StaffDashboard />
        </>
    );
};
