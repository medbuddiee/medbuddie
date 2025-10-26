// FacebookCallback.jsx
import React, { useEffect } from 'react';

export default function FacebookCallback() {
    useEffect(() => {
        const code = new URLSearchParams(window.location.search).get("code");
        if (code) {
            fetch('http://localhost:5000/api/auth/facebook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.user) {
                        alert('Facebook signup successful!');
                        // Save token or redirect
                    } else {
                        alert('Facebook signup failed.');
                    }
                });
        }
    }, []);

    return <div>Processing Facebook login...</div>;
}
