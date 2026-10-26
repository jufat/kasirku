import React, { useState, useRef } from 'react';
import {
  Settings,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Power,
  Store,
  UserCheck,
  CheckCircle,
  Database,
  Printer,
  Key,
  Image as ImageIcon,
  Trash2,
  AlertTriangle,
  FileCheck,
  Sparkles,
  ArrowRight,
  HardDrive,
  Smartphone,
  Cloud,
  QrCode,
  Wifi,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';

const PRESET_LOGOS = [
  {
    name: 'Brother Ju-Fat Official (jF)',
    data: '/assets/aistudio/logo_f5879a0f.png',
  },
  {
    name: 'Ju-Fat Emerald Emblem',
    data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%230d9488"/><circle cx="50" cy="50" r="40" stroke="%23facc15" stroke-width="4" stroke-dasharray="6 4" fill="none"/><text x="50" y="58" font-family="system-ui, sans-serif" font-weight="900" font-size="30" fill="%23ffffff" text-anchor="middle">JF</text><text x="50" y="74" font-family="system-ui, sans-serif" font-weight="700" font-size="9" fill="%23fef08a" text-anchor="middle" letter-spacing="2">CELL</text></svg>',
  },
  {
    name: 'Tech Mobile & Repair',
    data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%230f172a"/><path d="M35 22 h30 a6 6 0 0 1 6 6 v44 a6 6 0 0 1 -6 6 h-30 a6 6 0 0 1 -6 -6 v-44 a6 6 0 0 1 6 -6 z" fill="none" stroke="%2338bdf8" stroke-width="4"/><circle cx="50" cy="71" r="3" fill="%2338bdf8"/><path d="M43 27 h14" stroke="%2338bdf8" stroke-width="2.5" stroke-linecap="round"/><circle cx="50" cy="46" r="12" fill="%230284c7" opacity="0.4"/><text x="50" y="50" font-family="system-ui, sans-serif" font-weight="bold" font-size="14" fill="%23ffffff" text-anchor="middle">POS</text></svg>',
  },
  {
    name: 'Gold Financial Agency',
    data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%231e293b"/><circle cx="50" cy="50" r="38" fill="none" stroke="%23f59e0b" stroke-width="4"/><text x="50" y="52" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="%23fbbf24" text-anchor="middle">JU-FAT</text><text x="50" y="68" font-family="system-ui, sans-serif" font-weight="bold" font-size="10" fill="%23fef3c7" text-anchor="middle" letter-spacing="1">AGENCY</text></svg>',
  },
];

export const PengaturanShiftView: React.FC = () => {
  const {
    shift,
    toggleRole,
    drawerCashBalance,
    setIsShiftModalOpen,
    storeProfile,
    updateStoreProfile,
    exitDemoMode,
    enterDemoMode,
    lastSavedTime,
    exportBackupJSON,
    importBackupJSON,
    resetAllDemoData,
    syncCode,
    setIsSyncModalOpen,
    isSyncing,
    lastSyncTime,
    syncStatus,
    isAutoSyncEnabled,
    toggleAutoSync,
    pushDataToCloud,
    pullDataFromCloud,
    disconnectSync,
  } = usePOS();

  // Store profile form states
  const [storeName, setStoreName] = useState(storeProfile.name || 'Ju-Fat Cell');
  const [storeSubtitle, setStoreSubtitle] = useState(storeProfile.subtitle || 'Modern POS & Agency Perbankan');
  const [storeAddress, setStoreAddress] = useState(storeProfile.address || 'Jl. Raya Sukamaju No. 128 (Depan Pasar Induk)');
  const [storePhone, setStorePhone] = useState(storeProfile.phone || '0812-3456-7890 / 0858-1122-3344');
  const [receiptFooter, setReceiptFooter] = useState(
    storeProfile.receiptFooter ||
      'Terima kasih atas kunjungan Anda! Barang bergaransi wajib menyertakan nota ini.'
  );
  const [storeLogo, setStoreLogo] = useState(storeProfile.logo || '');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Demo exit modal states
  const [isExitDemoModalOpen, setIsExitDemoModalOpen] = useState(false);
  const [exitOption, setExitOption] = useState<'keep_products' | 'clear_all'>('keep_products');

  // Backup & Import states
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  // Logo file upload handler
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file logo maksimal 2MB!');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setStoreLogo(base64);
      updateStoreProfile({ logo: base64 });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyLogoUrl = () => {
    if (!logoUrlInput.trim()) return;
    setStoreLogo(logoUrlInput.trim());
    updateStoreProfile({ logo: logoUrlInput.trim() });
    setLogoUrlInput('');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleRemoveLogo = () => {
    setStoreLogo('');
    updateStoreProfile({ logo: '' });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSaveStoreProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreProfile({
      name: storeName.trim(),
      subtitle: storeSubtitle.trim(),
      address: storeAddress.trim(),
      phone: storePhone.trim(),
      receiptFooter: receiptFooter.trim(),
      logo: storeLogo,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Exit demo execution
  const handleConfirmExitDemo = () => {
    exitDemoMode(exitOption);
    setIsExitDemoModalOpen(false);
    alert(
      exitOption === 'keep_products'
        ? 'Selamat! Anda sekarang berada di Mode Toko Nyata. Transaksi demo telah dibersihkan dan katalog produk Anda siap digunakan!'
        : 'Selamat! Anda sekarang berada di Mode Toko Nyata dengan database bersih total. Silakan input produk toko Anda sendiri!'
    );
  };

  // Import JSON from file directly
  const handleBackupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importBackupJSON(content);
        if (ok) {
          setImportStatus('Database berhasil dipulihkan dari file backup!');
        } else {
          setImportStatus('Format file JSON tidak valid!');
        }
        setTimeout(() => setImportStatus(''), 4000);
      }
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;
    const ok = importBackupJSON(importText);
    if (ok) {
      setImportStatus('Database berhasil dipulihkan!');
      setImportText('');
    } else {
      setImportStatus('Format JSON tidak valid!');
    }
    setTimeout(() => setImportStatus(''), 4000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 bg-[#f8f9fa] space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              Sistem, Database, Logo & Mode Toko
            </h3>
            <p className="text-xs text-slate-500">
              Kelola logo toko, keluar dari mode demo, profil struk, dan cadangan database agar data aman.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsShiftModalOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Power className="w-4 h-4" />
            <span>Tutup Shift Kasir</span>
          </button>
        </div>
      </div>

      {/* Banner 1: Mode Status & Keluar dari Mode Demo */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          storeProfile.isDemoMode
            ? 'bg-gradient-to-r from-amber-50 to-orange-50/60 border-amber-300'
            : 'bg-gradient-to-r from-emerald-50 to-teal-50/60 border-emerald-300'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  storeProfile.isDemoMode
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {storeProfile.isDemoMode ? 'MODE DEMO AKTIF' : 'MODE TOKO NYATA (PRODUKSI)'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Penyimpanan Lokal: Aman ({lastSavedTime})
              </span>
            </div>

            <h4 className="text-sm font-bold text-slate-900">
              {storeProfile.isDemoMode
                ? 'Anda sedang berada di Mode Demo (Data Contoh Bawaan)'
                : 'Toko Anda beroperasi dalam Mode Nyata (Data Bersih)'}
            </h4>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              {storeProfile.isDemoMode
                ? 'Semua transaksi kasir, servis, mutasi kas, dan data pelanggan saat ini adalah data simulasi. Klik "Keluar Mode Demo" untuk membersihkan riwayat contoh dan mulai mencatat data asli toko Anda.'
                : 'Semua transaksi kasir, stok, servis, dan kas laci saat ini adalah data riil toko Anda. Data disimpan otomatis di browser dan aman dari kehilangan.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {storeProfile.isDemoMode ? (
              <button
                onClick={() => setIsExitDemoModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Keluar dari Mode Demo & Mulai Toko Nyata</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (
                    confirm(
                      'Apakah Anda ingin kembali ke Mode Demo? Data contoh akan dimuat kembali untuk simulasi.'
                    )
                  ) {
                    enterDemoMode();
                  }
                }}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Muat Ulang Mode Demo
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Logo & Identitas Toko (User Request: Bagian profil buatkan untuk memasukkan logo) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Logo & Identitas Toko Ju-Fat
                </h4>
                <p className="text-[11px] text-slate-500">
                  Logo akan ditampilkan di Sidebar, Header, dan dicetak di Struk Kasir
                </p>
              </div>
            </div>
            {isSaved && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-fade-in flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Tersimpan!
              </span>
            )}
          </div>

          {/* Logo Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              Logo Toko / Konter (Muncul di Struk & Navigasi):
            </label>

            <div className="flex items-center gap-4">
              {/* Logo Preview */}
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-emerald-300 bg-white p-1 flex items-center justify-center shrink-0 shadow-xs relative group overflow-hidden">
                {storeLogo ? (
                  <img
                    src={storeLogo}
                    alt="Logo Toko"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 text-center">
                    <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                    <span className="text-[9px] font-semibold">Belum Ada Logo</span>
                  </div>
                )}
              </div>

              {/* Logo Actions */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah Gambar Logo</span>
                  </button>

                  {storeLogo && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Logo</span>
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-slate-500">
                  Format gambar yang didukung: PNG, JPG, WebP, SVG. Maksimal 2MB.
                </p>
              </div>
            </div>

            {/* Logo Presets & URL Input */}
            <div className="pt-2 border-t border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600">
                  Atau pilih logo preset instan:
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_LOGOS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setStoreLogo(preset.data);
                      updateStoreProfile({ logo: preset.data });
                      setIsSaved(true);
                      setTimeout(() => setIsSaved(false), 3000);
                    }}
                    className="p-1.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg flex items-center gap-2 text-left transition cursor-pointer"
                  >
                    <img src={preset.data} alt={preset.name} className="w-6 h-6 object-contain shrink-0" />
                    <span className="text-[10px] font-bold text-slate-700 truncate">{preset.name}</span>
                  </button>
                ))}
              </div>

              {/* URL Alternate */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={logoUrlInput}
                  onChange={(e) => setLogoUrlInput(e.target.value)}
                  placeholder="Atau tempel URL gambar logo (https://...)"
                  className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleApplyLogoUrl}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>

          {/* Form Profil Identitas Toko */}
          <form onSubmit={handleSaveStoreProfile} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Toko / Konter</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Slogan / Subtitle Struk</label>
                <input
                  type="text"
                  value={storeSubtitle}
                  onChange={(e) => setStoreSubtitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Alamat Lengkap Toko</label>
              <input
                type="text"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">No. WhatsApp / Telepon Toko</label>
              <input
                type="text"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Pesan Footer Struk Pembelian</label>
              <textarea
                rows={2}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Simpan Profil & Logo Toko</span>
            </button>
          </form>
        </div>

        {/* Card 2: Keamanan Data & Cadangan Database (Agar data baru tidak mudah hilang) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <HardDrive className="w-5 h-5 text-emerald-600" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Penyimpanan Data & Cadangan (Backup / Restore)
              </h4>
              <p className="text-[11px] text-slate-500">
                Data Anda tersimpan aman secara otomatis di browser komputer / handphone ini
              </p>
            </div>
          </div>

          {/* Storage Assurance Banner */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Penyimpanan Otomatis Aktif (Auto-Save Local Storage)</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Setiap kali Anda menambah produk, scan barcode kasir, mencatat transaksi agen/EDC, atau menginput servis HP, sistem langsung menyimpannya secara permanen ke memori lokal browser Anda.
            </p>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-800 font-bold bg-white/80 px-2 py-1 rounded border border-emerald-200/80 w-fit">
              <span>Status:</span>
              <span>Tersimpan Terakhir {lastSavedTime}</span>
            </div>
          </div>

          {/* Backup Action */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-800">Unduh Salinan Cadangan (File JSON)</h5>
                <p className="text-[11px] text-slate-500">
                  Simpan file cadangan ke flashdisk/drive agar bisa dibuka di HP atau komputer lain kapan saja.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={exportBackupJSON}
              className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl flex items-center gap-2 transition cursor-pointer shadow-sm shadow-teal-900/20 active:scale-95"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Unduh File Backup Database (.JSON)</span>
            </button>
          </div>

          {/* Restore / Import */}
          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
            <h5 className="font-bold text-slate-800">Pulihkan Database dari File Cadangan</h5>
            <p className="text-[11px] text-slate-500">
              Pilih file backup JSON dari komputer atau tempel teks JSON untuk memulihkan seluruh data toko Anda.
            </p>

            <div className="flex items-center gap-2">
              <input
                ref={backupFileInputRef}
                type="file"
                accept=".json"
                onChange={handleBackupFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => backupFileInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Pilih File Backup (.JSON)</span>
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-2 pt-1">
              <textarea
                rows={2}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Atau tempelkan isi teks JSON backup di sini..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none"
              />
              {importStatus && (
                <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                  {importStatus}
                </p>
              )}
              {importText && (
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                >
                  Pulihkan dari Teks JSON
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Card: Sinkronisasi Multi-Perangkat (PC & HP) */}
        <div className="bg-white rounded-2xl border border-teal-200/90 p-5 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    Sinkronisasi Multi-Perangkat (PC & Smartphone HP)
                  </h4>
                  <span
                    className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
                      syncCode
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-300'
                    }`}
                  >
                    {syncCode ? `KODE AKTIF: ${syncCode}` : 'BELUM TERHUBUNG'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Sinkronkan katalog produk, penjualan kasir, stok, tiket servis, dan mutasi kas antara PC dan HP secara instan menggunakan kode unik 6 karakter.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSyncModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition cursor-pointer active:scale-95"
            >
              <QrCode className="w-4 h-4 text-amber-300" />
              <span>Buka Menu Sinkron & Scan QR</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="text-slate-500 font-semibold block">Status Sinkronisasi</span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    syncCode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span className="font-bold text-slate-900 text-sm">
                  {syncCode ? 'Tersambung ke Cloud Relay' : 'Perangkat Mandiri (Lokal)'}
                </span>
              </div>
              {lastSyncTime && (
                <p className="text-[11px] text-slate-500 font-mono">
                  Sinkron terakhir: {lastSyncTime}
                </p>
              )}
              {syncCode && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={disconnectSync}
                    className="text-[11px] text-red-600 hover:text-red-700 underline font-semibold cursor-pointer"
                  >
                    Putuskan Kode Ini
                  </button>
                </div>
              )}
            </div>

            {/* Auto sync switch */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="text-slate-500 font-semibold block">Auto-Sync Otomatis (30 Detik)</span>
              <p className="text-[11px] text-slate-600">
                Kirim pembaruan kasir & transaksi ke cloud secara otomatis setiap 30 detik saat kode aktif.
              </p>
              <div className="pt-1 flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAutoSyncEnabled}
                    onChange={(e) => toggleAutoSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
                <span className="text-xs font-bold text-slate-800">
                  {isAutoSyncEnabled ? 'Auto-Sync Aktif' : 'Nonaktif (Manual)'}
                </span>
              </div>
            </div>

            {/* Quick push action */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs flex flex-col justify-between">
              <div>
                <span className="text-slate-500 font-semibold block">Aksi Cepat</span>
                <p className="text-[11px] text-slate-600">
                  {syncCode
                    ? `Perbarui data di server dengan kode ${syncCode} sekarang.`
                    : 'Buat kode baru untuk menghubungkan HP ke PC.'}
                </p>
              </div>
              <div className="pt-2">
                {syncCode ? (
                  <button
                    type="button"
                    onClick={() => pushDataToCloud()}
                    disabled={isSyncing}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Mengunggah...' : 'Unggah Data Sekarang'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSyncModalOpen(true)}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Cloud className="w-3.5 h-3.5 text-amber-300" />
                    <span>Buat Kode Sinkronisasi</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Shift Status & Access Control */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900">
                Shift Kasir & Hak Akses Pengguna
              </h4>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                shift.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {shift.isOpen ? 'SHIFT AKTIF' : 'SHIFT DITUTUP'}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Nama Shift:</span>
              <span className="font-bold text-slate-900">{shift.shiftName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Petugas / Kasir:</span>
              <span className="font-semibold text-slate-800">{shift.cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email Akun:</span>
              <span className="font-mono text-slate-700">{shift.cashierEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Waktu Mulai:</span>
              <span className="font-mono text-slate-700">{shift.startTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Modal Kas Awal Laci:</span>
              <span className="font-mono font-bold text-slate-900">
                Rp {shift.startingCash.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold">
              <span className="text-slate-800">Saldo Kas Laci Sistem:</span>
              <span className="text-sm text-emerald-900 font-mono">
                Rp {drawerCashBalance.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Mode Akses Saat Ini:</span>
              <span className="text-xs text-slate-500">
                {shift.role === 'owner' ? 'Akses Penuh Pemilik (Owner)' : 'Akses Terbatas Kasir Toko'}
              </span>
            </div>

            <button
              onClick={toggleRole}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Ganti ke {shift.role === 'owner' ? 'Kasir' : 'Owner'}
            </button>
          </div>
        </div>

        {/* Card 4: Reset Demo Data */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <RefreshCw className="w-4 h-4 text-red-600" />
            <h4 className="text-sm font-bold text-slate-900">Reset Data Bawaan (Demo)</h4>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Jika Anda ingin menguji coba aplikasi kembali dengan data contoh awal Ju-Fat Cell, Anda dapat mereset data di sini. Pastikan unduh backup terlebih dahulu jika memiliki data penting.
          </p>

          <button
            onClick={() => {
              if (
                confirm(
                  'PERINGATAN: Seluruh transaksi lokal dan produk kustom akan direset ke data contoh bawaan. Lanjutkan?'
                )
              ) {
                resetAllDemoData();
                alert('Aplikasi berhasil direset ke data contoh awal!');
              }
            }}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Reset ke Data Demo Awal
          </button>
        </div>
      </div>

      {/* Modal: Keluar dari Mode Demo & Mulai Toko Nyata */}
      {isExitDemoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                  Keluar dari Mode Demo
                </h3>
                <p className="text-xs text-slate-500">
                  Mulai gunakan aplikasi untuk data toko nyata Ju-Fat Cell
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Pilih bagaimana Anda ingin memulai database toko nyata Anda:
            </p>

            <div className="space-y-3">
              {/* Option 1 */}
              <label
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                  exitOption === 'keep_products'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="exit_option"
                  checked={exitOption === 'keep_products'}
                  onChange={() => setExitOption('keep_products')}
                  className="mt-1 text-emerald-600"
                />
                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      Mulai Toko Nyata (Simpan Katalog Produk & Kategori)
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white uppercase">
                      Direkomendasikan
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1 leading-snug">
                    Menghapus seluruh riwayat transaksi kasir, servis, hutang, dan mutasi demo bawaan agar laci kas mulai bersih dari 0. Katalog produk bawaan tetap disimpan agar Anda tidak perlu mengetik ulang produk.
                  </p>
                </div>
              </label>

              {/* Option 2 */}
              <label
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                  exitOption === 'clear_all'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="exit_option"
                  checked={exitOption === 'clear_all'}
                  onChange={() => setExitOption('clear_all')}
                  className="mt-1 text-emerald-600"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900">
                    Mulai Bersih Total (Hapus Semua Termasuk Produk)
                  </span>
                  <p className="text-slate-500 mt-1 leading-snug">
                    Membersihkan seluruh transaksi dan katalog produk bawaan. Anda dapat menambahkan produk toko Anda sendiri satu per satu atau import massal via file Excel.
                  </p>
                </div>
              </label>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Ingin menyimpan salinan data contoh terlebih dahulu?</span>
              </div>
              <button
                type="button"
                onClick={exportBackupJSON}
                className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950 shrink-0 cursor-pointer"
              >
                Unduh Cadangan
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsExitDemoModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmExitDemo}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Aktifkan Mode Toko Nyata Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
