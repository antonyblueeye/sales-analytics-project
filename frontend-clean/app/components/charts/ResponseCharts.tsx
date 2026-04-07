'use client';
import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ResponseChartsProps {
    replyTypeData: any[];
    topMessagesData: any[];
}

export default function ResponseCharts({ replyTypeData, topMessagesData }: ResponseChartsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 text-slate-100 rounded-xl shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Response Type Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={replyTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            <Cell fill="#82ca9d" />
                            <Cell fill="#ff8042" />
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#f8fafc', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-slate-800 text-slate-100 rounded-xl shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Top Performing Messages</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topMessagesData}>
                        <XAxis dataKey="message" width={150} />
                        <YAxis />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#f8fafc', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
                        <Legend />
                        <Bar dataKey="replies" fill="#8884d8" name="Total replies" />
                        <Bar dataKey="positive" fill="#82ca9d" name="Positive" />
                        <Bar dataKey="negative" fill="#ff8042" name="Negative" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
