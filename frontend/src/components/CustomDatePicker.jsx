import React, { useState, useEffect, useRef } from 'react';
import '../style/CustomDatePicker.css';

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const formatDateISO = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const DatePickerPanel = ({ value, onChange, onClose, ignoreRef }) => {
    const containerRef = useRef(null);

    const [viewDate, setViewDate] = useState(() => {
        const d = value ? new Date(value) : new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && containerRef.current.contains(e.target)) return;
            if (ignoreRef && ignoreRef.current && ignoreRef.current.contains(e.target)) return;
            onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose, ignoreRef]);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstOfMonth = new Date(year, month, 1);
    const offset = (firstOfMonth.getDay() + 6) % 7;
    const startDate = new Date(year, month, 1 - offset);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = value ? new Date(value) : null;
    if (selectedDate) selectedDate.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        days.push(d);
    }

    const goPrev = () => setViewDate(new Date(year, month - 1, 1));
    const goNext = () => setViewDate(new Date(year, month + 1, 1));

    const handleDayClick = (d) => {
        onChange(formatDateISO(d));
        onClose();
    };

    return (
        <div ref={containerRef} className="custom-date-picker" role="dialog" aria-label="Choose date">
            <div className="cdp-header">
                <span className="cdp-month-label">{monthLabel}</span>
                <div className="cdp-nav">
                    <button className="cdp-nav-btn" onClick={goPrev} type="button" aria-label="Previous month">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.5 5L7.5 10L12.5 15" stroke="#293050" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                    <button className="cdp-nav-btn" onClick={goNext} type="button" aria-label="Next month">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.5 5L12.5 10L7.5 15" stroke="#293050" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div className="cdp-weekdays">
                {WEEKDAY_LABELS.map(d => (
                    <div key={d} className="cdp-weekday">{d}</div>
                ))}
            </div>

            <div className="cdp-grid">
                {days.map((d, i) => {
                    const otherMonth = d.getMonth() !== month;
                    const isToday = isSameDay(d, today);
                    const isSelected = selectedDate && isSameDay(d, selectedDate);
                    const dow = d.getDay();
                    const isWeekend = dow === 0 || dow === 6;

                    const classNames = [
                        'cdp-day',
                        otherMonth ? 'other-month' : '',
                        isToday ? 'today' : '',
                        isSelected ? 'selected' : '',
                        isWeekend ? 'weekend' : ''
                    ].filter(Boolean).join(' ');

                    return (
                        <button
                            key={i}
                            type="button"
                            className={classNames}
                            onClick={() => handleDayClick(d)}
                        >
                            <span className="cdp-day-circle">{d.getDate()}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const CustomDatePicker = ({ value, onChange, isOpen, onClose, ignoreRef }) => {
    if (!isOpen) return null;
    return (
        <DatePickerPanel
            value={value}
            onChange={onChange}
            onClose={onClose}
            ignoreRef={ignoreRef}
        />
    );
};

export default CustomDatePicker;
