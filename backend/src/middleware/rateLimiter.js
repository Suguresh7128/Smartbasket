const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
    skip: (req) => req.user?.role === 'admin',    // Admins bypass rate limits
  });

// Different limits for different endpoints
module.exports = {
  // Auth endpoints - strict
  authLimiter: createLimiter(15 * 60 * 1000, 10, 'Too many auth attempts, try again in 15 minutes'),

  // Search - generous
  searchLimiter: createLimiter(60 * 1000, 60, 'Too many search requests'),

  // Bill upload - moderate
  uploadLimiter: createLimiter(60 * 60 * 1000, 20, 'Bill upload limit reached, try again in 1 hour'),

  // Price submission - moderate
  submitLimiter: createLimiter(60 * 60 * 1000, 50, 'Price submission limit reached'),

  // General API
  apiLimiter: createLimiter(60 * 1000, 100, 'Too many requests, slow down'),
};
