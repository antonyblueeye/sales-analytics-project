'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import DateRangePicker from './components/DateRangePicker';

const DashboardCharts = dynamic(() => import('./components/charts/DashboardCharts'), {
  ssr: false,
  loading: () => <div className="h-[600px] flex items-center justify-center bg-slate-800 text-slate-100 rounded-xl shadow w-full">Loading charts...</div>
});

// Пример данных для таблицы профилей
const profilesData = [
  { name: 'Volodymyr P.', invites: 1200, accepted: 350, acceptRate: 29.2, messages: 980, replies: 210, replyRate: 21.4, interested: 45, calls: 12, mql: 28, sql: 15, partner: 6, clients: 4 },
  { name: 'Volodymyr V.', invites: 980, accepted: 280, acceptRate: 28.6, messages: 810, replies: 175, replyRate: 21.6, interested: 38, calls: 9, mql: 22, sql: 11, partner: 4, clients: 3 },
  { name: 'Nazar V.', invites: 1450, accepted: 410, acceptRate: 28.3, messages: 1200, replies: 250, replyRate: 20.8, interested: 52, calls: 15, mql: 31, sql: 18, partner: 7, clients: 5 },
  { name: 'Svitlana V.', invites: 860, accepted: 230, acceptRate: 26.7, messages: 710, replies: 140, replyRate: 19.7, interested: 30, calls: 7, mql: 18, sql: 10, partner: 3, clients: 2 },
];

// Пример данных для графика динамики (по дням)
const dailyData = [
  { date: '2026-03-28', invites: 45, accepted: 12, replies: 8 },
  { date: '2026-03-29', invites: 52, accepted: 14, replies: 9 },
  { date: '2026-03-30', invites: 48, accepted: 13, replies: 7 },
  { date: '2026-03-31', invites: 60, accepted: 18, replies: 11 },
  { date: '2026-04-01', invites: 55, accepted: 16, replies: 10 },
  { date: '2026-04-02', invites: 70, accepted: 22, replies: 14 },
  { date: '2026-04-03', invites: 65, accepted: 20, replies: 12 },
];

// Данные для гистограммы (инвайты vs принятые)
const barData = profilesData.map(p => ({ name: p.name, invites: p.invites, accepted: p.accepted }));

export default function Dashboard() {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 3600000));
  const [endDate, setEndDate] = useState(new Date());

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Overview</h1>
        <DateRangePicker onDateChange={(start, end) => { setStartDate(start); setEndDate(end); }} />
      </div>

      {/* Таблица профилей */}
      <div className="bg-slate-800 text-slate-100 rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-700 text-slate-200">
            <tr>
              <th className="px-4 py-3 text-left">Profile</th>
              <th className="px-4 py-3 text-right">Invites</th>
              <th className="px-4 py-3 text-right">Accepted</th>
              <th className="px-4 py-3 text-right">Accept %</th>
              <th className="px-4 py-3 text-right">Messages</th>
              <th className="px-4 py-3 text-right">Replies</th>
              <th className="px-4 py-3 text-right">Reply %</th>
              <th className="px-4 py-3 text-right">Interested</th>
              <th className="px-4 py-3 text-right">Calls</th>
              <th className="px-4 py-3 text-right">MQL</th>
              <th className="px-4 py-3 text-right">SQL</th>
              <th className="px-4 py-3 text-right">Partner</th>
              <th className="px-4 py-3 text-right">Clients</th>
            </tr>
          </thead>
          <tbody>
            {profilesData.map(profile => (
              <tr key={profile.name} className="border-t">
                <td className="px-4 py-2 font-medium">{profile.name}</td>
                <td className="px-4 py-2 text-right">{profile.invites}</td>
                <td className="px-4 py-2 text-right">{profile.accepted}</td>
                <td className="px-4 py-2 text-right">{profile.acceptRate}%</td>
                <td className="px-4 py-2 text-right">{profile.messages}</td>
                <td className="px-4 py-2 text-right">{profile.replies}</td>
                <td className="px-4 py-2 text-right">{profile.replyRate}%</td>
                <td className="px-4 py-2 text-right">{profile.interested}</td>
                <td className="px-4 py-2 text-right">{profile.calls}</td>
                <td className="px-4 py-2 text-right">{profile.mql}</td>
                <td className="px-4 py-2 text-right">{profile.sql}</td>
                <td className="px-4 py-2 text-right">{profile.partner}</td>
                <td className="px-4 py-2 text-right">{profile.clients}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DashboardCharts dailyData={dailyData} barData={barData} />
    </div>
  );
}