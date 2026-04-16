'use client';
import { useState, useMemo, Fragment, ReactNode, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import DateRangePicker from './components/DateRangePicker';
import { ChevronDown, ChevronRight, ArrowUpDown, ArrowDown, ArrowUp, Minus, Loader2 } from 'lucide-react';
import { format, subDays, differenceInDays } from 'date-fns';
import axios from 'axios';

const DashboardCharts = dynamic(() => import('./components/charts/DashboardCharts'), {
  ssr: false,
  loading: () => <div className="h-[600px] flex items-center justify-center bg-slate-800 text-slate-100 rounded-xl shadow w-full">Loading charts...</div>
});

const CampaignHistorySection = dynamic(() => import('./components/charts/CampaignHistorySection'), {
  ssr: false,
  loading: () => <div className="h-[400px] flex items-center justify-center bg-slate-800 text-slate-100 rounded-xl shadow w-full">Loading historical analytics...</div>
});


// Пример данных для таблицы профилей (теперь с кампаниями)

// Описание структуры данных профиля для TypeScript
type ProfileData = {
  name: string;
  invites: number;
  accepted: number;
  acceptRate: number;
  messages: number;
  replies: number;
  replyRate: number;
  interested: number | string;
  calls: number | string;
  mql: number | string;
  sql: number | string;
  partner: number | string;
  clients: number | string;
  campaigns?: any[];
};

type ProfileKeys = keyof Omit<ProfileData, 'campaigns'>;

interface StatCellProps {
  value: number | string;
  previousValue: number | string;
  isPercentage?: boolean;
  startDate: Date;
  endDate: Date;
  customClass?: string;
  rowIndex: number;
}

const StatCell = ({ value, previousValue, isPercentage, startDate, endDate, customClass, rowIndex }: StatCellProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const valNum = typeof value === 'string' ? parseFloat(value) : value;
  const prevValNum = typeof previousValue === 'string' ? parseFloat(previousValue) : previousValue;

  const diff = valNum - prevValNum;
  const trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'equal';

  const duration = differenceInDays(endDate, startDate) + 1;
  const prevStartDate = subDays(startDate, duration);
  const prevEndDate = subDays(endDate, duration);

  const showBelow = rowIndex < 2;

  return (
    <td 
      className={`px-4 py-3.5 text-right font-medium relative group ${customClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-end gap-1.5">
        <span>{value}{isPercentage ? '%' : ''}</span>
        {isHovered && (
          <div className="animate-in fade-in zoom-in duration-200">
            {trend === 'up' && <ArrowUp size={12} className="text-emerald-400" />}
            {trend === 'down' && <ArrowDown size={12} className="text-rose-400" />}
            {trend === 'equal' && <Minus size={12} className="text-slate-500" />}
          </div>
        )}
      </div>

      {isHovered && (
        <div className={`absolute ${showBelow ? 'top-full mt-2' : 'bottom-full mb-2'} right-0 z-[100] animate-in fade-in ${showBelow ? 'slide-in-from-top-2' : 'slide-in-from-bottom-2'} duration-300 pointer-events-none`}>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-2xl min-w-[180px] backdrop-blur-xl">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Previous Period</div>
            <div className="text-[10px] text-slate-500 mb-2">
              {format(prevStartDate, 'MMM dd')} - {format(prevEndDate, 'MMM dd, yyyy')}
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-white">
                {previousValue}{isPercentage ? '%' : ''}
              </span>
              <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400'}`}>
                {trend === 'up' ? '+' : trend === 'down' ? '' : ''}
                {isPercentage ? diff.toFixed(1) : diff}
                {isPercentage ? '%' : ''}
              </div>
            </div>
          </div>
          {/* Arrow */}
          <div className={`w-2 h-2 bg-slate-800 border-slate-700 rotate-45 absolute ${showBelow ? '-top-1 border-l border-t' : '-bottom-1 border-r border-b'} right-4 transform translate-x-1/2`}></div>
        </div>
      )}
    </td>
  );
};

export default function Dashboard() {
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [profiles, setProfiles] = useState<ProfileData[]>([]); // Данные текущего периода
  const [prevProfiles, setPrevProfiles] = useState<ProfileData[]>([]); // Данные предыдущего периода для сравнения
  const [isLoading, setIsLoading] = useState(true); // Состояние загрузки (крутилка)
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: ProfileKeys, direction: 'asc' | 'desc' } | null>(null);

  // Функция для запроса данных из Python бэкенда
  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      // Вычисляем даты предыдущего периода такой же длительности
      const duration = differenceInDays(endDate, startDate) + 1;
      const prevStart = subDays(startDate, duration);
      const prevEnd = subDays(startDate, 1);

      // Запускаем все запросы параллельно: профили и кампании (текущие и прошлые)
      const [currRes, prevRes, currCampRes, prevCampRes] = await Promise.all([
        axios.get('http://localhost:8000/analytics/profiles-summary', {
          params: { from_date: format(startDate, 'yyyy-MM-dd'), to_date: format(endDate, 'yyyy-MM-dd') }
        }),
        axios.get('http://localhost:8000/analytics/profiles-summary', {
          params: { from_date: format(prevStart, 'yyyy-MM-dd'), to_date: format(prevEnd, 'yyyy-MM-dd') }
        }),
        axios.get('http://localhost:8000/analytics/campaigns-summary', {
          params: { from_date: format(startDate, 'yyyy-MM-dd'), to_date: format(endDate, 'yyyy-MM-dd') }
        }),
        axios.get('http://localhost:8000/analytics/campaigns-summary', {
          params: { from_date: format(prevStart, 'yyyy-MM-dd'), to_date: format(prevEnd, 'yyyy-MM-dd') }
        })
      ]);

      // Группируем кампании по профилям
      const groupCampaignsByProfile = (campData: any[]) => {
        const map: Record<string, any[]> = {};
        campData.forEach(c => {
          if (!map[c.profile_name]) map[c.profile_name] = [];
          map[c.profile_name].push({
            name: c.campaign_name || 'Unnamed Campaign',
            invites: c.invited || 0,
            accepted: c.accepted || 0,
            acceptRate: c.acceptance_rate || 0,
            messages: c.messaged || 0,
            replies: c.replied || 0,
            replyRate: c.reply_rate || 0,
            interested: 'N/A',
            calls: 'N/A',
            mql: 'N/A',
            sql: 'N/A',
            partner: 'N/A',
            clients: 'N/A'
          });
        });
        return map;
      };

      const currCamps = groupCampaignsByProfile(currCampRes.data);
      const prevCamps = groupCampaignsByProfile(prevCampRes.data);

      const mapItem = (item: any, campaignsMap: Record<string, any[]>) => ({
        name: item.profile_name || 'Unknown',
        invites: item.invited || 0,
        accepted: item.accepted || 0,
        acceptRate: item.acceptance_rate || 0,
        messages: item.messaged || 0,
        replies: item.replied || 0,
        replyRate: item.reply_rate || 0,
        interested: 'N/A',
        calls: 'N/A',
        mql: 'N/A',
        sql: 'N/A',
        partner: 'N/A',
        clients: 'N/A',
        campaigns: campaignsMap[item.profile_name] || []
      });

      setProfiles(currRes.data.map((item: any) => mapItem(item, currCamps)));
      setPrevProfiles(prevRes.data.map((item: any) => mapItem(item, prevCamps)));
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  // Запускаем fetch при загрузке страницы и при каждом изменении дат в фильтре
  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // useMemo пересчитывает итоги и данные для графиков ТОЛЬКО когда меняются данные профилей или даты
  const { totals, prevTotals, totalAcceptRate, totalReplyRate, barData, dailyData, campaignData } = useMemo(() => {
    const calculateTotals = (data: ProfileData[]) => data.reduce((acc, curr) => {
      acc.invites += curr.invites;
      acc.accepted += curr.accepted;
      acc.messages += curr.messages;
      acc.replies += curr.replies;
      return acc;
    }, { invites: 0, accepted: 0, messages: 0, replies: 0, interested: 0, calls: 0, mql: 0, sql: 0, partner: 0, clients: 0 });

    const t = calculateTotals(profiles);
    const pt = calculateTotals(prevProfiles);

    const ar = t.invites > 0 ? ((t.accepted / t.invites) * 100).toFixed(1) : '0';
    const rr = t.messages > 0 ? ((t.replies / t.messages) * 100).toFixed(1) : '0';

    const bd = profiles.map(p => ({
      name: p.name,
      invites: p.invites,
      accepted: p.accepted,
      messages: p.messages,
      replies: p.replies
    }));

    // Генерируем "фейковую" динамику по дням для визуализации в графике (Area Chart)
    const days = differenceInDays(endDate, startDate) + 1;
    const dd = Array.from({ length: Math.min(days, 14) }).map((_, i) => {
      const d = subDays(endDate, i);
      return {
        date: format(d, 'yyyy-MM-dd'),
        invites: Math.round((t.invites / days) * (0.8 + Math.random() * 0.4)),
        accepted: Math.round((t.accepted / days) * (0.8 + Math.random() * 0.4))
      };
    }).reverse();

    // Группируем данные по кампаниям (сумма всех профилей для каждой кампании)
    const ctMap: Record<string, any> = {};
    profiles.forEach(p => {
      (p.campaigns || []).forEach(c => {
        if (!ctMap[c.name]) {
          ctMap[c.name] = { 
            name: c.name, 
            invites: 0, 
            accepted: 0, 
            messages: 0, 
            replies: 0 
          };
        }
        ctMap[c.name].invites += (c.invites || 0);
        ctMap[c.name].accepted += (c.accepted || 0);
        ctMap[c.name].messages += (c.messages || 0);
        ctMap[c.name].replies += (c.replies || 0);
      });
    });
    const ct = Object.values(ctMap);

    return { totals: t, prevTotals: pt, totalAcceptRate: ar, totalReplyRate: rr, barData: bd, dailyData: dd, campaignData: ct };
  }, [profiles, prevProfiles, startDate, endDate]);

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
    let sortableItems = [...profiles];
    if (sortConfig !== null) {
      sortableItems.sort((a: any, b: any) => {
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
  }, [profiles, sortConfig]);

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

  // Helper to generate mock previous stats (static but derived)
  const getPrevStat = (val: number | string, seed: string) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      // Stably generate a variation based on the name/value
      const hash = seed.length;
      const variation = (hash % 15) - 7; // -7 to +7
      const result = num - variation;
      return typeof val === 'string' ? result.toFixed(1) : Math.round(result);
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Leads Analytics</h1>
        <DateRangePicker onDateChange={(start, end) => { setStartDate(start); setEndDate(end); }} />
      </div>

      {/* Таблица профилей */}
      <div className="bg-[#0f172a]/95 text-slate-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-slate-700/60 overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto overflow-y-visible">
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
              {/* Показываем индикатор загрузки, пока данные летят от сервера */}
              {isLoading ? (
                <tr>
                  <td colSpan={14} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 size={40} className="text-indigo-500 animate-spin" />
                      <p className="text-slate-400 font-medium tracking-wide">Fetching analytics data...</p>
                    </div>
                  </td>
                </tr>
              ) : sortedProfiles.length === 0 ? (
                /* Если данных нет, выводим заглушку */
                <tr>
                  <td colSpan={14} className="py-20 text-center text-slate-500">
                    No data found for the selected period
                  </td>
                </tr>
              ) : sortedProfiles.map((profile, idx) => {
                const isExpanded = expandedProfiles.has(profile.name);
                // Находим этот же профиль в данных прошлого периода
                const prevProfile = prevProfiles.find(p => p.name === profile.name);
                
                return (
                  <Fragment key={profile.name}>
                    <tr
                      /* Разрешаем клик для раскрытия */
                      onClick={() => toggleExpand(profile.name)}
                      className={`border-b border-slate-700/40 hover:bg-slate-800/60 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-800/40' : ''}`}
                    >
                      <td className="px-5 py-3.5 text-slate-400">
                        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90 text-indigo-400' : ''}`}>
                          <ChevronRight size={18} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-100 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img 
                              src={`/${profile.name}.jpg`} 
                              className="w-8 h-8 rounded-full object-cover aspect-square shrink-0 border border-slate-700 ring-2 ring-indigo-500/20 shadow-lg"
                              alt={profile.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=4f46e5&color=fff&bold=true`;
                              }}
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                          </div>
                          {profile.name}
                        </div>
                      </td>
                      
                      <StatCell value={profile.invites} previousValue={prevProfile?.invites || 0} startDate={startDate} endDate={endDate} rowIndex={idx} />
                      <StatCell value={profile.accepted} previousValue={prevProfile?.accepted || 0} startDate={startDate} endDate={endDate} rowIndex={idx} />
                      <StatCell value={profile.acceptRate} previousValue={prevProfile?.acceptRate || 0} startDate={startDate} endDate={endDate} isPercentage customClass="text-emerald-400 bg-emerald-400/5 rounded-md my-1" rowIndex={idx} />
                      
                      <StatCell value={profile.messages} previousValue={prevProfile?.messages || 0} startDate={startDate} endDate={endDate} rowIndex={idx} />
                      <StatCell value={profile.replies} previousValue={prevProfile?.replies || 0} startDate={startDate} endDate={endDate} rowIndex={idx} />
                      <StatCell value={profile.replyRate} previousValue={prevProfile?.replyRate || 0} startDate={startDate} endDate={endDate} isPercentage customClass="text-indigo-400 bg-indigo-400/5 rounded-md my-1" rowIndex={idx} />
                      
                      {/* Placeholder stats (interested, calls, etc.) */}
                      <StatCell value={profile.interested} previousValue={0} startDate={startDate} endDate={endDate} rowIndex={idx} />
                      <StatCell value={profile.calls} previousValue={0} startDate={startDate} endDate={endDate} rowIndex={idx} />
                      <StatCell value={profile.mql} previousValue={0} startDate={startDate} endDate={endDate} customClass="text-amber-200" rowIndex={idx} />
                      <StatCell value={profile.sql} previousValue={0} startDate={startDate} endDate={endDate} customClass="text-orange-300" rowIndex={idx} />
                      <StatCell value={profile.partner} previousValue={0} startDate={startDate} endDate={endDate} customClass="text-rose-300" rowIndex={idx} />
                      <StatCell value={profile.clients} previousValue={0} startDate={startDate} endDate={endDate} customClass="text-emerald-400 font-bold" rowIndex={idx} />
                    </tr>

                    {/* Развернутые строки (кампании) */}
                    {isExpanded && profile.campaigns && profile.campaigns.map((camp: any, cIdx: number) => {
                      // Находим данные по этой же кампании за прошлый период
                      const prevProfileForCamp = prevProfiles.find(p => p.name === profile.name);
                      const prevCamp = (prevProfileForCamp?.campaigns || []).find((pc: any) => pc.name === camp.name);
                      
                      return (
                        <tr key={`${profile.name}-${camp.name}`} className="bg-slate-800/30 border-b border-slate-700/20 last:border-slate-700/40 hover:bg-slate-700/30 transition-colors text-[0.825rem]">
                          <td className="px-5 py-2.5"></td>
                          <td className="px-4 py-2.5 text-slate-300 pl-8 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                            {camp.name}
                          </td>
                          
                          <StatCell value={camp.invites} previousValue={prevCamp?.invites || 0} startDate={startDate} endDate={endDate} customClass="text-slate-400" rowIndex={idx + 1} />
                          <StatCell value={camp.accepted} previousValue={prevCamp?.accepted || 0} startDate={startDate} endDate={endDate} customClass="text-slate-400" rowIndex={idx + 1} />
                          <StatCell value={camp.acceptRate} previousValue={prevCamp?.acceptRate || 0} startDate={startDate} endDate={endDate} isPercentage customClass="text-slate-400" rowIndex={idx + 1} />
                          
                          <StatCell value={camp.messages} previousValue={prevCamp?.messages || 0} startDate={startDate} endDate={endDate} customClass="text-slate-400" rowIndex={idx + 1} />
                          <StatCell value={camp.replies} previousValue={prevCamp?.replies || 0} startDate={startDate} endDate={endDate} customClass="text-slate-400" rowIndex={idx + 1} />
                          <StatCell value={camp.replyRate} previousValue={prevCamp?.replyRate || 0} startDate={startDate} endDate={endDate} isPercentage customClass="text-slate-400" rowIndex={idx + 1} />
                          
                          <StatCell value={camp.interested} previousValue={0} startDate={startDate} endDate={endDate} customClass="text-slate-400" rowIndex={idx + 1} />
                          <StatCell value={camp.calls} previousValue={0} startDate={startDate} endDate={endDate} customClass="text-slate-400" rowIndex={idx + 1} />
                          <StatCell value={camp.mql} previousValue={0} startDate={startDate} endDate={endDate} customClass="text-slate-400" rowIndex={idx + 1} />
                          <StatCell value={camp.sql} previousValue={0} startDate={startDate} endDate={endDate} customClass="text-slate-400" rowIndex={idx + 1} />
                          <StatCell value={camp.partner} previousValue={0} startDate={startDate} endDate={endDate} customClass="text-slate-400" rowIndex={idx + 1} />
                          <StatCell value={camp.clients} previousValue={0} startDate={startDate} endDate={endDate} customClass="text-slate-400 font-medium" rowIndex={idx + 1} />
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-800 font-bold text-slate-100 border-t-2 border-slate-600/80">
              <tr>
                <td className="px-5 py-4 w-10"></td>
                <td className="px-4 py-4 text-left tracking-wide">TOTAL</td>
                
                <StatCell value={totals.invites} previousValue={prevTotals.invites} startDate={startDate} endDate={endDate} customClass="text-indigo-200" rowIndex={999} />
                <StatCell value={totals.accepted} previousValue={prevTotals.accepted} startDate={startDate} endDate={endDate} customClass="text-indigo-200" rowIndex={999} />
                <StatCell value={totalAcceptRate} previousValue={((prevTotals.accepted / (prevTotals.invites || 1)) * 100).toFixed(1)} startDate={startDate} endDate={endDate} isPercentage customClass="text-emerald-400" rowIndex={999} />
                
                <StatCell value={totals.messages} previousValue={prevTotals.messages} startDate={startDate} endDate={endDate} customClass="text-indigo-200" rowIndex={999} />
                <StatCell value={totals.replies} previousValue={prevTotals.replies} startDate={startDate} endDate={endDate} customClass="text-indigo-200" rowIndex={999} />
                <StatCell value={totalReplyRate} previousValue={((prevTotals.replies / (prevTotals.messages || 1)) * 100).toFixed(1)} startDate={startDate} endDate={endDate} isPercentage customClass="text-indigo-400" rowIndex={999} />
                
                <StatCell value={totals.interested} previousValue={0} startDate={startDate} endDate={endDate} customClass="text-indigo-200" rowIndex={999} />
                <StatCell value={totals.calls} previousValue={0} startDate={startDate} endDate={endDate} customClass="text-indigo-200" rowIndex={999} />
                <StatCell value={totals.mql} previousValue={0} startDate={startDate} endDate={endDate} customClass="text-amber-200" rowIndex={999} />
                <StatCell value={totals.sql} previousValue={0} startDate={startDate} endDate={endDate} customClass="text-orange-300" rowIndex={999} />
                <StatCell value={totals.partner} previousValue={0} startDate={startDate} endDate={endDate} customClass="text-rose-300" rowIndex={999} />
                <StatCell value={totals.clients} previousValue={0} startDate={startDate} endDate={endDate} customClass="text-emerald-400 text-base" rowIndex={999} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <DashboardCharts dailyData={dailyData} barData={barData} campaignData={campaignData} />
      <CampaignHistorySection />
    </div>
  );
}