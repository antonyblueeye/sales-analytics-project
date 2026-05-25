'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import CustomSelect from '../components/CustomSelect';
import { Target } from 'lucide-react';

const LeadsCharts = dynamic(() => import('../components/charts/LeadsCharts'), { 
  ssr: false,
  loading: () => <div className="h-[300px] flex items-center justify-center bg-slate-800 text-slate-100 rounded-xl shadow w-full">Loading charts...</div>
});

export default function LeadsAnalytics() {
    const [selectedCampaign, setSelectedCampaign] = useState('all');
    const [campaigns, setCampaigns] = useState<string[]>([]);
    const [titleData, setTitleData] = useState<{title: string, count: number}[]>([]);
    const [repliedTitleData, setRepliedTitleData] = useState<{title: string, count: number}[]>([]);
    const [locationData, setLocationData] = useState<{location: string, count: number}[]>([]);
    const [loadingTitles, setLoadingTitles] = useState(false);

    useEffect(() => {
        // Fetch campaigns
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/campaigns-list`)
            .then(res => res.json())
            .then(data => {
                setCampaigns(data);
            })
            .catch(err => console.error("Error fetching campaigns:", err));
    }, []);

    useEffect(() => {
        // Fetch title and location data
        setLoadingTitles(true);
        Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/leads?campaign=${encodeURIComponent(selectedCampaign)}`).then(res => res.json()),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/replied-leads-titles?campaign=${encodeURIComponent(selectedCampaign)}`).then(res => res.json()),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/locations?campaign=${encodeURIComponent(selectedCampaign)}`).then(res => res.json())
        ])
            .then(([leadsData, repliedData, locData]) => {
                setTitleData(leadsData);
                setRepliedTitleData(repliedData);
                setLocationData(locData);
            })
            .catch(err => console.error("Error fetching leads analytics:", err))
            .finally(() => setLoadingTitles(false));
    }, [selectedCampaign]);

    const campaignOptions = [
        { value: 'all', label: 'All campaigns' },
        ...campaigns.map(c => ({ value: c, label: c }))
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-2xl font-bold">Leads Analytics</h1>
                <div className="flex gap-4 items-center">
                    <CustomSelect
                        value={selectedCampaign}
                        onChange={setSelectedCampaign}
                        options={campaignOptions}
                        icon={<Target size={16} />}
                    />
                </div>
            </div>

            {loadingTitles ? (
                <div className="h-[300px] flex items-center justify-center bg-slate-800 text-slate-100 rounded-xl shadow w-full">Loading analytics data...</div>
            ) : (
                <LeadsCharts titleData={titleData} repliedTitleData={repliedTitleData} locationData={locationData} />
            )}
        </div>
    );
}