import React, { useState, useEffect } from 'react';
import { Bus, MapPin, Navigation, Plus, Edit2, Trash2, Map as MapIcon, RotateCw } from 'lucide-react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import LiveMap from './LiveMap';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationPicker = ({ onLocationSelect }) => {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng);
        },
    });
    return null;
};

const TimePicker12H = ({ value, onChange, className = "" }) => {
    const parseTime = (val) => {
        if (!val) return { hour: '12', minute: '00', period: 'AM' };
        let [h, m] = val.split(':');
        h = parseInt(h);
        const period = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return { hour: h, minute: m, period };
    };

    const handleChange = (field, val) => {
        const current = parseTime(value);
        const newState = { ...current, [field]: val };

        let h = parseInt(newState.hour);
        if (newState.period === 'PM' && h !== 12) h += 12;
        if (newState.period === 'AM' && h === 12) h = 0;

        const hStr = h.toString().padStart(2, '0');
        onChange(`${hStr}:${newState.minute}`);
    };

    const tm = parseTime(value);

    return (
        <div className={`flex gap-1 items-center ${className}`}>
            <select
                value={tm.hour}
                onChange={e => handleChange('hour', e.target.value)}
                className="p-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                    <option key={h} value={h}>{h}</option>
                ))}
            </select>
            <span className="text-slate-400">:</span>
            <select
                value={tm.minute}
                onChange={e => handleChange('minute', e.target.value)}
                className="p-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                {Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0')).map(m => (
                    <option key={m} value={m}>{m}</option>
                ))}
            </select>
            <select
                value={tm.period}
                onChange={e => handleChange('period', e.target.value)}
                className="p-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
            </select>
        </div>
    );
};

const TransportManagement = ({ initialTab }) => {
    const [activeTab, setActiveTab] = useState(initialTab || 'vehicles');

    useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);

    const [vehicles, setVehicles] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Vehicle Form State
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [vehicleForm, setVehicleForm] = useState({
        vehicle_number: '', vehicle_model: '', driver_name: '', driver_phone: '', capacity: '', gps_device_id: ''
    });

    // Driver Search State
    const [driverSearch, setDriverSearch] = useState('');
    const [driverResults, setDriverResults] = useState([]);
    const [isSearchingDriver, setIsSearchingDriver] = useState(false);

    const handleDriverSearch = async (e) => {
        const query = e.target.value;
        setDriverSearch(query);
        if (query.length > 1) {
            setIsSearchingDriver(true);
            try {
                const res = await api.get(`/staff?search=${query}`);
                setDriverResults(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsSearchingDriver(false);
            }
        } else {
            setDriverResults([]);
            setIsSearchingDriver(false);
        }
    };

    const selectDriver = (staff) => {
        setVehicleForm({
            ...vehicleForm,
            driver_name: staff.name,
            driver_phone: staff.phone
        });
        setDriverResults([]);
        setDriverSearch('');
    };

    // Route Form State
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [routeForm, setRouteForm] = useState({
        route_name: '', start_point: '', end_point: '', start_time: '', vehicle_id: ''
    });
    const [stops, setStops] = useState([{ name: '', time: '', lat: null, lng: null }]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [vRes, rRes] = await Promise.all([
                api.get('/transport/vehicles'),
                api.get('/transport/routes')
            ]);
            setVehicles(vRes.data);
            setRoutes(rRes.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load transport data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddVehicle = async () => {
        try {
            const payload = { ...vehicleForm };
            const assignRouteId = payload.assign_route_id;
            // Clean payload
            delete payload.assign_route_id;
            if (!payload.gps_device_id) delete payload.gps_device_id;

            const res = await api.post('/transport/vehicles', payload);
            const newVehicleId = res.data.vehicleId || res.data.id; // handle variation in response

            // If Route Selected, Update Route
            if (assignRouteId && newVehicleId) {
                await api.put(`/transport/routes/${assignRouteId}`, {
                    vehicle_id: newVehicleId
                });
            }

            toast.success('Vehicle added successfully');
            setShowVehicleModal(false);
            setVehicleForm({ vehicle_number: '', vehicle_model: '', driver_name: '', driver_phone: '', capacity: '', gps_device_id: '', assign_route_id: '' });
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error('Failed to add vehicle');
        }
    };

    const handleDeleteVehicle = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await api.delete(`/transport/vehicles/${id}`);
            toast.success('Vehicle deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete vehicle');
        }
    };

    const handleAddRoute = async () => {
        try {
            await api.post('/transport/routes', { ...routeForm, stops });
            toast.success('Route created successfully');
            setShowRouteModal(false);
            fetchData();
        } catch (error) {
            toast.error('Failed to create route');
        }
    };

    const handleStopChange = (index, field, value) => {
        const newStops = [...stops];
        newStops[index][field] = value;
        setStops(newStops);
    };

    const addStopField = () => {
        setStops([...stops, { name: '', time: '', lat: null, lng: null }]);
    };

    const handleMapClick = (latlng) => {
        setStops([...stops, {
            name: `Stop ${stops.length + 1}`,
            time: '',
            lat: latlng.lat,
            lng: latlng.lng
        }]);
        toast.success('Stop added from map!');
    };
    const removeStop = (index) => {
        const newStops = stops.filter((_, i) => i !== index);
        setStops(newStops);
    };

    const formatTime = (time) => {
        if (!time) return '';
        const [h, m] = time.split(':');
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        return `${h12}:${m} ${ampm}`;
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Transport Management</h2>
                    <p className="text-slate-500">Manage fleet, routes and track vehicles live</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('vehicles')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'vehicles' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600'}`}
                    >
                        <Bus className="inline-block mr-2" size={16} /> Vehicles
                    </button>
                    <button
                        onClick={() => setActiveTab('routes')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'routes' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600'}`}
                    >
                        <Navigation className="inline-block mr-2" size={16} /> Routes
                    </button>
                    <button
                        onClick={() => setActiveTab('live-map')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'live-map' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600'}`}
                    >
                        <MapIcon className="inline-block mr-2" size={16} /> Live Map
                    </button>
                </div>
            </div>

            {
                loading ? (
                    <div className="text-center py-20 text-slate-500">Loading transport data...</div>
                ) : (
                    <>
                        {activeTab === 'vehicles' && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                    <h3 className="font-bold text-slate-700">Fleet List</h3>
                                    <button
                                        onClick={() => setShowVehicleModal(true)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2"
                                    >
                                        <Plus size={16} /> Add Vehicle
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-slate-600">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-3">Vehicle No</th>
                                                <th className="px-6 py-3">Model</th>
                                                <th className="px-6 py-3">Driver</th>
                                                <th className="px-6 py-3">Capacity</th>
                                                <th className="px-6 py-3">Status</th>
                                                <th className="px-6 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {vehicles.map(vehicle => (
                                                <tr key={vehicle.id} className="bg-white border-b hover:bg-slate-50">
                                                    <td className="px-6 py-4 font-bold text-slate-800">{vehicle.vehicle_number}</td>
                                                    <td className="px-6 py-4">{vehicle.vehicle_model}</td>
                                                    <td className="px-6 py-4">
                                                        <div>{vehicle.driver_name}</div>
                                                        <div className="text-xs text-slate-500">{vehicle.driver_phone}</div>
                                                    </td>
                                                    <td className="px-6 py-4">{vehicle.capacity}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${vehicle.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                            {vehicle.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 flex gap-2">
                                                        <button onClick={() => handleDeleteVehicle(vehicle.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'routes' && (
                            <div className="space-y-6">
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setShowRouteModal(true)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                                    >
                                        <Plus size={16} /> Create New Route
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {routes.map(route => (
                                        <div key={route.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-lg text-slate-800">{route.route_name}</h3>
                                                    <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                                        <Bus size={14} /> {route.vehicle_number || 'No Vehicle Assigned'}
                                                        <span className="mx-2 text-slate-300">|</span>
                                                        <RotateCw size={14} /> {formatTime(route.start_time) || 'N/A'}
                                                    </div>
                                                </div>
                                                <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">
                                                    {route.stops?.length || 0} Stops
                                                </span>
                                            </div>
                                            <div className="space-y-3 relative">
                                                <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-slate-200"></div>
                                                {route.stops?.map((stop, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 relative z-10">
                                                        <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-500 flex-shrink-0"></div>
                                                        <div className="flex-1 text-sm">
                                                            <div className="font-medium text-slate-700">{stop.stop_name}</div>
                                                            <div className="text-xs text-slate-400">{formatTime(stop.pickup_time)}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'live-map' && (
                            <div className="h-[600px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative z-0">
                                <LiveMap vehicles={vehicles} routes={routes} />
                            </div>
                        )}
                    </>
                )
            }

            {/* Add Vehicle Modal */}
            {
                showVehicleModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-slate-800">Add New Vehicle</h3>
                                <button onClick={() => setShowVehicleModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                            </div>
                            <div className="p-6 space-y-4">
                                <input
                                    className="w-full p-2 border rounded-lg text-sm" placeholder="Vehicle Number (e.g. KA-01-AB-1234)"
                                    value={vehicleForm.vehicle_number} onChange={e => setVehicleForm({ ...vehicleForm, vehicle_number: e.target.value })}
                                />
                                <input
                                    className="w-full p-2 border rounded-lg text-sm" placeholder="Model (e.g. Tata Starbus)"
                                    value={vehicleForm.vehicle_model} onChange={e => setVehicleForm({ ...vehicleForm, vehicle_model: e.target.value })}
                                />

                                {/* Driver Search Input */}
                                <div className="relative">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Search Driver (Staff)</label>
                                    <input
                                        className="w-full p-2 border rounded-lg text-sm"
                                        placeholder="Search by ID or Name..."
                                        value={driverSearch}
                                        onChange={handleDriverSearch}
                                    />
                                    {driverResults.length > 0 && (
                                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto">
                                            {driverResults.map(s => (
                                                <div
                                                    key={s.id}
                                                    onClick={() => selectDriver(s)}
                                                    className="p-2 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-100 last:border-0"
                                                >
                                                    <div className="font-bold text-slate-700">{s.name}</div>
                                                    <div className="text-xs text-slate-500">ID: {s.employee_id} | Ph: {s.phone}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Driver Name</label>
                                        <input
                                            className="w-full p-2 border rounded-lg text-sm bg-slate-50"
                                            placeholder="Auto-filled"
                                            value={vehicleForm.driver_name}
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Driver Phone</label>
                                        <input
                                            className="w-full p-2 border rounded-lg text-sm bg-slate-50"
                                            placeholder="Auto-filled"
                                            value={vehicleForm.driver_phone}
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <input
                                    className="w-full p-2 border rounded-lg text-sm" placeholder="GPS Device ID / IMEI (Optional for Hardware Tracking)"
                                    value={vehicleForm.gps_device_id} onChange={e => setVehicleForm({ ...vehicleForm, gps_device_id: e.target.value })}
                                />
                                <input
                                    type="number" className="w-full p-2 border rounded-lg text-sm" placeholder="Capacity"
                                    value={vehicleForm.capacity} onChange={e => setVehicleForm({ ...vehicleForm, capacity: e.target.value })}
                                />

                                <div className="pt-2 border-t border-slate-100">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assign Route (Optional)</label>
                                    <select
                                        className="w-full p-2 border rounded-lg text-sm bg-indigo-50/50"
                                        value={vehicleForm.assign_route_id || ''}
                                        onChange={e => setVehicleForm({ ...vehicleForm, assign_route_id: e.target.value })}
                                    >
                                        <option value="">-- No Route Assigned --</option>
                                        {routes.map(r => (
                                            <option key={r.id} value={r.id}>
                                                {r.route_name} {r.vehicle_id ? '(Assigned)' : '(Unassigned)'}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-slate-400 mt-1">* Selecting a route will assign this vehicle to it.</p>
                                </div>
                                <button onClick={handleAddVehicle} className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700">Add Vehicle</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add Route Modal with Map */}
            {
                showRouteModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 h-[85vh] flex flex-col">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                                <h3 className="font-bold text-slate-800">Create New Route</h3>
                                <button onClick={() => setShowRouteModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                            </div>

                            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2">
                                {/* Left Column: Form */}
                                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                                    <input
                                        className="w-full p-2 border rounded-lg text-sm" placeholder="Route Name"
                                        value={routeForm.route_name} onChange={e => setRouteForm({ ...routeForm, route_name: e.target.value })}
                                    />
                                    <select
                                        className="w-full p-2 border rounded-lg text-sm"
                                        value={routeForm.vehicle_id} onChange={e => setRouteForm({ ...routeForm, vehicle_id: e.target.value })}
                                    >
                                        <option value="">Select Vehicle</option>
                                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number} ({v.driver_name})</option>)}
                                    </select>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            className="w-full p-2 border rounded-lg text-sm" placeholder="Start Point"
                                            value={routeForm.start_point} onChange={e => setRouteForm({ ...routeForm, start_point: e.target.value })}
                                        />
                                        <input
                                            className="w-full p-2 border rounded-lg text-sm" placeholder="End Point"
                                            value={routeForm.end_point} onChange={e => setRouteForm({ ...routeForm, end_point: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-bold text-slate-500 w-24">Start Time:</label>
                                        <TimePicker12H
                                            value={routeForm.start_time}
                                            onChange={val => setRouteForm({ ...routeForm, start_time: val })}
                                        />
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-sm text-slate-700">Stops</h4>
                                            <span className="text-xs text-slate-400">Click map to add stops</span>
                                        </div>
                                        <div className="space-y-2">
                                            {stops.map((stop, index) => (
                                                <div key={index} className="flex gap-2 items-start animate-in slide-in-from-left-2">
                                                    <div className="flex-1 space-y-1">
                                                        <input
                                                            className="w-full p-2 border rounded-lg text-sm" placeholder="Stop Name"
                                                            value={stop.name} onChange={e => handleStopChange(index, 'name', e.target.value)}
                                                        />
                                                        <div className="flex gap-2 items-center">
                                                            <TimePicker12H
                                                                value={stop.time}
                                                                onChange={val => handleStopChange(index, 'time', val)}
                                                            />
                                                            {stop.lat && (
                                                                <div className="text-[10px] text-slate-400 flex items-center bg-slate-50 px-2 rounded">
                                                                    <MapPin size={10} className="mr-1" />
                                                                    {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button onClick={() => removeStop(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={addStopField} className="mt-2 text-sm text-indigo-600 font-bold hover:underline">+ Add Manually</button>
                                    </div>
                                </div>

                                {/* Right Column: Map */}
                                <div className="h-full bg-slate-100 relative">
                                    <MapContainer center={[12.9716, 77.5946]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer
                                            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                        />
                                        <LocationPicker onLocationSelect={handleMapClick} />

                                        {stops.map((stop, idx) => (
                                            stop.lat && stop.lng && (
                                                <Marker key={idx} position={[stop.lat, stop.lng]}>
                                                    <Popup>{stop.name || `Stop ${idx + 1}`}</Popup>
                                                </Marker>
                                            )
                                        ))}
                                    </MapContainer>
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                                <button onClick={handleAddRoute} className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700">Create Route</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default TransportManagement;
