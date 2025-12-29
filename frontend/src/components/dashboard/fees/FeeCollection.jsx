import React, { useState, useEffect } from 'react';
import { Search, CreditCard, History, CheckCircle, AlertCircle, Edit, Trash2, IndianRupee, Users, Printer, Receipt } from 'lucide-react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

const FeeCollection = ({ config }) => {
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Data
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(false);

    // Selected Student for Detailed Payment View
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [feeDetails, setFeeDetails] = useState([]);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('dues');

    // Payment Modal
    const [payModal, setPayModal] = useState(null);
    const [editModal, setEditModal] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('Cash');
    const [remarks, setRemarks] = useState('');
    const [transactionId, setTransactionId] = useState('');

    const sections = config?.classes?.find(c => c.class_id === parseInt(selectedClass))?.sections || [];

    const formatCurrency = (amount) => {
        return parseFloat(amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    useEffect(() => {
        fetchOverview();
    }, [selectedClass, selectedSection]);

    const fetchOverview = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/fees/overview?class_id=${selectedClass}&section_id=${selectedSection}`);
            setOverview(res.data);
        } catch (e) { console.error('Overview Fetch Error:', e); }
        finally { setLoading(false); }
    };

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        fetchStudentFees(student.id);
        fetchHistory(student.id);
    };

    const fetchStudentFees = async (id) => {
        try {
            const res = await api.get(`/fees/student/${id}`);
            setFeeDetails(res.data);
        } catch (e) { toast.error('Failed to load fees'); }
    };

    const fetchHistory = async (id) => {
        try {
            const res = await api.get(`/fees/student/${id}/history`);
            setHistory(res.data);
        } catch (e) { console.error(e); }
    };

    const handleDeletePayment = async () => {
        try {
            await api.delete(`/fees/payment/${deleteConfirm.id}`);
            toast.success('Payment Deleted');
            setDeleteConfirm(null);
            fetchStudentFees(selectedStudent.id);
            fetchHistory(selectedStudent.id);
            fetchOverview();
        } catch (e) {
            console.error(e);
            toast.error('Deletion failed');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            if (editModal.type === 'structure') {
                await api.put(`/fees/structures/${editModal.data.fee_structure_id}`, {
                    title: editModal.data.title,
                    amount: editModal.data.total_amount,
                    due_date: editModal.data.due_date
                });
                toast.success('Fee Structure Updated');
            } else {
                await api.put(`/fees/payment/${editModal.data.id}`, {
                    amount: editModal.data.amount_paid,
                    method: editModal.data.payment_method,
                    remarks: editModal.data.remarks,
                    date: editModal.data.payment_date
                });
                toast.success('Payment Updated');
            }
            setEditModal(null);
            fetchStudentFees(selectedStudent.id);
            fetchHistory(selectedStudent.id);
            fetchOverview();
        } catch (e) {
            console.error(e);
            toast.error('Update failed');
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        if (['Bank Transfer', 'UPI', 'Cheque'].includes(method) && !transactionId) {
            return toast.error(`${method === 'Cheque' ? 'Cheque Number' : 'Transaction ID / UTR'} is required`);
        }

        try {
            await api.post('/fees/pay', {
                student_id: selectedStudent.id,
                fee_structure_id: payModal.fee_structure_id,
                amount: parseFloat(amount),
                method,
                remarks: transactionId ? `${method}: ${transactionId}${remarks ? ' - ' + remarks : ''}` : remarks
            });
            toast.success('Payment Recorded');
            setPayModal(null);
            setAmount('');
            setTransactionId('');
            setRemarks('');
            fetchStudentFees(selectedStudent.id);
            fetchHistory(selectedStudent.id);
            fetchOverview();
        } catch (e) { toast.error('Payment failed'); }
    };

    const generateReceiptHTML = (payment, student) => {
        const school = config?.classes?.find(c => c.class_id == student.class_id)?.class_name || 'School';
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Fee Receipt - ${payment.receipt_no}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; padding: 20px; background: white; }
                    .receipt { max-width: 400px; margin: 0 auto; border: 2px solid #333; padding: 20px; }
                    .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 15px; margin-bottom: 15px; }
                    h1 { font-size: 20px; margin-bottom: 5px; }
                    .receipt-no { background: #4f46e5; color: white; padding: 5px 10px; font-size: 14px; font-weight: bold; display: inline-block; m

argin: 10px 0; }
                    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                    .label { font-weight: bold; color: #666; font-size: 12px; }
                    .value { font-weight: bold; color: #333; font-size: 14px; }
                    .amount-row { background: #f0fdf4; padding: 12px; margin: 15px 0; border-radius: 8px; }
                    .amount { font-size: 24px; color: #16a34a; font-weight: bold; }
                    .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px dashed #ccc; font-size: 11px; color: #666; }
                    @media print {
                        body { padding: 0; }
                        @page { margin: 0.5cm; }
                    }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <h1 style="color: #4f46e5; text-transform: uppercase; letter-spacing: 1px;">${school}</h1>
                        <p style="font-size: 12px; color: #666; font-weight: bold;">OFFICIAL FEE RECEIPT</p>
                        <div class="receipt-no">RECEIPT #${payment.receipt_no}</div>
                    </div>
                    <div class="row"><span class="label">Payment Date:</span> <span class="value">${new Date(payment.payment_date).toLocaleDateString('en-GB')}</span></div>
                    <div class="row"><span class="label">Student Name:</span> <span class="value">${student.name}</span></div>
                    <div class="row"><span class="label">Admission No:</span> <span class="value">${student.admission_no}</span></div>
                    <div class="row"><span class="label">Class/Section:</span> <span class="value">${school}</span></div>
                    <div class="row"><span class="label">Fee Category:</span> <span class="value">${payment.fee_title}</span></div>
                    <div class="row"><span class="label">Method:</span> <span class="value">${payment.payment_method}</span></div>
                    ${payment.remarks ? `<div class="row"><span class="label">Reference:</span> <span class="value">${payment.remarks}</span></div>` : ''}
             
                    <div class="amount-row">
                        <div class="row" style="border: none;">
                            <span class="label" style="font-size: 14px; color: #16a34a;">Amount Paid:</span> 
                            <span class="amount">₹${parseFloat(payment.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    <div style="margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
                        <div style="text-align: center;">
                            <div style="width: 120px; border-bottom: 1px solid #333; margin-bottom: 5px;"></div>
                            <p style="font-size: 10px; font-weight: bold; color: #666;">Student/Parent Sign</p>
                        </div>
                        <div style="text-align: center;">
                            <div style="width: 120px; border-bottom: 1px solid #333; margin-bottom: 5px;"></div>
                            <p style="font-size: 10px; font-weight: bold; color: #666;">Authorized Signatory</p>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Thank you for your payment!</p>
                        <p>Generated on: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `;
    };

    const handlePrintOverview = () => {
        const className = config?.classes?.find(c => c.class_id === parseInt(selectedClass))?.class_name || 'All Classes';
        const sectionName = sections.find(s => s.id === parseInt(selectedSection))?.name || 'All Sections';
        const filteredStudents = overview.students.filter(s => statusFilter === 'All' || s.status === statusFilter);

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Fee Collection Report - ${className} ${sectionName}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; padding: 20px; background: white; }
                    h1 { text-align: center; color: #333; font-size: 20px; margin-bottom: 5px; }
                    h2 { text-align: center; color: #666; font-size: 16px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #4f46e5; color: white; font-weight: bold; }
                    .status-paid { background-color: #d1fae5; color: #065f46; font-weight: bold; padding: 4px 8px; border-radius: 4px; }
                    .status-partial { background-color: #fef3c7; color: #92400e; font-weight: bold; padding: 4px 8px; border-radius: 4px; }
                    .status-unpaid { background-color: #fee2e2; color: #991b1b; font-weight: bold; padding: 4px 8px; border-radius: 4px; }
                    @media print { body { padding: 10px; } @page { margin: 0.5cm; } }
                </style>
            </head>
            <body>
                <h1>Fee Collection Report</h1>
                <h2>${className} - ${sectionName} | Filter: ${statusFilter}</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Admission No.</th>
                            <th>Total Fee</th>
                            <th>Paid</th>
                            <th>Balance</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredStudents.map(s => `
                            <tr>
                                <td>${s.name}</td>
                                <td>${s.admission_no}</td>
                                <td>₹${formatCurrency(s.total_fee)}</td>
                                <td>₹${formatCurrency(s.paid)}</td>
                                <td>₹${formatCurrency(s.balance)}</td>
                                <td><span class="status-${s.status.toLowerCase()}">${s.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background: #f5f5f5; font-weight: bold;">
                            <td colspan="2">Total (${filteredStudents.length} students)</td>
                            <td>₹${formatCurrency(overview.summary.total_expected)}</td>
                            <td>₹${formatCurrency(overview.summary.total_collected)}</td>
                            <td>₹${formatCurrency(overview.summary.total_pending)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    if (selectedStudent) {
        return (
            <div className="space-y-6 animate-in fade-in">
                <button onClick={() => setSelectedStudent(null)} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold mb-4">
                    <History size={16} /> Back to Class List
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-3 bg-indigo-600 text-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                            <p className="text-indigo-100">Class {selectedStudent.class_name || (selectedClass ? config?.classes.find(c => c.class_id == selectedClass)?.class_name : '')} • {selectedStudent.admission_no}</p>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-xs text-indigo-200 uppercase font-bold">Total Dues Available</p>
                            <p className="text-3xl font-bold">₹{formatCurrency(feeDetails.reduce((sum, f) => sum + f.balance, 0))}</p>
                        </div>
                    </div>

                    <div className="lg:col-span-3">
                        <div className="flex bg-white rounded-t-xl border-b border-gray-200">
                            <button onClick={() => setActiveTab('dues')} className={`flex-1 p-4 font-bold text-sm ${activeTab === 'dues' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}>Current Dues</button>
                            <button onClick={() => setActiveTab('history')} className={`flex-1 p-4 font-bold text-sm ${activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}>Payment History</button>
                        </div>

                        <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 p-6 min-h-[300px] overflow-x-auto">
                            {activeTab === 'dues' ? (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                        <tr><th>Fee Title</th><th>Due Date</th><th>Amount</th><th>Paid</th><th>Balance</th><th className="text-right">Action</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {feeDetails.map(f => (
                                            <tr key={f.fee_structure_id}>
                                                <td className="p-4 font-bold text-gray-700">{f.title}</td>
                                                <td className="p-4 text-gray-500">{new Date(f.due_date).toLocaleDateString('en-GB')}</td>
                                                <td className="p-4 font-mono">₹{formatCurrency(f.total_amount)}</td>
                                                <td className="p-4 text-green-600 font-mono">₹{formatCurrency(f.paid_amount)}</td>
                                                <td className="p-4 text-red-600 font-bold font-mono">₹{formatCurrency(f.balance)}</td>
                                                <td className="p-4 text-right">
                                                    {f.balance > 0 && (
                                                        <button onClick={() => { setPayModal(f); setAmount(f.balance); }} className="btn-primary py-1.5 text-xs">
                                                            Pay Now
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {feeDetails.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">No fees assigned</td></tr>}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                        <tr><th>Date</th><th>Receipt#</th><th>Fee</th><th>Amount</th><th>Method</th><th>Remarks</th><th className="text-right">Action</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {history.map(h => (
                                            <tr key={h.id}>
                                                <td className="p-4 text-gray-500 text-xs">{new Date(h.payment_date).toLocaleDateString('en-GB')}</td>
                                                <td className="p-4"><span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-mono font-bold">{h.receipt_no || 'N/A'}</span></td>
                                                <td className="p-4 font-bold text-gray-700 text-xs">{h.fee_title}</td>
                                                <td className="p-4 text-green-600 font-bold font-mono">₹{formatCurrency(h.amount_paid)}</td>
                                                <td className="p-4 text-xs">{h.payment_method}</td>
                                                <td className="p-4 text-gray-400 italic text-xs">{h.remarks || '-'}</td>
                                                <td className="p-4 text-right flex justify-end gap-1">
                                                    <button onClick={() => window.open(`javascript:void(0)`, '_blank', 'width=400,height=600').document.write(generateReceiptHTML(h, selectedStudent))} className="bg-green-50 text-green-600 p-1.5 rounded-lg hover:bg-green-100" title="Print Receipt">
                                                        <Receipt size={14} />
                                                    </button>
                                                    <button onClick={() => setEditModal({ type: 'payment', data: h })} className="bg-blue-50 text-blue-600 p-1.5 rounded-lg hover:bg-blue-100">
                                                        <Edit size={14} />
                                                    </button>
                                                    <button onClick={() => setDeleteConfirm({ id: h.id })} className="bg-red-50 text-red-600 p-1.5 rounded-lg hover:bg-red-100">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {history.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">No payment history</td></tr>}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modals */}
                {payModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                            <h3 className="text-lg font-bold mb-4">Record Payment: {payModal.title}</h3>
                            <form onSubmit={handlePayment} className="space-y-4">
                                <div>
                                    <label className="label">Amount</label>
                                    <div className="relative">
                                        <input className="input" type="number" step="0.01" autoComplete="off" value={amount} onChange={e => setAmount(e.target.value)} required max={payModal.balance} />
                                    </div>
                                    <p className="text-xs text-right text-gray-500 mt-1">Max: ₹{formatCurrency(payModal.balance)}</p>
                                </div>
                                <div>
                                    <label className="label">Payment Method</label>
                                    <select className="input" value={method} onChange={e => { setMethod(e.target.value); setTransactionId(''); }}>
                                        <option>Cash</option><option>Bank Transfer</option><option>UPI</option><option>Cheque</option>
                                    </select>
                                </div>
                                {['Bank Transfer', 'UPI', 'Cheque'].includes(method) && (
                                    <div>
                                        <label className="label">
                                            {method === 'Cheque' ? 'Cheque Number' : 'Transaction ID / UTR'} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            className="input"
                                            required
                                            autoComplete="off"
                                            placeholder={method === 'Cheque' ? 'Enter Cheque Number' : 'Enter UTR / Transaction ID'}
                                            value={transactionId}
                                            onChange={e => setTransactionId(e.target.value)}
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="label">Remarks (Optional)</label>
                                    <textarea className="input" rows="2" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any additional notes..." />
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setPayModal(null)} className="btn-secondary w-1/2">Cancel</button>
                                    <button type="submit" className="btn-primary w-1/2">Confirm Payment</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 text-center">
                            <div className="mx-auto bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-red-600">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Payment?</h3>
                            <p className="text-gray-500 text-sm mb-6">This action cannot be undone. The payment record will be permanently removed.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
                                <button onClick={handleDeletePayment} className="btn-primary bg-red-600 hover:bg-red-700 flex-1">Delete</button>
                            </div>
                        </div>
                    </div>
                )}
                {editModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">Edit {editModal.type === 'structure' ? 'Fee Structure' : 'Payment'}</h3>
                                <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-gray-600">×</button>
                            </div>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                {editModal.type === 'structure' ? (
                                    <>
                                        <div>
                                            <label className="label">Title</label>
                                            <input className="input" autoComplete="off" value={editModal.data.title} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, title: e.target.value } })} />
                                        </div>
                                        <div>
                                            <label className="label">Total Amount</label>
                                            <input className="input" type="number" autoComplete="off" value={editModal.data.total_amount} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, total_amount: e.target.value } })} />
                                        </div>
                                        <div>
                                            <label className="label">Due Date</label>
                                            <input className="input" type="date" autoComplete="off" value={editModal.data.due_date ? new Date(editModal.data.due_date).toISOString().split('T')[0] : ''} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, due_date: e.target.value } })} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="label">Amount Paid</label>
                                            <input className="input" type="number" autoComplete="off" value={editModal.data.amount_paid} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, amount_paid: e.target.value } })} required />
                                        </div>
                                        <div>
                                            <label className="label">Payment Method</label>
                                            <select className="input" value={editModal.data.payment_method} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, payment_method: e.target.value } })}>
                                                <option>Cash</option><option>Bank Transfer</option><option>UPI</option><option>Cheque</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Remarks / UTR</label>
                                            <input className="input" autoComplete="off" value={editModal.data.remarks || ''} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, remarks: e.target.value } })} />
                                        </div>
                                        <div>
                                            <label className="label">Date</label>
                                            <input className="input" type="date" autoComplete="off" value={editModal.data.payment_date ? new Date(editModal.data.payment_date).toISOString().split('T')[0] : ''} onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, payment_date: e.target.value } })} />
                                        </div>
                                    </>
                                )}
                                <button type="submit" className="btn-primary w-full py-3 bg-gray-800 hover:bg-gray-900">Update Changes</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header / Filter */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 md:items-end">
                <div className="flex-1 w-full relative">
                    <h2 className="text-lg font-bold text-gray-800 mb-1">Fee Collection Dashboard</h2>
                    <p className="text-gray-500 text-sm mb-4">Select a Class & Section or Search</p>

                    {/* SEARCH INPUT */}
                    <div className="relative max-w-md">
                        <input
                            type="text"
                            placeholder="Search by Student Name or ID..."
                            autoComplete="off"
                            className="input w-full bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value.replace(/[^a-zA-Z0-9 ]/g, ''))}
                        />
                    </div>
                </div>
                <div className="w-full md:w-auto">
                    <select className="input w-full md:min-w-[150px]" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection(''); }}>
                        <option value="">All Classes</option>
                        {config?.classes?.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)}
                    </select>
                </div>
                <div className="w-full md:w-auto">
                    <select className="input w-full md:min-w-[150px]" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
                        <option value="">All Sections</option>
                        {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="w-full md:w-auto">
                    <select className="input w-full md:min-w-[150px]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="All">All Status</option>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Partial">Partial</option>
                        <option value="No Fees">No Fees</option>
                    </select>
                </div>
                {overview && (
                    <button
                        onClick={handlePrintOverview}
                        className="bg-slate-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-500/20 hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 w-full md:w-auto"
                    >
                        <Printer size={20} /> Print Report
                    </button>
                )}
            </div>

            {loading && <div className="p-8 text-center text-gray-500 animate-pulse">Loading fee data...</div>}

            {/* Overview Cards */}
            {overview && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Students</p>
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                <Users size={16} />
                            </div>
                        </div>
                        <div className="flex justify-between items-end mt-1">
                            <p className="text-2xl font-bold text-slate-800">{overview.summary.total_students}</p>
                            <div className="text-xs text-right text-slate-500 flex flex-col items-end gap-1">
                                <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">{overview.summary.count_paid} Paid</span>
                                <span className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">{overview.summary.count_partial} Partial</span>
                                <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">{overview.summary.count_unpaid} Unpaid</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Expected</p>
                            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                <IndianRupee size={16} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">₹{formatCurrency(overview.summary.total_expected)}</p>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Collected</p>
                            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                <CheckCircle size={16} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600">₹{formatCurrency(overview.summary.total_collected)}</p>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Dues</p>
                            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                                <AlertCircle size={16} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-rose-600">₹{formatCurrency(overview.summary.total_pending)}</p>
                    </div>
                </div>
            )}

            {/* Student List */}
            {overview && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="p-4 pl-6">Student Details</th>
                                    <th className="p-4">Total Fee</th>
                                    <th className="p-4">Paid</th>
                                    <th className="p-4">Balance</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 pr-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {overview.students
                                    .filter(s => {
                                        const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
                                        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            s.admission_no.toLowerCase().includes(searchQuery.toLowerCase());
                                        return matchesStatus && matchesSearch;
                                    })
                                    .slice(0, (statusFilter === 'Paid' && !searchQuery) ? 10 : undefined)
                                    .map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="p-2 md:p-4 pl-4 md:pl-6">
                                                <div className="font-bold text-slate-800">{s.name}</div>
                                                <div className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-2">
                                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-500">#{s.admission_no}</span>
                                                    {s.class_id && !selectedClass && (
                                                        <>
                                                            <span className="text-slate-300">•</span>
                                                            <span className="text-slate-500">Class {config?.classes?.find(c => c.class_id == s.class_id)?.class_name || 'N/A'}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-2 md:p-4 font-mono text-slate-600 font-medium">₹{formatCurrency(s.total_fee)}</td>
                                            <td className="p-2 md:p-4 font-mono text-emerald-600 font-medium">₹{formatCurrency(s.paid)}</td>
                                            <td className="p-2 md:p-4 font-mono">
                                                {s.balance > 0 ? (
                                                    <span className="text-rose-600 font-bold">₹{formatCurrency(s.balance)}</span>
                                                ) : (
                                                    <span className="text-slate-400">₹0.00</span>
                                                )}
                                            </td>
                                            <td className="p-2 md:p-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${s.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    s.status === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${s.status === 'Paid' ? 'bg-emerald-500' :
                                                        s.status === 'Partial' ? 'bg-amber-500' : 'bg-rose-500'
                                                        }`}></span>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="p-2 md:p-4 pr-4 md:pr-6 text-right">
                                                <button
                                                    onClick={() => handleSelectStudent(s)}
                                                    className="bg-white border border-slate-200 text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm hover:shadow active:scale-95"
                                                >
                                                    View & Pay
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                {overview.students.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <Search size={48} className="mb-4 text-slate-200" />
                                                <p className="text-lg font-medium text-slate-500">No students found</p>
                                                <p className="text-sm">Try adjusting your filters</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}</div>
    );
};

export default FeeCollection;
