'use client';
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardChartsProps {
  dailyData: any[];
  barData: any[];
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
          const failVal = totalVal - successVal;

          const chartData = [
            { name: labels.success, value: successVal },
            { name: labels.fail, value: failVal }
          ];

          return (
            <div key={profile.name} className="flex flex-col items-center justify-center relative outline-none ring-0">
              <div className="w-full h-[130px] outline-none">
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
              </div>
              <div className="absolute top-[65px] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">Rate</span>
                <span className="text-xs font-bold text-white leading-none">
                  {totalVal > 0 ? ((successVal / totalVal) * 100).toFixed(0) : 0}%
                </span>
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

export default function DashboardCharts({ dailyData, barData }: DashboardChartsProps) {
  return (
    <div className="space-y-6 mt-6">
      {/* Top Row: Activity Trends & Invites Conversion */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-6 text-slate-100 flex flex-col h-full">
          <h2 className="text-xl font-bold mb-6 tracking-tight">Daily Activity Trends</h2>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInvites" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAccepted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
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

      {/* Second Row: Replies Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PieGroup 
          title="Replies Analytics by Profile" 
          data={barData} 
          dataKeys={{ success: 'replies', total: 'messages' }} 
          labels={{ success: 'Replied', fail: 'No Reply' }} 
        />
        
        {/* Placeholder for future third chart or extended data */}
        <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-8 text-slate-400 flex flex-col items-center justify-center border-dashed">
          <p className="text-sm font-medium uppercase tracking-widest text-slate-500">More Insights Coming Soon</p>
          <div className="w-16 h-1 bg-slate-700/50 rounded-full mt-4"></div>
        </div>
      </div>
    </div>
  );
}
