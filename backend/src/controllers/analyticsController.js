const { Alert } = require('../models/index');
const Price = require('../models/Price');
const { Bill } = require('../models/index');

// ═══════════════════════════════════════════════════════════════════
// ALERTS
// ═══════════════════════════════════════════════════════════════════

exports.createAlert = async (req, res, next) => {
  try {
    const { productId, storeId, targetPrice } = req.body;

    // Check for duplicate
    const existing = await Alert.findOne({ userId: req.user._id, productId, isActive: true });
    if (existing) {
      existing.targetPrice = targetPrice;
      if (storeId) existing.storeId = storeId;
      await existing.save();
      return res.json({ success: true, data: existing, message: 'Alert updated' });
    }

    // Get current price for reference
    const priceQuery = { productId, inStock: true };
    if (storeId) priceQuery.storeId = storeId;
    const currentPriceDoc = await Price.findOne(priceQuery).sort({ offerPrice: 1, price: 1 });
    const currentPrice = currentPriceDoc
      ? (currentPriceDoc.offerPrice || currentPriceDoc.price) : null;

    const alert = await Alert.create({
      userId: req.user._id,
      productId,
      storeId: storeId || null,
      targetPrice,
      currentPrice,
    });

    res.status(201).json({ success: true, data: alert });
  } catch (err) {
    next(err);
  }
};

exports.getUserAlerts = async (req, res, next) => {
  try {
    const alerts = await Alert.find({ userId: req.user._id })
      .populate('productId', 'productName brand quantity unit images')
      .populate('storeId', 'name logo')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
};

exports.deleteAlert = async (req, res, next) => {
  try {
    await Alert.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Alert deleted' });
  } catch (err) {
    next(err);
  }
};

exports.toggleAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findOne({ _id: req.params.id, userId: req.user._id });
    if (!alert) return res.status(404).json({ success: false, message: 'Not found' });
    alert.isActive = !alert.isActive;
    await alert.save();
    res.json({ success: true, data: alert });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════

exports.getUserAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { months = 3 } = req.query;

    const since = new Date();
    since.setMonth(since.getMonth() - parseInt(months));

    const bills = await Bill.find({
      userId,
      status: 'done',
      billDate: { $gte: since },
    }).lean();

    // Monthly spend
    const monthlySpend = {};
    bills.forEach(bill => {
      const key = `${bill.billDate.getFullYear()}-${String(bill.billDate.getMonth() + 1).padStart(2, '0')}`;
      monthlySpend[key] = (monthlySpend[key] || 0) + (bill.totalAmount || 0);
    });

    // Store-wise spend
    const storeSpend = {};
    bills.forEach(bill => {
      const key = bill.storeName || 'Unknown';
      storeSpend[key] = (storeSpend[key] || 0) + (bill.totalAmount || 0);
    });

    // Total stats
    const totalSpend = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const billCount = bills.length;

    res.json({
      success: true,
      data: {
        totalSpend: +totalSpend.toFixed(2),
        billCount,
        averageBill: billCount > 0 ? +(totalSpend / billCount).toFixed(2) : 0,
        monthlySpend,
        storeSpend,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getAdminStats = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const Product = require('../models/Product');
    const Store = require('../models/Store');
    const PriceModel = require('../models/Price');

    const [users, products, prices, bills, activeAlerts] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ isActive: true }),
      PriceModel.countDocuments(),
      Bill.countDocuments(),
      Alert.countDocuments({ isActive: true }),
    ]);

    res.json({
      success: true,
      data: { users, products, prices, bills, activeAlerts },
    });
  } catch (err) {
    next(err);
  }
};
