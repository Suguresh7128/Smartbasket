/**
 * LocationService
 * ─────────────────────────────────────────────────────────────────
 * 1. Geocode Indian pincodes → lat/lng + city/state
 *    Primary cache:  PincodeCache (MongoDB, pre-seeded for Bengaluru)
 *    API 1:          api.postalpincode.in  (free, no key)
 *    API 2:          nominatim.openstreetmap.org (free, no key, lat/lng)
 *
 * 2. Find store outlets near a pincode using MongoDB $nearSphere
 *    Progressive radius: 5km → 10km → 20km → 40km
 *
 * 3. Always include city-level online stores (BigBasket, JioMart)
 *    as fallback so every user in India gets at least some results.
 * ─────────────────────────────────────────────────────────────────
 */

const PincodeCache = require('../models/PincodeCache');
const StoreOutlet  = require('../models/StoreOutlet');
const Store        = require('../models/Store');

// ─── Haversine distance (km) ──────────────────────────────────────
const haversine = (lat1, lng1, lat2, lng2) => {
  const R   = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Fetch basic info from India Post API ─────────────────────────
const fetchFromIndiaPostAPI = async (pincode) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`,
      { signal: controller.signal, headers: { 'User-Agent': 'SmartBasket/1.0' } }
    );
    clearTimeout(timeout);
    const data = await res.json();
    if (!data?.[0] || data[0].Status !== 'Success' || !data[0].PostOffice?.length) {
      return null;
    }
    const po = data[0].PostOffice[0];
    return {
      city:     po.District || po.Division || po.Block || po.Name,
      district: po.District || po.Division,
      state:    po.State,
    };
  } catch { return null; }
};

// ─── Fetch lat/lng from Nominatim ─────────────────────────────────
const fetchCoordinates = async (pincode, city, state) => {
  try {
    const query = encodeURIComponent(`${pincode}, ${city || ''}, ${state || ''}, India`);
    const url   = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=in`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SmartBasket/1.0 (grocery price comparison)' },
    });
    clearTimeout(timeout);
    const data = await res.json();
    if (!data?.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { return null; }
};

// ─── Geocode a pincode (cache → India Post API → Nominatim) ───────
const geocodePincode = async (pincode) => {
  const pin = String(pincode).trim();

  if (!/^\d{6}$/.test(pin)) {
    return { success: false, error: 'Invalid pincode — must be exactly 6 digits' };
  }

  // 1. Check cache (pre-seeded Bengaluru pincodes will be here)
  const cached = await PincodeCache.findOne({ pincode: pin });
  if (cached) {
    if (!cached.isValid) {
      return { success: false, error: 'Pincode not found in India Post database' };
    }
    // If cached but missing coordinates, try to fetch them in background
    if (!cached.lat && !cached.lng) {
      fetchCoordinates(pin, cached.city, cached.state).then(async (coords) => {
        if (coords) {
          await PincodeCache.updateOne({ pincode: pin }, {
            lat: coords.lat, lng: coords.lng,
            location: { type: 'Point', coordinates: [coords.lng, coords.lat] },
          });
        }
      }).catch(() => {});
    }
    return { success: true, data: cached };
  }

  // 2. Fetch from India Post API
  const postInfo = await fetchFromIndiaPostAPI(pin);
  if (!postInfo) {
    // Mark as invalid
    await PincodeCache.findOneAndUpdate(
      { pincode: pin },
      { pincode: pin, isValid: false, fetchedAt: new Date() },
      { upsert: true }
    );
    return { success: false, error: 'Pincode not found. Please check and try again.' };
  }

  // 3. Fetch coordinates
  const coords = await fetchCoordinates(pin, postInfo.city, postInfo.state);

  // 4. Determine available stores
  const availableStoreSlugs = await getAvailableStoreSlugs(
    pin, coords?.lat || null, coords?.lng || null, postInfo.city, postInfo.state
  );

  // 5. Cache the result
  const cacheDoc = await PincodeCache.findOneAndUpdate(
    { pincode: pin },
    {
      ...postInfo,
      pincode: pin,
      country: 'India',
      lat: coords?.lat || null,
      lng: coords?.lng || null,
      location: coords
        ? { type: 'Point', coordinates: [coords.lng, coords.lat] }
        : undefined,
      availableStoreSlugs,
      isValid:   true,
      fetchedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return { success: true, data: cacheDoc };
};

// ─── Determine which store slugs serve this pincode ───────────────
const getAvailableStoreSlugs = async (pincode, lat, lng, city, state) => {
  const available = new Set();

  // 1. Geospatial query — progressive radius expansion
  if (lat && lng) {
    const radii = [5000, 10000, 20000, 40000];   // metres
    for (const radius of radii) {
      const outlets = await StoreOutlet.find({
        location: {
          $nearSphere: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: radius,
          },
        },
        isActive: true,
      }).lean();

      outlets.forEach(outlet => {
        const dist = haversine(lat, lng,
          outlet.location.coordinates[1],
          outlet.location.coordinates[0]);
        if (dist <= (outlet.serviceRadiusKm || 8)) {
          available.add(outlet.storeSlug);
        }
      });

      // Stop expanding once we have at least physical or quick-commerce stores
      if (available.size >= 2) break;
    }
  }

  // 2. City-level fallback (for cities where we have outlets)
  if (city) {
    const cityOutlets = await StoreOutlet.find({
      city: new RegExp(city.replace(/\s+/g, '.*'), 'i'),
      isActive: true,
    }).lean();
    cityOutlets.forEach(o => available.add(o.storeSlug));
  }

  // 3. Always include online stores for major states
  const SERVED_STATES = [
    'Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Telangana',
    'West Bengal', 'Gujarat', 'Rajasthan', 'Uttar Pradesh',
    'Andhra Pradesh', 'Kerala', 'Madhya Pradesh', 'Haryana', 'Punjab',
  ];
  if (SERVED_STATES.includes(state)) {
    available.add('bigbasket');
    available.add('jiomart');
  }

  // 4. JioMart covers all of India
  available.add('jiomart');

  return [...available];
};

// ─── Get nearby outlets sorted by distance ────────────────────────
const getNearbyOutlets = async (lat, lng, maxRadiusKm = 15) => {
  if (!lat || !lng) return [];

  const outlets = await StoreOutlet.find({
    location: {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: maxRadiusKm * 1000,
      },
    },
    isActive: true,
  })
    .populate('storeId', 'name slug color type deliveryTime logo')
    .lean();

  // De-duplicate: keep closest outlet per store chain
  const closest = {};
  outlets.forEach(o => {
    const dist = +haversine(lat, lng,
      o.location.coordinates[1],
      o.location.coordinates[0]).toFixed(1);
    o.distanceKm = dist;
    if (!closest[o.storeSlug] || dist < closest[o.storeSlug].distanceKm) {
      closest[o.storeSlug] = o;
    }
  });

  return Object.values(closest)
    .filter(o => o.distanceKm <= (o.serviceRadiusKm || 8))
    .sort((a, b) => a.distanceKm - b.distanceKm);
};

module.exports = {
  geocodePincode,
  getNearbyOutlets,
  haversine,
  getAvailableStoreSlugs,
};
