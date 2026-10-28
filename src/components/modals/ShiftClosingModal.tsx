import React, { useState } from 'react';
import {
  Power,
  X,
  Wallet,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  ShieldCheck,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';

export const ShiftClosingModal: React.FC = () => {
  const {
    isShiftModalOpen,
    setIsShiftModalOpen,
    shift,
    drawerCashBalance,
    closeShiftDrawer,
    openNewShift,
  } = usePOS();

  const [actualCash, setActualCash] = useState<number>(drawerCashBalance);
  const [closingNotes, setClosingNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // New shift form
  const [newCashierName, setNewCashierName] = useState('Siti (Kasir Sore)');
  const [newStartingCash, setNewStartingCash] = useState<number>(500000);

  if (!isShiftModalOpen) return null;

  const difference = actualCash - drawerCashBalance;

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    closeShiftDrawer(actualCash, closingNotes);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsShiftModalOpen(false);
    }, 1500);
  };

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    openNewShift(newStartingCash, newCashierName);
    setIsShiftModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center">
              <Power className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {shift.isOpen ? 'Rekonsiliasi & Tutup Shift Kasir' : 'Buka Shift Kasir Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Ju-Fat Cell · Shift & Cash Drawer Control
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsShiftModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {shift.isOpen ? (
          /* Form Tutup Shift */
          <form onSubmit={handleCloseShift} className="space-y-4 text-xs">
            {isSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Shift Berhasil Ditutup & Rekonsiliasi Kas Disimpan!</span>
              </div>
            )}

            {/* Current Shift Summary */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Shift Aktif:</span>
                <span className="font-bold text-slate-900">{shift.shiftName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Petugas Kasir:</span>
                <span className="font-semibold text-slate-800">{shift.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kas Awal:</span>
                <span className="font-mono">Rp {shift.startingCash.toLocaleString('id-ID')}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold">
                <span className="text-slate-800">Saldo Kas Laci (Menurut Sistem):</span>
                <span className="text-sm font-extrabold text-emerald-900 font-mono">
                  Rp {drawerCashBalance.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Actual Physical Cash Counted */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Uang Fisik Aktual di Laci (Hasil Hitungan Manual) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={actualCash}
                  onChange={(e) => setActualCash(Number(e.target.value) || 0)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  placeholder="Berapa saja boleh, cth: 483250"
                />
              </div>
            </div>

            {/* Variance indicator */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between font-mono font-bold ${
                difference === 0
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : difference > 0
                  ? 'bg-blue-50 text-blue-900 border-blue-200'
                  : 'bg-red-50 text-red-900 border-red-200'
              }`}
            >
              <span>Selisih Kas:</span>
              <span className="text-sm">
                {difference === 0
                  ? 'Rp 0 (PAS / Tepat)'
                  : difference > 0
                  ? `+Rp ${difference.toLocaleString('id-ID')} (Lebih)`
                  : `-Rp ${Math.abs(difference).toLocaleString('id-ID')} (Kurang)`}
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Catatan Serah Terima / Keterangan Selisih
              </label>
              <textarea
                rows={2}
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Contoh: Kas fisik pas, modal laci disiapkan Rp 500.000 untuk shift sore..."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold shadow-md shadow-red-950/20"
              >
                Konfirmasi Tutup Shift
              </button>
            </div>
          </form>
        ) : (
          /* Form Buka Shift Baru */
          <form onSubmit={handleOpenShift} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
              <span className="font-bold block">Shift Sebelumnya Telah Ditutup</span>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Silakan masukkan nama kasir bertugas dan modal kas awal untuk memulai shift baru.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Petugas Kasir *</label>
              <input
                type="text"
                required
                value={newCashierName}
                onChange={(e) => setNewCashierName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Modal Kas Awal Laci (Rp) *</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={newStartingCash}
                onChange={(e) => setNewStartingCash(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                placeholder="Bisa angka berapa saja, cth: 450500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-md"
              >
                Mulai Shift Baru
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
