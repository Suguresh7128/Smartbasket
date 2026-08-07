'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Camera, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { billsAPI } from '@/services/api';
import Link from 'next/link';

export default function UploadBillPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [billId, setBillId] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, or WebP)');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum 5MB allowed.');
      return;
    }
    setFile(f);
    setError('');
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('bill', file);
      const { data } = await billsAPI.upload(fd);
      setBillId(data.data.billId);
      // Poll for completion
      pollBillStatus(data.data.billId);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const pollBillStatus = async (id: string) => {
    const max = 20;
    let attempts = 0;
    const poll = async () => {
      try {
        const { data } = await billsAPI.get(id);
        if (data.data.status === 'done') {
          router.push(`/dashboard/bills/${id}`);
        } else if (data.data.status === 'failed') {
          setError('OCR processing failed. You can enter items manually.');
          setUploading(false);
          router.push(`/dashboard/bills/${id}`);
        } else if (attempts < max) {
          attempts++;
          setTimeout(poll, 2000);
        } else {
          setUploading(false);
          router.push(`/dashboard/bills/${id}`);
        }
      } catch {
        setUploading(false);
      }
    };
    poll();
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="font-semibold text-gray-900">Scan Bill</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Camera className="w-6 h-6 text-orange-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Upload Grocery Bill</h1>
          <p className="text-gray-500 text-sm mt-1">
            AI extracts all items and prices automatically
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {!preview ? (
          <div
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer ${
              drag ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white hover:border-green-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
              id="bill-input"
            />
            <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-1">Drop bill image here</p>
            <p className="text-gray-400 text-sm mb-4">or</p>
            <label
              htmlFor="bill-input"
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:bg-orange-600 transition-colors"
            >
              <Camera className="w-4 h-4" /> Take Photo / Choose File
            </label>
            <p className="text-xs text-gray-400 mt-3">JPEG, PNG, WebP · Max 5MB</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Bill preview" className="w-full max-h-80 object-contain bg-gray-50" />
              {!uploading && (
                <button
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow hover:bg-gray-100 transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>
            <div className="p-4">
              {uploading ? (
                <div className="text-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">AI is reading your bill...</p>
                  <p className="text-xs text-gray-400 mt-1">This takes 10–20 seconds</p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Change
                  </button>
                  <button
                    onClick={handleUpload}
                    className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Scan Bill
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
          <p className="font-medium mb-1">📸 Tips for best results</p>
          <ul className="space-y-1 text-blue-600 text-xs">
            <li>• Keep the bill flat and well-lit</li>
            <li>• Make sure all items are visible</li>
            <li>• Avoid shadows or reflections</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
