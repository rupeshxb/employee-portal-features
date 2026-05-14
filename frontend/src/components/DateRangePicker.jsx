import React, { useState } from 'react';
import '../style/DateRangePicker.css';

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const parseDate = (str) => {
    if (!str) return null;
    const [y, m, d] = str.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setHours(0, 0, 0, 0);
    return dt;
};

const formatISO = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const sameDay = (a, b) => {
    if (!a || !b) return false;
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
};

const DateRangePicker = ({ startDate, endDate, onChange, onClose }) => {
    const start = parseDate(startDate);
    const end = parseDate(endDate);

    // 'selecting': start chosen, waiting for end click
    const [selecting, setSelecting] = useState(() => !!(startDate && !endDate));

    const [viewDate, setViewDate] = useState(() => {
        const ref = start || new Date();
        return new Date(ref.getFullYear(), ref.getMonth(), 1);
    });

    const [hoverDate, setHoverDate] = useState(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1);
    const offset = (firstDay.getDay() + 6) % 7; // Mon=0
    const gridStart = new Date(year, month, 1 - offset);
    gridStart.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        d.setHours(0, 0, 0, 0);
        days.push(d);
    }

    // Compute display range (includes live hover preview during selection)
    let dispStart = start;
    let dispEnd = end;
    if (selecting && start) {
        if (hoverDate) {
            if (hoverDate >= start) {
                dispStart = start;
                dispEnd = hoverDate;
            } else {
                dispStart = hoverDate;
                dispEnd = start;
            }
        } else {
            // No hover yet: show start as a single point (circle only)
            dispStart = start;
            dispEnd = start;
        }
    }

    const isSingleRange = dispStart && dispEnd && sameDay(dispStart, dispEnd);

    const handleDayClick = (d) => {
        if (!selecting) {
            // Start fresh selection
            onChange({ start: formatISO(d), end: '' });
            setSelecting(true);
        } else {
            // Finalize: determine start/end order
            let s = start;
            let e = d;
            if (d < start) { s = d; e = start; }
            onChange({ start: formatISO(s), end: formatISO(e) });
            setSelecting(false);
            setHoverDate(null);
            if (onClose) onClose();
        }
    };

    const handleClear = () => {
        onChange({ start: '', end: '' });
        setSelecting(false);
        setHoverDate(null);
        if (onClose) onClose();
    };

    const hasDates = startDate || endDate;

    return (
        <div className="drp-container">
            {/* Header */}
            <div className="drp-header">
                <span className="drp-month-label">{monthLabel}</span>
                <div className="drp-nav">
                    <button
                        className="drp-nav-btn"
                        onClick={() => setViewDate(new Date(year, month - 1, 1))}
                        type="button"
                        aria-label="Previous month"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M12.5 5L7.5 10L12.5 15" stroke="#293050" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button
                        className="drp-nav-btn"
                        onClick={() => setViewDate(new Date(year, month + 1, 1))}
                        type="button"
                        aria-label="Next month"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M7.5 5L12.5 10L7.5 15" stroke="#293050" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Weekday labels */}
            <div className="drp-weekdays">
                {WEEKDAY_LABELS.map(wl => (
                    <div key={wl} className="drp-weekday">{wl}</div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="drp-grid">
                {days.map((d, i) => {
                    const otherMonth = d.getMonth() !== month;
                    const isToday = sameDay(d, today);
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                    const isRangeStart = !isSingleRange && dispStart && dispEnd && sameDay(d, dispStart);
                    const isRangeEnd = !isSingleRange && dispStart && dispEnd && sameDay(d, dispEnd);
                    const isRangeMid = dispStart && dispEnd && !isSingleRange && d > dispStart && d < dispEnd;
                    const isRangeSingle = isSingleRange && sameDay(d, dispStart);
                    const isEndpoint = isRangeStart || isRangeEnd || isRangeSingle;

                    const classes = ['drp-day'];
                    if (otherMonth) classes.push('other-month');
                    if (isToday) classes.push('today');
                    if (isWeekend && !isEndpoint) classes.push('weekend');
                    if (isRangeStart) classes.push('range-start');
                    else if (isRangeEnd) classes.push('range-end');
                    else if (isRangeMid) classes.push('range-middle');
                    else if (isRangeSingle) classes.push('range-single');

                    return (
                        <button
                            key={i}
                            type="button"
                            className={classes.join(' ')}
                            onClick={() => handleDayClick(d)}
                            onMouseEnter={() => { if (selecting) setHoverDate(d); }}
                            onMouseLeave={() => { if (selecting) setHoverDate(null); }}
                        >
                            <span className="drp-day-circle">{d.getDate()}</span>
                        </button>
                    );
                })}
            </div>

            {/* Footer: show clear only when dates are set */}
            {hasDates && (
                <div className="drp-footer">
                    <button type="button" className="drp-clear-btn" onClick={handleClear}>
                        Clear dates
                    </button>
                </div>
            )}
        </div>
    );
};

export default DateRangePicker;
