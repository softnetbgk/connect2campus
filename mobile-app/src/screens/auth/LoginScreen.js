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
    ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('STUDENT');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setIsLoading(true);
        const result = await login(email, password, role);
        setIsLoading(false);

        if (!result.success) {
            Alert.alert('Login Failed', result.message);
        }
    };

    const roles = [
        { id: 'TEACHER', label: 'Teacher', icon: 'account-multiple' },
        { id: 'STUDENT', label: 'Student', icon: 'school-outline' },
        { id: 'STAFF', label: 'Staff', icon: 'briefcase' },
    ];

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ImageBackground
                source={require('../../../assets/login-bg.jpg')}
                style={styles.container}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(30, 27, 75, 0.85)', 'rgba(49, 46, 129, 0.8)', 'rgba(15, 23, 42, 0.85)']}
                    style={styles.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.content}>
                        <View style={styles.header}>
                            <View style={styles.logoContainer}>
                                <Icon name="school" size={40} color="#fff" />
                            </View>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>Sign in to your dashboard</Text>
                        </View>

                        <View style={styles.formCard}>
                            {/* Role Selection */}
                            <Text style={styles.sectionTitle}>Select Your Role</Text>
                            <View style={styles.roleGrid}>
                                {roles.map((r) => (
                                    <TouchableOpacity
                                        key={r.id}
                                        style={[
                                            styles.roleButton,
                                            role === r.id && styles.roleButtonActive
                                        ]}
                                        onPress={() => setRole(r.id)}
                                    >
                                        <Icon
                                            name={r.icon}
                                            size={24}
                                            color={role === r.id ? '#818cf8' : '#64748b'}
                                        />
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
                                <Text style={styles.label}>
                                    {['STUDENT', 'TEACHER', 'STAFF'].includes(role) ? 'Email / ID' : 'Email Address'}
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={['STUDENT', 'TEACHER', 'STAFF'].includes(role) ? "e.g. STU1234 or email" : "admin@school.com"}
                                    placeholderTextColor="#64748b"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                />
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputContainer}>
                                <View style={styles.passwordHeader}>
                                    <Text style={styles.label}>Password</Text>
                                    <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                                        <Text style={styles.forgotPassword}>Forgot?</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.passwordInputWrapper}>
                                    <TextInput
                                        style={[styles.input, styles.passwordInput]}
                                        placeholder="••••••••"
                                        placeholderTextColor="#64748b"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        editable={!isLoading}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeIcon}
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        <Icon
                                            name={showPassword ? "eye" : "eye-off"}
                                            size={20}
                                            color="#64748b"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Login Button */}
                            <TouchableOpacity
                                style={[styles.button, isLoading && styles.buttonDisabled]}
                                onPress={handleLogin}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <LinearGradient
                                        colors={['#4f46e5', '#7c3aed']}
                                        style={styles.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.buttonText}>Access Portal</Text>
                                        <Icon name="arrow-right" size={20} color="#fff" style={{ marginLeft: 8 }} />
                                    </LinearGradient>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.resetButton}
                                onPress={async () => {
                                    const { Alert } = require('react-native');
                                    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                                    try {
                                        await AsyncStorage.clear();
                                        Alert.alert('Success', 'App data cleared');
                                    } catch (e) {
                                        Alert.alert('Error', 'Failed to clear data');
                                    }
                                }}
                            >
                                <Text style={styles.resetButtonText}>Reset App Data</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </LinearGradient>
            </ImageBackground>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: 'rgba(99, 102, 241, 0.2)', // Indigo tint
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        transform: [{ rotate: '-5deg' }]
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#94a3b8',
        fontWeight: '500',
    },
    formCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.7)', // Slate 800 with opacity
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
        textAlign: 'center',
    },
    roleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 12,
    },
    roleButton: {
        width: '48%',
        backgroundColor: 'rgba(15, 23, 42, 0.6)', // Slate 900
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 0,
    },
    roleButtonActive: {
        backgroundColor: 'rgba(79, 70, 229, 0.15)', // Indigo
        borderColor: '#4f46e5',
    },
    roleText: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    roleTextActive: {
        color: '#818cf8', // Indigo 400
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#cbd5e1', // Slate 300
        marginBottom: 8,
        marginLeft: 4,
    },
    passwordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    forgotPassword: {
        fontSize: 12,
        color: '#818cf8',
        fontWeight: '600',
    },
    input: {
        backgroundColor: 'rgba(15, 23, 42, 0.8)', // Slate 900
        borderRadius: 16,
        padding: 16,
        fontSize: 15,
        color: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    passwordInputWrapper: {
        position: 'relative',
    },
    passwordInput: {
        paddingRight: 50,
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        top: 16,
    },
    button: {
        marginTop: 12,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    buttonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    resetButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    resetButtonText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '500',
        opacity: 0.8,
    },
});

export default LoginScreen;
