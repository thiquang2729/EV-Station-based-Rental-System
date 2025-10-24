import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { listFleetVehicles } from '../api/fleet';
import { listStations } from '../api/rental';

export const Listing = () => {
  const [items, setItems] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [stationId, setStationId] = useState('');
  const [avail, setAvail] = useState(''); // '', 'true', 'false'
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([listFleetVehicles(), listStations()])
      .then(([vRes, sRes]) => {
        if (!mounted) return;
        const vData = vRes?.data ?? vRes; const sData = sRes?.data ?? sRes;
        setItems(Array.isArray(vData) ? vData : []);
        setStations(Array.isArray(sData) ? sData : []);
      })
      .catch((e) => mounted && setError(e.message || 'Failed to load'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const types = useMemo(() => {
    const set = new Set(items.map(v => (v.type || '').toString().trim()).filter(Boolean));
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(v => {
      if (type && (v.type || '').toString().trim() !== type) return false;
      if (stationId && String(v.stationId) !== String(stationId)) return false;
      if (avail === 'true' && !v.isAvailable) return false;
      if (avail === 'false' && v.isAvailable) return false;
      if (priceMin !== '' && Number.isFinite(Number(priceMin)) && (v.pricePerHour ?? 0) < Number(priceMin)) return false;
      if (priceMax !== '' && Number.isFinite(Number(priceMax)) && (v.pricePerHour ?? 0) > Number(priceMax)) return false;
      if (q) {
        const hay = `${v.name || ''} ${v.id || ''} ${v.plate || ''}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [items, type, stationId, avail, priceMin, priceMax, q]);

  return (
    <div className="max-padd-container py-10">
      <div className="flex items-end justify-between gap-4 mb-6">
        <h3 className="m-0">All Vehicles</h3>
        {!loading && !error && (
          <div className="text-sm text-gray-500">{filtered.length} results</div>
        )}
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border bg-white p-4 mb-6 grid grid-cols-1 md:grid-cols-6 gap-3">
        <input
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          placeholder="Search name/plate"
          className="border p-2 rounded md:col-span-2"
        />
        <select value={type} onChange={(e)=>setType(e.target.value)} className="border p-2 rounded">
          <option value="">All types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={stationId} onChange={(e)=>setStationId(e.target.value)} className="border p-2 rounded">
          <option value="">All stations</option>
          {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={avail} onChange={(e)=>setAvail(e.target.value)} className="border p-2 rounded">
          <option value="">Any availability</option>
          <option value="true">Available</option>
          <option value="false">Unavailable</option>
        </select>
        <div className="flex gap-2">
          <input type="number" min="0" value={priceMin} onChange={(e)=>setPriceMin(e.target.value)} placeholder="Min ₫/h" className="border p-2 rounded w-full" />
          <input type="number" min="0" value={priceMax} onChange={(e)=>setPriceMax(e.target.value)} placeholder="Max ₫/h" className="border p-2 rounded w-full" />
        </div>
        <button type="button" onClick={()=>{setQ('');setType('');setStationId('');setAvail('');setPriceMin('');setPriceMax('');}} className="btn-outline">Clear</button>
      </div>

      {loading && <div>Loading vehicles...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        filtered.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((v) => (
              <NavLink
                key={v.id}
                to={`/listing/${encodeURIComponent(v.id)}`}
                className="rounded-xl border bg-white hover:shadow-md transition block overflow-hidden"
              >
                <div className="w-full h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {v.imageUrl ? (
                    <img src={v.imageUrl} alt={v.name || v.id} className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-gray-300">No image</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-base font-semibold truncate mr-2">{v.name || v.id}</div>
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${v.isAvailable ? 'bg-emerald-500' : 'bg-gray-300'}`}
                      title={v.isAvailable ? 'Available' : 'Unavailable'}
                    />
                  </div>
                  <div className="text-sm text-gray-500 mb-2 capitalize">{v.type || 'vehicle'}</div>
                  {v.pricePerHour !== undefined && (
                    <div className="text-sm font-semibold">{v.pricePerHour} đ/giờ</div>
                  )}
                </div>
              </NavLink>
            ))}
          </div>
        ) : (
          <div className="text-gray-600">No vehicles found.</div>
        )
      )}
    </div>
  );
};

export default Listing;
