import { createContext, useContext, useState, ReactNode } from 'react';
import { initialMasterData } from '../data/mockData';

import { Attachment } from '../types';

export type UserRole = 'company' | 'vendor';

export interface AppUser {
    id: string;
    username: string; // Use email as username for vendors
    password: string;
    role: UserRole;
    displayName: string;
    email: string;
    categories?: string[];
    countries?: string[];
    documents?: Attachment[];
}

// Default users seeded on first load
export const DEFAULT_USERS: AppUser[] = [
    { id: 'u-admin', username: 'admin', password: 'admin123', role: 'company', displayName: 'Company Admin', email: 'admin@oceanwharf.com' },
    ...initialMasterData.suppliers.map((s, idx) => ({
        id: `u-vendor-${idx}`,
        username: s.email,
        password: 'vendor123',
        role: 'vendor' as UserRole,
        displayName: s.name,
        email: s.email
    })),
];

interface AuthContextValue {
    currentUser: AppUser | null;
    login: (username: string, password: string) => boolean;
    logout: () => void;
    users: AppUser[];
    saveUsers: (users: AppUser[]) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [users, setUsers] = useState<AppUser[]>(() => {
        try {
            const saved = localStorage.getItem('marine-users');
            return saved ? JSON.parse(saved) : DEFAULT_USERS;
        } catch {
            return DEFAULT_USERS;
        }
    });

    const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
        try {
            const saved = localStorage.getItem('marine-current-user');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const login = (username: string, password: string): boolean => {
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            setCurrentUser(user);
            localStorage.setItem('marine-current-user', JSON.stringify(user));
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('marine-current-user');
    };

    const saveUsers = (updated: AppUser[]) => {
        setUsers(updated);
        localStorage.setItem('marine-users', JSON.stringify(updated));
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout, users, saveUsers }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
