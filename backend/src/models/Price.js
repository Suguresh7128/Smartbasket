const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true,
  },
  price:      { type: Number, required: true, min: 0 },
  offerPrice: { type: Number, min: 0, default: null },
  mrp:        { type: Number },
  currency:   { type: String, default: 'INR' },
  inStock:    { type: Boolean, default: true },

  // ─── Location fields ──────────────────────────────────────────
  pincode:  { type: String, index: true, default: null },  // null = applies to all
  city:     { type: String, default: null },
  outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreOutlet', default: null },

  source: {
    type: String,
    enum: ['bill_upload', 'user_submission', 'affiliate_feed', 'retailer_api', 'admin'],
    required: true,
  },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isVerified:  { type: Boolean, default: false },
  storeUrl:    { type: String },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

// ─── Indexes ──────────────────────────────────────────────────────
// Unique per product+store+pincode combination
priceSchema.index({ productId: 1, storeId: 1, pincode: 1 }, { unique: true });
priceSchema.index({ productId: 1, offerPrice: 1 });
priceSchema.index({ lastUpdated: -1 });
priceSchema.index({ pincode: 1, productId: 1 });

// ─── Virtuals ─────────────────────────────────────────────────────
priceSchema.virtual('effectivePrice').get(function () {
  return this.offerPrice && this.offerPrice < this.price ? this.offerPrice : this.price;
});
priceSchema.virtual('savings').get(function () {
  return this.offerPrice && this.offerPrice < this.price
    ? +(this.price - this.offerPrice).toFixed(2) : 0;
});
priceSchema.virtual('savingsPercent').get(function () {
  return this.offerPrice && this.offerPrice < this.price
    ? Math.round(((this.price - this.offerPrice) / this.price) * 100) : 0;
});

priceSchema.set('toJSON',   { virtuals: true });
priceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Price', priceSchema);
