import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.get('/auth/me')
                .then(res => setUser(res.data))
                .catch(() => localStorage.removeItem('token'))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username, password) => {
        const form = new URLSearchParams();
        form.append('username', username);
        form.append('password', password);
        const res = await api.post('/auth/login', form, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        localStorage.setItem('token', res.data.access_token);
        setUser(res.data.user);
        return res.data.user;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    // Role helpers
    const isSuperAdmin  = user?.role === 'superadmin';
    const isEnterprise  = user?.role === 'enterprise';
    const isHR          = user?.role === 'hr';
    const isCandidate   = user?.role === 'candidate';
    const isAdminLevel  = ['superadmin', 'enterprise', 'hr'].includes(user?.role);

    return (
        <AuthContext.Provider value={{
            user, loading, login, logout,
            isSuperAdmin, isEnterprise, isHR, isCandidate, isAdminLevel
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
