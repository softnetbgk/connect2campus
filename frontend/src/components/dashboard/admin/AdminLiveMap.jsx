import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Ensure CSS is imported
import L from 'leaflet';
import api from '../../../api/axios';
import { Bus, Navigation } from 'lucide-react';

// Fix Leaflet Default Icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Create custom bus icon - Identical to Student/Transport Map for consistency
const createBusIcon = () => {
    return L.divIcon({
        className: 'custom-bus-icon',
        html: `<div style="background-color: #fbbf24; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #000; box-shadow: 0 4px 10px rgba(0,0,0,0.3); position: relative;">
                <div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #000;"></div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M8 6v6"></path><path d="M15 6v6"></path><path d="M2 12h19.6"></path><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path><circle cx="7" cy="18" r="2"></circle><path d="M9 18h5"></path><circle cx="17" cy="18" r="2"></circle>
                </svg>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 48], // Tip of the triangle at bottom
        popupAnchor: [0, -48],
    });
};


// Internal component to fit bounds
const FitBounds = ({ vehicles }) => {
    const map = useMap();
    const [fitted, setFitted] = useState(false);

    useEffect(() => {
        if (!fitted && vehicles.length > 0) {
            const validVehicles = vehicles.filter(v => v.lat && v.lng);
            if (validVehicles.length > 0) {
                const bounds = L.latLngBounds(validVehicles.map(v => [v.lat, v.lng]));
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
                setFitted(true);
            }
        }
        // Fix for grey tiles on first load
        map.invalidateSize();
    }, [vehicles, map, fitted]);
    return null;
};

// Controller to handle external focus requests
const MapController = ({ focusTarget }) => {
    const map = useMap();
    useEffect(() => {
        if (focusTarget) {
            map.flyTo([focusTarget.lat, focusTarget.lng], 16, { animate: true, duration: 1.5 });
        }
    }, [focusTarget, map]);
    return null;
};

const AdminLiveMap = () => {
    const [vehicles, setVehicles] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [focusTarget, setFocusTarget] = useState(null);

    // Initial Fetch
    const fetchData = async () => {
        try {
            const res = await api.get('/transport/vehicles');

            const allVehicles = res.data.map(v => ({
                id: v.id,
                lat: v.current_lat ? parseFloat(v.current_lat) : null,
                lng: v.current_lng ? parseFloat(v.current_lng) : null,
                number: v.vehicle_number,
                driver: v.driver_name,
                status: v.status || 'Active',
                isLive: !!(v.current_lat && v.current_lng)
            }));

            // Only update if data changed to avoid re-renders? 
            // Better to just set it to ensure latest positions are reflected
            // Fetch Routes
            const routesRes = await api.get('/transport/routes');
            setRoutes(routesRes.data);

            setVehicles(allVehicles);
        } catch (error) {
            console.error("Failed to load map data", error);
        } finally {
            setLoading(false);
        }
    };

    // Polling every 3 seconds for smoother updates
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    // Default center (Bangalore/India generic) if no vehicles found
    const defaultCenter = [12.9716, 77.5946];

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Navigation className="text-indigo-600" /> Live Fleet Tracking
                </h2>
                <div className="flex gap-4">
                    <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        Live Signal: {vehicles.filter(v => v.isLive).length}
                    </div>
                    <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                        Total Fleet: {vehicles.length}
                    </div>
                    <div className="text-xs font-bold text-indigo-500 bg-white px-3 py-1 rounded-full border border-indigo-200">
                        Auto-updating every 3s
                    </div>
                </div>
            </div>

            <div className="flex-1 rounded-2xl overflow-hidden border border-slate-300 shadow-xl relative z-0 min-h-[500px]">
                {loading && vehicles.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <p className="text-slate-400 font-bold animate-pulse">Establishing Satellite Link...</p>
                    </div>
                ) : (
                    <MapContainer
                        center={vehicles.find(v => v.isLive) ? [vehicles.find(v => v.isLive).lat, vehicles.find(v => v.isLive).lng] : defaultCenter}
                        zoom={13}
                        style={{ height: '600px', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <MapController focusTarget={focusTarget} />

                        {vehicles.filter(v => v.isLive).map(v => (
                            <Marker key={v.id} position={[v.lat, v.lng]} icon={createBusIcon()}>
                                <Popup>
                                    <div className="py-2 px-1 min-w-[140px] text-center">
                                        <div className="font-black text-slate-800 text-lg flex justify-center items-center gap-2 mb-1">
                                            {v.number}
                                        </div>
                                        <div className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 p-1.5 rounded mb-2">Driver: {v.driver}</div>
                                        <div className="text-[10px] text-emerald-600 font-black uppercase tracking-wider flex items-center justify-center gap-1 animate-pulse">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                            Live Signal Active
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {/* Render Route Lines */}
                        {routes && routes.map(route => {
                            const positions = (route.stops || [])
                                .filter(s => s.lat && s.lng)
                                .map(s => [parseFloat(s.lat), parseFloat(s.lng)]);

                            if (positions.length < 2) return null;

                            // Create markers for stops
                            const stopMarkers = (route.stops || [])
                                .filter(s => s.lat && s.lng)
                                .map((s, idx) => (
                                    <CircleMarker
                                        key={`stop-${route.id}-${idx}`}
                                        center={[parseFloat(s.lat), parseFloat(s.lng)]}
                                        pathOptions={{ color: '#4f46e5', fillColor: 'white', fillOpacity: 1, radius: 5 }}
                                    >
                                        <Popup>
                                            <div className="text-xs">
                                                <div className="font-bold text-indigo-700">{s.stop_name}</div>
                                                <div className="text-slate-500">{s.pickup_time || 'No time'}</div>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                ));

                            return (
                                <React.Fragment key={`route-group-${route.id}`}>
                                    <Polyline
                                        positions={positions}
                                        pathOptions={{ color: '#4f46e5', weight: 4, opacity: 0.6 }}
                                    >
                                        <Popup>
                                            <div className="min-w-[150px]">
                                                <div className="text-sm font-bold text-indigo-700 border-b border-indigo-100 pb-1 mb-1">
                                                    Route: {route.route_name}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    <div>From: <span className="font-medium text-slate-700">{route.start_point}</span></div>
                                                    <div>To: <span className="font-medium text-slate-700">{route.end_point}</span></div>
                                                    <div className="mt-1 font-mono text-[10px] bg-slate-50 p-1 rounded">
                                                        {route.stops.length} Stops
                                                    </div>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Polyline>
                                    {/* Render stop markers directly on map? Or maybe just circle markers? Leaflet CircleMarker is not exported as component usually in older react-leaflet but CircleMarker is. Let's check imports. I need to add CircleMarker to imports. */}
                                    {stopMarkers}
                                </React.Fragment>
                            );
                        })}

                        <FitBounds vehicles={vehicles.filter(v => v.isLive)} />
                    </MapContainer>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {vehicles.map(v => (
                    <button
                        key={v.id}
                        onClick={() => v.isLive && setFocusTarget({ lat: v.lat, lng: v.lng, id: v.id })}
                        disabled={!v.isLive}
                        className={`p-3 rounded-xl border shadow-sm flex items-center gap-3 transition-all ${!v.isLive ? 'opacity-60 bg-slate-50 cursor-not-allowed grayscale' : focusTarget?.id === v.id ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-300 active:scale-95'}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${v.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                        <div className="text-left overflow-hidden w-full">
                            <div className="text-sm font-bold text-slate-800 truncate">{v.number}</div>
                            <div className="text-xs text-slate-500 truncate">{v.isLive ? v.driver : 'Offline / No Signal'}</div>
                        </div>
                    </button>
                ))}
                {vehicles.length === 0 && !loading && (
                    <div className="col-span-full text-center text-slate-400 text-sm py-4 italic">
                        No active vehicles found on the network.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLiveMap;
