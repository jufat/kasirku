import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Smartphone,
  Monitor,
  Cloud,
  CheckCircle,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
  Upload,
  Download,
  Radio,
  X,
  Link2,
  ShieldCheck,
  Sparkles,
  Wifi,
  QrCode,
  ArrowRightLeft,
  CheckCheck,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { usePOS } from '../../context/POSContext';

export const DataSyncModal: React.FC = () => {
  const {
    isSyncModalOpen,
    setIsSyncModalOpen,
    syncCode,
    isSyncing,
    lastSyncTime,
    syncStatus,
    syncMessage,
    isAutoSyncEnabled,
    generateNewSyncCode,
    pushDataToCloud,
    pullDataFromCloud,
    disconnectSync,
    toggleAutoSync,
    products,
    transactions,
    drawerCashBalance,
    storeProfile,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'share' | 'connect'>('share');
  const [inputCode, setInputCode] = useState(syncCode || '');
  const [copied, setCopied] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [previewInfo, setPreviewInfo] = useState<any>(null);
  const [isCheckingPreview, setIsCheckingPreview] = useState(false);

  // Detect whether current device is likely mobile (HP) or desktop (PC)
  const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Switch to connect tab if opening on mobile without sync code or prefilled from URL
  useEffect(() => {
    if (isSyncModalOpen) {
      if (syncCode) {
        setInputCode(syncCode);
      }
      if (isMobileDevice && !syncCode) {
        setActiveTab('connect');
      }
      setLocalFeedback(null);
    }
  }, [isSyncModalOpen, syncCode, isMobileDevice]);

  if (!isSyncModalOpen) return null;

  const handleCopyCode = (codeToCopy: string) => {
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleGenerateCode = async () => {
    setLocalFeedback(null);
    const res = await generateNewSyncCode();
    if (res.success && res.code) {
      setInputCode(res.code);
      setLocalFeedback({ type: 'success', message: `Kode baru ${res.code} berhasil dibuat dan data telah diunggah!` });
    } else {
      setLocalFeedback({ type: 'error', message: res.message || 'Gagal membuat kode sinkronisasi.' });
    }
  };

  const handlePushCurrentData = async () => {
    setLocalFeedback(null);
    const res = await pushDataToCloud();
    if (res.success) {
      setLocalFeedback({ type: 'success', message: 'Data toko berhasil diunggah dan siap ditarik oleh perangkat lain!' });
    } else {
      setLocalFeedback({ type: 'error', message: res.message || 'Gagal mengunggah data.' });
    }
  };

  const handleCheckCodeStatus = async () => {
    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode) {
      setLocalFeedback({ type: 'error', message: 'Silakan masukkan kode sinkronisasi terlebih dahulu.' });
      return;
    }

    setIsCheckingPreview(true);
    setLocalFeedback(null);
    try {
      const res = await fetch(`/api/sync/status/${encodeURIComponent(cleanCode)}`);
      const result = await res.json();
      if (result.success && result.exists) {
        setPreviewInfo(result);
        setLocalFeedback({
          type: 'success',
          message: `Kode valid! Ditemukan data dari ${result.deviceName} (${result.dataSummary?.storeName}) diperbarui pada ${result.lastUpdated}`,
        });
      } else {
        setPreviewInfo(null);
        setLocalFeedback({ type: 'error', message: result.message || 'Kode tidak ditemukan atau belum aktif.' });
      }
    } catch {
      setLocalFeedback({ type: 'error', message: 'Gagal menghubungi server cloud.' });
    } finally {
      setIsCheckingPreview(false);
    }
  };

  const handlePullAndApply = async () => {
    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode) {
      setLocalFeedback({ type: 'error', message: 'Silakan masukkan kode sinkronisasi terlebih dahulu.' });
      return;
    }

    setLocalFeedback(null);
    const res = await pullDataFromCloud(cleanCode);
    if (res.success) {
      setLocalFeedback({ type: 'success', message: res.message });
      setPreviewInfo(null);
    } else {
      setLocalFeedback({ type: 'error', message: res.message });
    }
  };

  // QR Code URL that automatically opens this app with ?sync=CODE
  const currentSyncCode = syncCode || inputCode;
  const syncUrl = currentSyncCode
    ? `${window.location.origin}/?sync=${encodeURIComponent(currentSyncCode)}`
    : window.location.origin;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight flex items-center gap-2">
                <span>Sinkronisasi Data PC & HP</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold uppercase">
                  Cloud Sync
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Hubungkan komputer kasir dan smartphone menggunakan kode sinkron
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Detection Bar */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs mb-3">
          <div className="flex items-center gap-2">
            {isMobileDevice ? (
              <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Monitor className="w-4 h-4 text-teal-600 shrink-0" />
            )}
            <span className="font-semibold text-slate-700">
              Perangkat Ini: <strong className="text-slate-900">{isMobileDevice ? 'Smartphone (HP)' : 'Komputer (PC / Laptop)'}</strong>
            </span>
          </div>

          {syncCode ? (
            <div className="flex items-center gap-1.5 text-emerald-800 font-mono font-bold bg-emerald-100/90 px-2 py-0.5 rounded-md text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Kode: {syncCode}</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">Belum Terhubung</span>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1 mb-4 shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'share'
                ? 'bg-white text-teal-900 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-teal-600" />
            <span>Bagikan dari PC (Host)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('connect')}
            className={`py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'connect'
                ? 'bg-white text-teal-900 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hubungkan di HP (Klien)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
          {/* TAB 1: SHARE FROM PC / HOST */}
          {activeTab === 'share' && (
            <div className="space-y-4 text-xs">
              {/* Sync Code Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 via-emerald-50 to-slate-50 border border-teal-200/90 text-center space-y-2.5">
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-teal-800 block">
                  Kode Sinkronisasi Perangkat Anda
                </span>

                {syncCode ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-teal-950 bg-white px-4 py-2 rounded-xl border-2 border-teal-400 shadow-inner select-all">
                      {syncCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(syncCode)}
                      className="p-2.5 bg-white hover:bg-teal-50 border border-teal-300 rounded-xl text-teal-800 transition cursor-pointer shadow-xs active:scale-95"
                      title="Salin Kode ke Clipboard"
                    >
                      {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                ) : (
                  <div className="py-2">
                    <p className="text-slate-600 mb-2">
                      Klik tombol di bawah untuk membuat kode sinkronisasi pertama kali.
                    </p>
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      disabled={isSyncing}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-extrabold rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{isSyncing ? 'Membuat Kode...' : 'Buat Kode Sinkron Sekarang'}</span>
                    </button>
                  </div>
                )}

                {syncCode && (
                  <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-teal-700">
                    <span>Terakhir diunggah: <strong>{lastSyncTime || 'Baru saja'}</strong></span>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="text-teal-800 hover:underline font-bold cursor-pointer"
                    >
                      Ganti Kode Baru
                    </button>
                  </div>
                )}
              </div>

              {/* QR Code Section for Camera Scan */}
              {syncCode && (
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-4">
                  <div className="p-2 bg-white rounded-xl border border-slate-300 shadow-xs shrink-0">
                    <QRCodeSVG value={syncUrl} size={120} level="M" />
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left">
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start font-bold text-slate-900 text-xs">
                      <QrCode className="w-4 h-4 text-teal-600" />
                      <span>Pindai dengan Kamera HP</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Arahkan kamera smartphone ke QR Code ini untuk otomatis membuka aplikasi dan langsung terhubung dengan kode <strong className="font-mono text-slate-800">{syncCode}</strong> tanpa perlu mengetik manual.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(syncUrl)}
                      className="text-[11px] text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer mx-auto sm:mx-0"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>{copied ? 'Tautan Tersalin!' : 'Salin Tautan Sinkronisasi'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Data Summary to be pushed */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-700 text-[11px] block">
                  Data yang Tersimpan di Perangkat Ini:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <div className="font-mono font-bold text-slate-900">{products.length}</div>
                    <div className="text-[10px] text-slate-500">Produk Stok</div>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <div className="font-mono font-bold text-slate-900">{transactions.length}</div>
                    <div className="text-[10px] text-slate-500">Transaksi POS</div>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <div className="font-mono font-bold text-emerald-700 truncate">
                      Rp {drawerCashBalance.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-slate-500">Kas di Laci</div>
                  </div>
                </div>
              </div>

              {/* Push Actions & Auto Sync Switch */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handlePushCurrentData}
                  disabled={isSyncing || !syncCode}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  <Upload className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                  <span>{isSyncing ? 'Mengunggah Data...' : 'Unggah & Perbarui Data Sekarang'}</span>
                </button>

                <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      Sinkronisasi Otomatis (Setiap 30 Detik)
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Memastikan data transaksi penjualan selalu sama di PC dan HP
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAutoSync(!isAutoSyncEnabled)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                      isAutoSyncEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 bg-white rounded-full shadow-xs" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONNECT FROM PHONE / CLIENT */}
          {activeTab === 'connect' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-slate-50 to-white border border-indigo-200/80 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Masukkan Kode Sinkronisasi dari PC:
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Ketik kode 6 digit yang tertera di layar komputer Anda (contoh: <strong className="font-mono text-indigo-700">JF-8468</strong>)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: JF-8468"
                    className="flex-1 px-4 py-2.5 text-center text-xl font-black font-mono tracking-widest bg-white border-2 border-indigo-300 rounded-xl uppercase text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={handleCheckCodeStatus}
                    disabled={isCheckingPreview || !inputCode.trim()}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-300 transition cursor-pointer disabled:opacity-50"
                  >
                    {isCheckingPreview ? 'Cek...' : 'Periksa'}
                  </button>
                </div>
              </div>

              {/* Preview Info if Checked */}
              {previewInfo && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Data Siap Diunduh dari {previewInfo.deviceName}:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-emerald-100">
                    <div>
                      Nama Toko: <strong className="text-slate-900">{previewInfo.dataSummary?.storeName}</strong>
                    </div>
                    <div>
                      Total Produk: <strong className="text-slate-900 font-mono">{previewInfo.dataSummary?.productCount}</strong> item
                    </div>
                    <div>
                      Total Transaksi: <strong className="text-slate-900 font-mono">{previewInfo.dataSummary?.transactionCount}</strong>
                    </div>
                    <div>
                      Versi: <strong className="font-mono text-emerald-800">v{previewInfo.version}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Apply / Pull Action Button */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handlePullAndApply}
                  disabled={isSyncing || !inputCode.trim()}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  <Download className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                  <span>{isSyncing ? 'Menarik & Menerapkan Data...' : 'Tarik & Sinkronkan Data ke HP Ini'}</span>
                </button>

                {syncCode && (
                  <button
                    type="button"
                    onClick={disconnectSync}
                    className="w-full py-2 text-center text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                  >
                    Putuskan Sambungan Kode ({syncCode})
                  </button>
                )}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2 text-[11px] text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Data lokal di HP ini akan disesuaikan dengan data lengkap dari PC (katalog produk, stok barang, riwayat transaksi, dan kas laci).
                </span>
              </div>
            </div>
          )}

          {/* Feedback Banner */}
          {localFeedback && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-medium animate-fadeIn ${
                localFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {localFeedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{localFeedback.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            <span>Server Ju-Fat Sync Online</span>
          </div>
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(false)}
            className="px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
