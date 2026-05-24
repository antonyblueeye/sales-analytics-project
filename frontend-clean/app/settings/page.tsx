'use client';
import {
    LayoutDashboard, Users, Mail, GitBranch, RefreshCw,
    Database, Zap, MessageSquare, BarChart3, BookOpen,
    ArrowRight, CheckCircle2, Circle, Star, Phone, TrendingUp,
    UserCheck, Send, Calendar
} from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-white border-b border-slate-700 pb-2">{title}</h2>
        {children}
    </div>
);

const Card = ({ icon: Icon, title, color, children }: {
    icon: React.ElementType; title: string; color: string; children: React.ReactNode
}) => (
    <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={16} className="text-white" />
            </div>
            <h3 className="font-bold text-white text-sm">{title}</h3>
        </div>
        <div className="text-sm text-slate-400 leading-relaxed">{children}</div>
    </div>
);

const Step = ({ n, title, desc }: { n: number; title: string; desc: string }) => (
    <div className="flex gap-4">
        <div className="shrink-0 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-black text-white">{n}</div>
        <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
        </div>
    </div>
);

const StatusBadge = ({ label, color }: { label: string; color: string }) => (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${color}`}>{label}</span>
);

export default function GuidePage() {
    return (
        <div className="max-w-4xl mx-auto py-8 px-6 flex flex-col gap-10">
            {/* Hero */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                        <BookOpen size={20} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Project Guide</h1>
                </div>
                <p className="text-slate-400 text-sm max-w-2xl">
                    Welcome! This is a LinkedIn outreach analytics platform built on top of <strong className="text-slate-200">MeetAlfred</strong>.
                    It tracks your campaigns, leads, and messages — and shows you what's working and what's not.
                </p>
            </div>

            {/* How it works */}
            <Section title="How It Works">
                <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-5 flex flex-col gap-5">
                    <Step n={1} title="Connect your MeetAlfred profile"
                        desc="Each profile has an API key. Profiles are stored in the database and used to scope all data — campaigns, leads, actions." />
                    <Step n={2} title="Sync data"
                        desc="Hit /sync-all (or the individual sync endpoints) to pull campaigns, leads, and actions from MeetAlfred API into PostgreSQL. Data is upserted — safe to run repeatedly." />
                    <Step n={3} title="Explore analytics"
                        desc="The dashboard aggregates your data by day/week/month. You can filter by campaign, profile, and date range across all pages." />
                    <Step n={4} title="Work with leads in CRM"
                        desc="Every lead synced from MeetAlfred appears in the CRM with a dynamically computed status based on their latest activity." />
                </div>
            </Section>

            {/* Pages overview */}
            <Section title="Pages">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Card icon={LayoutDashboard} title="Analytics Overview" color="bg-indigo-600">
                        Main dashboard. Shows daily metrics per profile and per campaign — invites sent, accepted, messages, replies, and funnel statuses.
                        Use the date picker to change the period. The AI Insights button generates an analysis of your current data.
                    </Card>
                    <Card icon={Users} title="Leads Analytics" color="bg-emerald-600">
                        Breakdown of your leads by title, location, and campaign. Shows who is replying and who is getting interested.
                        Filter by campaign to narrow down to specific outreach.
                    </Card>
                    <Card icon={Mail} title="Messages Analytics" color="bg-blue-600">
                        Three tabs: <strong className="text-slate-200">Responses Analytics</strong> (reply rate by template),{' '}
                        <strong className="text-slate-200">Analysis of Messages</strong> (template performance ranking), and{' '}
                        <strong className="text-slate-200">Template Conversions</strong> (which templates led to Interested / MQL / SQL / Partner / Client).
                    </Card>
                    <Card icon={Calendar} title="CRM" color="bg-violet-600">
                        Full lead management. Tabs: All Leads, Replied, Calls, Interested, MQL, SQL, Partner, Client.
                        Click any lead to open a side panel, or use the external link icon to open the full contact page.
                        The global search in the header also finds leads across all pages.
                    </Card>
                </div>
            </Section>

            {/* Lead statuses */}
            <Section title="Lead Status Logic">
                <p className="text-sm text-slate-400">
                    A lead's status is <strong className="text-slate-200">derived automatically</strong> from their activity history — it always reflects the most advanced stage reached:
                </p>
                <div className="flex flex-wrap gap-2 items-center">
                    {[
                        { label: 'New', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
                        { label: '→', color: 'text-slate-600 border-transparent bg-transparent' },
                        { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
                        { label: '→', color: 'text-slate-600 border-transparent bg-transparent' },
                        { label: 'Connected', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                        { label: '→', color: 'text-slate-600 border-transparent bg-transparent' },
                        { label: 'Engaged', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                        { label: '→', color: 'text-slate-600 border-transparent bg-transparent' },
                        { label: 'Interested', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
                        { label: '→', color: 'text-slate-600 border-transparent bg-transparent' },
                        { label: 'MQL', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                        { label: '→', color: 'text-slate-600 border-transparent bg-transparent' },
                        { label: 'SQL', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
                        { label: '→', color: 'text-slate-600 border-transparent bg-transparent' },
                        { label: 'Partner', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
                        { label: '→', color: 'text-slate-600 border-transparent bg-transparent' },
                        { label: 'Client', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
                    ].map((s, i) => (
                        <StatusBadge key={i} label={s.label} color={s.color} />
                    ))}
                </div>
                <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-4 flex flex-col gap-2 text-xs text-slate-400">
                    <p><span className="text-slate-200 font-semibold">New</span> — no invite sent yet</p>
                    <p><span className="text-slate-200 font-semibold">Pending</span> — invite sent, not accepted</p>
                    <p><span className="text-slate-200 font-semibold">Connected</span> — invite accepted, no reply yet</p>
                    <p><span className="text-slate-200 font-semibold">Engaged</span> — lead replied to a message</p>
                    <p><span className="text-slate-200 font-semibold">Interested / MQL / SQL / Partner / Client</span> — manually logged via activity log in CRM. Note: <em>Call</em> is recorded as an activity but does not change the status.</p>
                </div>
            </Section>

            {/* Data model */}
            <Section title="Data Model (simplified)">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {[
                        { name: 'profiles', desc: 'MeetAlfred accounts (name + API key). All data is scoped to a profile.' },
                        { name: 'campaigns', desc: 'Outreach campaigns pulled from MeetAlfred. Linked to a profile.' },
                        { name: 'leads', desc: 'People contacted. Linked to actions, not directly to campaigns.' },
                        { name: 'actions', desc: 'Every event: invited, accepted, message sent, replied, interested, call, mql, sql, partner, client.' },
                        { name: 'message_templates', desc: 'Template texts extracted from campaigns. Grouped by normalized content.' },
                        { name: 'message_templates_map', desc: 'Links each sent action to its template. Used for template analytics.' },
                    ].map(t => (
                        <div key={t.name} className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 flex flex-col gap-1">
                            <code className="text-indigo-400 font-bold">{t.name}</code>
                            <p className="text-slate-500">{t.desc}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Sync endpoints */}
            <Section title="Sync Endpoints (backend)">
                <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-4 flex flex-col gap-2 font-mono text-xs text-slate-400">
                    {[
                        { method: 'POST', path: '/sync-all', desc: 'Sync everything for all profiles' },
                        { method: 'POST', path: '/sync-campaigns?api_key=...', desc: 'Sync campaigns for one profile' },
                        { method: 'POST', path: '/sync-leads?api_key=...', desc: 'Sync leads for one profile' },
                        { method: 'POST', path: '/sync-actions?api_key=...', desc: 'Sync all action types for one profile' },
                    ].map(e => (
                        <div key={e.path} className="flex items-baseline gap-3">
                            <span className={`shrink-0 font-bold ${e.method === 'POST' ? 'text-emerald-400' : 'text-blue-400'}`}>{e.method}</span>
                            <span className="text-slate-300">{e.path}</span>
                            <span className="text-slate-600">— {e.desc}</span>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-slate-500">All sync endpoints are available via <code className="text-slate-400">http://localhost:8000/docs</code> (FastAPI Swagger UI).</p>
            </Section>
        </div>
    );
}