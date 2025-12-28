import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// Create custom bus icon
const createBusIcon = () => {
    return L.divIcon({
        className: 'custom-bus-icon',
        html: `<div style="background-color: #4f46e5; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M8 6v6"></path><path d="M15 6v6"></path><path d="M2 12h19.6"></path><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path><circle cx="7" cy="18" r="2"></circle><path d="M9 18h5"></path><circle cx="17" cy="18" r="2"></circle>
                </svg>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
    });
};

const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.flyTo([lat, lng], map.getZoom());
        }
    }, [lat, lng, map]);
    return null;
};

const LiveMap = ({ vehicles, routes }) => {
    // Default center (Bangalore approx)
    const defaultCenter = [12.9716, 77.5946];
    const [liveVehicles, setLiveVehicles] = useState(vehicles);
    const [simulationEnabled, setSimulationEnabled] = useState(false);

    // Simulate live movement (Only if enabled)
    useEffect(() => {
        if (!simulationEnabled) return;

        const interval = setInterval(async () => {
            const newVehicles = [...liveVehicles];
            let updated = false;

            for (let v of newVehicles) {
                if (v.status === 'Active' && v.current_lat && v.current_lng) {
                    // Move by approx 10-20 meters
                    const latChange = (Math.random() - 0.5) * 0.001;
                    const lngChange = (Math.random() - 0.5) * 0.001;
                    v.current_lat = parseFloat(v.current_lat) + latChange;
                    v.current_lng = parseFloat(v.current_lng) + lngChange;
                    updated = true;
                }
            }
            if (updated) setLiveVehicles(newVehicles);
        }, 1000);

        return () => clearInterval(interval);
    }, [simulationEnabled, liveVehicles]);

    // Poll for real updates (Mobile or GPS Hardware) from server every 5 seconds
    useEffect(() => {
        if (simulationEnabled) return; // Don't poll if simulating to avoid overwriting

        const interval = setInterval(async () => {
            try {
                const res = await api.get('/transport/vehicles');
                setLiveVehicles(res.data);
            } catch (err) {
                console.error("Failed to poll vehicle locations", err);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [simulationEnabled]);

    // Update local state when props change
    useEffect(() => {
        setLiveVehicles(vehicles);
    }, [vehicles]);

    const activeVehicles = liveVehicles.filter(v => v.current_lat && v.current_lng);
    const center = activeVehicles.length > 0 ? [activeVehicles[0].current_lat, activeVehicles[0].current_lng] : defaultCenter;

    return (
        <div className="w-full h-full relative">
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                />
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                />

                {activeVehicles.map(vehicle => (
                    <Marker
                        key={vehicle.id}
                        position={[vehicle.current_lat, vehicle.current_lng]}
                        icon={createBusIcon()}
                    >
                        <Popup>
                            <div className="text-sm">
                                <strong className="block text-indigo-700 text-lg mb-1">{vehicle.vehicle_number}</strong>
                                <div className="text-slate-600 mb-2">{vehicle.vehicle_model}</div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                                    <div className="font-bold">Driver:</div>
                                    <div>{vehicle.driver_name}</div>
                                </div>
                                <div className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    {simulationEnabled ? 'Simulated Movement' : 'Live Tracking Active'}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

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
                            <span className="text-slate-500">Active Buses</span>
                            <span className="font-bold text-slate-800">{activeVehicles.length}</span>
                        </div>
                        <div className="flex justify-between">
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
        </div>
    );
};

export default LiveMap;
