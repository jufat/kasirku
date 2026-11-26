import React from 'react';
import {
  ShoppingCart,
  Zap,
  Wrench,
  LayoutDashboard,
  Wallet,
  Package,
  BookOpen,
  Settings,
  User,
  Power,
  Store,
  ChevronRight,
  CreditCard,
  X,
  RefreshCw,
  Printer,
  Sun,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    shift,
    toggleRole,
    setIsShiftModalOpen,
    cartTotalCount,
    storeProfile,
    products,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    syncCode,
    setIsSyncModalOpen,
    isSyncing,
    printOrders,
  } = usePOS();

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const activePrintOrdersCount = printOrders.filter(
    (o) => o.status === 'antrean' || o.status === 'proses'
  ).length;

  const operationalNav = [
    {
      id: 'kasir',
      name: 'Kasir (Penjualan)',
      icon: ShoppingCart,
      badge: cartTotalCount > 0 ? `${cartTotalCount}` : undefined,
      badgeColor: 'bg-amber-400 text-amber-950 font-bold',
    },
    {
      id: 'atm_mini',
      name: 'ATM Mini & EDC',
      icon: CreditCard,
      sublabel: 'Tarik, Transfer, M-Banking & QRIS',
    },
    {
      id: 'ppob',
      name: 'Pulsa & PPOB',
      icon: Zap,
      sublabel: 'Data, PLN, Tagihan',
    },
    {
      id: 'service',
      name: 'Service HP',
      icon: Wrench,
      sublabel: 'Status Reparasi',
    },
    {
      id: 'percetakan',
      name: 'Percetakan & Copy',
      icon: Printer,
      sublabel: 'Print, Foto, Banner, Jilid',
      badge: activePrintOrdersCount > 0 ? `${activePrintOrdersCount}` : undefined,
      badgeColor: 'bg-indigo-200 text-indigo-950 font-extrabold',
    },
  ];

  const managementNav = [
    {
      id: 'dashboard',
      name: 'Dashboard & Analitik',
      icon: LayoutDashboard,
    },
    {
      id: 'kas_harian',
      name: 'Kas Harian & Mutasi',
      icon: Wallet,
      sublabel: 'Buku Arus Kas',
    },
    {
      id: 'stok',
      name: 'Manajemen Stok',
      icon: Package,
      sublabel: 'HPP & Laba Satuan',
      badge: lowStockCount > 0 ? `${lowStockCount} Tipis` : undefined,
      badgeColor: 'bg-rose-500 text-white font-extrabold',
    },
    {
      id: 'hutang_retur',
      name: 'Catatan Hutang & Retur',
      icon: BookOpen,
      sublabel: 'Piutang & Garansi',
    },
    {
      id: 'pengaturan',
      name: 'Sistem & Database',
      icon: Settings,
      sublabel: 'Shift, Toko & Backup',
    },
  ];

  const renderContent = (isMobile = false) => (
    <>
      {/* Top Header Logo */}
      <div className="p-4 border-b border-white/15 bg-black/10 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {storeProfile.logo ? (
            <img
              src={storeProfile.logo}
              alt={storeProfile.name}
              className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-white/40 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 via-teal-300 to-emerald-500 flex items-center justify-center shadow-sm border border-white/30 shrink-0">
              <Store className="w-5 h-5 text-teal-950" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base tracking-tight text-white leading-tight truncate">
                {storeProfile.name || 'Ju-Fat Cell'}
              </h1>
              {storeProfile.isDemoMode && (
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-amber-400 text-amber-950 shrink-0">
                  DEMO
                </span>
              )}
            </div>
            <p className="text-[11px] text-teal-100 font-medium truncate mt-0.5">
              {storeProfile.subtitle || 'Modern POS & Agency'}
            </p>
          </div>
        </div>

        {isMobile && (
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 cursor-pointer"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List Scrollable */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* Operasional Section */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold text-teal-200 uppercase tracking-wider">
            Operasional Konter
          </div>
          <nav className="space-y-1">
            {operationalNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id || (item.id === 'atm_mini' && activeTab === 'transfer');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-colors duration-150 group text-left cursor-pointer active:scale-[0.98] ${
                    isActive
                      ? 'bg-white text-teal-900 shadow-md'
                      : 'text-teal-50 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-white/10 text-teal-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="truncate leading-tight">{item.name}</div>
                      {item.sublabel && (
                        <div
                          className={`text-[11px] font-normal truncate ${
                            isActive ? 'text-teal-700 font-medium' : 'text-teal-200/80'
                          }`}
                        >
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                  </div>
                  {item.badge ? (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 font-mono tabular-nums ${
                        isActive
                          ? 'bg-amber-400 text-amber-950'
                          : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-opacity ${
                        isActive ? 'text-teal-700 opacity-90' : 'opacity-0 group-hover:opacity-70 text-teal-200'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Manajemen & Owner Section */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold text-teal-200 uppercase tracking-wider">
            Manajemen & Owner
          </div>
          <nav className="space-y-1">
            {managementNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-colors duration-150 group text-left cursor-pointer active:scale-[0.98] ${
                    isActive
                      ? 'bg-white text-teal-900 shadow-md'
                      : 'text-teal-50 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-white/10 text-teal-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="truncate leading-tight">{item.name}</div>
                      {item.sublabel && (
                        <div
                          className={`text-[11px] font-normal truncate ${
                            isActive ? 'text-teal-700 font-medium' : 'text-teal-200/80'
                          }`}
                        >
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                  </div>
                  {item.badge ? (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 font-mono tabular-nums ${
                        isActive
                          ? 'bg-rose-500 text-white'
                          : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-opacity ${
                        isActive ? 'text-teal-700 opacity-90' : 'opacity-0 group-hover:opacity-70 text-teal-200'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sync PC & HP Card */}
        <div>
          <button
            type="button"
            onClick={() => {
              setIsSyncModalOpen(true);
              setIsMobileSidebarOpen(false);
            }}
            className="w-full min-h-[44px] p-3 rounded-xl bg-teal-950/35 border border-teal-300/25 hover:border-teal-200/50 transition group text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <RefreshCw className={`w-3.5 h-3.5 text-teal-200 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="text-xs font-bold text-white leading-tight">
                  Sinkron PC & HP
                </span>
              </div>
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded font-mono ${
                  syncCode
                    ? 'bg-emerald-400 text-emerald-950'
                    : 'bg-white/20 text-teal-100'
                }`}
              >
                {syncCode || 'KODE'}
              </span>
            </div>
            <p className="text-[11px] text-teal-100/90 leading-snug">
              {syncCode
                ? 'Terhubung dengan perangkat lain.'
                : 'Hubungkan HP kasir & PC via kode.'}
            </p>
          </button>
        </div>
      </div>

      {/* Footer Sidebar: User Account & Shift Control */}
      <div className="p-3 border-t border-white/15 bg-black/20 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {shift.cashierName}
                </p>
                {shift.isSwappedShift && (
                  <span className="text-[9px] bg-amber-400 text-amber-950 px-1 rounded font-extrabold shrink-0 uppercase">
                    Tukar
                  </span>
                )}
              </div>
              <p className="text-[10px] text-teal-200 font-mono truncate">
                {shift.cashierEmail}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleRole}
            className={`min-h-[32px] text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0 uppercase font-mono whitespace-nowrap ${
              shift.cashierSlot === 'owner'
                ? 'bg-amber-400 text-amber-950 hover:bg-amber-300'
                : shift.cashierSlot === 'kasir_1'
                ? 'bg-emerald-300 text-emerald-950 hover:bg-emerald-200'
                : 'bg-teal-200 text-teal-950 hover:bg-teal-100'
            }`}
            title="Ketuk untuk ganti peran (Owner / Shift 1 / Shift 2)"
          >
            {shift.cashierSlot === 'owner'
              ? 'Owner'
              : shift.cashierSlot === 'kasir_1'
              ? 'Shift 1'
              : 'Shift 2'}
          </button>
        </div>

        {/* Shift status & Buka/Tutup Kasir action */}
        {shift.isOpen ? (
          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
            <div className="text-[11px] leading-tight min-w-0">
              <div className="text-teal-100 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block shrink-0" />
                <span className="truncate">{shift.shiftName}</span>
              </div>
              <div className="text-[10px] text-teal-200/80 font-mono">
                Buka: {shift.startTime}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsShiftModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="min-h-[36px] px-3 py-1.5 text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white rounded-lg flex items-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap"
              title="Rekonsiliasi Kas & Tutup Kasir"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Tutup Kasir</span>
            </button>
          </div>
        ) : (
          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <div className="text-amber-300 font-extrabold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                <span>KASIR TUTUP</span>
              </div>
              <span className="text-[10px] text-teal-200 font-mono">
                {shift.closedAt || 'Standby'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsShiftModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full min-h-[40px] py-2 px-3 text-xs font-black bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 whitespace-nowrap"
              title="Buka Kasir & Mulai Shift"
            >
              <Sun className="w-4 h-4 text-amber-900" />
              <span>Buka Kasir</span>
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-gradient-to-b from-[#0d9488] via-[#059669] to-[#047857] text-white flex-col justify-between h-dvh shrink-0 border-r border-teal-600/40 select-none shadow-xl z-20">
        {renderContent(false)}
      </aside>

      {/* Mobile Off-Canvas Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />
          <aside className="relative w-72 max-w-[85vw] bg-gradient-to-b from-[#0d9488] via-[#059669] to-[#047857] text-white flex flex-col justify-between h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200 select-none">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
