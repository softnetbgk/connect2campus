import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, Calendar, PieChart, TrendingUp, TrendingDown, ArrowUp, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ExpenditureManagement = () => {
    const [expenditures, setExpenditures] = useState([]);
    const [stats, setStats] = useState({ today: 0, month: 0, year: 0 });
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all'); // all, today, month, year

    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'Maintenance',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash'
    });

    useEffect(() => {
        fetchExpenditures();
        fetchStats();
    }, []);

    const fetchExpenditures = async () => {
        setLoading(true);
        try {
            const res = await api.get('/finance/expenditures');
            setExpenditures(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load expenditures');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/finance/expenditures/stats');
            setStats(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.amount) {
            toast.error('Please fill required fields');
            return;
        }

        try {
            await api.post('/finance/expenditures', formData);
            toast.success('Expenditure added successfully');
            setShowModal(false);
            setFormData({
                title: '',
                amount: '',
                category: 'Maintenance',
                description: '',
                expense_date: new Date().toISOString().split('T')[0],
                payment_method: 'Cash'
            });
            fetchExpenditures();
            fetchStats();
        } catch (error) {
            console.error(error);
            toast.error('Failed to add expenditure');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this expenditure?')) return;
        try {
            await api.delete(`/finance/expenditures/${id}`);
            toast.success('Expenditure deleted');
            fetchExpenditures();
            fetchStats();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const filteredExpenditures = expenditures.filter(item => {
        const itemDate = new Date(item.expense_date);
        const now = new Date();

        if (filter === 'today') {
            return itemDate.toISOString().split('T')[0] === now.toISOString().split('T')[0];
        }
        if (filter === 'month') {
            return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        }
        if (filter === 'year') {
            return itemDate.getFullYear() === now.getFullYear();
        }
        return true;
    });

    const categoryColors = {
        'Maintenance': 'bg-blue-100 text-blue-700',
        'Supplies': 'bg-green-100 text-green-700',
        'Salary': 'bg-purple-100 text-purple-700',
        'Utilities': 'bg-orange-100 text-orange-700',
        'Other': 'bg-slate-100 text-slate-700'
    };

    const handlePrint = () => {
        const totalAmount = filteredExpenditures.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const filterTitle = filter === 'all' ? 'All Expenditures' :
            filter === 'today' ? "Today's Expenditures" :
                filter === 'month' ? "This Month's Expenditures" : "This Year's Expenditures";

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Expenditure Report - ${filterTitle}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; padding: 20px; background: white; }
                    h1 { text-align: center; color: #333; font-size: 20px; margin-bottom: 5px; }
                    h2 { text-align: center; color: #666; font-size: 16px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #4f46e5; color: white; font-weight: bold; }
                    .amount { color: #dc2626; font-weight: bold; text-align: right; }
                    .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px dashed #ccc; font-size: 11px; color: #666; }
                    @media print { body { padding: 10px; } @page { margin: 0.5cm; } }
                </style>
            </head>
            <body>
                <h1>Expenditure Report</h1>
                <h2>${filterTitle}</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Payment Method</th>
                            <th style="text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredExpenditures.map(item => `
                            <tr>
                                <td>${new Date(item.expense_date).toLocaleDateString('en-GB')}</td>
                                <td>${item.title}</td>
                                <td>${item.category}</td>
                                <td>${item.description || '-'}</td>
                                <td>${item.payment_method}</td>
                                <td class="amount">₹${parseFloat(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background: #f5f5f5; font-weight: bold;">
                            <td colspan="5" style="text-align: right; padding-right: 15px;">Total Expenditure</td>
                            <td class="amount">₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tfoot>
                </table>
                <div class="footer">
                    <p>Generated on: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Expenditure Management</h2>
                    <p className="text-slate-500">Track and manage school expenses</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handlePrint}
                        className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                        <Printer size={20} /> Print Report
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                        <Plus size={20} /> Add New Expense
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                            <TrendingDown size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Today's Expense</p>
                            <h3 className="text-2xl font-bold text-slate-800">₹{stats.today.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                            <PieChart size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Monthly Expense</p>
                            <h3 className="text-2xl font-bold text-slate-800">₹{stats.month.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Yearly Expense</p>
                            <h3 className="text-2xl font-bold text-slate-800">₹{stats.year.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart Section ... */}

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            All Expenses
                        </button>
                        <button
                            onClick={() => setFilter('year')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'year' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            This Year
                        </button>
                        <button
                            onClick={() => setFilter('month')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'month' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            This Month
                        </button>
                        <button
                            onClick={() => setFilter('today')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'today' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Today
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Title</th>
                                <th className="px-6 py-3 font-semibold">Category</th>
                                <th className="px-6 py-3 font-semibold">Date</th>
                                <th className="px-6 py-3 font-semibold">Amount</th>
                                <th className="px-6 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredExpenditures.length > 0 ? (
                                filteredExpenditures.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-slate-800">
                                            {item.title}
                                            <div className="text-xs text-slate-400 font-normal">{item.description}</div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${categoryColors[item.category] || 'bg-slate-100'}`}>
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-slate-500">
                                            {new Date(item.expense_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-3 font-bold text-red-600">
                                            -₹{parseFloat(item.amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-slate-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                        No expenditures found for this period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800">Add New Expenditure</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Office Supplies"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Amount</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        value={formData.expense_date}
                                        onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Supplies">Supplies</option>
                                        <option value="Utilities">Utilities</option>
                                        <option value="Salary">Salary</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Method</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        value={formData.payment_method}
                                        onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="UPI">UPI</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    rows="3"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional details..."
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                                >
                                    Save Expenditure
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenditureManagement;
