import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Student Screens
import StudentDashboard from '../screens/student/StudentDashboard';
import StudentAttendance from '../screens/student/StudentAttendance';
import StudentFees from '../screens/student/StudentFees';
import StudentAcademics from '../screens/student/StudentAcademics';
import StudentDoubts from '../screens/student/StudentDoubts';
import StudentLeaves from '../screens/student/StudentLeaves';
import StudentLibrary from '../screens/student/StudentLibrary';
import StudentHostel from '../screens/student/StudentHostel';
import StudentTransport from '../screens/student/StudentTransport';
import StudentCertificates from '../screens/student/StudentCertificates';

// Teacher Screens
import TeacherDashboard from '../screens/teacher/TeacherDashboard';
import TeacherMyAttendance from '../screens/teacher/TeacherMyAttendance';
import TeacherSalary from '../screens/teacher/TeacherSalary';
import TeacherTimetable from '../screens/teacher/TeacherTimetable';
import TeacherDoubts from '../screens/teacher/TeacherDoubts';
import TeacherLeaves from '../screens/teacher/TeacherLeaves';
import TeacherLibrary from '../screens/teacher/TeacherLibrary';
import TeacherTransport from '../screens/teacher/TeacherTransport';

// Staff Screens
import StaffDashboard from '../screens/staff/StaffDashboard';
import StaffMyAttendance from '../screens/staff/StaffMyAttendance';
import StaffSalary from '../screens/staff/StaffSalary';
import StaffTransport from '../screens/staff/StaffTransport';

const Stack = createStackNavigator();

const AppNavigator = () => {
    const { user, isLoading, isAuthenticated } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isAuthenticated ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    </>
                ) : (
                    <>
                        {/* Student Screens */}
                        {user?.role === 'STUDENT' && (
                            <>
                                <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
                                <Stack.Screen name="StudentAttendance" component={StudentAttendance} />
                                <Stack.Screen name="StudentAcademics" component={StudentAcademics} />
                                <Stack.Screen name="StudentFees" component={StudentFees} />
                                <Stack.Screen name="StudentDoubts" component={StudentDoubts} />
                                <Stack.Screen name="StudentLeaves" component={StudentLeaves} />
                                <Stack.Screen name="StudentLibrary" component={StudentLibrary} />
                                <Stack.Screen name="StudentHostel" component={StudentHostel} />
                                <Stack.Screen name="StudentTransport" component={StudentTransport} />
                                <Stack.Screen name="StudentCertificates" component={StudentCertificates} />
                                <Stack.Screen name="StudentTimetable" component={PlaceholderScreen} />
                                <Stack.Screen name="StudentAnnouncements" component={PlaceholderScreen} />
                                <Stack.Screen name="StudentCalendar" component={PlaceholderScreen} />
                            </>
                        )}

                        {/* Teacher Screens */}
                        {user?.role === 'TEACHER' && (
                            <>
                                <Stack.Screen name="TeacherDashboard" component={TeacherDashboard} />
                                <Stack.Screen name="TeacherMyAttendance" component={TeacherMyAttendance} />
                                <Stack.Screen name="TeacherTimetable" component={TeacherTimetable} />
                                <Stack.Screen name="TeacherSalary" component={TeacherSalary} />
                                <Stack.Screen name="TeacherLeaves" component={TeacherLeaves} />
                                <Stack.Screen name="TeacherDoubts" component={TeacherDoubts} />
                                <Stack.Screen name="TeacherLibrary" component={TeacherLibrary} />
                                <Stack.Screen name="TeacherTransport" component={TeacherTransport} />
                                <Stack.Screen name="TeacherAnnouncements" component={PlaceholderScreen} />
                                <Stack.Screen name="TeacherCalendar" component={PlaceholderScreen} />
                            </>
                        )}

                        {/* Staff Screens */}
                        {['STAFF', 'DRIVER'].includes(user?.role) && (
                            <>
                                <Stack.Screen name="StaffDashboard" component={StaffDashboard} />
                                <Stack.Screen name="StaffMyAttendance" component={StaffMyAttendance} />
                                <Stack.Screen name="StaffSalary" component={StaffSalary} />
                                <Stack.Screen name="StaffTransport" component={StaffTransport} />
                                <Stack.Screen name="StaffAnnouncements" component={PlaceholderScreen} />
                                <Stack.Screen name="StaffCalendar" component={PlaceholderScreen} />
                            </>
                        )}
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

// Temporary placeholder for screens not yet implemented
const PlaceholderScreen = ({ navigation }) => {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fa' }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>🚧</Text>
            <Text style={{ fontSize: 18, color: '#333', marginBottom: 30 }}>Coming Soon</Text>
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                    backgroundColor: '#667eea',
                    paddingHorizontal: 30,
                    paddingVertical: 15,
                    borderRadius: 25,
                }}
            >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Go Back</Text>
            </TouchableOpacity>
        </View>
    );
};

export default AppNavigator;
