import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Plus, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../api/axios';

import { useAuth } from '../../../context/AuthContext';

const SchoolCalendar = () => {
    const { user } = useAuth();
    const isSchoolAdmin = user?.role === 'SCHOOL_ADMIN';

    const [events, setEvents] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newEvent, setNewEvent] = useState({
        title: '',
        event_type: 'Event',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        description: '',
        audience: 'All'
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/calendar/events');
            setEvents(res.data);
        } catch (error) {
            toast.error('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const handleAddEvent = async () => {
        if (isSubmitting) return;

        if (!newEvent.title || !newEvent.start_date) {
            toast.error('Title and Start Date are required');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/calendar/events', newEvent);
            toast.success('Event added successfully');
            setShowModal(false);
            setNewEvent({
                title: '',
                event_type: 'Event',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0],
                description: '',
                audience: 'All'
            });
            fetchEvents();
        } catch (error) {
            toast.error('Failed to add event');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEvent = async (id) => {
        if (isSubmitting) return;
        if (!window.confirm('Are you sure you want to delete this event?')) return;

        setIsSubmitting(true);
        try {
            await api.delete(`/calendar/events/${id}`);
            toast.success('Event deleted');
            fetchEvents();
        } catch (error) {
            toast.error('Failed to delete event');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Karnataka Festivals & Holidays (Mixed recurring and 2026 specific)
    const karnatakaFestivals = [
        // Fixed Date Holidays (Recurring)
        { date: '01-01', title: 'New Year Day', type: 'Holiday', recurring: true },
        { date: '01-26', title: 'Republic Day', type: 'Holiday', recurring: true },
        { date: '04-14', title: 'Dr. Ambedkar Jayanti', type: 'Holiday', recurring: true },
        { date: '05-01', title: 'May Day', type: 'Holiday', recurring: true },
        { date: '08-15', title: 'Independence Day', type: 'Holiday', recurring: true },
        { date: '10-02', title: 'Gandhi Jayanti', type: 'Holiday', recurring: true },
        { date: '11-01', title: 'Kannada Rajyotsava', type: 'Holiday', recurring: true },
        { date: '12-25', title: 'Christmas', type: 'Holiday', recurring: true },

        // 2026 Specific Holidays
        { date: '2026-01-14', title: 'Makara Sankranti', type: 'Holiday' },
        { date: '2026-02-15', title: 'Maha Shivaratri', type: 'Holiday' },
        { date: '2026-03-19', title: 'Ugadi', type: 'Holiday' },
        { date: '2026-03-20', title: 'Khutub-E-Ramzan', type: 'Holiday' },
        { date: '2026-03-31', title: 'Mahaveera Jayanti', type: 'Holiday' },
        { date: '2026-04-03', title: 'Good Friday', type: 'Holiday' },
        { date: '2026-04-20', title: 'Basava Jayanti', type: 'Holiday' },
        { date: '2026-05-27', title: 'Bakrid', type: 'Holiday' },
        { date: '2026-06-25', title: 'Last Day of Moharam', type: 'Holiday' },
        { date: '2026-08-21', title: 'Varamahalakshmi Vrata', type: 'Holiday' },
        { date: '2026-08-26', title: 'Eid-Milad', type: 'Holiday' },
        { date: '2026-09-14', title: 'Ganesh Chaturthi', type: 'Holiday' },
        { date: '2026-10-19', title: 'Maha Navami / Ayudha Puja', type: 'Holiday' },
        { date: '2026-10-20', title: 'Vijaya Dashami', type: 'Holiday' },
        { date: '2026-11-08', title: 'Deepavali', type: 'Holiday' },
    ];

    const getHolidaysForDate = (dateString) => {
        // dateString is YYYY-MM-DD
        const [y, m, d] = dateString.split('-');
        const monthDay = `${m}-${d}`;
        return karnatakaFestivals.filter(h => {
            if (h.recurring) {
                return h.date === monthDay;
            }
            return h.date === dateString;
        });
    };

    // Calendar rendering logic
    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startingDay = firstDay.getDay(); // 0 is Sunday
        const totalDays = lastDay.getDate();

        const days = [];
        for (let i = 0; i < startingDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-50 border border-slate-100"></div>);
        }

        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(year, month, i);
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const isSunday = date.getDay() === 0;

            const dayEvents = events.filter(e => {
                const eventDate = new Date(e.start_date).toISOString().split('T')[0];
                return eventDate === dateString;
            });

            // Get static holidays
            const holidays = getHolidaysForDate(dateString);

            days.push(
                <div key={i} className={`h-24 md:h-32 border border-slate-100 bg-white p-2 relative hover:bg-slate-50 transition-colors group overflow-hidden ${isSunday ? 'bg-rose-50/30' : ''}`}>
                    <div className="flex justify-between items-start">
                        <span className={`text-sm font-medium ${new Date().toDateString() === date.toDateString()
                            ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full'
                            : isSunday ? 'text-rose-500' : 'text-slate-700'
                            }`}>
                            {i}
                        </span>
                        {isSunday && <span className="text-[10px] font-bold text-rose-400 uppercase">Sunday</span>}
                    </div>

                    <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-24px)] custom-scrollbar">
                        {/* Static Holidays */}
                        {holidays.map((h, idx) => (
                            <div key={`hol-${idx}`} className="text-[10px] md:text-xs p-1 rounded border border-rose-100 bg-rose-50 text-rose-700 truncate font-bold" title={h.title}>
                                🎉 {h.title}
                            </div>
                        ))}

                        {/* Dynamic Events */}
                        {dayEvents.map(ev => (
                            <div key={ev.id} className={`text-[10px] md:text-xs p-1 rounded border truncate cursor-pointer hover:opacity-80
                                ${ev.event_type === 'Holiday' ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-indigo-100 bg-indigo-50 text-indigo-700'}
                            `} title={ev.title}>
                                {ev.title}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return days;
    };

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">School Calendar</h2>
                    <p className="text-slate-500">Manage holidays, exams, and events</p>
                </div>
                {isSchoolAdmin && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={20} /> Add Event
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Calendar Header */}
                <div className="p-4 flex items-center justify-between border-b border-slate-200 bg-slate-50">
                    <button onClick={prevMonth} className="p-2 hover:bg-white rounded-full transition-colors text-slate-600">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-800">
                            {currentDate.toLocaleString('default', { month: 'long' })}
                        </h3>
                        <select
                            value={currentDate.getFullYear()}
                            onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), currentDate.getMonth()))}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
                        >
                            {Array.from({ length: new Date().getFullYear() - 2020 + 1 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={nextMonth} className="p-2 hover:bg-white rounded-full transition-colors text-slate-600">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 text-center border-b border-slate-200 bg-white">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-2 text-sm font-bold text-slate-500 uppercase">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 bg-slate-50">
                    {renderCalendar()}
                </div>
            </div>

            {/* Upcoming Events List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <CalendarIcon size={20} className="text-indigo-600" /> Upcoming Events
                    </h3>
                    <div className="space-y-3">
                        {events
                            .filter(e => new Date(e.start_date) >= new Date())
                            .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                            .slice(0, 5)
                            .map(event => (
                                <div key={event.id} className="flex items-start gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 group">
                                    <div className="text-center bg-indigo-50 rounded-lg p-2 min-w-[60px]">
                                        <span className="block text-xs font-bold text-indigo-400 uppercase">
                                            {new Date(event.start_date).toLocaleString('default', { month: 'short' })}
                                        </span>
                                        <span className="block text-xl font-bold text-indigo-700">
                                            {new Date(event.start_date).getDate()}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800">{event.title}</h4>
                                        <p className="text-sm text-slate-500 line-clamp-1">{event.description}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                                {event.event_type}
                                            </span>
                                        </div>
                                    </div>
                                    {isSchoolAdmin && (
                                        <button onClick={() => handleDeleteEvent(event.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        {events.filter(e => new Date(e.start_date) >= new Date()).length === 0 && (
                            <p className="text-slate-400 text-sm text-center py-4">No upcoming events.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Add Event</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Event Title</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder="e.g. Annual Sports Day"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        value={newEvent.start_date}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={e => setNewEvent({ ...newEvent, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        value={newEvent.end_date}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={e => setNewEvent({ ...newEvent, end_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        value={newEvent.event_type}
                                        onChange={e => setNewEvent({ ...newEvent, event_type: e.target.value })}
                                    >
                                        <option value="Event">Event</option>
                                        <option value="Holiday">Holiday</option>
                                        <option value="Exam">Exam</option>
                                        <option value="Meeting">Meeting</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Audience</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        value={newEvent.audience}
                                        onChange={e => setNewEvent({ ...newEvent, audience: e.target.value })}
                                    >
                                        <option value="All">All</option>
                                        <option value="Students">Students Only</option>
                                        <option value="Teachers">Teachers Only</option>
                                        <option value="Staff">Staff Only</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                                <textarea
                                    rows="3"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    value={newEvent.description}
                                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                    placeholder="Event details..."
                                ></textarea>
                            </div>
                            <button
                                onClick={handleAddEvent}
                                disabled={isSubmitting}
                                className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-bold ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? 'Creating...' : 'Create Event'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchoolCalendar;
