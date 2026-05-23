'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import {
    ArrowLeft, ExternalLink, Mail, MapPin, Briefcase, Calendar,
    MessageSquare, Activity, User, Copy, Check, Phone, Handshake,
    UserCheck, Star, Send, Globe, ChevronRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const statusColors: Record<string, string> = {
    'New':        'bg-slate-500/10 text-slate-400 border-slate-500/20',
    'Pending':    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Connected':  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Engaged':    'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Interested': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    'MQL':        'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'SQL':        'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'Partner':    'bg-rose-500/10 text-rose-400 border-rose-500/20',
    'Client':     'bg-green-500/10 text-green-400 border-green-500/20',
};

const activityConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    'invited':      { icon: <Send size={13} />,        color: 'text-slate-400 bg-slate-800',   label: 'Invite Sent' },
    'accepted':     { icon: <UserCheck size={13} />,   color: 'text-emerald-400 bg-emerald-900/40', label: 'Connected' },
    'message sent': { icon: <MessageSquare size={13} />, color: 'text-blue-400 bg-blue-900/40',  label: 'Message Sent' },
    'replied':      { icon: <MessageSquare size={13} />, color: 'text-indigo-400 bg-indigo-900/40', label: 'Replied' },
    'interested':   { icon: <Star size={13} />,        color: 'text-yellow-400 bg-yellow-900/40', label: 'Interested' },
    'call':         { icon: <Phone size={13} />,       color: 'text-cyan-400 bg-cyan-900/40',   label: 'Call' },
    'mql':          { icon: <Activity size={13} />,    color: 'text-amber-400 bg-amber-900/40', label: 'MQL' },
    'sql':          { icon: <Activity size={13} />,    color: 'text-orange-400 bg-orange-900/40', label: 'SQL' },
    'partner':      { icon: <Handshake size={13} />,   color: 'text-rose-400 bg-rose-900/40',   label: 'Partner' },
    'client':       { icon: <UserCheck size={13} />,   color: 'text-green-400 bg-green-900/40', label: 'Client' },
};

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    return (
        <button onClick={copy} className="ml-1 p-0.5 rounded text-slate-600 hover:text-slate-300 transition-colors">
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
        </button>
    );
}

export default function LeadPage() {
    const params = useParams();
    const router = useRouter();
    const leadId = params?.id as string;

    const [lead, setLead] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'timeline' | 'messages'>('timeline');

    useEffect(() => {
        if (!leadId) return;
        Promise.all([
            axios.get(`http://localhost:8000/crm/leads/${leadId}`),
            axios.get(`http://localhost:8000/crm/leads/${leadId}/activities`),
        ]).then(([leadRes, actRes]) => {
            setLead(leadRes.data);
            setActivities(actRes.data.activities || []);
        }).catch(() => {}).finally(() => setLoading(false));
    }, [leadId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400">
                <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mr-3" />
                Loading...
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                <User size={48} className="opacity-20" />
                <p>Lead not found</p>
                <button onClick={() => router.push('/crm')} className="text-indigo-400 hover:underline text-sm">← Back to CRM</button>
            </div>
        );
    }

    const fullName = `${lead.first_name} ${lead.last_name}`.trim();
    const initials = `${lead.first_name?.[0] || ''}${lead.last_name?.[0] || ''}`.toUpperCase();
    const statusCls = statusColors[lead.status] || statusColors['New'];
    const messages = lead.messages || [];

    const funnelSteps = ['New','Pending','Connected','Engaged','Interested','MQL','SQL','Partner','Client'];
    const currentStepIdx = funnelSteps.indexOf(lead.status);

    return (
        <div className="flex flex-col h-full overflow-y-auto bg-slate-900">
            {/* Top bar */}
            <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>
                <ChevronRight size={14} className="text-slate-600" />
                <span className="text-sm text-slate-300 font-medium">{fullName}</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusCls}`}>{lead.status}</span>
            </div>

            <div className="flex gap-6 p-6 max-w-6xl mx-auto w-full">
                {/* LEFT: Profile card */}
                <div className="w-72 shrink-0 flex flex-col gap-4">
                    {/* Avatar + name */}
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col items-center text-center gap-3">
                        {lead.photo_url ? (
                            <img src={lead.photo_url} alt={fullName} className="w-20 h-20 rounded-full object-cover ring-2 ring-slate-700" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-slate-700">
                                {initials}
                            </div>
                        )}
                        <div>
                            <h2 className="text-lg font-bold text-white">{fullName}</h2>
                            {lead.title && <p className="text-xs text-slate-400 mt-0.5">{lead.title}</p>}
                            {lead.company_name && <p className="text-xs text-slate-500 mt-0.5">{lead.company_name}</p>}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusCls}`}>{lead.status}</span>
                    </div>

                    {/* Contact info */}
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-2.5">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Info</h3>
                        {lead.email && (
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                                <Mail size={13} className="text-slate-500 shrink-0" />
                                <span className="truncate">{lead.email}</span>
                                <CopyButton text={lead.email} />
                            </div>
                        )}
                        {lead.location && (
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                                <MapPin size={13} className="text-slate-500 shrink-0" />
                                <span>{lead.location}</span>
                            </div>
                        )}
                        {lead.company_name && (
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                                <Briefcase size={13} className="text-slate-500 shrink-0" />
                                <span>{lead.company_name}</span>
                            </div>
                        )}
                        {lead.created_at && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Calendar size={13} className="shrink-0" />
                                <span>Since {format(parseISO(lead.created_at), 'MMM d, yyyy')}</span>
                            </div>
                        )}
                        {lead.linkedin_url && (
                            <a
                                href={lead.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-1"
                            >
                                <Globe size={13} />
                                LinkedIn Profile
                                <ExternalLink size={11} />
                            </a>
                        )}
                    </div>

                    {/* Campaigns & Profiles */}
                    {(lead.campaign_names?.length > 0 || lead.profile_names?.length > 0) && (
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3">
                            {lead.campaign_names?.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Campaigns</h3>
                                    <div className="flex flex-col gap-1">
                                        {lead.campaign_names.map((c: string) => (
                                            <span key={c} className="text-xs text-slate-300 bg-slate-700/50 rounded-lg px-2.5 py-1 truncate">{c}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {lead.profile_names?.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Profiles</h3>
                                    <div className="flex flex-wrap gap-1">
                                        {lead.profile_names.map((p: string) => (
                                            <span key={p} className="text-xs text-slate-400 bg-slate-700/30 border border-slate-700 rounded-full px-2 py-0.5">{p}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Funnel progress */}
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Funnel Stage</h3>
                        <div className="flex flex-col gap-1.5">
                            {funnelSteps.map((step, i) => {
                                const isPast = i < currentStepIdx;
                                const isCurrent = i === currentStepIdx;
                                return (
                                    <div key={step} className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1 ${
                                        isCurrent ? 'bg-indigo-500/20 text-indigo-300 font-bold' :
                                        isPast ? 'text-slate-400' : 'text-slate-600'
                                    }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                            isCurrent ? 'bg-indigo-400' : isPast ? 'bg-slate-500' : 'bg-slate-700'
                                        }`} />
                                        {step}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Timeline + Messages */}
                <div className="flex-1 flex flex-col gap-4 min-w-0">
                    {/* Tab switcher */}
                    <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl w-fit border border-slate-700/50">
                        <button
                            onClick={() => setActiveSection('timeline')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSection === 'timeline' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Activity Timeline
                        </button>
                        <button
                            onClick={() => setActiveSection('messages')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSection === 'messages' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Messages {messages.length > 0 && <span className="ml-1 opacity-60">({messages.length})</span>}
                        </button>
                    </div>

                    {activeSection === 'timeline' && (
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                            {activities.length === 0 ? (
                                <div className="flex flex-col items-center py-12 text-slate-500 gap-2">
                                    <Activity size={32} className="opacity-20" />
                                    <p className="text-sm">No activity recorded yet</p>
                                </div>
                            ) : (
                                <div className="relative flex flex-col gap-0">
                                    <div className="absolute left-[15px] top-4 bottom-4 w-px bg-slate-700" />
                                    {[...activities].reverse().map((act, i) => {
                                        const cfg = activityConfig[act.type] || { icon: <Activity size={13} />, color: 'text-slate-400 bg-slate-800', label: act.type };
                                        return (
                                            <div key={act.id ?? i} className="flex gap-4 relative py-3">
                                                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${cfg.color}`}>
                                                    {cfg.icon}
                                                </div>
                                                <div className="flex-1 min-w-0 pt-0.5">
                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <span className="text-sm font-semibold text-slate-200">{cfg.label}</span>
                                                        <span className="text-[11px] text-slate-500">
                                                            {act.date ? format(parseISO(act.date), 'MMM d, yyyy · HH:mm') : ''}
                                                        </span>
                                                    </div>
                                                    {act.campaign && (
                                                        <p className="text-xs text-slate-500 mt-0.5 truncate">{act.campaign}</p>
                                                    )}
                                                    {act.message && (
                                                        <div className="mt-2 text-xs text-slate-300 bg-slate-900/60 rounded-lg p-2.5 border border-slate-700/50 leading-relaxed">
                                                            {act.message}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeSection === 'messages' && (
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col gap-3">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center py-12 text-slate-500 gap-2">
                                    <MessageSquare size={32} className="opacity-20" />
                                    <p className="text-sm">No messages recorded</p>
                                </div>
                            ) : (
                                messages.map((msg: any, i: number) => (
                                    <div key={i} className={`flex gap-3 ${msg.role === 'me' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                                            msg.role === 'me' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
                                        }`}>
                                            {msg.role === 'me' ? 'Me' : initials}
                                        </div>
                                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                                            msg.role === 'me'
                                                ? 'bg-indigo-600/20 text-indigo-100 border border-indigo-500/20'
                                                : 'bg-slate-700/50 text-slate-200 border border-slate-700'
                                        }`}>
                                            <p>{msg.text}</p>
                                            <p className="text-[10px] opacity-50 mt-1">{msg.timestamp}{msg.profile_name && msg.profile_name !== 'Unknown' ? ` · ${msg.profile_name}` : ''}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
