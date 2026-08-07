const User = require('../models/User');
const { generateTokens } = require('../middleware/auth');
const passport = require('passport');

// ─── Register ─────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, city } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, city: city || 'Bengaluru' });
    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshTokens = [refreshToken];
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user, accessToken, refreshToken },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshTokens');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.password) {
      return res.status(401).json({ success: false, message: 'Please login with Google' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    // Keep max 5 refresh tokens (multi-device)
    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      data: { user, accessToken, refreshToken },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Refresh access token ─────────────────────────────────────────
exports.refresh = async (req, res, next) => {
  try {
    const { user, refreshToken: oldToken } = req;
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Rotate refresh token
    user.refreshTokens = user.refreshTokens.filter(t => t !== oldToken);
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.json({ success: true, data: { accessToken, refreshToken } });
  } catch (err) {
    next(err);
  }
};

// ─── Logout ───────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findById(req.user._id).select('+refreshTokens');
    if (user && refreshToken) {
      user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
      await user.save();
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── Get me ───────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

// ─── Update FCM token ─────────────────────────────────────────────
exports.updateFcmToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.json({ success: true, message: 'FCM token updated' });
  } catch (err) {
    next(err);
  }
};

// ─── Google OAuth callback ────────────────────────────────────────
exports.googleCallback = (req, res) => {
  const { accessToken, refreshToken } = generateTokens(req.user._id);
  // Redirect to frontend with tokens
  const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?access=${accessToken}&refresh=${refreshToken}`;
  res.redirect(redirectUrl);
};
