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
  Crown,
  Percent,
  Gift,
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
    shift,
  } = usePOS();

  const isOwner = shift.cashierSlot === 'owner' || shift.role === 'owner';

  const [activeSubTab, setActiveSubTab] = useState<'hutang' | 'retur'>('hutang');
  const [search, setSearch] = useState('');

  // Debt Pay Modal
  const [payingDebt, setPayingDebt] = useState<DebtRecord | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [debtDiscount, setDebtDiscount] = useState<number>(0);

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
    if (!payingDebt) return;
    const baseRemaining = payingDebt.remainingAmount;
    const actualPayAmount = Math.max(0, payAmount);
    const actualDiscount = Math.max(0, debtDiscount);
    const totalCovered = actualPayAmount + actualDiscount;

    if (totalCovered <= 0) {
      alert('Masukkan nominal pembayaran diterima atau tentukan nominal diskon/pemutihan!');
      return;
    }

    if (actualPayAmount === 0 && actualDiscount >= baseRemaining) {
      if (!isOwner) {
        alert('⚠️ Pemutihan Piutang 100% (Rp 0) hanya diizinkan untuk OWNER yang sedang bertugas!');
        return;
      }
    }

    payDebt(payingDebt.id, actualPayAmount, actualDiscount);
    setPayingDebt(null);
    setPayAmount(0);
    setDebtDiscount(0);
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
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveSubTab('hutang')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 active:scale-95 ${
              activeSubTab === 'hutang'
                ? 'bg-purple-700 text-white shadow-sm font-extrabold ring-1 ring-purple-600'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Piutang / Kasbon Pelanggan</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeSubTab === 'hutang' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
              }`}
            >
              {debts.filter((d) => d.status !== 'lunas').length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('retur')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 active:scale-95 ${
              activeSubTab === 'retur'
                ? 'bg-purple-700 text-white shadow-sm font-extrabold ring-1 ring-purple-600'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Barang Retur Supplier</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeSubTab === 'retur' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {returns.length}
            </span>
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
                                setDebtDiscount(0);
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
      {payingDebt && (() => {
        const baseRemaining = payingDebt.remainingAmount;
        const cleanRemaining = Math.max(0, baseRemaining - debtDiscount);
        const isFullWriteOff = debtDiscount >= baseRemaining;
        const isZeroPayment = payAmount === 0 && isFullWriteOff;

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-slate-200 space-y-3.5 my-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Pembayaran Piutang Pelanggan</h3>
                    <p className="text-[10.5px] text-slate-500">
                      Pelunasan, cicilan, dan diskon/pemutihan piutang
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPayingDebt(null);
                    setDebtDiscount(0);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePaySubmit} className="space-y-3 text-xs">
                {/* Info Pelanggan & Tagihan */}
                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/80 space-y-1.5 font-mono">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="text-[11px] font-sans text-slate-500">Pelanggan:</span>
                    <span className="font-sans font-black text-slate-900 text-sm">
                      {payingDebt.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Total Piutang Awal:</span>
                    <span className="font-bold">
                      Rp {payingDebt.totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 text-[11px]">
                    <span>Sudah Pernah Dicicil:</span>
                    <span className="font-bold">
                      Rp {payingDebt.paidAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-purple-950 font-black text-xs pt-1 border-t border-purple-200">
                    <span>Sisa Piutang Berjalan:</span>
                    <span>Rp {baseRemaining.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Potongan / Diskon / Pemutihan */}
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-amber-700" />
                      <span>Diskon / Potongan / Pemutihan (Rp):</span>
                    </label>
                    {isOwner ? (
                      <span className="text-[10px] font-extrabold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Crown className="w-3 h-3 text-amber-800" />
                        Akses Owner Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Kasir Shift</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max={baseRemaining}
                      value={debtDiscount || ''}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        const disc = Math.min(baseRemaining, val);
                        setDebtDiscount(disc);
                        setPayAmount(Math.max(0, baseRemaining - disc));
                      }}
                      placeholder="0"
                      className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-lg font-mono font-bold text-xs text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    {debtDiscount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setDebtDiscount(0);
                          setPayAmount(baseRemaining);
                        }}
                        className="px-2 py-1.5 text-[11px] bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg font-bold cursor-pointer transition"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Preset Diskon */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setDebtDiscount(0);
                        setPayAmount(baseRemaining);
                      }}
                      className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition cursor-pointer ${
                        debtDiscount === 0
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                      }`}
                    >
                      0% (Normal)
                    </button>
                    {baseRemaining >= 5000 && (
                      <button
                        type="button"
                        onClick={() => {
                          const disc = Math.min(5000, baseRemaining);
                          setDebtDiscount(disc);
                          setPayAmount(Math.max(0, baseRemaining - disc));
                        }}
                        className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition cursor-pointer ${
                          debtDiscount === 5000
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        Rp 5.000
                      </button>
                    )}
                    {baseRemaining >= 10000 && (
                      <button
                        type="button"
                        onClick={() => {
                          const disc = Math.min(10000, baseRemaining);
                          setDebtDiscount(disc);
                          setPayAmount(Math.max(0, baseRemaining - disc));
                        }}
                        className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition cursor-pointer ${
                          debtDiscount === 10000
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        Rp 10.000
                      </button>
                    )}
                    {baseRemaining >= 20000 && (
                      <button
                        type="button"
                        onClick={() => {
                          const disc = Math.min(20000, baseRemaining);
                          setDebtDiscount(disc);
                          setPayAmount(Math.max(0, baseRemaining - disc));
                        }}
                        className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition cursor-pointer ${
                          debtDiscount === 20000
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        Rp 20.000
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const half = Math.round(baseRemaining * 0.5);
                        setDebtDiscount(half);
                        setPayAmount(Math.max(0, baseRemaining - half));
                      }}
                      className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition cursor-pointer ${
                        debtDiscount === Math.round(baseRemaining * 0.5) && debtDiscount > 0
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                      }`}
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isOwner) {
                          alert('⚠️ Pemutihan Piutang 100% (Rp 0) hanya diizinkan untuk OWNER yang sedang bertugas!');
                          return;
                        }
                        setDebtDiscount(baseRemaining);
                        setPayAmount(0);
                      }}
                      className={`px-2 py-0.5 rounded text-[10.5px] font-black transition cursor-pointer flex items-center gap-1 ${
                        isFullWriteOff
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-xs ring-1 ring-amber-600'
                          : 'bg-amber-100 border border-amber-400 text-amber-900 hover:bg-amber-200'
                      }`}
                      title="Pemutihan piutang khusus Owner"
                    >
                      <Crown className="w-3 h-3 text-amber-950" />
                      <span>👑 100% Pemutihan (Rp 0 - Owner)</span>
                    </button>
                  </div>

                  {debtDiscount > 0 && (
                    <div className="flex justify-between items-center text-[11px] font-mono font-bold text-amber-900 pt-1 border-t border-amber-200/80">
                      <span>Sisa Bersih Ditagihkan:</span>
                      <span className="text-xs font-black">
                        Rp {cleanRemaining.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Input Pembayaran Diterima */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-[11px] block">
                      Nominal Pembayaran Diterima (Rp) *
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPayAmount(cleanRemaining)}
                        className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded cursor-pointer transition"
                      >
                        Bayar Pas (Rp {cleanRemaining.toLocaleString('id-ID')})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayAmount(0)}
                        className="text-[10px] font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 px-1.5 py-0.5 rounded cursor-pointer transition"
                      >
                        Nol (0)
                      </button>
                    </div>
                  </div>

                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={payAmount === 0 ? (isZeroPayment ? 0 : '') : payAmount}
                    onChange={(e) => setPayAmount(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="Masukkan nominal bayar..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />

                  {/* Summary Result */}
                  <div className="p-2 bg-slate-100 rounded-lg text-[10.5px] font-mono space-y-0.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Uang Masuk ke Laci Kas:</span>
                      <span className="font-bold text-emerald-700">
                        Rp {payAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Status Setelah Transaksi:</span>
                      <span className="font-bold">
                        {payAmount >= cleanRemaining ? (
                          <span className="text-emerald-700 uppercase font-black">
                            LUNAS {isZeroPayment ? '(PEMUTIHAN OWNER)' : ''}
                          </span>
                        ) : (
                          <span className="text-rose-600">
                            Masih Ada Sisa Rp {Math.max(0, cleanRemaining - payAmount).toLocaleString('id-ID')}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setPayingDebt(null);
                      setDebtDiscount(0);
                    }}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-semibold cursor-pointer"
                  >
                    Batal
                  </button>

                  {isZeroPayment && isOwner ? (
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer text-xs transition"
                    >
                      <Crown className="w-4 h-4 text-amber-950" />
                      <span>👑 Pemutihan Piutang Rp 0 & Lunas (Owner Bebas)</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs cursor-pointer text-xs transition"
                    >
                      Proses Bayar Masuk Kas
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        );
      })()}

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
                  step="any"
                  min="0"
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
