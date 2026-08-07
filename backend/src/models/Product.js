const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  normalizedName: {
    type: String,
    lowercase: true,
    trim: true,
  },
  brand: { type: String, trim: true },
  category: {
    type: String,
    enum: [
      'grains_cereals', 'dairy_eggs', 'oils_fats', 'spices_masalas',
      'beverages', 'snacks', 'personal_care', 'cleaning', 'frozen',
      'fresh_produce', 'bakery', 'meat_seafood', 'baby_products', 'other',
    ],
    default: 'other',
  },
  subCategory: { type: String },
  variant: { type: String },                     // e.g. "Premium", "Organic"
  quantity: { type: Number },
  unit: {
    type: String,
    enum: ['g', 'kg', 'ml', 'l', 'pcs', 'pack', 'dozen'],
    default: 'g',
  },
  barcode: { type: String },
  images: [{ type: String }],
  description: { type: String },
  tags: [{ type: String, lowercase: true }],
  isActive: { type: Boolean, default: true },
  searchCount: { type: Number, default: 0 },     // Track popularity
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ─── Indexes ─────────────────────────────────────────────────────
productSchema.index({ productName: 'text', brand: 'text', tags: 'text', normalizedName: 'text' });
productSchema.index({ barcode: 1 }, { sparse: true });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ searchCount: -1 });

// ─── Normalize on save ────────────────────────────────────────────
productSchema.pre('save', function (next) {
  if (this.isModified('productName') || this.isModified('brand')) {
    const parts = [this.productName, this.brand].filter(Boolean);
    this.normalizedName = parts.join(' ').toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
