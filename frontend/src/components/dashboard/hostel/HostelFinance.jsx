import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { Search, User, Home, DollarSign, Calendar, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const HostelFinance = () => {
    // Search State
    const [admissionNo, setAdmissionNo] = useState('');
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);

    // Form States
    const [activeTab, setActiveTab] = useState('rent'); // 'rent' or 'mess'
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentRemarks, setPaymentRemarks] = useState('');

    // Mess Bill Form
    const [showBillModal, setShowBillModal] = useState(false);
    const [messBillData, setMessBillData] = useState({
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
        amount: ''
    });

    const [dashboardStats, setDashboardStats] = useState(null);
    const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' or 'student_search'

    // Bulk Bill State
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkBillData, setBulkBillData] = useState({
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
        amount: ''
    });

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const res = await api.get('/hostel/finance/stats');
            setDashboardStats(res.data);
        } catch (error) {
            console.error('Failed to load stats');
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!admissionNo.trim()) return;

        setLoading(true);
        setSearchPerformed(true);
        setStudentData(null);
        setViewMode('student_search');

        try {
            const encodedId = encodeURIComponent(admissionNo.trim());
            const res = await api.get(`/hostel/student/${encodedId}/details`);
            setStudentData(res.data);
        } catch (error) {
            if (error.response?.status === 404) {
                toast.error('Student not found');
            } else {
                toast.error('Failed to fetch details');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        if (!paymentAmount || isNaN(paymentAmount) || parseFloat(paymentAmount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            await api.post('/hostel/finance/payment', {
                student_id: studentData.id,
                amount: parseFloat(paymentAmount),
                payment_type: activeTab === 'rent' ? 'Room Rent' : 'Mess Bill',
                remarks: paymentRemarks
            });
            toast.success('Payment recorded successfully');
            setPaymentAmount('');
            setPaymentRemarks('');

            // Refresh Data
            const res = await api.get(`/hostel/student/${admissionNo}/details`);
            setStudentData(res.data);
            fetchDashboardStats(); // Update stats too
        } catch (error) {
            toast.error('Payment failed');
        }
    };

    const handlePayBill = async (billId, amount) => {
        if (!window.confirm(`Confirm payment of ₹${amount} for this bill?`)) return;
        try {
            await api.post('/hostel/finance/payment', {
                student_id: studentData.id,
                amount: amount,
                payment_type: 'Mess Bill',
                related_bill_id: billId,
                remarks: 'Bill Payment'
            });
            toast.success('Bill paid successfully');
            // Refresh
            const res = await api.get(`/hostel/student/${admissionNo}/details`);
            setStudentData(res.data);
            fetchDashboardStats();
        } catch (error) {
            toast.error('Payment failed');
        }
    };

    const handleCreateBill = async (e) => {
        e.preventDefault();
        try {
            await api.post('/hostel/finance/mess-bill', {
                student_id: studentData.id,
                ...messBillData
            });
            toast.success('Mess bill generated');
            setShowBillModal(false);
            // Refresh
            const res = await api.get(`/hostel/student/${admissionNo}/details`);
            setStudentData(res.data);
            fetchDashboardStats();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to generate bill');
        }
    };

    const handleBulkBill = async (e) => {
        e.preventDefault();
        if (!window.confirm(`Generate mess bill of ₹${bulkBillData.amount} for ALL active hostel students?`)) return;

        try {
            const res = await api.post('/hostel/finance/bulk-mess-bill', bulkBillData);
            toast.success(res.data.message);
            setShowBulkModal(false);
            fetchDashboardStats();
        } catch (error) {
            toast.error('Failed to generate bulk bills');
        }
    };

    // Calculate totals
    const totalRentPaid = studentData?.payments
        .filter(p => p.payment_type === 'Room Rent')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    const totalMessPaid = studentData?.payments
        .filter(p => p.payment_type === 'Mess Bill')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    const rentDue = (parseFloat(studentData?.cost_per_term) || 0) - totalRentPaid;

    const PendingBillsList = () => {
        const [pendingList, setPendingList] = useState([]);
        const [loadingList, setLoadingList] = useState(false);
        const [showList, setShowList] = useState(false);

        const fetchPendingList = async () => {
            setLoadingList(true);
            try {
                // Fetch all pending for now to be comprehensive
                const res = await api.get('/hostel/finance/pending-dues');
                setPendingList(res.data);
            } catch (err) {
                toast.error('Failed to load pending list');
            } finally {
                setLoadingList(false);
            }
        };

        const toggleList = () => {
            if (!showList) {
                fetchPendingList();
            }
            setShowList(!showList);
        };

        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors" onClick={toggleList}>
                    <div className="flex items-center gap-2">
                        <AlertCircle size={20} className="text-orange-500" />
                        <h3 className="font-bold text-lg text-slate-800">Pending Hostel Dues (List)</h3>
                    </div>
                    <button className="text-indigo-600 font-medium text-sm">
                        {showList ? 'Hide List' : 'View Full List'}
                    </button>
                </div>

                {showList && (
                    <div className="p-0 animate-in slide-in-from-top-2">
                        {loadingList ? (
                            <div className="p-8 text-center text-slate-500">Loading pending dues...</div>
                        ) : (
                            <>
                                {pendingList.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500">No pending dues found.</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-3">Student Name</th>
                                                    <th className="px-6 py-3">Admission ID</th>
                                                    <th className="px-6 py-3">Type</th>
                                                    <th className="px-6 py-3">Period</th>
                                                    <th className="px-6 py-3 text-right">Amount</th>
                                                    <th className="px-6 py-3 text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {pendingList.map(item => (
                                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-3 font-medium text-slate-800">{item.name}</td>
                                                        <td className="px-6 py-3 text-slate-500">{item.admission_no}</td>
                                                        <td className="px-6 py-3">
                                                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.type === 'Room Rent' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                {item.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3 text-slate-600">{item.period}</td>
                                                        <td className="px-6 py-3 text-right font-bold text-slate-800">₹{item.amount}</td>
                                                        <td className="px-6 py-3 text-center">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setAdmissionNo(item.admission_no);
                                                                    handleSearch(e); // Load this student
                                                                }}
                                                                className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold hover:bg-indigo-100 transition-colors"
                                                            >
                                                                Pay Now
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Hostel Finance</h2>
                    <p className="text-slate-500">Manage hostel fees and mess bills</p>
                </div>
                {viewMode === 'dashboard' && (
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-md shadow-indigo-200"
                    >
                        <Calendar size={18} /> Monthly Mess Bill Gen.
                    </button>
                )}
            </div>

            {/* Navigation Tabs (Top Level) */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setViewMode('dashboard')}
                    className={`pb-3 px-2 font-medium text-sm transition-colors relative ${viewMode === 'dashboard' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Dashboard Overview
                    {viewMode === 'dashboard' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setViewMode('student_search')}
                    className={`pb-3 px-2 font-medium text-sm transition-colors relative ${viewMode === 'student_search' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Student Payments
                    {viewMode === 'student_search' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
                </button>
            </div>

            {/* DASHBOARD MODE */}
            {viewMode === 'dashboard' && dashboardStats && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    {/* Head Count & Capacity */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                    <User size={24} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-sm font-medium">Total Head Count</p>
                                    <h3 className="text-2xl font-bold text-slate-800">{dashboardStats.headCount} <span className="text-sm text-slate-400 font-normal">/ {dashboardStats.totalCapacity}</span></h3>
                                </div>
                            </div>
                            <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full rounded-full"
                                    style={{ width: `${(dashboardStats.headCount / dashboardStats.totalCapacity) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                                    <CheckCircle size={24} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-sm font-medium">Mess Bills Paid (Current Month)</p>
                                    <h3 className="text-2xl font-bold text-slate-800">{dashboardStats.mess.paidCount} <span className="text-sm text-slate-400 font-normal">/ {dashboardStats.mess.totalBills}</span></h3>
                                </div>
                            </div>
                            <p className="mt-4 text-xs font-bold text-green-600 bg-green-50 inline-block px-2 py-1 rounded"> Collected: ₹{dashboardStats.mess.paidAmount}</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-sm font-medium">Mess Bills Pending (All Time)</p>
                                    <h3 className="text-2xl font-bold text-slate-800">{dashboardStats.mess.pendingCount}</h3>
                                </div>
                            </div>
                            <p className="mt-4 text-xs font-bold text-orange-600 bg-orange-50 inline-block px-2 py-1 rounded"> Total Due: ₹{dashboardStats.mess.pendingAmount}</p>
                        </div>
                    </div>

                    {/* Financial Overview Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-4">Financial Overview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Room Rent (Expected)</h4>
                                <div className="text-3xl font-bold text-indigo-900">₹{dashboardStats.rent.expectedTermRent}</div>
                                <p className="text-xs text-slate-400 mt-1">Total expected revenue from active allocations per term.</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Mess Financials</h4>
                                <div className="text-3xl font-bold text-slate-800">
                                    <span className="text-sm text-slate-400 font-normal block mb-1">Billed (This Month)</span>
                                    ₹{dashboardStats.mess.totalBilledAmount}
                                </div>
                                <div className="flex gap-4 mt-2 text-sm">
                                    <span className="text-green-600 font-bold block">
                                        <span className="text-xs text-slate-400 font-normal">Collected (This Month): </span>
                                        ₹{dashboardStats.mess.paidAmount}
                                    </span>
                                    <span className="text-orange-600 font-bold block">
                                        <span className="text-xs text-slate-400 font-normal">Total Pending (All Time): </span>
                                        ₹{dashboardStats.mess.pendingAmount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Bills List */}
                    <PendingBillsList />

                </div>
            )}

            {/* STUDENT SEARCH MODE */}
            {viewMode === 'student_search' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    {/* Search Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <form onSubmit={handleSearch} className="flex gap-4 items-end">
                            <div className="flex-1 max-w-md">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Enter Student ID</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                                    <input
                                        autoFocus
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="e.g. 20251-3693"
                                        value={admissionNo}
                                        onChange={(e) => setAdmissionNo(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70"
                            >
                                {loading ? 'Searching...' : 'Search Student'}
                            </button>
                        </form>
                    </div>

                    {/* Verification & Dashboard */}
                    {searchPerformed && !studentData && !loading && (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                            <p className="text-slate-500 font-medium">Student not found or not allocated to any hostel.</p>
                        </div>
                    )}

                    {studentData && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            {/* Student Verification Card */}
                            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center gap-6">
                                <div className="w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center text-2xl font-bold border-4 border-white/20">
                                    {studentData.name ? studentData.name.substring(0, 2).toUpperCase() : ''}
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-2xl font-bold">{studentData.name}</h3>
                                    <div className="flex flex-wrap gap-4 mt-2 justify-center md:justify-start text-slate-300 text-sm">
                                        <span className="flex items-center gap-1"><User size={14} /> ID: {studentData.admission_no}</span>
                                        <span className="flex items-center gap-1"><Home size={14} /> {studentData.hostel_name}</span>
                                        <span className="flex items-center gap-1 bg-indigo-500/30 px-2 py-0.5 rounded text-white border border-indigo-400/30">
                                            Room {studentData.room_number}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10 min-w-[200px]">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Room Rent / Term</p>
                                    <p className="text-2xl font-bold text-white">₹{studentData.cost_per_term}</p>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
                                <button
                                    onClick={() => setActiveTab('rent')}
                                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'rent' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    Room Fees
                                </button>
                                <button
                                    onClick={() => setActiveTab('mess')}
                                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'mess' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    Mess Management
                                </button>
                            </div>

                            {/* Rent Section */}
                            {activeTab === 'rent' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Payment Form */}
                                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                                        <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                            <DollarSign size={20} className="text-indigo-600" /> Collect Rent
                                        </h4>

                                        <div className="space-y-4">
                                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-slate-500">Total Due</span>
                                                    <span className="font-bold">₹{studentData.cost_per_term}</span>
                                                </div>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-slate-500">Paid so far</span>
                                                    <span className="font-bold text-green-600">₹{totalRentPaid}</span>
                                                </div>
                                                <div className="border-t border-slate-200 my-2 pt-2 flex justify-between font-bold">
                                                    <span className="text-slate-700">Balance Pending</span>
                                                    <span className={`${rentDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                        ₹{rentDue > 0 ? rentDue : 0}
                                                    </span>
                                                </div>
                                            </div>

                                            <form onSubmit={handlePayment}>
                                                <div className="mb-3">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Amount</label>
                                                    <input
                                                        type="number"
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium"
                                                        placeholder="0.00"
                                                        value={paymentAmount}
                                                        onChange={e => setPaymentAmount(e.target.value)}
                                                    />
                                                </div>
                                                <div className="mb-4">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Remarks</label>
                                                    <input
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                        placeholder="Optional"
                                                        value={paymentRemarks}
                                                        onChange={e => setPaymentRemarks(e.target.value)}
                                                    />
                                                </div>
                                                <button className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                                                    Record Payment
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                    {/* Payment History */}
                                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="p-4 border-b border-slate-100 font-bold text-slate-700">Payment History</div>
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                                <tr>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3">Type</th>
                                                    <th className="px-4 py-3">Remarks</th>
                                                    <th className="px-4 py-3 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {studentData.payments.filter(p => p.payment_type === 'Room Rent').map(p => (
                                                    <tr key={p.id}>
                                                        <td className="px-4 py-3">{new Date(p.payment_date).toLocaleDateString()}</td>
                                                        <td className="px-4 py-3">{p.payment_type}</td>
                                                        <td className="px-4 py-3 text-slate-500">{p.remarks || '-'}</td>
                                                        <td className="px-4 py-3 text-right font-medium text-green-600">+₹{p.amount}</td>
                                                    </tr>
                                                ))}
                                                {studentData.payments.filter(p => p.payment_type === 'Room Rent').length === 0 && (
                                                    <tr>
                                                        <td colSpan="4" className="px-4 py-8 text-center text-slate-400">No rent payments recorded yet.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Mess Section */}
                            {activeTab === 'mess' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-lg text-slate-700">Mess Bills</h3>
                                        <button
                                            onClick={() => setShowBillModal(true)}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
                                        >
                                            <Plus size={16} /> Generate Bill (Individual)
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {studentData.bills.map(bill => (
                                            <div key={bill.id} className="bg-white p-5 rounded-xl text-left border border-slate-200 shadow-sm relative overflow-hidden group">
                                                <div className={`absolute top-0 right-0 p-2 ${bill.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                    } rounded-bl-xl font-bold text-xs uppercase tracking-wide`}>
                                                    {bill.status}
                                                </div>

                                                <div className="mb-4">
                                                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">{bill.month} {bill.year}</p>
                                                    <p className="text-2xl font-bold text-slate-800 mt-1">₹{bill.amount}</p>
                                                </div>

                                                {bill.status !== 'Paid' ? (
                                                    <button
                                                        onClick={() => handlePayBill(bill.id, bill.amount)}
                                                        className="w-full mt-2 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium transition-colors text-sm"
                                                    >
                                                        Mark as Paid
                                                    </button>
                                                ) : (
                                                    <div className="w-full mt-2 py-2 flex items-center justify-center gap-2 text-green-600 bg-green-50 rounded-lg font-medium text-sm">
                                                        <CheckCircle size={16} /> Paid
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {studentData.bills.length === 0 && (
                                            <div className="col-span-full py-10 text-center text-slate-400 bg-white border border-dashed border-slate-300 rounded-xl">
                                                No mess bills generated for this student.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )
            }


            {/* Individual Bill Modal */}
            {
                showBillModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                            <h3 className="text-lg font-bold mb-4">Generate Mess Bill</h3>
                            <form onSubmit={handleCreateBill} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                                        value={messBillData.month}
                                        onChange={e => setMessBillData({ ...messBillData, month: e.target.value })}
                                    >
                                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                                        value={messBillData.year}
                                        onChange={e => setMessBillData({ ...messBillData, year: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bill Amount</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        placeholder="0.00"
                                        value={messBillData.amount}
                                        onChange={e => setMessBillData({ ...messBillData, amount: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowBillModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                                    <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Generate</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Bulk Mess Bill Modal */}
            {
                showBulkModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-sm animate-in zoom-in-95">
                            <h3 className="text-lg font-bold mb-1">Monthly Mess Bill</h3>
                            <p className="text-xs text-slate-500 mb-4">Generate bills for ALL active students.</p>
                            <form onSubmit={handleBulkBill} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                                        value={bulkBillData.month}
                                        onChange={e => setBulkBillData({ ...bulkBillData, month: e.target.value })}
                                    >
                                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                                        value={bulkBillData.year}
                                        onChange={e => setBulkBillData({ ...bulkBillData, year: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bill Amount per Student</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        placeholder="0.00"
                                        value={bulkBillData.amount}
                                        onChange={e => setBulkBillData({ ...bulkBillData, amount: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowBulkModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                                    <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Generate Bulk Bills</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default HostelFinance;
