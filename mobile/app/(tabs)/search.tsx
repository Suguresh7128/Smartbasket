import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Search, Trophy, ChevronRight, Tag, MapPin } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productsAPI, pricesAPI } from '../../services/api';
import { useLocationStore } from '../../store/locationStore';
import LocationPicker from '../../components/LocationPicker';

function PriceRow({ price, isCheapest }: { price: any; isCheapest: boolean }) {
  const eff = price.offerPrice || price.price;
  const saved = price.price - eff;
  return (
    <View style={[styles.priceRow, isCheapest && styles.cheapestRow]}>
      {isCheapest && (
        <View style={styles.cheapestBadge}>
          <Trophy color="#fff" size={10} />
          <Text style={styles.cheapestBadgeText}>CHEAPEST</Text>
        </View>
      )}
      <View style={styles.priceRowInner}>
        <View>
          <Text style={[styles.storeName, { color: price.storeId?.color || '#374151' }]}>{price.storeId?.name}</Text>
          {price.storeId?.deliveryTime && <Text style={styles.deliveryTime}>{price.storeId.deliveryTime}</Text>}
          <Text style={styles.updatedText}>Updated {new Date(price.lastUpdated).toLocaleDateString('en-IN')}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.effPrice}>₹{eff.toFixed(0)}</Text>
          {saved > 0 && <Text style={styles.origPrice}>₹{price.price.toFixed(0)}</Text>}
          {saved > 0 && <View style={styles.discountTag}><Tag color="#16a34a" size={9}/><Text style={styles.discountText}>{Math.round((saved/price.price)*100)}% off</Text></View>}
        </View>
      </View>
    </View>
  );
}

function ProductCard({ product, pincode }: { product: any; pincode?: string }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const { data: prices, isLoading } = useQuery({
    queryKey: ['prices', product._id, pincode||'all'],
    queryFn: () => pricesAPI.compare(product._id, pincode).then(r => r.data.data),
    enabled: expanded,
    staleTime: 5 * 60 * 1000,
  });
  const cheapest = prices?.[0];
  const cheapestEff = cheapest ? (cheapest.offerPrice || cheapest.price) : null;

  return (
    <View style={styles.productCard}>
      <TouchableOpacity style={styles.productHeader} onPress={() => setExpanded(e => !e)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.productName} numberOfLines={2}>{product.productName}</Text>
          <Text style={styles.productMeta}>{product.brand ? `${product.brand} · ` : ''}{product.quantity}{product.unit}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          {cheapestEff && !isLoading && <Text style={styles.cheapestPrice}>from ₹{cheapestEff.toFixed(0)}</Text>}
          <ChevronRight color="#9ca3af" size={18} style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }} />
        </View>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.pricesContainer}>
          {isLoading ? <ActivityIndicator color="#16a34a" style={{ padding: 16 }} />
          : prices?.length ? (
            <>
              {prices.map((p: any, i: number) => <PriceRow key={p._id} price={p} isCheapest={i === 0} />)}
              <TouchableOpacity style={styles.viewDetailBtn}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: product._id, ...(pincode && { pincode }) } })}>
                <Text style={styles.viewDetailText}>View Details & History →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.noPricesText}>{pincode ? `No prices found near ${pincode}` : 'No prices yet. Be the first to submit!'}</Text>
          )}
        </View>
      )}
    </View>
  );
}

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string; pincode?: string }>();
  const { location, showPicker, setShowPicker } = useLocationStore();
  const [inputVal, setInputVal] = useState(params.q || '');
  const [query, setQuery] = useState(params.q || '');

  const activePincode = params.pincode || location?.pincode || '';

  useEffect(() => {
    if (params.q) { setInputVal(params.q); setQuery(params.q); }
  }, [params.q]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => productsAPI.search(query).then(r => r.data),
    enabled: !!query.trim(),
    staleTime: 60 * 1000,
  });

  const handleSearch = () => { if (inputVal.trim()) setQuery(inputVal.trim()); };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Location bar */}
      <TouchableOpacity style={styles.locationBar} onPress={() => setShowPicker(true)}>
        <MapPin color="#16a34a" size={14} />
        {activePincode ? (
          <Text style={styles.locationBarText}>Prices near <Text style={styles.locationBarPin}>{activePincode}</Text>{location?.city ? ` — ${location.city}` : ''}</Text>
        ) : (
          <Text style={styles.locationBarText}>Tap to set location for local prices</Text>
        )}
        <Text style={styles.locationBarChange}>Change</Text>
      </TouchableOpacity>

      {/* Search input */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBox}>
          <Search color="#9ca3af" size={17} />
          <TextInput style={styles.searchInput} placeholder="Search groceries..." placeholderTextColor="#9ca3af"
            value={inputVal} onChangeText={setInputVal} onSubmitEditing={handleSearch} returnKeyType="search" />
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnTxt}>Search</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}><ActivityIndicator color="#16a34a" size="large" /></View>
      ) : (
        <FlatList
          data={data?.data || []}
          keyExtractor={p => p._id}
          renderItem={({ item }) => <ProductCard product={item} pincode={activePincode||undefined} />}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            data?.data?.length ? (
              <Text style={styles.resultCount}>{data.total} results{activePincode ? ` near ${activePincode}` : ''} · tap to compare</Text>
            ) : query && !isLoading ? (
              <Text style={styles.noResults}>No results for "{query}"</Text>
            ) : null
          }
          ListEmptyComponent={
            !query ? (
              <View style={styles.centered}>
                <Search color="#e5e7eb" size={48} />
                <Text style={styles.emptyText}>Search any grocery item</Text>
              </View>
            ) : null
          }
        />
      )}

      <LocationPicker visible={showPicker} onClose={() => setShowPicker(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  locationBar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#f0fdf4', borderBottomWidth: 1, borderBottomColor: '#bbf7d0' },
  locationBarText: { flex: 1, fontSize: 12, color: '#374151' },
  locationBarPin: { fontWeight: '700', color: '#15803d' },
  locationBarChange: { fontSize: 12, fontWeight: '600', color: '#16a34a' },
  searchHeader: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', height: 42 },
  searchBtn: { backgroundColor: '#16a34a', borderRadius: 12, paddingHorizontal: 14, height: 42, justifyContent: 'center' },
  searchBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  list: { padding: 12, gap: 10, paddingBottom: 40 },
  resultCount: { fontSize: 12, color: '#6b7280', marginBottom: 4, paddingHorizontal: 4 },
  noResults: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 40 },
  productCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6', overflow: 'hidden', elevation: 1 },
  productHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  productName: { fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 20 },
  productMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  cheapestPrice: { fontSize: 15, fontWeight: '700', color: '#16a34a' },
  pricesContainer: { borderTopWidth: 1, borderTopColor: '#f9fafb', padding: 12, gap: 8 },
  priceRow: { borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', padding: 12, backgroundColor: '#fafafa' },
  cheapestRow: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  cheapestBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#16a34a', alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  cheapestBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  priceRowInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storeName: { fontSize: 14, fontWeight: '600' },
  deliveryTime: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  updatedText: { fontSize: 10, color: '#d1d5db', marginTop: 2 },
  effPrice: { fontSize: 18, fontWeight: '700', color: '#111827' },
  origPrice: { fontSize: 12, color: '#ef4444', textDecorationLine: 'line-through' },
  discountTag: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  discountText: { fontSize: 11, color: '#16a34a', fontWeight: '600' },
  viewDetailBtn: { marginTop: 4, alignItems: 'center', paddingVertical: 6 },
  viewDetailText: { color: '#16a34a', fontSize: 13, fontWeight: '600' },
  noPricesText: { color: '#9ca3af', textAlign: 'center', padding: 16, fontSize: 13 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 60 },
  emptyText: { color: '#9ca3af', marginTop: 12, fontSize: 14 },
});
