'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Trophy, Bell, Plus, Tag, Clock, ArrowLeft, CheckCircle } from 'lucide-react';
import { productsAPI, pricesAPI, alertsAPI, storesAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const qc = useQueryClient();

  const [alertPrice, setAlertPrice] = useState('');
  const [alertStoreId, setAlertStoreId] = useState('');
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [priceForm, setPriceForm] = useState({ storeId: '', price: '', offerPrice: '' });
  const [submitted, setSubmitted] = useState(false);
  const [selectedHistoryStore, setSelectedHistoryStore] = useState('');

  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsAPI.get(id).then(r => r.data.data),
  });

  const { data: prices, isLoading: pricesLoading } = useQuery({
    queryKey: ['prices', id],
    queryFn: () => pricesAPI.compare(id).then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: stores } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storesAPI.list().then(r => r.data.data),
    staleTime: 60 * 60 * 1000,
  });

  const { data: history } = useQuery({
    queryKey: ['price-history', id, selectedHistoryStore],
    queryFn: () => pricesAPI.history(id, selectedHistoryStore, 30).then(r => r.data.data),
    enabled: !!selectedHistoryStore,
  });

  const createAlert = useMutation({
    mutationFn: () => alertsAPI.create({ productId: id, storeId: alertStoreId || undefined, targetPrice: parseFloat(alertPrice) }),
    onSuccess: () => { setShowAlertForm(false); setAlertPrice(''); qc.invalidateQueries({ queryKey: ['alerts'] }); },
  });

  const submitPrice = useMutation({
    mutationFn: () => pricesAPI.submit({ productId: id, ...priceForm, price: parseFloat(priceForm.price), offerPrice: priceForm.offerPrice ? parseFloat(priceForm.offerPrice) : undefined }),
    onSuccess: () => {
      setShowPriceForm(false);
      setPriceForm({ storeId: '', price: '', offerPrice: '' });
      setSubmitted(true);
      qc.invalidateQueries({ queryKey: ['prices', id] });
      setTimeout(() => setSubmitted(false), 3000);
    },
  });

  const cheapest = prices?.[0];
  const cheapestEff = cheapest ? (cheapest.offerPrice || cheapest.price) : null;
  const mostExpEff = prices?.length > 1 ? (prices[prices.length - 1].offerPrice || prices[prices.length - 1].price) : null;

  const historyData = history?.map((h: any) => ({
    date: new Date(h.recordedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    price: h.offerPrice || h.price,
  })) || [];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link href="/search" className="text-gray-400 hover:text-gray-600 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Search
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-600 text-sm truncate">{product?.productName}</span>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Product header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h1 className="text-2xl font-bold text-gray-900">{product?.productName}</h1>
          <p className="text-gray-500 mt-1">
            {product?.brand && `${product.brand} · `}
            {product?.quantity}{product?.unit} · <span className="capitalize">{product?.category?.replace(/_/g, ' ')}</span>
          </p>
          {cheapestEff && (
            <div className="flex items-center gap-3 mt-4">
              <div className="text-3xl font-bold text-green-600">₹{cheapestEff.toFixed(0)}</div>
              <div className="text-sm text-gray-500">best price</div>
              {mostExpEff && mostExpEff > cheapestEff && (
                <div className="bg-green-50 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
                  Save up to ₹{(mostExpEff - cheapestEff).toFixed(0)}
                </div>
              )}
            </div>
          )}
          {submitted && (
            <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" /> Price submitted for review!
            </div>
          )}
          {isAuthenticated && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowAlertForm(s => !s)}
                className="flex items-center gap-2 px-4 py-2 border border-purple-200 text-purple-600 rounded-lg text-sm hover:bg-purple-50 transition-colors"
              >
                <Bell className="w-4 h-4" /> Set Alert
              </button>
              <button
                onClick={() => setShowPriceForm(s => !s)}
                className="flex items-center gap-2 px-4 py-2 border border-green-200 text-green-600 rounded-lg text-sm hover:bg-green-50 transition-colors"
              >
                <Plus className="w-4 h-4" /> Submit Price
              </button>
            </div>
          )}

          {/* Alert form */}
          {showAlertForm && (
            <div className="mt-4 p-4 bg-purple-50 rounded-xl space-y-3">
              <p className="text-sm font-semibold text-purple-900">Create Price Alert</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={alertPrice}
                  onChange={e => setAlertPrice(e.target.value)}
                  placeholder={`Target price (current best: ₹${cheapestEff?.toFixed(0) || '—'})`}
                  className="flex-1 px-3 py-2 rounded-lg border border-purple-200 text-sm outline-none focus:border-purple-400"
                />
                <select
                  value={alertStoreId}
                  onChange={e => setAlertStoreId(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-purple-200 text-sm bg-white outline-none"
                >
                  <option value="">Any store</option>
                  {stores?.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <button
                  onClick={() => createAlert.mutate()}
                  disabled={!alertPrice || createAlert.isPending}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-purple-700 transition-colors"
                >
                  {createAlert.isPending ? '...' : 'Set'}
                </button>
              </div>
            </div>
          )}

          {/* Submit price form */}
          {showPriceForm && (
            <div className="mt-4 p-4 bg-green-50 rounded-xl space-y-3">
              <p className="text-sm font-semibold text-green-900">Submit a Price You've Seen</p>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={priceForm.storeId}
                  onChange={e => setPriceForm(f => ({ ...f, storeId: e.target.value }))}
                  className="px-3 py-2 rounded-lg border border-green-200 text-sm bg-white outline-none col-span-3"
                >
                  <option value="">Select store</option>
                  {stores?.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <input type="number" placeholder="Regular price ₹" value={priceForm.price}
                  onChange={e => setPriceForm(f => ({ ...f, price: e.target.value }))}
                  className="px-3 py-2 rounded-lg border border-green-200 text-sm outline-none col-span-1" />
                <input type="number" placeholder="Offer price ₹ (opt)" value={priceForm.offerPrice}
                  onChange={e => setPriceForm(f => ({ ...f, offerPrice: e.target.value }))}
                  className="px-3 py-2 rounded-lg border border-green-200 text-sm outline-none col-span-1" />
                <button
                  onClick={() => submitPrice.mutate()}
                  disabled={!priceForm.storeId || !priceForm.price || submitPrice.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-green-700 transition-colors"
                >
                  {submitPrice.isPending ? '...' : 'Submit'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Price comparison table */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-4">Price Comparison</h2>
          {pricesLoading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading prices…</div>
          ) : prices?.length ? (
            <div className="space-y-2">
              {prices.map((p: any, i: number) => {
                const eff = p.offerPrice || p.price;
                const saved = p.price - eff;
                return (
                  <div key={p._id} className={`relative rounded-xl border-2 p-4 ${i === 0 ? 'border-green-500 bg-green-50' : 'border-gray-100'}`}>
                    {i === 0 && (
                      <div className="absolute -top-3 left-3 flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        <Trophy className="w-3 h-3" /> CHEAPEST
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-sm" style={{ color: p.storeId?.color || '#374151' }}>
                          {p.storeId?.name}
                        </span>
                        {p.storeId?.deliveryTime && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <Clock className="w-3 h-3" /> {p.storeId.deliveryTime}
                          </div>
                        )}
                        <button
                          onClick={() => setSelectedHistoryStore(p.storeId?._id || '')}
                          className="text-xs text-blue-500 hover:underline mt-1"
                        >
                          View history
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">₹{eff.toFixed(0)}</div>
                        {saved > 0 && <div className="text-xs text-red-400 line-through">₹{p.price.toFixed(0)}</div>}
                        {saved > 0 && (
                          <div className="flex items-center gap-1 text-green-600 text-xs font-medium justify-end">
                            <Tag className="w-3 h-3" /> Save ₹{saved.toFixed(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              No prices yet. {isAuthenticated ? (
                <button onClick={() => setShowPriceForm(true)} className="text-green-600 hover:underline">
                  Be the first to submit →
                </button>
              ) : (
                <Link href="/auth/login" className="text-green-600 hover:underline">Sign in to submit →</Link>
              )}
            </div>
          )}
        </div>

        {/* Price history chart */}
        {selectedHistoryStore && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">
                Price History · {stores?.find((s: any) => s._id === selectedHistoryStore)?.name}
              </h2>
              <button onClick={() => setSelectedHistoryStore('')} className="text-gray-400 text-sm hover:text-gray-600">✕</button>
            </div>
            {historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} domain={['auto', 'auto']} />
                  <Tooltip formatter={(v) => [`₹${v}`, 'Price']} />
                  <Line type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">No history data available for this store</div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
