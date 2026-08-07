const { geocodePincode, getNearbyOutlets, getAvailableStoreSlugs } = require('../services/locationService');
const PincodeCache = require('../models/PincodeCache');
const StoreOutlet  = require('../models/StoreOutlet');
const Store        = require('../models/Store');
const User         = require('../models/User');
const { getCache, setCache } = require('../config/redis');

// ─── GET /api/location/pincode/:pincode ───────────────────────────
exports.lookupPincode = async (req, res, next) => {
  try {
    const { pincode } = req.params;

    // Redis fast-path
    const cacheKey = `pincode:${pincode}`;
    const cached   = await getCache(cacheKey);
    if (cached) return res.json({ success: true, data: cached, fromCache: true });

    const result = await geocodePincode(pincode);
    if (!result.success) {
      return res.status(404).json({ success: false, message: result.error });
    }

    const { data } = result;

    // Get nearby physical / quick-commerce outlets (de-duped per chain)
    let nearbyOutlets = [];
    if (data.lat && data.lng) {
      nearbyOutlets = await getNearbyOutlets(data.lat, data.lng, 15);
    }

    // Build per-store closest outlet map
    const outletMap = {};
    nearbyOutlets.forEach(outlet => {
      const slug = outlet.storeSlug;
      if (!outletMap[slug] || outlet.distanceKm < outletMap[slug].distanceKm) {
        outletMap[slug] = outlet;
      }
    });

    // Find online-only stores (BigBasket, JioMart) not already in nearbyOutlets
    const allAvailableSlugs = await getAvailableStoreSlugs(
      pincode, data.lat, data.lng, data.city, data.state
    );
    const onlineSlugs = allAvailableSlugs.filter(s => !outletMap[s]);
    const onlineStores = await Store.find({ slug: { $in: onlineSlugs }, isActive: true })
      .select('_id name slug color type deliveryTime')
      .sort({ priority: -1 })
      .lean();

    // Coverage quality
    const physicalCount = Object.values(outletMap).filter(
      o => ['hypermarket','supermarket'].includes(o.storeId?.type)
    ).length;
    const qcCount = Object.values(outletMap).filter(
      o => o.storeId?.type === 'quick_commerce'
    ).length;

    let coverageLevel = 'online_only';
    if (physicalCount >= 2 && qcCount >= 2) coverageLevel = 'full';
    else if (physicalCount >= 1 || qcCount >= 1) coverageLevel = 'partial';

    const payload = {
      pincode:        data.pincode,
      city:           data.city,
      district:       data.district,
      state:          data.state,
      lat:            data.lat,
      lng:            data.lng,
      coverageLevel,                          // 'full' | 'partial' | 'online_only'
      nearbyOutlets: Object.values(outletMap).map(o => ({
        outletId:     o._id,
        storeId:      o.storeId?._id || o.storeId,
        storeName:    o.storeName,
        storeSlug:    o.storeSlug,
        outletName:   o.name,
        address:      o.address,
        distanceKm:   o.distanceKm,
        deliveryTime: o.deliveryTime,
        color:        o.storeId?.color,
        type:         o.storeId?.type,
      })).sort((a,b) => a.distanceKm - b.distanceKm),
      onlineStores: onlineStores.map(s => ({
        storeId:      s._id,
        storeName:    s.name,
        storeSlug:    s.slug,
        deliveryTime: s.deliveryTime,
        color:        s.color,
        isOnline:     true,
      })),
      totalStores:
        Object.keys(outletMap).length + onlineStores.length,
    };

    await setCache(cacheKey, payload, 3600);
    res.json({ success: true, data: payload });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/location/stores/:pincode ────────────────────────────
exports.getStoresForPincode = async (req, res, next) => {
  try {
    const { pincode } = req.params;
    const cached = await getCache(`stores:${pincode}`);
    if (cached) return res.json({ success: true, data: cached });

    let pincodeDoc = await PincodeCache.findOne({ pincode, isValid: true });
    if (!pincodeDoc) {
      const r = await geocodePincode(pincode);
      if (!r.success) return res.status(404).json({ success: false, message: r.error });
      pincodeDoc = r.data;
    }

    const slugs  = pincodeDoc.availableStoreSlugs || [];
    const stores = await Store.find({ slug: { $in: slugs }, isActive: true })
      .select('_id name slug color type deliveryTime')
      .sort({ priority: -1 })
      .lean();

    await setCache(`stores:${pincode}`, stores, 3600);
    res.json({ success: true, data: stores });
  } catch (err) { next(err); }
};

// ─── POST /api/location/save ──────────────────────────────────────
exports.saveUserLocation = async (req, res, next) => {
  try {
    const { pincode } = req.body;
    if (!pincode) return res.status(400).json({ success: false, message: 'Pincode required' });

    const result = await geocodePincode(pincode);
    if (!result.success) return res.status(404).json({ success: false, message: result.error });

    const { city, state } = result.data;
    await User.findByIdAndUpdate(req.user._id, { pincode, city, state });
    res.json({ success: true, message: 'Location saved', data: { pincode, city, state } });
  } catch (err) { next(err); }
};

// ─── GET /api/location/autocomplete?q=560 ────────────────────────
exports.autocompletePincode = async (req, res, next) => {
  try {
    const { q, city } = req.query;
    if (!q || q.length < 3) return res.json({ success: true, data: [] });

    const query = { pincode: new RegExp('^' + q), isValid: true };
    if (city) query.city = new RegExp(city, 'i');

    const results = await PincodeCache.find(query)
      .select('pincode city district state')
      .limit(8)
      .lean();

    res.json({ success: true, data: results });
  } catch (err) { next(err); }
};

// ─── GET /api/location/coverage/bangalore ─────────────────────────
// Returns a summary of how many pincodes and outlets are seeded
exports.bangaloreCoverage = async (req, res, next) => {
  try {
    const [totalPincodes, totalOutlets] = await Promise.all([
      PincodeCache.countDocuments({ city: /bengaluru/i, isValid: true }),
      StoreOutlet.countDocuments({ city: /bengaluru/i, isActive: true }),
    ]);

    const byStore = await StoreOutlet.aggregate([
      { $match: { city: /bengaluru/i, isActive: true } },
      { $group: { _id: '$storeName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: { totalPincodes, totalOutlets, byStore },
    });
  } catch (err) { next(err); }
};
