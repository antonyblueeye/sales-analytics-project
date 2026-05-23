'use client';
import { Search, Bell, RefreshCw, Sparkles, X, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const INSIGHTS_STORAGE_KEY = 'ai:insights:history';
const INSIGHTS_READ_KEY = 'ai:insights:lastReadAt';

export interface InsightEntry {
    id: string;
    text: string;
    generatedAt: string; // ISO string
    dateRange: string;
}

export function saveInsightToHistory(entry: Omit<InsightEntry, 'id'>) {
    try {
        const raw = localStorage.getItem(INSIGHTS_STORAGE_KEY);
        const existing: InsightEntry[] = raw ? JSON.parse(raw) : [];
        const newEntry: InsightEntry = { ...entry, id: Date.now().toString() };
        const updated = [newEntry, ...existing].slice(0, 50);
        localStorage.setItem(INSIGHTS_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('insights:updated'));
    } catch {}
}

export default function Header() {
    const [searchQuery, setSearchQuery] = useState('');
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [panelOpen, setPanelOpen] = useState(false);
    const [insights, setInsights] = useState<InsightEntry[]>([]);
    const [lastReadAt, setLastReadAt] = useState<number>(0);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        axios.get('http://localhost:8000/analytics/last-sync')
            .then(res => setLastSync(res.data.last_synced_at))
            .catch(() => {});
    }, []);

    const loadInsights = () => {
        try {
            const raw = localStorage.getItem(INSIGHTS_STORAGE_KEY);
            setInsights(raw ? JSON.parse(raw) : []);
            const ts = localStorage.getItem(INSIGHTS_READ_KEY);
            setLastReadAt(ts ? Number(ts) : 0);
        } catch { setInsights([]); }
    };

    useEffect(() => {
        loadInsights();
        window.addEventListener('insights:updated', loadInsights);
        return () => window.removeEventListener('insights:updated', loadInsights);
    }, []);

    // Mark all as read when panel opens
    const openPanel = () => {
        loadInsights();
        setPanelOpen(v => !v);
    };

    useEffect(() => {
        if (panelOpen) {
            const now = Date.now();
            try { localStorage.setItem(INSIGHTS_READ_KEY, String(now)); } catch {}
            setLastReadAt(now);
        }
    }, [panelOpen]);

    // Close panel on outside click
    useEffect(() => {
        if (!panelOpen) return;
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setPanelOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [panelOpen]);

    // Unread = insights newer than lastReadAt
    const unreadCount = insights.filter(i => Number(i.id) > lastReadAt).length;

    const formatSync = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatInsightDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const clearInsights = () => {
        try { localStorage.removeItem(INSIGHTS_STORAGE_KEY); } catch {}
        setInsights([]);
        setExpandedId(null);
    };

    const deleteInsight = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const updated = insights.filter(i => i.id !== id);
        try { localStorage.setItem(INSIGHTS_STORAGE_KEY, JSON.stringify(updated)); } catch {}
        setInsights(updated);
        if (expandedId === id) setExpandedId(null);
    };

    const toggleExpand = (id: string) => {
        setExpandedId(prev => prev === id ? null : id);
    };

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

            <div className="flex items-center gap-4">
                {/* Last sync */}
                {lastSync && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/40 border border-slate-700/50 rounded-lg px-3 py-1.5 whitespace-nowrap">
                        <RefreshCw size={12} className="text-emerald-400" />
                        <span className="text-slate-500">Last sync:</span>
                        <span className="text-slate-300 font-medium">{formatSync(lastSync)}</span>
                    </div>
                )}

                <div className="h-6 w-px bg-slate-700"></div>

                {/* Bell with insights panel */}
                <div className="relative" ref={panelRef}>
                    <button
                        onClick={openPanel}
                        className="relative p-2 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-colors focus:outline-none"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-indigo-500 border-2 border-slate-800 rounded-full animate-pulse"></span>
                        )}
                    </button>

                    {panelOpen && (
                        <div className="absolute right-0 top-12 w-[440px] max-h-[560px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 shrink-0">
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                                    <Sparkles size={16} className="text-indigo-400" />
                                    AI Insights History
                                    {insights.length > 0 && (
                                        <span className="ml-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full">{insights.length}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {insights.length > 0 && (
                                        <button onClick={clearInsights} className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors uppercase tracking-wider font-bold">
                                            Clear all
                                        </button>
                                    )}
                                    <button onClick={() => setPanelOpen(false)} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-y-auto flex-1">
                                {insights.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
                                        <Sparkles size={32} className="opacity-20" />
                                        <p className="text-sm">No insights generated yet.</p>
                                        <p className="text-xs text-slate-600">Generate insights from the dashboard.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-800">
                                        {insights.map((ins) => {
                                            const isUnread = Number(ins.id) > lastReadAt;
                                            const isExpanded = expandedId === ins.id;
                                            return (
                                                <div
                                                    key={ins.id}
                                                    className={`px-4 py-3 transition-colors group cursor-pointer ${isExpanded ? 'bg-slate-800/60' : 'hover:bg-slate-800/40'}`}
                                                    onClick={() => toggleExpand(ins.id)}
                                                >
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 flex-wrap">
                                                            {isUnread && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                                            )}
                                                            <Clock size={10} />
                                                            <span className={isUnread ? 'text-slate-300 font-semibold' : ''}>{formatInsightDate(ins.generatedAt)}</span>
                                                            {ins.dateRange && (
                                                                <span className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-400">{ins.dateRange}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <span className="text-slate-600 group-hover:text-slate-400 transition-colors">
                                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                            </span>
                                                            <button
                                                                onClick={(e) => deleteInsight(e, ins.id)}
                                                                className="p-0.5 rounded text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className={`text-xs text-slate-300 leading-relaxed transition-all ${isExpanded ? '' : 'line-clamp-3'}`}>
                                                        {ins.text.replace(/\*\*/g, '')}
                                                    </div>
                                                    {!isExpanded && ins.text.length > 200 && (
                                                        <p className="text-[10px] text-indigo-400 mt-1 font-semibold">Click to expand</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 cursor-pointer pl-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-md border-2 border-slate-800">
                        AN
                    </div>
                </div>
            </div>
        </header>
    );
}