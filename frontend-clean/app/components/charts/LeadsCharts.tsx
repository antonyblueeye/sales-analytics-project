'use client';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface LeadsChartsProps {
    titleData: any[];
    locationData: any[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

export default function LeadsCharts({ titleData, locationData }: LeadsChartsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 text-slate-100 rounded-xl shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Leads by Title</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={titleData} layout="vertical">
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="title" width={120} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#f8fafc', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
                        <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-slate-800 text-slate-100 rounded-xl shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Leads by Location</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={locationData} dataKey="count" nameKey="location" cx="50%" cy="50%" outerRadius={100} label>
                            {locationData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#f8fafc', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
