const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Store name is required'],
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  logo: { type: String },
  color: { type: String, default: '#2D6A4F' },       // Brand color for UI
  type: {
    type: String,
    enum: ['hypermarket', 'supermarket', 'online', 'quick_commerce'],
    default: 'online',
  },
  website: { type: String },
  deliveryTime: { type: String },                      // e.g. "10 mins", "Next day"
  minOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  cities: [{ type: String }],                          // Cities this store operates in
  dataSource: {
    type: String,
    enum: ['manual', 'api', 'affiliate', 'scrape', 'crowdsourced'],
    default: 'crowdsourced',
  },
  priority: { type: Number, default: 0 },             // Higher = shown first
}, { timestamps: true });

storeSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

module.exports = mongoose.model('Store', storeSchema);
