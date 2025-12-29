import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

// Recenter map when position changes
const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng]);
    }, [lat, lng, map]);
    return null;
};

const TeacherTransportMap = ({ vehicle }) => {
    // Default to School Location (e.g., Bangalore center or dummy) if no signal
    const defaultLat = 12.9716;
    const defaultLng = 77.5946;

    const lat = parseFloat(vehicle?.current_lat) || defaultLat;
    const lng = parseFloat(vehicle?.current_lng) || defaultLng;
    const hasSignal = vehicle?.current_lat && vehicle?.current_lng;

    return (
        <div className="h-80 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
            <MapContainer center={[lat, lng]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                />
                <Marker position={[lat, lng]}>
                    <Popup>
                        <div className="text-center">
                            <h3 className="font-bold text-slate-800">{vehicle?.vehicle_number}</h3>
                            <p className="text-xs text-slate-500">{hasSignal ? 'Live Signal' : 'Last Known / Default'}</p>
                        </div>
                    </Popup>
                </Marker>
                <RecenterMap lat={lat} lng={lng} />
            </MapContainer>

            {!hasSignal && (
                <div className="absolute bottom-2 left-2 right-2 bg-amber-100 text-amber-800 text-xs px-3 py-2 rounded-lg border border-amber-200 text-center z-[1000] font-bold opacity-90">
                    Signal lost or not yet tracking. Showing default location.
                </div>
            )}
        </div>
    );
};

export default TeacherTransportMap;
