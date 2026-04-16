'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { Calendar, Target, TrendingUp, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import CustomSelect from '../CustomSelect';

interface HistoryData {
  period: string;
  invited: number;
  accepted: number;
  messaged: number;
  replied: number;
}

const CustomPeakLabel = (props: any) => {
  const { x, y, value, index, data, dataKey, rateKey, totalKey } = props;
  
  // Only show peak if it's a significant point and a local maximum
  const prevVal = index > 0 ? data[index - 1][dataKey] : -1;
  const nextVal = index < data.length - 1 ? data[index + 1][dataKey] : -1;
  
  const isLocalMax = value > 0 && value >= prevVal && value >= nextVal;
  
  if (!isLocalMax) return null;

  const item = data[index];
  const total = item[totalKey] || 0;
  const rate = total > 0 ? ((item[dataKey] / total) * 100).toFixed(1) : '0';

  return (
    <g>
      <filter id="shadow">
        <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.5"/>
      </filter>
      <rect 
        x={x - 24} 
        y={y - 32} 
        width={48} 
        height={20} 
        rx={6} 
        fill="#0f172a" 
        stroke="#4f46e5" 
        strokeWidth={1.5}
        filter="url(#shadow)"
      />
      <text 
        x={x} 
        y={y - 18} 
        fill="#f8fafc" 
        fontSize={10} 
        fontWeight="800" 
        textAnchor="middle"
      >
        {rate}%
      </text>
      <path 
        d={`M${x-4} ${y-12} L${x} ${y-6} L${x+4} ${y-12} Z`} 
        fill="#4f46e5" 
      />
    </g>
  );
};

export default function CampaignHistorySection() {
  const [campaigns, setCampaigns] = useState<string[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [chartType, setChartType] = useState<'growth' | 'messaging'>('growth');
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch campaigns on mount
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await axios.get('http://localhost:8000/analytics/campaigns-list');
        setCampaigns(res.data);
        if (res.data.length > 0) setSelectedCampaign(res.data[0]);
      } catch (err) {
        console.error('Error fetching campaign list:', err);
      }
    };
    fetchCampaigns();
  }, []);

  // Fetch history when campaign or granularity changes
  useEffect(() => {
    if (!selectedCampaign) return;
    
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:8000/analytics/campaign-history', {
          params: { campaign_name: selectedCampaign, granularity }
        });
        setHistoryData(res.data);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [selectedCampaign, granularity]);

  const campaignOptions = useMemo(() => 
    campaigns.map(c => ({ value: c, label: c })), 
  [campaigns]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (granularity === 'day') return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
    if (granularity === 'week') return `W: ${date.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })}`;
    return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-[#0f172a]/90 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-2xl p-8 text-slate-100 mt-12 overflow-hidden relative group">
      {/* Decorative gradient background elements */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-indigo-500/20 rounded-2xl text-indigo-400 shadow-inner">
            <Sparkles size={24} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Campaign All-Time Dynamics</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Historical Performance Pulse</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Main Select */}
          <CustomSelect
            value={selectedCampaign}
            onChange={setSelectedCampaign}
            options={campaignOptions}
            icon={<Target size={18} />}
            placeholder="Select Campaign"
          />

          {/* Granularity Switch */}
          <div className="flex items-center bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 shadow-xl">
            {(['day', 'week', 'month'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                  granularity === g 
                  ? 'bg-indigo-600 text-white shadow-lg scale-105' 
                  : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {g}s
              </button>
            ))}
          </div>

          {/* Metric Toggle */}
          <div className="flex items-center bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setChartType('growth')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                chartType === 'growth'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp size={16} />
              Growth
            </button>
            <button
              onClick={() => setChartType('messaging')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                chartType === 'messaging'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare size={16} />
              Engagement
            </button>
          </div>
        </div>
      </div>

      <div className="h-[450px] w-full relative group">
        {loading && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl">
            <Loader2 size={48} className="text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-400 font-bold tracking-widest text-xs uppercase">Computing Historical Data...</p>
          </div>
        )}

        {historyData.length === 0 && !loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl">
            <Calendar size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium tracking-wide">No historical actions found for this campaign.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData} margin={{ top: 40, right: 30, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartType === 'growth' ? "#10b981" : "#6366f1"} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={chartType === 'growth' ? "#10b981" : "#6366f1"} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartType === 'growth' ? "#334155" : "#3b82f6"} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={chartType === 'growth' ? "#334155" : "#3b82f6"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="period"
                stroke="#64748b"
                fontSize={9}
                fontWeight="700"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatDate}
                interval={granularity === 'day' ? 'preserveStartEnd' : 0}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                fontWeight="700" 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip
                contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155', 
                    borderRadius: '16px', 
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
                    padding: '12px'
                }}
                labelStyle={{ color: '#94a3b8', fontWeight: '800', marginBottom: '8px', fontSize: '11px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                labelFormatter={(label) => formatDate(label)}
              />
              
              {chartType === 'growth' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="invited"
                    stroke="#475569"
                    strokeWidth={2}
                    fill="url(#colorSecondary)"
                    name="Invited"
                    strokeDasharray="5 5"
                  />
                  <Area
                    type="monotone"
                    dataKey="accepted"
                    stroke="#10b981"
                    strokeWidth={4}
                    fill="url(#colorPrimary)"
                    name="Accepted"
                    label={<CustomPeakLabel data={historyData} dataKey="accepted" totalKey="invited" />}
                  />
                </>
              ) : (
                <>
                   <Area
                    type="monotone"
                    dataKey="messaged"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorSecondary)"
                    name="Messages Sent"
                  />
                  <Area
                    type="monotone"
                    dataKey="replied"
                    stroke="#6366f1"
                    strokeWidth={4}
                    fill="url(#colorPrimary)"
                    name="Replies"
                    label={<CustomPeakLabel data={historyData} dataKey="replied" totalKey="messaged" />}
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-8 flex flex-wrap justify-between items-center bg-slate-800/30 p-6 rounded-2xl border border-slate-700/40">
        <div className="flex gap-10">
            <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Total Impact</span>
                <span className="text-xl font-black text-white">
                  {chartType === 'growth' 
                    ? historyData.reduce((acc, curr) => acc + curr.accepted, 0)
                    : historyData.reduce((acc, curr) => acc + curr.replied, 0)
                  }
                  <span className="text-sm text-slate-500 ml-2 font-medium">
                    {chartType === 'growth' ? 'Conversions' : 'Engagements'}
                  </span>
                </span>
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Avg. Quality</span>
                <span className="text-xl font-black text-emerald-400">
                  {(() => {
                    const totalMain = historyData.reduce((acc, curr) => acc + (chartType === 'growth' ? curr.accepted : curr.replied), 0);
                    const totalBase = historyData.reduce((acc, curr) => acc + (chartType === 'growth' ? curr.invited : curr.messaged), 0);
                    return totalBase > 0 ? (totalMain / totalBase * 100).toFixed(1) : '0';
                  })()}%
                </span>
            </div>
        </div>
        <div className="text-[11px] text-slate-500 italic max-w-sm text-right leading-relaxed">
            * This dynamic data represents the full lifecycle of the campaign and does not depend on the global date filters above.
        </div>
      </div>
    </div>
  );
}
