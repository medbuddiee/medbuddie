import React, { createContext, useContext, useState } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext(); // ✅ Named export added

export function UserProvider({ children }) {
    const [user, setUser] = useState(null); // Start as logged out

    const login = (userData) => {setUser(userData);};

    const logout = () => {setUser(null);};

    const updateUser = (updatedData) =>
        setUser((prev) => ({ ...prev, ...updatedData }))
    return (
        <UserContext.Provider value={{ user, login, logout, updateUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
