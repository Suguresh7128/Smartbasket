import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, Edit3, Trash2, Plus, Receipt } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { billsAPI } from '../../services/api';

interface BillItem {
  name: string;
  price: number | null;
  quantity: number | null;
  unit: string | null;
  matched: boolean;
}

export default function BillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [items, setItems] = useState<BillItem[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [saved, setSaved] = useState(false);

  const { data: bill, isLoading, refetch } = useQuery<any, Error>({
    queryKey: ['bill', id],
    queryFn: () => billsAPI.get(id!).then(r => r.data.data),
    enabled: !!id,
    refetchInterval: (data) =>
      (data as any)?.status === 'processing' ? 3000 : false,
  });

  useEffect(() => {
    if (bill?.items?.length) setItems(bill.items);
  }, [bill?.items]);

  const saveMutation = useMutation({
    mutationFn: () => billsAPI.update(id!, {
      items,
      storeName: bill?.storeName,
      storeId: bill?.storeId,
    }),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ['bills'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => Alert.alert('Error', 'Failed to save changes'),
  });

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditName(items[idx].name);
    setEditPrice(items[idx].price?.toString() || '');
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    const updated = [...items];
    updated[editingIdx] = {
      ...updated[editingIdx],
      name: editName,
      price: parseFloat(editPrice) || null,
    };
    setItems(updated);
    setEditingIdx(null);
  };

  const deleteItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    setItems(prev => [...prev, { name: 'New Item', price: null, quantity: null, unit: null, matched: false }]);
    setEditingIdx(items.length);
    setEditName('New Item');
    setEditPrice('');
  };

  const total = items.reduce((sum, i) => sum + (i.price || 0), 0);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color="#16a34a" style={{ marginTop: 60 }} size="large" />
      </SafeAreaView>
    );
  }

  const isProcessing = bill?.status === 'processing';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#374151" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {bill?.storeName || 'Bill'} · {new Date(bill?.billDate || '').toLocaleDateString('en-IN')}
        </Text>
        <TouchableOpacity
          style={[styles.saveBtn, (saveMutation.isPending || isProcessing) && styles.saveBtnDisabled]}
          onPress={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || isProcessing}
        >
          {saved
            ? <CheckCircle color="#16a34a" size={18} />
            : saveMutation.isPending
              ? <ActivityIndicator color="#16a34a" size="small" />
              : <Text style={styles.saveBtnText}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      {isProcessing ? (
        <View style={styles.processingBox}>
          <ActivityIndicator color="#16a34a" size="large" />
          <Text style={styles.processingTitle}>AI is reading your bill…</Text>
          <Text style={styles.processingSubtitle}>This takes about 10–20 seconds</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Bill image thumbnail */}
          {bill?.imageUrl && (
            <Image source={{ uri: bill.imageUrl }} style={styles.billThumb} resizeMode="cover" />
          )}

          {/* Status banner */}
          {bill?.status === 'failed' && (
            <View style={styles.failedBanner}>
              <Text style={styles.failedText}>
                ⚠️ OCR couldn't read all items automatically. Edit below to correct them.
              </Text>
            </View>
          )}

          {/* Summary bar */}
          <View style={styles.summaryBar}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Items</Text>
              <Text style={styles.summaryValue}>{items.length}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Matched</Text>
              <Text style={[styles.summaryValue, { color: '#16a34a' }]}>
                {items.filter(i => i.matched).length}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={[styles.summaryValue, { color: '#16a34a' }]}>
                ₹{total.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Items list */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            {items.map((item, idx) => (
              <View key={idx} style={styles.itemCard}>
                {editingIdx === idx ? (
                  /* Edit mode */
                  <View style={styles.editMode}>
                    <TextInput
                      style={styles.editInput}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Item name"
                      placeholderTextColor="#9ca3af"
                    />
                    <View style={styles.editPriceRow}>
                      <Text style={styles.rupeeSign}>₹</Text>
                      <TextInput
                        style={[styles.editInput, { flex: 1 }]}
                        value={editPrice}
                        onChangeText={setEditPrice}
                        keyboardType="numeric"
                        placeholder="Price"
                        placeholderTextColor="#9ca3af"
                      />
                      <TouchableOpacity style={styles.doneBtn} onPress={saveEdit}>
                        <Text style={styles.doneBtnText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  /* View mode */
                  <View style={styles.viewMode}>
                    <View style={styles.itemLeft}>
                      <View style={[styles.matchDot, { backgroundColor: item.matched ? '#16a34a' : '#d1d5db' }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                        {item.quantity && (
                          <Text style={styles.itemQty}>{item.quantity}{item.unit || ''}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.itemRight}>
                      <Text style={styles.itemPrice}>
                        {item.price != null ? `₹${item.price.toFixed(0)}` : '—'}
                      </Text>
                      <TouchableOpacity onPress={() => startEdit(idx)} style={styles.iconBtn}>
                        <Edit3 color="#9ca3af" size={15} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteItem(idx)} style={styles.iconBtn}>
                        <Trash2 color="#ef4444" size={15} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
              <Plus color="#16a34a" size={16} />
              <Text style={styles.addItemText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {/* Total */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total.toLocaleString('en-IN')}</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#f0fdf4', borderRadius: 10 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#16a34a', fontWeight: '700', fontSize: 13 },
  processingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40 },
  processingTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  processingSubtitle: { fontSize: 13, color: '#6b7280' },
  scroll: { padding: 14, gap: 12, paddingBottom: 40 },
  billThumb: { width: '100%', height: 160, borderRadius: 14, backgroundColor: '#f3f4f6' },
  failedBanner: { backgroundColor: '#fef3c7', borderRadius: 12, padding: 12 },
  failedText: { color: '#92400e', fontSize: 13, lineHeight: 20 },
  summaryBar: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6',
    flexDirection: 'row', padding: 16,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#6b7280', marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '700', color: '#111827' },
  summaryDivider: { width: 1, backgroundColor: '#f3f4f6', marginHorizontal: 8 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  itemCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  viewMode: { flexDirection: 'row', alignItems: 'center' },
  itemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  matchDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemQty: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#111827', minWidth: 50, textAlign: 'right' },
  iconBtn: { padding: 4 },
  editMode: { gap: 8 },
  editInput: {
    backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827',
  },
  editPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rupeeSign: { fontSize: 16, color: '#374151', fontWeight: '600' },
  doneBtn: { backgroundColor: '#16a34a', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  addItemBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#16a34a', borderStyle: 'dashed',
    borderRadius: 12, padding: 12,
  },
  addItemText: { color: '#16a34a', fontWeight: '600', fontSize: 14 },
  totalCard: {
    backgroundColor: '#16a34a', borderRadius: 16, padding: 18,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  totalLabel: { color: '#dcfce7', fontSize: 15, fontWeight: '600' },
  totalValue: { color: '#fff', fontSize: 24, fontWeight: '800' },
});
