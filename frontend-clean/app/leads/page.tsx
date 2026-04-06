'use client';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import CalendarPicker from '../components/CalendarPicker';

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
                        className="px-3 py-2 border rounded-lg bg-white"
                    >
                        <option value="all">All campaigns</option>
                        <option value="camp1">Campaign A</option>
                        <option value="camp2">Campaign B</option>
                    </select>
                    <CalendarPicker onDateChange={(start, end) => { setStartDate(start); setEndDate(end); }} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* График по тайтлам */}
                <div className="bg-white rounded-xl shadow p-4">
                    <h2 className="text-lg font-semibold mb-4">Leads by Title</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={titleData} layout="vertical">
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="title" width={120} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* График по локациям (круговая) */}
                <div className="bg-white rounded-xl shadow p-4">
                    <h2 className="text-lg font-semibold mb-4">Leads by Location</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={locationData} dataKey="count" nameKey="location" cx="50%" cy="50%" outerRadius={100} label>
                                {locationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}