'use client';
import { Search, Bell, Globe } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search leads, campaigns, or activities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-700 rounded-xl bg-slate-900/50 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                />
            </div>
            
            <div className="flex items-center gap-5 translate-x-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700/50 bg-slate-900/30 text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors cursor-pointer">
                    <Globe size={16} className="text-slate-400" />
                    <select className="bg-transparent border-none text-sm font-medium focus:outline-none cursor-pointer appearance-none outline-none">
                        <option value="en" className="bg-slate-800">EN</option>
                        <option value="ru" className="bg-slate-800">RU</option>
                        <option value="ua" className="bg-slate-800">UA</option>
                    </select>
                </div>

                <div className="h-6 w-px bg-slate-700"></div>

                <button className="relative p-2 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-colors focus:outline-none">
                    <Bell size={20} />
                    <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-slate-800 rounded-full"></span>
                </button>
                
                <div className="flex items-center gap-3 cursor-pointer pl-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-md border-2 border-slate-800">
                        AN
                    </div>
                </div>
            </div>
        </header>
    );
}