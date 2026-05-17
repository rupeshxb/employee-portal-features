import React, { useState, useRef, useEffect } from 'react';
import '../style/CustomSelect.css';
import { DropdownSearchIcon } from './Icons';

const CustomSelect = ({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    searchable = false,
    searchPlaceholder = 'Search...',
    hasError = false,
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef(null);

    const selectedOption = options.find(o => String(o.value) === String(value));

    const filtered = searchable
        ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
        : options;

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className={`custom-select${hasError ? ' input-error' : ''}`} ref={ref}>
            <button
                type="button"
                className="cs-trigger"
                onClick={() => setOpen(v => !v)}
            >
                <span className={selectedOption ? 'cs-value' : 'cs-placeholder'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <svg
                    className={`cs-chevron${open ? ' cs-chevron-open' : ''}`}
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                >
                    <path d="M4 6L8 10L12 6" stroke="rgba(23,24,26,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {open && (
                <div className="cs-dropdown">
                    {searchable && (
                        <div className="cs-search-wrapper">
                            <div className="cs-search-inner">
                                <span className="cs-search-icon"><DropdownSearchIcon /></span>
                                <input
                                    type="text"
                                    className="cs-search"
                                    placeholder={searchPlaceholder}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}
                    <ul className="cs-list">
                        {filtered.map(o => (
                            <li
                                key={o.value}
                                className={`cs-item${String(o.value) === String(value) ? ' cs-item-active' : ''}`}
                                onMouseDown={() => {
                                    onChange(o.value);
                                    setOpen(false);
                                    setSearch('');
                                }}
                            >
                                {o.label}
                            </li>
                        ))}
                        {filtered.length === 0 && (
                            <li className="cs-no-results">No results found</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
