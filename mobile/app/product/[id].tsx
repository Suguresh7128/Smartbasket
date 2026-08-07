import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trophy, Bell, Plus, Tag, Clock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { productsAPI, pricesAPI, alertsAPI, storesAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore';

function MiniChart({ data }: { data: any[] }) {
  if (!data?.length) return null;
  const vals = data.map(d => d.price);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const range = max - min || 1;
  const w = 280;
  const h = 60;
  const pts = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = h - ((d.price - min) / range) * h;
    return `${x},${y}`;
  });
  return (
    <View style={{ alignItems: 'center', marginTop: 8 }}>
      <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
        ₹{min.toFixed(0)} – ₹{max.toFixed(0)} (last 30 days)
      </Text>
      <View style={{ width: w, height: h, backgroundColor: '#f9fafb', borderRadius: 8, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#e5e7eb' }} />
      </View>
    </View>
  );
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { location } = useLocationStore();
  const activePincode = location?.pincode;
  const qc = useQueryClient();

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [submitPrice, setSubmitPrice] = useState('');
  const [submitOfferPrice, setSubmitOfferPrice] = useState('');
  const [submitStoreId, setSubmitStoreId] = useState('');

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsAPI.get(id!).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: prices, isLoading: pricesLoading } = useQuery({
    queryKey: ['prices', id, activePincode||'all'],
    queryFn: () => pricesAPI.compare(id!, activePincode).then(r => r.data.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: stores } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storesAPI.list().then(r => r.data.data),
  });

  const createAlert = useMutation({
    mutationFn: () => alertsAPI.create({
      productId: id,
      storeId: selectedStore || undefined,
      targetPrice: parseFloat(alertPrice),
    }),
    onSuccess: () => {
      setShowAlertModal(false);
      setAlertPrice('');
      qc.invalidateQueries({ queryKey: ['alerts'] });
      Alert.alert('✓ Alert Created', `You'll be notified when the price drops below ₹${alertPrice}`);
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'Failed to create alert'),
  });

  const submitPriceMutation = useMutation({
    mutationFn: () => pricesAPI.submit({
      productId: id,
      storeId: submitStoreId,
      price: parseFloat(submitPrice),
      offerPrice: submitOfferPrice ? parseFloat(submitOfferPrice) : undefined,
    }),
    onSuccess: () => {
      setShowPriceModal(false);
      setSubmitPrice('');
      setSubmitOfferPrice('');
      setSubmitStoreId('');
      qc.invalidateQueries({ queryKey: ['prices', id] });
      Alert.alert('✓ Price Submitted', 'Thank you! Your price will be reviewed shortly.');
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'Submission failed'),
  });

  if (productLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color="#16a34a" style={{ marginTop: 60 }} size="large" />
      </SafeAreaView>
    );
  }

  const cheapest = prices?.[0];
  const cheapestEff = cheapest ? (cheapest.offerPrice || cheapest.price) : null;
  const mostExpensive = prices?.[prices.length - 1];
  const mostExpensiveEff = mostExpensive ? (mostExpensive.offerPrice || mostExpensive.price) : null;
  const maxSaving = cheapestEff && mostExpensiveEff ? mostExpensiveEff - cheapestEff : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#374151" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product?.productName}</Text>
        {isAuthenticated && (
          <TouchableOpacity style={styles.alertBtn} onPress={() => setShowAlertModal(true)}>
            <Bell color="#7c3aed" size={20} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Product card */}
        <View style={styles.productCard}>
          <Text style={styles.productName}>{product?.productName}</Text>
          <Text style={styles.productMeta}>
            {product?.brand && `${product.brand} · `}
            {product?.quantity}{product?.unit} · {product?.category?.replace(/_/g, ' ')}
          </Text>
          {cheapestEff && (
            <View style={styles.priceRow}>
              <Text style={styles.cheapestLabel}>Best Price</Text>
              <Text style={styles.cheapestValue}>₹{cheapestEff.toFixed(0)}</Text>
              {maxSaving > 0 && (
                <View style={styles.savingBadge}>
                  <Text style={styles.savingText}>Save up to ₹{maxSaving.toFixed(0)}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Price comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Comparison</Text>
          {pricesLoading ? (
            <ActivityIndicator color="#16a34a" />
          ) : prices?.length ? (
            prices.map((p: any, i: number) => {
              const eff = p.offerPrice || p.price;
              const saved = p.price - eff;
              const isCheapest = i === 0;
              return (
                <View key={p._id} style={[styles.priceCard, isCheapest && styles.priceCardBest]}>
                  {isCheapest && (
                    <View style={styles.bestBadge}>
                      <Trophy color="#fff" size={10} />
                      <Text style={styles.bestBadgeText}>CHEAPEST</Text>
                    </View>
                  )}
                  <View style={styles.priceCardInner}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.storeName, { color: p.storeId?.color || '#374151' }]}>
                        {p.storeId?.name}
                      </Text>
                      {p.storeId?.deliveryTime && (
                        <View style={styles.deliveryRow}>
                          <Clock color="#9ca3af" size={11} />
                          <Text style={styles.deliveryText}>{p.storeId.deliveryTime}</Text>
                        </View>
                      )}
                      <Text style={styles.updatedText}>
                        Updated {new Date(p.lastUpdated).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.effPrice}>₹{eff.toFixed(0)}</Text>
                      {saved > 0 && (
                        <>
                          <Text style={styles.origPrice}>₹{p.price.toFixed(0)}</Text>
                          <View style={styles.discountTag}>
                            <Tag color="#16a34a" size={9} />
                            <Text style={styles.discountText}>{Math.round((saved / p.price) * 100)}% off</Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No prices yet.</Text>
              <TouchableOpacity onPress={() => isAuthenticated ? setShowPriceModal(true) : router.push('/auth/login' as any)}>
                <Text style={styles.emptyAction}>Be the first to submit a price →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Submit price CTA */}
        {isAuthenticated && prices?.length > 0 && (
          <TouchableOpacity style={styles.submitCta} onPress={() => setShowPriceModal(true)}>
            <Plus color="#16a34a" size={16} />
            <Text style={styles.submitCtaText}>Submit a Price</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Alert modal */}
      <Modal visible={showAlertModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🔔 Create Price Alert</Text>
            <Text style={styles.modalSubtitle}>
              Get notified when {product?.productName} drops below your target price
            </Text>

            <Text style={styles.label}>Target Price (₹)</Text>
            <TextInput
              style={styles.modalInput}
              value={alertPrice}
              onChangeText={setAlertPrice}
              keyboardType="numeric"
              placeholder={cheapestEff ? `Current best: ₹${cheapestEff.toFixed(0)}` : 'Enter price'}
              placeholderTextColor="#9ca3af"
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Store (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <TouchableOpacity
                style={[styles.storeChip, !selectedStore && styles.storeChipActive]}
                onPress={() => setSelectedStore('')}
              >
                <Text style={[styles.storeChipText, !selectedStore && styles.storeChipTextActive]}>Any Store</Text>
              </TouchableOpacity>
              {stores?.map((s: any) => (
                <TouchableOpacity
                  key={s._id}
                  style={[styles.storeChip, selectedStore === s._id && styles.storeChipActive]}
                  onPress={() => setSelectedStore(s._id)}
                >
                  <Text style={[styles.storeChipText, selectedStore === s._id && styles.storeChipTextActive]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAlertModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, (!alertPrice || createAlert.isPending) && styles.disabledBtn]}
                onPress={() => createAlert.mutate()}
                disabled={!alertPrice || createAlert.isPending}
              >
                {createAlert.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalConfirmText}>Set Alert</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Submit price modal */}
      <Modal visible={showPriceModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>📝 Submit a Price</Text>
            <Text style={styles.modalSubtitle}>Help others by submitting a current price you've seen</Text>

            <Text style={styles.label}>Store</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {stores?.map((s: any) => (
                <TouchableOpacity
                  key={s._id}
                  style={[styles.storeChip, submitStoreId === s._id && styles.storeChipActive]}
                  onPress={() => setSubmitStoreId(s._id)}
                >
                  <Text style={[styles.storeChipText, submitStoreId === s._id && styles.storeChipTextActive]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Regular Price (₹)</Text>
            <TextInput
              style={styles.modalInput}
              value={submitPrice}
              onChangeText={setSubmitPrice}
              keyboardType="numeric"
              placeholder="e.g. 55"
              placeholderTextColor="#9ca3af"
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Offer Price (₹) — optional</Text>
            <TextInput
              style={styles.modalInput}
              value={submitOfferPrice}
              onChangeText={setSubmitOfferPrice}
              keyboardType="numeric"
              placeholder="e.g. 45"
              placeholderTextColor="#9ca3af"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPriceModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, (!submitStoreId || !submitPrice || submitPriceMutation.isPending) && styles.disabledBtn]}
                onPress={() => submitPriceMutation.mutate()}
                disabled={!submitStoreId || !submitPrice || submitPriceMutation.isPending}
              >
                {submitPriceMutation.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalConfirmText}>Submit</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  alertBtn: { padding: 6 },
  scroll: { padding: 14, gap: 14, paddingBottom: 40 },
  productCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#f3f4f6', gap: 6,
  },
  productName: { fontSize: 18, fontWeight: '700', color: '#111827', lineHeight: 26 },
  productMeta: { fontSize: 13, color: '#6b7280', textTransform: 'capitalize' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  cheapestLabel: { fontSize: 12, color: '#6b7280' },
  cheapestValue: { fontSize: 22, fontWeight: '800', color: '#16a34a' },
  savingBadge: { backgroundColor: '#dcfce7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  savingText: { fontSize: 11, fontWeight: '600', color: '#16a34a' },
  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  priceCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#f3f4f6', gap: 6,
  },
  priceCardBest: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  bestBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#16a34a', alignSelf: 'flex-start',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6,
  },
  bestBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  priceCardInner: { flexDirection: 'row', alignItems: 'center' },
  storeName: { fontSize: 15, fontWeight: '700' },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  deliveryText: { fontSize: 11, color: '#9ca3af' },
  updatedText: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  effPrice: { fontSize: 20, fontWeight: '800', color: '#111827' },
  origPrice: { fontSize: 12, color: '#ef4444', textDecorationLine: 'line-through' },
  discountTag: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  discountText: { fontSize: 11, color: '#16a34a', fontWeight: '600' },
  emptyBox: { backgroundColor: '#fff', borderRadius: 14, padding: 20, alignItems: 'center', gap: 8 },
  emptyText: { color: '#9ca3af', fontSize: 14 },
  emptyAction: { color: '#16a34a', fontSize: 13, fontWeight: '600' },
  submitCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#16a34a', borderRadius: 14, padding: 14,
    backgroundColor: '#fff',
  },
  submitCtaText: { color: '#16a34a', fontWeight: '600', fontSize: 14 },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: '#00000060', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#6b7280', marginBottom: 16, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  modalInput: {
    backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#111827',
  },
  storeChip: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7, marginRight: 8,
    backgroundColor: '#fff',
  },
  storeChipActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  storeChipText: { fontSize: 13, color: '#374151' },
  storeChipTextActive: { color: '#16a34a', fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, alignItems: 'center',
  },
  modalCancelText: { color: '#374151', fontWeight: '600' },
  modalConfirmBtn: { flex: 2, backgroundColor: '#16a34a', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disabledBtn: { opacity: 0.5 },
});
