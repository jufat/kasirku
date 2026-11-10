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
  Sun,
  Moon,
  ShoppingCart,
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
    setIsShiftModalOpen,
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
    cartTotalCount,
    setIsMasterCartModalOpen,
  } = usePOS();

  // Real-time Indonesian digital clock (WIB)
  const [clockData, setClockData] = useState<{
    time: string;
    shortDate: string;
    fullDate: string;
  }>({ time: '', shortDate: '', fullDate: '' });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const fullDate = now.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const shortDate = now.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      const time = now
        .toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
        .replace(/\./g, ':');
      setClockData({
        time: `${time} WIB`,
        shortDate,
        fullDate,
      });
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
    <header className="bg-white/95 backdrop-blur-md border-b border-teal-100/90 shrink-0 sticky top-0 z-10 shadow-xs select-none">
      {/* Main Header Row */}
      <div className="h-12 sm:h-14 md:h-16 px-2 sm:px-4 md:px-6 flex items-center justify-between gap-2">
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
              className="hidden sm:block w-8 h-8 md:w-9 md:h-9 rounded-xl object-contain border border-teal-200/80 p-1 bg-white shadow-xs shrink-0"
            />
          ) : null}

          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900 leading-tight flex items-center gap-1 sm:gap-1.5 md:gap-2">
              <span className="sm:hidden text-teal-950 truncate max-w-[100px]">
                {storeProfile.name || 'Ju-Fat Cell'}
              </span>
              <span className="hidden sm:inline truncate">{breadcrumb.title}</span>
              <span className="hidden sm:inline text-xs font-normal text-slate-300">/</span>
              <span className="hidden sm:inline text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200 truncate max-w-[160px]">
                {storeProfile.name || 'Ju-Fat Cell'}
              </span>
            </h2>
            <p className="hidden md:block text-xs text-slate-500 font-medium truncate">{breadcrumb.sub}</p>
          </div>
        </div>

        {/* Zone 2: Demo Mode Switcher, Storage Indicator & Live Digital Clock (Desktop lg+) */}
        <div className="hidden lg:flex items-center gap-2.5 text-xs">
          {/* Mode Status Pill */}
          {storeProfile.isDemoMode ? (
            <button
              onClick={() => setActiveTab('pengaturan')}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg text-amber-950 font-bold transition cursor-pointer shadow-xs whitespace-nowrap"
              title="Klik untuk keluar dari mode demo dan mulai toko nyata Anda"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Mode Demo (Contoh)</span>
              <span className="bg-amber-400 text-amber-950 text-[10px] px-1.5 py-0.2 rounded font-extrabold ml-1">
                Keluar Demo
              </span>
            </button>
          ) : shift.isOpen ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-950 font-bold shadow-xs whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Toko Buka ({shift.shiftName})</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsShiftModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg text-rose-950 font-bold shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
              title="Register kasir sedang TUTUP (Toko Tutup). Klik untuk Mulai Shift Pagi."
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Register: TUTUP</span>
              <span className="bg-amber-400 text-amber-950 text-[10px] px-1.5 py-0.2 rounded font-extrabold ml-1">
                ☀️ Buka Kasir
              </span>
            </button>
          )}

          {/* Auto-Save & Storage Safety Badge */}
          <div
            className="hidden xl:flex items-center gap-1.5 text-[11px] text-teal-900 bg-teal-50/80 px-2.5 py-1 rounded-lg border border-teal-200/80 font-mono font-medium shadow-xs whitespace-nowrap"
            title="Semua data tersimpan otomatis di penyimpanan lokal browser Anda"
          >
            <span className="text-teal-600 font-extrabold">✓</span>
            <span>Tersimpan {lastSavedTime}</span>
          </div>

          {/* Live Clock */}
          <div className="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-mono tabular-nums shadow-xs whitespace-nowrap shrink-0">
            <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="font-bold text-slate-800">
              {clockData.fullDate ? `${clockData.fullDate} · ${clockData.time}` : 'Memuat waktu...'}
            </span>
          </div>

          {lowStockCount > 0 && (
            <button
              onClick={() => setActiveTab('stok')}
              className="flex items-center gap-1.5 text-amber-900 bg-amber-100 hover:bg-amber-200/80 px-2.5 py-1 rounded-lg border border-amber-300 text-xs font-bold transition cursor-pointer shadow-xs whitespace-nowrap"
              title={`${lowStockCount} produk stok menipis!`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{lowStockCount} Stok Menipis</span>
            </button>
          )}
        </div>

      {/* Zone 3: Actions & Drawer Cash balance */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Active Cashier Pill (Kasir 1 / Kasir 2 / Owner) */}
        <button
          onClick={toggleRole}
          className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95 ${
            shift.cashierSlot === 'owner'
              ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950'
              : shift.cashierSlot === 'kasir_1'
              ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-950'
              : 'bg-teal-50 hover:bg-teal-100 border-teal-300 text-teal-950'
          }`}
          title="Klik untuk ganti petugas aktif: Kasir 1 / Kasir 2 / Owner"
        >
          <span className="text-xs hidden sm:inline">
            {shift.cashierSlot === 'owner' ? '👑' : '👤'}
          </span>
          <div className="text-left leading-tight">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                {shift.cashierSlot === 'owner' ? 'Owner' : shift.cashierSlot === 'kasir_1' ? 'Shift 1' : 'Shift 2'}
              </span>
              <span className="hidden sm:inline text-[9px] text-teal-700 underline font-semibold">(Ganti)</span>
            </div>
            <span className="text-[11px] sm:text-xs font-black truncate max-w-[54px] sm:max-w-[130px] block text-slate-900">
              {shift.cashierName}
            </span>
          </div>
          {shift.isSwappedShift && (
            <span className="hidden sm:inline text-[8px] bg-amber-400 text-amber-950 px-1 py-0.2 rounded font-extrabold uppercase">
              Tukar
            </span>
          )}
        </button>

        {/* Physical Cash Drawer Pill */}
        <button
          onClick={() => setActiveTab('kas_harian')}
          className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2.5 py-1 sm:py-1.5 bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 hover:from-teal-100 hover:to-emerald-100 border border-teal-200/90 rounded-xl text-teal-950 transition cursor-pointer shadow-2xs active:scale-95"
          title="Klik untuk membuka buku arus kas harian & saldo laci"
        >
          <div className="hidden sm:flex w-6 h-6 rounded-lg bg-teal-600 text-white items-center justify-center shrink-0 shadow-xs">
            <Wallet className="w-3.5 h-3.5" />
          </div>
          <div className="text-left leading-tight">
            <span className="text-[9px] text-teal-700 font-bold uppercase tracking-wide block">Kas Laci</span>
            <span className="text-[11px] sm:text-xs font-black text-teal-950 font-mono tabular-nums">
              Rp {drawerCashBalance >= 10000000
                ? `${(drawerCashBalance / 1000000).toFixed(1)}Jt`
                : drawerCashBalance.toLocaleString('id-ID')}
            </span>
          </div>
        </button>

        {/* Master Cart (Keranjang Besar) Global Trigger */}
        <button
          type="button"
          onClick={() => setIsMasterCartModalOpen(true)}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap shrink-0 ${
            cartTotalCount > 0
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-700/20'
              : 'bg-slate-50 hover:bg-teal-50 text-slate-700 border-slate-200 hover:border-teal-300'
          }`}
          title="Buka Keranjang Besar (Gabung belanja Kasir, PPOB, Percetakan, Service & ATM Mini)"
        >
          <ShoppingCart
            className={`w-3.5 h-3.5 shrink-0 ${
              cartTotalCount > 0 ? 'text-amber-300' : 'text-teal-600'
            }`}
          />
          <span className="hidden sm:inline lg:hidden xl:inline">Keranjang</span>
          {cartTotalCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] px-1 text-[10px] font-black font-mono tabular-nums rounded-full bg-amber-400 text-slate-950">
              {cartTotalCount}
            </span>
          )}
        </button>

        {/* Quick Cash Mutation Modal Trigger */}
        <button
          onClick={() => setIsCashMutationModalOpen(true)}
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl transition shadow-sm shadow-teal-700/20 cursor-pointer active:scale-95"
          title="Catat pengeluaran operasional atau uang kas masuk"
        >
          <PlusCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="hidden sm:inline">Catat Kas</span>
        </button>

        {/* Sync PC & HP Modal Button */}
        <button
          onClick={() => setIsSyncModalOpen(true)}
          className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95 ${
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
            {syncCode ? `Sync: ${syncCode}` : 'Sync HP'}
          </span>
          {syncCode && (
            <span className="sm:hidden text-[10px] font-mono font-extrabold">
              {syncCode}
            </span>
          )}
        </button>

        {/* Mobile Toggle Hilang Timbul Menu Bawah */}
        <button
          type="button"
          onClick={toggleBottomNav}
          className="md:hidden flex items-center justify-center p-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer active:scale-95 shadow-2xs"
          title={isBottomNavVisible ? 'Sembunyikan Menu Bawah (Layar Penuh)' : 'Tampilkan Menu Bawah'}
        >
          {isBottomNavVisible ? (
            <PanelBottomClose className="w-4 h-4 text-teal-700" />
          ) : (
            <PanelBottomOpen className="w-4 h-4 text-amber-600" />
          )}
        </button>
      </div>
      </div>

      {/* Compact Mobile & Tablet Sub-Bar: Page Title / Shift Status + Live Digital Clock (< lg) */}
      <div className="lg:hidden px-2.5 sm:px-4 py-1 bg-teal-50/75 border-t border-teal-100/90 flex items-center justify-between gap-2 text-[11px]">
        {/* Left: Full page title on phone + Shift/Save status */}
        <div className="min-w-0 flex items-center gap-1.5 flex-1">
          {!shift.isOpen ? (
            <button
              type="button"
              onClick={() => setIsShiftModalOpen(true)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold transition cursor-pointer shrink-0 whitespace-nowrap"
              title="Kasir TUTUP · Ketuk untuk Buka Kasir / Shift Pagi"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span className="text-[10px]">Buka Kasir</span>
            </button>
          ) : (
            <span
              className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
              title={`Toko Buka (${shift.shiftName})`}
            />
          )}

          <span className="sm:hidden font-extrabold text-slate-800 truncate">
            {breadcrumb.title}
          </span>

          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <span className="font-bold text-slate-800 truncate">
              {storeProfile.isDemoMode
                ? 'Mode Demo (Contoh)'
                : shift.isOpen
                ? `Toko Buka · ${shift.shiftName}`
                : 'Register TUTUP'}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[10.5px] font-mono text-teal-800 font-medium whitespace-nowrap">
              ✓ Tersimpan {lastSavedTime}
            </span>
          </div>
        </div>

        {/* Right: Always-Visible Live Digital Clock (WIB) */}
        <div className="flex items-center gap-1 font-mono tabular-nums whitespace-nowrap shrink-0">
          <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="hidden min-[380px]:inline sm:hidden text-slate-500 font-medium text-[10.5px]">
            {clockData.shortDate} ·
          </span>
          <span className="hidden sm:inline text-slate-600 font-medium text-[11px]">
            {clockData.fullDate} ·
          </span>
          <span className="font-black text-slate-900 text-[11px] sm:text-xs">
            {clockData.time || '--:--:-- WIB'}
          </span>
        </div>
      </div>
    </header>
  );
};
