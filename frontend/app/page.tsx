'use client';
import { useEffect, useState } from 'react';
import api from './api/client';
import StatsCard from './components/StatsCard';

export default function Dashboard() {
  const [totalActions, setTotalActions] = useState<number | null>(null);
  const [totalLeads, setTotalLeads] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const actionsRes = await api.get('/analytics/total-actions');
        setTotalActions(actionsRes.data.total_actions);
        const leadsRes = await api.get('/analytics/total-leads');
        setTotalLeads(leadsRes.data.total_leads);
      } catch (err) {
        console.error('Ошибка загрузки:', err);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Аналитика</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard title="Всего действий" value={totalActions ?? 0} />
        <StatsCard title="Всего лидов" value={totalLeads ?? 0} />
      </div>
    </div>
  );
}