import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFleetVehicle } from '../api/fleet';
import { createBooking } from '../api/rental';

function formatPricePerDay(vnd) {
  if (vnd === null || vnd === undefined) return '-';
  const suffix = ' ' + String.fromCharCode(0x0111) + '/ng' + String.fromCharCode(0x00E0) + 'y'; // " đ/ngày"
  try { return Number(vnd).toLocaleString('vi-VN') + suffix; } catch { return String(vnd) + suffix; }
}

export default function CarDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState(() => {
    const s = new Date(); s.setHours(0,0,0,0);
    const e = new Date(); e.setDate(e.getDate()+1); e.setHours(0,0,0,0);
    return { item: null, loading: true, error: '', start: s, end: e, submitting: false, submitMsg: '' };
  });

  useEffect(() => {
    let mounted = true;
    setState((st) => ({ ...st, loading: true, error: '' }));
    getFleetVehicle(id)
      .then((res) => {
        if (!mounted) return;
        const data = res?.data ?? res;
        setState((st) => ({ ...st, item: data || null, loading: false }));
      })
      .catch((e) => { if (mounted) setState((st) => ({ ...st, error: e.message || 'Failed to load vehicle', loading: false })); });
    return () => { mounted = false; };
  }, [id]);

  const { item, loading, error, start, end, submitting, submitMsg } = state;
  if (loading) return <div className="max-padd-container py-10">Dang tai...</div>;
  if (error) return <div className="max-padd-container py-10 text-red-600">{error}</div>;
  if (!item) return <div className="max-padd-container py-10">Khong tim thay xe.</div>;

  const desc = item.description || item.desc || item.details || '';
  const pricePerDay = Number(item.pricePerHour || 0) * 24; // convert hourly to daily for display/estimate
  const startMid = new Date(start); startMid.setHours(0,0,0,0);
  const endMid = new Date(end); endMid.setHours(0,0,0,0);
  const ms = Math.max(0, endMid - startMid);
  const estDays = Math.max(1, Math.ceil(ms / (24*60*60*1000)));
  const estPrice = pricePerDay * estDays;

  function toDateValue(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }

  const onBook = async () => {
    setState((st) => ({ ...st, submitting: true, submitMsg: '' }));
    try {
      if (!item?.id) throw new Error('Thieu thong tin xe');
      if (!(endMid > startMid)) throw new Error('Thoi gian ket thuc phai sau thoi gian bat dau');
      const payload = {
        vehicleId: String(item.id),
        startTime: new Date(startMid).toISOString(),
        estDurationH: estDays * 24, // backend expects hours
        userId: 'dev-user',
      };
      const res = await createBooking(payload);
      const data = res?.data ?? res;
      // Chuyển sang billing frontend để chọn phương thức thanh toán
      const bookingId = data?.id;
      const amount = estPrice;
      if (bookingId && amount) {
        window.location.href = `http://localhost:5173/?bookingId=${encodeURIComponent(bookingId)}&amount=${encodeURIComponent(amount)}`;
        return;
      }
      setState((st) => ({ ...st, submitMsg: `Dat xe thanh cong. Ma booking: ${data?.id || 'N/A'}. Uoc tinh: ${estPrice.toLocaleString('vi-VN')} \u0111`, submitting: false }));
    } catch (e) {
      setState((st) => ({ ...st, submitMsg: (e && e.message) || 'Dat xe that bai', submitting: false }));
    }
  };

  return (
    <div className="max-padd-container py-10">
      <button className="mb-6 btn-outline" onClick={() => navigate(-1)}>\u2B05 Quay lai</button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-4 flex items-center justify-center min-h-[280px]">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name || item.id} className="max-h-[420px] w-full object-contain" />
          ) : (
            <div className="text-gray-400">Khong co anh</div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-2">{item.name || item.id}</h3>
          <div className="text-sm text-gray-600 capitalize mb-2">Loai: {item.type || 'Khong ro'}</div>
          <div className="mb-2 flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${item.isAvailable ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            <span className="text-sm">Trang thai: {item.isAvailable ? 'San sang' : 'Khong san sang'}</span>
          </div>
          <div className="mb-4 font-semibold">Gia thue: {formatPricePerDay(pricePerDay)}</div>
          <div>
            <div className="font-semibold mb-1">Mo ta</div>
            <div className="text-sm text-gray-700 whitespace-pre-line">{desc || 'Khong co mo ta'}</div>
          </div>
          <div className="h-px bg-gray-200 my-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm">Bat dau
              <input type="date" className="border p-2 rounded w-full"
                value={toDateValue(start)}
                onChange={(e) => { const d = new Date(e.target.value); if (!isNaN(d)) { d.setHours(0,0,0,0); setState((st) => ({ ...st, start: d })); } }} />
            </label>
            <label className="text-sm">Ket thuc
              <input type="date" className="border p-2 rounded w-full"
                value={toDateValue(end)}
                onChange={(e) => { const d = new Date(e.target.value); if (!isNaN(d)) { d.setHours(0,0,0,0); setState((st) => ({ ...st, end: d })); } }} />
            </label>
          </div>
          <div className="mt-3 text-sm text-gray-700">Thoi luong uoc tinh: <span className="font-semibold">{estDays} ngay</span></div>
          <div className="mt-1 text-sm">Tam tinh: <span className="font-semibold">{estPrice.toLocaleString('vi-VN')} \u0111</span></div>
          <div className="mt-4">
            <button disabled={!item.isAvailable || submitting} className="btn-soild" onClick={onBook}>
              {submitting ? 'Dang dat...' : (item.isAvailable ? 'Dat xe' : 'Khong the dat')}
            </button>
          </div>
          {submitMsg && <div className="mt-2 text-sm">{submitMsg}</div>}
        </div>
      </div>
    </div>
  );
}

