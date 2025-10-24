import React, { useEffect, useRef, useState } from 'react';
import { listStations } from '../api/rental';

export default function LocationPicker({ value, onChange, className = '' }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open || items.length) return;
    setLoading(true);
    listStations()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || 'Failed to load stations'))
      .finally(() => setLoading(false));
  }, [open, items.length]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const selected = value ? items.find((s) => String(s.id) === String(value)) : null;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left focus:outline-none"
      >
        <div className="text-xs text-gray-400">Pick-up / Drop-off</div>
        <div className="text-gray-700 truncate">
          {selected ? selected.name : 'Select location'}
        </div>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-auto">
          {loading && <div className="px-4 py-3 text-sm text-gray-500">Loading…</div>}
          {error && <div className="px-4 py-3 text-sm text-red-600">{error}</div>}
          {!loading && !error && items.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">No locations</div>
          )}
          {!loading && !error && items.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onChange && onChange(String(s.id));
                setOpen(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
            >
              <div className="font-medium text-gray-800">{s.name}</div>
              {s.address && <div className="text-gray-500 text-xs">{s.address}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

