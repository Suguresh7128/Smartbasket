const mongoose = require('mongoose');
const Product = require('../models/Product');
const Price = require('../models/Price');
const { getCache, setCache, deleteCache } = require('../config/redis');
const { findBestMatch } = require('../services/matchingEngine');

const dbAvailable = () => mongoose.connection && mongoose.connection.readyState === 1;

// ─── Search products ──────────────────────────────────────────────
exports.search = async (req, res, next) => {
  try {
    const { q = '', category, limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    if (!q.trim() && !category) {
      return res.json({ success: true, data: [], total: 0 });
    }

    // If DB not available, return empty result for graceful degraded mode
    if (!dbAvailable()) {
      return res.json({ success: true, data: [], total: 0, page: parseInt(page) });
    }

    const cacheKey = `search:${q.trim().toLowerCase()}:${category || ''}:${page}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ success: true, ...cached, fromCache: true });

    const query = { isActive: true };

    if (q.trim()) {
      // Use MongoDB text search for fast results
      query.$text = { $search: q.trim() };
    }
    if (category) query.category = category;

    const [products, total] = await Promise.all([
      Product.find(query, q.trim() ? { score: { $meta: 'textScore' } } : {})
        .sort(q.trim() ? { score: { $meta: 'textScore' } } : { searchCount: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(query),
    ]);

    // Increment search count in background (non-blocking)
    if (products.length > 0) {
      Product.updateMany(
        { _id: { $in: products.map(p => p._id) } },
        { $inc: { searchCount: 1 } }
      ).catch(() => {});
    }

    const result = { data: products, total, page: parseInt(page) };
    await setCache(cacheKey, result, 120);  // Cache for 2 minutes

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─── Get single product with all prices ───────────────────────────
exports.getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `product:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ success: true, data: cached });

    if (!dbAvailable()) {
      return res.status(503).json({ success: false, message: 'Service unavailable (DB not connected)' });
    }

    const product = await Product.findById(id).lean();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const prices = await Price.find({ productId: id, inStock: true })
      .populate('storeId', 'name logo color type deliveryTime')
      .sort({ offerPrice: 1, price: 1 })
      .lean();

    const data = { ...product, prices };
    await setCache(cacheKey, data, 300);   // 5 minutes

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─── Get trending products ─────────────────────────────────────────
exports.getTrending = async (req, res, next) => {
  try {
    // If DB not available, gracefully return empty list
    if (!dbAvailable()) return res.json({ success: true, data: [] });

    const cached = await getCache('trending:products');
    if (cached) return res.json({ success: true, data: cached });

    const products = await Product.find({ isActive: true })
      .sort({ searchCount: -1 })
      .limit(20)
      .lean();

    await setCache('trending:products', products, 600);
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};

// ─── Get categories with counts ────────────────────────────────────
exports.getCategories = async (req, res, next) => {
  try {
    const cached = await getCache('categories');
    if (cached) return res.json({ success: true, data: cached });

    const data = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    await setCache('categories', data, 3600);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─── Create product (admin/moderator) ─────────────────────────────
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({ ...req.body, createdBy: req.user._id });
    await deleteCache('trending:products');
    await deleteCache('categories');
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// ─── Update product ────────────────────────────────────────────────
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    await deleteCache(`product:${req.params.id}`);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// ─── Delete product ────────────────────────────────────────────────
exports.deleteProduct = async (req, res, next) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    await deleteCache(`product:${req.params.id}`);
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) {
    next(err);
  }
};
