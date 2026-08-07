const User        = require('../models/User');
const Product     = require('../models/Product');
const Store       = require('../models/Store');
const Price       = require('../models/Price');
const StoreOutlet = require('../models/StoreOutlet');

// ─── Seed default stores ──────────────────────────────────────────
exports.seedStores = async (req, res, next) => {
  try {
    const stores = [
      { name:'DMart',           slug:'dmart',           color:'#E30613', type:'hypermarket',   priority:10 },
      { name:'Reliance Smart',  slug:'reliance-smart',  color:'#0066CC', type:'supermarket',   priority:9  },
      { name:'SPAR',            slug:'spar',            color:'#009C4F', type:'supermarket',   priority:8  },
      { name:'More',            slug:'more',            color:'#FF6B00', type:'supermarket',   priority:7  },
      { name:'BigBasket',       slug:'bigbasket',       color:'#84C225', type:'online',        priority:6, deliveryTime:'Next day' },
      { name:'JioMart',         slug:'jiomart',         color:'#0078D4', type:'online',        priority:5, deliveryTime:'2 hours'  },
      { name:'Blinkit',         slug:'blinkit',         color:'#F8CF00', type:'quick_commerce',priority:4, deliveryTime:'10 mins'  },
      { name:'Zepto',           slug:'zepto',           color:'#9747FF', type:'quick_commerce',priority:3, deliveryTime:'10 mins'  },
      { name:'Swiggy Instamart',slug:'swiggy-instamart',color:'#FC8019', type:'quick_commerce',priority:2, deliveryTime:'10 mins'  },
    ];
    for (const s of stores) {
      await Store.findOneAndUpdate({ slug: s.slug }, s, { upsert: true, new: true });
    }
    res.json({ success: true, message: `${stores.length} stores seeded` });
  } catch (err) { next(err); }
};

// ─── Get all users (paginated, searchable) ────────────────────────
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip  = (page - 1) * limit;
    const query = search
      ? { $or: [
          { name:  { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ]}
      : {};
    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);
    res.json({ success: true, data: users, total, page: parseInt(page) });
  } catch (err) { next(err); }
};

// ─── Suspend / reactivate user ────────────────────────────────────
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: user, message: `User ${user.isActive ? 'activated' : 'suspended'}` });
  } catch (err) { next(err); }
};

// ─── Change user role ─────────────────────────────────────────────
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user','moderator','admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// ─── Pending price submissions ────────────────────────────────────
exports.getPendingPrices = async (req, res, next) => {
  try {
    const prices = await Price.find({ isVerified: false, source: 'user_submission' })
      .populate('productId', 'productName brand quantity unit')
      .populate('storeId',   'name logo color')
      .populate('submittedBy','name email')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, data: prices });
  } catch (err) { next(err); }
};

// ─── Outlet management ────────────────────────────────────────────
exports.getOutlets = async (req, res, next) => {
  try {
    const { city, storeSlug } = req.query;
    const q = {};
    if (city)      q.city      = new RegExp(city, 'i');
    if (storeSlug) q.storeSlug = storeSlug;
    const outlets = await StoreOutlet.find(q)
      .populate('storeId', 'name color')
      .sort({ city: 1, storeName: 1 })
      .lean();
    res.json({ success: true, data: outlets, total: outlets.length });
  } catch (err) { next(err); }
};

exports.createOutlet = async (req, res, next) => {
  try {
    const { lat, lng, ...rest } = req.body;
    const outlet = await StoreOutlet.create({
      ...rest,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
    });
    res.status(201).json({ success: true, data: outlet });
  } catch (err) { next(err); }
};

exports.toggleOutlet = async (req, res, next) => {
  try {
    const outlet = await StoreOutlet.findById(req.params.id);
    if (!outlet) return res.status(404).json({ success: false, message: 'Outlet not found' });
    outlet.isActive = !outlet.isActive;
    await outlet.save();
    res.json({ success: true, data: outlet });
  } catch (err) { next(err); }
};
