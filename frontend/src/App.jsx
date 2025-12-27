import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SetupAdmin from './pages/SetupAdmin';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

import SchoolAdminDashboard from './pages/SchoolAdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StaffDashboard from './pages/StaffDashboard';

// Protected Route Wrapper
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" />;

  // Create checks
  if (role) {
    if (Array.isArray(role)) {
      if (!role.includes(user.role)) return <Navigate to="/login" />;
    } else {
      if (user.role !== role) return <Navigate to="/login" />;
    }
  }

  return children;
};


import ErrorBoundary from './components/ErrorBoundary';
import Welcome from './pages/Welcome';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Toaster position="top-center" />
            <Routes>
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/setup-admin" element={<SetupAdmin />} />
              <Route path="/super-admin-login" element={<SuperAdminLogin />} />
              <Route
                path="/super-admin"
                element={
                  <ProtectedRoute role="SUPER_ADMIN">
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/school-admin"
                element={
                  <ProtectedRoute role="SCHOOL_ADMIN">
                    <SchoolAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute role="TEACHER">
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student"
                element={
                  <ProtectedRoute role="STUDENT">
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff"
                element={
                  <ProtectedRoute role={["STAFF", "DRIVER"]}>
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
