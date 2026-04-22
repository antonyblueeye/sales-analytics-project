'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    icon?: React.ReactNode;
}

export default function CustomSelect({ value, onChange, options, placeholder = "Select...", icon }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Focus search input when menu opens
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        } else {
            setSearchQuery(''); // Reset search when closing
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeOption = options.find((opt) => opt.value === value);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 text-sm font-medium shadow-sm bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 group h-[42px] min-w-[200px]"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {icon && <span className="text-indigo-400 group-hover:text-indigo-300 transition-colors shrink-0">{icon}</span>}
                    <span className="truncate">{activeOption ? activeOption.label : placeholder}</span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 right-0 z-50 flex flex-col bg-[#0f172a]/95 border border-slate-700/60 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 min-w-full w-[max-content] max-w-[400px] backdrop-blur-xl">
                    {/* Search Input Area */}
                    <div className="p-2 border-b border-slate-700/40 sticky top-0 bg-slate-900/50 backdrop-blur-md z-10">
                        <div className="relative group">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search campaign..."
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg py-1.5 pl-9 pr-8 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-600 hover:text-slate-300 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col p-1.5 custom-scrollbar max-h-72 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all duration-200 text-left ${
                                        value === option.value
                                            ? 'bg-indigo-500/15 text-indigo-300 font-semibold shadow-inner'
                                            : 'text-slate-300 hover:bg-slate-700/60 hover:text-slate-100'
                                    }`}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {value === option.value && <Check size={16} className="text-indigo-400 animate-in zoom-in duration-200 ml-4 shrink-0" />}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center">
                                <Search size={24} className="mx-auto text-slate-700 mb-2 opacity-50" />
                                <p className="text-sm text-slate-500">No campaigns match your search</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
