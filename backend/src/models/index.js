const mongoose = require('mongoose');

// ─── Bill Schema ──────────────────────────────────────────────────
const billItemSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  unit: String,
  price: Number,
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  matched: { type: Boolean, default: false },
}, { _id: false });

const billSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  storeName: { type: String },
  imageUrl: { type: String },
  imagePublicId: { type: String },
  items: [billItemSchema],
  totalAmount: { type: Number, default: 0 },
  ocrRaw: { type: String },                    // Raw OCR text for debugging
  status: {
    type: String,
    enum: ['processing', 'done', 'failed'],
    default: 'processing',
  },
  billDate: { type: Date, default: Date.now },
}, { timestamps: true });

// ─── Alert Schema ─────────────────────────────────────────────────
const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    default: null,                               // null = any store
  },
  targetPrice: {
    type: Number,
    required: [true, 'Target price is required'],
    min: 0,
  },
  currentPrice: { type: Number },
  isActive: { type: Boolean, default: true },
  triggeredAt: { type: Date },
  notificationSent: { type: Boolean, default: false },
}, { timestamps: true });

alertSchema.index({ userId: 1, productId: 1 });
alertSchema.index({ isActive: 1, productId: 1 });

// ─── PriceHistory Schema (lightweight time-series) ────────────────
const priceHistorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  price: { type: Number, required: true },
  offerPrice: { type: Number },
  recordedAt: { type: Date, default: Date.now, index: true },
}, { timestamps: false });

priceHistorySchema.index({ productId: 1, storeId: 1, recordedAt: -1 });

module.exports = {
  Bill: mongoose.model('Bill', billSchema),
  Alert: mongoose.model('Alert', alertSchema),
  PriceHistory: mongoose.model('PriceHistory', priceHistorySchema),
};
