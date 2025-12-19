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
import { staffService } from '../../services/staff.service';

const StaffDashboard = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        profile: null,
        attendance: null,
        salary: null,
    });

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setIsLoading(true);
        try {
            const [profileRes, attendanceRes, salaryRes] = await Promise.all([
                staffService.getProfile(),
                staffService.getAttendance(),
                staffService.getSalary(),
            ]);

            setDashboardData({
                profile: profileRes.data,
                attendance: attendanceRes.data,
                salary: salaryRes.data,
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
        { id: 'attendance', title: 'My Attendance', icon: '✅', screen: 'StaffAttendance', color: '#667eea' },
        { id: 'salary', title: 'Salary', icon: '💰', screen: 'StaffSalary', color: '#4facfe' },
        { id: 'leaves', title: 'Leave', icon: '📝', screen: 'StaffLeaves', color: '#43e97b' },
        { id: 'daily', title: 'Daily Status', icon: '📊', screen: 'StaffDailyStatus', color: '#fa709a' },
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
            <LinearGradient colors={['#064e3b', '#059669']} style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <View style={styles.schoolBadge}>
                            <Text style={styles.schoolName}>STAFF PORTAL</Text>
                        </View>
                        <Text style={styles.userName}>
                            {user?.name || 'Staff Member'}
                        </Text>
                        <Text style={styles.userDetails}>
                            {user?.designation || 'Staff'} • ID: {user?.id || '...'}
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
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />
                }
            >
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {/* Attendance Card - Featured Gradient */}
                    <LinearGradient
                        colors={['#0d9488', '#0f766e']}
                        style={[styles.statCard, styles.featuredCard]}
                    >
                        <View>
                            <Text style={styles.featuredLabel}>Attendance</Text>
                            <Text style={styles.featuredValue}>
                                {dashboardData.attendance?.attendancePercentage || '0'}%
                            </Text>
                            <Text style={styles.featuredSub}>
                                Present Today
                            </Text>
                        </View>
                        <Text style={styles.cardIcon}>✅</Text>
                    </LinearGradient>

                    {/* Salary Card */}
                    <View style={styles.statCard}>
                        <View>
                            <Text style={styles.statLabel}>Last Salary</Text>
                            <Text style={[styles.statValue, { color: '#059669' }]}>
                                ₹{dashboardData.salary?.lastSalary || '0'}
                            </Text>
                            <Text style={styles.statSub}>Credited</Text>
                        </View>
                        <Text style={styles.cardIcon}>💰</Text>
                    </View>

                    {/* Leaves Card */}
                    <View style={styles.statCard}>
                        <View>
                            <Text style={styles.statLabel}>Leaves</Text>
                            <Text style={styles.statValue}>
                                {dashboardData.profile?.leavesLeft || '0'}
                            </Text>
                            <Text style={styles.statSub}>Days Remaining</Text>
                        </View>
                        <Text style={styles.cardIcon}>📝</Text>
                    </View>
                </View>

                {/* Menu Grid */}
                <Text style={styles.sectionTitle}>Dashboard Menu</Text>
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
        color: '#059669',
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
        color: '#a7f3d0',
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
        color: '#d1fae5',
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
        shadowColor: '#0d9488',
        shadowOpacity: 0.3,
    },
    featuredLabel: {
        color: '#ccfbf1',
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
        color: '#99f6e4',
        fontSize: 12,
        marginTop: 4,
    },
    statLabel: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    statValue: {
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
        width: '31%',
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

export default StaffDashboard;
