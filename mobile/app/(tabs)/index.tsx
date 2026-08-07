import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Search, TrendingUp, ShoppingCart, Camera, Bell, BarChart3, MapPin, ChevronDown } from 'lucide-react-native';
import { productsAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import LocationPicker from '../../components/LocationPicker';

const FEATURE_CARDS = [
  { icon: BarChart3, label: 'Compare\nPrices',  color: '#dcfce7', iconColor: '#16a34a', route: '/(tabs)/search' },
  { icon: Camera,    label: 'Scan\nBill',        color: '#fef3c7', iconColor: '#d97706', route: '/upload' },
  { icon: Bell,      label: 'Price\nAlerts',     color: '#ede9fe', iconColor: '#7c3aed', route: '/(tabs)/alerts' },
  { icon: BarChart3, label: 'Analytics',         color: '#dbeafe', iconColor: '#2563eb', route: '/(tabs)/dashboard' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { location, showPicker, setShowPicker, hydrate } = useLocationStore();
  const [searchText, setSearchText] = useState('');
  const [showFirstTimePicker, setShowFirstTimePicker] = useState(false);

  useEffect(() => {
    hydrate().then(() => {
      const { location: loc } = useLocationStore.getState();
      if (!loc) setTimeout(() => setShowFirstTimePicker(true), 600);
    });
  }, []);

  const { data: trending } = useQuery({
    queryKey: ['trending'],
    queryFn: () => productsAPI.trending().then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const handleSearch = () => {
    if (searchText.trim()) {
      const params: any = { q: searchText.trim() };
      if (location?.pincode) params.pincode = location.pincode;
      router.push({ pathname: '/(tabs)/search', params });
    }
  };

  const totalStores = (location?.nearbyOutlets?.length || 0) + (location?.onlineStores?.length || 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{user ? `Hi, ${user.name.split(' ')[0]} 👋` : 'SmartBasket'}</Text>
            <Text style={styles.tagline}>Find the best grocery deals</Text>
          </View>
          <View style={styles.logoWrap}><ShoppingCart color="#16a34a" size={22} /></View>
        </View>

        {/* Location chip */}
        <TouchableOpacity style={styles.locationChip} onPress={() => setShowPicker(true)}>
          <MapPin color="#16a34a" size={14} />
          {location ? (
            <Text style={styles.locationText} numberOfLines={1}>
              <Text style={styles.locationPin}>{location.pincode}</Text>
              <Text style={styles.locationCity}> — {location.city}</Text>
              {totalStores > 0 && <Text style={styles.locationStores}> · {totalStores} stores</Text>}
            </Text>
          ) : (
            <Text style={styles.locationPlaceholder}>Set your pincode for local prices</Text>
          )}
          <ChevronDown color="#6b7280" size={14} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search color="#9ca3af" size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Sugar, Rice, Oil..."
              placeholderTextColor="#9ca3af"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>Go</Text>
          </TouchableOpacity>
        </View>

        {/* Nearby store badges */}
        {location && totalStores > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available near {location.pincode}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {location.nearbyOutlets?.map((o, i) => (
                <View key={i} style={[styles.storeBadge, { borderColor: o.color + '60', backgroundColor: o.color + '15' }]}>
                  <Text style={styles.storeDelivery}>{o.distanceKm} km</Text>
                  <Text style={[styles.storeName, { color: o.color || '#374151' }]}>{o.storeName}</Text>
                </View>
              ))}
              {location.onlineStores?.map((s, i) => (
                <View key={i} style={[styles.storeBadge, { borderColor: (s.color||'#16a34a') + '60', backgroundColor: (s.color||'#16a34a') + '15' }]}>
                  {s.deliveryTime && <Text style={styles.storeDelivery}>{s.deliveryTime}</Text>}
                  <Text style={[styles.storeName, { color: s.color || '#16a34a' }]}>{s.storeName}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.featureGrid}>
            {FEATURE_CARDS.map(f => (
              <TouchableOpacity key={f.label} style={[styles.featureCard, { backgroundColor: f.color }]}
                onPress={() => router.push(f.route as any)} activeOpacity={0.75}>
                <f.icon color={f.iconColor} size={24} />
                <Text style={[styles.featureLabel, { color: f.iconColor }]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trending */}
        {trending?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Trending</Text>
            <View style={styles.trendingWrap}>
              {trending.slice(0, 12).map((p: any) => (
                <TouchableOpacity key={p._id} style={styles.trendingChip}
                  onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: p.productName, ...(location?.pincode && { pincode: location.pincode }) } })}>
                  <Text style={styles.trendingText}>{p.productName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      <LocationPicker visible={showPicker || showFirstTimePicker} onClose={() => { setShowPicker(false); setShowFirstTimePicker(false); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, backgroundColor: '#fff' },
  greeting: { fontSize: 20, fontWeight: '700', color: '#111827' },
  tagline: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  logoWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  locationChip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, marginBottom: 8, backgroundColor: '#f0fdf4', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#bbf7d0' },
  locationText: { flex: 1, fontSize: 13 },
  locationPin: { fontWeight: '700', color: '#15803d', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  locationCity: { color: '#374151' },
  locationStores: { color: '#16a34a', fontWeight: '600' },
  locationPlaceholder: { flex: 1, fontSize: 13, color: '#6b7280' },
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 14, color: '#111827' },
  searchBtn: { backgroundColor: '#16a34a', borderRadius: 12, paddingHorizontal: 16, height: 44, alignItems: 'center', justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  section: { paddingHorizontal: 16, marginTop: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureCard: { width: '47%', borderRadius: 16, padding: 16, alignItems: 'center', gap: 8, elevation: 1 },
  featureLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 16 },
  storeBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, alignItems: 'center' },
  storeDelivery: { fontSize: 10, color: '#6b7280', marginBottom: 2 },
  storeName: { fontSize: 12, fontWeight: '700' },
  trendingWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trendingChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  trendingText: { fontSize: 13, color: '#374151' },
});
