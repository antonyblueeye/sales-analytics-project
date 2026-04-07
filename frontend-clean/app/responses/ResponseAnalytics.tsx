'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import DateRangePicker from '../components/DateRangePicker';
import CustomSelect from '../components/CustomSelect';
import { Target, MapPin } from 'lucide-react';

const ResponseCharts = dynamic(() => import('../components/charts/ResponseCharts'), { 
  ssr: false,
  loading: () => <div className="h-[300px] flex items-center justify-center bg-slate-800 text-slate-100 rounded-xl shadow w-full">Loading charts...</div>
});

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

            <ResponseCharts replyTypeData={replyTypeData} topMessagesData={topMessagesData} />
        </div>
    );
}