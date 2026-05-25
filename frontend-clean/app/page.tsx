'use client';
import { useState, useMemo, Fragment, ReactNode, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import DateRangePicker from './components/DateRangePicker';
import { ChevronDown, ChevronRight, ArrowUpDown, ArrowDown, ArrowUp, Minus, Loader2, Sparkles } from 'lucide-react';
import {
  format, subDays, differenceInDays, startOfWeek,
  subMonths, subYears, startOfMonth, endOfMonth,
  startOfYear, endOfYear, isSameDay
} from 'date-fns';
import axios from 'axios';
import { saveInsightToHistory } from './components/Header';
import { anonProfile, BLUR_IMG_CLASS, DEMO_MODE } from './lib/demo';

const DashboardCharts = dynamic(() => import('./components/charts/DashboardCharts'), {
  ssr: false,
  loading: () => <div className="h-[600px] flex items-center justify-center bg-slate-800 text-slate-100 rounded-xl shadow w-full">Loading charts...</div>
});

const CampaignHistorySection = dynamic(() => import('./components/charts/CampaignHistorySection'), {
  ssr: false,
  loading: () => <div className="h-[400px] flex items-center justify-center bg-slate-800 text-slate-100 rounded-xl shadow w-full">Loading historical analytics...</div>
});

const FunnelHistorySection = dynamic(() => import('./components/charts/FunnelHistorySection'), {
  ssr: false,
  loading: () => <div className="h-[400px] flex items-center justify-center bg-slate-800 text-slate-100 rounded-xl shadow w-full">Loading funnel dynamics...</div>
});

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

// Utility to calculate semantic previous period
const getPreviousPeriod = (startDate: Date, endDate: Date) => {
  const duration = differenceInDays(endDate, startDate) + 1;

  // 1. Check if it's a full month selection
  const isStartOfMonth = startDate.getDate() === 1;
  const isEndOfMonth = isSameDay(endDate, endOfMonth(startDate));

  if (isStartOfMonth && isEndOfMonth) {
    const prevMonthStart = startOfMonth(subMonths(startDate, 1));
    const prevMonthEnd = endOfMonth(prevMonthStart);
    return { start: prevMonthStart, end: prevMonthEnd };
  }

  // 2. Check if it's a full year selection
  const isStartOfYear = startDate.getMonth() === 0 && startDate.getDate() === 1;
  const isEndOfYear = isSameDay(endDate, endOfYear(startDate));

  if (isStartOfYear && isEndOfYear) {
    const prevYearStart = startOfYear(subYears(startDate, 1));
    const prevYearEnd = endOfYear(prevYearStart);
    return { start: prevYearStart, end: prevYearEnd };
  }

  // 3. Handle Year-to-Date (This Year preset)
  if (isStartOfYear && isSameDay(endDate, new Date())) {
    return {
      start: startOfYear(subYears(startDate, 1)),
      end: subYears(endDate, 1)
    };
  }

  // Fallback: strictly duration-based offset
  return {
    start: subDays(startDate, duration),
    end: subDays(startDate, 1)
  };
};

const StatCell = ({ value, previousValue, isPercentage, startDate, endDate, customClass, rowIndex }: StatCellProps) => {
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const valNum = typeof value === 'string' ? parseFloat(value) : value;
  const prevValNum = typeof previousValue === 'string' ? parseFloat(previousValue) : previousValue;

  const diff = valNum - prevValNum;
  const trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'equal';

  const prevPeriod = getPreviousPeriod(startDate, endDate);
  const prevStartDate = prevPeriod.start;
  const prevEndDate = prevPeriod.end;

  const handleMouseEnter = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    setVisible(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setVisible(false);
    setMousePos(null);
  };

  const showBelow = mousePos ? mousePos.y < window.innerHeight / 2 : true;
  const nearRightEdge = mousePos ? mousePos.x > window.innerWidth - 220 : false;

  const tooltipEl = visible && mousePos && mounted ? (
    <div
      style={{
        position: 'fixed',
        zIndex: 99999,
        pointerEvents: 'none',
        left: nearRightEdge ? mousePos.x - 190 : mousePos.x - 90,
        top: showBelow ? mousePos.y + 16 : mousePos.y - 116,
      }}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-2xl min-w-[180px] backdrop-blur-xl">
        <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Previous Period</div>
        <div className="text-[10px] text-slate-500 mb-2">
          {format(prevStartDate, 'MMM dd')} - {format(prevEndDate, 'MMM dd, yyyy')}
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-white">
            {previousValue}{isPercentage ? '%' : ''}
          </span>
          <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400'
            }`}>
            {trend === 'up' ? '+' : ''}
            {isPercentage ? diff.toFixed(1) : diff}
            {isPercentage ? '%' : ''}
          </div>
        </div>
      </div>
      <div className={`w-2 h-2 bg-slate-800 border-slate-700 rotate-45 absolute ${showBelow ? '-top-1 border-l border-t' : '-bottom-1 border-r border-b'
        } left-[88px]`} />
    </div>
  ) : null;

  return (
    <td
      className={`px-4 py-3.5 text-right font-medium relative group ${customClass}`}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-end gap-1.5">
        <span>{value}{isPercentage ? '%' : ''}</span>
        {visible && (
          <div>
            {trend === 'up' && <ArrowUp size={12} className="text-emerald-400" />}
            {trend === 'down' && <ArrowDown size={12} className="text-rose-400" />}
            {trend === 'equal' && <Minus size={12} className="text-slate-500" />}
          </div>
        )}
      </div>

      {mounted && tooltipEl && createPortal(tooltipEl, document.body)}
    </td>
  );
};

export default function Dashboard() {
  const [startDate, setStartDate] = useState(subDays(new Date(), 6));
  const [endDate, setEndDate] = useState(new Date());
  const [profiles, setProfiles] = useState<ProfileData[]>([]); // Данные текущего периода
  const [prevProfiles, setPrevProfiles] = useState<ProfileData[]>([]); // Данные предыдущего периода для сравнения
  const [isLoading, setIsLoading] = useState(true); // Состояние загрузки (крутилка)
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: ProfileKeys, direction: 'asc' | 'desc' } | null>(null);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [recentReplies, setRecentReplies] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  // Сбрасываем предыдущий инсайт при смене дат, чтобы не показывать устаревший
  useEffect(() => {
    setAiInsight('');
  }, [startDate, endDate]);

  const fetchInsight = useCallback(async () => {
    setIsInsightLoading(true);
    setAiInsight('');
    try {
      const res = await axios.get('http://localhost:8000/analytics/ai-insights', {
        params: { from_date: format(startDate, 'yyyy-MM-dd'), to_date: format(endDate, 'yyyy-MM-dd') }
      });
      let insightText: string = res.data.insight;
      if (DEMO_MODE && profiles.length > 0) {
        // Replace real profile names with Profile #N (longest names first to avoid partial matches)
        const sorted = [...profiles].sort((a, b) => b.name.length - a.name.length);
        sorted.forEach(p => {
          const anon = anonProfile(p.name);
          insightText = insightText.replace(new RegExp(p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), anon);
        });
      }
      setAiInsight(insightText);
      saveInsightToHistory({
        text: insightText,
        generatedAt: new Date().toISOString(),
        dateRange: `${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d, yyyy')}`
      });
    } catch (err) {
      console.error("AI Insight error", err);
      setAiInsight("Unable to load insights at this time.");
    } finally {
      setIsInsightLoading(false);
    }
  }, [startDate, endDate, profiles]);

  // Функция для запроса данных из Python бэкенда
  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      // Вычисляем даты предыдущего периода семантически
      const prevPeriod = getPreviousPeriod(startDate, endDate);
      const prevStart = prevPeriod.start;
      const prevEnd = prevPeriod.end;

      // Запускаем все запросы параллельно: профили и кампании (текущие и прошлые)
      const [currRes, prevRes, currCampRes, prevCampRes, dailyRes, recentRepliesRes] = await Promise.all([
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
        }),
        axios.get('http://localhost:8000/analytics/daily-summary', {
          params: { from_date: format(startDate, 'yyyy-MM-dd'), to_date: format(endDate, 'yyyy-MM-dd') }
        }),
        axios.get('http://localhost:8000/analytics/recent-replies', {
          params: { from_date: format(startDate, 'yyyy-MM-dd'), to_date: format(endDate, 'yyyy-MM-dd') }
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
            interested: c.interested || 0,
            calls: c.calls || 0,
            mql: c.mql || 0,
            sql: c.sql || 0,
            partner: c.partner || 0,
            clients: c.clients || 0
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
        interested: item.interested || 0,
        calls: item.calls || 0,
        mql: item.mql || 0,
        sql: item.sql || 0,
        partner: item.partner || 0,
        clients: item.clients || 0,
        campaigns: campaignsMap[item.profile_name] || []
      });

      setProfiles(currRes.data.map((item: any) => mapItem(item, currCamps)));
      setPrevProfiles(prevRes.data.map((item: any) => mapItem(item, prevCamps)));
      setDailyData(dailyRes.data);
      setRecentReplies(recentRepliesRes.data);
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
  const { totals, prevTotals, totalAcceptRate, totalReplyRate, barData, campaignData } = useMemo(() => {
    const calculateTotals = (data: ProfileData[]) => data.reduce((acc, curr) => {
      acc.invites += curr.invites;
      acc.accepted += curr.accepted;
      acc.messages += curr.messages;
      acc.replies += curr.replies;
      acc.interested += Number(curr.interested) || 0;
      acc.calls += Number(curr.calls) || 0;
      acc.mql += Number(curr.mql) || 0;
      acc.sql += Number(curr.sql) || 0;
      acc.partner += Number(curr.partner) || 0;
      acc.clients += Number(curr.clients) || 0;
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

    // ГЕНЕРАЦИЯ ДАННЫХ ДЛЯ ГРАФИКА УДАЛЕНА - теперь они приходят с бэкенда

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
            replies: 0,
            interested: 0,
            calls: 0,
            mql: 0,
            sql: 0,
            partner: 0,
            clients: 0
          };
        }
        ctMap[c.name].invites += (c.invites || 0);
        ctMap[c.name].accepted += (c.accepted || 0);
        ctMap[c.name].messages += (c.messages || 0);
        ctMap[c.name].replies += (c.replies || 0);
        ctMap[c.name].interested += (c.interested || 0);
        ctMap[c.name].calls += (c.calls || 0);
        ctMap[c.name].mql += (c.mql || 0);
        ctMap[c.name].sql += (c.sql || 0);
        ctMap[c.name].partner += (c.partner || 0);
        ctMap[c.name].clients += (c.clients || 0);
      });
    });
    const ct = Object.values(ctMap);

    return { totals: t, prevTotals: pt, totalAcceptRate: ar, totalReplyRate: rr, barData: bd, campaignData: ct };
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
                              className={`w-8 h-8 rounded-full object-cover aspect-square shrink-0 border border-slate-700 ring-2 ring-indigo-500/20 shadow-lg ${BLUR_IMG_CLASS}`}
                              alt=""
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=4f46e5&color=fff&bold=true`;
                              }}
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                          </div>
                          {anonProfile(profile.name)}
                        </div>
                      </td>

                      <StatCell value={profile.invites} previousValue={prevProfile?.invites || 0} startDate={startDate} endDate={endDate} rowIndex={idx} />
                      <StatCell value={profile.accepted} previousValue={prevProfile?.accepted || 0} startDate={startDate} endDate={endDate} rowIndex={idx} />
                      <StatCell value={profile.acceptRate} previousValue={prevProfile?.acceptRate || 0} startDate={startDate} endDate={endDate} isPercentage customClass="text-emerald-400 bg-emerald-400/5 rounded-md my-1" rowIndex={idx} />

                      <StatCell value={profile.messages} previousValue={prevProfile?.messages || 0} startDate={startDate} endDate={endDate} rowIndex={idx} />
                      <StatCell value={profile.replies} previousValue={prevProfile?.replies || 0} startDate={startDate} endDate={endDate} rowIndex={idx} />
                      <StatCell value={profile.replyRate} previousValue={prevProfile?.replyRate || 0} startDate={startDate} endDate={endDate} isPercentage customClass="text-indigo-400 bg-indigo-400/5 rounded-md my-1" rowIndex={idx} />

                      {/* Placeholder stats (interested, calls, etc.) */}
                      <StatCell value={profile.interested} previousValue={prevProfile?.interested || 0} startDate={startDate} endDate={endDate} rowIndex={idx} />
                      <StatCell value={profile.calls} previousValue={prevProfile?.calls || 0} startDate={startDate} endDate={endDate} rowIndex={idx} />
                      <StatCell value={profile.mql} previousValue={prevProfile?.mql || 0} startDate={startDate} endDate={endDate} customClass="text-amber-200" rowIndex={idx} />
                      <StatCell value={profile.sql} previousValue={prevProfile?.sql || 0} startDate={startDate} endDate={endDate} customClass="text-orange-300" rowIndex={idx} />
                      <StatCell value={profile.partner} previousValue={prevProfile?.partner || 0} startDate={startDate} endDate={endDate} customClass="text-rose-300" rowIndex={idx} />
                      <StatCell value={profile.clients} previousValue={prevProfile?.clients || 0} startDate={startDate} endDate={endDate} customClass="text-emerald-400 font-bold" rowIndex={idx} />
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

                          <StatCell value={camp.interested} previousValue={prevCamp?.interested || 0} startDate={startDate} endDate={endDate} customClass="text-slate-400" rowIndex={idx + 1} />
                          <StatCell value={camp.calls} previousValue={prevCamp?.calls || 0} startDate={startDate} endDate={endDate} customClass="text-slate-400" rowIndex={idx + 1} />
                          <StatCell value={camp.mql} previousValue={prevCamp?.mql || 0} startDate={startDate} endDate={endDate} customClass="text-slate-400" rowIndex={idx + 1} />
                          <StatCell value={camp.sql} previousValue={prevCamp?.sql || 0} startDate={startDate} endDate={endDate} customClass="text-slate-400" rowIndex={idx + 1} />
                          <StatCell value={camp.partner} previousValue={prevCamp?.partner || 0} startDate={startDate} endDate={endDate} customClass="text-slate-400" rowIndex={idx + 1} />
                          <StatCell value={camp.clients} previousValue={prevCamp?.clients || 0} startDate={startDate} endDate={endDate} customClass="text-slate-400 font-medium" rowIndex={idx + 1} />
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

                <StatCell value={totals.interested} previousValue={prevTotals.interested} startDate={startDate} endDate={endDate} customClass="text-indigo-200" rowIndex={999} />
                <StatCell value={totals.calls} previousValue={prevTotals.calls} startDate={startDate} endDate={endDate} customClass="text-indigo-200" rowIndex={999} />
                <StatCell value={totals.mql} previousValue={prevTotals.mql} startDate={startDate} endDate={endDate} customClass="text-amber-200" rowIndex={999} />
                <StatCell value={totals.sql} previousValue={prevTotals.sql} startDate={startDate} endDate={endDate} customClass="text-orange-300" rowIndex={999} />
                <StatCell value={totals.partner} previousValue={prevTotals.partner} startDate={startDate} endDate={endDate} customClass="text-rose-300" rowIndex={999} />
                <StatCell value={totals.clients} previousValue={prevTotals.clients} startDate={startDate} endDate={endDate} customClass="text-emerald-400 text-base" rowIndex={999} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* AI Insights Block */}
      <div className="relative bg-gradient-to-r from-indigo-900/40 to-slate-900/80 border border-indigo-500/30 rounded-2xl p-6 shadow-xl overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
        <div className="flex gap-4 items-start relative z-10">
          <div className="mt-1 p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
            <Sparkles size={20} className={isInsightLoading ? 'animate-pulse' : ''} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <h3 className="text-lg font-bold text-indigo-100 flex items-center gap-2">
                AI Performance Insights
                {isInsightLoading && <span className="text-xs font-normal text-indigo-300 animate-pulse bg-indigo-500/10 px-2 py-0.5 rounded-full">Analyzing data...</span>}
              </h3>
              <button
                onClick={fetchInsight}
                disabled={isInsightLoading}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-100 border border-indigo-500/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInsightLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    {aiInsight ? 'Regenerate' : 'Generate Insight'}
                  </>
                )}
              </button>
            </div>
            <div className="text-sm text-slate-300 leading-relaxed min-h-[40px] prose prose-invert max-w-none">
              {isInsightLoading ? (
                <div className="space-y-2 mt-2">
                  <div className="h-4 bg-slate-700/50 rounded animate-pulse w-full"></div>
                  <div className="h-4 bg-slate-700/50 rounded animate-pulse w-5/6"></div>
                </div>
              ) : aiInsight ? (
                aiInsight.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 last:mb-0" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-200 font-bold">$1</strong>') }} />
                ))
              ) : (
                <p className="text-slate-400 italic">Click <span className="font-semibold text-indigo-300">Generate Insight</span> to get an AI-powered summary for the selected date range.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <DashboardCharts dailyData={dailyData} barData={barData} campaignData={campaignData} recentReplies={recentReplies} />
      <FunnelHistorySection />
      <CampaignHistorySection />
    </div>
  );
}
