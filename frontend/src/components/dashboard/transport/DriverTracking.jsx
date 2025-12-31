import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Bus, Navigation, StopCircle, RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], map.getZoom());
    }, [lat, lng, map]);
    return null;
};

const DriverTracking = () => {
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [isTracking, setIsTracking] = useState(false);
    const [lastPosition, setLastPosition] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [watchId, setWatchId] = useState(null);
    const [error, setError] = useState(null);
    const wakeLockRef = useRef(null);

    const [isMobileApp, setIsMobileApp] = useState(false);

    // Detect if running in native app
    useEffect(() => {
        const checkMobile = () => {
            if (Capacitor.isNativePlatform()) {
                setIsMobileApp(true);
                return;
            }
            const params = new URLSearchParams(window.location.search);
            if (params.get('is_mobile_app') === 'true' || localStorage.getItem('is_mobile_app') === 'true') {
                setIsMobileApp(true);
            }
        };
        checkMobile();
        fetchVehicles();
        return () => stopTracking(); // Cleanup on unmount
    }, []);

    useEffect(() => {
        if (isMobileApp) {
            checkPermissions();
        }
    }, [isMobileApp]);

    const checkPermissions = async () => {
        try {
            const perm = await Geolocation.checkPermissions();
            if (perm.location !== 'granted') {
                await Geolocation.requestPermissions();
            }
        } catch (err) {
            console.error('Permission check failed', err);
        }
    };

    const fetchVehicles = async () => {
        try {
            const res = await api.get('/transport/vehicles');
            setVehicles(res.data);
        } catch (error) {
            toast.error('Failed to load vehicles');
        }
    };

    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
            }
        } catch (err) {
            console.error('Wake Lock failed:', err);
        }
    };

    const startTracking = async () => {
        if (!selectedVehicle) return toast.error('Please select a vehicle first');

        try {
            if (isMobileApp) { // Use isMobileApp here
                const perm = await Geolocation.checkPermissions();
                if (perm.location !== 'granted') {
                    const req = await Geolocation.requestPermissions();
                    if (req.location !== 'granted') {
                        setError('PERMISSION_DENIED');
                        return;
                    }
                }
            } else if (!navigator.geolocation) {
                return toast.error('Geolocation is not supported by your browser');
            }

            setIsTracking(true);
            requestWakeLock();
            toast.success('Tracking Started - Keep this screen open');

            const id = await Geolocation.watchPosition(
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                },
                async (position, err) => {
                    if (err) {
                        console.error('Watch error', err);
                        handleGpsError(err);
                        return;
                    }
                    if (position) {
                        const { latitude, longitude } = position.coords;
                        setLastPosition([latitude, longitude]);
                        setLastUpdated(new Date());
                        setError(null);

                        // Send update to server
                        try {
                            await api.put(`/transport/vehicles/${selectedVehicle}/location`, {
                                lat: latitude,
                                lng: longitude
                            });
                        } catch (err) {
                            console.error('Failed to sync location', err);
                            setError('Failed to sync with server');
                        }
                    }
                }
            );
            setWatchId(id);
        } catch (err) {
            console.error('Start tracking failed', err);
            handleGpsError(err);
        }
    };

    // Handle App State changes (Call, Backgrounding)
    useEffect(() => {
        if (!isMobileApp) return;

        const handleResume = () => {
            if (isTracking) {
                console.log('App resumed, refreshing tracking...');
                toast.success('System Resumed - GPS Tracking Active', { icon: '✅' });
            }
        };

        const handlePause = () => {
            if (isTracking) {
                toast('Tracking in background - Try to keep app visible', {
                    icon: '⚠️',
                    duration: 3000
                });
            }
        };

        document.addEventListener('resume', handleResume);
        document.addEventListener('pause', handlePause);

        return () => {
            document.removeEventListener('resume', handleResume);
            document.removeEventListener('pause', handlePause);
        };
    }, [isTracking, isApp]);

    const handleGpsError = (err) => {
        const code = err.code || (err.message && err.message.includes('denied') ? 1 : 0);
        if (code === 1 || err.message?.toLowerCase().includes('denied')) {
            setError('PERMISSION_DENIED');
            toast.error('Location Access Denied. Please enable GPS in app settings.');
        } else if (code === 2 || err.message?.toLowerCase().includes('unavailable')) {
            setError('POSITION_UNAVAILABLE');
            toast.error('GPS Signal Weak or Unavailable.');
        } else if (code === 3 || err.message?.toLowerCase().includes('timeout')) {
            setError('TIMEOUT');
            toast.error('Location request timed out.');
        } else {
            setError('UNKNOWN_ERROR');
            toast.error('GPS Error: ' + (err.message || 'Please check your device GPS.'));
        }
        setIsTracking(false);
    };

    const stopTracking = async () => {
        if (watchId !== null) {
            try {
                await Geolocation.clearWatch({ id: watchId });
            } catch (err) {
                console.error('Clear watch failed', err);
            }
            setWatchId(null);
        }
        if (wakeLockRef.current) {
            wakeLockRef.current.release();
            wakeLockRef.current = null;
        }
        setIsTracking(false);
        toast.dismiss();
        toast('Tracking Stopped', { icon: '🛑' });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative">
            {/* FIXED HEADER - Force on top of everything */}
            <header className="fixed top-0 left-0 right-0 bg-indigo-600 text-white z-[999] shadow-2xl safe-area-top pb-3 px-4 transition-all">
                <div className="h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 p-3 -ml-2 bg-white/20 rounded-2xl hover:bg-white/30 active:scale-90 border border-white/40 shadow-lg text-white font-black"
                    >
                        <ArrowLeft size={24} strokeWidth={3} />
                        <span className="text-sm uppercase tracking-tighter">BACK</span>
                    </button>
                    <div className="flex flex-col items-end opacity-90">
                        <h1 className="text-[10px] font-black tracking-widest leading-none uppercase text-white drop-shadow-sm">Connect to Campus</h1>
                        <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-[0.2em] mt-1.5 underline decoration-indigo-400/50">Driver Mode</p>
                    </div>
                </div>
            </header>

            {/* Content Area - Added more top padding to clear the FIXED header */}
            <main className="p-4 flex-1 pt-[calc(6rem+var(--sat))] overflow-y-auto">
                <div className="max-w-md mx-auto space-y-4">
                    {isTracking && (
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full py-4 bg-white text-indigo-600 border-2 border-indigo-500/20 rounded-2xl font-black text-xs shadow-md flex items-center justify-center gap-2 animate-bounce mt-2 uppercase tracking-widest"
                        >
                            <ArrowLeft size={16} strokeWidth={3} /> Back to Dashboard
                        </button>
                    )}

                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden ring-4 ring-slate-100/50">
                        <div className="bg-slate-900 p-10 text-white text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse"></div>
                            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-2xl border-4 border-white/5 relative z-10">
                                <Bus size={40} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-black italic tracking-tighter relative z-10">TRIP TRACKER</h2>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-3 opacity-80 relative z-10">Live Broadcasting</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {!isTracking && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700">
                                        <p className="text-sm font-bold flex items-center gap-2">
                                            <Navigation size={18} /> Ready to start the trip?
                                        </p>
                                        <p className="text-xs mt-1 opacity-80 text-indigo-600 font-medium">Please select your vehicle from the list below to begin broadcasting your location.</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Assigned Vehicle</label>
                                        <select
                                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-slate-800 transition-all shadow-sm"
                                            value={selectedVehicle}
                                            onChange={e => setSelectedVehicle(e.target.value)}
                                        >
                                            <option value="">-- Choose Bus/Vehicle --</option>
                                            {vehicles.map(v => (
                                                <option key={v.id} value={v.id}>{v.vehicle_number} ({v.driver_name || 'Driver'})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        onClick={startTracking}
                                        disabled={!selectedVehicle}
                                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/30 transition-all disabled:opacity-30 disabled:scale-100 disabled:shadow-none uppercase tracking-wider"
                                    >
                                        Start Live Tracking
                                    </button>
                                </div>
                            )}

                            {isTracking && (
                                <div className="space-y-6">
                                    <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-5 text-center shadow-inner">
                                        <div className="animate-pulse flex items-center justify-center gap-2 text-emerald-700 font-black mb-1 uppercase tracking-tighter">
                                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                            LIVE: TRACKING ACTIVE
                                        </div>
                                        <p className="text-[10px] text-emerald-600 font-bold">
                                            Last Sync: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Connecting...'}
                                        </p>
                                    </div>

                                    {lastPosition && (
                                        <div className="h-64 bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-lg relative">
                                            <MapContainer
                                                center={lastPosition}
                                                zoom={15}
                                                style={{ height: '100%', width: '100%' }}
                                                scrollWheelZoom={false}
                                                zoomControl={false}
                                                dragging={false}
                                            >
                                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                <RecenterMap lat={lastPosition[0]} lng={lastPosition[1]} />
                                                <Marker position={lastPosition}>
                                                    <Popup>Broadcasting Location</Popup>
                                                </Marker>
                                            </MapContainer>
                                            <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/5 rounded-2xl"></div>
                                        </div>
                                    )}

                                    {error === 'PERMISSION_DENIED' && (
                                        <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 text-slate-800 space-y-4">
                                            <div className="flex items-center gap-2 text-red-600 font-black uppercase tracking-tighter">
                                                <AlertTriangle size={22} className="animate-bounce" /> ENABLE GPS PERMISSION
                                            </div>
                                            <div className="text-xs space-y-4">
                                                <div className="p-3 bg-white rounded-xl shadow-sm border border-red-50">
                                                    <p className="font-bold text-slate-700 underline mb-2">Instructions:</p>
                                                    <ol className="list-decimal list-inside space-y-2 text-slate-600 font-medium">
                                                        <li>Long press the <b>School App</b> icon</li>
                                                        <li>Select <b>"App Info"</b> or <b>ⓘ</b></li>
                                                        <li>Go to <b>"Permissions"</b></li>
                                                        <li>Allow <b>"Location"</b> (Always)</li>
                                                    </ol>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => window.location.reload()}
                                                className="w-full py-3 bg-red-600 text-white rounded-xl text-sm font-black shadow-lg"
                                            >
                                                FIXED? RELOAD APP
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={stopTracking}
                                        className="w-full py-5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-red-500/30 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase"
                                    >
                                        <StopCircle size={28} /> Stop Tracking
                                    </button>

                                    <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
                                        <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                            ⚠️ KEEP THIS SCREEN OPEN<br />
                                            WAKE LOCK IS PREVENTING SLEEP
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {!isTracking && (
                        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pb-8">
                            Version 1.2.0 • Secured GPS Link
                        </p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DriverTracking;
