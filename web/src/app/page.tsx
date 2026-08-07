'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, TrendingUp, Bell, Camera, BarChart3, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsAPI } from '@/services/api';
import { useLocationStore } from '@/store/locationStore';
import LocationBar from '@/components/location/LocationBar';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const LocationPicker = dynamic(() => import('@/components/location/LocationPicker'), { ssr: false });

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [showFirstTimePicker, setShowFirstTimePicker] = useState(false);
  const { location, hydrateFromStorage, setShowPicker } = useLocationStore();

  useEffect(() => {
    hydrateFromStorage();
    const seen = localStorage.getItem('sb_location_seen');
    if (!seen) { setTimeout(() => setShowFirstTimePicker(true), 800); localStorage.setItem('sb_location_seen', '1'); }
  }, [hydrateFromStorage]);

  const { data: trending } = useQuery({
    queryKey: ['trending'],
    queryFn: () => productsAPI.trending().then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const p = new URLSearchParams({ q: query.trim() });
      if (location?.pincode) p.set('pincode', location.pincode);
      router.push(`/search?${p}`);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <ShoppingCart className="w-6 h-6 text-green-600" />
            <span className="text-xl font-bold text-gray-900">Smart<span className="text-green-600">Basket</span></span>
          </Link>
          <div className="flex-1 flex justify-center"><LocationBar /></div>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/search" className="text-gray-600 hover:text-green-600">Search</Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-green-600">Dashboard</Link>
            <Link href="/auth/login" className="bg-green-600 text-white px-4 py-1.5 rounded-full hover:bg-green-700 text-sm font-medium">Sign In</Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white">
        <div className="max-w-3xl mx-auto px-4 py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm mb-5">
            <TrendingUp className="w-4 h-4" /> Compare prices across 9+ stores
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">Never Overpay for Groceries Again</h1>

          {location ? (
            <button onClick={() => setShowPicker(true)}
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 text-sm font-medium mb-5 transition-colors">
              <MapPin className="w-4 h-4" />
              Showing prices for <strong>{location.pincode} — {location.city}</strong>
              <span className="underline text-xs opacity-80">Change</span>
            </button>
          ) : (
            <button onClick={() => setShowPicker(true)}
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 text-sm font-medium mb-5 transition-colors">
              <MapPin className="w-4 h-4" /> Set your pincode for accurate local prices →
            </button>
          )}

          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search Sugar, Rice, Amul Butter…"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl text-gray-900 bg-white text-base outline-none focus:ring-2 focus:ring-green-300" />
            </div>
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3.5 rounded-xl font-semibold flex-shrink-0">Compare</button>
          </form>

          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-green-200">
            {['Sugar 1kg','Tata Salt','Amul Butter','Basmati Rice','Sunflower Oil'].map(s => (
              <button key={s} onClick={() => router.push(`/search?q=${encodeURIComponent(s)}${location?.pincode?`&pincode=${location.pincode}`:''}`)}
                className="hover:text-white hover:underline">{s}</button>
            ))}
          </div>
        </div>
      </section>

      {location && ((location.nearbyOutlets?.length || 0) + (location.onlineStores?.length || 0)) > 0 ? (
        <section className="bg-white border-b py-4">
          <div className="max-w-6xl mx-auto px-4">
            <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Stores serving <strong className="ml-1">{location.pincode} — {location.city}</strong>
            </p>
            <div className="flex flex-wrap gap-2">
              {location.nearbyOutlets?.map((o, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold"
                  style={{borderColor:(o.color||'#16a34a')+'50',color:o.color||'#16a34a',backgroundColor:(o.color||'#16a34a')+'12'}}>
                  {o.storeName} <span className="text-gray-400 font-normal">{o.distanceKm} km</span>
                </div>
              ))}
              {location.onlineStores?.map((s, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold"
                  style={{borderColor:(s.color||'#16a34a')+'50',color:s.color||'#16a34a',backgroundColor:(s.color||'#16a34a')+'12'}}>
                  {s.storeName}{s.deliveryTime&&<span className="text-gray-400 font-normal">· {s.deliveryTime}</span>}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-white border-b py-4">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">Prices from DMart, BigBasket, Blinkit, Zepto, JioMart & more</p>
            <button onClick={() => setShowPicker(true)} className="text-green-600 text-sm font-medium hover:underline flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Set pincode for local prices
            </button>
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8">Everything you need to save more</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            {icon:Search,   title:'Price Comparison', desc:'Compare across 9+ stores instantly',        color:'bg-blue-50 text-blue-600'},
            {icon:MapPin,   title:'Local Prices',      desc:'Prices from stores near your pincode',       color:'bg-green-50 text-green-600'},
            {icon:ShoppingCart,title:'Basket Optimizer',desc:'Find cheapest store for your whole list', color:'bg-emerald-50 text-emerald-600'},
            {icon:Camera,   title:'Bill Scanner',      desc:'Upload bills, auto-extract prices',          color:'bg-orange-50 text-orange-600'},
            {icon:Bell,     title:'Price Alerts',      desc:'Get notified when price drops',              color:'bg-purple-50 text-purple-600'},
            {icon:BarChart3,title:'Spend Analytics',   desc:'Track your monthly grocery spend',           color:'bg-pink-50 text-pink-600'},
          ].map(f => (
            <div key={f.title} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${f.color}`}><f.icon className="w-5 h-5" /></div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">{f.title}</h3>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {trending?.length > 0 && (
        <section className="bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-600" /> Trending</h2>
            <div className="flex flex-wrap gap-2">
              {trending.slice(0,15).map((p:any) => (
                <Link key={p._id} href={`/search?q=${encodeURIComponent(p.productName)}${location?.pincode?`&pincode=${location.pincode}`:''}`}
                  className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm hover:border-green-400 hover:text-green-700">{p.productName}</Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="bg-gray-900 text-gray-400 text-sm py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>© 2025 SmartBasket · Made for Indian Grocery Shoppers</p>
          <p className="mt-1 text-gray-600">Prices are user-submitted and may vary. Verify before purchase.</p>
        </div>
      </footer>

      {showFirstTimePicker && <LocationPicker onClose={() => setShowFirstTimePicker(false)} isModal />}
    </main>
  );
}
