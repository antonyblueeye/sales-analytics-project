'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

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
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const activeOption = options.find((opt) => opt.value === value);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 text-sm font-medium shadow-sm bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 group h-[42px]"
            >
                <div className="flex items-center gap-2">
                    {icon && <span className="text-indigo-400 group-hover:text-indigo-300 transition-colors pointer-events-none">{icon}</span>}
                    <span className="truncate pointer-events-none">{activeOption ? activeOption.label : placeholder}</span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 pointer-events-none transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 left-0 z-50 flex flex-col bg-[#0f172a]/95 border border-slate-700/60 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 min-w-full w-[max-content] backdrop-blur-xl">
                    <div className="flex flex-col p-1.5 custom-scrollbar max-h-60 overflow-y-auto">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all duration-200 whitespace-nowrap ${
                                    value === option.value
                                        ? 'bg-indigo-500/15 text-indigo-300 font-semibold shadow-inner'
                                        : 'text-slate-300 hover:bg-slate-700/60 hover:text-slate-100'
                                }`}
                            >
                                <span>{option.label}</span>
                                {value === option.value && <Check size={16} className="text-indigo-400 animate-in zoom-in duration-200 ml-4" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
