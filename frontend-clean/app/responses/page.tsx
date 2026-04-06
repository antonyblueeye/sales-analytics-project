'use client';
import { useState } from 'react';
import ListOfResponses from './ListOfResponses';
import ResponseAnalytics from './ResponseAnalytics';

export default function ResponsesPage() {
    const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');

    return (
        <div className="p-6">
            <div className="flex gap-4 border-b mb-6">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`px-4 py-2 font-medium ${activeTab === 'list' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
                >
                    List of Responses
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-4 py-2 font-medium ${activeTab === 'analytics' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
                >
                    Response Analytics
                </button>
            </div>
            {activeTab === 'list' ? <ListOfResponses /> : <ResponseAnalytics />}
        </div>
    );
}