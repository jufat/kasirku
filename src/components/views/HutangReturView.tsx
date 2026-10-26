import React, { useState } from 'react';
import {
  BookOpen,
  RotateCcw,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Phone,
  User,
  DollarSign,
  Wallet,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { DebtRecord, ReturnRecord } from '../../types/pos';

export const HutangReturView: React.FC = () => {
  const {
    debts,
    payDebt,
    addDebt,
    returns,
    updateReturnStatus,
    addReturnRecord,
  } = usePOS();

  const [activeSubTab, setActiveSubTab] = useState<'hutang' | 'retur'>('hutang');
  const [search, setSearch] = useState('');

  // Debt Pay Modal
  const [payingDebt, setPayingDebt] = useState<DebtRecord | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);

  // New Debt Modal
  const [isNewDebtOpen, setIsNewDebtOpen] = useState(false);
  const [debtCustName, setDebtCustName] = useState('');
  const [debtCustPhone, setDebtCustPhone] = useState('');
  const [debtAmount, setDebtAmount] = useState<number>(50000);
  const [debtDueDate, setDebtDueDate] = useState<string>('');
  const [debtNote, setDebtNote] = useState('');

  // New Return Modal
  const [isNewReturnOpen, setIsNewReturnOpen] = useState(false);
  const [retProdName, setRetProdName] = useState('');
  const [retSku, setRetSku] = useState('');
  const [retSupplier, setRetSupplier] = useState('');
  const [retQty, setRetQty] = useState(1);
  const [retHpp, setRetHpp] = useState(25000);
  const [retReason, setRetReason] = useState('');

  // Total outstanding debt
  const totalOutstanding = debts
    .filter((d) => d.status !== 'lunas')
    .reduce((acc, d) => acc + d.remainingAmount, 0);

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt || payAmount <= 0) return;
    payDebt(payingDebt.id, payAmount);
    setPayingDebt(null);
    setPayAmount(0);
  };

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtCustName || debtAmount <= 0) return;

    addDebt({
      invoiceOrRef: `KASBON-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().slice(0, 10),
      customerName: debtCustName,
      customerPhone: debtCustPhone || '-',
      totalAmount: debtAmount,
      paidAmount: 0,
      dueDate: debtDueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      note: debtNote,
    });

    setDebtCustName('');
    setDebtCustPhone('');
    setDebtAmount(50000);
    setDebtNote('');
    setIsNewDebtOpen(false);
  };

  const handleCreateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!retProdName || !retSupplier) return;

    addReturnRecord({
      productName: retProdName,
      sku: retSku || 'SKU-RET',
      supplierName: retSupplier,
      quantity: retQty,
      unitHpp: retHpp,
      reason: retReason,
      status: 'menunggu_supplier',
    });

    setRetProdName('');
    setRetSku('');
    setRetSupplier('');
    setRetReason('');
    setIsNewReturnOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-hidden">
      {/* Top Header & Sub-Tabs */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-700 text-white flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              Buku Piutang & Retur Barang
            </h3>
            <p className="text-xs text-slate-500">
              Pengelolaan kasbon pelanggan tempo & pengembalian unit garansi supplier
            </p>
          </div>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('hutang')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'hutang'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Piutang / Kasbon</span>
          </button>
          <button
            onClick={() => setActiveSubTab('retur')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'retur'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Barang Retur Supplier</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'hutang' ? (
        /* TAB 1: BUKU PIUTANG */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Piutang Summary Strip */}
          <div className="p-4 bg-purple-50/60 border-b border-purple-200/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-purple-900 uppercase">
                Total Sisa Piutang Belum Lunas:
              </span>
              <span className="text-lg font-extrabold text-purple-950 font-mono">
                Rp {totalOutstanding.toLocaleString('id-ID')}
              </span>
            </div>

            <button
              onClick={() => setIsNewDebtOpen(true)}
              className="px-3 py-1.5 text-xs font-bold bg-purple-700 hover:bg-purple-600 text-white rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Catat Kasbon Baru</span>
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">No Ref / Tanggal</th>
                    <th className="py-2.5 px-3">Pelanggan & Kontak</th>
                    <th className="py-2.5 px-3">Keterangan Barang</th>
                    <th className="py-2.5 px-3 text-right">Total Hutang</th>
                    <th className="py-2.5 px-3 text-right">Sudah Dibayar</th>
                    <th className="py-2.5 px-3 text-right">Sisa Tagihan</th>
                    <th className="py-2.5 px-3">Jatuh Tempo</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {debts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Tidak ada catatan piutang aktif
                      </td>
                    </tr>
                  ) : (
                    debts.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-mono">
                          <div className="font-bold text-slate-800">{d.invoiceOrRef}</div>
                          <div className="text-[10px] text-slate-400">{d.date}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{d.customerName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {d.customerPhone}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {d.note || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 tabular-nums">
                          Rp {d.totalAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                          Rp {d.paidAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-red-600 tabular-nums">
                          Rp {d.remainingAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {d.dueDate}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              d.status === 'lunas'
                                ? 'bg-emerald-100 text-emerald-800'
                                : d.status === 'cicilan'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {d.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {d.status !== 'lunas' ? (
                            <button
                              onClick={() => {
                                setPayingDebt(d);
                                setPayAmount(d.remainingAmount);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition shadow-xs cursor-pointer"
                            >
                              Bayar / Cicil
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-semibold">
                              Lunas
                            </span>
                          )}
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
      ) : (
        /* TAB 2: BARANG RETUR */
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">
              Daftar barang rusak / cacat pabrik yang dikembalikan ke distributor
            </span>

            <button
              onClick={() => setIsNewReturnOpen(true)}
              className="px-3 py-1.5 text-xs font-bold bg-purple-700 hover:bg-purple-600 text-white rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Catat Retur Baru</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">No Retur / Tgl</th>
                    <th className="py-2.5 px-3">Nama Produk & SKU</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Nilai HPP</th>
                    <th className="py-2.5 px-3">Alasan Retur</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada barang retur aktif
                      </td>
                    </tr>
                  ) : (
                    returns.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-mono">
                          <div className="font-bold text-slate-800">{r.returNo}</div>
                          <div className="text-[10px] text-slate-400">{r.date}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{r.productName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{r.sku}</div>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {r.supplierName}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                          {r.quantity} pcs
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 tabular-nums">
                          Rp {(r.unitHpp * r.quantity).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{r.reason}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              r.status === 'diganti_unit'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'refund_dana'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => updateReturnStatus(r.id, 'diganti_unit')}
                              className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded cursor-pointer"
                              title="Tandai telah diganti unit baru"
                            >
                              Ganti Unit
                            </button>
                            <button
                              onClick={() => updateReturnStatus(r.id, 'refund_dana')}
                              className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded cursor-pointer"
                              title="Tandai telah di-refund dana"
                            >
                              Refund
                            </button>
                          </div>
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
      )}

      {/* Pay Debt Modal */}
      {payingDebt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Pembayaran Piutang Pelanggan</h3>
              <button
                onClick={() => setPayingDebt(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Nama Pelanggan:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {payingDebt.customerName}
                </span>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Piutang:</span>
                  <span className="font-bold">
                    Rp {payingDebt.totalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Sudah Dibayar:</span>
                  <span className="font-bold text-emerald-700">
                    Rp {payingDebt.paidAmount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-red-600 font-extrabold pt-1 border-t border-purple-200">
                  <span>Sisa Wajib Bayar:</span>
                  <span>Rp {payingDebt.remainingAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nominal Pembayaran Diterima (Rp) *
                </label>
                <input
                  type="number"
                  step="5000"
                  max={payingDebt.remainingAmount}
                  min="5000"
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
                <span className="text-[10px] text-emerald-700 block mt-1">
                  *Pembayaran otomatis tercatat sebagai uang kas masuk di laci
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingDebt(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs"
                >
                  Proses Bayar Masuk Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Debt Modal */}
      {isNewDebtOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Catat Kasbon / Piutang Baru</h3>
              <button
                onClick={() => setIsNewDebtOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Pelanggan *</label>
                <input
                  type="text"
                  required
                  value={debtCustName}
                  onChange={(e) => setDebtCustName(e.target.value)}
                  placeholder="Contoh: Pak RT Hendra"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">No WhatsApp</label>
                <input
                  type="text"
                  value={debtCustPhone}
                  onChange={(e) => setDebtCustPhone(e.target.value)}
                  placeholder="0812..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Total Kasbon (Rp) *</label>
                <input
                  type="number"
                  step="5000"
                  required
                  value={debtAmount || ''}
                  onChange={(e) => setDebtAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tanggal Jatuh Tempo</label>
                <input
                  type="date"
                  value={debtDueDate}
                  onChange={(e) => setDebtDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Barang / Catatan</label>
                <input
                  type="text"
                  value={debtNote}
                  onChange={(e) => setDebtNote(e.target.value)}
                  placeholder="Cth: Ambil Charger + Tempered glass"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewDebtOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold shadow-xs"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Return Modal */}
      {isNewReturnOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Catat Barang Retur Supplier</h3>
              <button
                onClick={() => setIsNewReturnOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReturn} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Barang *</label>
                <input
                  type="text"
                  required
                  value={retProdName}
                  onChange={(e) => setRetProdName(e.target.value)}
                  placeholder="Contoh: Powerbank 20k mati total"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Supplier *</label>
                  <input
                    type="text"
                    required
                    value={retSupplier}
                    onChange={(e) => setRetSupplier(e.target.value)}
                    placeholder="CV. Perkasa"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jumlah (Pcs)</label>
                  <input
                    type="number"
                    min="1"
                    value={retQty}
                    onChange={(e) => setRetQty(Number(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alasan Kerusakan / Klaim</label>
                <input
                  type="text"
                  value={retReason}
                  onChange={(e) => setRetReason(e.target.value)}
                  placeholder="Cacat pabrik, tidak menyala saat unboxing"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewReturnOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold shadow-xs"
                >
                  Simpan Retur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
