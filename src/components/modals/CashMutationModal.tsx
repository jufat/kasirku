import React, { useState } from 'react';
import {
  PlusCircle,
  MinusCircle,
  X,
  Wallet,
  CheckCircle,
  Coins,
  ArrowRightLeft,
  Building2,
  ShoppingCart,
  CreditCard,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { CashMutationCategory } from '../../types/pos';

export const CashMutationModal: React.FC = () => {
  const {
    isCashMutationModalOpen,
    setIsCashMutationModalOpen,
    addCashMutation,
    drawerCashBalance,
    digitalBalance,
    lastSyncEvent,
    mutations,
  } = usePOS();

  const [type, setType] = useState<'masuk' | 'keluar'>('keluar');
  const [category, setCategory] = useState<CashMutationCategory>('operasional_keluar');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(25000);
  const [showAutoSyncHistory, setShowAutoSyncHistory] = useState(true);

  if (!isCashMutationModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    addCashMutation(type, category, description.trim(), amount, 'tunai');
    setDescription('');
    setAmount(25000);
    setIsCashMutationModalOpen(false);
  };

  const simulatedNextDrawerBalance =
    type === 'masuk' ? drawerCashBalance + (amount || 0) : drawerCashBalance - (amount || 0);

  // Filter 4 latest auto-journaled mutations from Kasir & ATM Mini / Perbankan
  const recentAutoSyncedMutations = mutations
    .filter(
      (m) =>
        m.category === 'penjualan_pos' ||
        m.category === 'jasa_transfer' ||
        m.category === 'pulsa_ppob' ||
        m.category === 'service_hp' ||
        m.category === 'percetakan'
    )
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 my-auto">
        {/* Header */}
        <div
          className={`p-4 text-white flex items-center justify-between ${
            type === 'masuk'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
              : 'bg-gradient-to-r from-rose-600 to-red-600'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-bold shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold leading-tight">
                {type === 'masuk' ? 'Catat Kas Masuk (+)' : 'Catat Kas Keluar (-)'}
              </h3>
              <p className="text-[11px] text-white/90 font-mono mt-0.5">
                Kas Laci: <strong>Rp {drawerCashBalance.toLocaleString('id-ID')}</strong> · Bank:{' '}
                <strong>Rp {digitalBalance.toLocaleString('id-ID')}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCashMutationModalOpen(false)}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-Time Auto-Sync Notification & Live Pulse Badge */}
        <div className="bg-emerald-50/90 border-b border-emerald-200 px-3.5 py-2 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="font-bold text-emerald-950 text-[11px] truncate">
              Auto-Sync Aktif: Terhubung langsung ke Kasir POS & ATM Mini
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-white/80 px-2 py-0.5 rounded border border-emerald-300 shrink-0">
            Real-Time
          </span>
        </div>

        {/* Flash Event Banner if last transaction synced recently */}
        {lastSyncEvent && (
          <div className="bg-sky-50 border-b border-sky-200 px-3.5 py-2 text-[11px] text-sky-950 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <ArrowRightLeft className="w-3.5 h-3.5 text-sky-700 shrink-0" />
              <span className="truncate">
                <strong>{lastSyncEvent.source === 'atm_mini' ? 'ATM Mini' : lastSyncEvent.source === 'kasir' ? 'Kasir POS' : 'Mutasi'}:</strong>{' '}
                {lastSyncEvent.actionTitle} ({lastSyncEvent.customerName})
              </span>
            </div>
            <span
              className={`font-mono font-bold shrink-0 ${
                lastSyncEvent.drawerCashDelta > 0
                  ? 'text-emerald-700'
                  : lastSyncEvent.drawerCashDelta < 0
                  ? 'text-rose-700'
                  : 'text-slate-600'
              }`}
            >
              {lastSyncEvent.drawerCashDelta !== 0 && (
                <>
                  {lastSyncEvent.drawerCashDelta > 0 ? '+' : ''}
                  Rp {lastSyncEvent.drawerCashDelta.toLocaleString('id-ID')}
                </>
              )}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Type Selector (Masuk / Keluar) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setType('keluar');
                setCategory('operasional_keluar');
              }}
              className={`py-2 rounded-xl font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                type === 'keluar'
                  ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-400/30 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MinusCircle className="w-4 h-4 text-rose-600" />
              <span>Kas Keluar (-)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('masuk');
                setCategory('modal_shift');
              }}
              className={`py-2 rounded-xl font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                type === 'masuk'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-400/30 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Kas Masuk (+)</span>
            </button>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Kategori Keperluan:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CashMutationCategory)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {type === 'keluar' ? (
                <>
                  <option value="operasional_keluar">Biaya Operasional (Makan/Minum Kasir)</option>
                  <option value="belanja_stok">Belanja / Restok Barang Dagangan</option>
                  <option value="operasional_keluar">Perlengkapan Toko (Lakban, Thermal, Plastik)</option>
                  <option value="operasional_keluar">Listrik / Wifi Toko</option>
                  <option value="setor_bank">Setor Tunai Laci ke Bank (Kas Laci - / Saldo Bank +)</option>
                  <option value="lain_lain">Lain-lain / Keperluan Darurat (Non-Bulat)</option>
                </>
              ) : (
                <>
                  <option value="modal_shift">Tambah Modal Kas Laci</option>
                  <option value="piutang_masuk">Pembayaran Kasbon / Piutang Pelanggan</option>
                  <option value="lain_lain">Pemasukan Kas Lainnya</option>
                </>
              )}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Keterangan Singkat: *</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'keluar'
                  ? 'Contoh: Beli bensin/snack Rp 13.500 atau lakban Rp 7.250'
                  : 'Contoh: Tambah uang kembalian pecahan receh'
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          {/* Dynamic Amount Input (Bebas Angka Berapa Saja, Tidak Wajib Bulat) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">
                Nominal Kas (Rp): <span className="text-slate-400 font-normal">(bisa angka berapa saja)</span> *
              </label>
              {amount > 0 && (
                <span className="font-mono font-black text-teal-900 text-xs bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Rp {amount.toLocaleString('id-ID')}
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-base text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Tulis angka berapa saja, cth: 13750..."
              />
            </div>

            {/* Quick Helper Chips: Uang Receh & Non-Bulat */}
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span className="flex items-center gap-1">
                  <Coins className="w-3 h-3 text-amber-500" />
                  Tambah Cepat Uang Pecahan:
                </span>
                <button
                  type="button"
                  onClick={() => setAmount(0)}
                  className="text-rose-600 hover:underline cursor-pointer font-bold"
                >
                  Reset 0
                </button>
              </div>

              {/* Pecahan Receh / Non-Bulat */}
              <div className="grid grid-cols-4 gap-1">
                {[500, 1000, 2000, 5000].map((coin) => (
                  <button
                    key={coin}
                    type="button"
                    onClick={() => setAmount((prev) => (prev || 0) + coin)}
                    className="py-1 text-[11px] font-mono font-bold bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg transition cursor-pointer"
                    title={`Tambah Rp ${coin.toLocaleString('id-ID')}`}
                  >
                    +{coin >= 1000 ? `${coin / 1000}k` : coin}
                  </button>
                ))}
              </div>

              {/* Pecahan Besar */}
              <div className="grid grid-cols-4 gap-1">
                {[10000, 20000, 50000, 100000].map((note) => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => setAmount((prev) => (prev || 0) + note)}
                    className="py-1 text-[11px] font-mono font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                  >
                    +{note / 1000}k
                  </button>
                ))}
              </div>

              {type === 'keluar' && drawerCashBalance > 0 && (
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAmount(drawerCashBalance);
                      setCategory('setor_bank');
                      setDescription('Setor seluruh saldo fisik laci ke bank');
                    }}
                    className="w-full py-1 text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg border border-amber-300 transition cursor-pointer flex items-center justify-center gap-1.5"
                    title="Isi nominal sebesar total saldo laci untuk setor bank"
                  >
                    <span>Isi Seluruh Saldo Laci</span>
                    <span className="font-mono font-black">(Rp {drawerCashBalance.toLocaleString('id-ID')})</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Simulation Preview Card */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="flex justify-between items-center text-slate-500 text-[11px]">
              <span>Saldo Laci Saat Ini (Live):</span>
              <span className="font-mono font-bold text-slate-800">Rp {drawerCashBalance.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700 text-[11px]">
              <span>Mutasi {type === 'masuk' ? '(+)' : '(-)'}:</span>
              <span
                className={`font-mono font-bold ${
                  type === 'masuk' ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {type === 'masuk' ? '+' : '-'}Rp {(amount || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between items-center font-bold text-slate-900 border-t border-slate-200 pt-1 text-xs">
              <span>Estimasi Saldo Laci Baru:</span>
              <span className="font-mono text-emerald-800 font-black">
                Rp {simulatedNextDrawerBalance.toLocaleString('id-ID')}
              </span>
            </div>
            {category === 'setor_bank' && type === 'keluar' && (
              <div className="flex justify-between items-center text-sky-800 pt-0.5 text-[11px] border-t border-dashed border-slate-200">
                <span>Saldo Rekening Bank Bertambah:</span>
                <span className="font-mono font-extrabold text-sky-700">
                  Rp {(digitalBalance + (amount || 0)).toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>

          {/* Section: Mutasi Otomatis Terbaru dari Kasir & ATM Mini (Live Feed) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setShowAutoSyncHistory(!showAutoSyncHistory)}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Mutasi Otomatis Terbaru (Kasir & ATM Mini)</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <span className="text-[10px] font-mono">Live Sync</span>
                {showAutoSyncHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showAutoSyncHistory && (
              <div className="p-2.5 divide-y divide-slate-100 text-[11px]">
                {recentAutoSyncedMutations.length === 0 ? (
                  <p className="text-center text-slate-400 py-2">Belum ada mutasi otomatis</p>
                ) : (
                  recentAutoSyncedMutations.map((m) => (
                    <div key={m.id} className="py-1.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              m.category === 'penjualan_pos'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.category === 'jasa_transfer'
                                ? 'bg-pink-100 text-pink-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {m.category === 'penjualan_pos' ? 'Kasir' : 'ATM Mini'}
                          </span>
                          <span className="font-semibold text-slate-800 truncate text-[11px]">
                            {m.description.slice(0, 36)}...
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {m.timestamp} · Saldo Laci: Rp {m.runningCashBalance.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <span
                        className={`font-mono font-bold shrink-0 text-xs ${
                          m.paymentMethod === 'non_tunai'
                            ? 'text-sky-700'
                            : m.type === 'masuk'
                            ? 'text-emerald-700'
                            : 'text-rose-600'
                        }`}
                      >
                        {m.paymentMethod === 'non_tunai' ? '[Digital] ' : ''}
                        {m.type === 'masuk' ? '+' : '-'}Rp {m.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCashMutationModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-white rounded-xl font-extrabold shadow-sm flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                type === 'masuk'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/20'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-900/20'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Simpan Mutasi Kas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

