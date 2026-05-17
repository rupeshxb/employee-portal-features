import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

const PANEL_WIDTH = 320;
const PANEL_HEIGHT_ESTIMATE = 380;
const GUTTER = 8;

const DatePickerPanel = ({ value, onChange, onClose, ignoreRef, portal, boundaryRef }) => {
    const containerRef = useRef(null);

    const [viewDate, setViewDate] = useState(() => {
        const d = value ? new Date(value) : new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    // In portal mode, compute fixed coordinates from the trigger's bounding rect,
    // clamped to the boundary (the modal) so the panel never spills outside.
    const [portalPos, setPortalPos] = useState(null);
    useLayoutEffect(() => {
        if (!portal || !ignoreRef?.current) return;
        const update = () => {
            const triggerRect = ignoreRef.current.getBoundingClientRect();
            const measuredHeight = containerRef.current?.offsetHeight || PANEL_HEIGHT_ESTIMATE;

            // Boundary defaults to viewport when no modal ref provided
            const bounds = boundaryRef?.current
                ? boundaryRef.current.getBoundingClientRect()
                : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };

            // Default: right-align with trigger, sit below trigger
            let left = triggerRect.right - PANEL_WIDTH;
            let top = triggerRect.bottom + GUTTER;

            // Vertical: if panel would overflow below the boundary, flip it above the trigger
            if (top + measuredHeight > bounds.bottom - GUTTER) {
                const above = triggerRect.top - measuredHeight - GUTTER;
                // Flip only if there's actually room above
                if (above >= bounds.top + GUTTER) top = above;
                else top = Math.max(bounds.top + GUTTER, bounds.bottom - measuredHeight - GUTTER);
            }

            // Horizontal: clamp inside the boundary
            const minLeft = bounds.left + GUTTER;
            const maxLeft = bounds.right - PANEL_WIDTH - GUTTER;
            if (left < minLeft) left = minLeft;
            if (left > maxLeft) left = maxLeft;

            setPortalPos({ top, left });
        };
        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [portal, ignoreRef, boundaryRef]);

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

    const portalStyle = portal && portalPos
        ? { position: 'fixed', top: `${portalPos.top}px`, left: `${portalPos.left}px`, right: 'auto', zIndex: 2000 }
        : undefined;

    const panel = (
        <div
            ref={containerRef}
            className="custom-date-picker"
            role="dialog"
            aria-label="Choose date"
            style={portalStyle}
            onClick={e => e.stopPropagation()}
        >
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

    if (portal) {
        return createPortal(panel, document.body);
    }
    return panel;
};

const CustomDatePicker = ({ value, onChange, isOpen, onClose, ignoreRef, portal, boundaryRef }) => {
    if (!isOpen) return null;
    return (
        <DatePickerPanel
            value={value}
            onChange={onChange}
            onClose={onClose}
            ignoreRef={ignoreRef}
            portal={portal}
            boundaryRef={boundaryRef}
        />
    );
};

export default CustomDatePicker;
