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
        return () => stopTracking();
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
            if (isMobileApp) {
                const perm = await Geolocation.checkPermissions();
                if (perm.location !== 'granted') {
                    const req = await Geolocation.requestPermissions();
                    if (req.location !== 'granted') {
                        setError('PERMISSION_DENIED');
                        return;
                    }
                }
            }

            const id = await Geolocation.watchPosition(
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                },
                async (position, err) => {
                    if (err) {
                        console.error('GPS Error', err);
                        handleGpsError(err);
                        return;
                    }

                    if (position) {
                        const { latitude, longitude } = position.coords;
                        setLastPosition([latitude, longitude]);
                        setLastUpdated(new Date());
                        setError(null);
                        setIsTracking(true);
                        requestWakeLock();

                        try {
                            await api.put(`/transport/vehicles/${selectedVehicle}/location`, {
                                lat: latitude,
                                lng: longitude
                            });
                        } catch (err) {
                            console.error('Failed to sync location', err);
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

    const handleGpsError = (err) => {
        if (err.code === 1) setError('PERMISSION_DENIED');
        else toast.error('GPS Signal Weak. Trying to reconnect...');
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
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col relative">
            {/* 1. BULLETPROOF FIXED HEADER - RED BACK BUTTON */}
            <header className="fixed top-0 left-0 right-0 bg-indigo-700 text-white z-[9999] shadow-2xl safe-area-top">
                <div className="px-5 h-20 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 p-4 px-6 bg-red-600 hover:bg-red-700 rounded-2xl active:scale-95 border-2 border-white/50 shadow-2xl font-black text-sm text-white transition-all"
                    >
                        <ArrowLeft size={24} strokeWidth={4} />
                        BACK TO DASHBOARD
                    </button>
                    <div className="text-right flex flex-col items-end">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Driver Mode</span>
                            <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></div>
                        </div>
                    </div>
                </div>
            </header>

            {/* SPACER */}
            <div className="h-24 safe-area-top"></div>

            <main className="p-4 flex-1">
                <div className="max-w-md mx-auto space-y-6">

                    {/* ALERT IF TRACKING */}
                    {isTracking && (
                        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between px-6 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                                <span className="font-black text-sm">LIVE TRACKING ACTIVE</span>
                            </div>
                            <button onClick={stopTracking} className="bg-white text-emerald-700 px-3 py-1 rounded-lg font-bold text-xs">STOP</button>
                        </div>
                    )}

                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="bg-slate-900 p-10 text-white text-center relative overflow-hidden">
                            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-2xl border-4 border-white/5 relative z-10">
                                <Bus size={40} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-black italic tracking-tighter relative z-10 uppercase">Trip Monitor</h2>
                        </div>

                        <div className="p-8 space-y-6">
                            {!isTracking && (
                                <div className="space-y-6">
                                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                        <p className="text-xs text-indigo-700 font-bold uppercase tracking-wider text-center">Select your vehicle to begin</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Vehicle</label>
                                        <select
                                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-500"
                                            value={selectedVehicle}
                                            onChange={e => setSelectedVehicle(e.target.value)}
                                        >
                                            <option value="">-- Select Bus --</option>
                                            {vehicles.map(v => (
                                                <option key={v.id} value={v.id}>{v.vehicle_number} ({v.driver_name})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        onClick={startTracking}
                                        disabled={!selectedVehicle}
                                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl font-black text-xl shadow-xl shadow-indigo-500/30 transition-all disabled:opacity-30 disabled:shadow-none uppercase tracking-widest"
                                    >
                                        Start My Trip
                                    </button>
                                </div>
                            )}

                            {isTracking && (
                                <div className="space-y-6">
                                    <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-center">
                                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-1">Current Sync</p>
                                        <p className="text-xl font-black text-indigo-600">
                                            {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Establishing...'}
                                        </p>
                                    </div>

                                    {lastPosition && (
                                        <div className="h-64 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-xl">
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
                                                <Marker position={lastPosition} />
                                            </MapContainer>
                                        </div>
                                    )}

                                    <button
                                        onClick={stopTracking}
                                        className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all uppercase"
                                    >
                                        Stop Signal
                                    </button>
                                </div>
                            )}

                            {error === 'PERMISSION_DENIED' && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-red-700">
                                    <h4 className="font-black uppercase tracking-tight mb-2">GPS Restricted</h4>
                                    <p className="text-xs font-bold leading-relaxed">
                                        Please enable Location permissions in your phone settings for the School App.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DriverTracking;
