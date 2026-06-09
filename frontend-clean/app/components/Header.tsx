'use client';
import { Search, Bell, RefreshCw, Sparkles, X, Clock, ChevronDown, ChevronUp, User, LogOut } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import axios from 'axios';
import { anonLeadName, anonCompany, BLUR_IMG_CLASS, HIDE_PII, DEMO_MODE } from '../lib/demo';

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

interface SearchResult {
    id: number;
    first_name: string;
    last_name: string;
    company_name: string;
    title: string;
    photo_url: string;
    status: string;
}

const searchStatusColors: Record<string, string> = {
    'New': 'text-slate-400', 'Pending': 'text-yellow-400', 'Connected': 'text-emerald-400',
    'Engaged': 'text-blue-400', 'Interested': 'text-indigo-400', 'MQL': 'text-amber-400',
    'SQL': 'text-orange-400', 'Partner': 'text-rose-400', 'Client': 'text-green-400',
};

function AuthBadge() {
    const { role, logout } = useAuth();

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    return (
        <div className="flex items-center gap-2 pl-2">
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-1.5">
                <div className={`w-2 h-2 rounded-full shrink-0 ${role === 'admin' ? 'bg-indigo-400' : 'bg-emerald-400'}`} />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {role === 'admin' ? 'Admin' : 'Guest'}
                </span>
            </div>
            <button
                onClick={handleLogout}
                title="Sign out"
                className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
                <LogOut size={15} />
            </button>
        </div>
    );
}

export default function Header() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [lastSync, setLastSync] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const syncPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [panelOpen, setPanelOpen] = useState(false);
    const [insights, setInsights] = useState<InsightEntry[]>([]);
    const [lastReadAt, setLastReadAt] = useState<number>(0);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const fetchSyncStatus = useCallback(async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/sync/status`);
            setLastSync(res.data.last_synced_at ?? null);
            setIsSyncing(Boolean(res.data.in_progress));
            return res.data;
        } catch {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/analytics/last-sync`);
                setLastSync(res.data.last_synced_at ?? null);
            } catch {}
            return null;
        }
    }, []);

    useEffect(() => {
        fetchSyncStatus().then((status) => {
            if (status?.in_progress) {
                startSyncPolling();
            }
        });
    }, [fetchSyncStatus]);

    useEffect(() => {
        return () => {
            if (syncPollRef.current) clearInterval(syncPollRef.current);
        };
    }, []);

    const stopSyncPolling = () => {
        if (syncPollRef.current) {
            clearInterval(syncPollRef.current);
            syncPollRef.current = null;
        }
    };

    const startSyncPolling = () => {
        stopSyncPolling();
        syncPollRef.current = setInterval(async () => {
            const status = await fetchSyncStatus();
            if (status && !status.in_progress) {
                stopSyncPolling();
                setIsSyncing(false);
            }
        }, 3000);
    };

    const handleManualSync = async () => {
        if (isSyncing) return;
        setSyncError(null);
        setIsSyncing(true);
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/sync/run`);
            if (res.data.status === 'already_running') {
                startSyncPolling();
                return;
            }
            if (res.data.status === 'started') {
                startSyncPolling();
                return;
            }
            setIsSyncing(false);
            setSyncError('Could not start sync');
        } catch {
            setIsSyncing(false);
            setSyncError('Sync request failed');
        }
    };

    // Search debounce
    useEffect(() => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            setSearchOpen(false);
            return;
        }
        searchDebounceRef.current = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/crm/leads/search`, {
                    params: { q: searchQuery.trim(), limit: DEMO_MODE ? 10 : 3 }
                });
                const results: SearchResult[] = DEMO_MODE
                    ? res.data.filter((r: SearchResult) =>
                        r.first_name?.toLowerCase().startsWith(searchQuery.trim().toLowerCase()))
                    : res.data;
                const capped = results.slice(0, 3);
                setSearchResults(capped);
                setSearchOpen(capped.length > 0);
            } catch {}
            finally { setSearchLoading(false); }
        }, 280);
    }, [searchQuery]);

    // Close search on outside click
    useEffect(() => {
        if (!searchOpen) return;
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [searchOpen]);

    const goToLead = (id: number) => {
        setSearchQuery('');
        setSearchOpen(false);
        setSearchResults([]);
        router.push(`/crm/${id}`);
    };

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
        <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-40">
            <div className="relative flex-1 min-w-0 max-w-md" ref={searchRef}>
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                {searchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                )}
                <input
                    type="text"
                    placeholder="Search leads by name or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }}
                    className="w-full pl-10 pr-8 py-2 border border-slate-700 rounded-xl bg-slate-900/50 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                />

                {/* Suggestions dropdown */}
                {searchOpen && searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                        {searchResults.map((r) => {
                            const initials = `${r.first_name?.[0] || ''}${r.last_name?.[0] || ''}`.toUpperCase();
                            const statusColor = searchStatusColors[r.status] || 'text-slate-400';
                            return (
                                <button
                                    key={r.id}
                                    onClick={() => goToLead(r.id)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 transition-colors text-left group"
                                >
                                    {r.photo_url ? (
                                        <img src={r.photo_url} alt="" className={`w-8 h-8 rounded-full object-cover shrink-0 ${BLUR_IMG_CLASS}`} />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                            {initials}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-200 group-hover:text-white truncate">
                                            {anonLeadName(r.first_name, r.last_name)}
                                        </p>
                                        {!HIDE_PII && <p className="text-xs text-slate-500 truncate">{r.company_name}{r.title ? ` · ${r.title}` : ''}</p>}
                                        {HIDE_PII && r.title && <p className="text-xs text-slate-500 truncate">{r.title}</p>}
                                    </div>
                                    <span className={`text-[10px] font-bold shrink-0 ${statusColor}`}>{r.status}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    title="Download latest data from MeetAlfred"
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-indigo-300 disabled:cursor-wait rounded-lg px-3 py-2 shadow-md shadow-indigo-900/40 transition-colors whitespace-nowrap"
                >
                    <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                    {isSyncing ? 'Syncing…' : 'Sync now'}
                </button>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/40 border border-slate-700/50 rounded-lg px-3 py-2 whitespace-nowrap">
                    <span className="text-slate-500">Last sync:</span>
                    <span className="text-slate-200 font-medium">
                        {lastSync ? formatSync(lastSync) : 'Never'}
                    </span>
                </div>
                {syncError && (
                    <span className="text-[10px] text-rose-400 max-w-[120px] truncate" title={syncError}>
                        {syncError}
                    </span>
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

                <AuthBadge />
            </div>
        </header>
    );
}