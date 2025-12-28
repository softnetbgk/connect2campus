import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// Internal component to fit bounds
const FitBounds = ({ vehicles }) => {
    const map = useMap();
    useEffect(() => {
        if (vehicles.length > 0) {
            const bounds = L.latLngBounds(vehicles.map(v => [v.lat, v.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [vehicles, map]);
    return null;
};

const AdminLiveMap = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initial Fetch
    const fetchData = async () => {
        try {
            // We fetch routes because routes contain the updated vehicle locations mostly
            // But better to fetch vehicles directly if possible. 
            // In our backend, both /vehicles and /routes return location data.
            // Let's use /vehicles as it lists ALL vehicles, even those not strictly on a route.
            const res = await api.get('/transport/vehicles');

            // Filter only vehicles that have valid lat/lng
            const activeVehicles = res.data
                .filter(v => v.current_lat && v.current_lng)
                .map(v => ({
                    id: v.id,
                    lat: parseFloat(v.current_lat),
                    lng: parseFloat(v.current_lng),
                    number: v.vehicle_number,
                    driver: v.driver_name,
                    status: v.status || 'Active'
                }));

            setVehicles(activeVehicles);
        } catch (error) {
            console.error("Failed to load map data", error);
        } finally {
            setLoading(false);
        }
    };

    // Polling every 5 seconds
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
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
                <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                    Auto-updating every 5s
                </div>
            </div>

            <div className="flex-1 rounded-2xl overflow-hidden border border-slate-300 shadow-xl relative z-0 min-h-[500px]">
                {loading && vehicles.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <p className="text-slate-400 font-bold animate-pulse">Establishing Satellite Link...</p>
                    </div>
                ) : (
                    <MapContainer
                        center={vehicles.length > 0 ? [vehicles[0].lat, vehicles[0].lng] : defaultCenter}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                    >
                        {/* Satellite Layer */}
                        <TileLayer
                            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />

                        {/* Optional: Add labels overlay for better context on satellite map */}
                        <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                        />

                        {vehicles.map(v => (
                            <Marker key={v.id} position={[v.lat, v.lng]}>
                                <Popup>
                                    <div className="p-1">
                                        <div className="font-bold text-indigo-700 flex items-center gap-1">
                                            <Bus size={14} /> {v.number}
                                        </div>
                                        <div className="text-xs text-slate-600 mt-1">Driver: {v.driver}</div>
                                        <div className="text-[10px] text-emerald-600 font-bold uppercase mt-1">Live Signal</div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        <FitBounds vehicles={vehicles} />
                    </MapContainer>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {vehicles.map(v => (
                    <div key={v.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div>
                            <div className="text-sm font-bold text-slate-800">{v.number}</div>
                            <div className="text-xs text-slate-500 truncate">{v.driver}</div>
                        </div>
                    </div>
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
