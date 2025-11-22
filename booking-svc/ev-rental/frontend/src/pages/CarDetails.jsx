import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFleetVehicle } from '../api/fleet';
import { createBooking, getStation, listStations } from '../api/rental';

function formatPricePerDay(vnd) {
  if (vnd === null || vnd === undefined) return '-';
  const suffix = ' đ/ngày';
  try { return Number(vnd).toLocaleString('vi-VN') + suffix; } catch { return String(vnd) + suffix; }
}

export default function CarDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState(() => {
    const s = new Date(); s.setHours(0, 0, 0, 0);
    const e = new Date(); e.setDate(e.getDate() + 1); e.setHours(0, 0, 0, 0);
    return { item: null, loading: true, error: '', start: s, end: e, submitting: false, submitMsg: '' };
  });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [stationLabel, setStationLabel] = useState('');
  const [stations, setStations] = useState([]);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    email: '',
    stationId: '',
    note: '',
    paymentMethod: 'payment',
    acceptPayment: true,
    acceptShare: true,
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

  // Load list of stations
  useEffect(() => {
    let mounted = true;
    listStations()
      .then((res) => {
        if (!mounted) return;
        const data = res?.data ?? res;
        setStations(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to load stations:', err);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (item?.stationName) {
      setStationLabel(item.stationName);
      return;
    }
    if (!item?.stationId) {
      setStationLabel('');
      return;
    }
    let cancelled = false;
    getStation(item.stationId)
      .then((res) => {
        if (cancelled) return;
        const data = res?.data ?? res;
        setStationLabel(data?.name || `Trạm ${item.stationId}`);
      })
      .catch(() => {
        if (!cancelled) setStationLabel(`Trạm ${item.stationId}`);
      });
    return () => { cancelled = true; };
  }, [item?.stationId, item?.stationName]);

  useEffect(() => {
    // Set default station to vehicle's station when form is empty
    if (item?.stationId && !bookingForm.stationId) {
      setBookingForm((prev) => ({ ...prev, stationId: item.stationId }));
    }
  }, [item?.stationId]);
  if (loading) return <div className="max-padd-container py-10">Đang tải...</div>;
  if (error) return <div className="max-padd-container py-10 text-red-600">{error}</div>;
  if (!item) return <div className="max-padd-container py-10">Không tìm thấy xe.</div>;

  const desc = item.description || item.desc || item.details || '';
  const pricePerDay = Number(item.pricePerDay || 0); // giá lưu theo ngày
  const startMid = new Date(start); startMid.setHours(0, 0, 0, 0);
  const endMid = new Date(end); endMid.setHours(0, 0, 0, 0);
  const ms = Math.max(0, endMid - startMid);
  const estDays = Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  const estPrice = pricePerDay * estDays;

  function toDateValue(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  const markVehicleUnavailable = () => {
    setState((st) => ({
      ...st,
      item: st.item ? { ...st.item, isAvailable: false } : st.item,
    }));
  };

  const onBook = async () => {
    setState((st) => ({ ...st, submitting: true, submitMsg: '' }));
    try {
      if (!item?.id) throw new Error('Thiếu thông tin xe');
      if (!(endMid > startMid)) throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
      const payload = {
        vehicleId: String(item.id),
        startTime: new Date(startMid).toISOString(),
        estDurationH: estDays * 24, // backend expects hours
        userId: 'dev-user',
        ...(bookingForm.stationId && { stationId: String(bookingForm.stationId) }), // Thêm stationId nếu có
      };
      const res = await createBooking(payload);
      const data = res?.data ?? res;
      markVehicleUnavailable();
      // Chuyển sang billing frontend để chọn phương thức thanh toán
      const bookingId = data?.id;
      const amount = estPrice;
      if (bookingId && amount) {
        setState((st) => ({
          ...st,
          item: st.item ? { ...st.item, isAvailable: false } : st.item,
          submitting: false,
        }));
        window.location.href = `http://localhost:5173/?bookingId=${encodeURIComponent(bookingId)}&amount=${encodeURIComponent(amount)}`;
        return true;
      }
      setState((st) => ({
        ...st,
        item: st.item ? { ...st.item, isAvailable: false } : st.item,
        submitMsg: `Đặt xe thành công. Mã booking: ${data?.id || 'N/A'}. Ước tính: ${estPrice.toLocaleString('vi-VN')} đ`,
        submitting: false,
      }));
      return true;
    } catch (e) {
      setState((st) => ({ ...st, submitMsg: (e && e.message) || 'Đặt xe thất bại', submitting: false }));
      return false;
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.acceptPayment || !bookingForm.acceptShare) {
      setState((st) => ({ ...st, submitMsg: 'Vui lòng đồng ý với điều khoản trước khi thanh toán.', submitting: false }));
      return;
    }
    const ok = await onBook();
    if (ok) setShowBookingModal(false);
  };

  return (
    <div className="max-padd-container py-10">
      <button className="mb-6 btn-outline" onClick={() => navigate(-1)}> Quay lại</button>

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
          <div className="mb-4 font-semibold">Giá thuê: {formatPricePerDay(pricePerDay)}</div>
          <div>
            <div className="font-semibold mb-1">Mô tả</div>
            <div className="text-sm text-gray-700 whitespace-pre-line">{desc?.trim() || 'Không có mô tả'}</div>
          </div>
          <div className="h-px bg-gray-200 my-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm">Bắt đầu
              <input type="date" className="border p-2 rounded w-full"
                value={toDateValue(start)}
                onChange={(e) => { const d = new Date(e.target.value); if (!isNaN(d)) { d.setHours(0, 0, 0, 0); setState((st) => ({ ...st, start: d })); } }} />
            </label>
            <label className="text-sm">Kết thúc
              <input type="date" className="border p-2 rounded w-full"
                value={toDateValue(end)}
                onChange={(e) => { const d = new Date(e.target.value); if (!isNaN(d)) { d.setHours(0, 0, 0, 0); setState((st) => ({ ...st, end: d })); } }} />
            </label>
          </div>
          <div className="mt-3 text-sm text-gray-700">Thời lượng ước tính: <span className="font-semibold">{estDays} ngày</span></div>
          <div className="mt-1 text-sm">Tạm tính: <span className="font-semibold">{estPrice.toLocaleString('vi-VN')} đ</span></div>
          <div className="mt-4">
            <button
              type="button"
              disabled={!item.isAvailable}
              className={`btn-soild ${!item.isAvailable ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={() => item.isAvailable && setShowBookingModal(true)}
            >
              {item.isAvailable ? 'Đăng ký thuê ngay' : 'Không thể đặt'}
            </button>
          </div>
          {submitMsg && <div className="mt-2 text-sm">{submitMsg}</div>}
        </div>
      </div>
      {showBookingModal && (
        <BookingModal
          item={item}
          start={startMid}
          end={endMid}
          estDays={estDays}
          estPrice={estPrice}
          bookingForm={bookingForm}
          setBookingForm={setBookingForm}
          submitting={submitting}
          submitMsg={submitMsg}
          stations={stations}
          onClose={() => !submitting && setShowBookingModal(false)}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
}

function BookingModal({
  item,
  start,
  end,
  estDays,
  estPrice,
  bookingForm,
  setBookingForm,
  submitting,
  submitMsg,
  stations,
  onClose,
  onSubmit,
}) {
  const updateField = (field, value) => setBookingForm((prev) => ({ ...prev, [field]: value }));
  const currency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;
  const formatDateTime = (d) => {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('vi-VN', {
      hour12: false,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalDue = Math.max(0, estPrice);
  const selectedStation = stations.find((s) => String(s.id) === String(bookingForm.stationId));
  const summaryLocation = selectedStation ? selectedStation.name : 'Chọn trạm nhận xe';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h3 className="text-2xl font-semibold">Đăng ký thuê xe</h3>
            <p className="text-sm text-gray-500">Hoàn tất thông tin để xác nhận đơn đặt xe.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100"
          >
            <span className="sr-only">Đóng</span>
            &times;
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 max-h-[80vh] overflow-y-auto bg-white">
          <form className="space-y-4 lg:col-span-2 bg-white" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="text-sm font-medium">
                Tên người thuê*
                <input
                  required
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                  value={bookingForm.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Số điện thoại*
                <input
                  required
                  type="tel"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                  value={bookingForm.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Email*
                <input
                  required
                  type="email"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                  value={bookingForm.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </label>
            </div>

            <label className="text-sm font-medium">
              Nơi nhận xe*
              <select
                required
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                value={bookingForm.stationId}
                onChange={(e) => updateField('stationId', e.target.value)}
              >
                <option value="">Chọn trạm nhận xe</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name} {station.address ? `- ${station.address}` : ''}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-gray-500">Chọn trạm bạn muốn nhận xe.</span>
            </label>

            <label className="text-sm font-medium">
              Ghi chú
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                value={bookingForm.note}
                onChange={(e) => updateField('note', e.target.value)}
                placeholder="Nội dung cần lưu ý"
              />
            </label>

            <label className="text-sm font-medium">
              Phương thức thanh toán
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 bg-gray-100 text-gray-700"
                value="Thanh toán qua Payment"
                readOnly
              />
            </label>

            <div className="space-y-3 rounded-2xl border border-gray-200 p-4 bg-gray-50">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-black"
                  checked={bookingForm.acceptPayment}
                  onChange={(e) => updateField('acceptPayment', e.target.checked)}
                />
                <span>
                  Đã đọc và đồng ý với{' '}
                  <a href="#" className="text-emerald-600 underline">
                    Điều khoản thanh toán
                  </a>{' '}
                  của Green Future
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-black"
                  checked={bookingForm.acceptShare}
                  onChange={(e) => updateField('acceptShare', e.target.checked)}
                />
                <span>
                  Tôi đồng ý để lại thông tin cá nhân theo{' '}
                  <a href="#" className="text-emerald-600 underline">
                    Điều khoản chia sẻ dữ liệu
                  </a>
                  .
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className={`btn-soild min-w-[180px] ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {submitting ? 'Đang đặt...' : 'Thanh toán'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-outline min-w-[120px]"
                disabled={submitting}
              >
                Hủy
              </button>
            </div>
            {submitMsg && <div className="text-sm text-gray-600">{submitMsg}</div>}
          </form>

          <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5">
            <div className="flex gap-3">
              <div className="h-20 w-20 overflow-hidden rounded-2xl bg-white">
                {item?.imageUrl ? (
                  <img src={item.imageUrl} alt={item?.name || item?.id} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">Không có ảnh</div>
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm uppercase text-gray-500">{item?.type || 'Dòng xe'}</div>
                <div className="text-lg font-semibold">{item?.name || item?.id}</div>
                <div className="text-sm text-gray-500">Hình thức thuê: Theo ngày</div>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
              <div>
                <div className="text-xs text-gray-500">Nơi nhận xe</div>
                <div className="font-semibold">{summaryLocation}</div>
              </div>
              <div className="border-t border-dashed" />
              <div>
                <div className="text-xs text-gray-500">Thời gian thuê</div>
                <div className="font-semibold">{estDays} ngày</div>
                <div className="text-xs text-gray-500">{formatDateTime(start)} → {formatDateTime(end)}</div>
              </div>
              <div className="border-t border-dashed" />
              <div className="text-xs text-gray-500">
                Phương thức thanh toán: <span className="font-medium text-gray-900">Payment</span>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Cước phí niêm yết</span>
                <span>{currency(estPrice)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Tổng tiền</span>
                <span>{currency(totalDue)}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-gray-500">Thanh toán*</div>
              <div className="text-2xl font-semibold text-emerald-600">{currency(totalDue)}</div>
              <p className="text-xs text-gray-500">*Giá thuê xe đã bao gồm VAT.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
