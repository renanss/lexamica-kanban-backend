import rateLimit from 'express-rate-limit';
import ApiError from '../utils/ApiError';
import config from '../config/config';

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.env === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
  message: 'Too many requests from this IP, please try again later',
  handler: (_req, _res, next, options) => {
    next(new ApiError(429, options.message));
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export default rateLimiter; 