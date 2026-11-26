import React from 'react';
import {
  ShoppingCart,
  CreditCard,
  Zap,
  Menu,
  Printer,
  Wrench,
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

  if (!isBottomNavVisible) {
    return (
      <div className="md:hidden fixed bottom-2.5 left-1/2 -translate-x-1/2 z-40">
        <button
          type="button"
          onClick={() => setIsBottomNavVisible(true)}
          className="min-h-[40px] bg-slate-900/95 hover:bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg border border-slate-700/80 backdrop-blur-md flex items-center gap-2 text-xs font-extrabold cursor-pointer active:scale-95 transition whitespace-nowrap"
          title="Tampilkan kembali tab menu bawah"
        >
          <ChevronUp className="w-4 h-4 text-amber-400 stroke-[2.5]" />
          <span>Menu Navigasi</span>
          {cartTotalCount > 0 && (
            <span className="bg-amber-400 text-slate-950 text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-full font-black">
              {cartTotalCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 select-none">
      <nav className="bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] px-1.5 py-1.5 grid grid-cols-6 gap-1">
        {navItems.map((item) => {
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
              className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-semibold'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-white stroke-[2.5]' : 'text-slate-500 stroke-[2]'
                  }`}
                />
                {item.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 text-[9px] font-mono tabular-nums font-black px-1.5 py-0.2 rounded-full leading-none border border-white/60 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 leading-none tracking-tight whitespace-nowrap ${isActive ? 'font-extrabold text-white' : 'font-semibold'}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Menu Drawer Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="relative flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition cursor-pointer active:scale-95 font-semibold"
        >
          <div className="relative">
            <Menu className="w-5 h-5 text-slate-600 stroke-[2]" />
            {lowStockCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 text-[9px] font-mono tabular-nums font-black px-1 py-0.2 rounded-full leading-none bg-rose-500 text-white border border-white">
                {lowStockCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 leading-none tracking-tight font-semibold whitespace-nowrap">
            Lainnya
          </span>
        </button>
      </nav>
    </div>
  );
};
