const Price        = require('../models/Price');
const { PriceHistory } = require('../models/index');
const Product      = require('../models/Product');
const Store        = require('../models/Store');
const PincodeCache = require('../models/PincodeCache');
const { getCache, setCache, deleteCache } = require('../config/redis');

// ─── Helper: resolve available store IDs for a pincode ───────────
const getStoreIdsForPincode = async (pincode) => {
  if (!pincode) return null;                       // null = no filter, show all
  const doc = await PincodeCache.findOne({ pincode, isValid: true });
  if (!doc?.availableStoreSlugs?.length) return null;
  const stores = await Store.find({ slug: { $in: doc.availableStoreSlugs } }).select('_id').lean();
  return stores.map(s => s._id);
};

// ─── Compare prices for one product ───────────────────────────────
exports.compareByProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { pincode }   = req.query;              // ?pincode=560032

    const cacheKey = `prices:${productId}:${pincode || 'all'}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ success: true, data: cached, fromCache: true });

    const query = { productId, inStock: true };

    // Filter by pincode-available stores
    const allowedStoreIds = await getStoreIdsForPincode(pincode);
    if (allowedStoreIds) {
      if (!allowedStoreIds.length) {
        return res.json({ success: true, data: [], message: 'No stores found for this pincode' });
      }
      query.storeId = { $in: allowedStoreIds };
    }

    const prices = await Price.find(query)
      .populate('storeId', 'name logo color type deliveryTime slug')
      .sort({ offerPrice: 1, price: 1 })
      .lean();

    if (!prices.length) return res.json({ success: true, data: [] });

    // Mark cheapest, calculate savings
    let cheapestIdx = 0;
    let cheapestPrice = Infinity;
    prices.forEach((p, i) => {
      const eff = p.offerPrice && p.offerPrice < p.price ? p.offerPrice : p.price;
      if (eff < cheapestPrice) { cheapestPrice = eff; cheapestIdx = i; }
      p.effectivePrice = eff;
      p.savings = p.offerPrice && p.offerPrice < p.price
        ? +(p.price - p.offerPrice).toFixed(2) : 0;
    });
    prices[cheapestIdx].isCheapest = true;

    await setCache(cacheKey, prices, 300);
    res.json({ success: true, data: prices });
  } catch (err) {
    next(err);
  }
};

// ─── Basket optimizer ─────────────────────────────────────────────
exports.optimizeBasket = async (req, res, next) => {
  try {
    const { productIds, pincode } = req.body;
    if (!productIds?.length) {
      return res.status(400).json({ success: false, message: 'productIds required' });
    }

    const priceQuery = { productId: { $in: productIds }, inStock: true };

    const allowedStoreIds = await getStoreIdsForPincode(pincode);
    if (allowedStoreIds) {
      if (!allowedStoreIds.length) {
        return res.json({ success: true, data: [], message: 'No stores available at this pincode' });
      }
      priceQuery.storeId = { $in: allowedStoreIds };
    }

    const prices = await Price.find(priceQuery)
      .populate('storeId', 'name logo color slug deliveryTime')
      .lean();

    const stores = {};
    prices.forEach(p => {
      const storeId = p.storeId._id.toString();
      if (!stores[storeId]) {
        stores[storeId] = { store: p.storeId, items: {}, total: 0 };
      }
      const eff = p.offerPrice && p.offerPrice < p.price ? p.offerPrice : p.price;
      stores[storeId].items[p.productId.toString()] = eff;
      stores[storeId].total += eff;
    });

    const storeList = Object.values(stores).map(s => {
      const missing = productIds.filter(id => !s.items[id?.toString()]);
      return { ...s, missingCount: missing.length, hasAll: missing.length === 0 };
    }).sort((a, b) => a.total - b.total);

    res.json({ success: true, data: storeList });
  } catch (err) {
    next(err);
  }
};

// ─── Submit a price ────────────────────────────────────────────────
exports.submitPrice = async (req, res, next) => {
  try {
    const { productId, storeId, price, offerPrice, pincode } = req.body;

    const [product, store] = await Promise.all([
      Product.findById(productId),
      Store.findById(storeId),
    ]);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (!store)   return res.status(404).json({ success: false, message: 'Store not found' });

    // Resolve city from pincode
    let city = req.user.city;
    if (pincode) {
      const pincodeDoc = await PincodeCache.findOne({ pincode, isValid: true });
      if (pincodeDoc?.city) city = pincodeDoc.city;
    }

    const priceDoc = await Price.findOneAndUpdate(
      { productId, storeId, pincode: pincode || null },
      {
        price,
        offerPrice: offerPrice || null,
        source: 'user_submission',
        submittedBy: req.user._id,
        city,
        pincode: pincode || null,
        lastUpdated: new Date(),
        isVerified: false,
      },
      { upsert: true, new: true, runValidators: true }
    );

    PriceHistory.create({ productId, storeId, price, offerPrice, pincode }).catch(() => {});

    await deleteCache(`prices:${productId}:${pincode || 'all'}`);
    await deleteCache(`prices:${productId}:all`);
    await deleteCache(`product:${productId}`);

    res.status(201).json({ success: true, data: priceDoc, message: 'Price submitted for review' });
  } catch (err) {
    next(err);
  }
};

// ─── Price history ─────────────────────────────────────────────────
exports.getPriceHistory = async (req, res, next) => {
  try {
    const { productId, storeId } = req.params;
    const { days = 30, pincode } = req.query;

    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const query = { productId, storeId, recordedAt: { $gte: since } };
    if (pincode) query.pincode = pincode;

    const history = await PriceHistory.find(query).sort({ recordedAt: 1 }).lean();
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: approve / delete ───────────────────────────────────────
exports.approvePrice = async (req, res, next) => {
  try {
    const price = await Price.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    if (!price) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: price });
  } catch (err) { next(err); }
};

exports.deletePrice = async (req, res, next) => {
  try {
    await Price.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Price deleted' });
  } catch (err) { next(err); }
};
