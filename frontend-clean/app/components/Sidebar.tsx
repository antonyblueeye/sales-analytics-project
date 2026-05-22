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
    Target,
    ChevronLeft,
    ChevronRight,
    BarChart3,
} from 'lucide-react';

const navItems = [
    { name: 'Analytics Overview', href: '/', icon: LayoutDashboard },
    { name: 'Leads Analytics', href: '/leads', icon: Users },
    { name: 'Messages Analytics', href: '/campaigns/messages-analytics', icon: Mail },
    { name: 'CRM', href: '/crm', icon: Calendar },
    { name: 'Settings', href: '/settings', icon: Settings },
];

type SidebarProps = {
    collapsed: boolean;
    onToggle: () => void;
};

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl transition-[width] duration-300 ease-in-out z-50 ${collapsed ? 'w-20' : 'w-64'
                }`}
        >
            {/* Кнопка-переключатель: вынесена на правый край панели, чтобы её было удобно нажимать в любом состоянии */}
            <button
                onClick={onToggle}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg border-2 border-slate-900 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Шапка с логотипом */}
            <div className={`p-6 flex items-center gap-3 ${collapsed ? 'justify-center px-2' : ''}`}>
                <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                    <BarChart3 size={20} className="text-white" />
                </div>
                <div className={`overflow-hidden transition-all duration-200 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                    <h1 className="text-xl font-bold tracking-tight whitespace-nowrap">Sales Analytics</h1>
                    <p className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">Analytics Dashboard</p>
                </div>
            </div>

            <nav className={`mt-6 space-y-2 ${collapsed ? 'px-3' : 'px-4'}`}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={collapsed ? item.name : undefined}
                            className={`group relative flex items-center gap-3 rounded-lg transition-all duration-200 ${collapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'
                                } ${isActive
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} className="flex-shrink-0" />
                            <span
                                className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                                    }`}
                            >
                                {item.name}
                            </span>
                            {/* Tooltip для свернутого состояния */}
                            {collapsed && (
                                <span className="pointer-events-none absolute left-full ml-3 px-2 py-1 rounded-md bg-slate-800 text-xs text-slate-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-slate-700 z-50">
                                    {item.name}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="absolute bottom-6 left-0 right-0 px-4">
                <div className="border-t border-gray-700 pt-4 text-xs text-slate-400 text-center">
                    <p className="whitespace-nowrap">{collapsed ? '© 2026' : '© 2026 Sales Analytics'}</p>
                </div>
            </div>
        </aside>
    );
}