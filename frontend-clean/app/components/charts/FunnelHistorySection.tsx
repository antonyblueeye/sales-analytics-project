'use client';
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from 'recharts';
import { Loader2, Activity } from 'lucide-react';
import axios from 'axios';

interface FunnelDataPoint {
  period: string;
  interested: number;
  calls: number;
  mql: number;
  sql: number;
  partner: number;
  clients: number;
}

const METRICS = [
  { key: 'interested', label: 'Interested', color: '#818cf8' },
  { key: 'calls',      label: 'Calls',      color: '#38bdf8' },
  { key: 'mql',        label: 'MQL',        color: '#fbbf24' },
  { key: 'sql',        label: 'SQL',        color: '#fb923c' },
  { key: 'partner',    label: 'Partner',    color: '#f472b6' },
  { key: 'clients',    label: 'Clients',    color: '#34d399' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
  return (
    <div className="bg-[#0f172a] border border-slate-700 rounded-2xl p-4 shadow-2xl text-xs min-w-[160px]">
      <p className="text-slate-400 font-bold uppercase tracking-wider mb-3">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-6 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.fill }} />
            <span className="text-slate-300">{p.name}</span>
          </span>
          <span className="font-bold" style={{ color: p.fill }}>{p.value}</span>
        </div>
      ))}
      {total > 0 && (
        <div className="border-t border-slate-700 mt-2 pt-2 flex justify-between">
          <span className="text-slate-500 uppercase tracking-wider">Total</span>
          <span className="text-white font-black">{total}</span>
        </div>
      )}
    </div>
  );
};

export default function FunnelHistorySection() {
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('month');
  const [data, setData] = useState<FunnelDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(
    new Set(METRICS.map(m => m.key))
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/analytics/funnel-history`, {
          params: { granularity }
        });
        setData(res.data);
      } catch (err) {
        console.error('Error fetching funnel history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [granularity]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (granularity === 'day') return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    if (granularity === 'week') return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', year: 'numeric' });
  };

  const toggleMetric = (key: string) => {
    setActiveMetrics(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const totals = METRICS.reduce((acc, m) => {
    acc[m.key] = data.reduce((s, d) => s + ((d as any)[m.key] || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-[#0f172a]/90 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-2xl p-8 text-slate-100 mt-8 overflow-hidden relative">
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-violet-500/20 rounded-2xl text-violet-400 shadow-inner">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Funnel Status Dynamics
            </h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Interested · Calls · MQL · SQL · Partner · Clients
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Metric toggles */}
          <div className="flex flex-wrap gap-2">
            {METRICS.map(m => (
              <button
                key={m.key}
                onClick={() => toggleMetric(m.key)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all duration-200 ${
                  activeMetrics.has(m.key)
                    ? 'border-transparent text-slate-900'
                    : 'bg-transparent text-slate-500 border-slate-700 hover:border-slate-500'
                }`}
                style={activeMetrics.has(m.key) ? { background: m.color, borderColor: m.color } : {}}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Granularity switcher */}
          <div className="flex items-center bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 shadow-xl shrink-0">
            {(['day', 'week', 'month'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                  granularity === g
                    ? 'bg-violet-600 text-white shadow-lg scale-105'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {g}s
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-[400px] w-full relative">
        {loading && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl">
            <Loader2 size={40} className="text-violet-500 animate-spin mb-3" />
            <p className="text-slate-400 font-bold tracking-widest text-xs uppercase">Loading...</p>
          </div>
        )}

        {data.length === 0 && !loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl">
            <Activity size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium tracking-wide">No funnel status data found.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 40 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="period"
                stroke="#475569"
                fontSize={9}
                fontWeight="700"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatDate}
                interval={granularity === 'day' ? 'preserveStartEnd' : 0}
                angle={-35}
                textAnchor="end"
                height={55}
              />
              <YAxis
                stroke="#475569"
                fontSize={10}
                fontWeight="700"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              {METRICS.filter(m => activeMetrics.has(m.key)).map(m => (
                <Bar
                  key={m.key}
                  dataKey={m.key}
                  name={m.label}
                  stackId="funnel"
                  fill={m.color}
                  radius={m.key === 'clients' ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary row */}
      <div className="mt-6 grid grid-cols-3 md:grid-cols-6 gap-3">
        {METRICS.map(m => (
          <div
            key={m.key}
            className="bg-slate-800/30 rounded-2xl p-3 border border-slate-700/30 flex flex-col gap-1 cursor-pointer transition-all hover:bg-slate-800/50"
            onClick={() => toggleMetric(m.key)}
            style={{ opacity: activeMetrics.has(m.key) ? 1 : 0.4 }}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{m.label}</span>
            </div>
            <span className="text-xl font-black" style={{ color: m.color }}>{totals[m.key]}</span>
            <span className="text-[9px] text-slate-600 uppercase font-bold">All time</span>
          </div>
        ))}
      </div>
    </div>
  );
}
