import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext.jsx';

export default function FacebookCallback() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useUser();

    useEffect(() => {
        const code = new URLSearchParams(location.search).get('code');
        if (!code) { navigate('/signin'); return; }

        fetch('/api/auth/facebook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.token && data.user) {
                    login(data.user);
                    localStorage.setItem('token', data.token);
                    navigate('/dashboard');
                } else {
                    alert(data.error || 'Facebook login failed');
                    navigate('/signin');
                }
            })
            .catch(() => {
                alert('Server error during Facebook login');
                navigate('/signin');
            });
    }, []); // eslint-disable-line

    return <div style={{ padding: '2rem', textAlign: 'center' }}>Processing Facebook login…</div>;
}
