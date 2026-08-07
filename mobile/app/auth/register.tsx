import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ShoppingCart, ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';

const CITIES = ['Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Mysuru', 'Other'];

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', city: 'Bengaluru' });
  const [cityOpen, setCityOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(form);
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color="#374151" size={22} />
          </TouchableOpacity>

          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
              <ShoppingCart color="#16a34a" size={28} />
            </View>
            <Text style={styles.appName}>SmartBasket</Text>
          </View>

          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Start saving on groceries today</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            {[
              { key: 'name', label: 'Full Name', placeholder: 'Ravi Kumar', keyboard: 'default' },
              { key: 'email', label: 'Email', placeholder: 'ravi@example.com', keyboard: 'email-address' },
              { key: 'password', label: 'Password', placeholder: 'Min. 6 characters', keyboard: 'default' },
            ].map(f => (
              <View key={f.key} style={styles.inputGroup}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={f.placeholder}
                  placeholderTextColor="#9ca3af"
                  value={(form as any)[f.key]}
                  onChangeText={set(f.key)}
                  keyboardType={f.keyboard as any}
                  autoCapitalize={f.key === 'email' ? 'none' : 'words'}
                  secureTextEntry={f.key === 'password'}
                  autoCorrect={false}
                />
              </View>
            ))}

            {/* City picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>City</Text>
              <TouchableOpacity style={styles.cityBtn} onPress={() => setCityOpen(o => !o)}>
                <Text style={styles.cityBtnText}>{form.city}</Text>
                <Text style={styles.cityArrow}>{cityOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {cityOpen && (
                <View style={styles.cityDropdown}>
                  {CITIES.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.cityOption, form.city === c && styles.cityOptionActive]}
                      onPress={() => { set('city')(c); setCityOpen(false); }}
                    >
                      <Text style={[styles.cityOptionText, form.city === c && styles.cityOptionTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.submitBtnText}>Create Account</Text>
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.switchBtn} onPress={() => router.push('/auth/login' as any)}>
            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text style={styles.switchLink}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24, flexGrow: 1 },
  backBtn: { marginBottom: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoCircle: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: '#dcfce7',
    alignItems: 'center', justifyContent: 'center',
  },
  appName: { fontSize: 22, fontWeight: '800', color: '#111827' },
  title: { fontSize: 26, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 6, marginBottom: 24 },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: '#ef4444', fontSize: 13 },
  form: { gap: 14 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: {
    backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: '#111827',
  },
  cityBtn: {
    backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cityBtnText: { fontSize: 15, color: '#111827' },
  cityArrow: { fontSize: 12, color: '#9ca3af' },
  cityDropdown: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12,
    backgroundColor: '#fff', overflow: 'hidden', marginTop: -4,
  },
  cityOption: { padding: 13, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  cityOptionActive: { backgroundColor: '#f0fdf4' },
  cityOptionText: { fontSize: 14, color: '#374151' },
  cityOptionTextActive: { color: '#16a34a', fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#16a34a', borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchBtn: { marginTop: 24, alignItems: 'center' },
  switchText: { fontSize: 14, color: '#6b7280' },
  switchLink: { color: '#16a34a', fontWeight: '600' },
});
