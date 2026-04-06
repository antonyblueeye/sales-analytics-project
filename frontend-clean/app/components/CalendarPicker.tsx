'use client';
import { useState } from 'react';
// @ts-ignore
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
            <div className="flex gap-2">
                <button onClick={setLastWeek} className="px-3 py-2 bg-gray-200 rounded-lg text-sm">Last week</button>
                <button onClick={setLastMonth} className="px-3 py-2 bg-gray-200 rounded-lg text-sm">Last month</button>
            </div>
            {/* @ts-ignore */}
            <DateRangePicker ranges={range} onChange={handleSelect} moveRangeOnFirstSelection={false} />
        </div>
    );
}