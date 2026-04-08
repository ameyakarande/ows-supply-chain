import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initialMasterData } from '../data/mockData';
import { appDataService } from '../services/appData';
import { isSupabaseConfigured } from '../services/supabase';

import { Attachment } from '../types';

export type UserRole = 'company' | 'vendor';

export interface AppUser {
    id: string;
    username: string; // Use email as username for vendors
    password: string;
    role: UserRole;
    displayName: string;
    email: string;
    whatsappNumber?: string;
    telegramUsername?: string;
    telephoneNumber?: string;
    mobileNumber?: string;
    fullAddress?: string;
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
    isAuthLoading: boolean;
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
    const [isAuthLoading, setIsAuthLoading] = useState(isSupabaseConfigured);

    useEffect(() => {
        let isMounted = true;

        const hydrateUsers = async () => {
            if (!isSupabaseConfigured) {
                setIsAuthLoading(false);
                return;
            }

            const remoteUsers = await appDataService.loadUsers();

            if (!isMounted) return;

            if (remoteUsers && remoteUsers.length > 0) {
                setUsers(remoteUsers);
                localStorage.setItem('marine-users', JSON.stringify(remoteUsers));
            } else {
                await appDataService.saveUsers(users);
            }

            setIsAuthLoading(false);
        };

        void hydrateUsers();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const refreshedUser = users.find(user => user.id === currentUser.id) || users.find(user => user.username === currentUser.username);
        if (!refreshedUser) return;

        setCurrentUser(refreshedUser);
        localStorage.setItem('marine-current-user', JSON.stringify(refreshedUser));
    }, [users]);

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
        void appDataService.saveUsers(updated);
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout, users, saveUsers, isAuthLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
