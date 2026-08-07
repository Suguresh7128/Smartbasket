const mongoose = require('mongoose');

/**
 * PincodeCache — stores geocoded pincode data
 * Source: api.postalpincode.in (free, no key) + Nominatim (lat/lng)
 * TTL: 30 days (pincodes don't change)
 */
const pincodeCacheSchema = new mongoose.Schema({
  pincode: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  city: { type: String },
  district: { type: String },
  state: { type: String },
  country: { type: String, default: 'India' },

  // Coordinates of the pincode centroid
  lat: { type: Number },
  lng: { type: Number },

  // GeoJSON for spatial queries
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number],                // [lng, lat]
  },

  // Which store slugs deliver to this pincode
  availableStoreSlugs: [{ type: String }],

  isValid: { type: Boolean, default: true },   // false for invalid/non-existent pincodes
  fetchedAt: { type: Date, default: Date.now },
}, { timestamps: false });

pincodeCacheSchema.index({ location: '2dsphere' });

// Auto-expire after 30 days via MongoDB TTL
pincodeCacheSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('PincodeCache', pincodeCacheSchema);
