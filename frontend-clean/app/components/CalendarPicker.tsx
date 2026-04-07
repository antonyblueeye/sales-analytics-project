'use client';
import { useState } from 'react';
import { DateRangePicker } from 'react-date-range';
import { subWeeks, subMonths } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

export default function CalendarPicker({ onDateChange }: { onDateChange: (start: Date, end: Date) => void }) {
    const [range, setRange] = useState([
        {
            startDate: subWeeks(new Date(), 4),
            endDate: new Date(),
            key: 'selection',
        },
    ]);

    const handleSelect = (ranges: any) => {
        const { startDate, endDate } = ranges.selection;
        setRange([ranges.selection]);
        if (startDate && endDate) onDateChange(startDate, endDate);
    };

    const setLastWeek = () => {
        const end = new Date();
        const start = subWeeks(end, 1);
        setRange([{ startDate: start, endDate: end, key: 'selection' }]);
        onDateChange(start, end);
    };

    const setLastMonth = () => {
        const end = new Date();
        const start = subMonths(end, 1);
        setRange([{ startDate: start, endDate: end, key: 'selection' }]);
        onDateChange(start, end);
    };

    return (
        <div className="flex items-center gap-4">
            <style dangerouslySetInnerHTML={{ __html: `
                .rdrStaticRangeLabel {
                    color: #000000 !important;
                    font-weight: 500 !important;
                }
                .rdrStaticRange {
                    background: #ffffff !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                }
                .rdrStaticRange:hover .rdrStaticRangeLabel,
                .rdrStaticRange.rdrStaticRangeSelected .rdrStaticRangeLabel {
                    color: #000000 !important;
                }
                .rdrStaticRange:hover,
                .rdrStaticRange.rdrStaticRangeSelected {
                    background: #e2e8f0 !important;
                }
                .rdrInputRange {
                    background: #ffffff !important;
                }
                .rdrInputRange span, .rdrInputRange span:hover {
                    color: #000000 !important;
                    font-weight: 500 !important;
                }
                .rdrInputRangeInput {
                    color: #000000 !important;
                    background: #e2e8f0 !important;
                    border: 1px solid #cbd5e1 !important;
                }
            `}} />
            <div className="overflow-hidden rounded-lg shadow-lg" style={{ filter: 'invert(0.92) hue-rotate(180deg)', backgroundColor: '#fff' }}>
                {/* @ts-ignore */}
                <DateRangePicker 
                    ranges={range} 
                    onChange={handleSelect} 
                    moveRangeOnFirstSelection={false}
                    months={1}
                    direction="horizontal"
                />
            </div>
        </div>
    );
}