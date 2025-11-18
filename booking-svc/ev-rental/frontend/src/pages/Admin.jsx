import React, { useEffect, useState } from 'react';
import {
  listFleetVehicles,
  createFleetVehicle,
  updateVehicleStatus,
  deleteFleetVehicle,
  presignUpload,
  listIncidents,
  createIncident,
  resolveIncident,
} from '../api/fleet';
import { listStations, createStation, deleteStation, listBookings, returnBooking } from '../api/rental';

function VehiclesAdmin() {
  const [items, setItems] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ id: '', name: '', stationId: '', type: '', plate: '', pricePerDay: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [edits, setEdits] = useState({});
  const [updatingId, setUpdatingId] = useState('');
  const [updateError, setUpdateError] = useState('');

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

  useEffect(() => {
    setEdits((prev) => {
      const next = { ...prev };
      items.forEach((v) => {
        if (!next[v.id]) {
          next[v.id] = {
            isAvailable: !!v.isAvailable,
            description: v.description || '',
            batteryLevel: v.batteryLevel ?? '',
            pricePerDay: v.pricePerDay ?? '',
          };
        }
      });
      return next;
    });
  }, [items]);

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
          setImageUrlInput(publicUrl);
        } catch (e) {
          setSubmitError(`Upload error: ${e.message}`);
          const proceed = confirm(`Upload presign/put failed (${e.message}).\nYou can continue without upload or paste a public Image URL. Continue without upload?`);
          if (!proceed) return;
        }
      }
      const payload = {
        ...form,
        pricePerDay: Number(form.pricePerDay) || 0,
        description: form.description?.trim() || undefined,
        ...(imageUrl ? { imageUrl } : {}),
      };
      await createFleetVehicle(payload);
      setForm({ id: '', name: '', stationId: '', type: '', plate: '', pricePerDay: '', description: '' });
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

  const applyEdit = (id, patch) => {
    setEdits((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
  };

  const onUpdate = async (id) => {
    const edit = edits[id] || {};
    setUpdatingId(id);
    setUpdateError('');
    try {
      await updateVehicleStatus(id, {
        isAvailable: !!edit.isAvailable,
        description: edit.description ?? '',
        ...(edit.batteryLevel !== '' ? { batteryLevel: Number(edit.batteryLevel) } : {}),
        ...(edit.pricePerDay !== '' ? { pricePerDay: Number(edit.pricePerDay) } : {}),
      });
      await refresh();
    } catch (e) {
      setUpdateError(e.message || 'Update failed');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="rounded-xl border p-4 bg-white grid grid-cols-1 md:grid-cols-6 gap-3">
        <input required placeholder="ID" className="input border p-2 rounded" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
        <input placeholder="Name" className="input border p-2 rounded" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select required className="border p-2 rounded" value={form.stationId} onChange={(e) => setForm({ ...form, stationId: e.target.value })}>
          <option value="">Station</option>
          {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input required placeholder="Type" className="input border p-2 rounded" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
        <input required placeholder="Plate" className="input border p-2 rounded" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} />
        <input required type="number" min="0" placeholder="Price/day" className="input border p-2 rounded" value={form.pricePerDay} onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })} />
        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="md:col-span-3" />
        <input placeholder="Or paste Image URL (optional)" className="border p-2 rounded md:col-span-3" value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} />
        <textarea placeholder="Description (optional)" className="border p-2 rounded md:col-span-6" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button disabled={submitting} className="btn-soild md:col-span-3">{submitting ? 'Saving...' : 'Add Vehicle'}</button>
      </form>
      {submitError && <div className="text-red-600 text-sm mt-2">{submitError}</div>}
      {updateError && <div className="text-red-600 text-sm mt-1">{updateError}</div>}

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map((v) => {
            const edit = edits[v.id] || { isAvailable: !!v.isAvailable, description: v.description || '', batteryLevel: v.batteryLevel ?? '', pricePerDay: v.pricePerDay ?? '' };
            return (
              <div key={v.id} className="rounded-xl border p-4 bg-white">
                {v.imageUrl && <img src={v.imageUrl} alt={v.name || v.id} className="w-full h-40 object-contain mb-3 bg-gray-50 rounded" />}
                <div className="font-semibold">{v.name || v.id}</div>
                <div className="text-sm text-gray-500 capitalize">{v.type} • {v.plate}</div>
                <div className="text-sm">{(v.pricePerDay || 0).toLocaleString('vi-VN')} đ/ngày</div>

                <div className="mt-3 text-sm">
                  <div className="font-semibold mb-1">Trạng thái</div>
                  <select
                    className="border p-2 rounded w-full"
                    value={edit.isAvailable ? 'true' : 'false'}
                    onChange={(e) => applyEdit(v.id, { isAvailable: e.target.value === 'true' })}
                  >
                    <option value="true">Sẵn sàng</option>
                    <option value="false">Không sẵn sàng</option>
                  </select>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold">Pin (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="border p-2 rounded"
                      value={edit.batteryLevel}
                      onChange={(e) => applyEdit(v.id, { batteryLevel: e.target.value })}
                      placeholder="0-100"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold">Giá (/ngày)</span>
                    <input
                      type="number"
                      min="0"
                      className="border p-2 rounded"
                      value={edit.pricePerDay}
                      onChange={(e) => applyEdit(v.id, { pricePerDay: e.target.value })}
                      placeholder="VND/ngày"
                    />
                  </label>
                </div>

                <div className="mt-3 text-sm">
                  <div className="font-semibold mb-1">Mô tả</div>
                  <textarea
                    className="border p-2 rounded w-full text-sm"
                    rows={3}
                    value={edit.description}
                    onChange={(e) => applyEdit(v.id, { description: e.target.value })}
                    placeholder="Mô tả xe"
                  />
                </div>

                <div className="mt-3 flex gap-2">
                  <button disabled={updatingId === v.id} onClick={() => onUpdate(v.id)} className="btn-soild">
                    {updatingId === v.id ? 'Saving...' : 'Update'}
                  </button>
                  <button onClick={() => onDelete(v.id)} className="btn-outline">Delete</button>
                </div>
              </div>
            );
          })}
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
  useEffect(() => { refresh(); }, []);

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
        <input required placeholder="Name" className="border p-2 rounded" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Address" className="border p-2 rounded" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input required type="number" step="any" placeholder="Lat" className="border p-2 rounded" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
        <input required type="number" step="any" placeholder="Lng" className="border p-2 rounded" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
        <button className="btn-soild">Add Station</button>
      </form>

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map((s) => (
            <div key={s.id} className="rounded-xl border p-4 bg-white">
              <div className="font-semibold">{s.name}</div>
              <div className="text-sm text-gray-500">{s.address}</div>
              <div className="text-xs text-gray-500">({s.lat}, {s.lng})</div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => onDelete(s.id)} className="btn-outline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IncidentsAdmin() {
  const [items, setItems] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ vehicleId: '', stationId: '', severity: 'LOW', desc: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const [iRes, vRes, sRes] = await Promise.all([listIncidents(), listFleetVehicles(), listStations()]);
      const iData = iRes?.data ?? iRes;
      const vData = vRes?.data ?? vRes;
      const sData = sRes?.data ?? sRes;
      setItems(Array.isArray(iData) ? iData : []);
      setVehicles(Array.isArray(vData) ? vData : []);
      setStations(Array.isArray(sData) ? sData : []);
    } catch (e) {
      setError(e.message || 'Failed to load incidents');
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
      if (!form.vehicleId || !form.stationId || !form.desc.trim()) {
        throw new Error('Vui lòng chọn xe, trạm và nhập mô tả');
      }
      await createIncident({
        vehicleId: form.vehicleId,
        stationId: form.stationId,
        severity: form.severity,
        desc: form.desc.trim(),
        reporterId: 'admin-ui',
        photos: [],
      });
      setForm({ vehicleId: '', stationId: '', severity: 'LOW', desc: '' });
      await refresh();
    } catch (e) {
      setSubmitError(e.message || 'Tạo sự cố thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const vehicleName = (id) => {
    const v = vehicles.find(x => String(x.id) === String(id));
    return v ? (v.name || v.id) : id;
  };
  const stationName = (id) => {
    const s = stations.find(x => String(x.id) === String(id));
    return s ? (s.name || s.id) : id;
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="rounded-xl border p-4 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <select required className="border p-2 rounded" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
          <option value="">Chọn xe</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.name || v.id}</option>)}
        </select>
        <select required className="border p-2 rounded" value={form.stationId} onChange={(e) => setForm({ ...form, stationId: e.target.value })}>
          <option value="">Chọn trạm</option>
          {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="border p-2 rounded" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
        </select>
        <textarea required rows={2} className="border p-2 rounded md:col-span-2 lg:col-span-4" placeholder="Mô tả sự cố" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
        <button className="btn-soild md:col-span-2 lg:col-span-4" disabled={submitting}>{submitting ? 'Saving...' : 'Report Incident'}</button>
      </form>
      {submitError && <div className="text-red-600 text-sm">{submitError}</div>}

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="rounded-xl border bg-white overflow-x-auto">
          <table className="min-w-full text-sm table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Xe</th>
                <th className="px-3 py-2 text-left">Trạm</th>
                <th className="px-3 py-2 text-left">Mức độ</th>
                <th className="px-3 py-2 text-left">Trạng thái</th>
                <th className="px-3 py-2 text-left">Mô tả</th>
                <th className="px-3 py-2 text-left">Thời gian</th>
                <th className="px-3 py-2 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="px-3 py-2">{it.id}</td>
                  <td className="px-3 py-2">{vehicleName(it.vehicleId)}</td>
                  <td className="px-3 py-2">{stationName(it.stationId)}</td>
                  <td className="px-3 py-2">{it.severity || 'LOW'}</td>
                  <td className="px-3 py-2 capitalize">{(it.status || 'OPEN').toLowerCase()}</td>
                  <td className="px-3 py-2 whitespace-pre-wrap">{it.desc}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{it.createdAt}</td>
                  <td className="px-3 py-2">
                    {it.status !== 'RESOLVED' ? (
                      <button
                        className="btn-outline"
                        onClick={async () => {
                          try {
                            await resolveIncident(it.id);
                            await refresh();
                          } catch (e) {
                            alert(e.message || 'Resolve failed');
                          }
                        }}
                      >
                        Xử lý xong
                      </button>
                    ) : (
                      <span className="text-gray-500 text-xs">Đã xử lý</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && <div className="p-4 text-gray-500 text-sm">Chưa có sự cố nào.</div>}
        </div>
      )}
    </div>
  );
}

function BookingsAdmin() {
  const [items, setItems] = useState([]);
  const [vehicleMap, setVehicleMap] = useState({});
  const [stationMap, setStationMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    (async () => {
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
      catch (e) { setError(e.message || 'Failed'); }
      finally { setLoading(false); }
    })();
  }, []);
  const onReturn = async (id) => {
    if (!confirm('Mark this booking as returned?')) return;
    try {
      const res = await returnBooking(id);
      const data = res?.data ?? res;
      setItems((arr) => arr.map(it => it.id === id ? { ...it, ...data } : it));
    } catch (e) { alert(e.message || 'Return failed'); }
  };

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
              <th className="px-3 py-2 text-left">Actions</th>
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
                <td className="px-3 py-2">
                  {b.status !== 'RETURNED' ? (
                    <button className="btn-outline" onClick={() => onReturn(b.id)}>Return</button>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
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
        <button className={`btn-outline ${tab === 'vehicles' ? 'bg-gray-100' : ''}`} onClick={() => setTab('vehicles')}>Vehicles</button>
        <button className={`btn-outline ${tab === 'stations' ? 'bg-gray-100' : ''}`} onClick={() => setTab('stations')}>Stations</button>
        <button className={`btn-outline ${tab === 'bookings' ? 'bg-gray-100' : ''}`} onClick={() => setTab('bookings')}>Bookings</button>
        <button className={`btn-outline ${tab === 'incidents' ? 'bg-gray-100' : ''}`} onClick={() => setTab('incidents')}>Incidents</button>
      </div>
      {tab === 'vehicles' && <VehiclesAdmin />}
      {tab === 'stations' && <StationsAdmin />}
      {tab === 'bookings' && <BookingsAdmin />}
      {tab === 'incidents' && <IncidentsAdmin />}
    </div>
  );
}
