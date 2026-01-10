import React, { useState, useEffect, useRef } from 'react';
import { Search, Fingerprint, CreditCard, Check, X, Shield, ScanLine } from 'lucide-react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

const BiometricManagement = () => {
    const [activeTab, setActiveTab] = useState('enrollment'); // enrollment | kiosk

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Shield className="text-indigo-600" /> Biometric & Access Control
            </h2>

            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('enrollment')}
                    className={`pb-3 px-4 font-bold border-b-2 transition-colors ${activeTab === 'enrollment' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Enrollment Manager
                </button>
                <button
                    onClick={() => setActiveTab('kiosk')}
                    className={`pb-3 px-4 font-bold border-b-2 transition-colors ${activeTab === 'kiosk' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Attendance Kiosk Mode
                </button>
            </div>

            {activeTab === 'enrollment' ? <EnrollmentPanel /> : <KioskPanel />}
        </div>
    );
};

const EnrollmentPanel = () => {
    const [userType, setUserType] = useState('student');
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [cardInput, setCardInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Hardware State
    const [deviceStatus, setDeviceStatus] = useState('unknown'); // unknown, connected, disconnected, checking
    const [deviceInfo, setDeviceInfo] = useState(null);
    const [connectionLogs, setConnectionLogs] = useState([]);
    const [manualPort, setManualPort] = useState('');
    const [activePort, setActivePort] = useState(null);

    const addLog = (msg) => {
        setConnectionLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
    };

    const [showHelp, setShowHelp] = useState(false);

    const checkDevice = async (specificPort = null) => {
        setDeviceStatus('checking');
        setConnectionLogs([]);
        setShowHelp(false);
        addLog("Starting device discovery...");

        // Extended common ports list including Securye/Mantra/Morpho defaults
        const ports = specificPort ? [parseInt(specificPort)] : [11100, 11101, 11102, 11103, 11104, 11105, 8080, 8000, 9090];

        let found = false;

        for (const port of ports) {
            try {
                addLog(`Probing http://127.0.0.1:${port}...`);

                // Probe device RD service
                const controller = new AbortController();
                setTimeout(() => controller.abort(), 1000);

                // Try root, rd-service, or device info endpoints
                const res = await fetch(`http://127.0.0.1:${port}/`, {
                    method: 'OPTIONS', // OPTIONS is safer/faster for probing
                    signal: controller.signal
                }).catch(() => null);

                // If we get ANY response (even 404/405), something is listening on that port
                if (res) {
                    setDeviceStatus('connected');
                    setDeviceInfo(`Device Detected on Port ${port}`);
                    setActivePort(port);
                    addLog(`SUCCESS: Service found on port ${port}`);
                    toast.success(`Biometric Service Found (Port ${port})`);
                    found = true;
                    break;
                }
            } catch (e) {
                // Ignore connection errors
            }
        }

        if (!found) {
            setDeviceStatus('disconnected');
            setShowHelp(true);
            addLog("FAILED: No active service found on scanned ports.");
            addLog("Action Required: Install RD Service Driver.");
            toast.error("Scanner service not found. See help below.");
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const res = await api.get('/biometric/search', { params: { type: userType, query: searchQuery } });
            setUsers(res.data);
            setSelectedUser(null);
        } catch (error) {
            toast.error('Search failed');
        }
    };

    const handleUpdate = async (field, value) => {
        if (isSubmitting) return;
        if (!selectedUser) return;

        setIsSubmitting(true);
        try {
            await api.post('/biometric/enroll', {
                type: userType,
                id: selectedUser.id,
                [field]: value
            });
            toast.success('Credentials Updated');
            // Refresh updated user in list locally
            setUsers(users.map(u => u.id === selectedUser.id ? { ...u, [field]: value } : u));
            setSelectedUser(prev => ({ ...prev, [field]: value }));
        } catch (error) {
            toast.error('Update failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const captureFingerprint = async () => {
        if (isSubmitting) return;

        if (deviceStatus !== 'connected') {
            await checkDevice();
        }

        toast.loading('Place finger on scanner...');

        setIsSubmitting(true);
        try {
            // SIMULATION: In real world, call axios.post('http://127.0.0.1:11100/rd/capture', ...)
            await new Promise(r => setTimeout(r, 2000));
            const fakeTemplate = "TEMPLATE_" + Math.random().toString(36).substring(7);

            handleUpdate('biometric_template', fakeTemplate);
        } catch (error) {
            toast.error("Capture Failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search Panel */}
            <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex gap-4">
                        {['student', 'teacher', 'staff'].map(t => (
                            <label key={t} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="userType"
                                    className="accent-indigo-600"
                                    checked={userType === t}
                                    onChange={() => setUserType(t)}
                                />
                                <span className="capitalize font-bold text-slate-700">{t}</span>
                            </label>
                        ))}
                    </div>

                    {/* Device Status Check */}
                    <button
                        onClick={checkDevice}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${deviceStatus === 'connected' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            deviceStatus === 'disconnected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                    >
                        {deviceStatus === 'checking' && <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></div>}
                        {deviceStatus === 'connected' && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                        {deviceStatus === 'disconnected' && <div className="w-2 h-2 rounded-full bg-rose-500"></div>}

                        {deviceStatus === 'idle' && 'Check Device'}
                        {deviceStatus === 'unknown' && 'Check Device'}
                        {deviceStatus === 'checking' && 'Searching...'}
                        {deviceStatus === 'connected' && (deviceInfo || "Device Connected")}
                        {deviceStatus === 'disconnected' && 'No Device'}

                        {deviceStatus !== 'checking' && <ScanLine size={12} />}
                    </button>
                </div>

                {/* Connection Debugger */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                    <div className="flex gap-2 mb-2">
                        <input
                            placeholder="Manual Port (e.g. 11100)"
                            className="p-1 px-2 border rounded w-32 text-xs"
                            value={manualPort}
                            onChange={(e) => setManualPort(e.target.value)}
                        />
                        <button
                            onClick={() => checkDevice(manualPort)}
                            className="text-xs bg-slate-200 px-2 py-1 rounded hover:bg-slate-300 font-bold text-slate-600"
                        >
                            Test Port
                        </button>
                    </div>
                    <div className="h-24 overflow-y-auto bg-black text-green-400 p-2 rounded font-mono text-xs">
                        {connectionLogs.map((log, i) => <div key={i}>{log}</div>)}
                        {connectionLogs.length === 0 && <span className="opacity-50">Log waiting... Click 'Check Device'</span>}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            className="w-full p-2 border rounded-lg"
                            placeholder="Search by Name, ID, or Email..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value.replace(/[^a-zA-Z0-9 ]/g, ''))}
                        />
                        <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg"><Search /></button>
                    </form>
                </div>

                <div className="space-y-2">
                    {users.map(user => (
                        <div
                            key={user.id}
                            onClick={() => { setSelectedUser(user); setCardInput(user.rfid_card_id || ''); }}
                            className={`bg-white p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all flex justify-between items-center ${selectedUser?.id === user.id ? 'border-indigo-600 ring-1 ring-indigo-600' : 'border-slate-200'}`}
                        >
                            <div>
                                <h3 className="font-bold text-slate-800">{user.name}</h3>
                                <p className="text-xs text-slate-500 uppercase font-mono">{user.user_id}</p>
                            </div>
                            <div className="flex gap-2">
                                {user.rfid_card_id ? <CreditCard size={16} className="text-emerald-500" /> : <CreditCard size={16} className="text-slate-300" />}
                                {user.biometric_template ? <Fingerprint size={16} className="text-emerald-500" /> : <Fingerprint size={16} className="text-slate-300" />}
                            </div>
                        </div>
                    ))}
                    {users.length === 0 && <div className="text-center text-slate-400 py-8">Search for a user to manage</div>}
                </div>

                {showHelp && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm animate-fade-in-down">
                        <div className="flex items-start gap-3">
                            <Shield className="text-amber-600 mt-1" size={20} />
                            <div>
                                <h4 className="font-bold text-amber-900">USB Scanner Not Detected</h4>
                                <p className="mt-1">
                                    <strong>Are you using a LAN / WiFi Device?</strong><br />
                                    <span className="text-emerald-700 font-bold">Good News: You do NOT need any drivers!</span><br />
                                    LAN devices connect directly to the server. You can ignore this message and proceed to enroll users directly on the machine.
                                </p>
                                <div className="mt-3 border-t border-amber-200 pt-2 opacity-80">
                                    <p className="text-xs mb-1 font-bold">Only for USB Devices:</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>Install <strong>RD Service Driver</strong>.</li>
                                        <li>Connect USB cable.</li>
                                    </ul>
                                </div>
                                <button
                                    onClick={() => checkDevice()}
                                    className="mt-3 bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-700"
                                >
                                    Re-Scan USB
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Selection Panel */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                {selectedUser ? (
                    <div className="space-y-6">
                        <div className="text-center border-b border-slate-100 pb-4">
                            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-2">
                                {selectedUser.name[0]}
                            </div>
                            <h3 className="font-bold text-lg">{selectedUser.name}</h3>
                            <p className="text-slate-500 text-sm">Managing Biometric Access</p>

                            {/* Device Warning - Hidden for LAN Mode correctness */}
                            {/* LAN Devices are 'Pushed' to server, so browser doesn't detect them directly */}
                            <div className="mt-2 text-xs bg-indigo-50 text-indigo-700 p-2 rounded border border-indigo-100 flex items-center justify-center gap-2">
                                <Check size={14} /> Ready for LAN Enrollment
                            </div>
                        </div>

                        {/* ID Assignment Section (Critical for LAN Devices) */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="text-xs font-bold text-indigo-900 uppercase block mb-2 flex items-center gap-2">
                                <ScanLine size={14} /> Biometric ID / Device User ID
                            </label>
                            <div className="flex gap-2">
                                <input
                                    className="w-full p-2.5 border-2 border-slate-200 rounded-lg font-mono text-lg font-bold text-slate-700 focus:border-indigo-500 outline-none"
                                    placeholder="e.g. 101"
                                    value={cardInput}
                                    onChange={e => setCardInput(e.target.value)}
                                />
                                <button
                                    onClick={() => handleUpdate('rfid_card_id', cardInput)}
                                    disabled={isSubmitting}
                                    className={`bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-lg text-sm font-bold shadow-md active:scale-95 transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                                <strong>Instructions for LAN Device:</strong><br />
                                1. Enter a unique ID above (e.g. {selectedUser.id}) and click Save.<br />
                                2. Go to your Biometric Machine &rarr; Menu &rarr; User Mgt &rarr; Enroll.<br />
                                3. Enter this same ID <strong>({cardInput || '...'})</strong> on the machine.<br />
                                4. Place the person's finger/face to enroll.
                            </p>
                        </div>

                        {/* Legacy/USB Fingerprint Column */}
                        <div className="opacity-70">
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">USB Scanner Enrollment (Optional)</label>
                            <button
                                onClick={captureFingerprint}
                                disabled={isSubmitting}
                                className={`w-full py-3 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 font-bold transition-colors ${selectedUser.biometric_template ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-600'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Fingerprint />
                                {isSubmitting ? 'Processing...' : (selectedUser.biometric_template ? 'Re-Scan Legacy Template' : 'Scan via USB Device')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-slate-400 py-10">
                        <Shield size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Select a Student, Teacher, or Staff member to manage their biometric ID.</p>
                    </div>
                )}
            </div>
        </div>

    );
};

const KioskPanel = () => {
    const inputRef = useRef(null);
    const [logs, setLogs] = useState([]);
    const [status, setStatus] = useState('idle'); // idle, processing, success, error

    const handleScan = async (e) => {
        e.preventDefault();
        const code = inputRef.current.value;
        if (!code) return;

        setStatus('processing');
        try {
            const res = await api.post('/biometric/attendance', { input_id: code });

            const newLog = {
                time: new Date().toLocaleTimeString(),
                message: res.data.message,
                user: res.data.user,
                success: res.data.success
            };

            setLogs(prev => [newLog, ...prev]);
            setStatus(res.data.success ? 'success' : 'error');

            if (res.data.success) {
                toast.success(res.data.message);
                // Speak name (Browser TTS)
                const utterance = new SpeechSynthesisUtterance('Welcome ' + res.data.user.name);
                window.speechSynthesis.speak(utterance);
            } else {
                toast.error(res.data.message);
            }

        } catch (error) {
            setLogs(prev => [{ time: new Date().toLocaleTimeString(), message: 'Scan Failed', success: false }, ...prev]);
            setStatus('error');
        }

        inputRef.current.value = '';
        inputRef.current.focus();

        // Reset status after 2 seconds
        setTimeout(() => setStatus('idle'), 2000);
    };

    // Keep focus
    useEffect(() => {
        inputRef.current?.focus();
        const interval = setInterval(() => {
            if (document.activeElement !== inputRef.current) {
                // Optional: Force focus back if desired, but can be annoying during manual interaction
                // inputRef.current?.focus(); 
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="max-w-4xl mx-auto">
            <div className={`p-10 rounded-3xl shadow-xl text-center transition-colors duration-500 ${status === 'success' ? 'bg-emerald-500 text-white' : status === 'error' ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}>

                <div className="mb-8">
                    {status === 'idle' && <ScanLine size={64} className="mx-auto animate-pulse" />}
                    {status === 'success' && <Check size={64} className="mx-auto animate-bounce" />}
                    {status === 'error' && <X size={64} className="mx-auto animate-pulse" />}
                </div>

                <h1 className="text-4xl font-bold mb-2">
                    {status === 'idle' ? 'Ready to Scan' : status === 'success' ? 'Access Granted' : 'Access Denied'}
                </h1>
                <p className="opacity-80 text-lg">Please scan your ID Card or Fingerprint</p>

                {/* Hidden Input for Scanner - Kept visible to debug, make transparent later if needed */}
                <form onSubmit={handleScan} className="absolute opacity-0">
                    <input
                        ref={inputRef}
                        autoFocus
                        onBlur={() => setTimeout(() => inputRef.current?.focus(), 10)}
                    />
                    <button type="submit">Submit</button>
                </form>
            </div>

            <div className="mt-8 space-y-4">
                <h3 className="font-bold text-slate-500 uppercase tracking-widest text-sm text-center">Recent Scans</h3>
                {logs.map((log, index) => (
                    <div key={index} className={`flex items-center justify-between p-4 rounded-xl border ${log.success ? 'bg-white border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${log.success ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                {log.user?.name?.[0] || '?'}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">{log.user?.name || 'Unknown'}</h4>
                                <p className="text-xs text-slate-500">{log.message}</p>
                            </div>
                        </div>
                        <span className="font-mono text-xs text-slate-400">{log.time}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BiometricManagement;
