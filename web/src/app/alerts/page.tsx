"use client";
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { alertsAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Bell, Trash2, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AlertsPage() {
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsAPI.list().then(r => r.data.data),
    enabled: isAuthenticated,
  });

  const toggle = async (id: string) => {
    try {
      setBusy(id);
      await alertsAPI.toggle(id);
      qc.invalidateQueries(['alerts']);
    } finally { setBusy(null); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this alert?')) return;
    try {
      setBusy(id);
      await alertsAPI.delete(id);
      qc.invalidateQueries(['alerts']);
    } finally { setBusy(null); }
  };

  if (!isAuthenticated) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Please <Link href="/auth/login" className="text-green-600">sign in</Link> to view alerts.</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link href="/" className="font-bold text-green-600">SmartBasket</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-600 text-sm">Alerts</span>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <Bell className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Price Alerts</h1>
            <p className="text-sm text-gray-500">Manage notifications when product prices drop.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          {isLoading ? (
            <div className="py-8 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading alerts...</div>
          ) : alerts?.length ? (
            <div className="space-y-3">
              {alerts.map((a: any) => (
                <div key={a._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.productId?.productName || a.productName || 'Product'}</div>
                    <div className="text-xs text-gray-500">Target: ₹{a.targetPrice} · Store: {a.storeId?.name || 'Any'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggle(a._id)} disabled={!!busy} className="px-3 py-1 rounded border text-sm text-gray-700 hover:bg-gray-100">
                      {busy === a._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    </button>
                    <button onClick={() => remove(a._id)} disabled={!!busy} className="px-3 py-1 rounded border text-sm text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400">
              No alerts set. Search for a product and create an alert.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
