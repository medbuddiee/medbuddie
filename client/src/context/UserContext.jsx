import React, {createContext, useContext, useEffect, useState} from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext(); // ✅ Named export added

export function UserProvider({ children }) {
    const [user, setUser]       = useState(null);
    // `loading` is true until we've checked localStorage on first mount.
    // PrivateRoute must wait for this before deciding to redirect.
    const [loading, setLoading] = useState(true);

    // Restore session from localStorage on first mount
    useEffect(() => {
        try {
            const savedUser = localStorage.getItem('user');
            if (savedUser) setUser(JSON.parse(savedUser));
        } catch {
            // Corrupted data — clear it
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    const updateUser = (updatedData) => {
        setUser((prev) => {
            const newUser = { ...prev, ...updatedData };
            localStorage.setItem('user', JSON.stringify(newUser));
            return newUser;
        });
    };

    return (
        <UserContext.Provider value={{ user, loading, login, logout, updateUser }}>
            {children}
        </UserContext.Provider>
    );
}


export function useUser() {
    return useContext(UserContext);
}
