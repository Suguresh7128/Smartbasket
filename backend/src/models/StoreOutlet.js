const mongoose = require('mongoose');

/**
 * StoreOutlet — one physical location of a store (or dark store / delivery hub)
 * Every store chain (DMart, Blinkit, etc.) has many outlets spread across cities.
 * When a user enters their pincode we find outlets within the correct radius.
 */
const storeOutletSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true,
  },
  storeName: { type: String, required: true },    // Denormalised for fast reads
  storeSlug: { type: String },

  // ─── Location ──────────────────────────────────────────────────
  name: { type: String },                          // e.g. "DMart Koramangala"
  address: { type: String },
  pincode: { type: String, index: true },
  city: { type: String, index: true },
  district: { type: String },
  state: { type: String },

  // GeoJSON point — enables MongoDB $nearSphere queries
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] },              // [longitude, latitude]
  },

  // ─── Service config ────────────────────────────────────────────
  serviceRadiusKm: { type: Number, default: 8 },  // How far this outlet delivers/serves
  isActive: { type: Boolean, default: true },
  deliveryTime: { type: String },                  // "10 mins", "2 hrs", "Next day"
  minOrder: { type: Number, default: 0 },

}, { timestamps: true });

// Geospatial index for fast nearest-outlet queries
storeOutletSchema.index({ location: '2dsphere' });
storeOutletSchema.index({ pincode: 1, storeId: 1 });
storeOutletSchema.index({ city: 1, storeId: 1 });

module.exports = mongoose.model('StoreOutlet', storeOutletSchema);
