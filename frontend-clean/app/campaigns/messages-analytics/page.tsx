'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, PieChart, TrendingUp } from 'lucide-react';
import ResponseAnalytics from '../ResponseAnalytics';
import CampaignAnalytics from '../CampaignAnalytics';
import TemplateConversions from '../TemplateConversions';

export default function MessagesAnalyticsPage() {
    const [activeTab, setActiveTab] = useState<'responses' | 'messages' | 'conversions'>('responses');

    const tabs = [
        { 
            id: 'responses', 
            label: 'Responses Analytics', 
            icon: PieChart,
            description: 'Analysis of incoming replies and conversion rates'
        },
        { 
            id: 'messages', 
            label: 'Analysis of Messages', 
            icon: MessageSquare,
            description: 'Performance metrics for campaign message templates'
        },
        {
            id: 'conversions',
            label: 'Template Conversions',
            icon: TrendingUp,
            description: 'Which templates lead to Interested, MQL, SQL, Partner, Client'
        }
    ];

    return (
        <div className="max-w-[1600px] mx-auto py-6 px-6">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                    Messages Analytics
                </h1>
                <p className="text-slate-500 text-sm">
                    Comprehensive overview of your communication performance and response metrics.
                </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-slate-900/80 rounded-xl border border-slate-800 shadow-inner w-fit mb-8">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                            activeTab === tab.id
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'responses' ? (
                            <ResponseAnalytics />
                        ) : activeTab === 'messages' ? (
                            <CampaignAnalytics />
                        ) : (
                            <TemplateConversions />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
