'use client';
import { useState, useMemo, Fragment } from 'react';
import dynamic from 'next/dynamic';
import DateRangePicker from './components/DateRangePicker';
import { ChevronDown, ChevronRight, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';

const DashboardCharts = dynamic(() => import('./components/charts/DashboardCharts'), {
  ssr: false,
  loading: () => <div className="h-[600px] flex items-center justify-center bg-slate-800 text-slate-100 rounded-xl shadow w-full">Loading charts...</div>
});

// Пример данных для таблицы профилей (теперь с кампаниями)
const profilesData = [
  {
    name: 'Volodymyr P.', invites: 1200, accepted: 350, acceptRate: 29.2, messages: 980, replies: 210, replyRate: 21.4, interested: 45, calls: 12, mql: 28, sql: 15, partner: 6, clients: 4,
    campaigns: [
      { name: 'CEO Outreach', invites: 800, accepted: 250, acceptRate: 31.2, messages: 680, replies: 150, replyRate: 22.0, interested: 35, calls: 10, mql: 20, sql: 10, partner: 4, clients: 3 },
      { name: 'Sales Leaders', invites: 400, accepted: 100, acceptRate: 25.0, messages: 300, replies: 60, replyRate: 20.0, interested: 10, calls: 2, mql: 8, sql: 5, partner: 2, clients: 1 }
    ]
  },
  {
    name: 'Volodymyr V.', invites: 980, accepted: 280, acceptRate: 28.6, messages: 810, replies: 175, replyRate: 21.6, interested: 38, calls: 9, mql: 22, sql: 11, partner: 4, clients: 3,
    campaigns: [
      { name: 'Marketing US', invites: 500, accepted: 150, acceptRate: 30.0, messages: 410, replies: 105, replyRate: 25.6, interested: 28, calls: 6, mql: 15, sql: 8, partner: 3, clients: 2 },
      { name: 'Founders EU', invites: 480, accepted: 130, acceptRate: 27.1, messages: 400, replies: 70, replyRate: 17.5, interested: 10, calls: 3, mql: 7, sql: 3, partner: 1, clients: 1 }
    ]
  },
  {
    name: 'Nazar V.', invites: 1450, accepted: 410, acceptRate: 28.3, messages: 1200, replies: 250, replyRate: 20.8, interested: 52, calls: 15, mql: 31, sql: 18, partner: 7, clients: 5,
    campaigns: [
      { name: 'CTO Network', invites: 1000, accepted: 290, acceptRate: 29.0, messages: 800, replies: 180, replyRate: 22.5, interested: 40, calls: 12, mql: 25, sql: 14, partner: 5, clients: 4 },
      { name: 'DevOps Leads', invites: 450, accepted: 120, acceptRate: 26.6, messages: 400, replies: 70, replyRate: 17.5, interested: 12, calls: 3, mql: 6, sql: 4, partner: 2, clients: 1 }
    ]
  },
  {
    name: 'Svitlana V.', invites: 860, accepted: 230, acceptRate: 26.7, messages: 710, replies: 140, replyRate: 19.7, interested: 30, calls: 7, mql: 18, sql: 10, partner: 3, clients: 2,
    campaigns: [
      { name: 'HR Mng UK', invites: 600, accepted: 160, acceptRate: 26.6, messages: 500, replies: 100, replyRate: 20.0, interested: 20, calls: 5, mql: 12, sql: 7, partner: 2, clients: 1 },
      { name: 'Product Mng', invites: 260, accepted: 70, acceptRate: 26.9, messages: 210, replies: 40, replyRate: 19.0, interested: 10, calls: 2, mql: 6, sql: 3, partner: 1, clients: 1 }
    ]
  },
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

// Вычисляем Итого
const totals = profilesData.reduce((acc, curr) => {
  acc.invites += curr.invites;
  acc.accepted += curr.accepted;
  acc.messages += curr.messages;
  acc.replies += curr.replies;
  acc.interested += curr.interested;
  acc.calls += curr.calls;
  acc.mql += curr.mql;
  acc.sql += curr.sql;
  acc.partner += curr.partner;
  acc.clients += curr.clients;
  return acc;
}, { invites: 0, accepted: 0, messages: 0, replies: 0, interested: 0, calls: 0, mql: 0, sql: 0, partner: 0, clients: 0 });

const totalAcceptRate = ((totals.accepted / totals.invites) * 100).toFixed(1);
const totalReplyRate = ((totals.replies / totals.messages) * 100).toFixed(1);

type ProfileKeys = keyof Omit<typeof profilesData[0], 'campaigns'>;

export default function Dashboard() {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 3600000));
  const [endDate, setEndDate] = useState(new Date());

  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: ProfileKeys, direction: 'asc' | 'desc' } | null>(null);

  const toggleExpand = (name: string) => {
    const newSet = new Set(expandedProfiles);
    if (newSet.has(name)) newSet.delete(name);
    else newSet.add(name);
    setExpandedProfiles(newSet);
  };

  const handleSort = (key: ProfileKeys) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProfiles = useMemo(() => {
    let sortableItems = [...profilesData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [sortConfig]);

  const SortIcon = ({ columnKey }: { columnKey: ProfileKeys }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className="text-slate-500 opacity-50 group-hover:opacity-100" />;
    if (sortConfig.direction === 'asc') return <ArrowUp size={14} className="text-indigo-400" />;
    return <ArrowDown size={14} className="text-indigo-400" />;
  };

  const tableHeaders: { label: string; key: ProfileKeys; align: 'left' | 'right' }[] = [
    { label: 'Profile', key: 'name', align: 'left' },
    { label: 'Invites', key: 'invites', align: 'right' },
    { label: 'Accepted', key: 'accepted', align: 'right' },
    { label: 'Accept %', key: 'acceptRate', align: 'right' },
    { label: 'Messages', key: 'messages', align: 'right' },
    { label: 'Replies', key: 'replies', align: 'right' },
    { label: 'Reply %', key: 'replyRate', align: 'right' },
    { label: 'Interested', key: 'interested', align: 'right' },
    { label: 'Calls', key: 'calls', align: 'right' },
    { label: 'MQL', key: 'mql', align: 'right' },
    { label: 'SQL', key: 'sql', align: 'right' },
    { label: 'Partner', key: 'partner', align: 'right' },
    { label: 'Clients', key: 'clients', align: 'right' },
  ];

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-white">Analytics Overview</h1>
        <DateRangePicker onDateChange={(start, end) => { setStartDate(start); setEndDate(end); }} />
      </div>

      {/* Таблица профилей */}
      <div className="bg-[#0f172a]/95 text-slate-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-slate-700/60 overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800/80 text-slate-200 border-b border-slate-700/60">
              <tr>
                <th className="px-5 py-4 w-10"></th>
                {tableHeaders.map((header) => (
                  <th
                    key={header.key}
                    className={`px-4 py-4 font-semibold hover:bg-slate-700/50 cursor-pointer transition-colors group select-none whitespace-nowrap ${header.align === 'right' ? 'text-right' : 'text-left'}`}
                    onClick={() => handleSort(header.key)}
                  >
                    <div className={`flex items-center gap-2 ${header.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                      {header.label}
                      <SortIcon columnKey={header.key} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedProfiles.map(profile => {
                const isExpanded = expandedProfiles.has(profile.name as string);
                return (
                  <Fragment key={profile.name as string}>
                    <tr
                      onClick={() => toggleExpand(profile.name as string)}
                      className={`border-b border-slate-700/40 hover:bg-slate-800/60 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-800/40' : ''}`}
                    >
                      <td className="px-5 py-3.5 text-slate-400">
                        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90 text-indigo-400' : ''}`}>
                          <ChevronRight size={18} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-100 whitespace-nowrap">{profile.name}</td>
                      <td className="px-4 py-3.5 text-right font-medium">{profile.invites}</td>
                      <td className="px-4 py-3.5 text-right font-medium">{profile.accepted}</td>
                      <td className="px-4 py-3.5 text-right font-medium text-emerald-400 bg-emerald-400/5 rounded-md my-1">{profile.acceptRate}%</td>
                      <td className="px-4 py-3.5 text-right font-medium">{profile.messages}</td>
                      <td className="px-4 py-3.5 text-right font-medium">{profile.replies}</td>
                      <td className="px-4 py-3.5 text-right font-medium text-indigo-400 bg-indigo-400/5 rounded-md my-1">{profile.replyRate}%</td>
                      <td className="px-4 py-3.5 text-right font-medium">{profile.interested}</td>
                      <td className="px-4 py-3.5 text-right font-medium">{profile.calls}</td>
                      <td className="px-4 py-3.5 text-right font-medium text-amber-200">{profile.mql}</td>
                      <td className="px-4 py-3.5 text-right font-medium text-orange-300">{profile.sql}</td>
                      <td className="px-4 py-3.5 text-right font-medium text-rose-300">{profile.partner}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-400">{profile.clients}</td>
                    </tr>

                    {/* Развернутые строки (кампании) */}
                    {isExpanded && profile.campaigns.map((camp, idx) => (
                      <tr key={`${profile.name}-${camp.name}`} className="bg-slate-800/30 border-b border-slate-700/20 last:border-slate-700/40 hover:bg-slate-700/30 transition-colors text-[0.825rem]">
                        <td className="px-5 py-2.5"></td>
                        <td className="px-4 py-2.5 text-slate-300 pl-8 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                          {camp.name}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{camp.invites}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{camp.accepted}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{camp.acceptRate}%</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{camp.messages}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{camp.replies}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{camp.replyRate}%</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{camp.interested}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{camp.calls}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{camp.mql}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{camp.sql}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{camp.partner}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400 font-medium">{camp.clients}</td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-800 font-bold text-slate-100 border-t-2 border-slate-600/80">
              <tr>
                <td className="px-5 py-4 w-10"></td>
                <td className="px-4 py-4 text-left tracking-wide">TOTAL</td>
                <td className="px-4 py-4 text-right text-indigo-200">{totals.invites}</td>
                <td className="px-4 py-4 text-right text-indigo-200">{totals.accepted}</td>
                <td className="px-4 py-4 text-right text-emerald-400">{totalAcceptRate}%</td>
                <td className="px-4 py-4 text-right text-indigo-200">{totals.messages}</td>
                <td className="px-4 py-4 text-right text-indigo-200">{totals.replies}</td>
                <td className="px-4 py-4 text-right text-indigo-400">{totalReplyRate}%</td>
                <td className="px-4 py-4 text-right text-indigo-200">{totals.interested}</td>
                <td className="px-4 py-4 text-right text-indigo-200">{totals.calls}</td>
                <td className="px-4 py-4 text-right text-amber-200">{totals.mql}</td>
                <td className="px-4 py-4 text-right text-orange-300">{totals.sql}</td>
                <td className="px-4 py-4 text-right text-rose-300">{totals.partner}</td>
                <td className="px-4 py-4 text-right text-emerald-400 text-base">{totals.clients}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <DashboardCharts dailyData={dailyData} barData={barData} />
    </div>
  );
}