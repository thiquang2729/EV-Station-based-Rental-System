import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFleetVehicle } from '../api/fleet';
import { createBooking } from '../api/rental';

function formatPriceVND(p) {
  if (p === null || p === undefined) return '-';
  try { return `${Number(p).toLocaleString('vi-VN')} đ/giờ`; } catch { return `${p} đ/giờ`; }
}

export const CarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking state
  const [start, setStart] = useState(() => { const d = new Date(); d.setMinutes(0, 0, 0); return d; });
  const [end, setEnd] = useState(() => { const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0); return d; });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getFleetVehicle(id)
      .then((res) => {
        if (!mounted) return;
        const data = res?.data ?? res;
        setItem(data || null);
      })
      .catch((e) => mounted && setError(e.message || 'Failed to load vehicle'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="max-padd-container py-10">Đang tải…</div>;
  if (error) return <div className="max-padd-container py-10 text-red-600">{error}</div>;
  if (!item) return <div className="max-padd-container py-10">Không tìm thấy xe.</div>;

  const desc = item.description || item.desc || item.details || '';
  const pricePerHour = Number(item.pricePerHour || 0);
  const estHours = useMemo(() => {
    const ms = Math.max(0, end - start);
    return Math.max(1, Math.ceil(ms / 3600000));
  }, [start, end]);
  const estPrice = pricePerHour * estHours;

  function toInputValue(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const onBook = async () => {
    setSubmitting(true);
    setSubmitMsg('');
    try {
      if (!item?.id) throw new Error('Thiếu thông tin xe');
      if (!(end > start)) throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
      const payload = {
        vehicleId: String(item.id),
        startTime: new Date(start).toISOString(),
        estDurationH: estHours,
        userId: 'dev-user',
      };
      const res = await createBooking(payload);
      const data = res?.data ?? res;
      setSubmitMsg(`Đặt xe thành công. Mã booking: ${data?.id || 'N/A'}. Ước tính: ${estPrice.toLocaleString('vi-VN')} đ`);
    } catch (e) {
      setSubmitMsg(e.message || 'Đặt xe thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-padd-container py-10">
      <button className="mb-6 btn-outline" onClick={() => navigate(-1)}>⬅ Quay lại</button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-4 flex items-center justify-center min-h-[280px]">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name || item.id} className="max-h-[420px] w-full object-contain" />
          ) : (
            <div className="text-gray-400">Không có ảnh</div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-2">{item.name || item.id}</h3>
          <div className="text-sm text-gray-600 capitalize mb-2">Loại: {item.type || 'Không rõ'}</div>
          <div className="mb-2 flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${item.isAvailable ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            <span className="text-sm">Trạng thái: {item.isAvailable ? 'Sẵn sàng' : 'Không sẵn sàng'}</span>
          </div>
          <div className="mb-4 font-semibold">Giá thuê: {formatPriceVND(item.pricePerHour)}</div>
          <div>
            <div className="font-semibold mb-1">Mô tả</div>
            <div className="text-sm text-gray-700 whitespace-pre-line">{desc || 'Không có mô tả'}</div>
          </div>
          <div className="h-px bg-gray-200 my-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm">Bắt đầu
              <input type="datetime-local" className="border p-2 rounded w-full"
                value={toInputValue(start)}
                onChange={(e) => { const d = new Date(e.target.value); if (!isNaN(d)) setStart(d); }} />
            </label>
            <label className="text-sm">Kết thúc
              <input type="datetime-local" className="border p-2 rounded w-full"
                value={toInputValue(end)}
                onChange={(e) => { const d = new Date(e.target.value); if (!isNaN(d)) setEnd(d); }} />
            </label>
          </div>
          <div className="mt-3 text-sm text-gray-700">Thời lượng ước tính: <span className="font-semibold">{estHours} giờ</span></div>
          <div className="mt-1 text-sm">Tạm tính: <span className="font-semibold">{estPrice.toLocaleString('vi-VN')} đ</span></div>
          <div className="mt-4">
            <button disabled={!item.isAvailable || submitting} className="btn-soild"
              onClick={onBook}>
              {submitting ? 'Đang đặt...' : (item.isAvailable ? 'Đặt xe' : 'Không thể đặt')}
            </button>
          </div>
          {submitMsg && <div className="mt-2 text-sm">{submitMsg}</div>}
        </div>
      </div>
    </div>
  );
}
export default CarDetails;


