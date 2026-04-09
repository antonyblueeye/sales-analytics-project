'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import DateRangePicker from '../components/DateRangePicker';
import CustomSelect from '../components/CustomSelect';
import { Target, MapPin, X } from 'lucide-react';

const ResponseCharts = dynamic(() => import('../components/charts/ResponseCharts'), { 
  ssr: false,
  loading: () => <div className="h-[300px] flex items-center justify-center bg-slate-800 text-slate-100 rounded-xl shadow w-full">Loading charts...</div>
});

const replyTypeData = [
    { name: 'Interested', value: 65 },
    { name: 'No need', value: 35 },
];

const topMessagesData = [
    { 
        message: "Hi [First Name], I've been following your work at [Company] for a while now. I was particularly impressed by your recent growth in the EMEA market. I'd love to share some insights on how we helped similar teams scale their outreach efficiency by 40% without increasing their headcount. Would you be open to a brief 10-minute introduction sometime next week?", 
        replies: 142, 
        positive: 86,
        neutral: 24,
        negative: 18,
        onHold: 14
    },
    { 
        message: "Hello [Name], I noticed that [Company] is currently expanding its sales department. We specialize in helping high-growth startups automate the lead generation process while maintaining a highly personalized touch. Our clients typically see a 3x increase in booked meetings within the first 60 days. Are you currently using any automation for your LinkedIn outreach?", 
        replies: 128, 
        positive: 74,
        neutral: 20,
        negative: 22,
        onHold: 12
    },
    { 
        message: "Hi [Name], quick question – how is your team currently managing follow-ups for cold leads? Many sales leaders we talk to struggle with maintaining consistency, which often leads to 70% of potential pipeline being lost. I've put together a small deck on our multi-channel approach that solves this. Shall I send it over for you to check out?", 
        replies: 95, 
        positive: 42,
        neutral: 18,
        negative: 25,
        onHold: 10
    },
    { 
        message: "Congratulations on the recent Series B funding, [Name]! It's an exciting time for [Company]. With this new scale, maintaining the quality of your outbound strategy becomes even more critical. We've built a platform that ensures every single message is unique to the prospect's profile and recent activity. Would it make sense to explore how this could fit into your new growth plans?", 
        replies: 84, 
        positive: 38,
        neutral: 15,
        negative: 20,
        onHold: 11
    },
    { 
        message: "Hi [Name], I saw your post about the challenges of finding qualified SDRs in today's market. It's a common bottleneck. What if you could double the output of your existing team by removing the manual research part of their job? I have a specific workflow that does exactly that. Do you have a few minutes for a quick chat about it next Tuesday?", 
        replies: 76, 
        positive: 29,
        neutral: 12,
        negative: 25,
        onHold: 10
    },
];

export default function ResponseAnalytics() {
    const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 3600000));
    const [endDate, setEndDate] = useState(new Date());
    const [selectedCampaign, setSelectedCampaign] = useState('all');
    const [location, setLocation] = useState('all');
    const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

    return (
        <div className="space-y-8 text-slate-100">
            <div className="flex flex-wrap justify-between gap-4 items-center">
                <div className="flex gap-4">
                    <CustomSelect
                        value={selectedCampaign}
                        onChange={setSelectedCampaign}
                        options={[
                            { value: 'all', label: 'All campaigns' },
                            { value: 'camp1', label: 'Campaign A' },
                        ]}
                        icon={<Target size={16} />}
                    />
                    <CustomSelect
                        value={location}
                        onChange={setLocation}
                        options={[
                            { value: 'all', label: 'All locations' },
                            { value: 'US', label: 'United States' },
                            { value: 'UK', label: 'United Kingdom' },
                        ]}
                        icon={<MapPin size={16} />}
                    />
                </div>
                <DateRangePicker onDateChange={(start, end) => { setStartDate(start); setEndDate(end); }} />
            </div>

            {/* Top 5 Messages Table */}
            <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/20">
                    <h2 className="text-xl font-bold text-slate-100 tracking-tight">Top 5 Performing Messages</h2>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold border border-slate-800 px-3 py-1 rounded-full">
                        By Conversion
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/40 text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-700/50">
                                <th className="px-6 py-4 font-bold border-r border-slate-700/30">Outgoing Message Snippet</th>
                                <th className="px-5 py-4 font-bold text-center">Totals</th>
                                <th className="px-5 py-4 font-bold text-center text-emerald-500/80">Positive</th>
                                <th className="px-5 py-4 font-bold text-center text-orange-400/80">Neutral</th>
                                <th className="px-5 py-4 font-bold text-center text-rose-500/80">Negative</th>
                                <th className="px-5 py-4 font-bold text-center text-amber-500/80">On Hold</th>
                                <th className="px-6 py-4 font-bold text-center bg-indigo-500/5 text-indigo-300">Conv. Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {topMessagesData.map((item, idx) => (
                                <tr 
                                    key={idx} 
                                    onClick={() => setSelectedMessage(item.message)}
                                    className="hover:bg-slate-700/20 transition-all group cursor-pointer"
                                >
                                    <td className="px-6 py-5 max-w-[340px] border-r border-slate-700/30">
                                        <p className="text-sm text-slate-200 truncate pr-4 leading-relaxed group-hover:text-white transition-colors">
                                            {item.message}
                                        </p>
                                    </td>
                                    <td className="px-5 py-5 text-center">
                                        <span className="text-sm font-bold text-slate-400">{item.replies}</span>
                                    </td>
                                    <td className="px-5 py-5 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-black text-emerald-400">{item.positive}</span>
                                            <span className="text-[10px] text-slate-500">{( (item.positive / item.replies) * 100).toFixed(0)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-5 text-center">
                                        <span className="text-sm font-semibold text-orange-300/80">{item.neutral}</span>
                                    </td>
                                    <td className="px-5 py-5 text-center">
                                        <span className="text-sm font-semibold text-rose-400/80">{item.negative}</span>
                                    </td>
                                    <td className="px-5 py-5 text-center">
                                        <span className="text-sm font-semibold text-amber-400/80">{item.onHold}</span>
                                    </td>
                                    <td className="px-6 py-5 text-center bg-indigo-500/5">
                                        <div className="inline-flex flex-col items-center px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-400/20">
                                            <span className="text-xs font-black text-indigo-300">
                                                {((item.positive / item.replies) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Message Detail Modal */}
            {selectedMessage && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#1e293b] border border-slate-700 shadow-2xl rounded-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">Full Message Content</h3>
                            <button 
                                onClick={() => setSelectedMessage(null)}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 shadow-inner ring-1 ring-inset ring-white/5">
                                <p className="text-slate-200 leading-relaxed text-lg whitespace-pre-wrap italic">
                                    "{selectedMessage}"
                                </p>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-800/30 border-t border-slate-700/50 flex justify-end">
                            <button 
                                onClick={() => setSelectedMessage(null)}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                            >
                                Close Detail
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ResponseCharts replyTypeData={replyTypeData} topMessagesData={topMessagesData} />
        </div>
    );
}