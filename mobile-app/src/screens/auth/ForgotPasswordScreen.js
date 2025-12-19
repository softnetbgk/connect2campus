import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../../services/auth.service';

const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('STUDENT');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleReset = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email or ID');
            return;
        }

        setIsLoading(true);
        setMessage('');

        const result = await authService.forgotPassword(email, role);
        setIsLoading(false);

        if (result.success) {
            setMessage(result.message);
            Alert.alert('Success', 'Reset link sent! Check your email (or console).', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
        } else {
            Alert.alert('Error', result.message);
        }
    };

    const roles = [
        { id: 'STUDENT', label: 'Student' },
        { id: 'TEACHER', label: 'Teacher' },
        { id: 'STAFF', label: 'Staff' },
    ];

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <View style={styles.form}>
                        <Text style={styles.title}>Forgot Password</Text>
                        <Text style={styles.subtitle}>Enter your details to receive a reset link</Text>

                        {/* Role Selection */}
                        <Text style={styles.label}>Select Role</Text>
                        <View style={styles.roleContainer}>
                            {roles.map((r) => (
                                <TouchableOpacity
                                    key={r.id}
                                    style={[
                                        styles.roleButton,
                                        role === r.id && styles.roleButtonActive
                                    ]}
                                    onPress={() => setRole(r.id)}
                                >
                                    <Text style={[
                                        styles.roleText,
                                        role === r.id && styles.roleTextActive
                                    ]}>
                                        {r.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email or ID</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. STU1234 or email@school.com"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleReset}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Send Reset Link</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.backButtonText}>Back to Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    form: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 25,
        elevation: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    roleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    roleButton: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    roleButtonActive: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    roleTextActive: {
        color: '#fff',
    },
    inputContainer: {
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    button: {
        backgroundColor: '#667eea',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#666',
        fontSize: 14,
    },
});

export default ForgotPasswordScreen;
