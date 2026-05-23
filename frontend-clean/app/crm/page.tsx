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
    Send,
    UserPlus,
    MessageSquare,
    UserCircle,
    Clock,
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

import { createPortal } from 'react-dom';

const DatePickerButton = ({ date, onSelect, label, className, popoverDirection = 'down', popoverAlignment = 'right' }: DatePickerButtonProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const [rect, setRect] = useState<DOMRect | null>(null);

    const handleOpen = () => {
        if (ref.current) {
            setRect(ref.current.getBoundingClientRect());
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                const target = event.target as Element;
                if (!target.closest('.date-picker-portal-content')) {
                    setIsOpen(false);
                }
            }
        };
        
        const handleScroll = (e: Event) => {
            const target = e.target as Element;
            if (target && target.closest && target.closest('.date-picker-portal-content')) return;
            setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    let popupTop = 0;
    let popupLeft = 0;
    if (rect) {
        popupTop = rect.bottom + 8;
        popupLeft = rect.left;
        if (popupTop + 380 > window.innerHeight) {
            popupTop = rect.top - 380 - 8;
        }
        if (popupTop < 10) popupTop = 10;
        
        if (popupLeft + 320 > window.innerWidth) {
            popupLeft = window.innerWidth - 320 - 16;
        }
        if (popupLeft < 10) popupLeft = 10;
    }

    return (
        <div className={`relative ${className}`} ref={ref}>
            <div className="relative group">
                <button
                    onClick={handleOpen}
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

            {isOpen && rect && createPortal(
                <div
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        top: popupTop,
                        left: popupLeft,
                        zIndex: 999999,
                    }}
                    className={`date-picker-portal-content bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 w-auto min-w-[300px]`}
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
                        
                        /* Dropdowns for Year and Month */
                        .rdp-caption_dropdowns { display: flex; gap: 6px; align-items: center; justify-content: center; }
                        .rdp-dropdown, select.rdp-dropdown, .rdp-caption_dropdowns select { 
                            background: #1e293b; color: #f8fafc; 
                            border: 1px solid #334155; border-radius: 6px; 
                            padding: 2px 6px; font-size: 13px; font-weight: 600;
                            cursor: pointer; outline: none;
                        }
                        .rdp-dropdown:hover, .rdp-caption_dropdowns select:hover { border-color: #475569; background: #334155; }
                        .rdp-dropdown option, .rdp-caption_dropdowns select option { background: #1e293b; color: #f8fafc; }
                        
                        /* Fix v9 dropdown labels */
                        .rdp-dropdown_month, .rdp-dropdown_year { display: flex; align-items: center; gap: 4px; }
                        
                        /* Hidden elements for screen readers should not break layout */
                        .rdp-vhidden { border: 0; clip: rect(0 0 0 0); height: 1px; margin: -1px; overflow: hidden; padding: 0; position: absolute; width: 1px; }
                    `}} />
                    <DayPicker
                        mode="single"
                        selected={date ? parseISO(date) : undefined}
                        onSelect={(d) => {
                            if (d) {
                                onSelect(format(d, 'yyyy-MM-dd'));
                                setIsOpen(false);
                            }
                        }}
                        showOutsideDays
                        fixedWeeks
                        captionLayout="dropdown"
                        startMonth={new Date(2020, 0)}
                        endMonth={new Date(new Date().getFullYear() + 2, 11)}
                    />
                    <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                        >
                            Done
                        </button>
                    </div>
                </div>,
                document.body
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
    const [rect, setRect] = useState<DOMRect | null>(null);

    const handleOpen = () => {
        if (ref.current) {
            setRect(ref.current.getBoundingClientRect());
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                const target = event.target as Element;
                if (!target.closest('.date-picker-portal-content')) {
                    setIsOpen(false);
                }
            }
        };

        const handleScroll = (e: Event) => {
            const target = e.target as Element;
            if (target && target.closest && target.closest('.date-picker-portal-content')) return;
            setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    let popupTop = 0;
    let popupLeft = 0;
    if (rect) {
        popupTop = rect.bottom + 8;
        popupLeft = rect.left;
        if (popupTop + 380 > window.innerHeight) {
            popupTop = rect.top - 380 - 8;
        }
        if (popupTop < 10) popupTop = 10;
        
        if (popupLeft + 320 > window.innerWidth) {
            popupLeft = window.innerWidth - 320 - 16;
        }
        if (popupLeft < 10) popupLeft = 10;
    }

    const displayText = () => {
        if (!range?.from) return label || 'Select range';
        if (!range.to) return format(range.from, 'MMM dd, yyyy');
        return `${format(range.from, 'MMM dd')} - ${format(range.to, 'MMM dd, yyyy')}`;
    };

    return (
        <div className={`relative ${className}`} ref={ref}>
            <div className="relative group">
                <button
                    onClick={handleOpen}
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

            {isOpen && rect && createPortal(
                <div
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        top: popupTop,
                        left: popupLeft,
                        zIndex: 999999,
                    }}
                    className={`date-picker-portal-content bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 w-auto min-w-[300px]`}
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
                        
                        /* Dropdowns for Year and Month */
                        .rdp-caption_dropdowns { display: flex; gap: 6px; align-items: center; justify-content: center; }
                        .rdp-dropdown, select.rdp-dropdown, .rdp-caption_dropdowns select { 
                            background: #1e293b; color: #f8fafc; 
                            border: 1px solid #334155; border-radius: 6px; 
                            padding: 2px 6px; font-size: 13px; font-weight: 600;
                            cursor: pointer; outline: none;
                        }
                        .rdp-dropdown:hover, .rdp-caption_dropdowns select:hover { border-color: #475569; background: #334155; }
                        .rdp-dropdown option, .rdp-caption_dropdowns select option { background: #1e293b; color: #f8fafc; }
                        
                        /* Fix v9 dropdown labels */
                        .rdp-dropdown_month, .rdp-dropdown_year { display: flex; align-items: center; gap: 4px; }
                        
                        /* Hidden elements for screen readers should not break layout */
                        .rdp-vhidden { border: 0; clip: rect(0 0 0 0); height: 1px; margin: -1px; overflow: hidden; padding: 0; position: absolute; width: 1px; }
                    `}} />
                    <DayPicker
                        mode="range"
                        selected={range}
                        onSelect={onSelect}
                        showOutsideDays
                        fixedWeeks
                        captionLayout="dropdown"
                        startMonth={new Date(2020, 0)}
                        endMonth={new Date(new Date().getFullYear() + 2, 11)}
                    />
                    <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                        >
                            Apply
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

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
        <div className="group relative flex gap-3 pl-1 py-2.5 pr-10 rounded-xl hover:bg-slate-800/40 transition-all">
            {/* Timeline dot */}
            <div className="relative flex flex-col items-center shrink-0" style={{ width: '44px' }}>
                <div className={`w-4 h-4 rounded-full border-2 border-slate-900 shadow-md mt-1 shrink-0 ${cfg.dot} ring-2 ring-slate-900`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Top row: badge + date + delete */}
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold border capitalize ${cfg.color}`}>
                            {cfg.label}
                        </span>
                        {activity.isLocal && (
                            <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md">LOGGED</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {activity.date && (
                            <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                                {format(parseISO(activity.date), 'MMM d, yyyy HH:mm')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Absolutely positioned delete button for local activities */}
                {activity.isLocal && (
                    <button
                        onClick={() => onDelete(activity.id)}
                        className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/20 hover:text-rose-500 rounded-lg text-slate-400 transition-all z-10"
                        title="Delete entry"
                    >
                        <X size={14} />
                    </button>
                )}

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
    const [activeTab, setActiveTab] = useState<'all' | 'replied' | 'call' | 'interested' | 'mql' | 'sql' | 'partner' | 'client'>('all');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'alert' } | null>(null);

    // Add Lead modal
    const [showAddLeadModal, setShowAddLeadModal] = useState(false);
    const [isCreatingLead, setIsCreatingLead] = useState(false);
    const [newLead, setNewLead] = useState({
        first_name: '',
        last_name: '',
        email: '',
        linkedin_url: '',
        company: '',
        title: '',
        location: '',
        campaign_name: '',
        profile_name: '',
    });
    const [isAddCampaignOpen, setIsAddCampaignOpen] = useState(false);
    const [isAddProfileOpen, setIsAddProfileOpen] = useState(false);
    const addCampaignRef = useRef<HTMLDivElement>(null);
    const addProfileRef = useRef<HTMLDivElement>(null);


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
    const [activityMessage, setActivityMessage] = useState<string>('');
    const [activityTime, setActivityTime] = useState<string>(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    const [isActivityProfileDropdownOpen, setIsActivityProfileDropdownOpen] = useState(false);
    const activityProfileDropdownRef = useRef<HTMLDivElement>(null);

    const [isLogProfileOpen, setIsLogProfileOpen] = useState(false);
    const logProfileRef = useRef<HTMLDivElement>(null);
    const [isLogCampaignOpen, setIsLogCampaignOpen] = useState(false);
    const logCampaignRef = useRef<HTMLDivElement>(null);
    const [isLogActivityTypeOpen, setIsLogActivityTypeOpen] = useState(false);
    const logActivityTypeRef = useRef<HTMLDivElement>(null);
    const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
    const statusFilterRef = useRef<HTMLDivElement>(null);

    const [allProfiles, setAllProfiles] = useState<string[]>([]);
    const [allCampaigns, setAllCampaigns] = useState<string[]>([]);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [pRes, cRes] = await Promise.all([
                    axios.get('http://localhost:8000/profiles'),
                    axios.get('http://localhost:8000/analytics/campaigns-list')
                ]);
                setAllProfiles(pRes.data.map((p: any) => p.name));
                setAllCampaigns(cRes.data);
            } catch (e) {
                console.error('Failed to fetch metadata', e);
            }
        };
        fetchMetadata();
    }, []);

    const fetchLeads = async (page: number, currentFilters: any = {}) => {
        setIsLoading(true);
        try {
            const endpoint = activeTab === 'replied'
                ? 'http://localhost:8000/crm/replied-leads'
                : 'http://localhost:8000/crm/leads';

            // Build query params
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            });

            // For status-based tabs, inject status filter
            const tabStatusMap: Record<string, string> = {
                call: 'call',
                interested: 'Interested',
                mql: 'MQL',
                sql: 'SQL',
                partner: 'Partner',
                client: 'Client',
            };
            if (tabStatusMap[activeTab] && !currentFilters.status) {
                params.set('status', tabStatusMap[activeTab]);
            }

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
            if (currentFilters.campaign) params.append('campaign', currentFilters.campaign);
            if (currentFilters.status) params.append('status', currentFilters.status);

            const res = await axios.get(`${endpoint}?${params.toString()}`);
            const mappedLeads = res.data.leads.map((l: any, idx: number) => ({
                id: l.id || `${page}-${idx}-${l.email}`,
                firstName: l.first_name,
                lastName: l.last_name,
                company: l.company_name,
                title: l.title,
                photo: l.photo_url || `https://ui-avatars.com/api/?name=${l.first_name}+${l.last_name}&background=6366f1&color=fff`,
                status: l.status || 'New',
                location: l.location,
                campaign: Array.isArray(l.campaign_names) ? l.campaign_names.join(', ') : 'N/A',
                campaignNames: Array.isArray(l.campaign_names) ? l.campaign_names : [],
                profileNames: Array.isArray(l.profile_names) ? l.profile_names : [],
                email: l.email,
                linkedinUrl: l.linkedin_url,
                hubspotUrl: '',
                messages: l.messages || [],
                activities: [],
                createdAt: l.created_at || '2026-04-15',
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
            position: filterPosition,
            createDateRange: filterCreateDate,
            activityDateRange: filterActivityDate,
            campaign: filterCampaign,
            status: filterStatus
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
                activityDateRange: filterActivityDate,
                campaign: filterCampaign,
                status: filterStatus
            });
        }, 500); // 500ms debounce

        return () => clearTimeout(handler);
    }, [search, filterFirstName, filterLastName, filterCompany, filterLocation, filterPosition, filterCreateDate, filterActivityDate, filterCampaign, filterStatus]);

    // Handle pagination specifically
    useEffect(() => {
        fetchLeads(currentPage, {
            search,
            firstName: filterFirstName,
            lastName: filterLastName,
            company: filterCompany,
            location: filterLocation,
            position: filterPosition,
            createDateRange: filterCreateDate,
            activityDateRange: filterActivityDate,
            campaign: filterCampaign,
            status: filterStatus
        });
    }, [currentPage]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            if (activityProfileDropdownRef.current && !activityProfileDropdownRef.current.contains(target)) {
                setIsActivityProfileDropdownOpen(false);
            }
            if (logProfileRef.current && !logProfileRef.current.contains(target)) {
                setIsLogProfileOpen(false);
            }
            if (logCampaignRef.current && !logCampaignRef.current.contains(target)) {
                setIsLogCampaignOpen(false);
            }
            if (logActivityTypeRef.current && !logActivityTypeRef.current.contains(target)) {
                setIsLogActivityTypeOpen(false);
            }
            if (statusFilterRef.current && !statusFilterRef.current.contains(target)) {
                setIsStatusFilterOpen(false);
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
                isLocal: a.isLocal
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

    const handleSaveActivity = async () => {
        if (!activeLead) return;
        if (!selectedCampaign) {
            alert('Please select a campaign first');
            return;
        }

        if (!selectedActivityProfile) {
            alert('Please select a profile first');
            return;
        }

        if ((selectedActivity === 'messaged' || selectedActivity === 'replied') && !activityMessage.trim()) {
            alert('Please enter a message for this activity type');
            return;
        }

        const combinedDateTime = `${activityDate}T${activityTime}:00`;

        try {
            await axios.post(`http://localhost:8000/crm/leads/${activeLead.id}/activities`, {
                type: selectedActivity,
                message: activityMessage,
                date: new Date(combinedDateTime).toISOString(),
                campaign_name: selectedCampaign,
                profile_name: selectedActivityProfile
            });

            // Re-fetch activities from the server to get real IDs and synced data
            await loadActivities(activeLead);
            
            setActivityMessage('');
            showToast(`${selectedActivity.toUpperCase()} on ${activityDate}`);
        } catch (error) {
            console.error('Failed to save activity', error);
            alert('Failed to save activity');
        }
    };

    const handleCreateLead = async () => {
        if (!newLead.first_name.trim() || !newLead.last_name.trim()) {
            showToast('First name and Last name are required', 'alert');
            return;
        }
        // Если выбрано одно из двух (campaign/profile), требуем оба, чтобы корректно связать
        if ((newLead.campaign_name && !newLead.profile_name) || (!newLead.campaign_name && newLead.profile_name)) {
            showToast('Select both Campaign and Profile, or leave both empty', 'alert');
            return;
        }

        setIsCreatingLead(true);
        try {
            const payload = {
                first_name: newLead.first_name.trim(),
                last_name: newLead.last_name.trim(),
                email: newLead.email.trim() || null,
                linkedin_url: newLead.linkedin_url.trim() || null,
                company: newLead.company.trim() || null,
                title: newLead.title.trim() || null,
                location: newLead.location.trim() || null,
                campaign_name: newLead.campaign_name || null,
                profile_name: newLead.profile_name || null,
            };
            await axios.post('http://localhost:8000/crm/leads', payload);
            showToast(`Lead "${payload.first_name} ${payload.last_name}" added`);
            setShowAddLeadModal(false);
            setNewLead({
                first_name: '', last_name: '', email: '', linkedin_url: '',
                company: '', title: '', location: '',
                campaign_name: '', profile_name: '',
            });
            // Перезагрузим список с текущими фильтрами
            fetchLeads(1, {
                search, firstName: filterFirstName, lastName: filterLastName,
                company: filterCompany, location: filterLocation, position: filterPosition,
                createDateRange: filterCreateDate, activityDateRange: filterActivityDate,
                campaign: filterCampaign, status: filterStatus,
            });
            setCurrentPage(1);
        } catch (err: any) {
            const detail = err?.response?.data?.detail || 'Failed to create lead';
            showToast(detail, 'alert');
        } finally {
            setIsCreatingLead(false);
        }
    };

    const handleDeleteActivity = async (activityId: number) => {
        if (!activeLead) return;
        
        try {
            await axios.delete(`http://localhost:8000/crm/activities/${activityId}`);
            
            const updatedLead = {
                ...activeLead,
                activities: activeLead.activities.filter(a => a.id !== activityId)
            };
            setActiveLead(updatedLead);
            setSelectedLead(updatedLead);
            showToast('Activity deleted');
        } catch (error) {
            console.error('Failed to delete activity', error);
            alert('Failed to delete activity');
        }
    };

    const activityTypes = [
        { value: 'invited', label: 'Invited', icon: UserPlus },
        { value: 'accepted', label: 'Accepted', icon: UserCheck },
        { value: 'replied', label: 'Replied', icon: MessageSquare },
        { value: 'messaged', label: 'Message Sent', icon: Send },
        { value: 'interested', label: 'Interested', icon: Star },
        { value: 'call', label: 'Call', icon: Phone },
        { value: 'mql', label: 'MQL', icon: Mail },
        { value: 'sql', label: 'SQL', icon: Briefcase },
        { value: 'partner', label: 'Partner', icon: Handshake },
        { value: 'client', label: 'Client', icon: UserCircle },
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
                        <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl w-fit border border-slate-700/50 mt-1 flex-wrap">
                            {([
                                { key: 'all',        label: 'All Leads' },
                                { key: 'replied',    label: 'Replied' },
                                { key: 'call',       label: 'Calls' },
                                { key: 'interested', label: 'Interested' },
                                { key: 'mql',        label: 'MQL' },
                                { key: 'sql',        label: 'SQL' },
                                { key: 'partner',    label: 'Partner' },
                                { key: 'client',     label: 'Client' },
                            ] as const).map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        activeTab === key
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowAddLeadModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg shadow-indigo-900/40 transition-all"
                        >
                            <UserPlus size={18} />
                            Add Lead
                        </button>
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

                <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${showFilters ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                    <div className="overflow-visible min-h-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
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
                            <div className="flex flex-col gap-1" ref={statusFilterRef}>
                                <label className="text-xs text-slate-400 font-medium ml-1">Status</label>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                                        className={`w-full flex items-center justify-between bg-slate-900 border rounded-md px-3 py-1.5 text-xs transition-all outline-none ${isStatusFilterOpen ? 'border-indigo-500' : 'border-slate-700 hover:border-slate-500'}`}
                                    >
                                        <span className="text-slate-200 truncate">
                                            {[
                                                { value: '', label: 'All Statuses' },
                                                { value: 'New', label: 'New' },
                                                { value: 'Pending', label: 'Pending' },
                                                { value: 'Connected', label: 'Connected' },
                                                { value: 'Engaged', label: 'Engaged' },
                                                { value: 'Interested', label: 'Interested' },
                                                { value: 'MQL', label: 'MQL' },
                                                { value: 'SQL', label: 'SQL' },
                                                { value: 'Partner', label: 'Partner' },
                                                { value: 'Client', label: 'Client' }
                                            ].find(o => o.value === filterStatus)?.label || 'All Statuses'}
                                        </span>
                                        <ChevronDown size={14} className={`text-slate-500 shrink-0 transition-transform duration-200 ${isStatusFilterOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isStatusFilterOpen && (
                                        <div className="absolute left-0 mt-1 w-full bg-slate-900 border border-slate-700 shadow-xl z-[110] py-1 rounded-lg overflow-y-auto max-h-[200px] animate-in fade-in slide-in-from-top-1 duration-200 custom-scrollbar">
                                            {[
                                                { value: '', label: 'All Statuses' },
                                                { value: 'New', label: 'New' },
                                                { value: 'Pending', label: 'Pending' },
                                                { value: 'Connected', label: 'Connected' },
                                                { value: 'Engaged', label: 'Engaged' },
                                                { value: 'Interested', label: 'Interested' },
                                                { value: 'MQL', label: 'MQL' },
                                                { value: 'SQL', label: 'SQL' },
                                                { value: 'Partner', label: 'Partner' },
                                                { value: 'Client', label: 'Client' }
                                            ].map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setFilterStatus(option.value);
                                                        setIsStatusFilterOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-1.5 text-xs transition-all ${filterStatus === option.value ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
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
                    </div>
                </div>
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* Profile Selector Dropdown */}
                                                <div className="flex flex-col gap-2 w-full" ref={logProfileRef}>
                                                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1 tracking-wider">Profile</label>
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setIsLogProfileOpen(!isLogProfileOpen)}
                                                            className={`w-full flex items-center gap-2.5 bg-slate-900 border rounded-xl px-3 py-2 transition-all outline-none ${isLogProfileOpen ? 'border-indigo-500 shadow-[0_0_15px_-5px_rgba(99,102,241,0.4)]' : 'border-slate-700 hover:border-slate-500'}`}
                                                        >
                                                            <div className="relative shrink-0">
                                                                <img
                                                                    src={`/${selectedActivityProfile}.jpg`}
                                                                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedActivityProfile || 'P')}&background=4f46e5&color=fff&bold=true`; }}
                                                                    className="w-5 h-5 rounded-full object-cover border border-slate-700"
                                                                    alt=""
                                                                />
                                                            </div>
                                                            <span className={`text-[11px] font-bold truncate flex-1 text-left ${selectedActivityProfile ? 'text-slate-200' : 'text-slate-600'}`}>
                                                                {selectedActivityProfile || 'Select Profile'}
                                                            </span>
                                                            <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${isLogProfileOpen ? 'rotate-180' : ''}`} />
                                                        </button>

                                                        {isLogProfileOpen && (
                                                            <div className="absolute left-0 mt-2 w-full bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl z-[110] py-2 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                                    {(allProfiles.length > 0 ? allProfiles : activeLead?.profileNames?.filter(Boolean) || []).map(p => (
                                                                        <button
                                                                            key={p}
                                                                            onClick={() => {
                                                                                setSelectedActivityProfile(p);
                                                                                setIsLogProfileOpen(false);
                                                                            }}
                                                                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-all text-left ${p === selectedActivityProfile ? 'bg-indigo-500/10' : ''}`}
                                                                        >
                                                                            <img
                                                                                src={`/${p}.jpg`}
                                                                                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p)}&background=4f46e5&color=fff&bold=true`; }}
                                                                                className={`w-5 h-5 rounded-full object-cover border ${p === selectedActivityProfile ? 'border-indigo-500' : 'border-slate-700'}`}
                                                                                alt=""
                                                                            />
                                                                            <span className={`text-[11px] font-bold ${p === selectedActivityProfile ? 'text-white' : 'text-slate-400'}`}>{p}</span>
                                                                            {p === selectedActivityProfile && <div className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Campaign Selector Dropdown */}
                                                <div className="flex flex-col gap-2 w-full" ref={logCampaignRef}>
                                                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1 tracking-wider">Campaign</label>
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setIsLogCampaignOpen(!isLogCampaignOpen)}
                                                            className={`w-full flex items-center gap-2.5 bg-slate-900 border rounded-xl px-3 py-2 transition-all outline-none ${isLogCampaignOpen ? 'border-indigo-500 shadow-[0_0_15px_-5px_rgba(99,102,241,0.4)]' : 'border-slate-700 hover:border-slate-500'}`}
                                                        >
                                                            <div className="w-5 h-5 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                                                                <Globe size={12} />
                                                            </div>
                                                            <span className={`text-[11px] font-bold truncate flex-1 text-left ${selectedCampaign ? 'text-slate-200' : 'text-slate-600'}`}>
                                                                {selectedCampaign || 'Select Campaign'}
                                                            </span>
                                                            <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${isLogCampaignOpen ? 'rotate-180' : ''}`} />
                                                        </button>

                                                        {isLogCampaignOpen && (
                                                            <div className="absolute left-0 mt-2 w-full bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl z-[110] py-2 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                                    {(allCampaigns.length > 0 ? allCampaigns : activeLead?.campaignNames?.filter(Boolean) || []).map(c => (
                                                                        <button
                                                                            key={c}
                                                                            onClick={() => {
                                                                                setSelectedCampaign(c);
                                                                                setIsLogCampaignOpen(false);
                                                                            }}
                                                                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-all text-left ${c === selectedCampaign ? 'bg-indigo-500/10' : ''}`}
                                                                        >
                                                                            <div className={`p-1.5 rounded-lg ${c === selectedCampaign ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                                                                                <Globe size={11} />
                                                                            </div>
                                                                            <span className={`text-[11px] font-bold truncate ${c === selectedCampaign ? 'text-white' : 'text-slate-400'}`}>{c}</span>
                                                                            {c === selectedCampaign && <div className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Activity Type Dropdown */}
                                                <div className="flex flex-col gap-2 w-full" ref={logActivityTypeRef}>
                                                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1 tracking-wider">Activity</label>
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setIsLogActivityTypeOpen(!isLogActivityTypeOpen)}
                                                            className={`w-full flex items-center gap-2.5 bg-slate-900 border rounded-xl px-3 py-2 transition-all outline-none ${isLogActivityTypeOpen ? 'border-indigo-500 shadow-[0_0_15px_-5px_rgba(99,102,241,0.4)]' : 'border-slate-700 hover:border-slate-500'}`}
                                                        >
                                                            {(() => {
                                                                const activeType = activityTypes.find(t => t.value === selectedActivity);
                                                                return (
                                                                    <>
                                                                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${activeType ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                                                                            {activeType ? <activeType.icon size={12} /> : <Star size={12} />}
                                                                        </div>
                                                                        <span className="text-[11px] font-bold flex-1 text-left text-slate-200">
                                                                            {activeType?.label || 'Select Type'}
                                                                        </span>
                                                                    </>
                                                                );
                                                            })()}
                                                            <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${isLogActivityTypeOpen ? 'rotate-180' : ''}`} />
                                                        </button>

                                                        {isLogActivityTypeOpen && (
                                                            <div className="absolute left-0 mt-2 w-full bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl z-[110] py-1 rounded-2xl overflow-y-auto max-h-[240px] animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar">
                                                                {activityTypes.map(type => (
                                                                    <button
                                                                        key={type.value}
                                                                        onClick={() => {
                                                                            setSelectedActivity(type.value);
                                                                            setIsLogActivityTypeOpen(false);
                                                                        }}
                                                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-all text-left ${type.value === selectedActivity ? 'bg-indigo-500/10' : ''}`}
                                                                    >
                                                                        <div className={`p-1.5 rounded-lg ${type.value === selectedActivity ? 'bg-indigo-500/30 text-indigo-300' : 'bg-slate-800 text-slate-500'}`}>
                                                                            <type.icon size={12} />
                                                                        </div>
                                                                        <span className={`text-[11px] font-bold ${type.value === selectedActivity ? 'text-white' : 'text-slate-400'}`}>{type.label}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Optional/Required Message Textarea for specific types */}
                                            {(selectedActivity === 'invited' || selectedActivity === 'messaged' || selectedActivity === 'replied') && (
                                                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1 tracking-wider">
                                                        Message {selectedActivity === 'invited' ? '(Optional)' : '(Required)'}
                                                    </label>
                                                    <textarea
                                                        value={activityMessage}
                                                        onChange={(e) => setActivityMessage(e.target.value)}
                                                        placeholder={`Enter ${selectedActivity} message here...`}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-[11px] text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none min-h-[80px] custom-scrollbar"
                                                    />
                                                </div>
                                            )}

                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <DatePickerButton
                                                        date={activityDate}
                                                        onSelect={setActivityDate}
                                                        popoverDirection="up"
                                                        popoverAlignment="left"
                                                        className="flex-1"
                                                    />
                                                    <div className="relative group w-[85px] shrink-0">
                                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                                            <Clock size={14} />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={activityTime}
                                                            onChange={(e) => setActivityTime(e.target.value)}
                                                            placeholder="HH:MM"
                                                            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-bold rounded-xl pl-9 pr-2 h-[30px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleSaveActivity}
                                                    className="px-6 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
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
                                        // Unique profiles from activities (including local)
                                        const dbProfiles = Array.from(
                                            new Set(activeLead.activities.filter(a => a.profile).map(a => a.profile))
                                        ).filter(Boolean) as string[];
                                        const multiProfile = dbProfiles.length > 1;

                                        const filtered = activityProfileFilter === 'all'
                                            ? activeLead.activities
                                            : activeLead.activities.filter(a => a.profile === activityProfileFilter);

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

            {/* Add Lead Modal */}
            {showAddLeadModal && (
                <div
                    className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => !isCreatingLead && setShowAddLeadModal(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/70 px-6 py-4 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                                    <UserPlus size={20} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Add New Lead</h2>
                                    <p className="text-xs text-slate-400">Manually create a lead in the database</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAddLeadModal(false)}
                                disabled={isCreatingLead}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium text-slate-300">First Name <span className="text-rose-400">*</span></label>
                                    <input
                                        type="text"
                                        value={newLead.first_name}
                                        onChange={(e) => setNewLead({ ...newLead, first_name: e.target.value })}
                                        placeholder="John"
                                        className="bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium text-slate-300">Last Name <span className="text-rose-400">*</span></label>
                                    <input
                                        type="text"
                                        value={newLead.last_name}
                                        onChange={(e) => setNewLead({ ...newLead, last_name: e.target.value })}
                                        placeholder="Doe"
                                        className="bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium text-slate-300">Email</label>
                                    <input
                                        type="email"
                                        value={newLead.email}
                                        onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                                        placeholder="john@company.com"
                                        className="bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium text-slate-300">LinkedIn URL</label>
                                    <input
                                        type="url"
                                        value={newLead.linkedin_url}
                                        onChange={(e) => setNewLead({ ...newLead, linkedin_url: e.target.value })}
                                        placeholder="https://linkedin.com/in/..."
                                        className="bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium text-slate-300">Company</label>
                                    <input
                                        type="text"
                                        value={newLead.company}
                                        onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                                        placeholder="Acme Inc."
                                        className="bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium text-slate-300">Title</label>
                                    <input
                                        type="text"
                                        value={newLead.title}
                                        onChange={(e) => setNewLead({ ...newLead, title: e.target.value })}
                                        placeholder="CEO"
                                        className="bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                    <label className="text-xs font-medium text-slate-300">Location</label>
                                    <input
                                        type="text"
                                        value={newLead.location}
                                        onChange={(e) => setNewLead({ ...newLead, location: e.target.value })}
                                        placeholder="San Francisco, CA"
                                        className="bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Campaign + Profile (optional pair) */}
                            <div className="rounded-xl border border-slate-700/70 bg-slate-800/30 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-slate-200">Link to Campaign & Profile</h3>
                                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Optional</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-medium text-slate-300">Campaign</label>
                                        <select
                                            value={newLead.campaign_name}
                                            onChange={(e) => setNewLead({ ...newLead, campaign_name: e.target.value })}
                                            className="bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="">— None —</option>
                                            {allCampaigns.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-medium text-slate-300">Profile</label>
                                        <select
                                            value={newLead.profile_name}
                                            onChange={(e) => setNewLead({ ...newLead, profile_name: e.target.value })}
                                            className="bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="">— None —</option>
                                            {allProfiles.map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-2">
                                    If you select both, the lead will be attached to that campaign as a manual <span className="text-indigo-300">invited</span> action.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/70 px-6 py-4 flex items-center justify-end gap-2">
                            <button
                                onClick={() => setShowAddLeadModal(false)}
                                disabled={isCreatingLead}
                                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateLead}
                                disabled={isCreatingLead}
                                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg shadow-indigo-900/40 transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isCreatingLead ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        Create Lead
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
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

