import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Switch, ActivityIndicator, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Trash2, Plus, BellOff } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { alertsAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function AlertsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsAPI.list().then(r => r.data.data),
    enabled: isAuthenticated,
  });

  const toggleAlert = useMutation({
    mutationFn: (id: string) => alertsAPI.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const deleteAlert = useMutation({
    mutationFn: (id: string) => alertsAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const confirmDelete = (id: string) => {
    Alert.alert('Delete Alert', 'Remove this price alert?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAlert.mutate(id) },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <BellOff color="#e5e7eb" size={48} />
          <Text style={styles.emptyTitle}>Sign in for Price Alerts</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/auth/login' as any)}>
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const activeCount = alerts?.filter((a: any) => a.isActive).length || 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Price Alerts</Text>
          <Text style={styles.subtitle}>{activeCount} active</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={alerts || []}
          keyExtractor={a => a._id}
          contentContainerStyle={styles.list}
          renderItem={({ item: alert }) => (
            <View style={styles.alertCard}>
              <View style={styles.alertTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertProduct} numberOfLines={1}>
                    {alert.productId?.productName || 'Product'}
                  </Text>
                  {alert.productId?.brand && (
                    <Text style={styles.alertBrand}>{alert.productId.brand}</Text>
                  )}
                </View>
                <Switch
                  value={alert.isActive}
                  onValueChange={() => toggleAlert.mutate(alert._id)}
                  trackColor={{ false: '#e5e7eb', true: '#bbf7d0' }}
                  thumbColor={alert.isActive ? '#16a34a' : '#9ca3af'}
                />
              </View>

              <View style={styles.alertBottom}>
                <View style={styles.priceInfo}>
                  <View style={styles.priceChip}>
                    <Text style={styles.priceChipLabel}>Target</Text>
                    <Text style={styles.priceChipValue}>₹{alert.targetPrice}</Text>
                  </View>
                  {alert.currentPrice && (
                    <View style={[styles.priceChip, { backgroundColor: '#f0fdf4' }]}>
                      <Text style={styles.priceChipLabel}>Current</Text>
                      <Text style={[styles.priceChipValue, { color: '#16a34a' }]}>
                        ₹{alert.currentPrice}
                      </Text>
                    </View>
                  )}
                  {alert.storeId && (
                    <View style={[styles.priceChip, { backgroundColor: '#eff6ff' }]}>
                      <Text style={styles.priceChipLabel}>Store</Text>
                      <Text style={[styles.priceChipValue, { color: '#3b82f6' }]}>
                        {alert.storeId?.name}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity onPress={() => confirmDelete(alert._id)} style={styles.deleteBtn}>
                  <Trash2 color="#ef4444" size={16} />
                </TouchableOpacity>
              </View>

              {alert.triggeredAt && (
                <View style={styles.triggeredBanner}>
                  <Text style={styles.triggeredText}>
                    ✓ Triggered on {new Date(alert.triggeredAt).toLocaleDateString('en-IN')}
                  </Text>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Bell color="#e5e7eb" size={48} />
              <Text style={styles.emptyTitle}>No alerts yet</Text>
              <Text style={styles.emptySubtitle}>Search a product and tap the bell icon to create an alert</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  list: { padding: 14, gap: 10, paddingBottom: 40 },
  alertCard: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1,
    borderColor: '#f3f4f6', padding: 14, gap: 12,
  },
  alertTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  alertProduct: { fontSize: 15, fontWeight: '600', color: '#111827' },
  alertBrand: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  alertBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceInfo: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', flex: 1 },
  priceChip: {
    backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  priceChipLabel: { fontSize: 10, color: '#6b7280', fontWeight: '500' },
  priceChipValue: { fontSize: 14, fontWeight: '700', color: '#d97706', marginTop: 1 },
  deleteBtn: { padding: 8 },
  triggeredBanner: {
    backgroundColor: '#dcfce7', borderRadius: 8, padding: 8,
  },
  triggeredText: { fontSize: 12, color: '#16a34a', fontWeight: '500' },
  centered: { alignItems: 'center', justifyContent: 'center', flex: 1, padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: '#9ca3af', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  signInBtn: {
    marginTop: 20, backgroundColor: '#16a34a', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  signInBtnText: { color: '#fff', fontWeight: '700' },
});
