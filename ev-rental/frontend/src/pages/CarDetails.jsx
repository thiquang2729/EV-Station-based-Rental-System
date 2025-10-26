import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFleetVehicle } from '../api/fleet';

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
        </div>
      </div>
    </div>
  );
}
export default CarDetails;
