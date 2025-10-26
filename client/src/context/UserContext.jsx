// import React, { createContext, useContext, useState } from 'react';
//
// const UserContext = createContext();
//
// export function UserProvider({ children }) {
//     const [user, setUser] = useState(null); // Start as logged out
//
//     const login = (userData) => {
//         setUser(userData);
//     };
//
//     const logout = () => {
//         setUser(null);
//     };
//
//     return (
//         <UserContext.Provider value={{ user, login, logout }}>
//             {children}
//         </UserContext.Provider>
//     );
// }
//
// export function useUser() {
//     return useContext(UserContext);
// }


import React, { createContext, useContext, useState } from 'react';

export const UserContext = createContext(); // ✅ Named export added

export function UserProvider({ children }) {
    const [user, setUser] = useState(null); // Start as logged out

    const login = (userData) => {
        setUser(userData);
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <UserContext.Provider value={{ user, login, logout }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
