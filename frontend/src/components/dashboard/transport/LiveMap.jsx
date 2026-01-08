import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Bus, Navigation } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import api from '../../../api/axios';

// Fix for default Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: null,
    iconUrl: null,
    shadowUrl: null,
});

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

const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.setView([lat, lng], 14);
            map.invalidateSize(); // Fix for gray tiles issues
        }
    }, [lat, lng, map]);
    return null;
};

const LiveMap = ({ vehicles, routes }) => {
    const defaultCenter = [12.9716, 77.5946];
    const [liveVehicles, setLiveVehicles] = useState(vehicles);
    const [simulationEnabled, setSimulationEnabled] = useState(false);

    // Simulate live movement
    useEffect(() => {
        if (!simulationEnabled) return;
        const interval = setInterval(() => {
            setLiveVehicles(prev => prev.map(v => {
                if (v.status === 'Active' && v.current_lat && v.current_lng) {
                    return {
                        ...v,
                        current_lat: parseFloat(v.current_lat) + (Math.random() - 0.5) * 0.001,
                        current_lng: parseFloat(v.current_lng) + (Math.random() - 0.5) * 0.001
                    };
                }
                return v;
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, [simulationEnabled]);

    // Poll for real updates
    useEffect(() => {
        if (simulationEnabled) return;

        const fetchLocations = async () => {
            try {
                const res = await api.get('/transport/vehicles');
                // Only update if we have data to avoid flickering
                if (res.data && res.data.length > 0) {
                    setLiveVehicles(res.data);
                }
            } catch (err) {
                console.error("Failed to poll vehicle locations", err);
            }
        };

        fetchLocations(); // Initial fetch
        const interval = setInterval(fetchLocations, 3000); // 3s poll
        return () => clearInterval(interval);
    }, [simulationEnabled]);

    // Update local state when props change, but don't overwrite if we have newer polled data?
    // Actually, simple sync is fine as props usually don't change often.
    useEffect(() => {
        if (vehicles && vehicles.length > 0) {
            // Check if we have fresher data in state, if not, update.
            // For simplicity, we just accept props updates as they likely come from full refreshes.
            // But usually polling handles it. We can ignore this or merge.
            // Let's just set it to handle initial load.
            setLiveVehicles(prev => {
                return (prev.length === 0) ? vehicles : prev;
            });
        }
    }, [vehicles]);

    const activeVehicles = liveVehicles.filter(v => {
        const lat = parseFloat(v.current_lat);
        const lng = parseFloat(v.current_lng);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 && (v.status === 'Active' || v.status === 'On Route');
    });

    const center = activeVehicles.length > 0
        ? [parseFloat(activeVehicles[0].current_lat), parseFloat(activeVehicles[0].current_lng)]
        : defaultCenter;

    return (
        <div className="w-full h-full relative">
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />

                {activeVehicles.map(vehicle => (
                    <Marker
                        key={vehicle.id}
                        position={[parseFloat(vehicle.current_lat), parseFloat(vehicle.current_lng)]}
                        icon={createBusIcon()}
                    >
                        <Popup>
                            <div className="text-sm min-w-[150px]">
                                <strong className="block text-indigo-700 text-lg mb-1">{vehicle.vehicle_number}</strong>
                                <div className="text-slate-600 mb-2 font-medium">{vehicle.vehicle_model}</div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 mb-2">
                                    <div className="font-bold">Driver:</div>
                                    <div>{vehicle.driver_name}</div>
                                </div>
                                <div className="text-xs text-emerald-600 font-bold flex items-center gap-2 bg-emerald-50 p-1.5 rounded border border-emerald-100">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    {simulationEnabled ? 'Simulating...' : 'Tracking Active'}
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

                    return (
                        <Polyline
                            key={`route-${route.id}`}
                            positions={positions}
                            pathOptions={{ color: '#4f46e5', weight: 4, opacity: 0.6 }}
                        >
                            <Popup>
                                <div className="text-xs font-bold text-indigo-700">
                                    Route: {route.route_name}
                                </div>
                            </Popup>
                        </Polyline>
                    );
                })}

                <RecenterMap lat={center[0]} lng={center[1]} />
            </MapContainer>

            {/* Overlay Statistics */}
            <div className="absolute top-4 right-4 z-[400] bg-white p-4 rounded-xl shadow-lg border border-slate-200 w-72">
                <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Navigation size={16} className="text-indigo-600" /> Live Status
                </h4>
                <div className="space-y-4 text-sm">
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-slate-500">Live Buses</span>
                            <span className="font-bold text-emerald-600">{activeVehicles.length}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span className="text-slate-500">Total Fleet</span>
                            <span className="font-bold text-slate-800">{liveVehicles.length}</span>
                        </div>
                    </div>    <div className="flex justify-between">
                        <span className="text-slate-500">Total Routes</span>
                        <span className="font-bold text-slate-800">{routes.length}</span>
                    </div>
                </div>

                {/* Simulation Toggle */}
                <div className="pt-3 border-t border-slate-100">
                    <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-slate-600 font-medium text-xs">Simulate Movement</span>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input
                                type="checkbox"
                                checked={simulationEnabled}
                                onChange={e => setSimulationEnabled(e.target.checked)}
                                className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 checked:right-0 checked:border-indigo-600"
                                style={{ right: simulationEnabled ? '0' : '50%' }}
                            />
                            <label className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${simulationEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}></label>
                        </div>
                    </label>
                </div>

                {/* API Info for GPS Hardware */}
                <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                    For GPS Hardware integration, configure device to PUT location to:
                    <code className="block bg-slate-50 p-1 mt-1 rounded border border-slate-200 select-all">
                        /api/transport/vehicles/:id/location
                    </code>
                </div>
            </div>
        </div>
    );
};

export default LiveMap;
