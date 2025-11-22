export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  VNPAY = 'VNPAY',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELED = 'CANCELED',
}

export enum UserRole {
    ADMIN = 'ADMIN',
    STAFF = 'STAFF',
    RENTER = 'RENTER',
}

export interface User {
    id: string;
    name: string;
    role: UserRole;
}


export interface Payment {
  id: string;
  bookingId: string;
  renterId: string;
  stationId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  description: string;
  createdAt: string;
}

export interface RevenueDataPoint {
  name: string;
  revenue: number;
}

export interface UtilizationDataPoint {
  name: string;
  value: number;
}

export interface PeakHourDataPoint {
  hour: number;
  bookingCount: number;
}

export interface RentalHourDataPoint {
  hour: number;
  rentalHours: number;
  bookingCount: number;
}

export interface StationReport {
  stationId: string;
  date: string;
  revenue: number;
  rentals: number;
  utilization: number;
  peakHours: number[];
}

export interface PeakHourDataPoint {
  hour: number;
  bookingCount: number;
}

export interface RentalHourDataPoint {
  hour: number;
  rentalHours: number;
  bookingCount: number;
}

export interface Booking {
  id: string;
  renterId: string;
  carModel: string;
  carImageUrl: string;
  pickupStation: string;
  dropoffStation: string;
  pickupTime: string;
  dropoffTime: string;
  priceDetails: {
    rentalFee: number;
    insurance: number;
    total: number;
  };
}