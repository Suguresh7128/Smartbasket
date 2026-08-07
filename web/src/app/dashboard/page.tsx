'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, ShoppingBag, Bell, Camera, TrendingDown, Receipt } from 'lucide-react';
import { analyticsAPI, alertsAPI, billsAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

const PIE_COLORS = ['#16a34a', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, router]);

  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => analyticsAPI.me(3).then(r => r.data.data),
    enabled: isAuthenticated,
  });

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsAPI.list().then(r => r.data.data),
    enabled: isAuthenticated,
  });

  const { data: bills } = useQuery({
    queryKey: ['bills'],
    queryFn: () => billsAPI.list().then(r => r.data.data),
    enabled: isAuthenticated,
  });

  // Prepare monthly chart data
  const monthlyData = analytics?.monthlySpend
    ? Object.entries(analytics.monthlySpend).map(([month, amount]) => ({
        month: month.split('-')[1] + '/' + month.split('-')[0].slice(2),
        amount: Math.round(amount as number),
      }))
    : [];

  // Prepare store pie data
  const storeData = analytics?.storeSpend
    ? Object.entries(analytics.storeSpend)
        .map(([name, value]) => ({ name, value: Math.round(value as number) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    : [];

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-bold text-green-600">SmartBasket</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 text-sm">Dashboard</span>
        </div>
        <span className="text-sm text-gray-500">Hi, {user?.name?.split(' ')[0]} 👋</span>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Spend', value: `₹${(analytics?.totalSpend || 0).toLocaleString('en-IN')}`, icon: TrendingDown, color: 'text-green-600 bg-green-50' },
            { label: 'Bills Scanned', value: analytics?.billCount || 0, icon: Receipt, color: 'text-blue-600 bg-blue-50' },
            { label: 'Avg Bill', value: `₹${(analytics?.averageBill || 0).toLocaleString('en-IN')}`, icon: BarChart3, color: 'text-orange-600 bg-orange-50' },
            { label: 'Active Alerts', value: alerts?.filter((a: any) => a.isActive).length || 0, icon: Bell, color: 'text-purple-600 bg-purple-50' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Monthly spend chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Monthly Spend</h3>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${v}`} />
                  <Tooltip formatter={(v) => [`₹${v}`, 'Spend']} />
                  <Bar dataKey="amount" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center text-gray-400 text-sm">
                Upload bills to see spending trends
              </div>
            )}
          </div>

          {/* Store pie chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Spend by Store</h3>
            {storeData.length > 0 ? (
              <div className="flex items-center gap-4">
                <PieChart width={130} height={130}>
                  <Pie data={storeData} cx={60} cy={60} innerRadius={35} outerRadius={60} dataKey="value">
                    {storeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
                <div className="flex-1 space-y-2">
                  {storeData.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-gray-600 flex-1 truncate">{s.name}</span>
                      <span className="font-medium">₹{s.value.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-gray-400 text-sm">
                No store data yet
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/search" className="bg-green-600 text-white rounded-xl p-4 flex items-center gap-3 hover:bg-green-700 transition-colors">
            <BarChart3 className="w-6 h-6" />
            <div>
              <div className="font-semibold">Compare Prices</div>
              <div className="text-green-100 text-xs">Search any grocery</div>
            </div>
          </Link>
          <Link href="/dashboard/upload" className="bg-orange-500 text-white rounded-xl p-4 flex items-center gap-3 hover:bg-orange-600 transition-colors">
            <Camera className="w-6 h-6" />
            <div>
              <div className="font-semibold">Scan Bill</div>
              <div className="text-orange-100 text-xs">Upload grocery bill</div>
            </div>
          </Link>
        </div>

        {/* Price alerts */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-600" /> Price Alerts
            </h3>
            <span className="text-xs text-gray-400">{alerts?.filter((a: any) => a.isActive).length || 0} active</span>
          </div>
          {alerts?.length ? (
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert: any) => (
                <div key={alert._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${alert.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{alert.productId?.productName}</div>
                    <div className="text-xs text-gray-500">Target: ₹{alert.targetPrice}</div>
                  </div>
                  {alert.currentPrice && (
                    <div className="text-xs text-gray-500">Now: ₹{alert.currentPrice}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              No alerts set. Search a product and create an alert.
            </div>
          )}
        </div>

        {/* Recent bills */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" /> Recent Bills
            </h3>
          </div>
          {bills?.length ? (
            <div className="space-y-2">
              {bills.slice(0, 5).map((bill: any) => (
                <div key={bill._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Receipt className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{bill.storeName || 'Unknown Store'}</div>
                    <div className="text-xs text-gray-500">
                      {bill.items?.length || 0} items · {new Date(bill.billDate).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">₹{bill.totalAmount?.toLocaleString('en-IN')}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    bill.status === 'done' ? 'bg-green-100 text-green-700' :
                    bill.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{bill.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">
              No bills yet. <Link href="/dashboard/upload" className="text-blue-600 hover:underline">Upload your first bill →</Link>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
