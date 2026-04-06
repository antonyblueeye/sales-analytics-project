'use client';
import { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CalendarPicker from '../components/CalendarPicker';

const replyTypeData = [
    { name: 'Interested', value: 65 },
    { name: 'No need', value: 35 },
];

const topMessagesData = [
    { message: 'Hi, we are...', replies: 24, positive: 18, negative: 6 },
    { message: 'Hello, check this...', replies: 18, positive: 12, negative: 6 },
    { message: 'Would you like...', replies: 32, positive: 25, negative: 7 },
];

export default function ResponseAnalytics() {
    const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 3600000));
    const [endDate, setEndDate] = useState(new Date());
    const [selectedCampaign, setSelectedCampaign] = useState('all');
    const [location, setLocation] = useState('all');

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between gap-4 items-center">
                <div className="flex gap-4">
                    <select value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)} className="px-3 py-2 border rounded-lg">
                        <option value="all">All campaigns</option>
                        <option value="camp1">Campaign A</option>
                    </select>
                    <select value={location} onChange={e => setLocation(e.target.value)} className="px-3 py-2 border rounded-lg">
                        <option value="all">All locations</option>
                        <option value="US">United States</option>
                        <option value="UK">United Kingdom</option>
                    </select>
                </div>
                <CalendarPicker onDateChange={(start, end) => { setStartDate(start); setEndDate(end); }} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow p-4">
                    <h2 className="text-lg font-semibold mb-4">Response Type Distribution</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={replyTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                <Cell fill="#82ca9d" />
                                <Cell fill="#ff8042" />
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow p-4">
                    <h2 className="text-lg font-semibold mb-4">Top Performing Messages</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topMessagesData}>
                            <XAxis dataKey="message" width={150} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="replies" fill="#8884d8" name="Total replies" />
                            <Bar dataKey="positive" fill="#82ca9d" name="Positive" />
                            <Bar dataKey="negative" fill="#ff8042" name="Negative" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}