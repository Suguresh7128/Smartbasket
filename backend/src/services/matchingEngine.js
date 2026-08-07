const Fuse = require('fuse.js');
const Product = require('../models/Product');

let fuseInstance = null;
let lastRefresh = null;
const REFRESH_INTERVAL = 30 * 60 * 1000;  // 30 minutes

// ─── Unit normalization map ───────────────────────────────────────
const UNIT_MAP = {
  '1000g': '1kg', '500g': '500g', '250g': '250g', '100g': '100g',
  '1000ml': '1l', '500ml': '500ml', '1000 ml': '1l',
  '1 kg': '1kg', '2 kg': '2kg', '5 kg': '5kg',
  'one kg': '1kg', 'half kg': '500g',
};

// ─── Normalize product name for matching ─────────────────────────
const normalizeName = (name) => {
  if (!name) return '';
  let n = name.toLowerCase().trim();
  // Remove special characters
  n = n.replace(/[^\w\s]/g, ' ');
  // Normalize units
  Object.entries(UNIT_MAP).forEach(([k, v]) => {
    n = n.replace(new RegExp(k, 'gi'), v);
  });
  // Remove extra spaces
  n = n.replace(/\s+/g, ' ').trim();
  return n;
};

// ─── Initialize / refresh Fuse.js index ──────────────────────────
const refreshIndex = async () => {
  const products = await Product.find({ isActive: true })
    .select('productName brand normalizedName barcode _id')
    .lean();

  fuseInstance = new Fuse(products, {
    keys: [
      { name: 'normalizedName', weight: 2 },
      { name: 'productName', weight: 1.5 },
      { name: 'brand', weight: 1 },
    ],
    threshold: 0.4,
    includeScore: true,
    useExtendedSearch: false,
    minMatchCharLength: 2,
  });

  lastRefresh = Date.now();
  console.log(`[Matching] Index refreshed with ${products.length} products`);
  return fuseInstance;
};

// ─── Find best matching product ───────────────────────────────────
const findBestMatch = async (rawName, barcode = null) => {
  // Barcode takes priority
  if (barcode) {
    const product = await Product.findOne({ barcode, isActive: true }).lean();
    if (product) return product;
  }

  // Lazy-load / refresh Fuse index
  if (!fuseInstance || !lastRefresh || Date.now() - lastRefresh > REFRESH_INTERVAL) {
    await refreshIndex();
  }

  if (!fuseInstance) return null;

  const normalized = normalizeName(rawName);
  const results = fuseInstance.search(normalized, { limit: 3 });

  if (!results.length || results[0].score > 0.5) return null;
  return results[0].item;
};

// ─── Match multiple items at once ────────────────────────────────
const matchItems = async (items) => {
  if (!fuseInstance || !lastRefresh || Date.now() - lastRefresh > REFRESH_INTERVAL) {
    await refreshIndex();
  }
  return items.map(item => {
    const normalized = normalizeName(item.name);
    const results = fuseInstance?.search(normalized, { limit: 1 }) || [];
    return {
      ...item,
      matched: results.length > 0 && results[0].score < 0.5,
      product: results[0]?.item || null,
    };
  });
};

module.exports = { findBestMatch, matchItems, normalizeName, refreshIndex };
