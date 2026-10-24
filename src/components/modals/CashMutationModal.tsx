import React, { useState } from 'react';
import { PlusCircle, MinusCircle, X, Wallet, CheckCircle } from 'lucide-react';
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
  const [amount, setAmount] = useState<number>(20000);

  if (!isCashMutationModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    addCashMutation(type, category, description, amount, 'tunai');
    setDescription('');
    setAmount(20000);
    setIsCashMutationModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                type === 'masuk' ? 'bg-emerald-600' : 'bg-red-600'
              }`}
            >
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Catat Mutasi Kas Manual</h3>
              <p className="text-[11px] text-slate-500">
                Saldo Saat Ini: Rp {drawerCashBalance.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCashMutationModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {/* Type Selector (Masuk / Keluar) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setType('keluar');
                setCategory('operasional_keluar');
              }}
              className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                type === 'keluar'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <MinusCircle className="w-3.5 h-3.5" />
              <span>Kas Keluar (-)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('masuk');
                setCategory('modal_shift');
              }}
              className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                type === 'masuk'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Kas Masuk (+)</span>
            </button>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Kategori Keperluan</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CashMutationCategory)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              {type === 'keluar' ? (
                <>
                  <option value="belanja_stok">Belanja / Restok Barang Dagangan</option>
                  <option value="operasional_keluar">Biaya Operasional (Makan / Minum Kasir)</option>
                  <option value="operasional_keluar">Beli Perlengkapan (Lakban, Kertas Struk, Plastik)</option>
                  <option value="operasional_keluar">Listrik / Wifi Toko</option>
                  <option value="setor_bank">Setor Tunai ke Bank</option>
                  <option value="lain_lain">Lain-lain / Pengeluaran Darurat</option>
                </>
              ) : (
                <>
                  <option value="modal_shift">Tambah Modal Kas Laci</option>
                  <option value="piutang_masuk">Pembayaran Kasbon Pelanggan</option>
                  <option value="lain_lain">Pemasukan Lainnya</option>
                </>
              )}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Keterangan Singkat *</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'keluar'
                  ? 'Contoh: Beli Kertas Thermal 5 Roll'
                  : 'Contoh: Tambah Uang Pecahan Kecil'
              }
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Nominal (Rp) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400">
                Rp
              </span>
              <input
                type="number"
                step="1000"
                min="1000"
                required
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Quick chips */}
            <div className="grid grid-cols-4 gap-1 mt-1.5">
              {[10000, 25000, 50000, 100000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className="py-1 text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
                >
                  {amt / 1000}k
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCashMutationModalOpen(false)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-4 py-1.5 text-white rounded-lg font-bold shadow-xs ${
                type === 'masuk' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              Simpan Mutasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
