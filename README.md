# 🛒 SmartBasket — Grocery Price Comparison Platform

> Compare grocery prices across DMart, BigBasket, Blinkit, Zepto, JioMart, Swiggy Instamart and more — with pincode-based local pricing.

---

## 📦 Project Structure

```
smartbasket/
├── backend/          # Node.js + Express API
├── web/              # Next.js 14 Web Frontend
├── mobile/           # React Native + Expo (Play Store)
├── devops/           # Nginx, render.yaml
├── docker-compose.yml
└── README.md
```

---

## ⚡ Quick Start (Local)

### 1 · Install

```bash
cd backend  && npm install
cd ../web   && npm install
cd ../mobile && npm install
```

### 2 · Configure .env

```bash
cp backend/.env.example backend/.env
cp web/.env.example     web/.env.local
cp mobile/.env.example  mobile/.env
# Edit all three files with your credentials
```

### 3 · Start databases

```bash
docker-compose up mongo redis -d
```

### 4 · Seed everything (one command)

```bash
cd backend
npm run seed:all
# Seeds: 9 stores · 55 products · admin user
#        130+ store outlets · 95 Bengaluru pincodes pre-cached
```

### 5 · Run

```bash
# Terminal 1
cd backend && npm run dev        # → http://localhost:5000

# Terminal 2
cd web && npm run dev            # → http://localhost:3000

# Terminal 3
cd mobile && npx expo start --localhost --port 8082
# If port 8081 is available, omit the host/port flags.
```

---

## ☁️ External Services (all free tiers)

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [MongoDB Atlas](https://cloud.mongodb.com) | Database | M0 — 512 MB |
| [Upstash Redis](https://upstash.com) | Cache | 10k req/day |
| [Cloudinary](https://cloudinary.com) | Bill images | 25 GB |
| [Anthropic Claude](https://console.anthropic.com) | OCR | Pay-per-use (~₹0.5/bill) |
| [Firebase](https://console.firebase.google.com) | Push notifications | Free forever |
| [Google Cloud](https://console.cloud.google.com) | OAuth login | Free |

> **Location geocoding (India Post API + Nominatim) — completely free, no key needed.**

---

## 📍 Location-Based Pricing

Users enter their pincode. SmartBasket:

1. Checks MongoDB cache (pre-seeded for all Bengaluru pincodes — instant)
2. Falls back to India Post API + Nominatim for new pincodes
3. Runs MongoDB `$nearSphere` geospatial query to find outlets within radius
4. Returns stores sorted by distance with delivery time
5. Price comparison filtered to only show available stores

### Coverage levels shown to user

| Level | Meaning |
|-------|---------|
| ✅ Full coverage | Physical + quick-commerce + online stores |
| 🛍 Partial coverage | Some physical or online stores |
| ⚠️ Online delivery only | BigBasket/JioMart only (rural areas) |

### Service radius by store type

| Store | Radius | Delivery |
|-------|--------|---------|
| Blinkit / Zepto / Swiggy Instamart | 3 km | 10 mins |
| SPAR / Reliance Smart / More | 4–5 km | Walk-in |
| DMart | 8 km | Walk-in |
| BigBasket | 50 km (warehouse) | Next day |
| JioMart | 50 km (hub) | 2 hours |

---

## 🗺️ Bengaluru Coverage (95 pincodes pre-seeded)

All areas of Bengaluru are covered out of the box after running `npm run seed:all`.

### Quick commerce (Blinkit · Zepto · Swiggy Instamart) — 3 km radius

28 Blinkit + 22 Zepto + 22 Swiggy Instamart = **72 dark stores** placed strategically across:

| Zone | Areas Covered |
|------|--------------|
| North | Yelahanka, Hebbal, Nagawara, Kalyan Nagar, Sadashivanagar, Yeshwanthpur, Peenya |
| Central | Malleswaram, Rajajinagar, MG Road, Frazer Town, Indiranagar, Domlur, Vijayanagar |
| South-Central | Koramangala, BTM Layout, Jayanagar, JP Nagar, Banashankari, HSR Layout |
| East | Marathahalli, Whitefield, KR Puram, Bellandur, Sarjapur Road |
| South | Electronic City, Bannerghatta Road |
| West | Nagarbhavi, Kengeri belt |

### Physical stores (DMart · Reliance Smart · SPAR · More)

12 DMart + 7 Reliance Smart + 6 SPAR + 11 More = **36 physical outlets**

### Online (BigBasket · JioMart) — city-wide

2 warehouse hubs with **50 km radius** covering all of Bengaluru and surrounding areas including Devanahalli, Anekal, Kanakapura, Nelamangala.

### Sample pincode → store mapping

| Pincode | Area | Quick Commerce | Physical | Online |
|---------|------|---------------|----------|--------|
| 560034 | Koramangala | Blinkit · Zepto · Swiggy | DMart · SPAR | BigBasket · JioMart |
| 560066 | Whitefield | Blinkit · Zepto · Swiggy | DMart | BigBasket · JioMart |
| 560064 | Yelahanka | Blinkit · Zepto · Swiggy | DMart | BigBasket · JioMart |
| 560068 | Electronic City | Blinkit · Zepto · Swiggy | DMart | BigBasket · JioMart |
| 560065 | Devanahalli | — | — | BigBasket · JioMart |
| 585228 | Bidar | — | — | JioMart |
| 584170 | Raichur | — | — | JioMart |

---

## 🌐 Web Deployment (Vercel + Render — free)

```bash
# Backend → Render.com
# 1. Push to GitHub
# 2. New Web Service → connect repo → Root Dir: backend
# 3. Build: npm install · Start: node src/app.js
# 4. Add env vars in Render dashboard

# Web → Vercel
cd web && npx vercel --prod
# Set NEXT_PUBLIC_API_URL = https://your-app.onrender.com/api
```

---

## 📱 Play Store Deployment

```bash
cd mobile

# 1. Install EAS CLI
npm install -g eas-cli && eas login

# 2. Configure (run once)
eas build:configure

# 3. Add assets to mobile/assets/
#    icon.png (1024×1024), adaptive-icon.png, splash.png

# 4. Add Firebase
#    Download google-services.json → mobile/google-services.json

# 5. Set production API URL in mobile/.env
EXPO_PUBLIC_API_URL=https://api.smartbasket.in/api

# 6. Build AAB for Play Store
eas build --platform android --profile production

# 7. Upload to Play Console
eas submit --platform android --profile production
```

**Play Store listing:**
- App name: SmartBasket - Grocery Price Compare
- Category: Shopping
- Content rating: Everyone
- Permissions: Camera (bill scanning), Notifications (price alerts)

---

## 🔑 First Admin Setup

```bash
# The seed script creates admin automatically using ADMIN_EMAIL/ADMIN_PASSWORD from .env
# Or manually:
mongosh "your-mongodb-uri"
db.users.updateOne({ email: "you@email.com" }, { $set: { role: "admin" } })
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/google` | Google OAuth |

### Location
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/location/pincode/:pincode` | Lookup pincode + nearby stores |
| GET | `/api/location/stores/:pincode` | Store IDs for pincode |
| GET | `/api/location/autocomplete?q=560` | Pincode autocomplete |
| GET | `/api/location/coverage/bangalore` | Coverage stats |
| POST | `/api/location/save` | Save user pincode |

### Products & Prices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/search?q=sugar` | Search products |
| GET | `/api/products/trending` | Trending |
| GET | `/api/prices/compare/:id?pincode=560034` | Compare prices (location-aware) |
| POST | `/api/prices/optimize` | Basket optimizer |
| POST | `/api/prices` | Submit a price |

### Bills & Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bills/upload` | Upload bill (Claude OCR) |
| GET | `/api/bills` | Bill history |
| POST | `/api/alerts` | Create price alert |
| GET | `/api/alerts` | List alerts |
| GET | `/api/analytics/me` | Spend analytics |

---

## 🏗️ Architecture

```
Mobile (Expo)          Web (Next.js)
      │                      │
      └──────────┬───────────┘
                 │  HTTPS REST
         ┌───────▼────────┐
         │ Express API     │  Rate limiting · JWT · Redis cache
         └───────┬────────┘
                 │
     ┌───────────┼────────────┐
  MongoDB      Redis       Cloudinary
  Atlas       (Cache)      (Images)
     │
  Geospatial    Claude AI   Firebase FCM
  (2dsphere)    (OCR)      (Alerts)
```

---

## 🚀 Tech Stack

| Layer | Tech |
|-------|------|
| Mobile | React Native + Expo + Expo Router |
| Web | Next.js 14 + TypeScript + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB Atlas (with 2dsphere indexes) |
| Cache | Redis (Upstash) |
| Geolocation | India Post API + Nominatim (free) |
| Auth | JWT + Google OAuth |
| OCR | Claude API (Anthropic) |
| Storage | Cloudinary |
| Push | Firebase Cloud Messaging |
| Deployment | Render + Vercel + Expo EAS |
