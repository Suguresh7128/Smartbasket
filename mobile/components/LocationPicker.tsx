import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Modal, Keyboard,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import { MapPin, Search, X, CheckCircle, Navigation, ChevronRight, Zap, AlertTriangle } from 'lucide-react-native';
import { locationAPI } from '../services/api';
import { useLocationStore } from '../store/locationStore';

const POPULAR = [
  { pincode:'560034', label:'Bengaluru — Koramangala' },
  { pincode:'560038', label:'Bengaluru — Indiranagar' },
  { pincode:'560032', label:'Bengaluru — R T Nagar' },
  { pincode:'560041', label:'Bengaluru — Jayanagar' },
  { pincode:'560102', label:'Bengaluru — HSR Layout' },
  { pincode:'560066', label:'Bengaluru — Whitefield' },
  { pincode:'560064', label:'Bengaluru — Yelahanka' },
  { pincode:'560078', label:'Bengaluru — JP Nagar' },
  { pincode:'560068', label:'Bengaluru — Electronic City' },
  { pincode:'560103', label:'Bengaluru — Bellandur' },
  { pincode:'570017', label:'Mysuru — Vijayanagar' },
  { pincode:'500032', label:'Hyderabad — Gachibowli' },
  { pincode:'585228', label:'Kalaburgi — Shahabad' },
  { pincode:'584170', label:'Raichur — Shaktinagar' },
];

const COVERAGE_STYLES: Record<string, any> = {
  full:        { bg:'#f0fdf4', border:'#86efac', text:'#15803d', label:'Full coverage' },
  partial:     { bg:'#eff6ff', border:'#93c5fd', text:'#1e40af', label:'Partial coverage' },
  online_only: { bg:'#fffbeb', border:'#fcd34d', text:'#92400e', label:'Online delivery only' },
};

interface Props { visible: boolean; onClose: () => void; }

export default function LocationPicker({ visible, onClose }: Props) {
  const { setLocation } = useLocationStore();
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [result, setResult]   = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (visible) { setPincode(''); setResult(null); setError(''); setSuggestions([]); }
  }, [visible]);

  useEffect(() => {
    if (pincode.length < 3) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try { const { data } = await locationAPI.autocomplete(pincode); setSuggestions(data.data || []); }
      catch {}
    }, 350);
    return () => clearTimeout(t);
  }, [pincode]);

  const lookup = async (pin: string) => {
    const p = pin.trim();
    if (!/^\d{6}$/.test(p)) { setError('Enter a valid 6-digit pincode'); return; }
    Keyboard.dismiss();
    setLoading(true); setError(''); setResult(null); setSuggestions([]);
    try {
      const { data } = await locationAPI.lookup(p);
      setResult(data.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Pincode not found. Please try again.');
    } finally { setLoading(false); }
  };

  const handleConfirm = async () => {
    if (!result) return;
    await setLocation(result);
    onClose();
  };

  const cov = result ? (COVERAGE_STYLES[result.coverageLevel] || COVERAGE_STYLES.online_only) : null;
  const nearbyQC     = result?.nearbyOutlets?.filter((o:any) => o.type === 'quick_commerce') || [];
  const nearbyPhysical = result?.nearbyOutlets?.filter((o:any) => o.type !== 'quick_commerce') || [];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.overlay}>
          <TouchableOpacity style={{ flex:1 }} onPress={onClose} />
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <MapPin color="#16a34a" size={18} />
                <Text style={styles.headerTitle}>Set your location</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color="#6b7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.subtitle}>Enter your pincode to see prices from stores that deliver to your area.</Text>

              <View style={styles.inputRow}>
                <View style={styles.inputWrap}>
                  <Search color="#9ca3af" size={16} />
                  <TextInput
                    style={styles.input}
                    value={pincode}
                    onChangeText={t => { setPincode(t.replace(/\D/g,'')); setError(''); setResult(null); }}
                    placeholder="560032"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    maxLength={6}
                    autoFocus
                  />
                </View>
                <TouchableOpacity
                  style={[styles.searchBtn, (pincode.length !== 6 || loading) && styles.searchBtnDisabled]}
                  onPress={() => lookup(pincode)}
                  disabled={pincode.length !== 6 || loading}>
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.searchBtnText}>Search</Text>}
                </TouchableOpacity>
              </View>

              {/* Autocomplete */}
              {suggestions.length > 0 && !result && (
                <View style={styles.suggestBox}>
                  {suggestions.map((s:any) => (
                    <TouchableOpacity key={s.pincode} style={styles.suggestItem}
                      onPress={() => { setPincode(s.pincode); lookup(s.pincode); setSuggestions([]); }}>
                      <MapPin color="#9ca3af" size={14} />
                      <Text style={styles.suggestPin}>{s.pincode}</Text>
                      <Text style={styles.suggestCity}>{s.city}, {s.state}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

              {/* Result */}
              {result && cov && (
                <View style={styles.resultWrap}>
                  {/* Coverage banner */}
                  <View style={[styles.coverageBanner, { backgroundColor: cov.bg, borderColor: cov.border }]}>
                    <CheckCircle color={cov.text} size={18} />
                    <View style={{ flex:1 }}>
                      <Text style={[styles.resultPin, { color: cov.text }]}>{result.pincode} — {result.city}</Text>
                      <Text style={[styles.resultSub]}>{result.district}, {result.state}</Text>
                      <View style={styles.coveragePills}>
                        <View style={[styles.coveragePill, { backgroundColor: cov.bg, borderColor: cov.border }]}>
                          <Text style={[styles.coveragePillText, { color: cov.text }]}>{cov.label}</Text>
                        </View>
                        <Text style={styles.storeCount}>{result.totalStores} stores available</Text>
                      </View>
                    </View>
                  </View>

                  {/* Quick commerce */}
                  {nearbyQC.length > 0 && (
                    <View style={styles.sectionWrap}>
                      <View style={styles.sectionTitleRow}>
                        <Zap color="#d97706" size={12} />
                        <Text style={styles.sectionTitle}>QUICK DELIVERY</Text>
                      </View>
                      {nearbyQC.map((o:any, i:number) => (
                        <View key={i} style={styles.outletRow}>
                          <View style={[styles.outletDot, { backgroundColor: o.color || '#16a34a' }]} />
                          <Text style={styles.outletName}>{o.storeName}</Text>
                          <Text style={styles.outletDist}>{o.distanceKm} km</Text>
                          {o.deliveryTime && (
                            <View style={styles.qcBadge}><Text style={styles.qcBadgeText}>{o.deliveryTime}</Text></View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Physical stores */}
                  {nearbyPhysical.length > 0 && (
                    <View style={styles.sectionWrap}>
                      <Text style={styles.sectionTitle}>NEARBY STORES</Text>
                      {nearbyPhysical.map((o:any, i:number) => (
                        <View key={i} style={styles.outletRow}>
                          <View style={[styles.outletDot, { backgroundColor: o.color || '#16a34a' }]} />
                          <Text style={styles.outletName}>{o.storeName}</Text>
                          <Text style={styles.outletDist}>{o.distanceKm} km</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Online stores */}
                  {result.onlineStores?.length > 0 && (
                    <View style={styles.sectionWrap}>
                      <Text style={styles.sectionTitle}>ONLINE DELIVERY</Text>
                      <View style={styles.onlineRow}>
                        {result.onlineStores.map((s:any, i:number) => (
                          <View key={i} style={[styles.onlineChip, {
                            borderColor:(s.color||'#16a34a')+'60',
                            backgroundColor:(s.color||'#16a34a')+'15',
                          }]}>
                            <Text style={[styles.onlineChipText, { color: s.color||'#16a34a' }]}>
                              {s.storeName}{s.deliveryTime ? ` · ${s.deliveryTime}` : ''}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {result.totalStores === 0 && (
                    <View style={styles.noStoresBox}>
                      <AlertTriangle color="#92400e" size={16} />
                      <Text style={styles.noStoresText}>
                        No stores found near this pincode yet. We are expanding!
                        You can still browse all prices.
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                    <CheckCircle color="#fff" size={18} />
                    <Text style={styles.confirmBtnText}>Use this location</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Popular list */}
              {!result && (
                <View style={styles.popularWrap}>
                  <Text style={styles.sectionTitle}>POPULAR LOCATIONS</Text>
                  {POPULAR.map(p => (
                    <TouchableOpacity key={p.pincode} style={styles.popularItem}
                      onPress={() => { setPincode(p.pincode); lookup(p.pincode); }}>
                      <Navigation color="#9ca3af" size={14} />
                      <Text style={styles.popularPin}>{p.pincode}</Text>
                      <Text style={styles.popularLabel}>{p.label}</Text>
                      <ChevronRight color="#d1d5db" size={16} style={{ marginLeft:'auto' }} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:    { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  sheet:      { backgroundColor:'#fff', borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'92%' },
  handle:     { width:40, height:4, backgroundColor:'#e5e7eb', borderRadius:2, alignSelf:'center', marginTop:10, marginBottom:4 },
  header:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:14, borderBottomWidth:1, borderBottomColor:'#f3f4f6' },
  headerLeft: { flexDirection:'row', alignItems:'center', gap:8 },
  headerTitle:{ fontSize:16, fontWeight:'700', color:'#111827' },
  closeBtn:   { padding:4 },
  scroll:     { padding:20, paddingBottom:40 },
  subtitle:   { fontSize:13, color:'#6b7280', lineHeight:20, marginBottom:14 },
  inputRow:   { flexDirection:'row', gap:8, marginBottom:8 },
  inputWrap:  { flex:1, flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#f9fafb', borderWidth:1.5, borderColor:'#e5e7eb', borderRadius:12, paddingHorizontal:12, height:46 },
  input:      { flex:1, fontSize:16, color:'#111827', fontFamily:Platform.OS==='ios'?'Courier New':'monospace', letterSpacing:2 },
  searchBtn:  { backgroundColor:'#16a34a', borderRadius:12, paddingHorizontal:16, height:46, justifyContent:'center' },
  searchBtnDisabled: { opacity:0.5 },
  searchBtnText: { color:'#fff', fontWeight:'700', fontSize:14 },
  suggestBox: { backgroundColor:'#fff', borderWidth:1, borderColor:'#e5e7eb', borderRadius:12, overflow:'hidden', marginBottom:8 },
  suggestItem:{ flexDirection:'row', alignItems:'center', gap:8, padding:12, borderBottomWidth:1, borderBottomColor:'#f9fafb' },
  suggestPin: { fontSize:14, fontWeight:'700', color:'#111827', fontFamily:Platform.OS==='ios'?'Courier New':'monospace' },
  suggestCity:{ fontSize:13, color:'#6b7280' },
  errorBox:   { backgroundColor:'#fef2f2', borderRadius:12, padding:12, marginBottom:8 },
  errorText:  { color:'#ef4444', fontSize:13 },
  resultWrap: { gap:10 },
  coverageBanner: { borderRadius:14, borderWidth:1.5, padding:14, flexDirection:'row', gap:10, alignItems:'flex-start' },
  resultPin:  { fontSize:15, fontWeight:'700' },
  resultSub:  { fontSize:12, color:'#6b7280', marginTop:2 },
  coveragePills: { flexDirection:'row', alignItems:'center', gap:8, marginTop:6, flexWrap:'wrap' },
  coveragePill:  { borderRadius:20, borderWidth:1, paddingHorizontal:8, paddingVertical:3 },
  coveragePillText: { fontSize:10, fontWeight:'700' },
  storeCount: { fontSize:11, color:'#6b7280' },
  sectionWrap:{ gap:5 },
  sectionTitleRow: { flexDirection:'row', alignItems:'center', gap:4 },
  sectionTitle: { fontSize:10, fontWeight:'700', color:'#9ca3af', letterSpacing:1 },
  outletRow:  { flexDirection:'row', alignItems:'center', gap:8, paddingVertical:7, paddingHorizontal:10, backgroundColor:'#f9fafb', borderRadius:10 },
  outletDot:  { width:8, height:8, borderRadius:4, flexShrink:0 },
  outletName: { flex:1, fontSize:13, fontWeight:'600', color:'#111827' },
  outletDist: { fontSize:11, color:'#6b7280' },
  qcBadge:    { backgroundColor:'#fef3c7', borderRadius:8, paddingHorizontal:7, paddingVertical:3 },
  qcBadgeText:{ fontSize:10, fontWeight:'700', color:'#92400e' },
  onlineRow:  { flexDirection:'row', flexWrap:'wrap', gap:6 },
  onlineChip: { borderWidth:1, borderRadius:16, paddingHorizontal:10, paddingVertical:5 },
  onlineChipText: { fontSize:12, fontWeight:'600' },
  noStoresBox:{ flexDirection:'row', gap:8, backgroundColor:'#fffbeb', borderRadius:12, padding:12 },
  noStoresText:{ flex:1, fontSize:12, color:'#92400e', lineHeight:18 },
  confirmBtn: { backgroundColor:'#16a34a', borderRadius:14, padding:15, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8 },
  confirmBtnText: { color:'#fff', fontWeight:'700', fontSize:15 },
  popularWrap:{ marginTop:4, gap:4 },
  popularItem:{ flexDirection:'row', alignItems:'center', gap:10, paddingVertical:12, paddingHorizontal:4, borderBottomWidth:1, borderBottomColor:'#f9fafb' },
  popularPin: { fontSize:13, fontWeight:'700', color:'#374151', fontFamily:Platform.OS==='ios'?'Courier New':'monospace', width:55 },
  popularLabel:{ fontSize:13, color:'#6b7280', flex:1 },
});
