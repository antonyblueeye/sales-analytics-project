'use client';
import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import 'react-day-picker/dist/style.css';
import { 
    Search, 
    Filter, 
    Mail, 
    MessageCircle, 
    MoreHorizontal, 
    MoreVertical,
    X,
    Send,
    ExternalLink,
    Globe,
    Phone,
    Briefcase,
    Handshake,
    UserCheck,
    Calendar as CalendarIcon
} from 'lucide-react';

interface Lead {
    id: number;
    firstName: string;
    lastName: string;
    company: string;
    title: string;
    photo: string;
    status: string;
    location: string;
    campaign: string;
    email: string;
    linkedinUrl: string;
    hubspotUrl: string;
    messages: { role: 'lead' | 'me', text: string, timestamp: string }[];
    activities: { id: number, type: string, date: string }[];
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
}

const DatePickerButton = ({ date, onSelect, label, className, popoverDirection = 'down' }: DatePickerButtonProps) => {
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
                <div className={`absolute ${popoverDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 z-[120] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200`}>
                    <style dangerouslySetInnerHTML={{ __html: `
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
                                setIsOpen(false);
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
};

const mockLeads: Lead[] = [
    { 
        id: 1, 
        firstName: 'Anna', 
        lastName: 'Kowalski', 
        company: 'TechCorp', 
        title: 'CTO', 
        photo: 'https://randomuser.me/api/portraits/women/68.jpg',
        status: 'Connected',
        location: 'Warsaw, Poland',
        campaign: 'Spring Outreach',
        email: 'anna@techcorp.com',
        linkedinUrl: 'https://linkedin.com/in/annakowalski',
        hubspotUrl: 'https://app.hubspot.com/contacts/123/contact/456',
        messages: [
            { role: 'me', text: 'Hi Anna, I saw your post about TechCorp expansion. Would love to connect!', timestamp: '2026-04-05 10:00' },
            { role: 'lead', text: 'Hey! Thanks for reaching out. Yes, we are growing fast.', timestamp: '2026-04-05 14:20' },
            { role: 'me', text: 'That sounds exciting. Are you looking for any data analytics solutions?', timestamp: '2026-04-06 09:15' },
        ],
        activities: [
            { id: 1, type: 'call', date: '2026-04-05' },
            { id: 2, type: 'mql', date: '2026-04-07' },
        ],
        createdAt: '2026-03-15',
        lastActivityAt: '2026-04-07'
    },
    { 
        id: 2, 
        firstName: 'John', 
        lastName: 'Smith', 
        company: 'Innovate Ltd', 
        title: 'Head of Sales', 
        photo: 'https://randomuser.me/api/portraits/men/32.jpg',
        status: 'Interested',
        location: 'London, UK',
        campaign: 'Sales Leaders 2026',
        email: 'john.smith@innovate.co',
        linkedinUrl: 'https://linkedin.com/in/johnsmith',
        hubspotUrl: 'https://app.hubspot.com/contacts/123/contact/789',
        messages: [
            { role: 'me', text: 'Hi John, I noticed your focus on sales automation.', timestamp: '2026-04-08 11:00' },
            { role: 'lead', text: 'Hi, yes. We are currently evaluating some tools.', timestamp: '2026-04-09T16:00:00Z' }
        ],
        activities: [
            { id: 3, type: 'sql', date: '2026-04-09' },
        ],
        createdAt: '2026-04-01',
        lastActivityAt: '2026-04-09'
    },
    { 
        id: 3, 
        firstName: 'Maria', 
        lastName: 'Garcia', 
        company: 'StartupX', 
        title: 'CEO', 
        photo: 'https://randomuser.me/api/portraits/women/45.jpg',
        status: 'Replied',
        location: 'Madrid, Spain',
        campaign: 'CEO Network',
        email: 'm.garcia@startupx.es',
        linkedinUrl: 'https://linkedin.com/in/mariagarcia',
        hubspotUrl: 'https://app.hubspot.com/contacts/123/contact/012',
        messages: [],
        activities: [],
        createdAt: '2026-04-08',
        lastActivityAt: '2026-04-08'
    },
];

const statusColors: Record<string, string> = {
    'Connected': 'bg-green-500/10 text-green-500 border-green-500/20',
    'Interested': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    'Replied': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'New': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function CRMPage() {
    const [search, setSearch] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [activeLead, setActiveLead] = useState<Lead | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerWidth, setDrawerWidth] = useState(500);
    const [isResizing, setIsResizing] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<string>('call');
    const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSaveActivity = () => {
        if (!activeLead) return;
        const newActivity = {
            id: Date.now(),
            type: selectedActivity,
            date: activityDate
        };
        const updatedLead = {
            ...activeLead,
            activities: [newActivity, ...activeLead.activities]
        };
        setActiveLead(updatedLead);
        setSelectedLead(updatedLead);
        alert(`Activity saved: ${selectedActivity.toUpperCase()} on ${activityDate}`);
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
            setTimeout(() => setIsDrawerOpen(true), 10);
        }
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setTimeout(() => {
            setSelectedLead(null);
            setActiveLead(null);
        }, 300);
    };

    // Filter states
    const [filterCampaign, setFilterCampaign] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPosition, setFilterPosition] = useState('');
    const [filterCompany, setFilterCompany] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterFirstName, setFilterFirstName] = useState('');
    const [filterLastName, setFilterLastName] = useState('');
    const [filterCreateDate, setFilterCreateDate] = useState('');
    const [filterActivityDate, setFilterActivityDate] = useState('');

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

    const filteredLeads = mockLeads.filter(lead => {
        const matchesSearch = (lead.firstName + ' ' + lead.lastName).toLowerCase().includes(search.toLowerCase()) ||
                             lead.company.toLowerCase().includes(search.toLowerCase());
        const matchesCampaign = !filterCampaign || lead.campaign.toLowerCase().includes(filterCampaign.toLowerCase());
        const matchesStatus = !filterStatus || lead.status.toLowerCase().includes(filterStatus.toLowerCase());
        const matchesPosition = !filterPosition || lead.title.toLowerCase().includes(filterPosition.toLowerCase());
        const matchesCompany = !filterCompany || lead.company.toLowerCase().includes(filterCompany.toLowerCase());
        const matchesFirstName = !filterFirstName || lead.firstName.toLowerCase().includes(filterFirstName.toLowerCase());
        const matchesLastName = !filterLastName || lead.lastName.toLowerCase().includes(filterLastName.toLowerCase());
        const matchesLocation = !filterLocation || lead.location.toLowerCase().includes(filterLocation.toLowerCase());
        const matchesCreateDate = !filterCreateDate || lead.createdAt === filterCreateDate;
        const matchesActivityDate = !filterActivityDate || lead.lastActivityAt === filterActivityDate;
        
        return matchesSearch && matchesCampaign && matchesStatus && matchesPosition && matchesCompany && matchesFirstName && matchesLastName && matchesLocation && matchesCreateDate && matchesActivityDate;
    });

    const activeFiltersCount = [
        filterCampaign, filterStatus, filterPosition, filterCompany, 
        filterLocation, filterFirstName, filterLastName, 
        filterCreateDate, filterActivityDate
    ].filter(f => f !== '').length;

    const clearAllFilters = () => {
        setFilterCampaign('');
        setFilterStatus('');
        setFilterPosition('');
        setFilterCompany('');
        setFilterLocation('');
        setFilterFirstName('');
        setFilterLastName('');
        setFilterCreateDate('');
        setFilterActivityDate('');
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header Content */}
            <div className="flex flex-col gap-4 mb-6 pt-2 px-1">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-white">CRM</h1>
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
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-400 font-medium ml-1 whitespace-nowrap">Create Date</label>
                            <DatePickerButton 
                                date={filterCreateDate}
                                onSelect={setFilterCreateDate}
                                label="All time"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-400 font-medium ml-1 whitespace-nowrap">Last Activity</label>
                            <DatePickerButton 
                                date={filterActivityDate}
                                onSelect={setFilterActivityDate}
                                label="All time"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-auto bg-slate-800/30 border border-slate-800 rounded-xl">
                <table className="w-full border-collapse text-left">
                    <thead className="sticky top-0 bg-slate-900/80 backdrop-blur-md z-10 border-b border-slate-700/50">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Lead</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider"></th>
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
                                        <img src={lead.photo} className="w-10 h-10 rounded-full object-cover border-2 border-slate-700 group-hover:border-indigo-500/50 transition-colors" alt="" />
                                        <div>
                                            <div className="text-sm font-semibold text-slate-100">{lead.firstName} {lead.lastName}</div>
                                            <div className="text-xs text-slate-400">{lead.company}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-300">{lead.title}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[lead.status] || statusColors['New']}`}>
                                        {lead.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
                                    >
                                        <MoreHorizontal size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
                                    <img src={activeLead?.photo} className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-700" alt="" />
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
                                        <a 
                                            href={activeLead?.linkedinUrl} 
                                            target="_blank" 
                                            className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-indigo-500/50 hover:bg-slate-800 transition-all group"
                                        >
                                            <div className="p-2 bg-blue-600/20 text-blue-500 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <Globe size={18} />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="text-xs text-slate-400">LinkedIn</div>
                                                <div className="text-sm font-medium truncate">View Profile</div>
                                            </div>
                                            <ExternalLink size={14} className="text-slate-500" />
                                        </a>
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
                                        <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-indigo-500/50 hover:bg-slate-800 transition-all group cursor-pointer col-span-2">
                                            <div className="p-2 bg-indigo-600/20 text-indigo-500 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <Mail size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xs text-slate-400">Email Address</div>
                                                <div className="text-sm font-medium">{activeLead?.email}</div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Log Activity */}
                                <section>
                                    <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4">Log Activity</h3>
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-4">
                                        <div className="grid grid-cols-5 gap-2">
                                            {activityTypes.map((type) => (
                                                <button
                                                    key={type.value}
                                                    onClick={() => setSelectedActivity(type.value)}
                                                    title={type.label}
                                                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all ${
                                                        selectedActivity === type.value 
                                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                                                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                                                    }`}
                                                >
                                                    <type.icon size={18} />
                                                    <span className="text-[10px] font-medium uppercase">{type.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <DatePickerButton 
                                                date={activityDate}
                                                onSelect={setActivityDate}
                                                popoverDirection="up"
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
                                </section>

                                {/* Activity History */}
                                <section>
                                    <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4">Activity History</h3>
                                    <div className="space-y-2">
                                        {activeLead?.activities && activeLead.activities.length > 0 ? (
                                            activeLead.activities.map((activity) => {
                                                const typeInfo = activityTypes.find(t => t.value === activity.type) || activityTypes[0];
                                                return (
                                                    <div key={activity.id} className="group relative flex items-center justify-between p-3 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:bg-slate-800/50 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-indigo-400">
                                                                <typeInfo.icon size={14} />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-slate-200 capitalize">{activity.type}</div>
                                                                <div className="text-[10px] text-slate-500">{format(parseISO(activity.date), 'MMM dd, yyyy')}</div>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleDeleteActivity(activity.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/20 hover:text-rose-500 rounded-lg text-slate-500 transition-all"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-6 bg-slate-800/20 border border-dashed border-slate-700 rounded-xl text-slate-500 text-xs">
                                                No activity recorded yet
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Conversation */}
                                <section className="flex flex-col h-[400px]">
                                    <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4">Correspondence</h3>
                                    <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-2xl flex flex-col p-4 overflow-hidden">
                                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                            {activeLead?.messages && activeLead.messages.length > 0 ? (
                                                activeLead.messages.map((msg, i) => (
                                                    <div key={i} className={`flex ${msg.role === 'lead' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                                            msg.role === 'lead' 
                                                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                                                            : 'bg-slate-700/80 text-slate-100 rounded-tl-none'
                                                        }`}>
                                                            {msg.text}
                                                            <div className={`text-[10px] mt-1 ${msg.role === 'lead' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                                {msg.timestamp}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 opacity-50">
                                                    <MessageCircle size={32} />
                                                    <p className="text-sm">No messages yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
