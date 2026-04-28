'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Loader2, 
    Zap, 
    MessageCircle, 
    Send, 
    BarChart3,
    TrendingUp,
    ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CustomMessageStat {
    campaign_name: string;
    sent_count: number;
    reply_count: number;
    reply_rate: number;
}

interface Profile {
    id: number;
    name: string;
}

export default function ResponseAnalytics() {
    const [mode, setMode] = useState<'replied' | 'accepted'>('accepted');
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
    const [stats, setStats] = useState<CustomMessageStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch profiles on mount
    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const response = await axios.get('http://localhost:8000/profiles');
                setProfiles(response.data);
            } catch (err) {
                console.error('Error fetching profiles:', err);
            }
        };
        fetchProfiles();
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                let url = `http://localhost:8000/analytics/custom-messages?mode=${mode}`;
                if (selectedProfiles.length > 0) {
                    selectedProfiles.forEach(p => {
                        url += `&profiles=${encodeURIComponent(p)}`;
                    });
                }
                const response = await axios.get(url);
                setStats(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching custom message analytics:', err);
                setError('Failed to load analytics data. Please try again later.');
                setLoading(false);
            }
        };

        fetchStats();
    }, [mode, selectedProfiles]);

    const toggleProfile = (name: string) => {
        setSelectedProfiles(prev => 
            prev.includes(name) 
                ? prev.filter(p => p !== name) 
                : [...prev, name]
        );
    };

    const totalSent = stats.reduce((acc, curr) => acc + (curr.sent_count ?? 0), 0);
    const totalSuccess = stats.reduce((acc, curr) => acc + (mode === 'replied' ? (curr.reply_count ?? 0) : ((curr as any).accepted_count ?? 0)), 0);
    const avgRate = totalSent > 0 ? (totalSuccess / totalSent * 100).toFixed(1) : '0';

    if (loading && stats.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-4">
                <Loader2 size={40} className="animate-spin text-indigo-500" />
                <p className="font-medium animate-pulse text-sm uppercase tracking-widest">Analyzing Custom Outreach...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-rose-400 gap-3 text-center">
                <ShieldAlert size={48} className="opacity-50" />
                <p className="font-bold">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Filter Panel */}
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                <Zap size={20} className="text-indigo-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Custom Outreach Performance</h2>
                        </div>
                        <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
                            {mode === 'accepted' 
                                ? 'Tracking unique invitation templates (frequency < 8) and acceptance rates.'
                                : 'Tracking unique outreach messages (templates used exactly once).'}
                        </p>
                    </div>

                    <div className="flex p-1 bg-slate-950/50 rounded-xl border border-slate-800 shadow-inner w-fit">
                        <button 
                            onClick={() => setMode('accepted')}
                            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                                mode === 'accepted' 
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            Acceptance
                        </button>
                        <button 
                            onClick={() => setMode('replied')}
                            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                                mode === 'replied' 
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            Replies
                        </button>
                    </div>
                </div>

                {/* Profile Filter */}
                <div className="pt-4 border-t border-slate-800/50">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">Filter by Profile:</span>
                        {profiles.map(profile => (
                            <button
                                key={profile.id}
                                onClick={() => toggleProfile(profile.name)}
                                className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 border ${
                                    selectedProfiles.includes(profile.name)
                                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                                    : 'bg-slate-800/30 border-slate-700/50 text-slate-500 hover:border-slate-600'
                                }`}
                            >
                                {profile.name}
                            </button>
                        ))}
                        {selectedProfiles.length > 0 && (
                            <button 
                                onClick={() => setSelectedProfiles([])}
                                className="text-[10px] font-bold text-rose-500/70 hover:text-rose-500 uppercase tracking-widest ml-2 transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Send size={18} className="text-blue-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Custom</span>
                    </div>
                    <div className="text-3xl font-black text-white">
                        {totalSent.toLocaleString()}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Highly personalized {mode === 'replied' ? 'messages' : 'invites'}</p>
                </div>

                <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            {mode === 'replied' ? <MessageCircle size={18} className="text-emerald-400" /> : <Zap size={18} className="text-emerald-400" />}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {mode === 'replied' ? 'Total Replies' : 'Total Accepted'}
                        </span>
                    </div>
                    <div className="text-3xl font-black text-emerald-400">
                        {totalSuccess.toLocaleString()}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Successful outcomes</p>
                </div>

                <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <TrendingUp size={18} className="text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {mode === 'replied' ? 'Avg. Reply Rate' : 'Avg. Accept Rate'}
                        </span>
                    </div>
                    <div className="text-3xl font-black text-indigo-400">
                        {avgRate}%
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Conversion of manual outreach</p>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl relative">
                {loading && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                    </div>
                )}
                <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BarChart3 size={18} className="text-slate-400" />
                        <h3 className="font-bold text-slate-200">Campaign Performance Breakdown</h3>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-950/40 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800/50">
                                <th className="px-8 py-5">Campaign Name</th>
                                <th className="px-8 py-5 text-center">Sent Custom</th>
                                <th className="px-8 py-5 text-center">{mode === 'replied' ? 'Replies' : 'Accepted'}</th>
                                <th className="px-8 py-5 text-right">{mode === 'replied' ? 'Reply Rate' : 'Accept Rate'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                            {stats.length > 0 ? (
                                stats.map((row, idx) => {
                                    const successCount = mode === 'replied' ? (row.reply_count ?? 0) : ((row as any).accepted_count ?? 0);
                                    const successRate = mode === 'replied' ? (row.reply_rate ?? 0) : ((row as any).acceptance_rate ?? 0);
                                    return (
                                        <tr key={idx} className="hover:bg-slate-800/20 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                                                        {row.campaign_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="text-sm font-mono font-medium text-slate-400">
                                                    {(row.sent_count ?? 0).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="text-sm font-mono font-bold text-emerald-400/80">
                                                    {(successCount ?? 0).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="inline-flex items-center justify-end">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm font-black text-white">
                                                            {successRate}%
                                                        </span>
                                                        <div className="w-20 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.min(successRate, 100)}%` }}
                                                                transition={{ duration: 1, delay: 0.1 }}
                                                                className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <TrendingUp size={32} className="opacity-20" />
                                            <p className="text-xs font-bold uppercase tracking-widest">No custom data detected yet</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}