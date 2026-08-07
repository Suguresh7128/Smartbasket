'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, X, CheckCircle, Loader2, Navigation, ChevronRight,
         Zap, ShoppingBag, AlertTriangle } from 'lucide-react';
import { locationAPI } from '@/services/api';
import { useLocationStore, LocationData } from '@/store/locationStore';

const POPULAR = [
  { pincode:'560034', label:'Bengaluru — Koramangala' },
  { pincode:'560038', label:'Bengaluru — Indiranagar' },
  { pincode:'560032', label:'Bengaluru — Rajajinagar' },
  { pincode:'560041', label:'Bengaluru — Jayanagar' },
  { pincode:'560103', label:'Bengaluru — Bellandur' },
  { pincode:'560066', label:'Bengaluru — Whitefield' },
  { pincode:'560064', label:'Bengaluru — Yelahanka' },
  { pincode:'560102', label:'Bengaluru — HSR Layout' },
  { pincode:'560078', label:'Bengaluru — JP Nagar' },
  { pincode:'560068', label:'Bengaluru — Electronic City' },
  { pincode:'570017', label:'Mysuru — Vijayanagar' },
  { pincode:'500032', label:'Hyderabad — Gachibowli' },
  { pincode:'585228', label:'Bidar — Humnabad' },
  { pincode:'584170', label:'Raichur — Sindhanur' },
];

const COVERAGE_CONFIG = {
  full:         { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50',  border: 'border-green-200', label: 'Full coverage' },
  partial:      { icon: ShoppingBag, color: 'text-blue-600',  bg: 'bg-blue-50',   border: 'border-blue-200',  label: 'Partial coverage' },
  online_only:  { icon: AlertTriangle,color:'text-amber-600', bg: 'bg-amber-50',  border: 'border-amber-200', label: 'Online delivery only' },
};

export default function LocationPicker({ onClose, isModal = true }: { onClose?: () => void; isModal?: boolean }) {
  const { setLocation } = useLocationStore();
  const [pincode, setPincode]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [result, setResult]         = useState<LocationData | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  useEffect(() => {
    if (pincode.length < 3) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try { const { data } = await locationAPI.autocomplete(pincode); setSuggestions(data.data || []); }
      catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [pincode]);

  const lookup = useCallback(async (pin: string) => {
    const p = pin.trim();
    if (!/^\d{6}$/.test(p)) { setError('Enter a valid 6-digit pincode'); return; }
    setLoading(true); setError(''); setResult(null); setSuggestions([]);
    try {
      const { data } = await locationAPI.lookup(p);
      setResult(data.data);
      setPincode(p);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Pincode not found. Please try again.');
    } finally { setLoading(false); }
  }, []);

  const handleConfirm = () => {
    if (!result) return;
    setLocation(result);
    onClose?.();
  };

  const coverageConf = result
    ? COVERAGE_CONFIG[(result as any).coverageLevel as keyof typeof COVERAGE_CONFIG] || COVERAGE_CONFIG.online_only
    : null;
  const CoverageIcon = coverageConf?.icon || CheckCircle;

  const Wrap = isModal
    ? ({ children }: any) => (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            {children}
          </div>
        </div>
      )
    : ({ children }: any) => <div className="bg-white rounded-2xl border border-gray-100">{children}</div>;

  return (
    <Wrap>
      <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-600" />
          <span className="font-bold text-gray-900 text-base">Set your location</span>
        </div>
        {isModal && onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
        )}
      </div>

      <div className="p-5 space-y-4">
        <p className="text-sm text-gray-500 leading-relaxed">
          Enter your 6-digit pincode to see prices from stores that actually deliver to your area.
        </p>

        <form onSubmit={e => { e.preventDefault(); lookup(pincode); }} className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text" inputMode="numeric" maxLength={6}
              value={pincode}
              onChange={e => { setPincode(e.target.value.replace(/\D/g,'')); setError(''); setResult(null); }}
              placeholder="Enter 6-digit pincode"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm font-mono tracking-widest transition-all"
            />
          </div>

          {suggestions.length > 0 && !result && (
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              {suggestions.map((s: any) => (
                <button key={s.pincode} type="button"
                  onClick={() => { setPincode(s.pincode); lookup(s.pincode); setSuggestions([]); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 border-b border-gray-50 last:border-0 text-left">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-sm text-gray-900">{s.pincode}</span>
                    <span className="text-gray-500 text-sm ml-2">{s.city}, {s.state}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm flex items-center gap-1.5">
              <X className="w-4 h-4 flex-shrink-0" /> {error}
            </p>
          )}

          <button type="submit" disabled={loading || pincode.length !== 6}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</> : 'Find stores near me'}
          </button>
        </form>

        {/* Result */}
        {result && coverageConf && (
          <div className="space-y-3">
            {/* Location + coverage badge */}
            <div className={`${coverageConf.bg} border ${coverageConf.border} rounded-xl p-4 flex items-start gap-3`}>
              <CoverageIcon className={`w-5 h-5 ${coverageConf.color} flex-shrink-0 mt-0.5`} />
              <div>
                <p className={`font-semibold text-sm ${coverageConf.color}`}>{result.pincode} — {result.city}</p>
                <p className="text-xs text-gray-500 mt-0.5">{(result as any).district}, {(result as any).state}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${coverageConf.bg} ${coverageConf.color} border ${coverageConf.border}`}>
                    {coverageConf.label}
                  </span>
                  <span className="text-xs text-gray-500">{(result as any).totalStores} stores available</span>
                </div>
              </div>
            </div>

            {/* Quick commerce */}
            {(result.nearbyOutlets?.filter((o:any) => o.type === 'quick_commerce')?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" /> Quick delivery
                </p>
                <div className="space-y-1.5">
                  {result.nearbyOutlets?.filter((o:any) => o.type === 'quick_commerce').map((o:any, i:number) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: o.color || '#16a34a' }} />
                        <span className="text-sm font-semibold text-gray-800">{o.storeName}</span>
                        {o.outletName && o.outletName !== o.storeName && (
                          <span className="text-xs text-gray-400">— {o.outletName}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{o.distanceKm} km</span>
                        {o.deliveryTime && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{o.deliveryTime}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Physical stores */}
            {(result.nearbyOutlets?.filter((o:any) => o.type !== 'quick_commerce')?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nearby stores</p>
                <div className="space-y-1.5">
                  {result.nearbyOutlets?.filter((o:any) => o.type !== 'quick_commerce').map((o:any, i:number) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: o.color || '#16a34a' }} />
                        <span className="text-sm font-semibold text-gray-800">{o.storeName}</span>
                      </div>
                      <span className="text-xs text-gray-500">{o.distanceKm} km</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Online stores */}
            {(result as any).onlineStores?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Online delivery</p>
                <div className="flex flex-wrap gap-2">
                  {(result as any).onlineStores?.map((s:any, i:number) => (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold"
                      style={{ borderColor:(s.color||'#16a34a')+'60', color:s.color||'#16a34a', background:(s.color||'#16a34a')+'10' }}>
                      {s.storeName}
                      {s.deliveryTime && <span className="text-gray-400 font-normal">· {s.deliveryTime}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(result as any).totalStores === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                No stores found near this pincode yet. We are expanding!
                You can still browse all prices from all stores.
              </div>
            )}

            <button onClick={handleConfirm}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 flex items-center justify-center gap-2 transition-colors">
              <CheckCircle className="w-4 h-4" /> Use this location
            </button>
          </div>
        )}

        {/* Popular pincodes */}
        {!result && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Popular locations</p>
            <div className="space-y-0.5">
              {POPULAR.map(p => (
                <button key={p.pincode} onClick={() => { setPincode(p.pincode); lookup(p.pincode); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 group text-left">
                  <div className="flex items-center gap-2.5">
                    <Navigation className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-700 font-mono">{p.pincode}</span>
                    <span className="text-sm text-gray-400">{p.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-500" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Wrap>
  );
}
