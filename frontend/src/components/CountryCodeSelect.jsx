import React, { useState, useRef, useEffect } from "react";
import { COUNTRY_CODES } from "../data/countryCodes";
import "../style/CountryCodeSelect.css";

const CountryCodeSelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  const selected = COUNTRY_CODES.find((c) => c.code === value) || COUNTRY_CODES[0];

  const filtered = COUNTRY_CODES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search)
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="cc-select" ref={ref}>
      <button
        type="button"
        className="cc-trigger"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="cc-code">{selected.code}</span>
        <span className="cc-pipe">|</span>
        <span className="cc-dial">{selected.dial}</span>
        <svg className={`cc-chevron ${open ? "cc-chevron-open" : ""}`} viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="cc-dropdown">
          <div className="cc-search-wrapper">
            <input
              type="text"
              className="cc-search"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <ul className="cc-list">
            {filtered.map((c) => (
              <li
                key={c.code}
                className={`cc-item ${c.code === value ? "cc-item-active" : ""}`}
                onMouseDown={() => {
                  onChange(c.code);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <span className="cc-item-code">{c.code} {c.dial}</span>
                <span className="cc-item-name">{c.name}</span>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="cc-item-empty">No results found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelect;
