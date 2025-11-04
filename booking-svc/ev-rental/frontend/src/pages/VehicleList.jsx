import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { listFleetVehicles } from '../api/fleet';

export default function VehicleList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    listFleetVehicles()
      .then((res) => {
        if (!mounted) return;
        const data = res?.data ?? res;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((e) => mounted && setError(e.message || 'Failed to load vehicles'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <div className="max-padd-container py-10">
      <h3 className="mb-6">Vehicles</h3>
      {loading && <div>Loading vehicles...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        items.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((v) => (
              <div key={v.id} className="rounded-xl border bg-white hover:shadow-md transition overflow-hidden">
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
                    <div className="text-sm font-semibold">{Number(v.pricePerHour).toLocaleString('vi-VN')} đ/giờ</div>
                  )}
                  <div className="mt-3">
                    <NavLink to={`/vehicles/${encodeURIComponent(v.id)}`} className="btn-outline text-sm">Detail</NavLink>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-600">No vehicles found.</div>
        )
      )}
    </div>
  );
}

