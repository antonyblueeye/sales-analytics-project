'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import CalendarPicker from '../components/CalendarPicker';

const LeadsCharts = dynamic(() => import('../components/charts/LeadsCharts'), { 
  ssr: false,
  loading: () => <div className="h-[300px] flex items-center justify-center bg-slate-800 text-slate-100 rounded-xl shadow w-full">Loading charts...</div>
});

// Статические данные по тайтлам
const titleData = [
    { title: 'CEO', count: 45 },
    { title: 'CTO', count: 32 },
    { title: 'Marketing Manager', count: 78 },
    { title: 'Sales Director', count: 54 },
    { title: 'HR', count: 23 },
];

// Данные по локациям
const locationData = [
    { location: 'USA', count: 120 },
    { location: 'UK', count: 85 },
    { location: 'Germany', count: 62 },
    { location: 'France', count: 41 },
    { location: 'Ukraine', count: 33 },
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

export default function LeadsAnalytics() {
    const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 3600000));
    const [endDate, setEndDate] = useState(new Date());
    const [selectedCampaign, setSelectedCampaign] = useState('all');

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-2xl font-bold">Leads Analytics</h1>
                <div className="flex gap-4 items-center">
                    <select
                        value={selectedCampaign}
                        onChange={(e) => setSelectedCampaign(e.target.value)}
                        className="px-3 py-2 border rounded-lg bg-slate-800 text-slate-100"
                    >
                        <option value="all">All campaigns</option>
                        <option value="camp1">Campaign A</option>
                        <option value="camp2">Campaign B</option>
                    </select>
                    <CalendarPicker onDateChange={(start, end) => { setStartDate(start); setEndDate(end); }} />
                </div>
            </div>

            <LeadsCharts titleData={titleData} locationData={locationData} />
        </div>
    );
}