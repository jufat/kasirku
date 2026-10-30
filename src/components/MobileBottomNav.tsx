import React from 'react';
import {
  ShoppingCart,
  CreditCard,
  Zap,
  Menu,
  Printer,
  Wrench,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

export const MobileBottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    cartTotalCount,
    products,
    setIsMobileSidebarOpen,
    printOrders,
    services,
    isBottomNavVisible,
    setIsBottomNavVisible,
  } = usePOS();

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const activePrintOrdersCount = printOrders.filter(
    (o) => o.status === 'antrean' || o.status === 'proses'
  ).length;
  const activeServicesCount = services.filter(
    (s) => s.status === 'antrean' || s.status === 'proses'
  ).length;

  const navItems = [
    {
      id: 'kasir',
      label: 'Kasir',
      icon: ShoppingCart,
      badge: cartTotalCount > 0 ? cartTotalCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'atm_mini',
      label: 'ATM Mini',
      icon: CreditCard,
      badge: 'EDC',
      badgeColor: 'bg-emerald-600 text-white font-bold',
    },
    {
      id: 'ppob',
      label: 'PPOB',
      icon: Zap,
    },
    {
      id: 'service',
      label: 'Service',
      icon: Wrench,
      badge: activeServicesCount > 0 ? activeServicesCount : undefined,
      badgeColor: 'bg-violet-600 text-white font-bold',
    },
    {
      id: 'percetakan',
      label: 'Cetak',
      icon: Printer,
      badge: activePrintOrdersCount > 0 ? activePrintOrdersCount : undefined,
      badgeColor: 'bg-indigo-600 text-white font-bold',
    },
  ];

  // Jika kondisi sedang "HILANG" (tersembunyi):
  // Tampilkan floating trigger pill di bawah agar kasir bisa memunculkan kembali ("TIMBUL") kapan saja di semua menu
  if (!isBottomNavVisible) {
    return (
      <div className="md:hidden fixed bottom-2.5 left-1/2 -translate-x-1/2 z-40 animate-in fade-in zoom-in duration-200">
        <button
          type="button"
          onClick={() => setIsBottomNavVisible(true)}
          className="bg-slate-900/90 hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-full shadow-xl shadow-slate-900/40 border border-slate-700/80 backdrop-blur-md flex items-center gap-1.5 text-xs font-extrabold cursor-pointer active:scale-95 transition"
          title="Tampilkan kembali tab menu bawah"
        >
          <ChevronUp className="w-4 h-4 text-amber-400 stroke-[3]" />
          <span>Tampilkan Menu Bawah</span>
          {cartTotalCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
              {cartTotalCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  // Jika kondisi sedang "TIMBUL" (muncul):
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 select-none animate-in slide-in-from-bottom duration-200">
      {/* Tombol Handle Tab: Sembunyikan Menu Bawah ("HILANG") */}
      <div className="flex justify-center -mb-px">
        <button
          type="button"
          onClick={() => setIsBottomNavVisible(false)}
          className="bg-white/95 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-[10px] font-bold px-3 py-0.5 rounded-t-xl border-t border-x border-slate-200 shadow-xs flex items-center gap-1 cursor-pointer transition active:scale-95 backdrop-blur-md"
          title="Sembunyikan menu bawah agar layar penuh"
        >
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          <span>Sembunyikan Menu</span>
        </button>
      </div>

      {/* Bar Menu Navigasi Utama */}
      <nav className="bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl px-1.5 py-1 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.id || (item.id === 'atm_mini' && activeTab === 'transfer');
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileSidebarOpen(false);
              }}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer min-w-[50px] active:scale-95 ${
                isActive
                  ? 'text-teal-700 font-extrabold bg-teal-50 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-teal-700 stroke-[2.5]' : 'text-slate-500'
                  }`}
                />
                {item.badge && (
                  <span
                    className={`absolute -top-1.5 -right-2 text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded-full leading-none shadow-xs ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 leading-tight">{item.label}</span>
            </button>
          );
        })}

        {/* Menu Drawer Toggle Button */}
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="relative flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-600 hover:text-slate-900 transition cursor-pointer min-w-[50px] active:scale-95"
        >
          <div className="relative">
            <Menu className="w-5 h-5 text-slate-600" />
            {lowStockCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <span className="text-[10px] font-medium mt-0.5 leading-tight">Lainnya</span>
        </button>
      </nav>
    </div>
  );
};
