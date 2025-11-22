import jwt from 'jsonwebtoken';
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.SERVICE_AUTH_BASE_URL || 'http://auth-service:8000';

// Helper để verify cookie với auth service
async function verifyCookieWithAuthService(cookieHeader) {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/v1/auth/me`, {
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json'
      },
      validateStatus: () => true // Không throw error cho mọi status code
    });
    
    if (response.status === 200 && response.data?.success && response.data?.data?.user) {
      return response.data.data.user;
    }
    return null;
  } catch (error) {
    console.error('[AUTH] Failed to verify cookie with auth service:', error.message);
    return null;
  }
}

export default function auth(req,res,next){
  // Cách 1: Kiểm tra Authorization header (Bearer token)
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const pub = process.env.JWT_PUBLIC_KEY || 'dev';
      const payload = jwt.verify(token, pub, { algorithms: ['RS256','HS256'] });
      req.user = payload;
      return next();
    } catch(e) {
      // Ignore, tiếp tục kiểm tra cookie
    }
  }

  // Cách 2: Kiểm tra user info từ APISIX forward headers (nếu có) - ưu tiên vì nhanh hơn
  if (req.headers['x-user-id'] && req.headers['x-user-role']) {
    req.user = {
      id: req.headers['x-user-id'],
      role: req.headers['x-user-role'],
      email: req.headers['x-user-email'] || '',
      stationIds: req.headers['x-user-station-ids'] ? JSON.parse(req.headers['x-user-station-ids']) : []
    };
    return next();
  }

  // Cách 3: Kiểm tra cookie (SSO) - gọi auth service để verify (async)
  const cookieHeader = req.headers.cookie || req.headers['x-forwarded-cookie'] || '';
  if (cookieHeader) {
    // Gọi async function và handle promise
    verifyCookieWithAuthService(cookieHeader)
      .then(user => {
        if (user) {
          req.user = {
            id: user.id,
            role: user.role,
            email: user.email,
            stationIds: user.stationIds || []
          };
        }
        next();
      })
      .catch(error => {
        // Ignore error, tiếp tục (public routes sẽ không có req.user)
        console.error('[AUTH] Cookie verification error:', error.message);
        next();
      });
    return; // Return early để không gọi next() hai lần
  }

  // Không có authentication - cho phép tiếp tục (public routes sẽ không có req.user)
  next();
}
