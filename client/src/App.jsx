import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './components/HomePage';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard/Dashboard';
import ProfilePage from './components/Profile/ProfilePage';
import EditProfilePage from './components/Profile/EditProfilePage';
import { UserProvider, useUser } from './context/UserContext.jsx';

// Only allow access to route if user is logged in
function PrivateRoute({ element }) {
    const { user } = useUser();
    return user ? element : <Navigate to="/signin" replace />;
}

function App() {
    return (
        <UserProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/dashboard" element={
                        <PrivateRoute element={<Dashboard />} />
                    } />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/edit-profile" element={<EditProfilePage />} />
                </Routes>
            </Router>
        </UserProvider>
    );
}

export default App;
