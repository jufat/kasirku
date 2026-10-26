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
  ShieldCheck,
  User,
  Power,
  Store,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Sparkles,
  X,
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
  } = usePOS();

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  const operationalNav = [
    {
      id: 'kasir',
      name: 'Kasir (Penjualan)',
      icon: ShoppingCart,
      badge: cartTotalCount > 0 ? `${cartTotalCount} item` : undefined,
      badgeColor: 'bg-amber-400 text-amber-950 font-bold',
    },
    {
      id: 'atm_mini',
      name: 'ATM Mini & EDC',
      icon: CreditCard,
      sublabel: 'Tarik, Transfer, M-Banking & QRIS',
      badge: 'LIVE',
      badgeColor: 'bg-amber-300 text-amber-950 font-extrabold',
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
      badge: lowStockCount > 0 ? `${lowStockCount} Menipis` : undefined,
      badgeColor: 'bg-rose-500 text-white font-extrabold animate-pulse ring-1 ring-white/50',
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
      sublabel: 'Shift & Backup',
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
              className="w-11 h-11 rounded-xl object-contain bg-white p-1 border border-white/40 shadow-md shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 via-teal-300 to-emerald-500 flex items-center justify-center shadow-md border border-white/30 shrink-0">
              <Store className="w-5 h-5 text-teal-950" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base tracking-tight text-white leading-tight truncate">
                {storeProfile.name || 'Ju-Fat Cell'}
              </h1>
              <span
                className={`px-1.5 py-0.5 text-[8px] font-extrabold uppercase rounded shadow-xs shrink-0 ${
                  storeProfile.isDemoMode
                    ? 'bg-amber-400 text-amber-950 ring-1 ring-amber-300'
                    : 'bg-emerald-300 text-emerald-950 ring-1 ring-emerald-200'
                }`}
              >
                {storeProfile.isDemoMode ? 'DEMO' : 'LIVE'}
              </span>
            </div>
            <p className="text-[11px] text-teal-100 font-medium truncate mt-0.5">
              {storeProfile.subtitle || 'Modern POS & Agency'}
            </p>
          </div>
        </div>

        {isMobile && (
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 cursor-pointer"
            title="Tutup Menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav List Scrollable */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Operasional Section */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold text-teal-200 uppercase tracking-wider">
            <span>Operasional Konter</span>
            <span className="text-[10px] text-amber-300 font-mono bg-amber-400/20 px-1.5 py-0.2 rounded font-bold">
              Aktif
            </span>
          </div>
          <nav className="space-y-1.5">
            {operationalNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group text-left cursor-pointer active:scale-[0.98] ${
                    isActive
                      ? 'bg-white text-teal-900 shadow-lg shadow-black/10 ring-2 ring-white/80'
                      : 'text-teal-50 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
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
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 font-mono ${
                        isActive
                          ? 'bg-amber-400 text-amber-950 ring-1 ring-amber-300'
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
          <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold text-teal-200 uppercase tracking-wider">
            <span>Manajemen & Owner</span>
            <button
              onClick={toggleRole}
              title="Ganti Mode Akses Kasir/Owner"
              className="text-[10px] text-amber-300 hover:text-amber-200 underline cursor-pointer font-bold"
            >
              Mode: {shift.role === 'owner' ? 'Owner' : 'Kasir'}
            </button>
          </div>
          <nav className="space-y-1.5">
            {managementNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group text-left cursor-pointer active:scale-[0.98] ${
                    isActive
                      ? 'bg-white text-teal-900 shadow-lg shadow-black/10 ring-2 ring-white/80'
                      : 'text-teal-50 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
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
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 font-mono ${
                        isActive
                          ? 'bg-rose-500 text-white ring-1 ring-white/50'
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
      </div>

      {/* Footer Sidebar: User Account, Shift Status, Tutup Shift & E2EE */}
      <div className="p-3 border-t border-white/15 bg-black/20 space-y-2.5 backdrop-blur-xs">
        {/* User profile row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {shift.cashierName}
              </p>
              <p className="text-[10px] text-teal-200 font-mono truncate">
                {shift.cashierEmail}
              </p>
            </div>
          </div>
          <button
            onClick={toggleRole}
            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 hover:bg-amber-300 transition cursor-pointer shrink-0 shadow-xs"
            title="Klik untuk ganti hak akses"
          >
            {shift.role.toUpperCase()}
          </button>
        </div>

        {/* Shift status & Tutup Shift button */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <div className="text-[11px] leading-tight">
            <div className="text-teal-100 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse inline-block" />
              <span>{shift.shiftName}</span>
            </div>
            <div className="text-[10px] text-teal-200/80 font-mono">
              Aktif sejak {shift.startTime}
            </div>
          </div>

          <button
            onClick={() => {
              setIsShiftModalOpen(true);
              setIsMobileSidebarOpen(false);
            }}
            className="px-2.5 py-1 text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white rounded-lg flex items-center gap-1 transition shadow-xs cursor-pointer shrink-0"
            title="Rekonsiliasi Kas & Tutup Shift"
          >
            <Power className="w-3 h-3" />
            <span>Tutup Shift</span>
          </button>
        </div>

        {/* Security badge: E2EE & 2FA */}
        <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-teal-100 font-medium bg-white/10 py-1 rounded-lg border border-white/15">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-300 shrink-0" />
          <span>E2EE & 2FA Terverifikasi</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-gradient-to-b from-[#0d9488] via-[#059669] to-[#047857] text-white flex-col justify-between h-screen shrink-0 border-r border-teal-600/40 select-none shadow-xl z-20">
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
