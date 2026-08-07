'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Package, DollarSign, Receipt, Bell, CheckCircle, XCircle, Store } from 'lucide-react';
import { adminAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'overview' | 'users' | 'prices'>('overview');

  useEffect(() => {
    if (isAuthenticated && user?.role !== 'admin') router.push('/');
  }, [isAuthenticated, user, router]);

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminAPI.stats().then(r => r.data.data),
    enabled: user?.role === 'admin',
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminAPI.users().then(r => r.data.data),
    enabled: tab === 'users' && user?.role === 'admin',
  });

  const { data: pendingPrices } = useQuery({
    queryKey: ['pending-prices'],
    queryFn: () => adminAPI.pendingPrices().then(r => r.data.data),
    enabled: tab === 'prices' && user?.role === 'admin',
  });

  const toggleUser = useMutation({
    mutationFn: (id: string) => adminAPI.toggleUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const seedStores = useMutation({
    mutationFn: () => adminAPI.seedStores(),
    onSuccess: () => alert('Stores seeded successfully!'),
  });

  if (!isAuthenticated || user?.role !== 'admin') return null;

  const STAT_CARDS = [
    { label: 'Total Users', value: stats?.users || 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Products', value: stats?.products || 0, icon: Package, color: 'bg-green-50 text-green-600' },
    { label: 'Price Records', value: stats?.prices || 0, icon: DollarSign, color: 'bg-orange-50 text-orange-600' },
    { label: 'Bills Uploaded', value: stats?.bills || 0, icon: Receipt, color: 'bg-purple-50 text-purple-600' },
    { label: 'Active Alerts', value: stats?.activeAlerts || 0, icon: Bell, color: 'bg-pink-50 text-pink-600' },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-bold text-green-400">SmartBasket</Link>
          <span className="text-gray-600">/</span>
          <span className="text-sm text-gray-300">Admin Panel</span>
        </div>
        <span className="text-xs text-gray-400">{user?.email}</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {STAT_CARDS.map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div className="text-xl font-bold">{s.value.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => seedStores.mutate()}
            disabled={seedStores.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Store className="w-4 h-4" />
            {seedStores.isPending ? 'Seeding...' : 'Seed Default Stores'}
          </button>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <Package className="w-4 h-4" /> Add Product
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          {(['overview', 'users', 'prices'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">System Overview</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="space-y-3">
                <div className="flex justify-between"><span>Total registered users</span><span className="font-medium text-gray-900">{stats?.users || 0}</span></div>
                <div className="flex justify-between"><span>Active products</span><span className="font-medium text-gray-900">{stats?.products || 0}</span></div>
                <div className="flex justify-between"><span>Price records</span><span className="font-medium text-gray-900">{stats?.prices || 0}</span></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between"><span>Bills processed</span><span className="font-medium text-gray-900">{stats?.bills || 0}</span></div>
                <div className="flex justify-between"><span>Active price alerts</span><span className="font-medium text-gray-900">{stats?.activeAlerts || 0}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Name', 'Email', 'Role', 'City', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users?.map((u: any) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'moderator' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.city}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs ${u.isActive ? 'text-green-600' : 'text-red-500'}`}>
                        {u.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => toggleUser.mutate(u._id)}
                          className={`text-xs px-2 py-1 rounded border transition-colors ${
                            u.isActive
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-green-200 text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {u.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!users?.length && (
              <div className="text-center py-12 text-gray-400 text-sm">Loading users...</div>
            )}
          </div>
        )}

        {/* Pending Prices */}
        {tab === 'prices' && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Pending Price Submissions</h3>
              <p className="text-xs text-gray-500 mt-0.5">Review and approve user-submitted prices</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Product', 'Store', 'Price', 'Submitted By', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendingPrices?.map((p: any) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{p.productId?.productName}</td>
                    <td className="px-4 py-3 text-gray-500">{p.storeId?.name}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">₹{p.price}</span>
                      {p.offerPrice && <span className="text-green-600 ml-1 text-xs">→ ₹{p.offerPrice}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.submittedBy?.email}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
                        ✓ Approve
                      </button>
                      <button className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors">
                        ✗ Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!pendingPrices?.length && (
              <div className="text-center py-12 text-gray-400 text-sm">No pending submissions 🎉</div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
