/**
 * seedOutlets.js — Comprehensive store outlet seeding for SmartBasket
 * ─────────────────────────────────────────────────────────────────────
 * Covers ALL of Bengaluru urban area with strategic dark store placement
 * ensuring every pincode is within service radius of at least one outlet.
 *
 * Run: node src/utils/seedOutlets.js
 * ─────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const mongoose    = require('mongoose');
const Store       = require('../models/Store');
const StoreOutlet = require('../models/StoreOutlet');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[DB] Connected');
};

// ─── Helper: build outlet record ──────────────────────────────────
const o = (name, pincode, city, state, lat, lng, radiusKm, delivery, address = '') => ({
  name, pincode, city, state, lat, lng, serviceRadiusKm: radiusKm, deliveryTime: delivery, address,
});

// ════════════════════════════════════════════════════════════════════
// BLINKIT — 3km radius dark stores
// Strategy: ~5km grid across entire Bengaluru urban belt
// 28 outlets → covers all 580xx pincodes
// ════════════════════════════════════════════════════════════════════
const BLINKIT = [
  // ── North Bengaluru ──
  o('Blinkit Yelahanka',        '560064', 'Bengaluru', 'Karnataka', 13.1005, 77.5963, 3, '10 mins'),
  o('Blinkit Hebbal',           '560024', 'Bengaluru', 'Karnataka', 13.0492, 77.5902, 3, '10 mins'),
  o('Blinkit Nagawara',         '560077', 'Bengaluru', 'Karnataka', 13.0462, 77.6307, 3, '10 mins'),
  o('Blinkit Kalyan Nagar',     '560043', 'Bengaluru', 'Karnataka', 13.0296, 77.6385, 3, '10 mins'),
  o('Blinkit Sadashivanagar',   '560080', 'Bengaluru', 'Karnataka', 13.0100, 77.5844, 3, '10 mins'),
  o('Blinkit Yeshwanthpur',     '560022', 'Bengaluru', 'Karnataka', 13.0209, 77.5484, 3, '10 mins'),
  o('Blinkit Peenya',           '560058', 'Bengaluru', 'Karnataka', 13.0265, 77.5206, 3, '10 mins'),
  // ── Central Bengaluru ──
  o('Blinkit Malleswaram',      '560003', 'Bengaluru', 'Karnataka', 13.0026, 77.5655, 3, '10 mins'),
  o('Blinkit Rajajinagar',      '560010', 'Bengaluru', 'Karnataka', 12.9925, 77.5501, 3, '10 mins'),
  o('Blinkit MG Road',          '560001', 'Bengaluru', 'Karnataka', 12.9757, 77.6096, 3, '10 mins'),
  o('Blinkit Frazer Town',      '560005', 'Bengaluru', 'Karnataka', 12.9829, 77.6101, 3, '10 mins'),
  o('Blinkit Indiranagar',      '560038', 'Bengaluru', 'Karnataka', 12.9784, 77.6408, 3, '10 mins'),
  o('Blinkit Domlur',           '560045', 'Bengaluru', 'Karnataka', 12.9614, 77.6381, 3, '10 mins'),
  o('Blinkit Vijayanagar',      '560040', 'Bengaluru', 'Karnataka', 12.9710, 77.5330, 3, '10 mins'),
  o('Blinkit Nagarbhavi',       '560072', 'Bengaluru', 'Karnataka', 12.9633, 77.5120, 3, '10 mins'),
  // ── South-Central Bengaluru ──
  o('Blinkit Koramangala',      '560034', 'Bengaluru', 'Karnataka', 12.9317, 77.6245, 3, '10 mins'),
  o('Blinkit BTM Layout',       '560029', 'Bengaluru', 'Karnataka', 12.9172, 77.6101, 3, '10 mins'),
  o('Blinkit Jayanagar',        '560041', 'Bengaluru', 'Karnataka', 12.9253, 77.5831, 3, '10 mins'),
  o('Blinkit JP Nagar',         '560078', 'Bengaluru', 'Karnataka', 12.9103, 77.5852, 3, '10 mins'),
  o('Blinkit Banashankari',     '560019', 'Bengaluru', 'Karnataka', 12.9249, 77.5620, 3, '10 mins'),
  o('Blinkit HSR Layout',       '560102', 'Bengaluru', 'Karnataka', 12.9066, 77.6336, 3, '10 mins'),
  // ── East Bengaluru ──
  o('Blinkit Marathahalli',     '560037', 'Bengaluru', 'Karnataka', 12.9591, 77.6974, 3, '10 mins'),
  o('Blinkit Whitefield',       '560066', 'Bengaluru', 'Karnataka', 12.9770, 77.7480, 3, '10 mins'),
  o('Blinkit KR Puram',         '560036', 'Bengaluru', 'Karnataka', 12.9887, 77.6980, 3, '10 mins'),
  o('Blinkit Bellandur',        '560103', 'Bengaluru', 'Karnataka', 12.9264, 77.6770, 3, '10 mins'),
  o('Blinkit Sarjapur Road',    '560035', 'Bengaluru', 'Karnataka', 12.9127, 77.6693, 3, '10 mins'),
  // ── South Bengaluru ──
  o('Blinkit Electronic City',  '560068', 'Bengaluru', 'Karnataka', 12.8397, 77.6762, 3, '10 mins'),
  o('Blinkit Bannerghatta Road','560076', 'Bengaluru', 'Karnataka', 12.8930, 77.5970, 3, '10 mins'),
];

// ════════════════════════════════════════════════════════════════════
// ZEPTO — 3km radius
// 22 outlets across Bengaluru
// ════════════════════════════════════════════════════════════════════
const ZEPTO = [
  o('Zepto Yelahanka',          '560064', 'Bengaluru', 'Karnataka', 13.0890, 77.5980, 3, '10 mins'),
  o('Zepto Hebbal',             '560024', 'Bengaluru', 'Karnataka', 13.0400, 77.5960, 3, '10 mins'),
  o('Zepto Hennur',             '560043', 'Bengaluru', 'Karnataka', 13.0320, 77.6410, 3, '10 mins'),
  o('Zepto Sadashivanagar',     '560080', 'Bengaluru', 'Karnataka', 13.0050, 77.5780, 3, '10 mins'),
  o('Zepto Malleswaram',        '560003', 'Bengaluru', 'Karnataka', 13.0080, 77.5700, 3, '10 mins'),
  o('Zepto Rajajinagar',        '560010', 'Bengaluru', 'Karnataka', 12.9960, 77.5560, 3, '10 mins'),
  o('Zepto MG Road',            '560001', 'Bengaluru', 'Karnataka', 12.9740, 77.6050, 3, '10 mins'),
  o('Zepto Indiranagar',        '560038', 'Bengaluru', 'Karnataka', 12.9800, 77.6350, 3, '10 mins'),
  o('Zepto Koramangala',        '560034', 'Bengaluru', 'Karnataka', 12.9334, 77.6270, 3, '10 mins'),
  o('Zepto Jayanagar',          '560041', 'Bengaluru', 'Karnataka', 12.9300, 77.5860, 3, '10 mins'),
  o('Zepto BTM Layout',         '560029', 'Bengaluru', 'Karnataka', 12.9140, 77.6070, 3, '10 mins'),
  o('Zepto JP Nagar',           '560078', 'Bengaluru', 'Karnataka', 12.9080, 77.5900, 3, '10 mins'),
  o('Zepto Banashankari',       '560019', 'Bengaluru', 'Karnataka', 12.9200, 77.5680, 3, '10 mins'),
  o('Zepto HSR Layout',         '560102', 'Bengaluru', 'Karnataka', 12.9116, 77.6411, 3, '10 mins'),
  o('Zepto Marathahalli',       '560037', 'Bengaluru', 'Karnataka', 12.9620, 77.6950, 3, '10 mins'),
  o('Zepto Whitefield',         '560066', 'Bengaluru', 'Karnataka', 12.9730, 77.7460, 3, '10 mins'),
  o('Zepto Bellandur',          '560103', 'Bengaluru', 'Karnataka', 12.9248, 77.6770, 3, '10 mins'),
  o('Zepto Sarjapur Road',      '560035', 'Bengaluru', 'Karnataka', 12.9080, 77.6700, 3, '10 mins'),
  o('Zepto Electronic City',    '560068', 'Bengaluru', 'Karnataka', 12.8450, 77.6780, 3, '10 mins'),
  o('Zepto Bannerghatta Road',  '560076', 'Bengaluru', 'Karnataka', 12.8870, 77.5990, 3, '10 mins'),
  o('Zepto Vijayanagar',        '560040', 'Bengaluru', 'Karnataka', 12.9680, 77.5360, 3, '10 mins'),
  o('Zepto Nagarbhavi',         '560072', 'Bengaluru', 'Karnataka', 12.9580, 77.5100, 3, '10 mins'),
];

// ════════════════════════════════════════════════════════════════════
// SWIGGY INSTAMART — 3km radius
// 22 outlets across Bengaluru
// ════════════════════════════════════════════════════════════════════
const INSTAMART = [
  o('Instamart Yelahanka',         '560064', 'Bengaluru', 'Karnataka', 13.1005, 77.5963, 3, '10 mins'),
  o('Instamart Hebbal',            '560024', 'Bengaluru', 'Karnataka', 13.0530, 77.5930, 3, '10 mins'),
  o('Instamart Nagawara',          '560077', 'Bengaluru', 'Karnataka', 13.0480, 77.6300, 3, '10 mins'),
  o('Instamart Yeshwanthpur',      '560022', 'Bengaluru', 'Karnataka', 13.0250, 77.5490, 3, '10 mins'),
  o('Instamart Rajajinagar',       '560010', 'Bengaluru', 'Karnataka', 12.9911, 77.5501, 3, '10 mins'),
  o('Instamart Malleswaram',       '560003', 'Bengaluru', 'Karnataka', 13.0026, 77.5655, 3, '10 mins'),
  o('Instamart Jayanagar',         '560041', 'Bengaluru', 'Karnataka', 12.9308, 77.5831, 3, '10 mins'),
  o('Instamart JP Nagar',          '560078', 'Bengaluru', 'Karnataka', 12.9103, 77.5852, 3, '10 mins'),
  o('Instamart Koramangala',       '560034', 'Bengaluru', 'Karnataka', 12.9380, 77.6280, 3, '10 mins'),
  o('Instamart BTM Layout',        '560029', 'Bengaluru', 'Karnataka', 12.9210, 77.6130, 3, '10 mins'),
  o('Instamart HSR Layout',        '560102', 'Bengaluru', 'Karnataka', 12.9100, 77.6370, 3, '10 mins'),
  o('Instamart Indiranagar',       '560038', 'Bengaluru', 'Karnataka', 12.9750, 77.6380, 3, '10 mins'),
  o('Instamart Banashankari',      '560019', 'Bengaluru', 'Karnataka', 12.9260, 77.5640, 3, '10 mins'),
  o('Instamart Marathahalli',      '560037', 'Bengaluru', 'Karnataka', 12.9550, 77.6920, 3, '10 mins'),
  o('Instamart Whitefield',        '560066', 'Bengaluru', 'Karnataka', 12.9810, 77.7500, 3, '10 mins'),
  o('Instamart Bellandur',         '560103', 'Bengaluru', 'Karnataka', 12.9230, 77.6750, 3, '10 mins'),
  o('Instamart Sarjapur Road',     '560035', 'Bengaluru', 'Karnataka', 12.9150, 77.6680, 3, '10 mins'),
  o('Instamart Electronic City',   '560068', 'Bengaluru', 'Karnataka', 12.8420, 77.6790, 3, '10 mins'),
  o('Instamart Bannerghatta Road', '560076', 'Bengaluru', 'Karnataka', 12.8910, 77.5960, 3, '10 mins'),
  o('Instamart Vijayanagar',       '560040', 'Bengaluru', 'Karnataka', 12.9720, 77.5350, 3, '10 mins'),
  o('Instamart KR Puram',          '560036', 'Bengaluru', 'Karnataka', 12.9900, 77.6990, 3, '10 mins'),
  o('Instamart Nagarbhavi',        '560072', 'Bengaluru', 'Karnataka', 12.9640, 77.5130, 3, '10 mins'),
];

// ════════════════════════════════════════════════════════════════════
// DMART — 8km radius hypermarkets
// 12 outlets → full Bengaluru coverage
// ════════════════════════════════════════════════════════════════════
const DMART = [
  o('DMart Koramangala',       '560034', 'Bengaluru', 'Karnataka', 12.9352, 77.6245, 8, null, '80 Feet Rd, Koramangala'),
  o('DMart Jayanagar',         '560041', 'Bengaluru', 'Karnataka', 12.9266, 77.5831, 8, null, '11th Main, Jayanagar'),
  o('DMart HSR Layout',        '560102', 'Bengaluru', 'Karnataka', 12.9116, 77.6411, 8, null, 'Sector 1, HSR Layout'),
  o('DMart Whitefield',        '560066', 'Bengaluru', 'Karnataka', 12.9698, 77.7500, 8, null, 'Hope Farm, Whitefield'),
  o('DMart Bannerghatta Road', '560076', 'Bengaluru', 'Karnataka', 12.8697, 77.5970, 8, null, 'Bannerghatta Rd'),
  o('DMart Rajajinagar',       '560010', 'Bengaluru', 'Karnataka', 12.9925, 77.5551, 8, null, '3rd Block, Rajajinagar'),
  o('DMart Hebbal',            '560024', 'Bengaluru', 'Karnataka', 13.0358, 77.5970, 8, null, 'Bellary Rd, Hebbal'),
  o('DMart Marathahalli',      '560037', 'Bengaluru', 'Karnataka', 12.9591, 77.6974, 8, null, 'Marathahalli Bridge'),
  o('DMart JP Nagar',          '560078', 'Bengaluru', 'Karnataka', 12.9078, 77.5880, 8, null, 'JP Nagar 2nd Phase'),
  o('DMart Yeshwanthpur',      '560022', 'Bengaluru', 'Karnataka', 13.0209, 77.5484, 8, null, 'Tumkur Rd, Yeshwanthpur'),
  o('DMart Electronic City',   '560068', 'Bengaluru', 'Karnataka', 12.8397, 77.6762, 8, null, 'Electronic City Phase 1'),
  o('DMart Nagarbhavi',        '560072', 'Bengaluru', 'Karnataka', 12.9633, 77.5120, 8, null, 'Chord Rd, Nagarbhavi'),
  // Other cities
  o('DMart Mysuru Vijayanagar','570017', 'Mysuru',    'Karnataka', 12.3052, 76.6140, 8, null),
  o('DMart Mysuru Saraswathipuram','570009','Mysuru', 'Karnataka', 12.3176, 76.6394, 8, null),
  o('DMart Hyderabad Kukatpally','500072','Hyderabad','Telangana', 17.4948, 78.3996, 8, null),
  o('DMart Hyderabad Miyapur', '500049', 'Hyderabad', 'Telangana', 17.4962, 78.3565, 8, null),
  o('DMart Hyderabad LB Nagar','500074', 'Hyderabad', 'Telangana', 17.3491, 78.5522, 8, null),
  o('DMart Mumbai Powai',      '400076', 'Mumbai',    'Maharashtra',19.1176, 72.9060, 6, null),
  o('DMart Mumbai Malad',      '400064', 'Mumbai',    'Maharashtra',19.1864, 72.8488, 6, null),
  o('DMart Delhi Rohini',      '110085', 'Delhi',     'Delhi',      28.7234, 77.1149, 8, null),
  o('DMart Delhi Dwarka',      '110075', 'Delhi',     'Delhi',      28.5921, 77.0460, 8, null),
  o('DMart Chennai Velachery', '600042', 'Chennai',   'Tamil Nadu', 12.9750, 80.2176, 8, null),
  o('DMart Pune Aundh',        '411007', 'Pune',      'Maharashtra',18.5590, 73.8078, 8, null),
];

// ════════════════════════════════════════════════════════════════════
// RELIANCE SMART — 5km radius supermarkets
// ════════════════════════════════════════════════════════════════════
const RELIANCE_SMART = [
  o('Reliance Smart Indiranagar','560038','Bengaluru','Karnataka', 12.9784, 77.6408, 5, null, '100 Feet Rd'),
  o('Reliance Smart MG Road',   '560001','Bengaluru', 'Karnataka', 12.9757, 77.6096, 5, null, 'MG Road'),
  o('Reliance Smart Malleswaram','560003','Bengaluru','Karnataka', 13.0026, 77.5655, 5, null, 'Sampige Rd'),
  o('Reliance Smart JP Nagar',  '560078','Bengaluru', 'Karnataka', 12.9103, 77.5852, 5, null, 'JP Nagar 3rd Phase'),
  o('Reliance Smart Whitefield','560066','Bengaluru', 'Karnataka', 12.9698, 77.7500, 5, null, 'ITPL Rd'),
  o('Reliance Smart Hebbal',    '560024','Bengaluru', 'Karnataka', 13.0358, 77.5970, 5, null, 'Bellary Rd'),
  o('Reliance Smart Electronic City','560068','Bengaluru','Karnataka',12.8397,77.6762,5, null, 'EC Phase 2'),
  o('Reliance Smart Mysuru',    '570010','Mysuru',    'Karnataka', 12.2957, 76.6358, 5, null, 'Nazarbad'),
  o('Reliance Smart Hyderabad', '500034','Hyderabad', 'Telangana', 17.4105, 78.4483, 5, null, 'Banjara Hills'),
  o('Reliance Smart Mumbai',    '400053','Mumbai',    'Maharashtra',19.1371, 72.8296, 5, null, 'Andheri West'),
  o('Reliance Smart Delhi',     '110070','Delhi',     'Delhi',      28.5214, 77.1588, 5, null, 'Vasant Kunj'),
  o('Reliance Smart Chennai',   '600040','Chennai',   'Tamil Nadu', 13.0850, 80.2101, 5, null, 'Anna Nagar'),
];

// ════════════════════════════════════════════════════════════════════
// SPAR — 5km radius
// ════════════════════════════════════════════════════════════════════
const SPAR = [
  o('SPAR Marathahalli',  '560037','Bengaluru','Karnataka', 12.9591, 77.6974, 5, null),
  o('SPAR JP Nagar',      '560078','Bengaluru','Karnataka', 12.9103, 77.5852, 5, null),
  o('SPAR Koramangala',   '560095','Bengaluru','Karnataka', 12.9317, 77.6245, 5, null),
  o('SPAR Hebbal',        '560024','Bengaluru','Karnataka', 13.0358, 77.5970, 5, null),
  o('SPAR Mysuru',        '570017','Mysuru',   'Karnataka', 12.3010, 76.6073, 5, null),
  o('SPAR Hyderabad',     '500033','Hyderabad','Telangana', 17.4316, 78.4109, 5, null),
];

// ════════════════════════════════════════════════════════════════════
// MORE — 4km radius supermarkets
// ════════════════════════════════════════════════════════════════════
const MORE = [
  o('More BTM Layout',   '560076','Bengaluru','Karnataka', 12.9166, 77.6101, 4, null),
  o('More Bellandur',    '560103','Bengaluru','Karnataka', 12.9248, 77.6784, 4, null),
  o('More Koramangala',  '560034','Bengaluru','Karnataka', 12.9420, 77.6300, 4, null),
  o('More Jayanagar',    '560041','Bengaluru','Karnataka', 12.9308, 77.5831, 4, null),
  o('More Indiranagar',  '560038','Bengaluru','Karnataka', 12.9784, 77.6408, 4, null),
  o('More Rajajinagar',  '560010','Bengaluru','Karnataka', 12.9925, 77.5551, 4, null),
  o('More Hebbal',       '560024','Bengaluru','Karnataka', 13.0358, 77.5970, 4, null),
  o('More Whitefield',   '560066','Bengaluru','Karnataka', 12.9698, 77.7500, 4, null),
  o('More Mysuru',       '570023','Mysuru',   'Karnataka', 12.2869, 76.6440, 4, null),
  o('More Hyderabad',    '500038','Hyderabad','Telangana', 17.4378, 78.4484, 4, null),
  o('More Mumbai',       '400086','Mumbai',   'Maharashtra',19.0840, 72.9104, 4, null),
];

// ════════════════════════════════════════════════════════════════════
// BIGBASKET — City-wide warehouses (large radius)
// ════════════════════════════════════════════════════════════════════
const BIGBASKET = [
  o('BigBasket Bengaluru Warehouse', '560099','Bengaluru','Karnataka', 12.8133, 77.6887, 50, 'Next day', 'Bommasandra Industrial Area'),
  o('BigBasket Bengaluru Hub 2',     '560058','Bengaluru','Karnataka', 13.0265, 77.5206, 30, 'Next day', 'Peenya Industrial Area'),
  o('BigBasket Mysuru Warehouse',    '570016','Mysuru',   'Karnataka', 12.3524, 76.6411, 35, 'Next day', 'Hebbal Industrial Area'),
  o('BigBasket Hyderabad Warehouse', '500039','Hyderabad','Telangana', 17.4057, 78.5590, 45, 'Next day', 'Uppal'),
  o('BigBasket Mumbai Warehouse',    '421302','Mumbai',   'Maharashtra',19.2985, 73.0635, 55, 'Next day', 'Bhiwandi'),
  o('BigBasket Delhi Warehouse',     '131028','Delhi',    'Haryana',    28.8759, 77.0576, 65, 'Next day', 'Kundli'),
  o('BigBasket Chennai Warehouse',   '600053','Chennai',  'Tamil Nadu', 13.1127, 80.1548, 45, 'Next day', 'Ambattur'),
  o('BigBasket Pune Warehouse',      '411028','Pune',     'Maharashtra',18.4975, 73.9282, 40, 'Next day', 'Hadapsar'),
  o('BigBasket Bidar Hub',           '585201','Bidar',    'Karnataka', 17.9107, 77.5199, 30, 'Next day'),
];

// ════════════════════════════════════════════════════════════════════
// JIOMART — City-wide hubs (very large radius to cover rural areas)
// ════════════════════════════════════════════════════════════════════
const JIOMART = [
  o('JioMart Bengaluru Hub',  '560032','Bengaluru','Karnataka', 12.9716, 77.5946, 50, '2 hours'),
  o('JioMart Mysuru Hub',     '570001','Mysuru',   'Karnataka', 12.2958, 76.6394, 35, '2 hours'),
  o('JioMart Bidar Hub',      '585201','Bidar',    'Karnataka', 17.9107, 77.5199, 40, '2 hours'),
  o('JioMart Kalaburagi Hub', '585102','Kalaburagi','Karnataka',17.3297, 76.8343, 40, '2 hours'),
  o('JioMart Raichur Hub',    '584101','Raichur',  'Karnataka', 16.2076, 77.3463, 40, '2 hours'),
  o('JioMart Davangere Hub',  '577001','Davangere','Karnataka', 14.4644, 75.9218, 35, '2 hours'),
  o('JioMart Shivamogga Hub', '577201','Shivamogga','Karnataka',13.9299, 75.5681, 35, '2 hours'),
  o('JioMart Hubballi Hub',   '580020','Hubballi', 'Karnataka', 15.3647, 75.1240, 40, '2 hours'),
  o('JioMart Mangaluru Hub',  '575001','Mangaluru','Karnataka', 12.9141, 74.8560, 40, '2 hours'),
  o('JioMart Hyderabad Hub',  '500003','Hyderabad','Telangana', 17.3850, 78.4867, 45, '2 hours'),
  o('JioMart Mumbai Hub',     '400001','Mumbai',   'Maharashtra',18.9388, 72.8354, 50, '2 hours'),
  o('JioMart Delhi Hub',      '110001','Delhi',    'Delhi',      28.6448, 77.2167, 55, '2 hours'),
  o('JioMart Chennai Hub',    '600001','Chennai',  'Tamil Nadu', 13.0827, 80.2707, 45, '2 hours'),
  o('JioMart Pune Hub',       '411001','Pune',     'Maharashtra',18.5204, 73.8567, 40, '2 hours'),
];

// ════════════════════════════════════════════════════════════════════
// Compile all outlet data
// ════════════════════════════════════════════════════════════════════
const OUTLET_DATA = [
  { slug: 'blinkit',          outlets: BLINKIT },
  { slug: 'zepto',            outlets: ZEPTO },
  { slug: 'swiggy-instamart', outlets: INSTAMART },
  { slug: 'dmart',            outlets: DMART },
  { slug: 'reliance-smart',   outlets: RELIANCE_SMART },
  { slug: 'spar',             outlets: SPAR },
  { slug: 'more',             outlets: MORE },
  { slug: 'bigbasket',        outlets: BIGBASKET },
  { slug: 'jiomart',          outlets: JIOMART },
];

// ─── Seeding function ─────────────────────────────────────────────
const seedOutlets = async () => {
  let total = 0;

  for (const chain of OUTLET_DATA) {
    const store = await Store.findOne({ slug: chain.slug });
    if (!store) {
      console.warn(`  ⚠  Store not found: ${chain.slug} — run npm run seed first`);
      continue;
    }

    for (const outlet of chain.outlets) {
      await StoreOutlet.findOneAndUpdate(
        { storeId: store._id, name: outlet.name },
        {
          storeId:         store._id,
          storeName:       store.name,
          storeSlug:       chain.slug,
          name:            outlet.name,
          address:         outlet.address || '',
          pincode:         outlet.pincode,
          city:            outlet.city,
          district:        outlet.city,
          state:           outlet.state,
          location:        { type: 'Point', coordinates: [outlet.lng, outlet.lat] },
          serviceRadiusKm: outlet.serviceRadiusKm,
          deliveryTime:    outlet.deliveryTime || store.deliveryTime,
          isActive:        true,
        },
        { upsert: true, new: true }
      );
      total++;
    }
    console.log(`  ✓  ${store.name.padEnd(20)} ${chain.outlets.length} outlets`);
  }

  console.log(`\n✅  Total: ${total} outlets seeded`);
};

(async () => {
  try {
    await connectDB();
    await seedOutlets();
    process.exit(0);
  } catch (err) {
    console.error('❌ Outlet seeding failed:', err.message);
    process.exit(1);
  }
})();
