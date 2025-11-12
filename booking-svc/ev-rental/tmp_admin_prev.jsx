import React, { useEffect, useState } from 'react';
import { listFleetVehicles, createFleetVehicle, updateFleetVehicle, deleteFleetVehicle, presignUpload } from '../api/fleet';
import { listStations, createStation, deleteStation } from '../api/rental';

function VehiclesAdmin() {
  const [items, setItems] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ id: '', name: '', stationId: '', type: '', plate: '', pricePerHour: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const [v, s] = await Promise.all([listFleetVehicles(), listStations()]);
      const vData = v?.data ?? v; const sData = s?.data ?? s;
      setItems(Array.isArray(vData) ? vData : []);
      setStations(Array.isArray(sData) ? sData : []);
    } catch (e) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      let imageUrl = imageUrlInput?.trim() ? imageUrlInput.trim() : undefined;
      if (imageFile) {
        try {
          const presigned = await presignUpload({ contentType: imageFile.type, fileName: imageFile.name, prefix: 'vehicles' });
          const d = presigned?.data ?? presigned; const { uploadUrl, headers, publicUrl } = d;
          const putRes = await fetch(uploadUrl, { method: 'PUT', headers, body: imageFile, mode: 'cors' });
          if (!putRes.ok) {
            const txt = await putRes.text().catch(() => '');
            throw new Error(`S3 upload failed: ${putRes.status} ${putRes.statusText} - ${txt}`);
          }
          imageUrl = publicUrl;
          // show the URL to the user so they can verify
          setImageUrlInput(publicUrl);
        } catch (e) {
          setSubmitError(`Upload error: ${e.message}`);
          const proceed = confirm(`Upload presign/put failed (${e.message}).\nYou can continue without upload or paste a public Image URL. Continue without upload?`);
          if (!proceed) return;
        }
      }
      const payload = { ...form, pricePerHour: Number(form.pricePerHour) || 0, ...(imageUrl ? { imageUrl } : {}) };
      await createFleetVehicle(payload);
      setForm({ id: '', name: '', stationId: '', type: '', plate: '', pricePerHour: '' });
      setImageFile(null);
      setImageUrlInput('');
      await refresh();
    } catch (e) {
      setSubmitError(e.message || 'Create failed');
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id) => {
    if (!confirm('Delete vehicle?')) return;
    try { await deleteFleetVehicle(id); await refresh(); } catch (e) { alert(e.message || 'Delete failed'); }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="rounded-xl border p-4 bg-white grid grid-cols-1 md:grid-cols-6 gap-3">
        <input required placeholder="ID" className="input border p-2 rounded" value={form.id} onChange={(e)=>setForm({...form,id:e.target.value})} />
        <input placeholder="Name" className="input border p-2 rounded" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} />
        <select required className="border p-2 rounded" value={form.stationId} onChange={(e)=>setForm({...form,stationId:e.target.value})}>
          <option value="">Station</option>
          {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input required placeholder="Type" className="input border p-2 rounded" value={form.type} onChange={(e)=>setForm({...form,type:e.target.value})} />
        <input required placeholder="Plate" className="input border p-2 rounded" value={form.plate} onChange={(e)=>setForm({...form,plate:e.target.value})} />
        <input required type="number" min="0" placeholder="Price/h" className="input border p-2 rounded" value={form.pricePerHour} onChange={(e)=>setForm({...form,pricePerHour:e.target.value})} />
        <input type="file" accept="image/*" onChange={(e)=>setImageFile(e.target.files?.[0]||null)} className="md:col-span-3" />
        <input placeholder="Or paste Image URL (optional)" className="border p-2 rounded md:col-span-3" value={imageUrlInput} onChange={(e)=>setImageUrlInput(e.target.value)} />
        <button disabled={submitting} className="btn-soild md:col-span-3">{submitting? 'Saving...':'Add Vehicle'}</button>
      </form>
      {submitError && (
        <div className="text-red-600 text-sm mt-2">{submitError}</div>
      )}

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map((v)=> (
            <div key={v.id} className="rounded-xl border p-4 bg-white">
              {v.imageUrl && <img src={v.imageUrl} alt={v.name||v.id} className="w-full h-40 object-contain mb-3 bg-gray-50 rounded" />}
              <div className="font-semibold">{v.name || v.id}</div>
              <div className="text-sm text-gray-500 capitalize">{v.type} · {v.plate}</div>
              <div className="text-sm">{v.pricePerHour} đ/giờ</div>
              <div className="mt-3 flex gap-2">
                <button onClick={()=>onDelete(v.id)} className="btn-outline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StationsAdmin() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', address: '', lat: '', lng: '' });

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listStations();
      const data = res?.data ?? res; setStations(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message || 'Failed'); } finally { setLoading(false); }
  };
  useEffect(()=>{ refresh(); },[]);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await createStation({ ...form, lat: Number(form.lat), lng: Number(form.lng) });
      setForm({ name: '', address: '', lat: '', lng: '' });
      await refresh();
    } catch (e) { alert(e.message || 'Create failed'); }
  };

  const onDelete = async (id) => {
    if (!confirm('Delete station?')) return;
    try { await deleteStation(id); await refresh(); } catch (e) { alert(e.message || 'Delete failed'); }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="rounded-xl border p-4 bg-white grid grid-cols-1 md:grid-cols-5 gap-3">
        <input required placeholder="Name" className="border p-2 rounded" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} />
        <input placeholder="Address" className="border p-2 rounded" value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})} />
        <input required type="number" step="any" placeholder="Lat" className="border p-2 rounded" value={form.lat} onChange={(e)=>setForm({...form,lat:e.target.value})} />
        <input required type="number" step="any" placeholder="Lng" className="border p-2 rounded" value={form.lng} onChange={(e)=>setForm({...form,lng:e.target.value})} />
        <button className="btn-soild">Add Station</button>
      </form>

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map(s => (
            <div key={s.id} className="rounded-xl border p-4 bg-white">
              <div className="font-semibold">{s.name}</div>
              <div className="text-sm text-gray-500">{s.address}</div>
              <div className="text-xs text-gray-400">{s.lat}, {s.lng}</div>
              <div className="mt-3"><button onClick={()=>onDelete(s.id)} className="btn-outline">Delete</button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { listBookings } from '../api/rental';
function BookingsAdmin() {
  const [items, setItems] = useState([]);
  const [vehicleMap, setVehicleMap] = useState({});
  const [stationMap, setStationMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(()=>{
    (async()=>{
      try {
        const [bRes, vRes, sRes] = await Promise.all([
          listBookings(),
          listFleetVehicles(),
          listStations(),
        ]);
        const bookings = bRes?.data ?? bRes;
        const vehicles = vRes?.data ?? vRes;
        const stations = sRes?.data ?? sRes;
        setItems(Array.isArray(bookings) ? bookings : []);
        const vMap = {};
        (Array.isArray(vehicles) ? vehicles : []).forEach(v => { vMap[String(v.id)] = v.name || v.id; });
        setVehicleMap(vMap);
        const sMap = {};
        (Array.isArray(stations) ? stations : []).forEach(s => { sMap[String(s.id)] = s.name || s.id; });
        setStationMap(sMap);
      }
      catch(e){ setError(e.message || 'Failed'); }
      finally{ setLoading(false); }
    })();
  },[]);
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  return (
    <div className="rounded-xl border bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">User</th>
              <th className="px-3 py-2 text-left">Vehicle</th>
              <th className="px-3 py-2 text-left">Station</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Start</th>
              <th className="px-3 py-2 text-left">End</th>
            </tr>
          </thead>
          <tbody>
            {items.map(b => (
              <tr key={b.id} className="border-t">
                <td className="px-3 py-2">{b.id}</td>
                <td className="px-3 py-2">{b.userId}</td>
                <td className="px-3 py-2">{vehicleMap[String(b.vehicleId)] || b.vehicleId}</td>
                <td className="px-3 py-2">{stationMap[String(b.stationId)] || b.stationId}</td>
                <td className="px-3 py-2">{b.status}</td>
                <td className="px-3 py-2">{b.startTime}</td>
                <td className="px-3 py-2">{b.endTime || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('vehicles');
  return (
    <div className="max-padd-container py-10">
      <h3 className="mb-6">Admin</h3>
      <div className="flex gap-2 mb-6">
        <button className={`btn-outline ${tab==='vehicles'?'bg-gray-100':''}`} onClick={()=>setTab('vehicles')}>Vehicles</button>
        <button className={`btn-outline ${tab==='stations'?'bg-gray-100':''}`} onClick={()=>setTab('stations')}>Stations</button>
        <button className={`btn-outline ${tab==='bookings'?'bg-gray-100':''}`} onClick={()=>setTab('bookings')}>Bookings</button>
      </div>
      {tab === 'vehicles' && <VehiclesAdmin />}
      {tab === 'stations' && <StationsAdmin />}
      {tab === 'bookings' && <BookingsAdmin />}
    </div>
  );
}

