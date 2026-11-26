import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  PlusCircle,
  Clock,
  ShieldAlert,
  Menu,
  RefreshCw,
  PanelBottomClose,
  PanelBottomOpen,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import {
  extractDeduplicatedVisits,
  computeCustomerStatsForRange,
} from '../utils/customerAnalytics';

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
    setIsMobileSidebarOpen,
    syncCode,
    setIsSyncModalOpen,
    isSyncing,
    isBottomNavVisible,
    toggleBottomNav,
    cartTotalCount,
    setIsMasterCartModalOpen,
    transactions,
    atmMiniTransactions,
    agencyTransactions,
    ppobTransactions,
    services,
    printOrders,
  } = usePOS();

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
        return { title: 'Kasir & Penjualan POS', sub: 'Katalog Produk, Barcode & Keranjang' };
      case 'atm_mini':
      case 'transfer':
        return { title: 'ATM Mini & EDC Konter', sub: 'Tarik Tunai, Transfer Bank, E-Wallet & QRIS' };
      case 'ppob':
        return { title: 'Pulsa, Data & Tagihan PPOB', sub: 'Pulsa, Kuota, PLN, Game & Tagihan' };
      case 'service':
        return { title: 'Service Handphone', sub: 'Antrean, Pengerjaan & Pengambilan Unit' };
      case 'percetakan':
        return { title: 'Percetakan & Copy', sub: 'Print, Fotokopi, Foto, Banner & Jilid' };
      case 'dashboard':
        return { title: 'Dashboard & Analitik', sub: 'Omset, Pelanggan, Grafik & Rekonsiliasi' };
      case 'kas_harian':
        return { title: 'Kas Harian & Mutasi', sub: 'Buku Arus Kas Masuk & Keluar Laci' };
      case 'stok':
        return { title: 'Manajemen Stok & HPP', sub: 'Katalog Produk, Import Excel & Audit Aset' };
      case 'hutang_retur':
        return { title: 'Hutang Kasbon & Retur', sub: 'Piutang Pelanggan & Retur Barang' };
      case 'pengaturan':
        return { title: 'Sistem, Shift & Database', sub: 'Profil Toko, Hak Akses & Backup Data' };
      default:
        return { title: storeProfile.name || 'Ju-Fat Cell POS', sub: storeProfile.subtitle || 'POS & Konter' };
    }
  };

  const breadcrumb = getBreadcrumbTitle();
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  const todayCustomerStats = useMemo(() => {
    const visits = extractDeduplicatedVisits({
      transactions,
      atmMiniTransactions,
      agencyTransactions,
      ppobTransactions,
      services,
      printOrders,
    });
    return computeCustomerStatsForRange(visits, {
      periodId: 'harian',
      label: 'Hari Ini',
      sublabel: '1 Hari',
      days: 1,
    });
  }, [
    transactions,
    atmMiniTransactions,
    agencyTransactions,
    ppobTransactions,
    services,
    printOrders,
    clockData.fullDate,
  ]);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-teal-100 shrink-0 sticky top-0 z-10 shadow-2xs select-none">
      {/* Main Header Row */}
      <div className="h-14 md:h-16 px-2.5 sm:px-4 md:px-6 flex items-center justify-between gap-2">
        {/* Zone 1: Mobile Hamburger, Breadcrumb Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-1">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition cursor-pointer shrink-0"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {storeProfile.logo ? (
            <img
              src={storeProfile.logo}
              alt={storeProfile.name}
              className="hidden sm:block w-8 h-8 md:w-9 md:h-9 rounded-xl object-contain border border-teal-200 p-1 bg-white shrink-0"
            />
          ) : null}

          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900 leading-tight truncate">
              <span className="sm:hidden text-teal-950">
                {storeProfile.name || 'Ju-Fat Cell'}
              </span>
              <span className="hidden sm:inline">{breadcrumb.title}</span>
            </h2>
            <p className="hidden md:block text-xs text-slate-500 font-medium truncate">{breadcrumb.sub}</p>
          </div>
        </div>

        {/* Zone 2: Shift Status & Live Clock + Inline Daily Customer Count (Desktop lg+) */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          {storeProfile.isDemoMode ? (
            <button
              type="button"
              onClick={() => setActiveTab('pengaturan')}
              className="min-h-[36px] flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg text-amber-950 font-bold transition cursor-pointer whitespace-nowrap shrink-0"
              title="Mode Demo aktif — ketuk untuk pengaturan"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>Mode Demo</span>
            </button>
          ) : shift.isOpen ? (
            <div className="min-h-[36px] flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-bold whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>{shift.shiftName}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsShiftModalOpen(true)}
              className="min-h-[36px] flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg text-rose-950 font-bold transition cursor-pointer whitespace-nowrap shrink-0"
              title="Kasir TUTUP — ketuk untuk Buka Kasir"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>Kasir Tutup · Buka</span>
            </button>
          )}

          {/* Live Clock & Inline Daily Customer Count */}
          <div className="min-h-[36px] flex items-center bg-slate-50 rounded-lg border border-slate-200 whitespace-nowrap shrink-0 overflow-hidden">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-700 font-mono tabular-nums">
              <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="font-bold text-slate-800">
                {clockData.fullDate ? `${clockData.fullDate} · ${clockData.time}` : 'Memuat waktu...'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="min-h-[36px] flex items-center gap-1.5 px-2.5 py-1.5 border-l border-slate-200 bg-teal-50/75 hover:bg-teal-100 text-teal-950 transition cursor-pointer font-mono tabular-nums whitespace-nowrap shrink-0"
              title={`Pelanggan masuk hari ini: ${todayCustomerStats.totalVisits} (${todayCustomerStats.uniqueCustomers} beda, ${todayCustomerStats.repeatCustomers} sama)`}
            >
              <Users className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span className="font-extrabold text-teal-950">
                {todayCustomerStats.totalVisits} Plg
              </span>
              <span className="hidden xl:inline text-[11px] font-semibold text-teal-700">
                · {todayCustomerStats.uniqueCustomers} Beda / {todayCustomerStats.repeatCustomers} Sama
              </span>
            </button>
          </div>

          {lowStockCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('stok')}
              className="min-h-[36px] flex items-center gap-1.5 text-amber-900 bg-amber-100 hover:bg-amber-200/80 px-2.5 py-1 rounded-lg border border-amber-300 text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0"
              title={`${lowStockCount} produk stok menipis`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{lowStockCount} Tipis</span>
            </button>
          )}
        </div>

        {/* Zone 3: Quick Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Active Role / Shift Button */}
          <button
            type="button"
            onClick={toggleRole}
            className={`min-h-[38px] sm:min-h-[40px] flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl border text-xs font-bold transition cursor-pointer active:scale-95 whitespace-nowrap shrink-0 ${
              shift.cashierSlot === 'owner'
                ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950'
                : 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-950'
            }`}
            title="Ketuk untuk ganti petugas aktif (Owner / Shift 1 / Shift 2)"
          >
            <div className="text-left leading-tight">
              <span className="text-[9px] text-slate-500 font-bold uppercase block">
                {shift.cashierSlot === 'owner' ? 'Owner' : shift.cashierSlot === 'kasir_1' ? 'Shift 1' : 'Shift 2'}
              </span>
              <span className="text-[11px] sm:text-xs font-black truncate max-w-[64px] sm:max-w-[120px] block text-slate-900">
                {shift.cashierName}
              </span>
            </div>
          </button>

          {/* Physical Cash Drawer Button */}
          <button
            type="button"
            onClick={() => setActiveTab('kas_harian')}
            className="min-h-[38px] sm:min-h-[40px] flex items-center gap-1.5 px-2 sm:px-2.5 py-1 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl text-teal-950 transition cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
            title="Buka buku arus kas harian & saldo laci"
          >
            <Wallet className="hidden sm:block w-4 h-4 text-teal-700 shrink-0" />
            <div className="text-left leading-tight">
              <span className="text-[9px] text-teal-700 font-bold uppercase block">Kas Laci</span>
              <span className="text-[11px] sm:text-xs font-black text-teal-950 font-mono tabular-nums">
                Rp {drawerCashBalance >= 10000000
                  ? `${(drawerCashBalance / 1000000).toFixed(1)}Jt`
                  : drawerCashBalance.toLocaleString('id-ID')}
              </span>
            </div>
          </button>

          {/* Master Cart (Keranjang Besar) Button */}
          <button
            type="button"
            onClick={() => setIsMasterCartModalOpen(true)}
            className={`min-h-[38px] sm:min-h-[40px] flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer active:scale-95 whitespace-nowrap shrink-0 ${
              cartTotalCount > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-xs'
                : 'bg-slate-50 hover:bg-teal-50 text-slate-700 border-slate-200 hover:border-teal-300'
            }`}
            title="Buka Keranjang Gabungan"
          >
            <ShoppingCart
              className={`w-4 h-4 shrink-0 ${
                cartTotalCount > 0 ? 'text-amber-300' : 'text-teal-600'
              }`}
            />
            <span className="hidden sm:inline lg:hidden xl:inline">Keranjang</span>
            {cartTotalCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black font-mono tabular-nums rounded-full bg-amber-400 text-slate-950">
                {cartTotalCount}
              </span>
            )}
          </button>

          {/* Quick Cash Mutation Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsCashMutationModalOpen(true)}
            className="min-h-[38px] sm:min-h-[40px] flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold bg-teal-700 hover:bg-teal-600 text-white rounded-xl transition cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
            title="Catat uang masuk atau pengeluaran kas"
          >
            <PlusCircle className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="hidden sm:inline">Catat Kas</span>
          </button>

          {/* Sync PC & HP Modal Button */}
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className={`min-h-[38px] sm:min-h-[40px] flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer active:scale-95 whitespace-nowrap shrink-0 ${
              syncCode
                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Sinkronisasi Data PC & HP"
          >
            <RefreshCw
              className={`w-4 h-4 shrink-0 ${
                isSyncing
                  ? 'animate-spin text-teal-600'
                  : syncCode
                  ? 'text-emerald-600'
                  : 'text-slate-600'
              }`}
            />
            <span className="hidden sm:inline">
              {syncCode ? `Sync ${syncCode}` : 'Sync'}
            </span>
          </button>

          {/* Mobile Toggle Bottom Nav */}
          <button
            type="button"
            onClick={toggleBottomNav}
            className="md:hidden min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer active:scale-95 shrink-0"
            title={isBottomNavVisible ? 'Sembunyikan Menu Bawah' : 'Tampilkan Menu Bawah'}
          >
            {isBottomNavVisible ? (
              <PanelBottomClose className="w-4 h-4 text-teal-700" />
            ) : (
              <PanelBottomOpen className="w-4 h-4 text-amber-600" />
            )}
          </button>
        </div>
      </div>

      {/* Compact Mobile & Tablet Sub-Bar (< lg): Active Menu + Shift + Daily Customers & Clock */}
      <div className="lg:hidden px-2.5 sm:px-4 py-1.5 bg-teal-50/75 border-t border-teal-100 flex items-center justify-between gap-2 text-[11px]">
        <div className="min-w-0 flex items-center gap-1.5 flex-1">
          {!shift.isOpen ? (
            <button
              type="button"
              onClick={() => setIsShiftModalOpen(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold transition cursor-pointer shrink-0 whitespace-nowrap"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>Buka Kasir</span>
            </button>
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          )}

          <span className="sm:hidden font-extrabold text-slate-800 truncate">
            {breadcrumb.title}
          </span>

          <span className="hidden sm:inline font-bold text-slate-700 truncate">
            {shift.isOpen ? shift.shiftName : 'Kasir Tutup'}
          </span>
        </div>

        {/* Inline Daily Customer Count + Clock */}
        <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white hover:bg-teal-100 border border-teal-200 text-teal-900 font-mono tabular-nums text-[11px] font-extrabold transition cursor-pointer shrink-0"
            title={`Pelanggan hari ini: ${todayCustomerStats.totalVisits}`}
          >
            <Users className="w-3 h-3 text-teal-700 shrink-0" />
            <span>{todayCustomerStats.totalVisits} Plg</span>
            <span className="hidden sm:inline font-semibold text-teal-700">
              ({todayCustomerStats.uniqueCustomers}B/{todayCustomerStats.repeatCustomers}S)
            </span>
          </button>

          <div className="flex items-center gap-1 font-mono tabular-nums whitespace-nowrap shrink-0">
            <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="hidden min-[380px]:inline sm:hidden text-slate-500 font-medium">
              {clockData.shortDate} ·
            </span>
            <span className="hidden sm:inline text-slate-600 font-medium">
              {clockData.fullDate} ·
            </span>
            <span className="font-black text-slate-900">
              {clockData.time || '--:--:-- WIB'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
