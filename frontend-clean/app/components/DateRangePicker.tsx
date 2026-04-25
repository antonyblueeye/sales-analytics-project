'use client';
import { useState, useRef, useEffect } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { subDays, subWeeks, subMonths, startOfMonth, endOfMonth, startOfYear, isSameDay, format, startOfWeek, endOfWeek } from 'date-fns';
import 'react-day-picker/dist/style.css';

interface DateRangePickerProps {
    onDateChange: (start: Date, end: Date) => void;
}

const PRESETS = [
    { label: 'Today', getValue: () => ({ from: new Date(), to: new Date() }) },
    { label: 'Yesterday', getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
    { label: 'This week', getValue: () => ({ 
        from: startOfWeek(new Date(), { weekStartsOn: 1 }), 
        to: new Date() 
    }) },
    { label: 'Last week', getValue: () => {
        const lastWeek = subWeeks(new Date(), 1);
        return { 
            from: startOfWeek(lastWeek, { weekStartsOn: 1 }), 
            to: endOfWeek(lastWeek, { weekStartsOn: 1 }) 
        };
    }},
    { label: 'Last 7 days', getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
    { label: 'Last 30 days', getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
    { label: 'This month', getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
    { label: 'Last month', getValue: () => {
        const date = subMonths(new Date(), 1);
        return { from: startOfMonth(date), to: endOfMonth(date) };
    }},
    { label: 'This year', getValue: () => ({ from: startOfYear(new Date()), to: new Date() }) },
    { label: 'Last year', getValue: () => {
        const date = subDays(startOfYear(new Date()), 1);
        return { from: startOfYear(date), to: endOfMonth(date) };
    }}
];

export default function DateRangePicker({ onDateChange }: DateRangePickerProps) {
    const [range, setRange] = useState<DateRange>({
        from: subDays(new Date(), 6),
        to: new Date()
    });
    const [tempRange, setTempRange] = useState<DateRange | undefined>(range);
    const [isOpen, setIsOpen] = useState(false);
    const [activePreset, setActivePreset] = useState<string>('Last 7 days');
    
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setTempRange(range);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, range]);

    const handleApply = () => {
        if (tempRange?.from && tempRange?.to) {
            setRange(tempRange);
            onDateChange(tempRange.from, tempRange.to);
            setIsOpen(false);
        }
    };

    const handlePresetClick = (preset: typeof PRESETS[0]) => {
        const newRange = preset.getValue();
        setTempRange(newRange);
        setActivePreset(preset.label);
    };

    const getDisplayText = () => {
        if (!range?.from) return 'Select date range';
        if (range.from && !range.to) return format(range.from, 'MMM dd, yyyy');
        if (isSameDay(range.from, range.to!)) return format(range.from, 'MMM dd, yyyy');
        return `${format(range.from, 'MMM dd')} - ${format(range.to!, 'MMM dd, yyyy')}`;
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 text-sm font-medium shadow-sm bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 group`}
            >
                <Calendar size={18} className="text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                <span className="min-w-[170px] text-left pointer-events-none">{getDisplayText()}</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-3 right-0 z-[100] flex flex-col md:flex-row bg-[#0f172a] border border-slate-700/60 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 w-[max-content] backdrop-blur-xl">
                    
                    <div className="w-full md:w-52 bg-slate-800/40 border-b md:border-b-0 md:border-r border-slate-700/50 p-3 flex flex-col">
                        <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick Select</div>
                        <div className="flex flex-col gap-1 overflow-y-auto max-h-[220px] md:max-h-none pr-1 custom-scrollbar">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => handlePresetClick(preset)}
                                    className={`flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                                        activePreset === preset.label
                                            ? 'bg-indigo-500/15 text-indigo-300 font-semibold shadow-inner'
                                            : 'text-slate-300 hover:bg-slate-700/60 hover:text-slate-100'
                                    }`}
                                >
                                    {preset.label}
                                    {activePreset === preset.label && <Check size={16} className="text-indigo-400 animate-in zoom-in duration-200" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-5 flex flex-col bg-[#0f172a]/95">
                        <style dangerouslySetInnerHTML={{ __html: `
                            .rdp-root {
                                --rdp-accent-color: #6366f1;
                                --rdp-accent-background-color: rgba(99, 102, 241, 0.15);
                                --rdp-background-color: #334155;
                                --rdp-day-height: 42px;
                                --rdp-day-width: 42px;
                                margin: 0;
                                color: #cbd5e1;
                            }
                            /* Base day styles */
                            .rdp-day {
                                border-radius: 8px;
                            }
                            
                            /* Range selection styles */
                            .rdp-range_start,
                            .rdp-range_end {
                                color: white !important;
                                background-color: var(--rdp-accent-color) !important;
                                border-radius: 8px !important;
                                font-weight: 600;
                            }
                            
                            .rdp-range_middle {
                                background-color: var(--rdp-accent-background-color) !important;
                                color: #818cf8 !important;
                                border-radius: 0 !important;
                            }
                            
                            .rdp-range_start.rdp-range_end {
                                border-radius: 8px !important;
                            }

                            /* Backgrounds for middle range edges */
                            .rdp-range_start:not(.rdp-range_end) {
                                border-top-right-radius: 0 !important;
                                border-bottom-right-radius: 0 !important;
                            }
                            
                            .rdp-range_end:not(.rdp-range_start) {
                                border-top-left-radius: 0 !important;
                                border-bottom-left-radius: 0 !important;
                            }

                            /* Headers & Nav */
                            .rdp-caption_label {
                                font-weight: 600;
                                font-size: 1rem;
                                color: #f8fafc;
                            }
                            .rdp-weekday {
                                color: #64748b;
                                font-weight: 500;
                                text-transform: uppercase;
                                font-size: 0.8rem;
                            }
                            
                            /* Interactive elements */
                            .rdp-button_nav {
                                border: 1px solid #334155;
                                border-radius: 8px;
                                color: #cbd5e1;
                            }
                            .rdp-button_nav:hover {
                                background-color: #334155;
                                color: white;
                            }

                            /* Today indicator */
                            .rdp-today {
                                font-weight: 700;
                                color: #818cf8;
                            }
                            .rdp-today:not(.rdp-outside) {
                                border: 1px solid #334155;
                            }
                            
                            /* Hover effects */
                            .rdp-day:hover:not(.rdp-day_disabled) {
                                background-color: #334155;
                            }
                        `}} />
                        <DayPicker
                            mode="range"
                            selected={tempRange}
                            onSelect={(range) => {
                                setTempRange(range);
                                setActivePreset('Custom');
                            }}
                            numberOfMonths={2}
                            showOutsideDays={false}
                        />

                        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-5 border-t border-slate-800/80">
                            <div className="text-[13px] font-medium text-slate-400 flex items-center gap-2 mb-4 sm:mb-0">
                                {tempRange?.from ? (
                                    <div className="flex items-center gap-2.5 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                                        <span className="text-slate-200">{format(tempRange.from, 'MMM dd, yyyy')}</span>
                                        {tempRange.to && (
                                            <>
                                                <span className="text-slate-500">-</span>
                                                <span className="text-slate-200">{format(tempRange.to, 'MMM dd, yyyy')}</span>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <span className="italic flex items-center gap-2 px-2">
                                        <Calendar size={14} /> Select a date range
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2.5 w-full sm:w-auto">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        setTempRange(range);
                                    }}
                                    className="flex-1 sm:flex-none px-5 py-2 text-sm font-medium rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700 hover:border-slate-600 transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApply}
                                    disabled={!tempRange?.from || !tempRange?.to}
                                    className="flex-1 sm:flex-none px-5 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-4 focus:ring-indigo-600/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 shadow-lg shadow-indigo-600/25 active:scale-[0.98]"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}