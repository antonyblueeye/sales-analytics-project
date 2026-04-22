'use client';
import React, { useState } from 'react';
import CustomSelect from '../components/CustomSelect';
import { 
    ChevronLeft, 
    ChevronRight, 
    Clock, 
    Plus,
    Loader2,
    Target
} from 'lucide-react';
import axios from 'axios';

interface MessageVersion {
    text: string;
    date: string;
    sent_count: number;
    reply_count: number;
}

interface Step {
    id: number;
    title: string;
    description: string;
    versions: MessageVersion[];
}

const CampaignStep = ({ step, index }: { step: Step, index: number }) => {
    const [versionIndex, setVersionIndex] = useState(0);
    const currentVersion = step.versions[versionIndex];

    const replyRate = currentVersion?.sent_count 
        ? Math.round((currentVersion.reply_count / currentVersion.sent_count) * 100) 
        : 0;

    return (
        <div className="relative pl-12 pb-12 group last:pb-0 font-sans">
            <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-slate-700 group-last:bg-transparent" />
            <div className="absolute left-0 top-2 w-12 h-12 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-900 z-10 
                              group-hover:scale-125 transition-transform duration-200 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-indigo-500/30 transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Step {index + 1}</span>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-100">{step.title}</h3>
                        <p className="text-sm text-slate-400 mt-1">{step.description}</p>
                    </div>

                    {step.versions.length > 1 && (
                        <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-xl self-start border border-slate-700/30">
                            <button 
                                onClick={() => setVersionIndex(prev => Math.max(0, prev - 1))}
                                disabled={versionIndex === 0}
                                className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors text-slate-300"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="px-3 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                {step.versions.length - versionIndex} / {step.versions.length}
                            </div>
                            <button 
                                onClick={() => setVersionIndex(prev => Math.min(step.versions.length - 1, prev + 1))}
                                disabled={versionIndex === step.versions.length - 1}
                                className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors text-slate-300"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="relative mt-2">
                    <div className="bg-slate-950/40 rounded-xl p-5 border border-slate-700/30 border-l-2 border-l-indigo-500/50 text-slate-300 leading-relaxed text-sm antialiased whitespace-pre-wrap">
                        {currentVersion?.text}
                    </div>
                    
                    <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Sent</span>
                                <div className="text-sm font-mono text-slate-300 bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-700/30">
                                    {currentVersion?.sent_count || 0}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Replies</span>
                                <div className="text-sm font-mono text-emerald-400 bg-emerald-500/5 px-3 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-2">
                                    {currentVersion?.reply_count || 0}
                                    <span className="text-[10px] text-emerald-500/50 font-sans font-bold">
                                        {replyRate}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-[9px] uppercase font-bold tracking-[0.2em] text-slate-500 flex items-center gap-1.5 px-3 py-1 bg-slate-900/40 rounded-full border border-slate-700/30 self-end md:self-auto">
                            <span className="w-1 h-1 rounded-full bg-indigo-500/70 animate-pulse"></span>
                            Version from {currentVersion?.date}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<string[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<string>('');
    const [sequence, setSequence] = useState<Step[]>([]);
    const [loading, setLoading] = useState(true);
    const [seqLoading, setSeqLoading] = useState(false);

    React.useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const response = await axios.get('http://localhost:8000/analytics/campaigns-list');
                setCampaigns(response.data);
                if (response.data.length > 0) {
                    setSelectedCampaign(response.data[0]);
                }
            } catch (error) {
                console.error('Error fetching campaigns:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCampaigns();
    }, []);

    React.useEffect(() => {
        const fetchSequence = async () => {
            if (!selectedCampaign) return;
            setSeqLoading(true);
            try {
                const response = await axios.get(`http://localhost:8000/analytics/campaign-sequence?campaign_name=${encodeURIComponent(selectedCampaign)}`);
                setSequence(response.data);
            } catch (error) {
                console.error('Error fetching sequence:', error);
            } finally {
                setSeqLoading(false);
            }
        };
        fetchSequence();
    }, [selectedCampaign]);

    const campaignOptions = campaigns.map(name => ({ value: name, label: name }));

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 gap-4">
                <Loader2 size={40} className="animate-spin text-indigo-500" />
                <p className="font-medium animate-pulse">Loading campaigns data...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="flex-1">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Campaigns</h1>
                    <p className="text-slate-400 text-lg">Browse outreach sequences and message variants.</p>
                </div>

                <div className="w-full md:w-96 flex flex-col items-start md:items-end gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mr-1">Selected Campaign</span>
                    <CustomSelect 
                        value={selectedCampaign}
                        onChange={setSelectedCampaign}
                        options={campaignOptions}
                        placeholder="Select campaign"
                        icon={<Target size={18} />}
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 mb-8">
                <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent to-slate-700" />
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">
                    Message Sequence
                </h2>
                <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-slate-700" />
            </div>

            <div className="space-y-0 min-h-[300px] transition-all duration-500">
                {seqLoading ? (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-500 gap-4">
                        <Loader2 size={32} className="animate-spin text-indigo-500/50" />
                        <p className="text-sm font-medium animate-pulse">Reconstructing sequence...</p>
                    </div>
                ) : sequence.length > 0 ? (
                    sequence.map((step, idx) => (
                        <CampaignStep key={step.id} step={step} index={idx} />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 text-center bg-slate-900/20 border border-dashed border-slate-700/50 rounded-3xl">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-600">
                            <Target size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-300">No sequence detected</h3>
                        <p className="text-sm text-slate-500 max-w-xs mt-2">
                            We couldn't reconstruct the sequence templates from the existing action logs for this campaign.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
