import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Bus, Phone, Navigation, AlertCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import api from '../../../api/axios';

// Fix for default marker icon issues in React Leaflet
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

// Recenter component
const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng]);
    }, [lat, lng, map]);
    return null;
};

const StudentTransport = () => {
    const [transportInfo, setTransportInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRoute = async () => {
            try {
                const res = await api.get('/transport/my-route');
                // Map backend data to UI structure
                const data = res.data;
                setTransportInfo({
                    busNumber: data.vehicle_number || "N/A",
                    driverName: data.driver_name || "Assigned Driver",
                    driverContact: data.driver_phone || "N/A",
                    route: `${data.route_name} (${data.start_point} - ${data.end_point})`,
                    pickupTime: data.pickup_time || "N/A",
                    dropTime: data.drop_time || "N/A",
                    position: [parseFloat(data.current_lat || 12.9716), parseFloat(data.current_lng || 77.5946)],
                    pickupPoint: data.pickup_point || 'School'
                });
            } catch (err) {
                console.error("Failed to fetch transport route", err);
                setError(err.response?.data?.message || "Transport details not maintained or not assigned.");
            } finally {
                setLoading(false);
            }
        };

        fetchRoute();

        // Optional: Poll for location updates every 30s
        const interval = setInterval(fetchRoute, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading transport details...</div>;

    if (error || !transportInfo) return (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bus className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No Transport Assigned</h3>
            <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">{error || "You have not been assigned to any transport route yet. Please contact the school admin."}</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Bus className="text-indigo-600" /> My School Bus
                    </h3>
                    <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        Live Tracking
                    </div>
                </div>

                {/* Map Container */}
                <div className="h-80 w-full rounded-xl overflow-hidden border border-slate-300 z-0 relative shadow-inner">
                    <MapContainer
                        center={transportInfo.position}
                        zoom={13}
                        scrollWheelZoom={false}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                        <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                        />
                        <RecenterMap lat={transportInfo.position[0]} lng={transportInfo.position[1]} />
                        <Marker position={transportInfo.position}>
                            <Popup>
                                <div className="text-center p-1">
                                    <p className="font-bold text-indigo-700">{transportInfo.busNumber}</p>
                                    <p className="text-xs text-slate-500">Current Location</p>
                                </div>
                            </Popup>
                        </Marker>
                    </MapContainer>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 bg-slate-50 rounded-xl flex items-center gap-4 border border-slate-100">
                        <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                            <Bus size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Bus Number</p>
                            <p className="font-bold text-slate-800 text-lg">{transportInfo.busNumber}</p>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl flex items-center gap-4 border border-slate-100">
                        <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                            <Phone size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Driver Info</p>
                            <p className="font-bold text-slate-800">{transportInfo.driverName}</p>
                            <a href={`tel:${transportInfo.driverContact}`} className="text-xs text-indigo-600 font-medium hover:underline">{transportInfo.driverContact}</a>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl flex items-center gap-4 border border-slate-100">
                        <div className="bg-amber-100 p-3 rounded-full text-amber-600">
                            <Navigation size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Pickup Point</p>
                            <p className="font-bold text-slate-800 line-clamp-1" title={transportInfo.pickupPoint}>{transportInfo.pickupPoint}</p>
                            <p className="text-xs text-slate-500">Time: <span className="font-bold text-slate-700">{transportInfo.pickupTime}</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentTransport;
