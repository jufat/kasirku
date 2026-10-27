import {
  ShoppingCart,
  CreditCard,
  Zap,
  Package,
  Menu,
  Printer,
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
  } = usePOS();

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const activePrintOrdersCount = printOrders.filter(
    (o) => o.status === 'antrean' || o.status === 'proses'
  ).length;

  // Sembunyikan navigasi menu bawah pada ATM Mini / Mobile Banking agar layar tampil penuh tanpa terhalang
  if (activeTab === 'atm_mini' || activeTab === 'transfer') {
    return null;
  }

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
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'ppob',
      label: 'PPOB',
      icon: Zap,
    },
    {
      id: 'percetakan',
      label: 'Percetakan',
      icon: Printer,
      badge: activePrintOrdersCount > 0 ? activePrintOrdersCount : undefined,
      badgeColor: 'bg-indigo-600 text-white font-bold',
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5 flex items-center justify-around select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsMobileSidebarOpen(false);
            }}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer min-w-[56px] active:scale-95 ${
              isActive
                ? 'text-teal-700 font-extrabold bg-teal-50'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'text-teal-700 stroke-[2.5]' : 'text-slate-500'}`} />
              {item.badge && (
                <span
                  className={`absolute -top-1.5 -right-2.5 text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded-full leading-none shadow-xs ${item.badgeColor}`}
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
        className="relative flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-600 hover:text-slate-900 transition cursor-pointer min-w-[56px] active:scale-95"
      >
        <div className="relative">
          <Menu className="w-5 h-5 text-slate-600" />
          {lowStockCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </div>
        <span className="text-[10px] font-medium mt-0.5 leading-tight">Menu</span>
      </button>
    </nav>
  );
};
