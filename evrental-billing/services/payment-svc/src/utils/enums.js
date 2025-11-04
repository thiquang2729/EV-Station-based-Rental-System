export const PaymentMethod = Object.freeze({
  CASH: 'CASH',
  CARD: 'CARD',
  VNPAY: 'VNPAY'
});

export const PaymentType = Object.freeze({
  RENTAL_FEE: 'RENTAL_FEE',
  DEPOSIT: 'DEPOSIT',
  FINE: 'FINE',
  EXTENSION: 'EXTENSION'
});

export const PaymentStatus = Object.freeze({
  PENDING: 'PENDING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  CANCELED: 'CANCELED',
  REFUNDED: 'REFUNDED'
});

export const DepositStatus = Object.freeze({
  HELD: 'HELD',
  RELEASED: 'RELEASED',
  PARTIAL_FORFEIT: 'PARTIAL_FORFEIT',
  FORFEIT: 'FORFEIT',
  CANCELED: 'CANCELED'
});


