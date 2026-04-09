'use client';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import LeadsMap from './LeadsMap';

interface LeadsChartsProps {
    titleData: any[];
    locationData: any[];
}

export default function LeadsCharts({ titleData, locationData }: LeadsChartsProps) {
    return (
        <div className="space-y-6">
            {/* Top Row: Title Analytics and Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-6 text-slate-100">
                    <h2 className="text-xl font-bold mb-6 tracking-tight">Leads by Title</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={titleData} layout="vertical" margin={{ left: -20, right: 10 }}>
                            <XAxis type="number" hide />
                            <YAxis 
                                type="category" 
                                dataKey="title" 
                                width={120} 
                                stroke="#94a3b8" 
                                fontSize={11} 
                                tickLine={false} 
                                axisLine={false} 
                            />
                            <Tooltip 
                                cursor={{ fill: '#334155', opacity: 0.4 }}
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} 
                            />
                            <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-slate-700/50 border-dashed rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center text-slate-500">
                    <p className="text-sm font-medium uppercase tracking-widest text-slate-600">Additional Metric Coming Soon</p>
                    <div className="w-12 h-1 bg-slate-700/30 rounded-full mt-3"></div>
                </div>
            </div>

            {/* Bottom Row: Full Width Map */}
            <div className="w-full">
                <LeadsMap locationData={locationData} />
            </div>
        </div>
    );
}
