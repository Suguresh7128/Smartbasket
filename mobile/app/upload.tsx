import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Upload, X, CheckCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { billsAPI } from '../services/api';

export default function UploadScreen() {
  const router = useRouter();
  const [image, setImage] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async (useCamera: boolean) => {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (perm.status !== 'granted') {
      Alert.alert('Permission Required', `Please allow ${useCamera ? 'camera' : 'photo library'} access in Settings.`);
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name = asset.uri.split('/').pop() || 'bill.jpg';
      const type = name.endsWith('.png') ? 'image/png' : 'image/jpeg';
      setImage({ uri: asset.uri, type, name });
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!image) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('bill', { uri: image.uri, type: image.type, name: image.name } as any);
      const { data } = await billsAPI.upload(fd);
      router.replace({ pathname: '/bill/[id]', params: { id: data.data.billId } });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#374151" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Grocery Bill</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.content}>
        {!image ? (
          <>
            <View style={styles.iconWrap}>
              <Camera color="#d97706" size={36} />
            </View>
            <Text style={styles.title}>Upload Your Bill</Text>
            <Text style={styles.subtitle}>AI will extract all items and prices automatically</Text>

            <TouchableOpacity style={styles.cameraBtn} onPress={() => pickImage(true)}>
              <Camera color="#fff" size={22} />
              <Text style={styles.cameraBtnText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.galleryBtn} onPress={() => pickImage(false)}>
              <ImageIcon color="#16a34a" size={22} />
              <Text style={styles.galleryBtnText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <View style={styles.tipsBox}>
              <Text style={styles.tipsTitle}>📸 Tips for best results</Text>
              <Text style={styles.tipText}>• Keep the bill flat and well-lit</Text>
              <Text style={styles.tipText}>• Ensure all item names are clearly visible</Text>
              <Text style={styles.tipText}>• Avoid shadows or reflections on the bill</Text>
            </View>
          </>
        ) : (
          <>
            <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="contain" />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {uploading ? (
              <View style={styles.uploadingBox}>
                <ActivityIndicator color="#16a34a" size="small" />
                <View>
                  <Text style={styles.uploadingTitle}>AI is reading your bill...</Text>
                  <Text style={styles.uploadingSubtitle}>This takes about 10–20 seconds</Text>
                </View>
              </View>
            ) : (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.changeBtn} onPress={() => setImage(null)}>
                  <X color="#6b7280" size={18} />
                  <Text style={styles.changeBtnText}>Change</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.scanBtn} onPress={handleUpload}>
                  <CheckCircle color="#fff" size={18} />
                  <Text style={styles.scanBtnText}>Scan Bill</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 16 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: '#fef3c7',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  cameraBtn: {
    width: '100%', backgroundColor: '#16a34a', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16,
  },
  cameraBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  galleryBtn: {
    width: '100%', borderWidth: 2, borderColor: '#16a34a', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14,
  },
  galleryBtnText: { color: '#16a34a', fontSize: 16, fontWeight: '700' },
  tipsBox: {
    width: '100%', backgroundColor: '#eff6ff', borderRadius: 14, padding: 16, gap: 6,
  },
  tipsTitle: { fontSize: 14, fontWeight: '600', color: '#3b82f6', marginBottom: 4 },
  tipText: { fontSize: 13, color: '#3b82f6' },
  preview: {
    width: '100%', height: 260, borderRadius: 16, backgroundColor: '#f3f4f6',
  },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, width: '100%' },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  uploadingBox: {
    flexDirection: 'row', gap: 12, alignItems: 'center',
    backgroundColor: '#f0fdf4', borderRadius: 14, padding: 16, width: '100%',
  },
  uploadingTitle: { fontSize: 14, fontWeight: '600', color: '#16a34a' },
  uploadingSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10, width: '100%' },
  changeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, padding: 14,
  },
  changeBtnText: { color: '#374151', fontWeight: '600', fontSize: 15 },
  scanBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#16a34a', borderRadius: 14, padding: 14,
  },
  scanBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
