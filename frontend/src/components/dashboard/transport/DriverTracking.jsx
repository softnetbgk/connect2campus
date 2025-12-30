import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Bus, Navigation, StopCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
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
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [isTracking, setIsTracking] = useState(false);
    const [lastPosition, setLastPosition] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [watchId, setWatchId] = useState(null);
    const [error, setError] = useState(null);
    const wakeLockRef = useRef(null);

    useEffect(() => {
        fetchVehicles();
        return () => stopTracking(); // Cleanup on unmount
    }, []);

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

    const startTracking = () => {
        if (!selectedVehicle) return toast.error('Please select a vehicle first');
        if (!navigator.geolocation) return toast.error('Geolocation is not supported by your browser');

        setIsTracking(true);
        requestWakeLock();
        toast.success('Tracking Started - Keep this screen open');

        const id = navigator.geolocation.watchPosition(
            async (position) => {
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
            },
            (err) => {
                console.error(err);
                if (err.code === 1) {
                    setError('PERMISSION_DENIED');
                    toast.error('Location Access Denied. Please enable GPS in browser settings.');
                } else if (err.code === 2) {
                    setError('POSITION_UNAVAILABLE');
                    toast.error('GPS Signal Weak or Unavailable.');
                } else if (err.code === 3) {
                    setError('TIMEOUT');
                    toast.error('Location request timed out.');
                } else {
                    setError('UNKNOWN_ERROR');
                    toast.error('GPS Error: ' + err.message);
                }
                setIsTracking(false);
                if (watchId) navigator.geolocation.clearWatch(watchId);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
        setWatchId(id);
    };

    const stopTracking = () => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
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
        <div className="p-4 max-w-md mx-auto min-h-screen bg-slate-50">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-indigo-600 p-6 text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                        <Navigation size={32} />
                    </div>
                    <h1 className="text-xl font-bold">Driver Live Tracking</h1>
                    <p className="text-indigo-100 text-sm mt-1">Turn your phone into a GPS tracker</p>
                </div>

                <div className="p-6 space-y-6">
                    {!isTracking && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Select Vehicle</label>
                                <select
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-700"
                                    value={selectedVehicle}
                                    onChange={e => setSelectedVehicle(e.target.value)}
                                >
                                    <option value="">-- Choose Bus/Vehicle --</option>
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.vehicle_number} ({v.driver_name || 'No Driver'})</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={startTracking}
                                disabled={!selectedVehicle}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                Start Live Tracking
                            </button>
                        </div>
                    )}

                    {isTracking && (
                        <div className="space-y-6 animate-in fade-in zoom-in-95">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                <div className="animate-pulse flex items-center justify-center gap-2 text-green-700 font-bold mb-1">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    LIVE - Tracking Active
                                </div>
                                <p className="text-xs text-green-600">
                                    Last Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Waiting...'}
                                </p>
                            </div>

                            {lastPosition && (
                                <div className="h-64 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner not-prose relative z-0">
                                    <MapContainer
                                        center={lastPosition}
                                        zoom={15}
                                        style={{ height: '100%', width: '100%' }}
                                        scrollWheelZoom={false}
                                        dragging={false}
                                    >
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <RecenterMap lat={lastPosition[0]} lng={lastPosition[1]} />
                                        <Marker position={lastPosition}>
                                            <Popup>You are here</Popup>
                                        </Marker>
                                    </MapContainer>
                                </div>
                            )}

                            {error === 'PERMISSION_DENIED' && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-slate-800 space-y-4">
                                    <div className="flex items-center gap-2 text-red-600 font-bold">
                                        <AlertTriangle size={20} /> Permission Denied
                                    </div>
                                    <p className="text-sm">To track this bus, you must allow location access. Please follow these steps:</p>
                                    <div className="text-xs space-y-3">
                                        <div className="p-3 bg-white rounded-lg border border-red-100">
                                            <p className="font-bold text-slate-700 underline mb-1">Android / Chrome:</p>
                                            <p>Tap the 🔒 (lock) icon next to the website address {'\u2192'} Select <b>"Permissions"</b> {'\u2192'} Turn on <b>"Location"</b>.</p>
                                        </div>
                                        <div className="p-3 bg-white rounded-lg border border-red-100">
                                            <p className="font-bold text-slate-700 underline mb-1">iPhone / Safari:</p>
                                            <p>Go to <b>Settings</b> {'\u2192'} <b>Privacy</b> {'\u2192'} <b>Location Services</b> {'\u2192'} <b>Safari</b> {'\u2192'} Select <b>"While Using the App"</b>.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-bold mt-2"
                                    >
                                        Try Again / Reload Page
                                    </button>
                                </div>
                            )}

                            {error && error !== 'PERMISSION_DENIED' && (
                                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm font-medium">
                                    <AlertTriangle size={18} /> {error}
                                </div>
                            )}

                            <button
                                onClick={stopTracking}
                                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <StopCircle size={24} /> Stop Tracking
                            </button>

                            <p className="text-center text-xs text-slate-400">
                                Keep this screen active. Screen wake lock is active to prevent sleep.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriverTracking;
