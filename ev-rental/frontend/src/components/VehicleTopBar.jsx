import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { listFleetVehicles } from '../api/fleet';

const availabilityBadge = (v) => (
  <span
    className={`ml-2 inline-block w-2 h-2 rounded-full ${v.isAvailable ? 'bg-emerald-500' : 'bg-gray-300'}`}
    title={v.isAvailable ? 'Available' : 'Unavailable'}
  />
);

export default function VehicleTopBar() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    listFleetVehicles()
      .then((res) => {
        if (!mounted) return;
        const data = res?.data ?? res;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((e) => mounted && setError(e.message || 'Failed to load vehicles'))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || error || !items.length) return null;

  return (
    <div className="border-t border-gray-200/70 bg-white/80 backdrop-blur">
      <div className="max-padd-container">
        <div className="flex items-center gap-2 py-2 overflow-x-auto">
          {items.map((v) => (
            <NavLink
              key={v.id}
              to={`/listing/${encodeURIComponent(v.id)}`}
              className="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
              title={v.name || v.id}
            >
              <span className="font-medium">{v.name || v.id}</span>
              {availabilityBadge(v)}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

