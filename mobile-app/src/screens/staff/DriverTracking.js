import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Switch,
    Dimensions
} from 'react-native';
import * as Location from 'expo-location';
import { staffService } from '../../services/staff.service';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../../components/ScreenHeader';

const DriverTracking = ({ navigation }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isTracking, setIsTracking] = useState(false);
    const [transportData, setTransportData] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const trackingInterval = useRef(null);

    useEffect(() => {
        loadData();
        return () => stopTracking();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const result = await staffService.getTransport();
        if (result.success) {
            setTransportData(result.data);
        } else {
            console.warn(result.message);
        }
        setIsLoading(false);
    };

    const startTracking = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'enable GPS IN BROWSER Setting / Location Settings to track the bus.');
            return;
        }

        setIsTracking(true);

        // Immediate update
        updateLocation();

        // Repeated update every 30 seconds
        trackingInterval.current = setInterval(updateLocation, 30000);
    };

    const stopTracking = () => {
        setIsTracking(false);
        if (trackingInterval.current) {
            clearInterval(trackingInterval.current);
            trackingInterval.current = null;
        }
    };

    const updateLocation = async () => {
        try {
            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });

            setCurrentLocation(location.coords);

            if (transportData?.vehicle_id) {
                await staffService.updateLocation(transportData.vehicle_id, {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude
                });
            }
        } catch (error) {
            console.error('Location update error:', error);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    if (!transportData) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="GPS Tracking" onBack={() => navigation.navigate('StaffDashboard')} />
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🚌</Text>
                    <Text style={styles.emptyText}>No vehicle assigned to you.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title="Bus Tracking" onBack={() => navigation.navigate('StaffDashboard')} />

            <View style={styles.content}>
                <LinearGradient
                    colors={isTracking ? ['#059669', '#10b981'] : ['#475569', '#64748b']}
                    style={styles.statusCard}
                >
                    <View style={styles.statusHeader}>
                        <View>
                            <Text style={styles.statusLabel}>TRACKING STATUS</Text>
                            <Text style={styles.statusValue}>{isTracking ? 'LIVE' : 'OFFLINE'}</Text>
                        </View>
                        <Switch
                            value={isTracking}
                            onValueChange={(val) => val ? startTracking() : stopTracking()}
                            trackColor={{ false: '#94a3b8', true: '#a7f3d0' }}
                            thumbColor={isTracking ? '#fff' : '#f1f5f9'}
                        />
                    </View>

                    {isTracking && currentLocation && (
                        <View style={styles.locationRow}>
                            <Text style={styles.locationText}>
                                Lat: {currentLocation.latitude.toFixed(4)} | Lng: {currentLocation.longitude.toFixed(4)}
                            </Text>
                        </View>
                    )}
                </LinearGradient>

                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Vehicle Details</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Vehicle Number</Text>
                            <Text style={styles.infoValue}>{transportData.vehicle_number}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Route</Text>
                            <Text style={styles.infoValue}>{transportData.route_name}</Text>
                        </View>
                    </View>
                </View>

                {isTracking ? (
                    <View style={styles.trackingHint}>
                        <Text style={styles.hintIcon}>🛰️</Text>
                        <Text style={styles.hintText}>
                            Broadcasting location to students and parents every 30 seconds. Keep the app open for best results.
                        </Text>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.startButton} onPress={startTracking}>
                        <Text style={styles.startButtonText}>Start Trip</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
    },
    statusCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    statusValue: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '900',
    },
    locationRow: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    locationText: {
        color: '#fff',
        fontSize: 12,
        opacity: 0.9,
    },
    infoSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    infoLabel: {
        color: '#64748b',
        fontSize: 14,
    },
    infoValue: {
        color: '#1e293b',
        fontSize: 14,
        fontWeight: 'bold',
    },
    trackingHint: {
        flexDirection: 'row',
        backgroundColor: '#f0f9ff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#bae6fd',
    },
    hintIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    hintText: {
        flex: 1,
        fontSize: 13,
        color: '#0369a1',
        lineHeight: 18,
    },
    startButton: {
        backgroundColor: '#059669',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 4,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 80,
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 18,
        color: '#64748b',
        textAlign: 'center',
    },
});

export default DriverTracking;
