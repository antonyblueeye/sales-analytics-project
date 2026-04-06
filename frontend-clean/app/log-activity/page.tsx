'use client';
import { useState } from 'react';
import { Phone, Users, Briefcase, Handshake, UserCheck } from 'lucide-react';

// Тип для лида
interface Lead {
    id: number;
    name: string;
    company: string;
    title: string;
    photo: string;
}

// Пример данных
const leads: Lead[] = [
    { id: 1, name: 'Anna Kowalski', company: 'TechCorp', title: 'CTO', photo: 'https://randomuser.me/api/portraits/women/68.jpg' },
    { id: 2, name: 'John Smith', company: 'Innovate Ltd', title: 'Head of Sales', photo: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { id: 3, name: 'Maria Garcia', company: 'StartupX', title: 'CEO', photo: 'https://randomuser.me/api/portraits/women/45.jpg' },
];

const activityTypes = [
    { value: 'call', label: 'Call / Meeting', icon: Phone },
    { value: 'mql', label: 'MQL', icon: Users },
    { value: 'sql', label: 'SQL', icon: Briefcase },
    { value: 'partner', label: 'Potential partner', icon: Handshake },
    { value: 'client', label: 'Client', icon: UserCheck },
];

export default function LogActivity() {
    const [search, setSearch] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedType, setSelectedType] = useState('call');
    const [activityDate, setActivityDate] = useState(new Date().toISOString().slice(0, 10));

    const filteredLeads = leads.filter((lead) =>
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.company.toLowerCase().includes(search.toLowerCase())
    );

    const handleLog = (lead: Lead) => {
        setSelectedLead(lead);
        setShowModal(true);
    };

    const saveActivity = () => {
        if (!selectedLead) return;
        alert(`Logged ${selectedType} for ${selectedLead.name} on ${activityDate}`);
        setShowModal(false);
        setSelectedLead(null);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Log Activity</h1>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by name or company..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left">Lead</th>
                            <th className="px-4 py-2 text-left">Company</th>
                            <th className="px-4 py-2 text-left">Title</th>
                            <th className="px-4 py-2 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeads.map((lead) => (
                            <tr key={lead.id} className="border-t">
                                <td className="px-4 py-2 flex items-center gap-2">
                                    <img src={lead.photo} className="w-8 h-8 rounded-full" alt={lead.name} />
                                    {lead.name}
                                </td>
                                <td className="px-4 py-2">{lead.company}</td>
                                <td className="px-4 py-2">{lead.title}</td>
                                <td className="px-4 py-2 text-center">
                                    <button
                                        onClick={() => handleLog(lead)}
                                        className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                                    >
                                        Log activity
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Модальное окно */}
            {showModal && selectedLead && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-96">
                        <h2 className="text-xl font-bold mb-4">Log activity for {selectedLead.name}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Activity type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {activityTypes.map((type) => (
                                        <button
                                            key={type.value}
                                            onClick={() => setSelectedType(type.value)}
                                            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm ${selectedType === type.value ? 'bg-indigo-50 border-indigo-500' : 'border-gray-300'
                                                }`}
                                        >
                                            <type.icon size={16} />
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Date</label>
                                <input
                                    type="date"
                                    value={activityDate}
                                    onChange={(e) => setActivityDate(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">
                                    Cancel
                                </button>
                                <button onClick={saveActivity} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}