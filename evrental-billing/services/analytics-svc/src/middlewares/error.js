import logger from '../utils/logger.js';

export default function error(err, req, res, next) {
  const status = err.status || 500;
  logger.error({ err, path: req.originalUrl }, err.message);
  res.status(status).json({ success: false, error: err.message || 'INTERNAL_ERROR', code: err.code });
}
