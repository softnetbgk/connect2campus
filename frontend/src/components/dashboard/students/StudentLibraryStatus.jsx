import React, { useState, useEffect } from 'react';
import { BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

const StudentLibraryStatus = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            const res = await api.get('/library/my-books');
            // Support both array and wrapped object formats
            const data = res.data;
            setBooks(Array.isArray(data) ? data : (data.books || []));
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch library books');
        } finally {
            setLoading(false);
        }
    };

    const isOverdue = (dueDate) => {
        return new Date(dueDate) < new Date();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return <div className="text-center py-10 text-slate-400">Loading library records...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <BookOpen className="text-indigo-600" /> My Issued Books
                    </h3>
                    <div className="text-sm font-medium text-slate-500">
                        Total Issued: <span className="text-slate-800 font-bold">{books.length}</span>
                    </div>
                </div>

                {books.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No books currently issued to you.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-4 rounded-tl-xl">Book Title</th>
                                    <th className="p-4">Author</th>
                                    <th className="p-4">Book No</th>
                                    <th className="p-4">Issue Date</th>
                                    <th className="p-4">Due Date</th>
                                    <th className="p-4 rounded-tr-xl">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {books.map((book) => {
                                    const overdue = isOverdue(book.due_date);
                                    return (
                                        <tr key={book.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-bold text-slate-800">{book.book_title}</td>
                                            <td className="p-4 text-slate-600">{book.author}</td>
                                            <td className="p-4 font-mono text-slate-500 text-xs">{book.book_number}</td>
                                            <td className="p-4 text-slate-500">{formatDate(book.issue_date)}</td>
                                            <td className="p-4 font-medium text-slate-700">{formatDate(book.due_date)}</td>
                                            <td className="p-4">
                                                {overdue ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold border border-rose-100">
                                                        <AlertCircle size={14} /> Overdue
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
                                                        <CheckCircle size={14} /> Active
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentLibraryStatus;
