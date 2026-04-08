'use client';
import { useState } from 'react';
import { Link2 } from 'lucide-react';
import ConversationModal from '../components/ConversationModal';

// Статические данные (те же, но добавим сообщения для каждого лида)
const mockResponses = [
    {
        id: 1,
        photo: 'https://randomuser.me/api/portraits/women/68.jpg',
        name: 'Anna Kowalski',
        linkedin: 'https://linkedin.com/in/anna',
        company: 'TechCorp',
        location: 'Warsaw, Poland',
        title: 'CTO',
        type: 'interested',
        message: 'Hi, I am very interested...',
        date: '2026-04-05',
        messages: [
            { id: 1, direction: 'outbound', text: 'Hi Anna, we have a solution...', createdAt: '2026-04-05T09:00:00Z', profile: 'Volodymyr P.' },
            { id: 2, direction: 'inbound', text: 'Very interested. Can we schedule a call?', createdAt: '2026-04-05T14:30:00Z', profile: null },
        ],
    },
    {
        id: 2,
        photo: 'https://randomuser.me/api/portraits/men/32.jpg',
        name: 'John Smith',
        linkedin: 'https://linkedin.com/in/john',
        company: 'Innovate Ltd',
        location: 'London, UK',
        title: 'Head of Sales',
        type: 'no need',
        message: 'Not interested at this time.',
        date: '2026-04-04',
        messages: [
            { id: 1, direction: 'outbound', text: 'Hi John, check out our platform.', createdAt: '2026-04-04T10:00:00Z', profile: 'Volodymyr V.' },
            { id: 2, direction: 'inbound', text: 'Not interested.', createdAt: '2026-04-04T11:00:00Z', profile: null },
        ],
    },
];

export default function ListOfResponses() {
    const [search, setSearch] = useState('');
    const [selectedLead, setSelectedLead] = useState<any>(null);

    const filtered = mockResponses.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.company.toLowerCase().includes(search.toLowerCase()) ||
        r.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className="col-span-12 xl:col-span-4 mb-6">
                <input
                    type="text"
                    placeholder="Search by name, company..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-700 bg-slate-800 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
                />
            </div>
            <div className="space-y-4">
                {filtered.map(response => (
                    <div
                        key={response.id}
                        onClick={() => setSelectedLead(response)}
                        className="bg-slate-800 text-slate-100 rounded-xl shadow p-4 flex gap-4 cursor-pointer hover:bg-slate-700 transition"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={response.photo} alt={response.name} className="w-12 h-12 rounded-full object-cover" />
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold flex items-center gap-2">
                                        {response.name}
                                        <a href={response.linkedin} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                                            <Link2 size={16} className="text-blue-600" />
                                        </a>
                                    </h3>
                                    <p className="text-sm text-slate-400">{response.title} at {response.company}</p>
                                    <p className="text-sm text-gray-400">{response.location}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${response.type === 'interested' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                                    {response.type === 'interested' ? 'Interested' : 'No need'}
                                </span>
                            </div>
                            <div className="mt-2 p-3 bg-slate-700 rounded-lg italic text-slate-300">
                                “{response.message}”
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Модальное окно */}
            {selectedLead && (
                <ConversationModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
            )}
        </div>
    );
}