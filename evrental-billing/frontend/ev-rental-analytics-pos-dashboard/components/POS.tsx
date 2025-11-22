
import React, { useState, useEffect, useContext } from 'react';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Select from './ui/Select';
import { Payment, PaymentMethod, PaymentStatus } from '../types';
import { AuthContext } from '../contexts/AuthContext';

const API_BASE_URL = 'http://localhost:9080'; // Gateway URL

/**
 * Fetches transactions from all stations (không filter theo stationId)
 */
const fetchTransactions = async (): Promise<Payment[]> => {
  const url = `${API_BASE_URL}/api/v1/payments?limit=100`; // Lấy tất cả, không filter theo stationId
  console.log('🔵 [BILLING API CALL]', {
    method: 'GET',
    url: url,
    credentials: 'include',
    timestamp: new Date().toISOString()
  });

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include', // Gửi cookie để SSO hoạt động
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Yêu cầu xác thực. Vui lòng đăng nhập lại.');
    }
    throw new Error('Không tải được giao dịch');
  }

  const data = await response.json();
  return data.data || [];
};

/**
 * Creates a new payment at POS (status PENDING - chờ staff confirm)
 */
const createPayment = async (paymentData: {
  bookingId: string;
  stationId: string;
  amount: number;
  method: PaymentMethod;
  description?: string;
}): Promise<Payment> => {
  const url = `${API_BASE_URL}/api/v1/pos/collect`;
  const body = {
    ...paymentData,
    type: 'RENTAL_FEE'
  };
  
  console.log('🔵 [BILLING API CALL]', {
    method: 'POST',
    url: url,
    body: body,
    credentials: 'include',
    timestamp: new Date().toISOString()
  });

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include', // Gửi cookie để SSO hoạt động
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Yêu cầu xác thực. Vui lòng đăng nhập lại.');
    }
    const errorData = await response.json();
    throw new Error(errorData.message || 'Không tạo được thanh toán');
  }

  const data = await response.json();
  return data.data;
};

/**
 * Confirms a pending payment (chỉ staff/admin mới được confirm)
 */
const confirmPayment = async (paymentId: string): Promise<Payment> => {
  const url = `${API_BASE_URL}/api/v1/pos/${paymentId}/confirm`;
  
  console.log('🔵 [BILLING API CALL]', {
    method: 'POST',
    url: url,
    credentials: 'include',
    timestamp: new Date().toISOString()
  });

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include', // Gửi cookie để SSO hoạt động
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Yêu cầu xác thực. Vui lòng đăng nhập lại.');
    }
    const errorData = await response.json();
    throw new Error(errorData.message || 'Không xác nhận được thanh toán');
  }

  const data = await response.json();
  return data.data;
};


// Helper function để extract station name từ description
const extractStationName = (description: string, stationId: string): string => {
  // Format: "EVR Payment {bookingId} - Trạm: {stationName}"
  const match = description.match(/Trạm:\s*(.+?)(?:\s*$|$)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  // Nếu không tìm thấy trong description, trả về stationId
  return stationId || 'Không xác định';
};

const POS: React.FC = () => {
  const { currentUser } = useContext(AuthContext);
  const [transactions, setTransactions] = useState<Payment[]>([]);
  const [bookingId, setBookingId] = useState('');
  const [renterId, setRenterId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(null);
  const [stationsMap, setStationsMap] = useState<Record<string, string>>({});

  const stationId = "S001"; // Station ID để tạo payment mới (có thể lấy từ user context sau)

  // Load stations list để map stationId sang stationName
  const loadStations = async () => {
    try {
      const url = `${API_BASE_URL}/api/v1/stations`;
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const stations = Array.isArray(data) ? data : (data.data || []);
        const map: Record<string, string> = {};
        stations.forEach((station: any) => {
          if (station.id && station.name) {
            map[station.id] = station.name;
          }
        });
        setStationsMap(map);
      }
    } catch (error) {
      console.error('Failed to load stations:', error);
      // Không throw error, chỉ log
    }
  };

  // Load transactions on component mount - chỉ khi có user
  useEffect(() => {
    if (currentUser) {
      loadStations();
    loadTransactions();
    }
  }, [currentUser]);

  const loadTransactions = async () => {
    if (!currentUser) {
      setError('Vui lòng đăng nhập để xem giao dịch');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const data = await fetchTransactions(); // Lấy tất cả transactions từ tất cả trạm
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load transactions';
      // Nếu lỗi authentication, không hiển thị error (sẽ redirect về login)
      if (errorMessage.includes('authentication') || errorMessage.includes('token')) {
        setError('');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Vui lòng đăng nhập để tạo thanh toán');
      return;
    }
    if (!bookingId || !renterId || !amount) {
        setError('Mã đặt xe, Mã người thuê và Số tiền là bắt buộc.');
        return;
    }
    setError('');
    setIsSubmitting(true);
    
    try {
      const newPayment = await createPayment({
        bookingId,
        stationId,
        amount: Number(amount),
        method,
        description
      });
      
      setTransactions(prev => [newPayment, ...prev]);
      
      // Reset form
      setBookingId('');
      setRenterId('');
      setAmount('');
      setDescription('');
      setMethod(PaymentMethod.CASH);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment';
      // Nếu lỗi authentication, không hiển thị error (sẽ redirect về login)
      if (errorMessage.includes('authentication') || errorMessage.includes('token')) {
        setError('');
      } else {
      setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPayment = async (paymentId: string) => {
    if (!currentUser) {
      setError('Vui lòng đăng nhập để xác nhận thanh toán');
      return;
    }
    setConfirmingPaymentId(paymentId);
    setError('');
    try {
      await confirmPayment(paymentId);
      // Refresh transactions sau khi confirm
      await loadTransactions();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to confirm payment';
      // Nếu lỗi authentication, không hiển thị error (sẽ redirect về login)
      if (errorMessage.includes('authentication') || errorMessage.includes('token')) {
        setError('');
      } else {
        setError(errorMessage);
      }
    } finally {
      setConfirmingPaymentId(null);
    }
  };
  
  const statusColorMap: Record<PaymentStatus, string> = {
    [PaymentStatus.SUCCEEDED]: 'bg-green-100 text-green-800',
    [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [PaymentStatus.FAILED]: 'bg-red-100 text-red-800',
    [PaymentStatus.REFUNDED]: 'bg-blue-100 text-blue-800',
    [PaymentStatus.CANCELED]: 'bg-gray-100 text-gray-800',
  };

  const getStatusLabel = (status: PaymentStatus): string => {
    const statusMap: Record<PaymentStatus, string> = {
      [PaymentStatus.SUCCEEDED]: 'Thành công',
      [PaymentStatus.PENDING]: 'Đang chờ',
      [PaymentStatus.FAILED]: 'Thất bại',
      [PaymentStatus.REFUNDED]: 'Đã hoàn tiền',
      [PaymentStatus.CANCELED]: 'Đã hủy',
    };
    return statusMap[status] || status;
  };


  return (
    <div className="space-y-6">
       <header>
        <h2 className="text-3xl font-bold leading-tight text-gray-900">Điểm Bán Hàng Trạm (POS)</h2>
        <p className="mt-1 text-sm text-gray-500">Thu tiền và quản lý giao dịch từ tất cả các trạm.</p>
      </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
                 <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Giao Dịch Mới</h3>
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Mã Đặt Xe" id="bookingId" value={bookingId} onChange={(e) => setBookingId(e.target.value)} placeholder="vd: bk_abc123" required />
                    <Input label="Mã Người Thuê" id="renterId" value={renterId} onChange={(e) => setRenterId(e.target.value)} placeholder="vd: rent_xyz456" required />
                    <Input label="Số Tiền (VND)" id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="vd: 150000" required />
                    <Select label="Phương Thức Thanh Toán" id="method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                        {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                    </Select>
                    <Input label="Mô Tả (Tùy Chọn)" id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="vd: Phí thuê xe" />
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Đang xử lý...' : 'Thu Tiền'}
                    </Button>
                 </form>
            </Card>

            <div className="lg:col-span-2">
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Giao Dịch Hôm Nay</h3>
                        <Button 
                            onClick={loadTransactions} 
                            disabled={isLoading}
                            className="text-sm"
                        >
                            {isLoading ? 'Đang tải...' : 'Làm mới'}
                        </Button>
                    </div>
                    
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-500">Đang tải giao dịch...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Đặt Xe</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạm</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số Tiền</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phương Thức</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời Gian</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                                Không tìm thấy giao dịch
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map((tx) => (
                                        <tr key={tx.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.bookingId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">
                                              {extractStationName(tx.description || '', tx.stationId) !== tx.stationId 
                                                ? extractStationName(tx.description || '', tx.stationId)
                                                : (stationsMap[tx.stationId] || tx.stationId || 'Không xác định')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.amount.toLocaleString('vi-VN')} VND</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.method}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[tx.status]}`}>
                                                    {getStatusLabel(tx.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(tx.createdAt).toLocaleTimeString('vi-VN')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {tx.status === PaymentStatus.PENDING ? (
                                                    <Button
                                                        onClick={() => handleConfirmPayment(tx.id)}
                                                        disabled={confirmingPaymentId === tx.id}
                                                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1"
                                                    >
                                                        {confirmingPaymentId === tx.id ? 'Đang xác nhận...' : 'Xác nhận'}
                                                    </Button>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </td>
                                        </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    </div>
  );
};

export default POS;
