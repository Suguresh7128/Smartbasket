/**
 * seedBangalorePincodes.js
 * ─────────────────────────────────────────────────────────────────
 * Pre-populates PincodeCache with all ~100 Bengaluru pincodes so
 * users get instant lookup results without waiting for India Post
 * API or Nominatim geocoding on first visit.
 *
 * Run: node src/utils/seedBangalorePincodes.js
 * ─────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const mongoose     = require('mongoose');
const PincodeCache = require('../models/PincodeCache');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[DB] Connected');
};

// ─── All major Bengaluru pincodes with area names & coordinates ───
const BANGALORE_PINCODES = [
  // ── Core city ──────────────────────────────────────────────────
  { pincode:'560001', area:'MG Road / Brigade Road',         lat:12.9757, lng:77.6096 },
  { pincode:'560002', area:'Shivajinagar',                   lat:12.9812, lng:77.5972 },
  { pincode:'560003', area:'Malleswaram',                    lat:13.0026, lng:77.5655 },
  { pincode:'560004', area:'Basavangudi',                    lat:12.9438, lng:77.5748 },
  { pincode:'560005', area:'Frazer Town / Gandhinagar',      lat:12.9835, lng:77.5765 },
  { pincode:'560006', area:'Lingarajapuram',                 lat:12.9960, lng:77.6240 },
  { pincode:'560008', area:'Rajajinagar (East)',             lat:12.9870, lng:77.5600 },
  { pincode:'560009', area:'Rajajinagar / Vijayanagar',      lat:12.9800, lng:77.5480 },
  { pincode:'560010', area:'Rajajinagar',                    lat:12.9925, lng:77.5551 },
  { pincode:'560011', area:'Jayanagar (West)',               lat:12.9266, lng:77.5831 },
  { pincode:'560012', area:'Koramangala (Old)',              lat:12.9341, lng:77.6108 },
  { pincode:'560013', area:'Adugodi',                        lat:12.9400, lng:77.6120 },
  { pincode:'560017', area:'Suddaguntepalya',                lat:12.9650, lng:77.6020 },
  { pincode:'560019', area:'Banashankari',                   lat:12.9249, lng:77.5620 },
  { pincode:'560020', area:'Vijayanagar (South)',            lat:12.9540, lng:77.5350 },
  { pincode:'560021', area:'Tumkur Road / Rajajinagar',      lat:13.0050, lng:77.5350 },
  { pincode:'560022', area:'Yeshwanthpur / Peenya',          lat:13.0209, lng:77.5484 },
  { pincode:'560023', area:'Mahalakshmipuram',               lat:13.0060, lng:77.5500 },
  { pincode:'560024', area:'Hebbal',                         lat:13.0358, lng:77.5970 },
  { pincode:'560025', area:'Vidyaranyapura',                 lat:13.0720, lng:77.5660 },
  { pincode:'560026', area:'Nagarbhavi',                     lat:12.9633, lng:77.5120 },
  { pincode:'560027', area:'Kumarapark / Palace Guttahalli', lat:12.9958, lng:77.5844 },
  { pincode:'560028', area:'Jalahalli',                      lat:13.0530, lng:77.5230 },
  { pincode:'560029', area:'BTM Layout',                     lat:12.9172, lng:77.6101 },
  { pincode:'560030', area:'Kengeri',                        lat:12.9185, lng:77.4891 },
  { pincode:'560032', area:'Rajajinagar (Main)',             lat:12.9860, lng:77.5530 },
  { pincode:'560033', area:'Hanumanthanagar / Basavangudi',  lat:12.9370, lng:77.5730 },
  { pincode:'560034', area:'Koramangala',                    lat:12.9317, lng:77.6270 },
  { pincode:'560035', area:'Sarjapur Road',                  lat:12.9127, lng:77.6693 },
  { pincode:'560036', area:'KR Puram',                       lat:12.9887, lng:77.6980 },
  { pincode:'560037', area:'Marathahalli',                   lat:12.9591, lng:77.6974 },
  { pincode:'560038', area:'Indiranagar',                    lat:12.9784, lng:77.6408 },
  { pincode:'560039', area:'CV Raman Nagar',                 lat:12.9849, lng:77.6707 },
  { pincode:'560040', area:'Vijayanagar',                    lat:12.9710, lng:77.5330 },
  { pincode:'560041', area:'Jayanagar',                      lat:12.9266, lng:77.5831 },
  { pincode:'560042', area:'Chamarajpet',                    lat:12.9661, lng:77.5658 },
  { pincode:'560043', area:'Hennur / Kalyan Nagar',          lat:13.0296, lng:77.6385 },
  { pincode:'560045', area:'Domlur',                         lat:12.9614, lng:77.6381 },
  { pincode:'560046', area:'Richmond Town / Langford Town',  lat:12.9614, lng:77.5990 },
  { pincode:'560047', area:'Lingarajapuram',                 lat:13.0020, lng:77.6280 },
  { pincode:'560048', area:'HAL Airport Road / Kodihalli',   lat:12.9609, lng:77.6478 },
  { pincode:'560050', area:'Whitefield (Old Town)',          lat:12.9815, lng:77.7309 },
  { pincode:'560051', area:'Wilson Garden',                  lat:12.9540, lng:77.5940 },
  { pincode:'560052', area:'Ulsoor',                         lat:12.9833, lng:77.6162 },
  { pincode:'560053', area:'Richmond Town',                  lat:12.9730, lng:77.6000 },
  { pincode:'560054', area:'Artillery Road / Cantonment',    lat:12.9938, lng:77.6130 },
  { pincode:'560055', area:'Benson Town / Fraser Town',      lat:13.0005, lng:77.6055 },
  { pincode:'560056', area:'KR Puram (West)',                lat:12.9920, lng:77.6780 },
  { pincode:'560058', area:'Peenya / Mahalakshmipuram',      lat:13.0265, lng:77.5206 },
  { pincode:'560059', area:'Mysore Road',                    lat:12.9600, lng:77.5090 },
  { pincode:'560060', area:'Padmanabhanagar / Kengeri',      lat:12.9185, lng:77.5091 },
  { pincode:'560061', area:'Hulimavu / Arekere',             lat:12.8780, lng:77.6070 },
  { pincode:'560062', area:'Bannerghatta',                   lat:12.8860, lng:77.5930 },
  { pincode:'560063', area:'Bommanahalli / Hongasandra',     lat:12.8940, lng:77.6310 },
  { pincode:'560064', area:'Yelahanka',                      lat:13.1005, lng:77.5963 },
  { pincode:'560065', area:'Devanahalli',                    lat:13.2468, lng:77.7141 },
  { pincode:'560066', area:'Whitefield',                     lat:12.9770, lng:77.7480 },
  { pincode:'560067', area:'HBR Layout',                     lat:13.0267, lng:77.6310 },
  { pincode:'560068', area:'Electronic City',                lat:12.8397, lng:77.6762 },
  { pincode:'560069', area:'Gottigere / Bannerghatta',       lat:12.8510, lng:77.5890 },
  { pincode:'560070', area:'Banashankari (3rd Stage)',        lat:12.9100, lng:77.5630 },
  { pincode:'560072', area:'Nagarbhavi / Chord Road',        lat:12.9633, lng:77.5120 },
  { pincode:'560073', area:'Dasarahalli',                    lat:13.0440, lng:77.5100 },
  { pincode:'560074', area:'Old Madras Road / Banaswadi',    lat:13.0060, lng:77.6570 },
  { pincode:'560075', area:'Mahadevapura',                   lat:12.9900, lng:77.7000 },
  { pincode:'560076', area:'Bannerghatta Road / BTM',        lat:12.8930, lng:77.5970 },
  { pincode:'560077', area:'Nagawara',                       lat:13.0462, lng:77.6307 },
  { pincode:'560078', area:'JP Nagar',                       lat:12.9103, lng:77.5852 },
  { pincode:'560079', area:'Mysore Road / Kengeri (West)',   lat:12.9350, lng:77.5020 },
  { pincode:'560080', area:'Sadashivanagar',                 lat:13.0100, lng:77.5844 },
  { pincode:'560082', area:'Ulsoor (South)',                 lat:12.9700, lng:77.6210 },
  { pincode:'560083', area:'Koramangala (8th Block)',        lat:12.9270, lng:77.6320 },
  { pincode:'560085', area:'Nagavara / RT Nagar',            lat:13.0396, lng:77.6140 },
  { pincode:'560086', area:'Thanisandra / Bhattarahalli',    lat:13.0624, lng:77.6430 },
  { pincode:'560087', area:'Uttarahalli',                    lat:12.8997, lng:77.5460 },
  { pincode:'560088', area:'Bannerghatta (South)',           lat:12.8640, lng:77.5810 },
  { pincode:'560089', area:'Chikkagubbi / Kogilu',           lat:13.0730, lng:77.6370 },
  { pincode:'560090', area:'Kalkere / Horamavu',             lat:13.0200, lng:77.6590 },
  { pincode:'560091', area:'Bilekahalli / Hulimavu',         lat:12.8820, lng:77.6160 },
  { pincode:'560092', area:'Nagarabhavi (South)',            lat:12.9530, lng:77.5070 },
  { pincode:'560093', area:'CV Raman Nagar (East)',          lat:12.9760, lng:77.6780 },
  { pincode:'560094', area:'Hulimangala',                    lat:12.8300, lng:77.7000 },
  { pincode:'560095', area:'Koramangala (5th–7th Block)',    lat:12.9280, lng:77.6300 },
  { pincode:'560096', area:'Chamrajpet / Vijayanagar',       lat:12.9640, lng:77.5670 },
  { pincode:'560097', area:'Jakkur / Allalasandra',          lat:13.0740, lng:77.5830 },
  { pincode:'560099', area:'Bommasandra / Begur',            lat:12.8133, lng:77.6887 },
  { pincode:'560100', area:'Sarjapur / Attibele',            lat:12.8690, lng:77.7100 },
  { pincode:'560102', area:'HSR Layout',                     lat:12.9116, lng:77.6411 },
  { pincode:'560103', area:'Bellandur',                      lat:12.9248, lng:77.6770 },
  { pincode:'560104', area:'Kadugodi / Whitefield (North)',  lat:13.0050, lng:77.7530 },
  { pincode:'560105', area:'Bagalur / Hoskote Road',         lat:13.1250, lng:77.7010 },
  { pincode:'560106', area:'Budigere / Old Airport Road',    lat:13.1000, lng:77.7300 },
  // ── Surrounding areas commonly associated with Bengaluru ───────
  { pincode:'562106', area:'Doddaballapur',                  lat:13.2960, lng:77.5360 },
  { pincode:'562114', area:'Anekal',                         lat:12.7124, lng:77.6948 },
  { pincode:'562130', area:'Kanakapura (near Bengaluru)',    lat:12.5459, lng:77.4163 },
  { pincode:'562157', area:'Nelamangala',                    lat:13.0976, lng:77.3941 },
  { pincode:'562162', area:'Tumkur Road (Outskirts)',        lat:13.1500, lng:77.4600 },
];

const seedPincodes = async () => {
  let created = 0;
  let updated = 0;

  for (const entry of BANGALORE_PINCODES) {
    const existing = await PincodeCache.findOne({ pincode: entry.pincode });
    if (existing) {
      if (!existing.lat) {
        existing.lat = entry.lat;
        existing.lng = entry.lng;
        existing.location = { type: 'Point', coordinates: [entry.lng, entry.lat] };
        await existing.save();
        updated++;
      }
      continue;
    }

    await PincodeCache.create({
      pincode:   entry.pincode,
      city:      'Bengaluru',
      district:  'Bengaluru Urban',
      state:     'Karnataka',
      country:   'India',
      lat:       entry.lat,
      lng:       entry.lng,
      location:  { type: 'Point', coordinates: [entry.lng, entry.lat] },
      isValid:   true,
      fetchedAt: new Date(),
    });
    created++;
  }

  console.log(`✅ Bengaluru pincodes: ${created} created, ${updated} coordinates updated`);
  console.log(`   Total pincodes seeded: ${BANGALORE_PINCODES.length}`);
};

(async () => {
  try {
    await connectDB();
    await seedPincodes();
    process.exit(0);
  } catch (err) {
    console.error('❌ Pincode seeding failed:', err.message);
    process.exit(1);
  }
})();
