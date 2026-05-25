'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../lib/AuthContext';

const STORAGE_KEY = 'sidebar:collapsed';

export default function Shell({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    const { role } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    // Загружаем сохранённое состояние из localStorage после монтирования,
    // чтобы избежать рассинхрона при SSR
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === '1') setCollapsed(true);
        } catch {}
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
        } catch {}
    }, [collapsed, hydrated]);

    // Redirect unauthenticated users to /login
    useEffect(() => {
        if (!hydrated) return;
        if (role === null && pathname !== '/login') {
            router.replace('/login');
        }
    }, [hydrated, role, pathname, router]);

    const toggle = () => setCollapsed((v) => !v);

    // Login page renders without shell
    if (pathname === '/login') {
        return <>{children}</>;
    }

    // Don't flash the shell while redirecting
    if (!role) return null;

    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden">
            <Sidebar collapsed={collapsed} onToggle={toggle} />
            <div
                className={`flex-1 flex flex-col h-full bg-slate-900 overflow-hidden transition-[margin] duration-300 ease-in-out ml-0 ${collapsed ? 'md:ml-20' : 'md:ml-64'
                    }`}
            >
                <Header />
                <main className="flex-1 p-6 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
