
import { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } from 'vnpay';

// VNPay client singleton
let vnpayClient = null;

function getVnpayClient() {
  if (!vnpayClient) {
    const { VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_PAY_URL } = process.env;

    if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET) {
      throw new Error('Missing VNPAY configuration. Set VNPAY_TMN_CODE and VNPAY_HASH_SECRET.');
    }

    const vnpayHost = VNPAY_PAY_URL?.replace('/paymentv2/vpcpay.html', '') || 'https://sandbox.vnpayment.vn';

    vnpayClient = new VNPay({
      tmnCode: VNPAY_TMN_CODE,
      secureSecret: VNPAY_HASH_SECRET,
      vnpayHost,
      testMode: true,
      hashAlgorithm: 'SHA512',
      loggerFn: ignoreLogger
    });
  }
  return vnpayClient;
}

export function newTxnRef(){
  return 'pay_' + Math.random().toString(36).slice(2,10);
}

export async function buildRedirect(payment, ipAddr = '127.0.0.1', options = {}){
  console.log('Building VNPAY redirect for payment:', payment.id);
  const vnpay = getVnpayClient();

  const returnUrl = process.env.VNPAY_RETURN_URL;
  if (!returnUrl) {
    throw new Error('Missing VNPAY_RETURN_URL configuration.');
  }

  const amount = Number(payment?.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid payment amount: ${payment?.amount}`);
  }


  const localeCandidate = (options.locale || process.env.VNPAY_DEFAULT_LOCALE || 'vn').toLowerCase();
  const locale = ['vn', 'en'].includes(localeCandidate) ? localeCandidate : 'vn';
  const orderInfoCandidate = options.orderInfo || payment?.vnpOrderInfo || payment?.description;
  let resolvedOrderInfo = (orderInfoCandidate ? String(orderInfoCandidate) : '').trim();
  if (!resolvedOrderInfo) {
    resolvedOrderInfo = `EVR Payment ${payment.id}`;
  }
  if (resolvedOrderInfo.length > 255) {
    resolvedOrderInfo = resolvedOrderInfo.slice(0, 255);
  }
  const orderTypeCandidate = typeof options.orderType === 'string' ? options.orderType.toLowerCase() : options.orderType;
  const orderType = orderTypeCandidate && Object.values(ProductCode).includes(orderTypeCandidate)
    ? orderTypeCandidate
    : ProductCode.Other;
  
  // Set VNPAY redirect to expire in 24 hours
  const expireDate = new Date();
  expireDate.setDate(expireDate.getDate() + 1);
  console.log('VNPAY environment check:', {
    tmnCode: process.env.VNPAY_TMN_CODE,
    returnUrl,
    payUrl: process.env.VNPAY_PAY_URL,
    locale,
    orderType
  });
  
  try {
    const redirectUrl = vnpay.buildPaymentUrl({
      vnp_Amount: amount,
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: payment.vnpTxnRef,
      vnp_OrderInfo: resolvedOrderInfo,
      vnp_OrderType: orderType,
      vnp_ReturnUrl: returnUrl,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(expireDate),
    });
    
    console.log('VNPAY redirect URLhehehe:', redirectUrl);
    return redirectUrl;
  } catch (error) {
    console.error('VNPAY buildPaymentUrl error:', error);
    throw new Error(`VNPAY buildPaymentUrl failed: ${error.message}`);
  }
}

export function verify(query){
  const vnpay = getVnpayClient();
  
  try {
    const result = vnpay.verifyReturnUrl(query);
    
    return {
      ok: result.isSuccess,
      data: {
        isValid: result.isSuccess,
        vnp_ResponseCode: query.vnp_ResponseCode,
        vnp_TxnRef: query.vnp_TxnRef,
        vnp_TransactionNo: query.vnp_TransactionNo,
        vnp_PayDate: query.vnp_PayDate,
        raw: query
      }
    };
  } catch (error) {
    return {
      ok: false,
      data: {
        isValid: false,
        error: error.message,
        raw: query
      }
    };
  }
}

// Hàm verify cho IPN (server-to-server)
export function verifyIpn(query){
  const vnpay = getVnpayClient();
  
  try {
    const result = vnpay.verifyReturnUrl(query);
    return {
      ok: result.isSuccess,
      data: {
        isValid: result.isSuccess,
        vnp_ResponseCode: query.vnp_ResponseCode,
        vnp_TxnRef: query.vnp_TxnRef,
        vnp_TransactionNo: query.vnp_TransactionNo,
        vnp_PayDate: query.vnp_PayDate,
        raw: query
      }
    };
  } catch (error) {
    return {
      ok: false,
      data: {
        isValid: false,
        error: error.message,
        raw: query
      }
    };
  }
}
