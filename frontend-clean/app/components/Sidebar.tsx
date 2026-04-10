'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Mail,
    Settings,
    TrendingUp,
    Calendar,
} from 'lucide-react';

const navItems = [
    { name: 'Analytics Overview', href: '/', icon: LayoutDashboard },
    { name: 'Leads Analytics', href: '/leads', icon: Users },
    { name: 'Responses Analytics', href: '/responses', icon: Mail },
    { name: 'CRM', href: '/crm', icon: Calendar },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl">
            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight">Sales Analytics</h1>
                <p className="text-xs text-gray-400 mt-1">Analytics Dashboard</p>
            </div>
            <nav className="mt-8 px-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }
              `}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
            <div className="absolute bottom-6 left-0 right-0 px-4">
                <div className="border-t border-gray-700 pt-4 text-xs text-slate-400 text-center">
                    <p>© 2026 Sales Analytics</p>
                </div>
            </div>
        </aside>
    );
}