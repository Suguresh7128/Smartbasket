const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Require authentication ───────────────────────────────────────
const protect = passport.authenticate('jwt', { session: false });

// ─── Optional auth (attaches user if token present) ────────────────
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (!err && user) req.user = user;
    next();
  })(req, res, next);
};

// ─── Role guards ──────────────────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  next();
};

const requireAdmin = requireRole('admin');
const requireModerator = requireRole('admin', 'moderator');

// ─── Generate tokens ──────────────────────────────────────────────
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
};

// ─── Verify refresh token ──────────────────────────────────────────
const verifyRefreshToken = async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token required' });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    req.user = user;
    req.refreshToken = refreshToken;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Refresh token expired' });
  }
};

module.exports = {
  protect,
  optionalAuth,
  requireAdmin,
  requireModerator,
  requireRole,
  generateTokens,
  verifyRefreshToken,
};
