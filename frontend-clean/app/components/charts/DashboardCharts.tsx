'use client';
import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardChartsProps {
  dailyData: any[];
  barData: any[];
}

export default function DashboardCharts({ dailyData, barData }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
      <div className="bg-slate-800 rounded-xl shadow p-4 text-slate-100">
        <h2 className="text-lg font-semibold mb-4">Daily Activity</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dailyData}>
            <defs>
              <linearGradient id="colorInvites" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAccepted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ffc658" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#f8fafc', borderRadius: '8px' }} />
            <Legend />
            <Area type="monotone" dataKey="invites" stroke="#8884d8" fillOpacity={1} fill="url(#colorInvites)" name="Invites" />
            <Area type="monotone" dataKey="accepted" stroke="#82ca9d" fillOpacity={1} fill="url(#colorAccepted)" name="Accepted" />
            <Area type="monotone" dataKey="replies" stroke="#ffc658" fillOpacity={1} fill="url(#colorReplies)" name="Replies" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-800 rounded-xl shadow p-4 text-slate-100">
        <h2 className="text-lg font-semibold mb-4">Invites vs Accepted by Profile</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#f8fafc', borderRadius: '8px' }} />
            <Legend />
            <Bar dataKey="invites" fill="#8884d8" name="Invites" radius={[4, 4, 0, 0]} />
            <Bar dataKey="accepted" fill="#82ca9d" name="Accepted" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
