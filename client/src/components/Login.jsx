import React, { useState } from 'react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            setMsg(data.message);
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            setMsg('Login failed');
        }
    };

    return (
        <div style={{ maxWidth: 300, margin: 'auto', padding: 40 }}>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8 }} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8 }} />
                <button style={{ width: '100%', padding: 10 }}>Login</button>
            </form>
            {msg && <p>{msg}</p>}
        </div>
    );
}
