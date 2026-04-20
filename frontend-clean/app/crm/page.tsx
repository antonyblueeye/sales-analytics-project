'use client';
import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import 'react-day-picker/dist/style.css';
import {
    Search,
    Filter,
    MoreHorizontal,
    MoreVertical,
    X,
    ExternalLink,
    Globe,
    Phone,
    Briefcase,
    Handshake,
    UserCheck,
    Check,
    ChevronDown,
    ChevronUp,
    Calendar as CalendarIcon,
    Star,
    Mail,
    Send
} from 'lucide-react';
import axios from 'axios';

interface LeadActivity {
    id: number;
    type: string;
    message: string;
    date: string | null;
    campaign: string;
    profile: string;
    // frontend-only logged activities:
    isLocal?: boolean;
}

interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    company: string;
    title: string;
    photo: string;
    status: string;
    location: string;
    campaign: string;
    campaignNames: string[];
    profileNames: string[];
    email: string;
    linkedinUrl: string;
    hubspotUrl: string;
    messages: { role: 'lead' | 'me', text: string, timestamp: string, profile_name?: string }[];
    activities: LeadActivity[];
    createdAt: string;
    lastActivityAt: string;
}

// Reusable DatePicker Component for consistent styling
interface DatePickerButtonProps {
    date: string;
    onSelect: (date: string) => void;
    label?: string;
    className?: string;
    popoverDirection?: 'up' | 'down';
    popoverAlignment?: 'left' | 'right';
}

const DatePickerButton = ({ date, onSelect, label, className, popoverDirection = 'down', popoverAlignment = 'right' }: DatePickerButtonProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className={`relative ${className}`} ref={ref}>
            <div className="relative group">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 hover:border-slate-500 transition-all focus:ring-1 focus:ring-indigo-500 outline-none h-[30px] pr-8"
                >
                    <CalendarIcon size={14} className="text-indigo-400 shrink-0" />
                    <span className="truncate">{date ? format(parseISO(date), 'MMM dd, yyyy') : (label || 'Select date')}</span>
                </button>
                {date && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect('');
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded-md text-slate-500 hover:text-slate-200 transition-all"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {isOpen && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`absolute ${popoverDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} ${popoverAlignment === 'right' ? 'right-0' : 'left-0'} z-[120] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200`}
                >
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        .rdp-root {
                            --rdp-accent-color: #6366f1;
                            --rdp-accent-background-color: rgba(99, 102, 241, 0.15);
                            --rdp-background-color: #334155;
                            margin: 0;
                            font-size: 13px;
                        }
                        .rdp-day { border-radius: 8px; }
                        .rdp-day_selected { background-color: var(--rdp-accent-color) !important; color: white !important; }
                        .rdp-button_nav { border: 1px solid #334155; border-radius: 6px; color: #cbd5e1; height: 28px; width: 28px; }
                        .rdp-button_nav:hover { background-color: #334155; color: white; }
                        .rdp-caption_label { font-weight: 600; font-size: 14px; color: #f8fafc; }
                        .rdp-weekday { color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 600; }
                    `}} />
                    <DayPicker
                        mode="single"
                        selected={date ? parseISO(date) : undefined}
                        onSelect={(d) => {
                            if (d) {
                                onSelect(format(d, 'yyyy-MM-dd'));
                            }
                        }}
                    />
                    <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

interface DateRangePickerButtonProps {
    range: DateRange | undefined;
    onSelect: (range: DateRange | undefined) => void;
    label?: string;
    className?: string;
    popoverDirection?: 'up' | 'down';
    popoverAlignment?: 'left' | 'right';
}

const DateRangePickerButton = ({ range, onSelect, label, className, popoverDirection = 'down', popoverAlignment = 'right' }: DateRangePickerButtonProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const displayText = () => {
        if (!range?.from) return label || 'Select range';
        if (!range.to) return format(range.from, 'MMM dd, yyyy');
        return `${format(range.from, 'MMM dd')} - ${format(range.to, 'MMM dd, yyyy')}`;
    };

    return (
        <div className={`relative ${className}`} ref={ref}>
            <div className="relative group">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 hover:border-slate-500 transition-all focus:ring-1 focus:ring-indigo-500 outline-none h-[30px] pr-8"
                >
                    <CalendarIcon size={14} className="text-indigo-400 shrink-0" />
                    <span className="truncate">{displayText()}</span>
                </button>
                {range?.from && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(undefined);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded-md text-slate-500 hover:text-slate-200 transition-all"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {isOpen && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`absolute ${popoverDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} ${popoverAlignment === 'right' ? 'right-0' : 'left-0'} z-[120] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200`}
                >
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        .rdp-root {
                            --rdp-accent-color: #6366f1;
                            --rdp-accent-background-color: rgba(99, 102, 241, 0.15);
                            --rdp-background-color: #334155;
                            margin: 0;
                            font-size: 13px;
                        }
                        .rdp-day { border-radius: 8px; }
                        .rdp-day_selected { background-color: var(--rdp-accent-color) !important; color: white !important; }
                        .rdp-button_nav { border: 1px solid #334155; border-radius: 6px; color: #cbd5e1; height: 28px; width: 28px; }
                        .rdp-button_nav:hover { background-color: #334155; color: white; }
                        .rdp-caption_label { font-weight: 600; font-size: 14px; color: #f8fafc; }
                        .rdp-weekday { color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 600; }
                    `}} />
                    <DayPicker
                        mode="range"
                        selected={range}
                        onSelect={onSelect}
                    />
                    <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const statusColors: Record<string, string> = {
    'Connected': 'bg-green-500/10 text-green-500 border-green-500/20',
    'Interested': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    'Replied': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'New': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

// ─── Activity Timeline Item ──────────────────────────────────────────────────
interface ActivityItemProps {
    activity: LeadActivity;
    cfg: { color: string; dot: string; label: string };
    isReply: boolean;
    hasMsg: boolean;
    leadPhoto: string;
    leadName: string;
    showProfile: boolean;
    onDelete: (id: number) => void;
}

function ActivityItem({ activity, cfg, isReply, hasMsg, leadPhoto, leadName, showProfile, onDelete }: ActivityItemProps) {
    const [expanded, setExpanded] = useState(false);
    const MSG_LIMIT = 160;
    const isLong = (activity.message?.length || 0) > MSG_LIMIT;

    const senderPhoto = isReply
        ? leadPhoto
        : `/${activity.profile}.jpg`;
    const senderName = isReply ? leadName : (activity.profile || '');
    const senderFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=${isReply ? '6366f1' : '4f46e5'}&color=fff&bold=true`;

    return (
        <div className="group relative flex gap-3 pl-1 py-2.5 pr-2 rounded-xl hover:bg-slate-800/40 transition-all">
            {/* Timeline dot */}
            <div className="relative flex flex-col items-center shrink-0" style={{ width: '44px' }}>
                <div className={`w-4 h-4 rounded-full border-2 border-slate-900 shadow-md mt-1 shrink-0 ${cfg.dot} ring-2 ring-slate-900`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Top row: badge + date + delete */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold border capitalize ${cfg.color}`}>
                            {cfg.label}
                        </span>
                        {activity.isLocal && (
                            <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md">LOCAL</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {activity.date && (
                            <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                                {format(parseISO(activity.date), 'MMM d, yyyy')}
                            </span>
                        )}
                        {activity.isLocal && (
                            <button
                                onClick={() => onDelete(activity.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/20 hover:text-rose-500 rounded-md text-slate-600 transition-all"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Sender row */}
                {(isReply || (showProfile && !isReply)) && (senderName || activity.campaign) && (
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {senderName && (
                            <div className="flex items-center gap-1.5">
                                <img
                                    src={senderPhoto}
                                    onError={(e) => { (e.target as HTMLImageElement).src = senderFallback; }}
                                    className={`w-4 h-4 rounded-full object-cover border ${isReply ? 'border-indigo-500/50' : 'border-slate-600'}`}
                                    alt={senderName}
                                />
                                <span className={`text-[10px] font-medium ${isReply ? 'text-indigo-300' : 'text-slate-400'}`}>{senderName}</span>
                            </div>
                        )}
                        {senderName && activity.campaign && (
                            <span className="text-slate-700 text-[10px]">·</span>
                        )}
                        {activity.campaign && (
                            <span className="text-[10px] text-indigo-400/70 font-medium truncate max-w-[180px]" title={activity.campaign}>
                                {activity.campaign}
                            </span>
                        )}
                    </div>
                )}

                {/* Campaign only row (if sender hidden) */}
                {(!isReply && !showProfile) && activity.campaign && (
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] text-indigo-400/70 font-medium truncate max-w-[180px]" title={activity.campaign}>
                            {activity.campaign}
                        </span>
                    </div>
                )}

                {/* Message preview with expand */}
                {hasMsg && (
                    <div className="mt-2">
                        <div className={`text-[11px] text-slate-400 leading-relaxed bg-slate-800/50 rounded-xl px-3 py-2 border ${isReply ? 'border-indigo-500/20' : 'border-slate-700/40'}`}>
                            <p className="whitespace-pre-wrap break-words">
                                {expanded || !isLong
                                    ? activity.message
                                    : activity.message!.slice(0, MSG_LIMIT) + '…'}
                            </p>
                            {isLong && (
                                <button
                                    onClick={() => setExpanded(e => !e)}
                                    className={`mt-1.5 flex items-center gap-1 text-[10px] font-bold transition-colors ${isReply ? 'text-indigo-400 hover:text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {expanded ? <><ChevronUp size={11} /> Show less</> : <><ChevronDown size={11} /> Show more</>}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
// ────────────────────────────────────────────────────────────────────────────

export default function CRMPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [totalLeads, setTotalLeads] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // ... rest of the original states ...
    const [search, setSearch] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [activeLead, setActiveLead] = useState<Lead | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerWidth, setDrawerWidth] = useState(500);
    const [isResizing, setIsResizing] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<string>('interested');
    const [isLoadingActivities, setIsLoadingActivities] = useState(false);
    const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeTab, setActiveTab] = useState<'all' | 'replied'>('all');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'alert' } | null>(null);


    // Filter states
    const [filterCampaign, setFilterCampaign] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPosition, setFilterPosition] = useState('');
    const [filterCompany, setFilterCompany] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterFirstName, setFilterFirstName] = useState('');
    const [filterLastName, setFilterLastName] = useState('');
    const [filterCreateDate, setFilterCreateDate] = useState<DateRange | undefined>(undefined);
    const [filterActivityDate, setFilterActivityDate] = useState<DateRange | undefined>(undefined);
    const [messageProfileFilter, setMessageProfileFilter] = useState<string>('');
    const [activityProfileFilter, setActivityProfileFilter] = useState<string>('all');
    const [selectedCampaign, setSelectedCampaign] = useState<string>('');
    const [selectedActivityProfile, setSelectedActivityProfile] = useState<string>('');
    const [isActivityProfileDropdownOpen, setIsActivityProfileDropdownOpen] = useState(false);
    const activityProfileDropdownRef = useRef<HTMLDivElement>(null);

    const fetchLeads = async (page: number, currentFilters: any = {}) => {
        setIsLoading(true);
        try {
            const endpoint = activeTab === 'all'
                ? 'http://localhost:8000/crm/leads'
                : 'http://localhost:8000/crm/replied-leads';

            // Build query params
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            });

            if (currentFilters.search) params.append('search', currentFilters.search);
            if (currentFilters.firstName) params.append('first_name', currentFilters.firstName);
            if (currentFilters.lastName) params.append('last_name', currentFilters.lastName);
            if (currentFilters.company) params.append('company', currentFilters.company);
            if (currentFilters.location) params.append('location', currentFilters.location);
            if (currentFilters.position) params.append('title', currentFilters.position);

            if (currentFilters.createDateRange?.from) params.append('create_date_from', currentFilters.createDateRange.from.toISOString());
            if (currentFilters.createDateRange?.to) params.append('create_date_to', currentFilters.createDateRange.to.toISOString());
            if (currentFilters.activityDateRange?.from) params.append('activity_date_from', currentFilters.activityDateRange.from.toISOString());
            if (currentFilters.activityDateRange?.to) params.append('activity_date_to', currentFilters.activityDateRange.to.toISOString());

            const res = await axios.get(`${endpoint}?${params.toString()}`);
            const mappedLeads = res.data.leads.map((l: any, idx: number) => ({
                id: l.id || `${page}-${idx}-${l.email}`,
                firstName: l.first_name,
                lastName: l.last_name,
                company: l.company_name,
                title: l.title,
                photo: l.photo_url || `https://ui-avatars.com/api/?name=${l.first_name}+${l.last_name}&background=6366f1&color=fff`,
                status: activeTab === 'replied' ? 'Replied' : l.status,
                location: l.location,
                campaign: Array.isArray(l.campaign_names) ? l.campaign_names.join(', ') : 'N/A',
                campaignNames: Array.isArray(l.campaign_names) ? l.campaign_names : [],
                profileNames: Array.isArray(l.profile_names) ? l.profile_names : [],
                email: l.email,
                linkedinUrl: l.linkedin_url,
                hubspotUrl: '',
                messages: l.messages || [],
                activities: [],
                createdAt: l.last_reply_at || '2026-04-15',
                lastActivityAt: l.last_reply_at || '2026-04-15'
            }));
            setLeads(mappedLeads);
            setTotalLeads(res.data.total);
        } catch (error) {
            console.error('Error fetching leads:', error);
            setLeads([]);
            setTotalLeads(0);
        } finally {
            setIsLoading(false);
        }
    };

    // Effect for handling tab changes
    useEffect(() => {
        setCurrentPage(1);
        fetchLeads(1, {
            search,
            firstName: filterFirstName,
            lastName: filterLastName,
            company: filterCompany,
            location: filterLocation,
            position: filterPosition
        });
    }, [activeTab]);

    // Debounce effect for filters
    useEffect(() => {
        const handler = setTimeout(() => {
            setCurrentPage(1); // Reset to first page on filter change
            fetchLeads(1, {
                search,
                firstName: filterFirstName,
                lastName: filterLastName,
                company: filterCompany,
                location: filterLocation,
                position: filterPosition,
                createDateRange: filterCreateDate,
                activityDateRange: filterActivityDate
            });
        }, 500); // 500ms debounce

        return () => clearTimeout(handler);
    }, [search, filterFirstName, filterLastName, filterCompany, filterLocation, filterPosition]);

    // Handle pagination specifically
    useEffect(() => {
        fetchLeads(currentPage, {
            search,
            firstName: filterFirstName,
            lastName: filterLastName,
            company: filterCompany,
            location: filterLocation,
            position: filterPosition
        });
    }, [currentPage]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (activityProfileDropdownRef.current && !activityProfileDropdownRef.current.contains(event.target as Node)) {
                setIsActivityProfileDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const showToast = (message: string, type: 'success' | 'alert' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const loadActivities = async (lead: Lead) => {
        if (!lead.id) return;
        setIsLoadingActivities(true);
        try {
            const res = await axios.get(`http://localhost:8000/crm/leads/${lead.id}/activities`);
            const fetched: LeadActivity[] = (res.data.activities || []).map((a: any) => ({
                id: a.id,
                type: a.type,
                message: a.message,
                date: a.date,
                campaign: a.campaign,
                profile: a.profile,
            }));
            
            // Auto-select first profile for the timeline filter
            const firstProfile = fetched.find(a => !a.isLocal && a.profile)?.profile || 'all';
            setActivityProfileFilter(firstProfile);
            
            setActiveLead(prev => prev ? { ...prev, activities: fetched } : prev);
        } catch (e) {
            console.error('Failed to load activities', e);
        } finally {
            setIsLoadingActivities(false);
        }
    };

    const handleSaveActivity = () => {
        if (!activeLead) return;
        if (!selectedCampaign) {
            alert('Please select a campaign first');
            return;
        }

        if (!selectedActivityProfile) {
            alert('Please select a profile first');
            return;
        }

        const newActivity: LeadActivity = {
            id: Date.now(),
            type: selectedActivity,
            message: '',
            date: activityDate,
            campaign: selectedCampaign,
            profile: selectedActivityProfile,
            isLocal: true
        };
        const updatedLead = {
            ...activeLead,
            activities: [newActivity, ...activeLead.activities]
        };
        setActiveLead(updatedLead);
        setSelectedLead(updatedLead);
        showToast(`${selectedActivity.toUpperCase()} on ${activityDate}`);
    };

    const handleDeleteActivity = (activityId: number) => {
        if (!activeLead) return;
        const updatedLead = {
            ...activeLead,
            activities: activeLead.activities.filter(a => a.id !== activityId)
        };
        setActiveLead(updatedLead);
        setSelectedLead(updatedLead);
    };

    const activityTypes = [
        { value: 'interested', label: 'Interested', icon: Star },
        { value: 'call', label: 'Call', icon: Phone },
        { value: 'mql', label: 'MQL', icon: Mail },
        { value: 'sql', label: 'SQL', icon: Briefcase },
        { value: 'partner', label: 'Partner', icon: Handshake },
        { value: 'client', label: 'Client', icon: UserCheck },
    ];

    // Handle lead selection for animation
    const handleLeadClick = (lead: Lead) => {
        if (selectedLead?.id === lead.id) {
            handleCloseDrawer();
        } else {
            setActiveLead(lead);
            setSelectedLead(lead);

            // Set default profile filter to the first profile that has messages
            const profilesWithMessages = Array.from(new Set(lead.messages?.map(m => m.profile_name))).filter(Boolean);
            if (profilesWithMessages.length > 0) {
                setMessageProfileFilter(profilesWithMessages[0]!);
            } else {
                setMessageProfileFilter('');
            }

            // Set default campaign
            const campaigns = lead.campaignNames.filter(Boolean);
            if (campaigns.length > 0) {
                setSelectedCampaign(campaigns[0]);
            } else {
                setSelectedCampaign('');
            }

            const profiles = lead.profileNames.filter(Boolean);
            if (profiles.length > 0) {
                setSelectedActivityProfile(profiles[0]);
            } else {
                setSelectedActivityProfile('');
            }

            setTimeout(() => {
                setIsDrawerOpen(true);
                loadActivities(lead);
            }, 10);
        }
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setTimeout(() => {
            setSelectedLead(null);
            setActiveLead(null);
            setMessageProfileFilter('');
            setSelectedCampaign('');
            setSelectedActivityProfile('');
            setActivityProfileFilter('all');
        }, 300);
    };


    const startResizing = (e: ReactMouseEvent) => {
        setIsResizing(true);
        e.preventDefault();
    };

    const stopResizing = () => {
        setIsResizing(false);
    };

    const resize = (e: MouseEvent) => {
        if (isResizing) {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 300 && newWidth < 800) {
                setDrawerWidth(newWidth);
            }
        }
    };

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing]);

    // filteredLeads now just returns leads from state
    const filteredLeads = leads;

    const activeFiltersCount = [
        filterCampaign, filterStatus, filterPosition, filterCompany,
        filterLocation, filterFirstName, filterLastName,
        filterCreateDate, filterActivityDate
    ].filter(f => f && f !== '').length;

    const clearAllFilters = () => {
        setFilterCampaign('');
        setFilterStatus('');
        setFilterPosition('');
        setFilterCompany('');
        setFilterLocation('');
        setFilterFirstName('');
        setFilterLastName('');
        setFilterCreateDate(undefined);
        setFilterActivityDate(undefined);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header Content */}
            <div className="flex flex-col gap-4 mb-6 pt-2 px-1">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold tracking-tight text-white">CRM</h1>
                        <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl w-fit border border-slate-700/50 mt-1">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                            >
                                All Leads
                            </button>
                            <button
                                onClick={() => setActiveTab('replied')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'replied' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                            >
                                Replied
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search leads..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-sm"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm relative ${showFilters ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                        >
                            <Filter size={18} />
                            Filters
                            {activeFiltersCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-slate-900 shadow-lg">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-rose-400 transition-colors text-sm font-medium"
                            >
                                <X size={16} />
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3 p-4 bg-slate-800/50 border border-slate-700 rounded-xl animate-in fade-in slide-in-from-top-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-400 font-medium ml-1">First Name</label>
                            <input
                                type="text"
                                placeholder="Filter..."
                                className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={filterFirstName}
                                onChange={(e) => setFilterFirstName(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-400 font-medium ml-1">Last Name</label>
                            <input
                                type="text"
                                placeholder="Filter..."
                                className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={filterLastName}
                                onChange={(e) => setFilterLastName(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-400 font-medium ml-1">Campaign</label>
                            <input
                                type="text"
                                placeholder="Filter..."
                                className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={filterCampaign}
                                onChange={(e) => setFilterCampaign(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-400 font-medium ml-1">Status</label>
                            <input
                                type="text"
                                placeholder="Filter..."
                                className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-400 font-medium ml-1">Position</label>
                            <input
                                type="text"
                                placeholder="Filter..."
                                className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={filterPosition}
                                onChange={(e) => setFilterPosition(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-400 font-medium ml-1">Company</label>
                            <input
                                type="text"
                                placeholder="Filter..."
                                className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={filterCompany}
                                onChange={(e) => setFilterCompany(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-400 font-medium ml-1">Location</label>
                            <input
                                type="text"
                                placeholder="Filter..."
                                className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={filterLocation}
                                onChange={(e) => setFilterLocation(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Created At</label>
                            <DateRangePickerButton
                                range={filterCreateDate}
                                onSelect={setFilterCreateDate}
                                label="All time"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Last Activity</label>
                            <DateRangePickerButton
                                range={filterActivityDate}
                                onSelect={setFilterActivityDate}
                                label="All time"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-auto bg-slate-800/30 border border-slate-800 rounded-xl relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-20 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                <table className="w-full border-collapse text-left">
                    <thead className="sticky top-0 bg-slate-900/80 backdrop-blur-md z-10 border-b border-slate-700/50">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Lead</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Company / Title</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {filteredLeads.map((lead) => (
                            <tr
                                key={lead.id}
                                onClick={() => handleLeadClick(lead)}
                                className={`group hover:bg-slate-700/30 cursor-pointer transition-colors ${selectedLead?.id === lead.id ? 'bg-indigo-600/10 border-indigo-500/30' : ''}`}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="shrink-0">
                                            <img src={lead.photo} className="w-10 h-10 rounded-full object-cover aspect-square shrink-0 border-2 border-slate-700 group-hover:border-indigo-500/50 transition-colors" alt="" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-100">{lead.firstName} {lead.lastName}</div>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${statusColors[lead.status]}`}>
                                                {lead.status}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-100 font-medium">{lead.title || lead.company || 'N/A'}</div>
                                    {lead.title && lead.company && <div className="text-xs text-slate-500">{lead.company}</div>}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-300">{lead.location || 'Unknown'}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {lead.linkedinUrl && (
                                            <a href={lead.linkedinUrl} target="_blank" onClick={(e) => e.stopPropagation()} className="p-1.5 hover:bg-slate-700/50 rounded-md transition-colors">
                                                <img src="/linkedin_icon.png" className="w-4 h-4 object-contain" alt="LinkedIn" />
                                            </a>
                                        )}
                                        {lead.email && (
                                            <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()} className="p-1.5 hover:bg-slate-700 rounded-md text-emerald-400">
                                                <Mail size={16} />
                                            </a>
                                        )}
                                        <button className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Simple Pagination */}
                <div className="sticky bottom-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-700/50 p-4 flex items-center justify-between z-10">
                    <div className="text-xs text-slate-400">
                        Showing <span className="text-white font-bold">{(currentPage - 1) * 20 + 1}</span> to <span className="text-white font-bold">{Math.min(currentPage * 20, totalLeads)}</span> of <span className="text-white font-bold">{totalLeads}</span> leads
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            Previous
                        </button>

                        <div className="flex items-center gap-1 mx-2">
                            {(() => {
                                const totalPages = Math.ceil(totalLeads / 20);
                                const pages = [];
                                const delta = 1;

                                for (let i = 1; i <= totalPages; i++) {
                                    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                                        pages.push(i);
                                    } else if (i === currentPage - delta - 1 || i === currentPage + delta + 1) {
                                        pages.push('...');
                                    }
                                }

                                return pages.filter((v, i, a) => v !== '...' || a[i - 1] !== '...').map((p, idx) => (
                                    p === '...' ? (
                                        <span key={`dots-${idx}`} className="text-slate-600 px-1">...</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => setCurrentPage(Number(p))}
                                            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-all active:scale-90 ${currentPage === p
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent hover:border-slate-700'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    )
                                ));
                            })()}
                        </div>

                        <button
                            disabled={currentPage * 20 >= totalLeads}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Resizable Drawer with Transition */}
            {selectedLead && (
                <>
                    {/* Backdrop / Overlay */}
                    <div
                        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[90] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
                        onClick={handleCloseDrawer}
                    />

                    <div
                        className={`fixed top-0 right-0 h-full bg-slate-900 border-l border-slate-700 shadow-2xl z-[100] flex transition-transform duration-300 ease-out`}
                        style={{
                            width: `${drawerWidth}px`,
                            transform: isDrawerOpen ? 'translateX(0)' : 'translateX(100%)'
                        }}
                    >
                        {/* Resize Handle */}
                        <div
                            className="w-1 h-full cursor-ew-resize hover:bg-indigo-500 transition-colors absolute left-0"
                            onMouseDown={startResizing}
                        >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1 bg-slate-800 border border-slate-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical size={12} className="text-slate-500" />
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            {/* Drawer Header */}
                            <div className="p-6 border-b border-slate-800 flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className="shrink-0">
                                        <img src={activeLead?.photo} className="w-20 h-20 rounded-2xl object-cover aspect-square shrink-0 border-2 border-slate-700" alt="" />
                                    </div>
                                    <div className="pt-1">
                                        <h2 className="text-xl font-bold text-slate-100">{activeLead?.firstName} {activeLead?.lastName}</h2>
                                        <p className="text-slate-400 text-sm mt-0.5">{activeLead?.title} @ <span className="text-indigo-400 font-medium">{activeLead?.company}</span></p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${statusColors[activeLead?.status || 'New'] || statusColors['New']}`}>
                                                {activeLead?.status}
                                            </span>
                                            <span className="text-xs text-slate-500">{activeLead?.location}</span>
                                            <span className="text-[10px] text-slate-600 ml-auto bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-800">
                                                Added: {activeLead?.createdAt ? format(parseISO(activeLead.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseDrawer}
                                    className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Drawer Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                {/* Contact Details */}
                                <section>
                                    <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4">Contact Information</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {activeLead?.linkedinUrl && (
                                            <a
                                                href={activeLead?.linkedinUrl}
                                                target="_blank"
                                                className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-[#0077b5]/50 hover:bg-slate-800 transition-all group"
                                            >
                                                <div className="p-2 bg-[#0077b5]/10 rounded-lg group-hover:bg-[#0077b5] transition-colors">
                                                    <img src="/linkedin_icon.png" className="w-[18px] h-[18px] object-contain" alt="LinkedIn" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="text-xs text-slate-400">LinkedIn</div>
                                                    <div className="text-sm font-medium truncate">View Profile</div>
                                                </div>
                                                <ExternalLink size={14} className="text-slate-500" />
                                            </a>
                                        )}
                                        {activeLead?.hubspotUrl && (
                                            <a
                                                href={activeLead?.hubspotUrl}
                                                target="_blank"
                                                className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-orange-500/50 hover:bg-slate-800 transition-all group"
                                            >
                                                <div className="p-2 bg-orange-600/20 text-orange-500 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                                    <div className="w-[18px] h-[18px] flex items-center justify-center font-bold text-[10px]">HS</div>
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="text-xs text-slate-400">HubSpot</div>
                                                    <div className="text-sm font-medium truncate">Open CRM</div>
                                                </div>
                                                <ExternalLink size={14} className="text-slate-500" />
                                            </a>
                                        )}
                                        {activeLead?.email && (
                                            <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-indigo-500/50 hover:bg-slate-800 transition-all group cursor-pointer col-span-2">
                                                <div className="p-2 bg-indigo-600/20 text-indigo-500 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    <Mail size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs text-slate-400">Email Address</div>
                                                    <div className="text-sm font-medium">{activeLead?.email}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Campaigns & Profiles */}
                                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {(activeLead?.campaignNames && activeLead.campaignNames.length > 0) && (
                                        <div className="flex flex-col gap-3">
                                            <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                Campaigns
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {activeLead.campaignNames.map((name, i) => (
                                                    <span key={i} className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-xl text-[11px] font-bold shadow-sm">
                                                        {name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(activeLead?.profileNames && activeLead.profileNames.length > 0) && (
                                        <div className="flex flex-col gap-3">
                                            <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                Source Profiles
                                            </h3>
                                            <div className="flex flex-wrap gap-3">
                                                {activeLead.profileNames.map((name, i) => (
                                                    <div key={i} className="flex items-center gap-2.5 p-1.5 pr-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl group/profile hover:bg-slate-800 transition-all">
                                                        <div className="relative">
                                                            <img
                                                                src={`/${name}.jpg`}
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff&bold=true`;
                                                                }}
                                                                className="w-7 h-7 rounded-full object-cover border border-slate-600 ring-2 ring-transparent group-hover/profile:ring-indigo-500/50 transition-all shadow-md"
                                                                alt={name}
                                                            />
                                                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-sm" />
                                                        </div>
                                                        <span className="text-[11px] text-slate-300 font-bold whitespace-nowrap">{name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>

                                {/* Log Activity */}
                                <section>
                                    <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4">Log Activity</h3>
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-4">
                                        <div className="flex flex-col gap-4">
                                            {/* Profile Selector */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Select Profile</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {activeLead?.profileNames ? activeLead.profileNames.filter(Boolean).map(pName => (
                                                        <button
                                                            key={pName}
                                                            onClick={() => setSelectedActivityProfile(pName)}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${selectedActivityProfile === pName
                                                                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-600/10'
                                                                    : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                                                                }`}
                                                        >
                                                            {pName}
                                                        </button>
                                                    )) : (
                                                        <div className="text-[10px] text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                                                            No associated profiles found
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Campaign Selector */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Select Campaign</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {activeLead?.campaignNames ? activeLead.campaignNames.filter(Boolean).map(cName => (
                                                        <button
                                                            key={cName}
                                                            onClick={() => setSelectedCampaign(cName)}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${selectedCampaign === cName
                                                                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-600/10'
                                                                    : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                                                                }`}
                                                        >
                                                            {cName}
                                                        </button>
                                                    )) : (
                                                        <div className="text-[10px] text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                                                            No associated campaigns found
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                                {activityTypes.map((type) => (
                                                    <button
                                                        key={type.value}
                                                        onClick={() => setSelectedActivity(type.value)}
                                                        title={type.label}
                                                        className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all ${selectedActivity === type.value
                                                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                                                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                                                            }`}
                                                    >
                                                        <type.icon size={18} />
                                                        <span className="text-[8.5px] font-bold uppercase tracking-tighter">{type.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <DatePickerButton
                                                    date={activityDate}
                                                    onSelect={setActivityDate}
                                                    popoverDirection="up"
                                                    popoverAlignment="left"
                                                    className="flex-1"
                                                />
                                                <button
                                                    onClick={handleSaveActivity}
                                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
                                                >
                                                    Save Activity
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Activity History */}
                                <section>
                                    {isLoadingActivities ? (
                                        <div className="flex items-center justify-center py-10 gap-3 text-slate-500 text-xs">
                                            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                            Loading activity history...
                                        </div>
                                    ) : activeLead?.activities && activeLead.activities.length > 0 ? (() => {
                                        // Unique profiles from DB activities (exclude local)
                                        const dbProfiles = Array.from(
                                            new Set(activeLead.activities.filter(a => !a.isLocal && a.profile).map(a => a.profile))
                                        ).filter(Boolean) as string[];
                                        const multiProfile = dbProfiles.length > 1;

                                        const filtered = activityProfileFilter === 'all'
                                            ? activeLead.activities
                                            : activeLead.activities.filter(a => a.isLocal || a.profile === activityProfileFilter);

                                        return (
                                            <div>
                                                {/* Header row */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Activity History</h3>
                                                        <span className="text-[10px] font-bold text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                                                            {filtered.length} events
                                                        </span>
                                                    </div>

                                                    {/* Profile switcher dropdown */}
                                                    {multiProfile ? (
                                                        <div className="relative" ref={activityProfileDropdownRef}>
                                                            <button 
                                                                onClick={() => setIsActivityProfileDropdownOpen(!isActivityProfileDropdownOpen)}
                                                                className={`flex items-center gap-1.5 bg-slate-800/60 border rounded-xl px-2.5 py-1.5 transition-all outline-none ${isActivityProfileDropdownOpen ? 'border-indigo-500 shadow-[0_0_15px_-5px_rgba(99,102,241,0.4)]' : 'border-slate-700/50 hover:border-slate-500'}`}
                                                            >
                                                                <img
                                                                    src={`/${activityProfileFilter}.jpg`}
                                                                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activityProfileFilter)}&background=4f46e5&color=fff&bold=true`; }}
                                                                    className="w-4 h-4 rounded-full object-cover border border-slate-600 shrink-0 pointer-events-none"
                                                                    alt={activityProfileFilter}
                                                                />
                                                                <span className="text-[11px] font-bold text-slate-300 pr-1">{activityProfileFilter}</span>
                                                                <ChevronDown size={11} className={`text-slate-500 transition-transform duration-200 ${isActivityProfileDropdownOpen ? 'rotate-180' : ''}`} />
                                                            </button>

                                                            {isActivityProfileDropdownOpen && (
                                                                <div className="absolute right-0 mt-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                                    <div className="px-3 pb-1 mb-1 border-b border-slate-800/50">
                                                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Select Profile</span>
                                                                    </div>
                                                                    {dbProfiles.map(p => (
                                                                        <button
                                                                            key={p}
                                                                            onClick={() => {
                                                                                setActivityProfileFilter(p);
                                                                                setIsActivityProfileDropdownOpen(false);
                                                                            }}
                                                                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-indigo-500/10 transition-all text-left group ${p === activityProfileFilter ? 'bg-indigo-500/5' : ''}`}
                                                                        >
                                                                            <div className="relative shrink-0">
                                                                                <img
                                                                                    src={`/${p}.jpg`}
                                                                                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p)}&background=4f46e5&color=fff&bold=true`; }}
                                                                                    className={`w-6 h-6 rounded-full object-cover border transition-all ${p === activityProfileFilter ? 'border-indigo-500 scale-110' : 'border-slate-700 group-hover:border-slate-500'}`}
                                                                                    alt={p}
                                                                                />
                                                                                {p === activityProfileFilter && (
                                                                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-slate-900" />
                                                                                )}
                                                                            </div>
                                                                            <span className={`text-[11px] font-bold transition-colors ${p === activityProfileFilter ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{p}</span>
                                                                            {p === activityProfileFilter && (
                                                                                <div className="ml-auto">
                                                                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                                                                                </div>
                                                                            )}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : dbProfiles.length === 1 ? (
                                                        <div className="flex items-center gap-1.5 bg-slate-800/40 border border-slate-700/30 rounded-xl px-2 py-1">
                                                            <img
                                                                src={`/${dbProfiles[0]}.jpg`}
                                                                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(dbProfiles[0])}&background=4f46e5&color=fff&bold=true`; }}
                                                                className="w-4 h-4 rounded-full object-cover border border-slate-600"
                                                                alt={dbProfiles[0]}
                                                            />
                                                            <span className="text-[11px] font-bold text-slate-400">{dbProfiles[0]}</span>
                                                        </div>
                                                    ) : null}
                                                </div>

                                                {/* Timeline */}
                                                <div className="relative">
                                                    <div className="absolute left-[22px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-indigo-500/40 via-slate-700/60 to-transparent rounded-full" />
                                                    <div className="space-y-1">
                                                        {filtered.map((activity, idx) => {
                                                            const typeConfigs: Record<string, { color: string; dot: string; label: string }> = {
                                                                'invited': { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-500', label: 'Invited' },
                                                                'accepted': { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500', label: 'Accepted' },
                                                                'replied': { color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', dot: 'bg-indigo-500', label: 'Replied' },
                                                                'messaged': { color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', dot: 'bg-violet-500', label: 'Messaged' },
                                                                'visited': { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-500', label: 'Visited' },
                                                                'followed': { color: 'text-pink-400 bg-pink-500/10 border-pink-500/20', dot: 'bg-pink-500', label: 'Followed' },
                                                                'interested': { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', dot: 'bg-yellow-400', label: 'Interested' },
                                                                'call': { color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', dot: 'bg-cyan-500', label: 'Call' },
                                                                'mql': { color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-500', label: 'MQL' },
                                                                'sql': { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', dot: 'bg-rose-500', label: 'SQL' },
                                                                'partner': { color: 'text-teal-400 bg-teal-500/10 border-teal-500/20', dot: 'bg-teal-500', label: 'Partner' },
                                                                'client': { color: 'text-green-400 bg-green-500/10 border-green-500/20', dot: 'bg-green-500', label: 'Client' },
                                                            };
                                                            const cfg = typeConfigs[activity.type] || { color: 'text-slate-400 bg-slate-800 border-slate-700', dot: 'bg-slate-500', label: activity.type };
                                                            const isReply = activity.type === 'replied';
                                                            const hasMsg = Boolean(activity.message);

                                                            return (
                                                                <ActivityItem
                                                                    key={activity.id}
                                                                    activity={activity}
                                                                    cfg={cfg}
                                                                    isReply={isReply}
                                                                    hasMsg={hasMsg}
                                                                    leadPhoto={activeLead.photo}
                                                                    leadName={`${activeLead.firstName} ${activeLead.lastName}`}
                                                                    showProfile={false}
                                                                    onDelete={handleDeleteActivity}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })() : (
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Activity History</h3>
                                            </div>
                                            <div className="text-center py-8 bg-slate-800/20 border border-dashed border-slate-700/50 rounded-2xl">
                                                <div className="text-slate-600 text-xs font-medium">No activity recorded yet</div>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Premium Notification Toast */}
            {toast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-toast-in">
                    <div className="relative overflow-hidden bg-slate-900/90 backdrop-blur-2xl border border-indigo-500/40 rounded-3xl p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_20px_rgba(99,102,241,0.2)] flex items-center gap-5 min-w-[380px]">
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400/10 to-transparent -translate-x-full animate-shimmer" />

                        <div className="relative">
                            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/30 shadow-inner group">
                                <Check size={28} strokeWidth={2.5} className="drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-slate-900 flex items-center justify-center animate-bounce">
                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                Success
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-indigo-500/50 to-transparent" />
                            </div>
                            <div className="text-lg font-bold text-slate-100 mt-0.5">Activity Recorded</div>
                            <div className="text-xs text-slate-400 font-medium">{toast.message}</div>
                        </div>

                        <button
                            onClick={() => setToast(null)}
                            className="p-2.5 hover:bg-slate-800/80 rounded-xl text-slate-500 hover:text-white transition-all active:scale-90 hover:rotate-90 duration-300"
                        >
                            <X size={20} />
                        </button>

                        {/* Animated Progress Bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-slate-800">
                            <div className="h-full bg-indigo-500 shadow-[0_0_15px_#6366f1] animate-toast-progress-bar" />
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes toast-in {
                    0% { transform: translate(-50%, 20px) scale(0.9); opacity: 0; }
                    100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
                }
                .animate-toast-in {
                    animation: toast-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes toast-progress-bar {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .animate-toast-progress-bar {
                    animation: toast-progress-bar 4s linear forwards;
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 3s infinite;
                }
            `}</style>
        </div>
    );
}

