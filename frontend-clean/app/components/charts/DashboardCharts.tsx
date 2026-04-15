'use client';
import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { ChevronLeft, ChevronRight, LayoutPanelTop, Target, Play, Pause } from 'lucide-react';
import CustomSelect from '../CustomSelect';

interface DashboardChartsProps {
  dailyData: any[];
  barData: any[];
  campaignData: any[];
}

const COLORS = ['#82ca9d', '#ef4444']; // Green for success, Red for "pending/no response"

const PieGroup = ({ title, data, dataKeys, labels }: { title: string, data: any[], dataKeys: { success: string, total: string }, labels: { success: string, fail: string } }) => {
  return (
    <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-6 text-slate-100 flex flex-col h-full">
      <style jsx global>{`
        .recharts-surface:focus, .recharts-wrapper:focus {
          outline: none !important;
        }
      `}</style>
      <h2 className="text-xl font-bold mb-6 tracking-tight">{title}</h2>
      <div className="grid grid-cols-2 gap-4 flex-grow">
        {data.slice(0, 4).map((profile) => {
          const successVal = profile[dataKeys.success];
          const totalVal = profile[dataKeys.total];
          const failVal = Math.max(0, totalVal - successVal);

          const chartData = [
            { name: labels.success, value: successVal },
            { name: labels.fail, value: failVal }
          ];

          return (
            <div key={profile.name} className="flex flex-col items-center relative outline-none ring-0">
              <div className="w-full h-[130px] outline-none relative">
                <ResponsiveContainer width="100%" height="100%" className="outline-none">
                  <PieChart className="outline-none">
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius="58%"
                      outerRadius="78%"
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => {
                        const numValue = Number(value);
                        const percent = totalVal > 0 ? ((numValue / totalVal) * 100).toFixed(1) : '0';
                        return [`${numValue} (${percent}%)` as any];
                      }}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '10px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                        padding: '6px 10px',
                        fontSize: '12px'
                      }}
                      wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Visual centering: adding a small mt-1 for better alignment */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                  <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">Rate</span>
                  <span className="text-xs font-bold text-white leading-none">
                    {totalVal > 0 ? ((successVal / totalVal) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
              <p className="text-[11px] font-semibold text-slate-300 mt-1 truncate w-full text-center">
                {profile.name.split(' ')[0]}
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex justify-center gap-6 border-t border-slate-700/30 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#82ca9d]"></div>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{labels.success}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{labels.fail}</span>
        </div>
      </div>
    </div>
  );
};

const CampaignCarouselChart = ({ data }: { data: any[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [timerKey, setTimerKey] = useState(0); // Используется для сброса анимации таймера

  // Сброс индекса при изменении количества кампаний (например, после фильтрации по дате)
  useEffect(() => {
    if (currentIndex >= data.length) {
      setCurrentIndex(0);
      setTimerKey(prev => prev + 1);
    }
  }, [data.length, currentIndex]);

  useEffect(() => {
    if (!isAutoPlaying || data.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % data.length);
      setTimerKey(prev => prev + 1);
    }, 20000);
    return () => clearInterval(interval);
  }, [data.length, isAutoPlaying, timerKey]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-8 text-slate-400 flex flex-col items-center justify-center border-dashed h-full">
        <p className="text-sm font-medium uppercase tracking-widest text-slate-500">No Campaign Data Available</p>
      </div>
    );
  }

  const currentCamp = data[currentIndex] || data[0] || {};

  const displayData = [
    {
      category: 'Invites',
      'Accepted': currentCamp.accepted || 0,
      'Pending Invites': Math.max(0, (currentCamp.invites || 0) - (currentCamp.accepted || 0)),
      total: currentCamp.invites || 0
    },
    {
      category: 'Messages',
      'Replied': currentCamp.replies || 0,
      'Pending Messages': Math.max(0, (currentCamp.messages || 0) - (currentCamp.replies || 0)),
      total: currentCamp.messages || 0
    }
  ];

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % data.length);
    setTimerKey(prev => prev + 1);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + data.length) % data.length);
    setTimerKey(prev => prev + 1);
  };

  const handleSelect = (val: string) => {
    setCurrentIndex(Number(val));
    setTimerKey(prev => prev + 1);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
    setTimerKey(prev => prev + 1);
  };

  const selectOptions = data.map((camp, idx) => ({
    value: String(idx),
    label: camp.name
  }));

  return (
    <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-6 text-slate-100 flex flex-col h-full min-h-[420px] relative group overflow-hidden">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <LayoutPanelTop size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Campaign Highlights</h2>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Performance Insights</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
            <button
              onClick={toggleAutoPlay}
              className={`p-1.5 rounded-lg transition-all ${isAutoPlaying ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white'}`}
              title={isAutoPlaying ? "Pause Auto-play" : "Start Auto-play"}
            >
              {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>

          <CustomSelect
            value={String(currentIndex)}
            onChange={handleSelect}
            options={selectOptions}
            icon={<Target size={16} />}
          />

          <div className="flex gap-1">
            <button onClick={prev} className="p-2 hover:bg-slate-700/50 rounded-lg border border-slate-700/50 transition-colors" title="Previous Campaign">
              <ChevronLeft size={16} />
            </button>
            <button onClick={next} className="p-2 hover:bg-slate-700/50 rounded-lg border border-slate-700/50 transition-colors" title="Next Campaign">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col relative">
        <div key={currentCamp.name} className="flex-grow animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white truncate max-w-[300px]">{currentCamp.name}</h3>
            <div className="flex gap-4 mt-1">
              <div className="text-[11px] text-slate-400">
                Accept Rate: <span className="text-emerald-400 font-bold">{(currentCamp.invites > 0 ? (currentCamp.accepted / currentCamp.invites * 100) : 0).toFixed(1)}%</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Reply Rate: <span className="text-indigo-400 font-bold">{(currentCamp.messages > 0 ? (currentCamp.replies / currentCamp.messages * 100) : 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="flex-grow min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="category"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={12}
                  width={100}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontWeight: 'bold', dx: -10 }}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '11px' }}
                  formatter={(value: any, name: any) => {
                    const nameStr = String(name || '');
                    if (nameStr.includes('Pending')) {
                      return [value, nameStr === 'Pending Invites' ? 'Invites (Pending)' : 'Messages (Pending)'];
                    }
                    return [value, nameStr];
                  }}
                />
                <Bar dataKey="Accepted" stackId="a" fill="#82ca9d" barSize={32} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Pending Invites" stackId="a" fill="#334155" barSize={32} radius={[0, 6, 6, 0]} />
                <Bar dataKey="Replied" stackId="a" fill="#818cf8" barSize={32} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Pending Messages" stackId="a" fill="#334155" barSize={32} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-700/30">
              <div className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Invites / Accepted</div>
              <div className="text-lg font-bold">{currentCamp.invites || 0} <span className="text-xs text-slate-500 font-normal">/</span> <span className="text-emerald-400">{currentCamp.accepted || 0}</span></div>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-700/30">
              <div className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Messages / Replies</div>
              <div className="text-lg font-bold">{currentCamp.messages || 0} <span className="text-xs text-slate-500 font-normal">/</span> <span className="text-indigo-400">{currentCamp.replies || 0}</span></div>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-700/30 opacity-60">
              <div className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Interested</div>
              <div className="text-lg font-bold text-slate-300">0</div>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-700/30 opacity-60">
              <div className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Calls</div>
              <div className="text-lg font-bold text-slate-300">0</div>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-700/30 opacity-60">
              <div className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">MQL</div>
              <div className="text-lg font-bold text-amber-400/80">0</div>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-700/30 opacity-60">
              <div className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">SQL</div>
              <div className="text-lg font-bold text-orange-400/80">0</div>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-700/30 opacity-60">
              <div className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Partner</div>
              <div className="text-lg font-bold text-rose-400/80">0</div>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-700/30 opacity-60">
              <div className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Clients</div>
              <div className="text-lg font-bold text-emerald-400">0</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 h-1 bg-indigo-500/20 w-full overflow-hidden">
        {isAutoPlaying && (
          <div className="h-full bg-indigo-500" key={timerKey} style={{ animation: `progress 20s linear forwards` }}></div>
        )}
      </div>
      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default function DashboardCharts({ dailyData, barData, campaignData }: DashboardChartsProps) {
  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-6 text-slate-100 flex flex-col h-full">
          <h2 className="text-xl font-bold mb-6 tracking-tight">Daily Activity Trends</h2>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInvites" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAccepted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="invites" stroke="#8884d8" strokeWidth={3} fillOpacity={1} fill="url(#colorInvites)" name="Invites" />
                <Area type="monotone" dataKey="accepted" stroke="#82ca9d" strokeWidth={3} fillOpacity={1} fill="url(#colorAccepted)" name="Accepted" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center gap-6 border-t border-slate-700/30 pt-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#8884d8]"></div>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Invites</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#82ca9d]"></div>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Accepted</span>
            </div>
          </div>
        </div>

        <PieGroup
          title="Invites Conversion by Profile"
          data={barData}
          dataKeys={{ success: 'accepted', total: 'invites' }}
          labels={{ success: 'Accepted', fail: 'No Response' }}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PieGroup
          title="Replies Analytics by Profile"
          data={barData}
          dataKeys={{ success: 'replies', total: 'messages' }}
          labels={{ success: 'Replied', fail: 'No Reply' }}
        />

        <CampaignCarouselChart data={campaignData} />
      </div>
    </div>
  );
}
