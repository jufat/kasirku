import React, { useState, useEffect } from 'react';
import {
  Wallet,
  PlusCircle,
  Clock,
  UserCheck,
  ShieldAlert,
  ArrowRightLeft,
  Bell,
  Search,
  Menu,
  Cloud,
  RefreshCw,
  Smartphone,
  PanelBottomClose,
  PanelBottomOpen,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

export const TopHeader: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    drawerCashBalance,
    setIsCashMutationModalOpen,
    shift,
    toggleRole,
    products,
    storeProfile,
    lastSavedTime,
    setIsMobileSidebarOpen,
    syncCode,
    setIsSyncModalOpen,
    isSyncing,
    syncStatus,
    isBottomNavVisible,
    toggleBottomNav,
  } = usePOS();

  // Real-time Indonesian clock
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const time = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setTimeStr(`${formatted} · ${time} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'kasir':
        return { title: 'Kasir & Transaksi POS', sub: 'Input Barcode Scanner, Katalog & Keranjang Belanja' };
      case 'atm_mini':
        return { title: 'ATM Mini & EDC Konter', sub: 'Tarik Uang Tunai, Transfer Bank & Top Up E-Wallet via Mesin EDC' };
      case 'transfer':
        return { title: 'ATM Mini & EDC Konter', sub: 'Tarik Uang Tunai, Transfer Bank & Top Up E-Wallet via Mesin EDC' };
      case 'ppob':
        return { title: 'Pulsa, Data & Tagihan PPOB', sub: 'Isi Ulang Operator, Token PLN & Tagihan Bulanan' };
      case 'service':
        return { title: 'Service Handphone & Reparasi', sub: 'Manajemen Antrean, Pengerjaan & Pengambilan' };
      case 'percetakan':
        return { title: 'Percetakan & Copy', sub: 'Print Dokumen, Cetak Foto, Banner Spanduk & Jilid' };
      case 'dashboard':
        return { title: 'Dashboard & Analitik Bisnis', sub: 'Ringkasan Omset, Profit, Service & Stok Kritis' };
      case 'kas_harian':
        return { title: 'Kas Harian & Mutasi Kas', sub: 'Buku Arus Kas Masuk & Keluar Fisik di Laci' };
      case 'stok':
        return { title: 'Manajemen Stok & Kategori', sub: 'Katalog Produk, Import Excel, HPP & Laba Satuan' };
      case 'hutang_retur':
        return { title: 'Catatan Hutang & Retur', sub: 'Buku Piutang Pelanggan & Garansi Supplier' };
      case 'pengaturan':
        return { title: 'Sistem, Database & Profil Toko', sub: 'Upload Logo, Keluar Mode Demo & Cadangan JSON' };
      default:
        return { title: storeProfile.name || 'Ju-Fat Cell POS', sub: storeProfile.subtitle || 'Modern POS & Agency' };
    }
  };

  const breadcrumb = getBreadcrumbTitle();
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  return (
    <header className="h-14 md:h-16 bg-white/95 backdrop-blur-md border-b border-teal-100/90 px-2 sm:px-4 md:px-6 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-xs select-none">
      {/* Zone 1: Mobile Hamburger, Breadcrumb, Store Logo & Title */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 min-w-0 pr-1">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="md:hidden p-1.5 -ml-0.5 text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition cursor-pointer shrink-0"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {storeProfile.logo ? (
          <img
            src={storeProfile.logo}
            alt={storeProfile.name}
            className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-xl object-contain border border-teal-200/80 p-0.5 sm:p-1 bg-white shadow-xs shrink-0"
          />
        ) : null}

        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900 leading-tight flex items-center gap-1 sm:gap-1.5 md:gap-2">
            <span className="truncate max-w-[120px] xs:max-w-[170px] sm:max-w-none">{breadcrumb.title}</span>
            <span className="hidden sm:inline text-xs font-normal text-slate-300">/</span>
            <span className="hidden sm:inline text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200 truncate max-w-[160px]">
              {storeProfile.name || 'Ju-Fat Cell'}
            </span>
          </h2>
          <p className="hidden md:block text-xs text-slate-500 font-medium truncate">{breadcrumb.sub}</p>
        </div>
      </div>

      {/* Zone 2: Demo Mode Switcher, Storage Indicator & Clock */}
      <div className="hidden lg:flex items-center gap-3 text-xs">
        {/* Mode Status Pill */}
        {storeProfile.isDemoMode ? (
          <button
            onClick={() => setActiveTab('pengaturan')}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg text-amber-950 font-bold transition cursor-pointer shadow-xs"
            title="Klik untuk keluar dari mode demo dan mulai toko nyata Anda"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Mode Demo (Contoh)</span>
            <span className="bg-amber-400 text-amber-950 text-[10px] px-1.5 py-0.2 rounded font-extrabold ml-1">
              Keluar Demo
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-950 font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Toko Nyata (Live)</span>
          </div>
        )}

        {/* Auto-Save & Storage Safety Badge */}
        <div
          className="flex items-center gap-1.5 text-[11px] text-teal-900 bg-teal-50/80 px-2.5 py-1 rounded-lg border border-teal-200/80 font-mono font-medium shadow-xs"
          title="Semua data tersimpan otomatis di penyimpanan lokal browser Anda"
        >
          <span className="text-teal-600 font-extrabold">✓</span>
          <span>Tersimpan {lastSavedTime}</span>
        </div>

        {/* Clock */}
        <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-mono tabular-nums shadow-xs">
          <Clock className="w-3.5 h-3.5 text-teal-600" />
          <span className="font-medium">{timeStr || 'Memuat waktu...'}</span>
        </div>

        {lowStockCount > 0 && (
          <button
            onClick={() => setActiveTab('stok')}
            className="flex items-center gap-1.5 text-amber-900 bg-amber-100 hover:bg-amber-200/80 px-2.5 py-1 rounded-lg border border-amber-300 text-xs font-bold transition cursor-pointer shadow-xs"
            title={`${lowStockCount} produk stok menipis!`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{lowStockCount} Stok Menipis</span>
          </button>
        )}
      </div>

      {/* Zone 3: Actions & Drawer Cash balance */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Physical Cash Drawer Pill */}
        <button
          onClick={() => setActiveTab('kas_harian')}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 hover:from-teal-100 hover:to-emerald-100 border border-teal-200/90 rounded-xl text-teal-950 transition cursor-pointer shadow-xs active:scale-95"
          title="Klik untuk membuka buku arus kas"
        >
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
          <div className="text-left leading-tight">
            <span className="hidden sm:block text-[9px] text-teal-700 font-semibold">Kas Laci</span>
            <span className="text-[11px] sm:text-xs font-black text-teal-950 font-mono tabular-nums">
              Rp {drawerCashBalance >= 10000000
                ? `${(drawerCashBalance / 1000000).toFixed(1)}Jt`
                : drawerCashBalance.toLocaleString('id-ID')}
            </span>
          </div>
        </button>

        {/* Quick Cash Mutation Modal Trigger */}
        <button
          onClick={() => setIsCashMutationModalOpen(true)}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl transition shadow-sm shadow-teal-700/20 cursor-pointer active:scale-95"
          title="Catat pengeluaran operasional atau uang kas masuk"
        >
          <PlusCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="hidden sm:inline">Catat Kas</span>
        </button>

        {/* Sync PC & HP Modal Button */}
        <button
          onClick={() => setIsSyncModalOpen(true)}
          className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 ${
            syncCode
              ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900'
              : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-900'
          }`}
          title={
            syncCode
              ? `Tersinkron dengan Kode ${syncCode}. Klik untuk membuka menu sinkronisasi.`
              : 'Sinkronisasi Data PC dan Smartphone HP dengan Kode'
          }
        >
          <RefreshCw
            className={`w-3.5 h-3.5 shrink-0 ${
              isSyncing
                ? 'animate-spin text-teal-600'
                : syncCode
                ? 'text-emerald-600'
                : 'text-indigo-600'
            }`}
          />
          <span className="hidden sm:inline">
            {syncCode ? `Sync: ${syncCode}` : 'Sync'}
          </span>
          <span className="sm:hidden text-[10px] font-mono font-extrabold">
            {syncCode ? syncCode : 'Sync'}
          </span>
          {syncCode && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>

        {/* Mobile Toggle Hilang Timbul Menu Bawah */}
        <button
          type="button"
          onClick={toggleBottomNav}
          className="md:hidden flex items-center justify-center p-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer active:scale-95 shadow-xs"
          title={isBottomNavVisible ? 'Sembunyikan Menu Bawah (Layar Penuh)' : 'Tampilkan Menu Bawah'}
        >
          {isBottomNavVisible ? (
            <PanelBottomClose className="w-3.5 h-3.5 text-teal-700" />
          ) : (
            <PanelBottomOpen className="w-3.5 h-3.5 text-amber-600" />
          )}
        </button>
      </div>
    </header>
  );
};
