'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Trophy, Tag, Clock, Bell, ChevronDown, MapPin } from 'lucide-react';
import { productsAPI, pricesAPI } from '@/services/api';
import { useLocationStore } from '@/store/locationStore';
import LocationBar from '@/components/location/LocationBar';
import Link from 'next/link';

const CATEGORY_LABELS: Record<string, string> = {
  grains_cereals:'Grains & Cereals',dairy_eggs:'Dairy & Eggs',oils_fats:'Oils & Fats',
  spices_masalas:'Spices',beverages:'Beverages',snacks:'Snacks',
  fresh_produce:'Fresh',personal_care:'Personal Care',cleaning:'Cleaning',other:'Other',
};

function PriceCard({ price, isCheapest }: { price: any; isCheapest: boolean }) {
  const eff = price.offerPrice || price.price;
  const savings = price.price - eff;
  return (
    <div className={`relative bg-white rounded-xl border-2 p-4 ${isCheapest?'border-green-500 shadow-green-100 shadow-md':'border-gray-100 hover:border-gray-200'}`}>
      {isCheapest&&<div className="absolute -top-3 left-3 flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full"><Trophy className="w-3 h-3"/>CHEAPEST</div>}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm" style={{color:price.storeId?.color||'#374151'}}>{price.storeId?.name||'Store'}</div>
          {price.storeId?.deliveryTime&&<div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5"><Clock className="w-3 h-3"/>{price.storeId.deliveryTime}</div>}
          <div className="text-xs text-gray-400 mt-0.5">Updated {new Date(price.lastUpdated).toLocaleDateString('en-IN')}</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">₹{eff.toFixed(0)}</div>
          {savings>0&&<div className="text-xs text-red-500 line-through">₹{price.price.toFixed(0)}</div>}
          {savings>0&&<div className="flex items-center gap-1 text-green-600 text-xs font-medium justify-end"><Tag className="w-3 h-3"/>Save ₹{savings.toFixed(0)}</div>}
        </div>
      </div>
    </div>
  );
}

function ProductRow({ product, pincode }: { product: any; pincode?: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data: prices, isLoading } = useQuery({
    queryKey: ['prices', product._id, pincode||'all'],
    queryFn: () => pricesAPI.compare(product._id, pincode||undefined).then(r => r.data.data),
    enabled: expanded,
    staleTime: 5 * 60 * 1000,
  });
  const cheapest = prices?.[0];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button onClick={() => setExpanded(e => !e)} className="w-full p-4 text-left hover:bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">{product.productName}</div>
            <div className="text-sm text-gray-500">{product.brand&&`${product.brand} · `}{product.quantity}{product.unit}</div>
          </div>
          <div className="flex items-center gap-3 ml-3">
            {cheapest&&!isLoading&&<div className="text-right"><div className="text-green-600 font-bold">₹{(cheapest.offerPrice||cheapest.price).toFixed(0)}</div><div className="text-xs text-gray-400">{cheapest.storeId?.name}</div></div>}
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expanded?'rotate-180':''}`}/>
          </div>
        </div>
      </button>
      {expanded&&(
        <div className="px-4 pb-4 border-t border-gray-50">
          {isLoading?<div className="py-6 text-center text-gray-400 text-sm">Loading prices…</div>
          :prices?.length?(
            <>
              <div className="grid gap-2 mt-3">{prices.map((p:any,i:number)=><PriceCard key={p._id} price={p} isCheapest={i===0}/>)}</div>
              <div className="mt-3 flex gap-2">
                <Link href={`/product/${product._id}${pincode?`?pincode=${pincode}`:''}`} className="flex-1 text-center py-2 border border-gray-200 rounded-lg text-sm hover:border-green-400 hover:text-green-600">View Details</Link>
                <button className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:border-orange-400 hover:text-orange-600"><Bell className="w-4 h-4"/>Alert</button>
              </div>
            </>
          ):(
            <div className="py-6 text-center">
              <p className="text-gray-400 text-sm">{pincode?`No prices found near ${pincode}.`:'No prices yet for this product.'}</p>
              <Link href={`/product/${product._id}`} className="text-green-600 text-sm hover:underline mt-1 inline-block">Submit a price →</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { location, hydrateFromStorage, setShowPicker } = useLocationStore();
  const initialQ = searchParams.get('q') || '';
  const urlPincode = searchParams.get('pincode') || '';
  const [inputVal, setInputVal] = useState(initialQ);
  const [query, setQuery] = useState(initialQ);
  const [category, setCategory] = useState('');

  // Use URL pincode first, fall back to stored location
  const activePincode = urlPincode || location?.pincode || '';

  useEffect(() => { hydrateFromStorage(); }, [hydrateFromStorage]);
  useEffect(() => { setInputVal(initialQ); setQuery(initialQ); }, [initialQ]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', query, category],
    queryFn: () => productsAPI.search(query, { category: category||undefined }).then(r => r.data),
    enabled: !!query.trim(),
    staleTime: 60 * 1000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setQuery(inputVal.trim());
      const p = new URLSearchParams({ q: inputVal.trim() });
      if (activePincode) p.set('pincode', activePincode);
      router.replace(`/search?${p}`, { scroll: false });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-5">
      {/* Location context bar */}
      <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
          {activePincode ? (
            <span className="text-green-800">
              Showing prices near <strong>{activePincode}</strong>
              {location?.city && <span className="text-green-600"> — {location.city}</span>}
            </span>
          ) : (
            <span className="text-gray-500">Set your pincode to see local prices</span>
          )}
        </div>
        <button onClick={() => setShowPicker(true)} className="text-green-600 text-xs font-semibold hover:underline flex-shrink-0 ml-2">
          {activePincode ? 'Change' : 'Set Location'}
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={inputVal} onChange={e => setInputVal(e.target.value)} placeholder="Search groceries…"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none" />
        </div>
        <button type="submit" className="bg-green-600 text-white px-5 py-3 rounded-xl hover:bg-green-700 font-medium">Search</button>
      </form>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {['', ...Object.keys(CATEGORY_LABELS)].map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors ${category===c?'bg-green-600 text-white':'bg-white border border-gray-200 text-gray-600 hover:border-green-300'}`}>
            {c?CATEGORY_LABELS[c]:'All'}
          </button>
        ))}
      </div>

      {isLoading&&<div className="space-y-3">{[1,2,3].map(i=><div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse"><div className="h-4 bg-gray-100 rounded w-3/4 mb-2"/><div className="h-3 bg-gray-100 rounded w-1/2"/></div>)}</div>}
      {!isLoading&&data?.data?.length>0&&(
        <>
          <p className="text-sm text-gray-500 mb-3">{data.total} results · click to compare{activePincode&&` near ${activePincode}`}</p>
          <div className="space-y-3">{data.data.map((p:any) => <ProductRow key={p._id} product={p} pincode={activePincode||undefined}/>)}</div>
        </>
      )}
      {!isLoading&&query&&!data?.data?.length&&<div className="text-center py-16"><Search className="w-12 h-12 text-gray-200 mx-auto mb-3"/><p className="text-gray-500">No results for &ldquo;{query}&rdquo;</p></div>}
      {!query&&<div className="text-center py-16 text-gray-400"><Search className="w-12 h-12 mx-auto mb-3 text-gray-200"/><p>Type to search any grocery item</p></div>}
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-bold text-green-600">SmartBasket</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 text-sm">Search</span>
        </div>
        <LocationBar />
      </div>
      <Suspense><SearchContent /></Suspense>
    </main>
  );
}
