import React, { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, CheckCircle, Clock, Eye } from 'lucide-react';
import api from '../../../api/axios';

const StudentFees = ({ student, schoolName }) => {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);

    const handlePrintReceipt = (payment) => {
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Fee Receipt #${payment.receipt_no}</title>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; background: #fff; padding: 20px; text-align: center; }
                    .receipt { max-width: 400px; margin: 0 auto; border: 2px solid #333; padding: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                    .header h1 { margin: 0; font-size: 22px; text-transform: uppercase; color: #333; }
                    .school-name { font-size: 16px; font-weight: bold; margin: 5px 0 20px; color: #555; }
                    .receipt-no { background: #333; color: white; display: inline-block; padding: 4px 12px; font-weight: bold; font-size: 14px; border-radius: 4px; margin-bottom: 20px; }
                    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd; text-align: left; }
                    .label { font-weight: bold; color: #555; font-size: 12px; }
                    .value { font-weight: bold; color: #222; font-size: 13px; }
                    .amount-row { background: #f8f9fa; padding: 15px; margin: 20px 0; border: 1px dashed #333; }
                    .amount { font-size: 24px; color: #16a34a; font-weight: bold; }
                    .footer { margin-top: 20px; padding-top: 15px; font-size: 10px; color: #888; border-top: 1px solid #eee; }
                    @media print {
                        body { padding: 0; }
                        .receipt { border: none; box-shadow: none; width: 100%; max-width: none; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <h1>Payment Receipt</h1>
                        <div class="school-name">${schoolName || 'School Name'}</div>
                        <div class="receipt-no">RECEIPT #${payment.receipt_no || 'N/A'}</div>
                    </div>
                    <div class="row"><span class="label">Date:</span> <span class="value">${new Date(payment.date).toLocaleDateString('en-GB')}</span></div>
                    <div class="row"><span class="label">Student Name:</span> <span class="value">${student?.name || 'N/A'}</span></div>
                    <div class="row"><span class="label">Admission No:</span> <span class="value">${student?.admission_no || 'N/A'}</span></div>
                    <div class="row"><span class="label">Class:</span> <span class="value">${student?.class_name || ''} ${student?.section_name || ''}</span></div>
                    <div class="row"><span class="label">Fee Type:</span> <span class="value">${payment.feeType}</span></div>
                    <div class="row"><span class="label">Payment Method:</span> <span class="value" style="text-transform: capitalize;">${payment.payment_method}</span></div>
             
                    <div class="amount-row">
                        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Total Amount Paid</div>
                        <div class="amount">₹${parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div class="footer">
                        <p>This is a computer-generated receipt.</p>
                        <p>Generated on: ${new Date().toLocaleString()}</p>
                        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                            <button onclick="window.print()" style="padding: 10px 20px; background: #333; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Print Receipt</button>
                            <button onclick="window.close()" style="padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Close</button>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank', 'height=600,width=800');
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statusRes, historyRes] = await Promise.all([
                    api.get('/fees/my-status'),
                    api.get('/students/my-fees')
                ]);
                setFees(statusRes.data);
                setHistory(historyRes.data.paymentHistory || []);
            } catch (error) {
                console.error("Failed to load fee data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Function to format date as dd-mm-yyyy
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading fee details...</div>;

    const totalDue = fees.reduce((sum, f) => sum + parseFloat(f.balance), 0);

    return (
        <div className="space-y-8 animate-in fade-in">
            {/* Summary Card */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
                <div>
                    <p className="text-slate-400 font-medium mb-1">Total Outstanding Fees</p>
                    <h2 className="text-4xl font-black">₹{totalDue.toLocaleString()}</h2>
                </div>
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <DollarSign size={32} className="text-emerald-400" />
                </div>
            </div>

            {/* Fee List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Fee Structure & Status</h3>
                        <p className="text-xs text-slate-500 mt-1">Breakdown of applicable fees and their payment status</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Fee Title</th>
                                <th className="px-6 py-4">Due Date</th>
                                <th className="px-6 py-4 text-right">Total Amount</th>
                                <th className="px-6 py-4 text-right">Paid</th>
                                <th className="px-6 py-4 text-right">Balance</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {fees.length > 0 ? (
                                fees.map((fee) => (
                                    <tr key={fee.fee_structure_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{fee.title}</div>
                                            <div className="text-xs text-slate-400 font-medium">{fee.type === 'CLASS_DEFAULT' ? 'Class Fee' : 'Individual Fee'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm font-medium">
                                            {formatDate(fee.due_date)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-800">
                                            ₹{parseFloat(fee.total_amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-emerald-600">
                                            ₹{parseFloat(fee.paid_amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-rose-600">
                                            ₹{parseFloat(fee.balance).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${fee.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                fee.status === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    'bg-rose-50 text-rose-700 border-rose-100'
                                                }`}>
                                                {fee.status === 'Paid' && <CheckCircle size={12} />}
                                                {fee.status === 'Partial' && <Clock size={12} />}
                                                {fee.status === 'Unpaid' && <AlertCircle size={12} />}
                                                {fee.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                        No fee records found for the current session.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment History / Receipts */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-800">Payment History (Receipts)</h3>
                    <p className="text-xs text-slate-500 mt-1">Record of all successful transactions</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Receipt No</th>
                                <th className="px-6 py-4">Fee Type</th>
                                <th className="px-6 py-4">Method</th>
                                <th className="px-6 py-4 text-right">Amount Paid</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.length > 0 ? (
                                history.map((record, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                            {formatDate(record.date)}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                                            {record.receipt_no || '-'}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            {record.feeType}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm capitalize">
                                            {record.payment_method}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                            ₹{parseFloat(record.amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handlePrintReceipt(record)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                                                title="View Receipt"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                        No payment history found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="text-center text-xs text-slate-400 mt-4">
                Note: Online fee payment is currently disabled. Please visit the school office for payments.
            </p>
        </div>
    );
};

export default StudentFees;
