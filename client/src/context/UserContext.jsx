import React, {createContext, useContext, useEffect, useState} from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext(); // ✅ Named export added

export function UserProvider({ children }) {
    const [user, setUser] = useState(null); // Start as logged out

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
    };
    // Load saved user from localStorage on startup
    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    // Update profile: update user in both places
    const updateUser = (updatedData) => {
        setUser((prev) => {
            const newUser = { ...prev, ...updatedData };
            localStorage.setItem("user", JSON.stringify(newUser));
            return newUser;
        });
    };

    return (
        <UserContext.Provider value={{ user, login, logout, updateUser }}>
            {children}
        </UserContext.Provider>
    );
}


export function useUser() {
    return useContext(UserContext);
}
