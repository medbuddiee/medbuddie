import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './components/HomePage';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard/Dashboard';
import ProfilePage from './components/Profile/ProfilePage';
import EditProfilePage from './components/Profile/EditProfilePage';
import GuidelinesPage from './components/Guidelines/GuidelinesPage';
import GuidelineDetail from './components/Guidelines/GuidelineDetail';
import HealthMetricsPage from './components/Profile/HealthMetricsPage';
import { UserProvider, useUser } from './context/UserContext.jsx';

/**
 * PrivateRoute — waits for the auth session to be restored from localStorage
 * before deciding whether to render or redirect. Without the `loading` guard,
 * a hard refresh causes user === null for one render tick, which incorrectly
 * sends the user to /signin even though they have a valid stored session.
 */
function PrivateRoute({ element }) {
    const { user, loading } = useUser();
    if (loading) return null;            // session not yet hydrated — render nothing
    return user ? element : <Navigate to="/signin" replace />;
}

/**
 * SmartRedirect — used as the catch-all for unknown paths.
 * Logged-in users who click an unimplemented sidebar link land back on
 * the dashboard; unauthenticated visitors see the home page.
 */
function SmartRedirect() {
    const { user, loading } = useUser();
    if (loading) return null;
    return <Navigate to={user ? '/dashboard' : '/'} replace />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Protected routes */}
            <Route path="/dashboard"    element={<PrivateRoute element={<Dashboard />} />} />
            <Route path="/guidelines"    element={<PrivateRoute element={<GuidelinesPage />} />} />
            <Route path="/guidelines/:id" element={<PrivateRoute element={<GuidelineDetail />} />} />
            <Route path="/profile"      element={<PrivateRoute element={<ProfilePage />} />} />
            <Route path="/edit-profile"    element={<PrivateRoute element={<EditProfilePage />} />} />
            <Route path="/health-metrics" element={<PrivateRoute element={<HealthMetricsPage />} />} />

            {/* Any unknown path: logged-in → dashboard, logged-out → home */}
            <Route path="*" element={<SmartRedirect />} />
        </Routes>
    );
}

export default function App() {
    return (
        <UserProvider>
            <Router>
                <AppRoutes />
            </Router>
        </UserProvider>
    );
}
