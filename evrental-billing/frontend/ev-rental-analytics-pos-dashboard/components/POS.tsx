
import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Select from './ui/Select';
import { Payment, PaymentMethod, PaymentStatus } from '../types';

const API_BASE_URL = 'http://localhost:9080'; // Gateway URL

/**
 * Fetches transactions for the current station
 */
const fetchTransactions = async (stationId: string): Promise<Payment[]> => {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/payments?stationId=${stationId}&limit=50`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }

  const data = await response.json();
  return data.data || [];
};

/**
 * Creates a new payment at POS
 */
const createPayment = async (paymentData: {
  bookingId: string;
  stationId: string;
  amount: number;
  method: PaymentMethod;
  description?: string;
}): Promise<Payment> => {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/pos/collect`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...paymentData,
      type: 'RENTAL_FEE'
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create payment');
  }

  const data = await response.json();
  return data.data;
};


const POS: React.FC = () => {
  const [transactions, setTransactions] = useState<Payment[]>([]);
  const [bookingId, setBookingId] = useState('');
  const [renterId, setRenterId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const stationId = "S001"; // Assuming staff is logged into a specific station

  // Load transactions on component mount
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTransactions(stationId);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setError('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !renterId || !amount) {
        setError('Booking ID, Renter ID, and Amount are required.');
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
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const statusColorMap: Record<PaymentStatus, string> = {
    [PaymentStatus.SUCCEEDED]: 'bg-green-100 text-green-800',
    [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [PaymentStatus.FAILED]: 'bg-red-100 text-red-800',
    [PaymentStatus.REFUNDED]: 'bg-blue-100 text-blue-800',
    [PaymentStatus.CANCELED]: 'bg-gray-100 text-gray-800',
  };


  return (
    <div className="space-y-6">
       <header>
        <h2 className="text-3xl font-bold leading-tight text-gray-900">Station Point of Sale (POS)</h2>
        <p className="mt-1 text-sm text-gray-500">Collect payments and manage transactions for Station <span className="font-semibold">{stationId}</span>.</p>
      </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
                 <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">New Transaction</h3>
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Booking ID" id="bookingId" value={bookingId} onChange={(e) => setBookingId(e.target.value)} placeholder="e.g., bk_abc123" required />
                    <Input label="Renter ID" id="renterId" value={renterId} onChange={(e) => setRenterId(e.target.value)} placeholder="e.g., rent_xyz456" required />
                    <Input label="Amount (VND)" id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 150000" required />
                    <Select label="Payment Method" id="method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                        {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                    </Select>
                    <Input label="Description (Optional)" id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Rental Fee" />
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : 'Collect Payment'}
                    </Button>
                 </form>
            </Card>

            <div className="lg:col-span-2">
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Today's Transactions</h3>
                        <Button 
                            onClick={loadTransactions} 
                            disabled={isLoading}
                            className="text-sm"
                        >
                            {isLoading ? 'Loading...' : 'Refresh'}
                        </Button>
                    </div>
                    
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-500">Loading transactions...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                No transactions found
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map((tx) => (
                                        <tr key={tx.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.bookingId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.amount.toLocaleString('vi-VN')} VND</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.method}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[tx.status]}`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(tx.createdAt).toLocaleTimeString()}</td>
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
