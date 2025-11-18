import React, { useEffect, useState } from 'react';
import { listFleetVehicles } from '../api/fleet';
import LocationPicker from '../components/LocationPicker';
import { getStation } from '../api/rental';
// Removed old rental API placeholder; we now use fleet API directly

const BrandRow = () => {
  const brands = ['Kia', 'Subaru', 'Mini', 'Hyundai', 'Mercedes', 'Toyota', 'BMW', 'Honda', 'Audi', 'Volvo'];
  const loop = [...brands, ...brands];
  return (
    <div className="max-padd-container py-6 opacity-80">
      <div className="mx-auto max-w-5xl overflow-hidden">
        <div className="inline-flex items-center gap-6 whitespace-nowrap text-gray-400 animate-brand-marquee">
          {loop.map((b, i) => (
            <span key={`${b}-${i}`} className="shrink-0 text-sm md:text-base font-semibold">{b}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const CategoryCards = ({ onSelectType }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    listFleetVehicles()
      .then((res) => {
        if (!mounted) return;
        const data = res?.data ?? res;
        const arr = Array.isArray(data) ? data : [];
        // Build type -> { count, sampleImage }
        const map = new Map();
        for (const v of arr) {
          const t = (v.type || '').toString().trim();
          if (!t) continue;
          const cur = map.get(t) || { type: t, count: 0, imageUrl: undefined };
          cur.count += 1;
          if (!cur.imageUrl && v.imageUrl) cur.imageUrl = v.imageUrl;
          map.set(t, cur);
        }
        setCards(Array.from(map.values()));
      })
      .catch((e) => mounted && setError(e.message || 'Failed to load categories'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const label = (t) => t ? t.charAt(0).toUpperCase() + t.slice(1) : t;

  return (
    <div className="max-padd-container py-8">
      <h3 className="mb-5">Pick Your Perfect Match</h3>
      {loading && <div className="text-gray-500">Loading categories...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {cards.map((c) => (
            <button
              key={c.type}
              type="button"
              onClick={() => onSelectType && onSelectType(c.type)}
              className="text-left rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
            >
              <div className="text-xs inline-flex px-3 py-1 rounded-full bg-gray-100 border border-gray-200 m-5">{label(c.type)} {c.count ? `(${c.count})` : ''}</div>
              <div className="mx-5 mb-5 h-24 bg-gray-50 flex items-center justify-center overflow-hidden rounded-xl">
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt={c.type} className="w-full h-full object-contain" />
                ) : (
                  <div className="text-gray-300">image</div>
                )}
              </div>
            </button>
          ))}
          {!cards.length && (
            <div className="text-gray-600">No categories found.</div>
          )}
        </div>
      )}
    </div>
  );
};

const SearchBar = ({ stationId, setStationId, onSearch, searching }) => {
  return (
    <div className="max-w-3xl w-full bg-white rounded-full shadow-xl ring-1 ring-slate-900/10 overflow-visible">
      <div className="grid grid-cols-12 items-center">
        <div className="col-span-11 px-5 py-4 relative">
          <LocationPicker value={stationId} onChange={setStationId} />
        </div>
        <button
          onClick={() => onSearch && onSearch()}
          disabled={!stationId || searching}
          className={`col-span-1 h-full flexCenter ${(!stationId || searching) ? 'bg-gray-300 cursor-not-allowed' : 'bg-black cursor-pointer'} text-white`}
          title={stationId ? 'Search vehicles' : 'Select a location first'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 104.204 12.036l3.255 3.255a.75.75 0 101.06-1.06l-3.255-3.255A6.75 6.75 0 0010.5 3.75zm-5.25 6.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const VehicleFooter = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listFleetVehicles()
      .then((res) => setItems(res.data || res))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-padd-container py-12">
      <h3 className="mb-6">Available Vehicles</h3>
      {loading && <div>Loading vehicles…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map((v) => (
            <div key={v.id} className="rounded-xl border bg-white overflow-hidden cursor-pointer hover:shadow-md transition" onClick={() => { window.location.hash = `#/vehicles/${encodeURIComponent(v.id)}`; }}>
              <div className="w-full h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
                {v.imageUrl ? (
                  <img src={v.imageUrl} alt={v.name || v.id} className="w-full h-full object-contain" />
                ) : (
                  <div className="text-gray-300">No image</div>
                )}
              </div>
              <div className="p-4">
                <div className="text-base font-semibold mb-1">{v.name || v.id}</div>
                <div className="text-sm text-gray-500 mb-1">{v.type || 'Vehicle'}</div>
                <div className="text-sm">{v.isAvailable ? 'Sẵn sàng' : 'Không sẵn sàng'}</div>
                {v.pricePerDay !== undefined && (
                  <div className="mt-2 font-semibold">{Number(v.pricePerDay||0).toLocaleString('vi-VN')} đ/ngày</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const VehiclesResult = ({ items = [], loading, error, stationName, title }) => {
  return (
    <div id="results" className="max-padd-container py-12">
      <h3 className="mb-6">{title || (stationName ? `Vehicles at ${stationName}` : 'Vehicles')}</h3>
      {loading && <div>Đang tải danh sách xe…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        items.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((v) => (
              <div key={v.id} className="rounded-xl border bg-white overflow-hidden cursor-pointer hover:shadow-md transition" onClick={() => { window.location.hash = `#/vehicles/${encodeURIComponent(v.id)}`; }}>
                <div className="w-full h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {v.imageUrl ? (
                    <img src={v.imageUrl} alt={v.name || v.id} className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-gray-300">No image</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-base font-semibold mb-1">{v.name || v.id}</div>
                  <div className="text-sm text-gray-500 mb-1">{v.type || 'Vehicle'}</div>
                  <div className="text-sm">{v.isAvailable ? 'Sẵn sàng' : 'Không sẵn sàng'}</div>
                  {v.pricePerDay !== undefined && (
                  <div className="mt-2 font-semibold">{Number(v.pricePerDay||0).toLocaleString('vi-VN')} đ/ngày</div>
                    )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-600">Không có xe ở trạm này.</div>
        )
      )}
    </div>
  );
};

export default function Home() {
  const [stationId, setStationId] = useState('');
  const [stationName, setStationName] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSearch = async () => {
    if (!stationId) return;
    setLoading(true);
    setError('');
    try {
      const res = await listFleetVehicles();
      const data = res?.data ?? res;
      const arr = Array.isArray(data) ? data : [];
      const filtered = arr.filter(v => String(v.stationId) === String(stationId));
      setItems(filtered);
      const stName = filtered[0]?.stationName || '';
      setStationName(stName);
    } catch (e) {
      setError(e.message || 'Không tải được danh sách xe');
    } finally {
      setLoading(false);
    }
  };

  const onSelectType = async (type) => {
    setSelectedType(type);
    setLoading(true);
    setError('');
    try {
      const res = await listFleetVehicles();
      const data = res?.data ?? res;
      const arr = Array.isArray(data) ? data : [];
      let filtered = arr.filter(v => (v.type || '').toString().trim() === type);
      if (stationId) {
        filtered = filtered.filter(v => String(v.stationId) === String(stationId));
      }
      setItems(filtered);
      // Smooth scroll to results after selection
      setTimeout(() => {
        const el = document.getElementById('results');
        if (el && 'scrollIntoView' in el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    } catch (e) {
      setError(e.message || 'Không tải được danh sách xe theo loại');
    } finally {
      setLoading(false);
    }
  };

  // Khi đổi điểm thuê, tự động tải danh sách xe theo điểm đó
  useEffect(() => {
    if (!stationId) {
      setStationName('');
      if (!selectedType) setItems([]);
      return;
    }
    getStation(stationId)
      .then((s) => setStationName(s?.name || ''))
      .catch(() => setStationName(''));
    // ưu tiên lọc theo loại nếu đang chọn
    if (selectedType) {
      onSelectType(selectedType);
    } else {
      // fallback: chỉ lọc theo station
      (async () => {
        setLoading(true);
        setError('');
        try {
          const res = await listFleetVehicles();
          const data = res?.data ?? res;
          const arr = Array.isArray(data) ? data : [];
          const filtered = arr.filter(v => String(v.stationId) === String(stationId));
          setItems(filtered);
        } catch (e) {
          setError(e.message || 'Không tải được danh sách xe');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [stationId]);

  return (
    <div className="min-h-screen">
      <section className="flexCenter pt-16 pb-14 bg-gradient-to-b from-white to-gray-50">
        <div className="max-padd-container text-center">
          <h1 className="mb-6">Your Road Trip Starts Here</h1>
          <div className="flexCenter">
            <SearchBar stationId={stationId} setStationId={setStationId} onSearch={onSearch} searching={loading} />
          </div>
        </div>
      </section>
      <BrandRow />
      <CategoryCards onSelectType={onSelectType} />
      {(selectedType || stationId) && (
        <VehiclesResult
          items={items}
          loading={loading}
          error={error}
          stationName={stationName}
          title={selectedType ? `Vehicles: ${selectedType}` : undefined}
        />
      )}
      {/* Always show a footer with available vehicles from the fleet API */}
      <VehicleFooter />
    </div>
  );
}

