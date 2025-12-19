import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { studentService } from '../../services/student.service';

const StudentDashboard = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        profile: null,
        attendance: null,
        fees: null,
    });

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setIsLoading(true);
        try {
            const [profileRes, attendanceRes, feesRes] = await Promise.all([
                studentService.getProfile(),
                studentService.getAttendance(),
                studentService.getFees(),
            ]);

            setDashboardData({
                profile: profileRes.data,
                attendance: attendanceRes.data,
                fees: feesRes.data,
            });
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboard();
        setRefreshing(false);
    };

    const handleLogout = async () => {
        await logout();
    };

    const menuItems = [
        { id: 'academics', title: 'Academics', icon: '📚', screen: 'StudentAcademics', color: '#667eea' },
        { id: 'attendance', title: 'Attendance', icon: '✅', screen: 'StudentAttendance', color: '#f093fb' },
        { id: 'fees', title: 'Fees', icon: '💰', screen: 'StudentFees', color: '#4facfe' },
        { id: 'timetable', title: 'Timetable', icon: '📅', screen: 'StudentTimetable', color: '#43e97b' },
        { id: 'library', title: 'Library', icon: '📖', screen: 'StudentLibrary', color: '#fa709a' },
        { id: 'transport', title: 'Transport', icon: '🚌', screen: 'StudentTransport', color: '#30cfd0' },
        { id: 'hostel', title: 'Hostel', icon: '🏠', screen: 'StudentHostel', color: '#a8edea' },
        { id: 'certificates', title: 'Certificates', icon: '🎓', screen: 'StudentCertificates', color: '#ffd89b' },
        { id: 'leaves', title: 'Leave', icon: '📝', screen: 'StudentLeaves', color: '#f6d365' },
        { id: 'doubts', title: 'Ask Doubts', icon: '❓', screen: 'StudentDoubts', color: '#c471f5' },
    ];

    if (isLoading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#667eea" />
                <Text style={styles.loaderText}>Loading Dashboard...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header - Matching Web Sidebar Theme */}
            <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <View style={styles.schoolBadge}>
                            <Text style={styles.schoolName}>SCHOOL PORTAL</Text>
                        </View>
                        <Text style={styles.userName}>
                            {dashboardData.profile?.name || user?.name || 'Student'}
                        </Text>
                        <Text style={styles.userDetails}>
                            Class {dashboardData.profile?.class_name ? `${dashboardData.profile.class_name}-${dashboardData.profile.section_name}` : '...'} • ID: {dashboardData.profile?.admission_no || '...'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />
                }
            >
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {/* Attendance Card - Featured Gradient */}
                    <LinearGradient
                        colors={['#6366f1', '#8b5cf6']}
                        style={[styles.statCard, styles.featuredCard]}
                    >
                        <View>
                            <Text style={styles.featuredLabel}>Attendance</Text>
                            <Text style={styles.featuredValue}>
                                {dashboardData.attendance?.attendancePercentage || '0'}%
                            </Text>
                            <Text style={styles.featuredSub}>
                                Present {dashboardData.attendance?.present || '0'}/{dashboardData.attendance?.total || '0'}
                            </Text>
                        </View>
                        <Text style={styles.cardIcon}>✅</Text>
                    </LinearGradient>

                    {/* Fees Card */}
                    <View style={styles.statCard}>
                        <View>
                            <Text style={styles.statLabel}>Total Due</Text>
                            <Text style={[
                                styles.statValue,
                                { color: dashboardData.fees?.pendingAmount > 0 ? '#e11d48' : '#059669' }
                            ]}>
                                ₹{dashboardData.fees?.pendingAmount || '0'}
                            </Text>
                            <Text style={styles.statSub}>
                                {dashboardData.fees?.pendingAmount > 0 ? 'Payment Pending' : 'All Clear'}
                            </Text>
                        </View>
                        <Text style={styles.cardIcon}>💰</Text>
                    </View>

                    {/* Library Card */}
                    <View style={styles.statCard}>
                        <View>
                            <Text style={styles.statLabel}>Library</Text>
                            <Text style={styles.statValue}>
                                {dashboardData.profile?.totalSubjects || '0'}
                            </Text>
                            <Text style={styles.statSub}>Books Issued</Text>
                        </View>
                        <Text style={styles.cardIcon}>📚</Text>
                    </View>

                    {/* Hostel/Transport */}
                    <View style={styles.statCard}>
                        <View>
                            <Text style={styles.statLabel}>Transport</Text>
                            <Text style={styles.statValue}>Active</Text>
                            <Text style={styles.statSub}>Route 5</Text>
                        </View>
                        <Text style={styles.cardIcon}>🚌</Text>
                    </View>
                </View>

                {/* Menu Grid */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.menuGrid}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.menuItem}
                            onPress={() => navigation.navigate(item.screen)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                                <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                            </View>
                            <Text style={styles.menuTitle}>{item.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc', // Slate 50
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loaderText: {
        marginTop: 10,
        color: '#6366f1',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    schoolBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    schoolName: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    userName: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    userDetails: {
        fontSize: 14,
        color: '#cbd5e1',
        fontWeight: '500',
    },
    logoutButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    logoutText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    scrollContainer: {
        flex: 1,
        marginTop: -20, // Overlap header
        paddingHorizontal: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        justifyContent: 'space-between',
        height: 140,
    },
    featuredCard: {
        borderWidth: 0,
        elevation: 5,
        shadowColor: '#6366f1',
        shadowOpacity: 0.3,
    },
    featuredLabel: {
        color: '#e0e7ff',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    featuredValue: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '800',
    },
    featuredSub: {
        color: '#c7d2fe',
        fontSize: 12,
        marginTop: 4,
    },
    statLabel: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    statValue: { // Generic value style
        color: '#0f172a',
        fontSize: 24,
        fontWeight: '800',
    },
    statSub: {
        color: '#94a3b8',
        fontSize: 11,
        marginTop: 4,
        fontWeight: '500',
    },
    cardIcon: {
        fontSize: 20,
        position: 'absolute',
        bottom: 16,
        right: 16,
        opacity: 0.5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 16,
        marginLeft: 4,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    menuItem: {
        width: '31%', // 3 column layout
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        elevation: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    menuTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
        textAlign: 'center',
    },
});

export default StudentDashboard;
