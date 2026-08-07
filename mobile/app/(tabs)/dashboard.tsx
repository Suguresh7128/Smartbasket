import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingDown, Receipt, Bell, Camera, ShoppingBag } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyticsAPI, billsAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => analyticsAPI.me(3).then(r => r.data.data),
    enabled: isAuthenticated,
  });

  const { data: bills } = useQuery({
    queryKey: ['bills'],
    queryFn: () => billsAPI.list().then(r => r.data.data),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <BarChart3 color="#e5e7eb" size={48} />
          <Text style={styles.emptyTitle}>Sign in to view analytics</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/auth/login' as any)}>
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const monthlyArr = analytics?.monthlySpend
    ? Object.entries(analytics.monthlySpend)
        .map(([m, v]) => ({ month: m.slice(5), amount: v as number }))
        .sort((a, b) => a.month.localeCompare(b.month))
    : [];

  const maxMonthly = Math.max(...monthlyArr.map(m => m.amount), 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Last 3 months</Text>
        </View>

        {/* Stat cards */}
        <View style={styles.statGrid}>
          {[
            { label: 'Total Spend', value: `₹${(analytics?.totalSpend || 0).toLocaleString('en-IN')}`, icon: TrendingDown, bg: '#dcfce7', ic: '#16a34a' },
            { label: 'Bills Scanned', value: analytics?.billCount || 0, icon: Receipt, bg: '#dbeafe', ic: '#3b82f6' },
            { label: 'Avg Bill', value: `₹${(analytics?.averageBill || 0).toLocaleString('en-IN')}`, icon: BarChart3, bg: '#fef3c7', ic: '#d97706' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                <s.icon color={s.ic} size={18} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Monthly bar chart (custom, no library needed) */}
        {monthlyArr.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Monthly Spend</Text>
            <View style={styles.barChart}>
              {monthlyArr.map(m => (
                <View key={m.month} style={styles.barGroup}>
                  <Text style={styles.barAmount}>₹{Math.round(m.amount / 1000)}k</Text>
                  <View style={[styles.bar, { height: Math.max((m.amount / maxMonthly) * 100, 4) }]} />
                  <Text style={styles.barLabel}>{m.month}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Store spend breakdown */}
        {analytics?.storeSpend && Object.keys(analytics.storeSpend).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Spend by Store</Text>
            {Object.entries(analytics.storeSpend)
              .sort((a: any, b: any) => b[1] - a[1])
              .slice(0, 5)
              .map(([store, amount]: any) => (
                <View key={store} style={styles.storeRow}>
                  <Text style={styles.storeRowName}>{store}</Text>
                  <View style={styles.storeBar}>
                    <View
                      style={[styles.storeBarFill, {
                        width: `${(amount / analytics.totalSpend) * 100}%`,
                      }]}
                    />
                  </View>
                  <Text style={styles.storeRowAmount}>₹{amount.toLocaleString('en-IN')}</Text>
                </View>
              ))}
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#16a34a' }]} onPress={() => router.push('/upload' as any)}>
            <Camera color="#fff" size={20} />
            <Text style={styles.actionBtnText}>Scan Bill</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]} onPress={() => router.push('/(tabs)/search' as any)}>
            <ShoppingBag color="#fff" size={20} />
            <Text style={styles.actionBtnText}>Compare</Text>
          </TouchableOpacity>
        </View>

        {/* Recent bills */}
        {bills?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Bills</Text>
            {bills.slice(0, 4).map((bill: any) => (
              <TouchableOpacity
                key={bill._id}
                style={styles.billRow}
                onPress={() => router.push({ pathname: '/bill/[id]', params: { id: bill._id } })}
              >
                <View style={styles.billIcon}>
                  <Receipt color="#6b7280" size={16} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.billStore}>{bill.storeName || 'Unknown Store'}</Text>
                  <Text style={styles.billDate}>
                    {bill.items?.length || 0} items · {new Date(bill.billDate).toLocaleDateString('en-IN')}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.billAmount}>₹{bill.totalAmount?.toLocaleString('en-IN')}</Text>
                  <View style={[styles.statusDot, {
                    backgroundColor: bill.status === 'done' ? '#16a34a' : bill.status === 'failed' ? '#ef4444' : '#f59e0b',
                  }]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { padding: 16 },
  header: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  statGrid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: '#f3f4f6', padding: 14, gap: 6,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 17, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6b7280' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1,
    borderColor: '#f3f4f6', padding: 16, marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 14 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 120 },
  barGroup: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  barAmount: { fontSize: 9, color: '#6b7280' },
  bar: { width: '100%', backgroundColor: '#16a34a', borderRadius: 4 },
  barLabel: { fontSize: 10, color: '#6b7280' },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  storeRowName: { width: 80, fontSize: 12, color: '#374151', fontWeight: '500' },
  storeBar: { flex: 1, height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' },
  storeBarFill: { height: '100%', backgroundColor: '#16a34a', borderRadius: 4 },
  storeRowAmount: { fontSize: 12, fontWeight: '600', color: '#111827', width: 60, textAlign: 'right' },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 16,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  billRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  billIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#f3f4f6',
    alignItems: 'center', justifyContent: 'center',
  },
  billStore: { fontSize: 14, fontWeight: '600', color: '#111827' },
  billDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  billAmount: { fontSize: 14, fontWeight: '700', color: '#111827' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 16 },
  signInBtn: { marginTop: 20, backgroundColor: '#16a34a', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  signInBtnText: { color: '#fff', fontWeight: '700' },
});
