import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, LogOut, Bell, MapPin, Shield, ChevronRight, ShoppingCart } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.authPrompt}>
          <View style={styles.logoCircle}>
            <ShoppingCart color="#16a34a" size={32} />
          </View>
          <Text style={styles.appName}>SmartBasket</Text>
          <Text style={styles.authSubtitle}>Sign in to track spending, set alerts,{'\n'}and access your purchase history</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/auth/login' as any)}>
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/auth/register' as any)}>
            <Text style={styles.registerBtnText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const menuItems = [
    { icon: Bell, label: 'Notification Settings', action: () => {} },
    { icon: MapPin, label: `City: ${user?.city || 'Not set'}`, action: () => {} },
    ...(user?.role === 'admin' ? [{ icon: Shield, label: 'Admin Panel', action: () => router.push('/admin' as any) }] : []),
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* User card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{user?.role?.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i < menuItems.length - 1 && styles.menuItemBorder]}
              onPress={item.action}
            >
              <item.icon color="#6b7280" size={18} />
              <Text style={styles.menuItemText}>{item.label}</Text>
              <ChevronRight color="#d1d5db" size={18} />
            </TouchableOpacity>
          ))}
        </View>

        {/* App info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About SmartBasket</Text>
          <Text style={styles.infoText}>
            Compare grocery prices across DMart, BigBasket, Blinkit, Zepto, JioMart, Swiggy Instamart and more.
          </Text>
          <Text style={styles.infoVersion}>Version 1.0.0 · Made for Indian Grocery Shoppers</Text>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color="#ef4444" size={18} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { padding: 16, gap: 14 },
  authPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: '#dcfce7',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  appName: { fontSize: 24, fontWeight: '800', color: '#111827' },
  authSubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  signInBtn: {
    width: '100%', backgroundColor: '#16a34a', borderRadius: 14,
    padding: 15, alignItems: 'center', marginTop: 8,
  },
  signInBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  registerBtn: {
    width: '100%', borderWidth: 1.5, borderColor: '#16a34a',
    borderRadius: 14, padding: 15, alignItems: 'center',
  },
  registerBtnText: { color: '#16a34a', fontWeight: '700', fontSize: 15 },
  userCard: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6',
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: '#16a34a',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  userName: { fontSize: 17, fontWeight: '700', color: '#111827' },
  userEmail: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  roleBadge: {
    marginTop: 6, backgroundColor: '#f0fdf4', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start',
  },
  roleBadgeText: { fontSize: 10, fontWeight: '700', color: '#16a34a', letterSpacing: 0.5 },
  menuCard: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1,
    borderColor: '#f3f4f6', overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, backgroundColor: '#fff',
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  menuItemText: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },
  infoCard: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1,
    borderColor: '#f3f4f6', padding: 16,
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 6 },
  infoText: { fontSize: 13, color: '#6b7280', lineHeight: 20 },
  infoVersion: { fontSize: 11, color: '#9ca3af', marginTop: 8 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 14, padding: 14,
  },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});
