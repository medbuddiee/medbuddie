import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './components/HomePage';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import FacebookCallback from './components/SignUp/FacebookCallback';
import Dashboard from './components/Dashboard/Dashboard';
import ProfilePage from './components/Profile/ProfilePage';
import EditProfilePage from './components/Profile/EditProfilePage';
import GuidelinesPage from './components/Guidelines/GuidelinesPage';
import GuidelineDetail from './components/Guidelines/GuidelineDetail';
import HealthMetricsPage from './components/Profile/HealthMetricsPage';
import SecondOpinionPage from './components/SecondOpinion/SecondOpinionPage';
import MedBuddiesPage from './components/MedBuddies/MedBuddiesPage';
import CommunitiesPage from './components/Communities/CommunitiesPage';
import CommunityDetailPage from './components/Communities/CommunityDetailPage';
import TopArticlesPage from './components/TopArticles/TopArticlesPage';
import DoctorPortalPage from './components/DoctorPortal/DoctorPortalPage';
import { UserProvider, useUser } from './context/UserContext.jsx';

function PrivateRoute({ element }) {
    const { user, loading } = useUser();
    if (loading) return null;
    return user ? element : <Navigate to="/signin" replace />;
}

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
            <Route path="/facebook-callback" element={<FacebookCallback />} />

            {/* Protected routes */}
            <Route path="/dashboard"     element={<PrivateRoute element={<Dashboard />} />} />
            <Route path="/guidelines"    element={<PrivateRoute element={<GuidelinesPage />} />} />
            <Route path="/guidelines/:id" element={<PrivateRoute element={<GuidelineDetail />} />} />
            <Route path="/profile"       element={<PrivateRoute element={<ProfilePage />} />} />
            <Route path="/edit-profile"  element={<PrivateRoute element={<EditProfilePage />} />} />
            <Route path="/health-metrics" element={<PrivateRoute element={<HealthMetricsPage />} />} />
            <Route path="/second-opinion" element={<PrivateRoute element={<SecondOpinionPage />} />} />

            {/* New feature routes */}
            <Route path="/medbuddies"    element={<PrivateRoute element={<MedBuddiesPage />} />} />
            <Route path="/following"     element={<PrivateRoute element={<MedBuddiesPage />} />} />
            <Route path="/communities"   element={<PrivateRoute element={<CommunitiesPage />} />} />
            <Route path="/communities/:id" element={<PrivateRoute element={<CommunityDetailPage />} />} />
            <Route path="/top-articles"  element={<PrivateRoute element={<TopArticlesPage />} />} />
            <Route path="/doctor-portal" element={<PrivateRoute element={<DoctorPortalPage />} />} />

            {/* Health metrics sub-routes */}
            <Route path="/activity"    element={<PrivateRoute element={<HealthMetricsPage />} />} />
            <Route path="/diet"        element={<PrivateRoute element={<HealthMetricsPage />} />} />
            <Route path="/medications" element={<PrivateRoute element={<HealthMetricsPage />} />} />

            {/* Recommended → Guidelines */}
            <Route path="/recommended" element={<PrivateRoute element={<GuidelinesPage />} />} />

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
