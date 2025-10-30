import jwt from 'jsonwebtoken';

export default function auth(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return next();
  
  const token = auth.substring(7);
  try {
    const pub = process.env.JWT_PUBLIC_KEY || 'dev';
    const payload = jwt.verify(token, pub, { algorithms: ['RS256', 'HS256'] });
    req.user = payload;
  } catch (e) {
    // ignore to allow public routes
  }
  next();
}
