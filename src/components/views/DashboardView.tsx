import React from 'react';
import {
  TrendingUp,
  Wallet,
  Wrench,
  AlertTriangle,
  BookOpen,
  ShoppingCart,
  Send,
  Zap,
  PlusCircle,
  ArrowUpRight,
  Package,
  Layers,
  CheckCircle,
  CreditCard,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';

export const DashboardView: React.FC = () => {
  const {
    products,
    transactions,
    agencyTransactions,
    ppobTransactions,
    services,
    mutations,
    debts,
    drawerCashBalance,
    setActiveTab,
    setIsCashMutationModalOpen,
    restockProduct,
  } = usePOS();

  // Metrics calculation
  const totalSalesPOS = transactions.reduce((acc: number, t) => acc + t.total, 0);
  const totalAgencyProfit = agencyTransactions.reduce((acc: number, a) => acc + a.counterFee, 0);
  const totalPPOBProfit = ppobTransactions.reduce((acc: number, p) => acc + p.profit, 0);
  const totalServiceRevenue = services.reduce(
    (acc: number, s) => acc + (s.status === 'diambil' ? s.totalCost : s.downPayment),
    0
  );

  const totalOmsetAll =
    totalSalesPOS +
    agencyTransactions.reduce((a: number, b) => a + b.nominal + b.counterFee, 0) +
    ppobTransactions.reduce((a: number, b) => a + b.sellingPrice, 0) +
    totalServiceRevenue;

  const activeServicesCount = services.filter(
    (s) => s.status === 'antrean' || s.status === 'proses'
  ).length;

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  const unpaidDebtTotal = debts
    .filter((d) => d.status !== 'lunas')
    .reduce((acc, d) => acc + d.remainingAmount, 0);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-amber-950 shadow-xs">
              Ju-Fat Cell Overview
            </span>
            <span className="text-xs text-teal-100 font-medium">· Counter Management System</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1.5">
            Ringkasan & Analitik Bisnis
          </h2>
          <p className="text-xs text-teal-100 mt-0.5">
            Monitoring performa penjualan kasir, transaksi perbankan agen, dan reparasi handphone
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('kasir')}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Kasir POS</span>
          </button>
          <button
            onClick={() => setActiveTab('atm_mini')}
            className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>ATM Mini (EDC)</span>
          </button>
          <button
            onClick={() => setActiveTab('transfer')}
            className="px-3.5 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Agen Bank</span>
          </button>
          <button
            onClick={() => setIsCashMutationModalOpen(true)}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-300" />
            <span>Catat Kas</span>
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Kas Fisik di Laci */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Kas Fisik Laci</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-emerald-950 font-mono tabular-nums">
              Rp {drawerCashBalance.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-emerald-700 mt-0.5">Saldo riil di laci kasir</p>
          </div>
        </div>

        {/* KPI 2: Service HP Diproses */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Service Diproses</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-blue-950 font-mono tabular-nums">
              {activeServicesCount} Unit
            </div>
            <p className="text-[11px] text-blue-700 mt-0.5">
              {services.filter((s) => s.status === 'antrean').length} antrean ·{' '}
              {services.filter((s) => s.status === 'proses').length} pengerjaan
            </p>
          </div>
        </div>

        {/* KPI 3: Stok Menipis Warning */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Peringatan Restock</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                lowStockProducts.length > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-xl font-extrabold font-mono tabular-nums ${
                lowStockProducts.length > 0 ? 'text-amber-800' : 'text-slate-800'
              }`}
            >
              {lowStockProducts.length} Produk
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Di bawah batas minimum stok aman
            </p>
          </div>
        </div>

        {/* KPI 4: Buku Piutang Belum Lunas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Piutang Belum Lunas</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-purple-950 font-mono tabular-nums">
              Rp {unpaidDebtTotal.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-purple-700 mt-0.5">
              {debts.filter((d) => d.status !== 'lunas').length} pelanggan kasbon
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown by Stream */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Distribusi Pendapatan & Profit Konter
            </h3>
            <p className="text-xs text-slate-500">Performa 4 pilar bisnis Ju-Fat Cell</p>
          </div>
          <span className="text-xs font-semibold text-emerald-800 font-mono bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            Real-Time Auto-Journal
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Stream 1 */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
              <span>Aksesoris & POS</span>
            </div>
            <div className="text-base font-extrabold text-slate-900 font-mono">
              Rp {totalSalesPOS.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {transactions.length} struk penjualan kasir
            </div>
          </div>

          {/* Stream 2 */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
              <Send className="w-3.5 h-3.5 text-pink-600" />
              <span>Laba Agen & Transfer</span>
            </div>
            <div className="text-base font-extrabold text-pink-800 font-mono">
              +Rp {totalAgencyProfit.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {agencyTransactions.length} transaksi perbankan
            </div>
          </div>

          {/* Stream 3 */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Laba Pulsa & PPOB</span>
            </div>
            <div className="text-base font-extrabold text-amber-800 font-mono">
              +Rp {totalPPOBProfit.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {ppobTransactions.length} pengisian & tagihan
            </div>
          </div>

          {/* Stream 4 */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              <span>Pendapatan Servis HP</span>
            </div>
            <div className="text-base font-extrabold text-blue-900 font-mono">
              Rp {totalServiceRevenue.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {services.length} unit teregistrasi
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Critical Stock Restock + Recent Cash Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Stock Alert */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Stok Kritis (Perlu Restock Segera)
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('stok')}
                className="text-xs text-teal-700 font-bold hover:underline cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                Semua stok produk dalam batas aman!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        SKU: {p.sku} · Min: {p.minStock} {p.unit}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold text-red-600 font-mono bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        Sisa {p.stock}
                      </span>
                      <button
                        onClick={() => restockProduct(p.id, 10)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition shadow-xs cursor-pointer"
                        title="Tambah 10 pcs ke stok"
                      >
                        +10 Restock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Ledger Live Activity */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Aktivitas Kas Laci Terakhir (Live)
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('kas_harian')}
                className="text-xs text-teal-700 font-bold hover:underline cursor-pointer"
              >
                Buku Kas Lengkap
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {mutations.slice(0, 5).map((m) => (
                <div key={m.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{m.description}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {m.timestamp} · {m.category.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <span
                      className={`font-bold block ${
                        m.type === 'masuk' ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {m.type === 'masuk' ? '+' : '-'}Rp {m.amount.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Saldo: Rp {m.runningCashBalance.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
