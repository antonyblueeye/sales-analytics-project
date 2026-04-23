'use client';
import React, { useState, useMemo } from 'react';
import CustomSelect from '../components/CustomSelect';
import { 
    Loader2,
    Target,
    MessageSquare,
    Send,
    BarChart3,
    Trophy,
    ExternalLink,
    Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface Template {
    id: number;
    title: string;
    text: string;
    date: string;
    sent_count: number;
    reply_count: number;
    is_invite: boolean;
    campaigns: string[];
}

type SortCriterion = 'sent' | 'replies' | 'rate';

const TemplateCard = ({ 
    template, 
    rank, 
    isSelected, 
    onSelect 
}: { 
    template: Template, 
    rank: number, 
    isSelected: boolean, 
    onSelect: () => void 
}) => {
    const replyRate = template.sent_count 
        ? Math.round((template.reply_count / template.sent_count) * 100) 
        : 0;

    return (
        <motion.div 
            layout="position"
            key={template.id}
            transition={{
                type: "spring",
                stiffness: 350,
                damping: 30,
                mass: 1
            }}
            onClick={onSelect}
            className={`group relative border rounded-xl p-3 cursor-pointer transition-colors duration-300 ${
                isSelected 
                ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                : 'bg-slate-800/30 border-slate-700/40 hover:border-slate-500/50 hover:bg-slate-800/50'
            }`}
        >
            <div className={`absolute -top-2 -left-2 w-5 h-5 rounded bg-slate-900 border flex items-center justify-center text-[9px] font-bold transition-colors z-10 ${
                isSelected ? 'border-indigo-500 text-indigo-400' : 'border-slate-700 text-slate-500'
            }`}>
                #{rank}
            </div>

            <div className="flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                            {template.is_invite ? (
                                <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-tighter">Invite</span>
                            ) : (
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Follow-up</span>
                            )}
                            <span className="text-[8px] text-slate-600 font-medium">{template.date}</span>
                        </div>
                        <h3 className={`text-xs font-bold transition-colors line-clamp-1 ${
                            isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                        }`}>
                            {template.title}
                        </h3>
                    </div>
                </div>

                <div className="relative overflow-hidden h-10 opacity-70">
                    <div className="text-slate-400 text-[10px] leading-snug whitespace-pre-wrap line-clamp-3">
                        {template.text}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
                </div>

                <div className="flex flex-wrap gap-1">
                    {template.campaigns.slice(0, 2).map((c, idx) => (
                        <span key={idx} className="px-1 py-0.5 rounded-[4px] bg-slate-800/80 border border-slate-700/50 text-[7px] font-bold text-slate-400 truncate max-w-[80px]">
                            {c}
                        </span>
                    ))}
                    {template.campaigns.length > 2 && (
                        <span className="px-1 py-0.5 rounded-[4px] bg-slate-800/80 border border-slate-700/50 text-[7px] font-bold text-slate-500">
                            +{template.campaigns.length - 2}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between bg-slate-900/40 rounded-lg p-1.5 border border-slate-700/20">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1">
                            <Send size={10} className="text-slate-500" />
                            <span className="text-[10px] font-mono font-bold text-slate-300">{template.sent_count}</span>
                        </div>
                        <div className="flex items-center gap-1 border-l border-slate-700/50 pl-2.5">
                            <MessageSquare size={10} className="text-emerald-500/70" />
                            <span className="text-[10px] font-mono font-bold text-emerald-400/80">{template.reply_count}</span>
                        </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">{replyRate}%</span>
                </div>
            </div>
        </motion.div>
    );
};

const MessagePreview = ({ template }: { template: Template | null }) => {
    if (!template) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center mb-3 text-slate-700">
                    <ExternalLink size={20} />
                </div>
                <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest">Select Template</h3>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            key={template.id}
            className="h-full bg-slate-900/60 border border-indigo-500/20 rounded-xl p-4 backdrop-blur-xl flex flex-col gap-4 sticky top-6 shadow-2xl"
        >
            <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-500/10 text-indigo-400 uppercase tracking-widest border border-indigo-500/20">
                        {template.is_invite ? 'Invitation' : 'Sequential'}
                    </span>
                    <div className="flex items-center gap-1 text-slate-600">
                        <Clock size={10} />
                        <span className="text-[9px] font-bold uppercase">{template.date}</span>
                    </div>
                </div>
                <h2 className="text-sm font-extrabold text-white truncate">{template.title}</h2>
                <div className="flex flex-wrap gap-1.5 mt-1">
                    {template.campaigns.map((c, idx) => (
                        <div key={idx} className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-800/50 border border-slate-700/50">
                            <Target size={8} className="text-indigo-400/70" />
                            <span className="text-[9px] font-bold text-slate-300 tracking-tight">{c}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/30 rounded-lg p-3 border border-slate-800/50">
                <div className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap antialiased">
                    {template.text}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/50">
                <div className="flex flex-col">
                    <span className="text-[8px] text-slate-600 uppercase font-bold tracking-tighter">Sent</span>
                    <span className="text-sm font-mono font-bold text-slate-300">{template.sent_count}</span>
                </div>
                <div className="flex flex-col border-l border-slate-800/50 pl-2">
                    <span className="text-[8px] text-slate-600 uppercase font-bold tracking-tighter">Replies</span>
                    <span className="text-sm font-mono font-bold text-emerald-500">{template.reply_count}</span>
                </div>
                <div className="flex flex-col border-l border-slate-800/50 pl-2">
                    <span className="text-[8px] text-slate-600 uppercase font-bold tracking-tighter">Rate</span>
                    <span className="text-sm font-mono font-bold text-indigo-400">
                        {template.sent_count ? Math.round((template.reply_count / template.sent_count) * 100) : 0}%
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<string[]>([]);
    const [isGlobal, setIsGlobal] = useState(true);
    const [selectedCampaign, setSelectedCampaign] = useState<string>('');
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [sortBy, setSortBy] = useState<SortCriterion>('sent');

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
        const fetchTemplates = async () => {
            if (!isGlobal && !selectedCampaign) return;
            setDataLoading(true);
            try {
                const url = isGlobal 
                    ? 'http://localhost:8000/analytics/campaign-sequence?campaign_name=ALL_CAMPAIGNS'
                    : `http://localhost:8000/analytics/campaign-sequence?campaign_name=${encodeURIComponent(selectedCampaign)}`;
                const response = await axios.get(url);
                setTemplates(response.data);
                setSelectedTemplate(null);
            } catch (error) {
                console.error('Error fetching templates:', error);
            } finally {
                setDataLoading(false);
            }
        };
        fetchTemplates();
    }, [selectedCampaign, isGlobal]);

    const sortedTemplates = useMemo(() => {
        return [...templates].sort((a, b) => {
            if (sortBy === 'sent') return b.sent_count - a.sent_count;
            if (sortBy === 'replies') return b.reply_count - a.reply_count;
            if (sortBy === 'rate') {
                const rateA = a.sent_count ? (a.reply_count / a.sent_count) : 0;
                const rateB = b.sent_count ? (b.reply_count / b.sent_count) : 0;
                return rateB - rateA;
            }
            return 0;
        });
    }, [templates, sortBy]);

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
        <div className="max-w-[1600px] mx-auto py-6 px-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 w-full">
                <div className="flex-1">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">
                        {isGlobal ? 'Global Analytics' : 'Campaign Analytics'}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {isGlobal 
                            ? 'Top performing messages across all your campaigns.' 
                            : 'Performance breakdown for a specific campaign group.'}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="flex p-1 bg-slate-900/80 rounded-xl border border-slate-800 shadow-inner w-80">
                        <button 
                            onClick={() => setIsGlobal(true)}
                            className={`flex-1 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                                isGlobal 
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            All Campaigns
                        </button>
                        <button 
                            onClick={() => setIsGlobal(false)}
                            className={`flex-1 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                                !isGlobal 
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            Custom
                        </button>
                    </div>
                    
                    <div className={`w-80 transition-all duration-500 ${isGlobal ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        <CustomSelect 
                            value={selectedCampaign}
                            onChange={setSelectedCampaign}
                            options={campaignOptions}
                            placeholder="Select campaign"
                            icon={<Target size={16} />}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 items-start">
                <div className="col-span-12 lg:col-span-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-1 bg-indigo-500 rounded-full" />
                            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Ranking Results
                            </h2>
                        </div>

                        <div className="flex items-center bg-slate-900/50 p-1 rounded-lg border border-slate-700/30">
                            <button 
                                onClick={() => setSortBy('sent')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[9px] font-bold transition-all ${sortBy === 'sent' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                SENT
                            </button>
                            <button 
                                onClick={() => setSortBy('replies')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[9px] font-bold transition-all ${sortBy === 'replies' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                REPLIES
                            </button>
                            <button 
                                onClick={() => setSortBy('rate')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[9px] font-bold transition-all ${sortBy === 'rate' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                RATE
                            </button>
                        </div>
                    </div>

                    <div className="min-h-[500px]">
                        {dataLoading ? (
                            <div className="flex flex-col items-center justify-center p-20 text-slate-500 gap-4">
                                <Loader2 size={32} className="animate-spin text-indigo-500/50" />
                                <p className="text-sm font-medium animate-pulse">Analyzing metrics...</p>
                            </div>
                        ) : sortedTemplates.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                {sortedTemplates.map((tpl, idx) => (
                                    <TemplateCard 
                                        key={tpl.id} 
                                        template={tpl} 
                                        rank={idx + 1} 
                                        isSelected={selectedTemplate?.id === tpl.id}
                                        onSelect={() => setSelectedTemplate(tpl)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-20 text-center bg-slate-900/10 border border-dashed border-slate-800 rounded-xl">
                                <Target size={24} className="text-slate-700 mb-2" />
                                <h3 className="text-xs font-bold text-slate-500">No data found</h3>
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 h-[calc(100vh-350px)] min-h-[400px] sticky top-6">
                    <MessagePreview template={selectedTemplate} />
                </div>
            </div>
        </div>
    );
}
