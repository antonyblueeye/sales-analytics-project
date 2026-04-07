'use client';
import { useState } from 'react';
import ListOfResponses from './ListOfResponses';
import ResponseAnalytics from './ResponseAnalytics';

export default function ResponsesPage() {
    const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');

    return (
        <div className="p-6">
            <div className="flex gap-2 mb-6 bg-slate-800 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
                >
                    List of Responses
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
                >
                    Response Analytics
                </button>
            </div>
            {activeTab === 'list' ? <ListOfResponses /> : <ResponseAnalytics />}
        </div>
    );
}