import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
// IMPROVED IMPORT: Pointing to api.service instead of config/api
import api from '../../services/api.service';
import { ENDPOINTS } from '../../config/api';

const StudentAttendance = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        percentage: 0,
        totalDays: 0,
        presentDays: 0,
        absentDays: 0
    });
    const [markedDates, setMarkedDates] = useState({});
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0]);

    const fetchAttendance = useCallback(async (date) => {
        try {
            // Ensure date is a valid Date object
            const targetDate = new Date(date);
            if (isNaN(targetDate.getTime())) {
                console.warn('Invalid date passed to fetchAttendance');
                return;
            }

            setLoading(true);
            const month = targetDate.getMonth() + 1; // 1-12
            const year = targetDate.getFullYear();

            console.log(`Fetching attendance for ${month}/${year}`);
            const response = await api.get(ENDPOINTS.STUDENT_ATTENDANCE, {
                params: { month, year }
            });

            if (response.data) {
                const data = response.data;
                setStats({
                    percentage: data.attendancePercentage || 0,
                    totalDays: data.totalDays || 0,
                    presentDays: data.presentDays || 0,
                    absentDays: data.absentDays || 0
                });

                processAttendanceData(data.monthlyRecords || []);
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
            // Log full error for debugging
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchAttendance(currentDate);
        }, [currentDate, fetchAttendance])
    );

    const processAttendanceData = (records) => {
        const marked = {};
        records.forEach(record => {
            const dateStr = record.date.split('T')[0];
            let color = '#ccc';
            let status = record.status;

            if (status === 'Present') color = '#4CAF50';
            else if (status === 'Absent') color = '#F44336';
            else if (status === 'Late') color = '#FFC107';
            else if (status === 'Half Day') color = '#2196F3';
            else if (status === 'Holiday') color = '#9C27B0';

            marked[dateStr] = {
                customStyles: {
                    container: {
                        backgroundColor: color,
                        borderRadius: 8,
                    },
                    text: {
                        color: 'white',
                        fontWeight: 'bold'
                    }
                },
                selected: true,
                selectedColor: color // Fallback
            };
        });
        setMarkedDates(marked);
    };

    const handleMonthChange = (date) => {
        // React-native-calendars returns { year, month, day, timestamp, dateString }
        // Month is 1-12
        if (date && date.year && date.month) {
            const newDate = new Date(date.year, date.month - 1, 1);
            setCurrentDate(newDate);
            setSelectedMonth(`${date.year}-${String(date.month).padStart(2, '0')}-01`);
        }
    };

    if (loading && !stats.totalDays && Object.keys(markedDates).length === 0) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={loading} onRefresh={() => fetchAttendance(currentDate)} />
            }
        >
            <View style={styles.headerContainer}>
                <View style={styles.circleContainer}>
                    <View style={styles.circleGradient}>
                        <View style={styles.circleInner}>
                            <Text style={styles.percentageText}>{stats.percentage}%</Text>
                            <Text style={styles.percentageLabel}>Attendance</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    <View style={[styles.statBox, { backgroundColor: '#667eea' }]}>
                        <Text style={styles.statNumber}>{stats.totalDays}</Text>
                        <Text style={styles.statLabel}>Total Days</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: '#4CAF50' }]}>
                        <Text style={styles.statNumber}>{stats.presentDays}</Text>
                        <Text style={styles.statLabel}>Present</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: '#F44336' }]}>
                        <Text style={styles.statNumber}>{stats.absentDays}</Text>
                        <Text style={styles.statLabel}>Absent</Text>
                    </View>
                </View>
            </View>

            <View style={styles.calendarContainer}>
                <Text style={styles.sectionTitle}>Monthly Record</Text>
                <View style={styles.calendarWrapper}>
                    <Calendar
                        current={selectedMonth}
                        key={selectedMonth} // Force re-render on month change to avoid glitch
                        onMonthChange={handleMonthChange}
                        markingType={'custom'}
                        markedDates={markedDates}
                        theme={{
                            todayTextColor: '#667eea',
                            arrowColor: '#667eea',
                            monthTextColor: '#333',
                            textMonthFontWeight: 'bold',
                            textDayHeaderFontWeight: '600',
                            backgroundColor: '#ffffff',
                            calendarBackground: '#ffffff',
                        }}
                        enableSwipeMonths={true}
                    />
                </View>
            </View>

            <View style={styles.legendContainer}>
                <Text style={styles.legendTitle}>Legend</Text>
                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                        <Text style={styles.legendText}>Present</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
                        <Text style={styles.legendText}>Absent</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#FFC107' }]} />
                        <Text style={styles.legendText}>Late</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
                        <Text style={styles.legendText}>Half Day</Text>
                    </View>
                </View>
            </View>

            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f7fa',
    },
    headerContainer: {
        backgroundColor: '#fff',
        paddingVertical: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    circleContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    circleGradient: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#e0e7ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#667eea'
    },
    circleInner: {
        alignItems: 'center',
    },
    percentageText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#667eea',
    },
    percentageLabel: {
        fontSize: 14,
        color: '#666',
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: 20,
        justifyContent: 'space-between',
    },
    statBox: {
        width: '30%',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
        elevation: 2,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 10,
        color: '#fff',
    },
    calendarContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    calendarWrapper: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 5,
        elevation: 3,
        overflow: 'hidden' // Ensure content doesn't spill
    },
    legendContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    legendTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginBottom: 10,
    },
    legendRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        elevation: 2,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '50%',
        marginBottom: 10,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendText: {
        fontSize: 14,
        color: '#444',
    }
});

export default StudentAttendance;
