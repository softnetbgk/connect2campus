import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api.service';
import { ENDPOINTS } from '../../config/api';

const StudentFees = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [feesData, setFeesData] = useState({
        totalFees: 0,
        paidAmount: 0,
        pendingAmount: 0,
        paymentHistory: []
    });

    const fetchFees = async () => {
        try {
            setLoading(true);
            const result = await api.get(ENDPOINTS.STUDENT_FEES);
            if (result.data) {
                setFeesData(result.data);
            }
        } catch (error) {
            console.error('Error fetching fees:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchFees();
        }, [])
    );

    // Helper to format date as dd-mm-yyyy
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    if (loading && !feesData.totalFees) {
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
                <RefreshControl refreshing={loading} onRefresh={fetchFees} />
            }
        >
            {/* Summary Cards */}
            <View style={styles.summarySection}>
                {/* Total Fees - Blue */}
                <View style={[styles.summaryCard, { backgroundColor: '#667eea' }]}>
                    <Text style={styles.summaryLabel}>Total Fees</Text>
                    <Text style={styles.summaryValue}>₹{feesData.totalFees?.toLocaleString()}</Text>
                </View>

                {/* Paid Amount - Green */}
                <View style={[styles.summaryCard, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.summaryLabel}>Paid Amount</Text>
                    <Text style={styles.summaryValue}>₹{feesData.paidAmount?.toLocaleString()}</Text>
                </View>

                {/* Pending Due - Red */}
                <View style={[styles.summaryCard, { backgroundColor: '#F44336' }]}>
                    <Text style={styles.summaryLabel}>Pending Due</Text>
                    <Text style={styles.summaryValue}>₹{feesData.pendingAmount?.toLocaleString()}</Text>
                </View>
            </View>

            {/* Payment History */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment History</Text>
                {feesData.paymentHistory && feesData.paymentHistory.length > 0 ? (
                    feesData.paymentHistory.map((payment, index) => (
                        <View key={index} style={styles.historyCard}>
                            <View style={styles.historyHeader}>
                                <View>
                                    <Text style={styles.historyType}>{payment.feeType}</Text>
                                    <Text style={styles.historyDate}>{formatDate(payment.date)}</Text>
                                </View>
                                <View style={styles.historyAmountContainer}>
                                    <Text style={styles.historyAmount}>₹{parseFloat(payment.amount).toLocaleString()}</Text>
                                    <View style={[
                                        styles.historyStatus,
                                        { backgroundColor: '#e8f5e9' }
                                    ]}>
                                        <Text style={[styles.historyStatusText, { color: '#43e97b' }]}>
                                            {payment.payment_method || 'Cash'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            {payment.receipt_no && (
                                <Text style={styles.receiptNo}>Receipt: {payment.receipt_no}</Text>
                            )}
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.statusIcon}>💳</Text>
                        <Text style={styles.emptyText}>No payment history available</Text>
                    </View>
                )}
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
    summarySection: {
        padding: 20,
        gap: 15,
    },
    summaryCard: {
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    summaryLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
        marginBottom: 5,
    },
    summaryValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    section: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    historyCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyDate: {
        fontSize: 14,
        color: '#666',
        marginTop: 3,
    },
    historyType: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    historyAmountContainer: {
        alignItems: 'flex-end',
    },
    historyAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    historyStatus: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    historyStatusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    receiptNo: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
    },
    emptyState: {
        backgroundColor: '#fff',
        padding: 40,
        borderRadius: 15,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
    statusIcon: {
        fontSize: 50,
        textAlign: 'center',
        marginBottom: 10,
    },
});

export default StudentFees;
