'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star, Phone, TrendingUp, Users, Send, ChevronDown, ChevronUp,
    Loader2, BarChart3, Trophy, Zap
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

interface TemplateConversion {
    id: number;
    text: string;
    is_invite: boolean;
    sent_count: number;
    total_conversions: number;
    conversion_rate: number;
    interested_count: number;
    call_count: number;
    mql_count: number;
    sql_count: number;
    partner_count: number;
    client_count: number;
    campaigns: string[];
}

const METRICS = [
    { key: 'interested_count', label: 'Interested', color: 'bg-indigo-500',   textColor: 'text-indigo-400',  barColor: 'from-indigo-500/80 to-indigo-600/60', icon: Star },
    { key: 'call_count',       label: 'Call',       color: 'bg-cyan-500',     textColor: 'text-cyan-400',    barColor: 'from-cyan-500/80 to-cyan-600/60',     icon: Phone },
    { key: 'mql_count',        label: 'MQL',        color: 'bg-amber-500',    textColor: 'text-amber-400',   barColor: 'from-amber-500/80 to-amber-600/60',   icon: TrendingUp },
    { key: 'sql_count',        label: 'SQL',        color: 'bg-orange-500',   textColor: 'text-orange-400',  barColor: 'from-orange-500/80 to-orange-600/60', icon: BarChart3 },
    { key: 'partner_count',    label: 'Partner',    color: 'bg-rose-500',     textColor: 'text-rose-400',    barColor: 'from-rose-500/80 to-rose-600/60',     icon: Zap },
    { key: 'client_count',     label: 'Client',     color: 'bg-green-500',    textColor: 'text-green-400',   barColor: 'from-green-500/80 to-green-600/60',   icon: Trophy },
] as const;

type MetricKey = typeof METRICS[number]['key'];

function truncate(text: string, max: number) {
    return text.length > max ? text.slice(0, max) + '…' : text;
}

function ConversionBar({ value, max, colorClass }: { value: number; max: number; colorClass: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="flex items-center gap-2 w-full">
            <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
                />
            </div>
            <span className="text-[10px] text-slate-500 w-5 text-right">{value}</span>
        </div>
    );
}

function TemplateCard({ template, rank, maxConversions }: {
    template: TemplateConversion;
    rank: number;
    maxConversions: number;
}) {
    const [expanded, setExpanded] = useState(false);

    const rankColors = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];
    const rankBg = ['bg-yellow-500/10 border-yellow-500/30', 'bg-slate-500/10 border-slate-500/30', 'bg-amber-600/10 border-amber-600/30'];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-xl overflow-hidden transition-colors ${
                rank <= 3
                    ? 'bg-slate-800/60 border-slate-600/60'
                    : 'bg-slate-800/30 border-slate-700/40'
            }`}
        >
            {/* Card header */}
            <div
                className="flex items-start gap-4 p-4 cursor-pointer hover:bg-slate-700/20 transition-colors"
                onClick={() => setExpanded(e => !e)}
            >
                {/* Rank */}
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black border ${
                    rank <= 3 ? `${rankBg[rank - 1]} ${rankColors[rank - 1]}` : 'bg-slate-700/50 border-slate-600 text-slate-400'
                }`}>
                    {rank}
                </div>

                {/* Text preview */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            template.is_invite
                                ? 'text-purple-400 bg-purple-500/10 border-purple-500/30'
                                : 'text-blue-400 bg-blue-500/10 border-blue-500/30'
                        }`}>
                            {template.is_invite ? 'Invite' : 'Message'}
                        </span>
                        {template.campaigns.slice(0, 2).map(c => (
                            <span key={c} className="text-[10px] text-slate-500 bg-slate-700/40 rounded-full px-2 py-0.5 truncate max-w-[140px]">{c}</span>
                        ))}
                        {template.campaigns.length > 2 && (
                            <span className="text-[10px] text-slate-600">+{template.campaigns.length - 2}</span>
                        )}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        {expanded ? template.text : truncate(template.text, 180)}
                    </p>
                </div>

                {/* Stats summary */}
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1.5">
                        <span className="text-lg font-black text-white">{template.total_conversions}</span>
                        <span className="text-xs text-slate-500">conv.</span>
                    </div>
                    <div className="text-xs font-bold text-indigo-400">{template.conversion_rate}%</div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Send size={10} />
                        <span>{template.sent_count}</span>
                    </div>
                </div>

                <button className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors ml-1 mt-0.5">
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {/* Expanded breakdown */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-700/50 bg-slate-900/40 px-4 py-4"
                    >
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                            {METRICS.map(m => {
                                const val = template[m.key as MetricKey] as number;
                                if (val === 0 && template.total_conversions > 0) return null;
                                const maxVal = Math.max(...[template.interested_count, template.call_count, template.mql_count, template.sql_count, template.partner_count, template.client_count]);
                                return (
                                    <div key={m.key} className="flex items-center gap-2">
                                        <span className={`text-[11px] font-bold w-16 shrink-0 ${m.textColor}`}>{m.label}</span>
                                        <ConversionBar value={val} max={maxVal} colorClass={m.barColor} />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
                            <span>Sent to <strong className="text-slate-300">{template.sent_count}</strong> leads</span>
                            <span>·</span>
                            <span>Conversion rate <strong className="text-indigo-400">{template.conversion_rate}%</strong></span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function TemplateConversions() {
    const [data, setData] = useState<TemplateConversion[]>([]);
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<string[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState('ALL_CAMPAIGNS');
    const [sortBy, setSortBy] = useState<'total' | 'rate' | 'sent'>('total');
    const [filterMetric, setFilterMetric] = useState<MetricKey | 'all'>('all');

    useEffect(() => {
        axios.get('http://localhost:8000/analytics/campaigns-list')
            .then(r => setCampaigns(['ALL_CAMPAIGNS', ...r.data]))
            .catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        const params: any = {};
        if (selectedCampaign && selectedCampaign !== 'ALL_CAMPAIGNS') params.campaign = selectedCampaign;
        axios.get('http://localhost:8000/analytics/template-conversions', { params })
            .then(r => setData(r.data))
            .catch(() => setData([]))
            .finally(() => setLoading(false));
    }, [selectedCampaign]);

    const sorted = [...data]
        .filter(t => filterMetric === 'all' || (t[filterMetric as MetricKey] as number) > 0)
        .sort((a, b) => {
            if (sortBy === 'rate') return b.conversion_rate - a.conversion_rate;
            if (sortBy === 'sent') return b.sent_count - a.sent_count;
            return b.total_conversions - a.total_conversions;
        });

    const maxConversions = sorted.length > 0 ? sorted[0].total_conversions : 1;

    const totals = data.reduce((acc, t) => {
        acc.interested += t.interested_count;
        acc.call += t.call_count;
        acc.mql += t.mql_count;
        acc.sql += t.sql_count;
        acc.partner += t.partner_count;
        acc.client += t.client_count;
        return acc;
    }, { interested: 0, call: 0, mql: 0, sql: 0, partner: 0, client: 0 });

    const campaignOptions = campaigns.map(c => ({ value: c, label: c === 'ALL_CAMPAIGNS' ? 'All Campaigns' : c }));
    const sortOptions = [
        { value: 'total', label: 'Total Conversions' },
        { value: 'rate', label: 'Conversion Rate' },
        { value: 'sent', label: 'Sent Count' },
    ];
    const filterOptions = [
        { value: 'all', label: 'All Stages' },
        ...METRICS.map(m => ({ value: m.key, label: m.label })),
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Summary tiles */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {METRICS.map(m => {
                    const val = totals[m.key.replace('_count', '') as keyof typeof totals];
                    const Icon = m.icon;
                    return (
                        <button
                            key={m.key}
                            onClick={() => setFilterMetric(prev => prev === m.key ? 'all' : m.key as MetricKey)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                                filterMetric === m.key
                                    ? `${m.color.replace('bg-', 'bg-').replace('500', '500/20')} border-${m.color.split('-')[1]}-500/40`
                                    : 'bg-slate-800/40 border-slate-700/40 hover:border-slate-600'
                            }`}
                        >
                            <Icon size={16} className={m.textColor} />
                            <span className={`text-xl font-black ${m.textColor}`}>{val}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{m.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="w-72">
                    <CustomSelect
                        options={campaignOptions}
                        value={selectedCampaign}
                        onChange={setSelectedCampaign}
                        placeholder="All Campaigns"
                    />
                </div>
                <div className="w-48">
                    <CustomSelect
                        options={sortOptions}
                        value={sortBy}
                        onChange={v => setSortBy(v as any)}
                        placeholder="Sort by"
                    />
                </div>
                <div className="w-40">
                    <CustomSelect
                        options={filterOptions}
                        value={filterMetric}
                        onChange={v => setFilterMetric(v as any)}
                        placeholder="Filter stage"
                    />
                </div>
                <span className="text-xs text-slate-500 ml-auto">
                    {sorted.length} template{sorted.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
                    <Loader2 size={20} className="animate-spin" />
                    Loading template data...
                </div>
            ) : sorted.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-slate-500 gap-3">
                    <BarChart3 size={40} className="opacity-20" />
                    <p className="text-sm">No conversion data found for selected filters.</p>
                    <p className="text-xs text-slate-600">Templates need at least 5 sends and at least 1 conversion.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {sorted.map((t, i) => (
                        <TemplateCard
                            key={t.id}
                            template={t}
                            rank={i + 1}
                            maxConversions={maxConversions}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
