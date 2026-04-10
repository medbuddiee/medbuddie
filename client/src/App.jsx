import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './components/HomePage';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard/Dashboard';
import ProfilePage from './components/Profile/ProfilePage';
import EditProfilePage from './components/Profile/EditProfilePage';
import { UserProvider, useUser } from './context/UserContext.jsx';

// Redirect to /signin if not logged in
function PrivateRoute({ element }) {
    const { user } = useUser();
    return user ? element : <Navigate to="/signin" replace />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
            <Route path="/profile" element={<PrivateRoute element={<ProfilePage />} />} />
            <Route path="/edit-profile" element={<PrivateRoute element={<EditProfilePage />} />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
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
