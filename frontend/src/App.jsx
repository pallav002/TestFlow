import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import EnterpriseDashboard from './pages/EnterpriseDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import TestExecution from './pages/TestExecution';
import Results from './pages/Results';

const Loader = () => (
    <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f9fafb'
    }}>
        <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '4px solid #e5e7eb', borderTopColor: '#6366f1',
            animation: 'spin 0.8s linear infinite'
        }} />
    </div>
);

const RoleRedirect = () => {
    const { user, loading } = useAuth();
    if (loading) return <Loader />;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'superadmin')  return <Navigate to="/superadmin"  replace />;
    if (user.role === 'enterprise')  return <Navigate to="/enterprise"  replace />;
    if (user.role === 'hr')          return <Navigate to="/admin"        replace />;
    return <Navigate to="/dashboard" replace />;
};

const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();
    if (loading) return <Loader />;
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <RoleRedirect />;
    return children;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public */}
                    <Route path="/login"  element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* Role-based home */}
                    <Route path="/" element={<RoleRedirect />} />

                    {/* SuperAdmin */}
                    <Route path="/superadmin" element={
                        <ProtectedRoute roles={['superadmin']}>
                            <SuperAdminDashboard />
                        </ProtectedRoute>
                    } />

                    {/* Enterprise */}
                    <Route path="/enterprise" element={
                        <ProtectedRoute roles={['enterprise', 'superadmin']}>
                            <EnterpriseDashboard />
                        </ProtectedRoute>
                    } />

                    {/* HR */}
                    <Route path="/admin" element={
                        <ProtectedRoute roles={['hr', 'enterprise', 'superadmin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />

                    {/* Candidate */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute roles={['candidate']}>
                            <CandidateDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/test/:testId" element={
                        <ProtectedRoute roles={['candidate']}>
                            <TestExecution />
                        </ProtectedRoute>
                    } />
                    <Route path="/results" element={
                        <ProtectedRoute roles={['candidate']}>
                            <Results />
                        </ProtectedRoute>
                    } />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
