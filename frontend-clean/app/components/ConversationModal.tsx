// app/components/ConversationModal.tsx
'use client';
import { X } from 'lucide-react';

interface Message {
    id: number;
    direction: 'outbound' | 'inbound';
    text: string;
    createdAt: string;
    profile?: string | null;
}

interface ConversationModalProps {
    lead: {
        id: number;
        name: string;
        photo: string;
        linkedin: string;
        company: string;
        title: string;
        location: string;
        messages: Message[];
    };
    onClose: () => void;
}

export default function ConversationModal({ lead, onClose }: ConversationModalProps) {
    // Группируем сообщения по дням
    const messagesByDay: Record<string, Message[]> = {};
    lead.messages.forEach((msg) => {
        const day = new Date(msg.createdAt).toLocaleDateString();
        if (!messagesByDay[day]) messagesByDay[day] = [];
        messagesByDay[day].push(msg);
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Заголовок */}
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="shrink-0">
                            <img src={lead.photo} alt={lead.name} className="w-10 h-10 rounded-full object-cover aspect-square shrink-0" />
                        </div>
                        <div>
                            <h2 className="font-semibold">{lead.name}</h2>
                            <p className="text-sm text-slate-400">{lead.title} at {lead.company}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Переписка (скролл) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {Object.entries(messagesByDay).map(([day, msgs]) => (
                        <div key={day}>
                            <div className="text-center text-sm text-slate-500 my-4">{day}</div>
                            {msgs.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'} mb-4`}
                                >
                                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.direction === 'outbound' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            {msg.direction === 'outbound' ? (
                                                <span className="text-xs text-indigo-200">You ({msg.profile || 'profile'})</span>
                                            ) : (
                                                <span className="text-xs text-slate-400">{lead.name}</span>
                                            )}
                                        </div>
                                        <p className="text-sm">{msg.text}</p>
                                        <div className="text-right text-xs text-slate-400 mt-1">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}