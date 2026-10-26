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
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';

export const KasHarianView: React.FC = () => {
  const {
    mutations,
    drawerCashBalance,
    setIsCashMutationModalOpen,
    exportCashMutationCSV,
  } = usePOS();

  const [filterType, setFilterType] = useState<'all' | 'masuk' | 'keluar'>('all');
  const [search, setSearch] = useState('');

  // Calculations for summary cards
  const totalMasuk = mutations
    .filter((m) => m.paymentMethod === 'tunai' && m.type === 'masuk')
    .reduce((acc, m) => acc + m.amount, 0);

  const totalKeluar = mutations
    .filter((m) => m.paymentMethod === 'tunai' && m.type === 'keluar')
    .reduce((acc, m) => acc + m.amount, 0);

  const filteredMutations = mutations.filter((m) => {
    const matchesType = filterType === 'all' || m.type === filterType;
    const matchesSearch =
      m.description.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase()) ||
      m.recordedBy.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-hidden">
      {/* Top 3 Metric Summary Banner */}
      <div className="p-5 bg-white border-b border-slate-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              Buku Arus Kas Harian & Mutasi Laci
            </h3>
            <p className="text-xs text-slate-500">
              Pencatatan otomatis arus kas masuk & keluar fisik konter Ju-Fat Cell
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCashMutationModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl shadow-sm shadow-teal-900/20 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>Catat Kas Keluar / Masuk</span>
            </button>

            <button
              onClick={exportCashMutationCSV}
              className="px-3.5 py-2 text-xs font-bold bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Unduh format spreadsheet .CSV untuk Excel"
            >
              <Download className="w-4 h-4 text-teal-600" />
              <span>Unduh CSV / Excel</span>
            </button>
          </div>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Masuk */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase block">
                Total Kas Fisik Masuk (+)
              </span>
              <span className="text-xl font-extrabold text-emerald-950 font-mono tabular-nums">
                Rp {totalMasuk.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>

          {/* Total Keluar */}
          <div className="bg-red-50/70 border border-red-200/80 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-red-800 uppercase block">
                Total Pengeluaran Fisik (-)
              </span>
              <span className="text-xl font-extrabold text-red-950 font-mono tabular-nums">
                Rp {totalKeluar.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          {/* Net Cash in Drawer */}
          <div className="bg-slate-900 text-white rounded-xl p-3.5 flex items-center justify-between shadow-md">
            <div>
              <span className="text-xs font-bold text-amber-300 uppercase block">
                Saldo Kas Fisik Bersih di Laci
              </span>
              <span className="text-xl font-extrabold text-white font-mono tabular-nums">
                Rp {drawerCashBalance.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center shadow-xs font-bold">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari transaksi, kategori, atau petugas..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1">
          {[
            { id: 'all', label: 'Semua Mutasi' },
            { id: 'masuk', label: 'Kas Masuk (+)' },
            { id: 'keluar', label: 'Kas Keluar (-)' },
          ].map((tab) => {
            const active = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mutations Table */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3">Keterangan Mutasi</th>
                <th className="py-2.5 px-3 text-center">Tipe</th>
                <th className="py-2.5 px-3 text-right">Nominal (Rp)</th>
                <th className="py-2.5 px-3 text-right">Saldo Kas Laci</th>
                <th className="py-2.5 px-3 text-center">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMutations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada catatan mutasi kas ditemukan
                  </td>
                </tr>
              ) : (
                filteredMutations.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                      {m.timestamp}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {m.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {m.description}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.type === 'masuk'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {m.type === 'masuk' ? 'MASUK' : 'KELUAR'}
                      </span>
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono font-bold tabular-nums ${
                        m.type === 'masuk' ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {m.type === 'masuk' ? '+' : '-'}Rp {m.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      Rp {m.runningCashBalance.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-slate-600">
                      {m.recordedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
};
