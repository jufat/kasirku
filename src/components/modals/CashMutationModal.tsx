import React, { useState } from 'react';
import { PlusCircle, MinusCircle, X, Wallet, CheckCircle, RotateCcw, Coins } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { CashMutationCategory } from '../../types/pos';

export const CashMutationModal: React.FC = () => {
  const {
    isCashMutationModalOpen,
    setIsCashMutationModalOpen,
    addCashMutation,
    drawerCashBalance,
  } = usePOS();

  const [type, setType] = useState<'masuk' | 'keluar'>('keluar');
  const [category, setCategory] = useState<CashMutationCategory>('operasional_keluar');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(25000);

  if (!isCashMutationModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    addCashMutation(type, category, description.trim(), amount, 'tunai');
    setDescription('');
    setAmount(25000);
    setIsCashMutationModalOpen(false);
  };

  const simulatedNextBalance =
    type === 'masuk' ? drawerCashBalance + (amount || 0) : drawerCashBalance - (amount || 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div
          className={`p-4 text-white flex items-center justify-between ${
            type === 'masuk'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
              : 'bg-gradient-to-r from-rose-600 to-red-600'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold leading-tight">
                {type === 'masuk' ? 'Catat Kas Masuk (+)' : 'Catat Kas Keluar (-)'}
              </h3>
              <p className="text-[11px] text-white/80">
                Saldo Laci: Rp {drawerCashBalance.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCashMutationModalOpen(false)}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
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
                  <option value="setor_bank">Setor Tunai ke Bank</option>
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
              <span>Saldo Laci Sekarang:</span>
              <span className="font-mono">Rp {drawerCashBalance.toLocaleString('id-ID')}</span>
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
              <span>Estimasi Saldo Baru:</span>
              <span className="font-mono text-emerald-800 font-black">
                Rp {simulatedNextBalance.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCashMutationModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
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
