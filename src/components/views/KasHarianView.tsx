import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  PlusCircle,
  Search,
  Filter,
  CheckCircle,
  Calendar,
  Layers,
  Edit3,
  CreditCard,
  QrCode,
  AlertCircle,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Receipt,
  Banknote,
  Clock,
  ChevronRight,
  X,
  Coins,
  Sliders,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';

export const KasHarianView: React.FC = () => {
  const {
    mutations,
    drawerCashBalance,
    setIsCashMutationModalOpen,
    exportCashMutationCSV,
    shift,
    updateStartingCash,
    adjustDrawerCash,
    debts,
    setActiveTab,
  } = usePOS();

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'masuk' | 'keluar' | 'non_tunai'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Dynamic Drawer Cash & Modal Awal Editor State
  const [isCashDrawerModalOpen, setIsCashDrawerModalOpen] = useState(false);
  const [drawerModalMode, setDrawerModalMode] = useState<'adjust_current' | 'starting_cash'>('adjust_current');
  const [targetCashInput, setTargetCashInput] = useState<number>(drawerCashBalance);
  const [adjustNote, setAdjustNote] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // 1. Dynamic Metric Calculations
  // Total Cash Masuk (Physical Tunai only)
  const totalMasukTunai = mutations
    .filter((m) => m.paymentMethod === 'tunai' && m.type === 'masuk')
    .reduce((acc, m) => acc + m.amount, 0);

  // Total Cash Keluar (Physical Tunai only)
  const totalKeluarTunai = mutations
    .filter((m) => m.paymentMethod === 'tunai' && m.type === 'keluar')
    .reduce((acc, m) => acc + m.amount, 0);

  // Total Non-Tunai / QRIS (Digital income)
  const totalNonTunai = mutations
    .filter((m) => m.paymentMethod === 'non_tunai' && m.type === 'masuk')
    .reduce((acc, m) => acc + m.amount, 0);

  // Total Piutang / Kasbon Aktif (Belum Lunas)
  const totalKasbonAktif = debts
    .filter((d) => d.status !== 'lunas')
    .reduce((acc, d) => acc + d.remainingAmount, 0);

  // Filter categories list
  const categoryOptions = [
    { id: 'all', label: 'Semua Kategori' },
    { id: 'modal_shift', label: 'Modal Awal Laci' },
    { id: 'penjualan_pos', label: 'Kasir POS' },
    { id: 'pulsa_ppob', label: 'Pulsa & PPOB' },
    { id: 'jasa_transfer', label: 'Mini ATM / EDC' },
    { id: 'service_hp', label: 'Service HP' },
    { id: 'percetakan', label: 'Percetakan' },
    { id: 'piutang_masuk', label: 'Bayar Kasbon' },
    { id: 'belanja_stok', label: 'Belanja Stok' },
    { id: 'operasional_keluar', label: 'Operasional Toko' },
    { id: 'setor_bank', label: 'Setor Bank' },
    { id: 'lain_lain', label: 'Penyesuaian Fisik / Lain-lain' },
  ];

  // Filtered mutations dynamically
  const filteredMutations = mutations.filter((m) => {
    let matchesType = true;
    if (filterType === 'masuk') {
      matchesType = m.type === 'masuk' && m.paymentMethod === 'tunai';
    } else if (filterType === 'keluar') {
      matchesType = m.type === 'keluar';
    } else if (filterType === 'non_tunai') {
      matchesType = m.paymentMethod === 'non_tunai';
    }

    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;

    const matchesSearch =
      m.description.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase()) ||
      m.recordedBy.toLowerCase().includes(search.toLowerCase()) ||
      m.amount.toString().includes(search);

    return matchesType && matchesCategory && matchesSearch;
  });

  // Dynamic sum of current filtered results
  const filteredSum = filteredMutations.reduce((acc, m) => {
    if (m.type === 'masuk') return acc + m.amount;
    return acc - m.amount;
  }, 0);

  // Open modal for current drawer balance adjustment
  const handleOpenAdjustDrawer = () => {
    setDrawerModalMode('adjust_current');
    setTargetCashInput(drawerCashBalance);
    setAdjustNote('Penyesuaian fisik laci kasir');
    setIsCashDrawerModalOpen(true);
  };

  // Open modal for starting cash
  const handleOpenStartingCash = () => {
    setDrawerModalMode('starting_cash');
    setTargetCashInput(shift.startingCash || 500000);
    setAdjustNote('');
    setIsCashDrawerModalOpen(true);
  };

  // Handle saving the cash adjustment
  const handleSaveDrawerCash = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = Number(targetCashInput) || 0;

    if (drawerModalMode === 'starting_cash') {
      updateStartingCash(cleanAmount);
      setToastMessage(
        `Modal awal kas laci berhasil diatur ke Rp ${cleanAmount.toLocaleString('id-ID')}!`
      );
    } else {
      adjustDrawerCash(cleanAmount, adjustNote || 'Penyesuaian fisik laci kasir');
      setToastMessage(
        `Saldo kas laci berhasil disesuaikan langsung ke Rp ${cleanAmount.toLocaleString('id-ID')}!`
      );
    }

    setIsCashDrawerModalOpen(false);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const cashDifference = (targetCashInput || 0) - drawerCashBalance;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 text-center shadow-md animate-in fade-in slide-in-from-top duration-200">
          ✓ {toastMessage}
        </div>
      )}

      {/* Top Banner & Header Controls */}
      <div className="p-4 sm:p-5 bg-white border-b border-slate-200 shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                Buku Arus Kas Harian & Mutasi Laci
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800">
                Ju-Fat Cell
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Pencatatan kas masuk, keluar, saldo laci bebas ditulis angka berapa saja (termasuk pecahan receh non-bulat).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {/* Direct Saldo Laci Adjustment Button */}
            <button
              type="button"
              onClick={handleOpenAdjustDrawer}
              className="flex-1 sm:flex-none px-3 py-2 text-xs font-bold bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              title="Tulis angka saldo laci berapa saja secara langsung (opname kas)"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-700" />
              <span>Tulis / Sesuaikan Saldo Laci</span>
            </button>

            {/* Record cash in/out button */}
            <button
              type="button"
              onClick={() => setIsCashMutationModalOpen(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>+ Catat Kas Masuk/Keluar</span>
            </button>

            <button
              type="button"
              onClick={exportCashMutationCSV}
              className="px-3 py-2 text-xs font-bold bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Unduh format spreadsheet .CSV untuk Excel"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden md:inline">Unduh Excel</span>
            </button>
          </div>
        </div>

        {/* Dynamic KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* 1. Saldo Kas Laci (Net Cash in Drawer) - CLICKABLE TO ADJUST TO ANY AMOUNT */}
          <div
            onClick={handleOpenAdjustDrawer}
            className="col-span-2 md:col-span-1 lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl p-3 shadow-md border border-slate-800 flex items-center justify-between cursor-pointer hover:ring-2 hover:ring-amber-400/50 transition group"
            title="Klik untuk menulis atau menyesuaikan saldo kas laci secara langsung"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-400 uppercase tracking-wide">
                <span>Saldo Kas Fisik di Laci</span>
                <Edit3 className="w-3 h-3 text-amber-300 opacity-60 group-hover:opacity-100 transition" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums truncate">
                Rp {drawerCashBalance.toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-amber-200/80 block mt-0.5 font-medium">
                Bisa ditulis angka berapa saja (Klik di sini)
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs shrink-0 ml-2 group-hover:scale-105 transition">
              <Wallet className="w-5 h-5 font-black" />
            </div>
          </div>

          {/* 2. Modal Awal */}
          <div
            onClick={handleOpenStartingCash}
            className="bg-amber-50/80 hover:bg-amber-100/90 border border-amber-200/90 rounded-xl p-3 flex items-center justify-between transition cursor-pointer group"
            title="Klik untuk ubah modal awal laci"
          >
            <div>
              <div className="flex items-center gap-1 text-[10px] font-extrabold text-amber-900 uppercase">
                <span>Modal Awal Laci</span>
                <Edit3 className="w-3 h-3 text-amber-700 opacity-60 group-hover:opacity-100 transition" />
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-amber-950 tabular-nums">
                Rp {(shift.startingCash || 0).toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-amber-700 font-semibold block">Klik untuk ubah</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0">
              <Banknote className="w-4 h-4" />
            </div>
          </div>

          {/* 3. Total Kas Masuk */}
          <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">
                Total Kas Masuk (+)
              </span>
              <div className="text-base sm:text-lg font-black font-mono text-emerald-950 tabular-nums">
                Rp {totalMasukTunai.toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-emerald-700 block">Uang fisik tunai</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>

          {/* 4. Total Kas Keluar */}
          <div className="bg-rose-50/80 border border-rose-200/90 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-rose-800 uppercase block">
                Kas Keluar (-)
              </span>
              <div className="text-base sm:text-lg font-black font-mono text-rose-950 tabular-nums">
                Rp {totalKeluarTunai.toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-rose-700 block">Belanja & Operasional</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* 5. Non-Tunai / QRIS */}
          <div className="bg-blue-50/80 border border-blue-200/90 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-blue-800 uppercase block">
                QRIS / Non-Tunai
              </span>
              <div className="text-base sm:text-lg font-black font-mono text-blue-950 tabular-nums">
                Rp {totalNonTunai.toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-blue-700 block">Masuk ke rekening</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
          </div>

          {/* 6. Total Kasbon / Piutang Berjalan */}
          <div
            onClick={() => setActiveTab('hutang')}
            className="col-span-2 sm:col-span-1 bg-purple-50/80 hover:bg-purple-100 border border-purple-200 rounded-xl p-3 flex items-center justify-between transition cursor-pointer group"
            title="Klik untuk membuka buku hutang / kasbon pelanggan"
          >
            <div>
              <div className="flex items-center gap-1 text-[10px] font-extrabold text-purple-900 uppercase">
                <span>Kasbon / Piutang</span>
                <ChevronRight className="w-3 h-3 text-purple-600 group-hover:translate-x-0.5 transition" />
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-purple-950 tabular-nums">
                Rp {totalKasbonAktif.toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-purple-700 font-semibold block">Belum tertagih</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2 flex-1">
          {/* Search box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari transaksi, ketikan nominal bebas, atau nama..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          {/* Type filter tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl shrink-0 overflow-x-auto">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'masuk', label: 'Masuk (+)' },
              { id: 'keluar', label: 'Keluar (-)' },
              { id: 'non_tunai', label: 'QRIS' },
            ].map((tab) => {
              const active = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id as any)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-white text-teal-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Category Dropdown / Filter summary */}
        <div className="flex items-center gap-2 justify-between md:justify-end text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {categoryOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="px-2 py-1 bg-slate-100 rounded-lg text-[11px] font-mono font-bold text-slate-700">
            {filteredMutations.length} data ({filteredSum >= 0 ? '+' : ''}Rp {filteredSum.toLocaleString('id-ID')})
          </div>
        </div>
      </div>

      {/* Mutations Table */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Bidang / Kategori</th>
                  <th className="py-2.5 px-3">Keterangan Mutasi</th>
                  <th className="py-2.5 px-3 text-center">Metode</th>
                  <th className="py-2.5 px-3 text-center">Tipe</th>
                  <th className="py-2.5 px-3 text-right">Nominal (Rp)</th>
                  <th className="py-2.5 px-3 text-right">Saldo Kas Laci</th>
                  <th className="py-2.5 px-3 text-center">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMutations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 space-y-2">
                      <Wallet className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-600">Tidak ada catatan mutasi kas ditemukan</p>
                      <p className="text-[11px] text-slate-400">
                        Coba sesuaikan kata kunci pencarian atau ubah filter kategori di atas.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredMutations.map((m) => {
                    const isMasuk = m.type === 'masuk';
                    const isNonTunai = m.paymentMethod === 'non_tunai';
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-600 whitespace-nowrap">
                          {m.timestamp}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              m.category === 'modal_shift'
                                ? 'bg-amber-100 text-amber-800'
                                : m.category === 'penjualan_pos'
                                ? 'bg-teal-100 text-teal-800'
                                : m.category === 'pulsa_ppob'
                                ? 'bg-sky-100 text-sky-800'
                                : m.category === 'jasa_transfer'
                                ? 'bg-indigo-100 text-indigo-800'
                                : m.category === 'service_hp'
                                ? 'bg-violet-100 text-violet-800'
                                : m.category === 'percetakan'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.category === 'piutang_masuk'
                                ? 'bg-purple-100 text-purple-800'
                                : m.category === 'lain_lain'
                                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {m.category.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 max-w-xs truncate">
                          {m.description}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isNonTunai
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isNonTunai ? 'QRIS / Non-Tunai' : 'Tunai Laci'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              isMasuk
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isMasuk ? 'MASUK' : 'KELUAR'}
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-bold tabular-nums whitespace-nowrap ${
                            isMasuk ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {isMasuk ? '+' : '-'}Rp {m.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                          Rp {m.runningCashBalance.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-slate-600 whitespace-nowrap">
                          {m.recordedBy}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Dialog: Tulis Saldo Laci Berapa Saja / Atur Modal Kas Awal */}
      {isCashDrawerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-200" />
                  {drawerModalMode === 'adjust_current'
                    ? 'Tulis / Sesuaikan Saldo Laci'
                    : 'Atur Modal Kas Awal'}
                </h3>
                <p className="text-[11px] text-amber-100">
                  {drawerModalMode === 'adjust_current'
                    ? 'Bisa ditulis angka berapa saja (tidak harus bulat)'
                    : 'Uang pembuka laci awal shift Ju-Fat Cell'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCashDrawerModalOpen(false)}
                className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setDrawerModalMode('adjust_current');
                  setTargetCashInput(drawerCashBalance);
                }}
                className={`py-1.5 rounded-lg transition cursor-pointer text-center ${
                  drawerModalMode === 'adjust_current'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Saldo Laci Fisik
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerModalMode('starting_cash');
                  setTargetCashInput(shift.startingCash || 500000);
                }}
                className={`py-1.5 rounded-lg transition cursor-pointer text-center ${
                  drawerModalMode === 'starting_cash'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Modal Awal Pagi
              </button>
            </div>

            <form onSubmit={handleSaveDrawerCash} className="p-4 space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    {drawerModalMode === 'adjust_current'
                      ? 'Saldo Kas Fisik yang Ada di Laci (Rp):'
                      : 'Nominal Modal Kas Awal (Rp):'}
                  </label>
                  <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    Bebas angka berapa saja
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={targetCashInput || ''}
                    onChange={(e) => setTargetCashInput(Number(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-base text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="Contoh: 483250 atau 14750..."
                  />
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center justify-between">
                  <span>Terbilang:</span>
                  <b className="text-amber-900 font-mono text-xs">
                    Rp {(targetCashInput || 0).toLocaleString('id-ID')}
                  </b>
                </div>
              </div>

              {/* Quick Helper Chips: Uang Receh & Non-Bulat */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <Coins className="w-3 h-3 text-amber-500" />
                    Tambah Pecahan / Uang Receh:
                  </span>
                  <button
                    type="button"
                    onClick={() => setTargetCashInput(0)}
                    className="text-rose-600 hover:underline cursor-pointer font-bold"
                  >
                    Reset 0
                  </button>
                </div>

                {/* Baris 1: Receh Non-Bulat */}
                <div className="grid grid-cols-4 gap-1">
                  {[500, 1000, 2000, 5000].map((coin) => (
                    <button
                      key={coin}
                      type="button"
                      onClick={() => setTargetCashInput((prev) => (prev || 0) + coin)}
                      className="py-1 text-[11px] font-mono font-bold bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg transition cursor-pointer text-center"
                    >
                      +{coin >= 1000 ? `${coin / 1000}k` : coin}
                    </button>
                  ))}
                </div>

                {/* Baris 2: Pecahan Kertas */}
                <div className="grid grid-cols-4 gap-1">
                  {[10000, 20000, 50000, 100000].map((note) => (
                    <button
                      key={note}
                      type="button"
                      onClick={() => setTargetCashInput((prev) => (prev || 0) + note)}
                      className="py-1 text-[11px] font-mono font-bold bg-slate-100 hover:bg-amber-50 hover:text-amber-950 border border-slate-200 text-slate-700 rounded-lg transition cursor-pointer text-center"
                    >
                      +{note / 1000}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Note input for adjust_current mode */}
              {drawerModalMode === 'adjust_current' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Catatan Penyesuaian (Opsional):
                  </label>
                  <input
                    type="text"
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                    placeholder="Contoh: Selisih uang receh kembalian fisik"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              )}

              {/* Live preview effect */}
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>
                    {drawerModalMode === 'adjust_current' ? 'Saldo Laci Sistem:' : 'Modal Awal Sebelumnya:'}
                  </span>
                  <span className="font-mono">
                    Rp {drawerModalMode === 'adjust_current' ? drawerCashBalance.toLocaleString('id-ID') : (shift.startingCash || 0).toLocaleString('id-ID')}
                  </span>
                </div>

                {drawerModalMode === 'adjust_current' && (
                  <div className="flex justify-between font-bold text-xs border-t border-amber-200/60 pt-1">
                    <span>Selisih Penyesuaian:</span>
                    <span
                      className={`font-mono ${
                        cashDifference === 0
                          ? 'text-slate-700'
                          : cashDifference > 0
                          ? 'text-emerald-700'
                          : 'text-rose-600'
                      }`}
                    >
                      {cashDifference === 0
                        ? 'Rp 0 (Pas)'
                        : `${cashDifference > 0 ? '+' : ''}Rp ${cashDifference.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                )}

                <div className="flex justify-between font-extrabold text-amber-950 border-t border-amber-200/60 pt-1 text-xs">
                  <span>
                    {drawerModalMode === 'adjust_current' ? 'Saldo Baru Diterapkan:' : 'Modal Baru Diterapkan:'}
                  </span>
                  <span className="font-mono font-black">
                    Rp {(targetCashInput || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCashDrawerModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-extrabold rounded-xl shadow-md transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4 text-amber-200" />
                  <span>
                    {drawerModalMode === 'adjust_current'
                      ? 'Terapkan Saldo Laci'
                      : 'Simpan Modal Awal'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
