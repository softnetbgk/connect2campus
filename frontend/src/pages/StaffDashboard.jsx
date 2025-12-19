import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
    LayoutDashboard, CheckSquare, Bus, Calendar,
    FileText, LogOut, Bell, Briefcase, Navigation, Radio, MapPin, Menu, X
} from 'lucide-react';
import SchoolCalendar from '../components/dashboard/calendar/SchoolCalendar';
import ViewAnnouncements from '../components/dashboard/calendar/ViewAnnouncements';
import StaffMyAttendance from '../components/dashboard/staff/StaffMyAttendance';
import TeacherTransportMap from '../components/dashboard/teachers/TeacherTransportMap';
import StaffSalarySlips from '../components/dashboard/staff/StaffSalarySlips';

const StaffDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [schoolName, setSchoolName] = useState('');
    const [staffProfile, setStaffProfile] = useState(null);

    // Driver Specific State
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [isTracking, setIsTracking] = useState(false);
    const [logs, setLogs] = useState([]);
    const [location, setLocation] = useState(null);
    const watchIdRef = useRef(null);

    const isDriver = user?.role === 'DRIVER';

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
                const res = await api.get('/staff/profile');
                setStaffProfile(res.data);
            } catch (error) {
                console.error("Failed to load profile", error);
            }
        };

        fetchSchoolInfo();
        fetchProfile();

        if (isDriver && activeTab === 'transport') {
            fetchVehicles();
        }
        return () => {
            if (isDriver) stopTracking();
        };
    }, [activeTab, isDriver]);

    const fetchVehicles = async () => {
        try {
            const res = await api.get('/transport/vehicles');
            setVehicles(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load vehicles');
        }
    };

    const startTracking = () => {
        if (!selectedVehicle) return toast.error('Please select a vehicle first');
        if (!navigator.geolocation) return toast.error('Geolocation is not supported');

        setIsTracking(true);
        addLog('Tracking started...');

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ lat: latitude, lng: longitude });
                sendLocationUpdate(latitude, longitude);
            },
            (error) => {
                console.error(error);
                addLog(`Error: ${error.message}`);
                toast.error('GPS Error: ' + error.message);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const stopTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
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
                        <div className="bg-orange-500 p-2 rounded-lg">
                            <Briefcase className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <div className="w-full">
                                <h1 className="text-xl font-serif font-black italic text-white tracking-wide leading-tight drop-shadow-md">{schoolName || (isDriver ? 'Driver Portal' : 'Staff Portal')}</h1>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-xs font-medium text-slate-500">Welcome, {staffProfile?.name || user?.name}</p>
                                {staffProfile?.employee_id && (
                                    <p className="text-[10px] text-orange-500 font-mono mt-0.5">ID: {staffProfile.employee_id}</p>
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

                    {/* Common Attendance */}
                    <NavButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={Calendar} label="My Attendance" />

                    {/* Transport: Driver gets Tracking, Staff gets Info */}
                    <NavButton active={activeTab === 'transport'} onClick={() => setActiveTab('transport')} icon={Bus} label={isDriver ? "Trip Tracker" : "Track My School Bus"} />

                    <NavButton active={activeTab === 'salary'} onClick={() => setActiveTab('salary')} icon={FileText} label="Salary Slips" />
                    <NavButton active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} icon={Bell} label="Notice Board" />
                    <NavButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={Calendar} label="School Calendar" />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{staffProfile?.name || user?.name}</p>
                            <p className="text-xs text-slate-400">{isDriver ? 'Driver' : 'Staff Member'}</p>
                        </div>
                        <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 ml-0 p-8 overflow-y-auto h-screen">
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden text-slate-500 hover:text-orange-600"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <Menu size={24} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">{getTabTitle(activeTab, isDriver)}</h2>
                            <p className="text-slate-500 text-sm hidden md:block">Manage your work and profile</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-orange-600 hover:border-orange-200 transition-all relative">
                            <Bell size={20} />
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-bold border-2 border-white shadow-sm">
                            {user?.name?.[0]}
                        </div>
                    </div>
                </header>

                <div className="max-w-6xl mx-auto">
                    {activeTab === 'overview' && <StaffOverview isDriver={isDriver} schoolName={schoolName} />}
                    {activeTab === 'attendance' && <StaffMyAttendance />}

                    {/* Unified Transport View */}
                    {activeTab === 'transport' && (
                        isDriver ? (
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
                        ) : (
                            <StaffTransportView profile={staffProfile} />
                        )
                    )}

                    {activeTab === 'salary' && <StaffSalarySlips />}
                    {activeTab === 'announcements' && <ViewAnnouncements />}
                    {activeTab === 'calendar' && <SchoolCalendar />}
                </div>
            </main>
        </div>
    );
};

// --- Sub Components ---

const StaffOverview = ({ isDriver, schoolName }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-full mb-6">
            <div className="overflow-hidden w-full bg-white/50 rounded-xl p-3 border border-slate-100 shadow-inner">
                <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 animate-marquee-fast uppercase tracking-widest font-serif italic drop-shadow-sm">
                    {schoolName}
                </h3>
            </div>
            <p className="text-slate-500 text-sm mt-2 ml-1">{isDriver ? 'Driver Dashboard' : 'Staff Dashboard'}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-500 mb-1">Attendance</h3>
            <div className="text-3xl font-bold text-slate-800">92%</div>
            <div className="text-xs text-emerald-500 mt-2 font-bold">Excellent</div>
        </div>
    </div>
);

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

const StaffTransportView = ({ profile }) => (
    <div className="space-y-6 animate-in fade-in">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                <Bus className="text-orange-600" /> Transport Allocation
            </h3>

            {profile?.transport_route_id ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex flex-col justify-between">
                        <div>
                            <div className="text-xs text-slate-500 font-bold uppercase mb-2">Route Details</div>
                            <div className="text-xl font-bold text-slate-800">{profile.route_name}</div>
                            {profile.pickup_point && (
                                <div className="text-sm font-medium text-orange-600 mt-1 flex items-center gap-1">
                                    <MapPin size={14} /> Stop: {profile.pickup_point}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                        <div className="text-xs text-slate-500 font-bold uppercase mb-2">Vehicle Info</div>
                        <div className="text-lg font-bold text-slate-800">{profile.vehicle_number}</div>
                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <div className="text-xs text-slate-400 font-bold uppercase mb-1">Driver</div>
                            <div className="text-sm font-bold text-slate-700">{profile.driver_name}</div>
                            <div className="text-sm font-mono text-slate-500">{profile.driver_phone}</div>
                        </div>
                    </div>

                    <div className="col-span-full">
                        <TeacherTransportMap vehicle={profile} />
                    </div>
                </div>
            ) : (
                <div className="h-48 bg-slate-50 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 text-center p-6">
                    <div className="bg-white p-3 rounded-full mb-3 shadow-sm">
                        <Bus size={24} className="text-slate-300" />
                    </div>
                    <h4 className="text-slate-500 font-bold">No Transport Assigned</h4>
                    <p className="text-slate-400 text-sm mt-1 max-w-xs">You have not subscribed to school transport or no route has been allocated yet.</p>
                </div>
            )}
        </div>
    </div>
);

// Helper Component
const NavButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm mb-1 ${active ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
    >
        <Icon size={18} />
        {label}
    </button>
);

const getTabTitle = (tab, isDriver) => {
    switch (tab) {
        case 'overview': return isDriver ? 'Driver Dashboard' : 'Staff Dashboard';

        case 'attendance': return 'Attendance History';
        case 'transport': return isDriver ? 'Trip Tracking' : 'Track My School Bus';
        case 'salary': return 'Salary & Payslips';
        case 'calendar': return 'Academic Calendar';
        default: return 'Dashboard';
    }
};

export default StaffDashboard;
