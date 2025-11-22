
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
      // testMode: true, // Tắt testMode để thư viện tự detect từ vnpayHost
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

  // VNPAY requires amount in xu (cents), so multiply by 100
  const vnpAmount = Math.round(amount * 100);

  const localeCandidate = (options.locale || process.env.VNPAY_DEFAULT_LOCALE || 'vn').toLowerCase();
  const locale = ['vn', 'en'].includes(localeCandidate) ? localeCandidate : 'vn';
  const orderInfoCandidate = options.orderInfo || payment?.vnpOrderInfo || payment?.description;
  let resolvedOrderInfo = (orderInfoCandidate ? String(orderInfoCandidate) : '').trim();
  if (!resolvedOrderInfo) {
    resolvedOrderInfo = `EVR Payment ${payment.id}`;
  }
  
  // VNPAY yêu cầu: "Tiếng Việt không dấu và không bao gồm các ký tự đặc biệt"
  // Loại bỏ dấu tiếng Việt và ký tự đặc biệt
  resolvedOrderInfo = resolvedOrderInfo
    .normalize('NFD') // Tách dấu
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
    .replace(/[^a-zA-Z0-9\s]/g, ' ') // Loại bỏ ký tự đặc biệt, thay bằng space
    .replace(/\s+/g, ' ') // Gộp nhiều space thành 1
    .trim();
  
  if (resolvedOrderInfo.length > 255) {
    resolvedOrderInfo = resolvedOrderInfo.slice(0, 255);
  }
  
  // Đảm bảo không rỗng sau khi xử lý
  if (!resolvedOrderInfo) {
    resolvedOrderInfo = `EVR Payment ${payment.id}`;
  }
  const orderTypeCandidate = typeof options.orderType === 'string' ? options.orderType.toLowerCase() : options.orderType;
  const orderType = orderTypeCandidate && Object.values(ProductCode).includes(orderTypeCandidate)
    ? orderTypeCandidate
    : ProductCode.Other;
  
  // Set VNPAY redirect to expire in 24 hours
  const expireDate = new Date();
  expireDate.setDate(expireDate.getDate() + 1);
  
  // Map locale string to VnpLocale enum
  const vnpLocale = locale === 'en' ? VnpLocale.EN : VnpLocale.VN;
  
  console.log('VNPAY environment check:', {
    tmnCode: process.env.VNPAY_TMN_CODE,
    returnUrl,
    payUrl: process.env.VNPAY_PAY_URL,
    locale,
    vnpLocale,
    orderType,
    amount: amount,
    vnpAmount: vnpAmount
  });
  
  try {
    // Build payment parameters
    // Note: vnp_Amount must be a number (in xu), đã nhân 100
    // Thêm tất cả các tham số bắt buộc vào params để đảm bảo chữ ký đúng
    // Theo tài liệu VNPAY, các tham số bắt buộc: vnp_Version, vnp_Command, vnp_TmnCode, vnp_CurrCode
    const paymentParams = {
      vnp_Version: '2.1.0', // Phiên bản API - BẮT BUỘC
      vnp_Command: 'pay', // Mã API - BẮT BUỘC
      vnp_TmnCode: process.env.VNPAY_TMN_CODE, // Mã website merchant - BẮT BUỘC
      vnp_Amount: vnpAmount, // Number in xu (cents) - đã nhân 100 - BẮT BUỘC
      vnp_CurrCode: 'VND', // Đơn vị tiền tệ - BẮT BUỘC
      vnp_IpAddr: ipAddr, // IP khách hàng - BẮT BUỘC
      vnp_TxnRef: payment.vnpTxnRef, // Mã tham chiếu giao dịch - BẮT BUỘC
      vnp_OrderInfo: resolvedOrderInfo, // Thông tin đơn hàng - BẮT BUỘC (thư viện sẽ tự encode)
      vnp_OrderType: orderType, // Mã danh mục hàng hóa - BẮT BUỘC
      vnp_ReturnUrl: returnUrl, // URL thông báo kết quả - BẮT BUỘC
      vnp_Locale: vnpLocale, // Ngôn ngữ giao diện - BẮT BUỘC
      vnp_CreateDate: dateFormat(new Date()), // Thời gian phát sinh - BẮT BUỘC
      vnp_ExpireDate: dateFormat(expireDate), // Thời gian hết hạn - BẮT BUỘC
    };
    
    console.log('VNPAY payment params (before buildPaymentUrl):', {
      ...paymentParams,
      vnp_OrderInfo: resolvedOrderInfo.substring(0, 50) + '...' // Log truncated
    });
    
    const redirectUrl = vnpay.buildPaymentUrl(paymentParams);
    
    console.log('VNPAY redirect URL generated:', redirectUrl.substring(0, 200) + '...');
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
