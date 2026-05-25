'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type AuthRole = 'admin' | 'guest' | null;

interface AuthCtx {
    role: AuthRole;
    isDemo: boolean;
    loginAsGuest: () => void;
    loginAsAdmin: (password: string) => boolean;
    logout: () => void;
}

const STORAGE_KEY = 'auth:role';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin2025';

const AuthContext = createContext<AuthCtx>({
    role: null,
    isDemo: true,
    loginAsGuest: () => {},
    loginAsAdmin: () => false,
    logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [role, setRole] = useState<AuthRole>(null);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY) as AuthRole;
            if (saved === 'admin' || saved === 'guest') setRole(saved);
        } catch {}
        setHydrated(true);
    }, []);

    const persist = (r: AuthRole) => {
        setRole(r);
        try {
            if (r) localStorage.setItem(STORAGE_KEY, r);
            else localStorage.removeItem(STORAGE_KEY);
        } catch {}
    };

    const loginAsGuest = useCallback(() => persist('guest'), []);

    const loginAsAdmin = useCallback((password: string): boolean => {
        if (password === ADMIN_PASSWORD) {
            persist('admin');
            return true;
        }
        return false;
    }, []);

    const logout = useCallback(() => persist(null), []);

    if (!hydrated) return null;

    return (
        <AuthContext.Provider value={{
            role,
            isDemo: role !== 'admin',
            loginAsGuest,
            loginAsAdmin,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
