import React, { useState, useEffect, useRef } from 'react';
import {
  Power,
  X,
  Wallet,
  CheckCircle,
  AlertTriangle,
  User,
  Crown,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Banknote,
  Sun,
  Moon,
  Clock,
  ShieldCheck,
  DoorOpen,
  DoorClosed,
  Check,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { CashierSlot } from '../../types/pos';

export const ShiftClosingModal: React.FC = () => {
  const {
    isShiftModalOpen,
    setIsShiftModalOpen,
    shift,
    drawerCashBalance,
    closeShiftDrawer,
    openNewShift,
    cashierProfiles,
    standardDrawerCash,
    setStandardDrawerCash,
  } = usePOS();

  // Mode ketika shift sedang buka: 'tutup_toko' (malam) atau 'serah_terima' (siang)
  const [closingMode, setClosingMode] = useState<'tutup_toko' | 'serah_terima'>('tutup_toko');

  // Cash Physical Reconciliation
  const [actualCash, setActualCash] = useState<number>(drawerCashBalance);
  const [closingNotes, setClosingNotes] = useState('');

  // Target Next Officer Selection (Hanya 3 Pilihan: Shift 1, Shift 2, Owner)
  const [nextSlot, setNextSlot] = useState<CashierSlot>('kasir_1');
  const [candidateCashierName, setCandidateCashierName] = useState('');
  const [isShiftSwapped, setIsShiftSwapped] = useState(false);

  // Deposit customization
  const [customDepositAmount, setCustomDepositAmount] = useState<number | null>(null);
  const [isEditingStandardCash, setIsEditingStandardCash] = useState(false);
  const [tempStandardCash, setTempStandardCash] = useState<number>(standardDrawerCash);

  // State for Opening Shift (ketika !shift.isOpen)
  const [openSlot, setOpenSlot] = useState<CashierSlot>('kasir_1');
  const [openCashierName, setOpenCashierName] = useState('');
  const [isOpenShiftSwapped, setIsOpenShiftSwapped] = useState(false);
  const [openStartingCash, setOpenStartingCash] = useState<number>(drawerCashBalance);
  const [openStartTime, setOpenStartTime] = useState<string>('');

  // Helper untuk format waktu real-time
  const getFormattedNow = () => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${formattedTime} WIB · ${formattedDate}`;
  };

  const wasOpenRef = useRef(false);

  // Sync state only when modal transitions from closed to open
  useEffect(() => {
    const justOpened = isShiftModalOpen && !wasOpenRef.current;
    wasOpenRef.current = isShiftModalOpen;
    if (justOpened) {
      setActualCash(drawerCashBalance);
      setClosingNotes('');
      setIsShiftSwapped(false);
      setCustomDepositAmount(null);
      setIsEditingStandardCash(false);
      setTempStandardCash(standardDrawerCash);

      if (shift.isOpen) {
        if (shift.cashierSlot === 'kasir_2') {
          setClosingMode('tutup_toko');
          setNextSlot('kasir_1');
          setCandidateCashierName(cashierProfiles.kasir_1?.name || '');
        } else if (shift.cashierSlot === 'kasir_1') {
          setClosingMode('serah_terima');
          setNextSlot('kasir_2');
          setCandidateCashierName(cashierProfiles.kasir_2?.name || '');
        } else {
          setClosingMode('tutup_toko');
          setNextSlot('kasir_1');
          setCandidateCashierName(cashierProfiles.kasir_1?.name || '');
        }
      } else {
        setOpenSlot('kasir_1');
        setOpenCashierName(cashierProfiles.kasir_1?.name || 'Agus (Kasir Pagi)');
        setIsOpenShiftSwapped(false);
        setOpenStartingCash(drawerCashBalance);
        setOpenStartTime(getFormattedNow());
      }
    }
  }, [
    isShiftModalOpen,
    shift.isOpen,
    shift.cashierSlot,
    drawerCashBalance,
    cashierProfiles,
    standardDrawerCash,
  ]);

  if (!isShiftModalOpen) return null;

  const difference = actualCash - drawerCashBalance;

  // Hitungan kalkulasi setoran standar:
  const calculatedDeposit = Math.max(0, actualCash - standardDrawerCash);
  const effectiveDepositAmount =
    customDepositAmount !== null ? Math.max(0, customDepositAmount) : calculatedDeposit;
  const remainingInDrawer = Math.max(0, actualCash - effectiveDepositAmount);

  // Penentuan apakah closing ini disarankan hitungan setor:
  const isDepositSuggested =
    closingMode === 'tutup_toko' ||
    (shift.cashierSlot === 'kasir_1' && nextSlot === 'owner') ||
    shift.cashierSlot === 'kasir_2';

  const handleSelectNextSlot = (slot: CashierSlot) => {
    setNextSlot(slot);
    if (!isShiftSwapped) {
      setCandidateCashierName(cashierProfiles[slot]?.name || '');
    }
  };

  const handleSelectOpenSlot = (slot: CashierSlot) => {
    setOpenSlot(slot);
    if (!isOpenShiftSwapped) {
      setOpenCashierName(cashierProfiles[slot]?.name || '');
    }
  };

  const handleSaveStandardDrawerCash = () => {
    setStandardDrawerCash(tempStandardCash);
    setIsEditingStandardCash(false);
  };

  // 1. Eksekusi Tutup Toko Malam (TUTUP REGISTER, TIDAK LANGSUNG BUKA SHIFT BARU)
  const handleExecuteNightClose = (e: React.FormEvent) => {
    e.preventDefault();

    const depositOptions =
      effectiveDepositAmount > 0
        ? {
            depositAmount: effectiveDepositAmount,
            depositRecipient: 'Owner / Brankas Konter',
            remainingCashForDrawer: remainingInDrawer,
          }
        : undefined;

    closeShiftDrawer(actualCash, closingNotes || 'Penutupan kasir malam (Toko Tutup)', depositOptions, 'tutup_toko');
    setIsShiftModalOpen(false);
  };

  // 2. Eksekusi Ganti Shift Langsung (Siang Hari - Handover Langsung)
  const handleExecuteHandover = (e: React.FormEvent) => {
    e.preventDefault();

    const finalName =
      candidateCashierName.trim() || cashierProfiles[nextSlot]?.name || 'Petugas Kasir';

    const defaultTitle =
      nextSlot === 'kasir_1'
        ? 'Shift 1 (Pagi)'
        : nextSlot === 'kasir_2'
        ? 'Shift 2 (Sore)'
        : 'Shift Fleksibel (Owner)';

    if (isDepositSuggested && effectiveDepositAmount > 0 && nextSlot === 'owner') {
      closeShiftDrawer(
        actualCash,
        closingNotes || 'Serah terima shift ke Owner dengan setoran',
        {
          depositAmount: effectiveDepositAmount,
          depositRecipient: `Owner (${cashierProfiles.owner.name})`,
          remainingCashForDrawer: remainingInDrawer,
        },
        'serah_terima'
      );

      openNewShift(remainingInDrawer, finalName, nextSlot, defaultTitle, isShiftSwapped);
    } else {
      closeShiftDrawer(actualCash, closingNotes || 'Serah terima laci siang hari', undefined, 'serah_terima');
      openNewShift(actualCash, finalName, nextSlot, defaultTitle, isShiftSwapped);
    }

    setIsShiftModalOpen(false);
  };

  // 3. Eksekusi Buka Shift Baru (Mulai Shift Pagi dari keadaan register tutup)
  const handleExecuteOpenShift = (e: React.FormEvent) => {
    e.preventDefault();

    const finalName =
      openCashierName.trim() || cashierProfiles[openSlot]?.name || 'Petugas Kasir';

    const defaultTitle =
      openSlot === 'kasir_1'
        ? 'Shift 1 (Pagi)'
        : openSlot === 'kasir_2'
        ? 'Shift 2 (Sore)'
        : 'Shift Fleksibel (Owner)';

    const startingCash = openStartingCash >= 0 ? openStartingCash : drawerCashBalance;
    const finalStartTime = openStartTime.trim() || getFormattedNow();

    openNewShift(startingCash, finalName, openSlot, defaultTitle, isOpenShiftSwapped, finalStartTime);
    setIsShiftModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-slate-200 space-y-3.5 my-auto max-h-[96vh] flex flex-col">
        {/* =================================================================== */}
        {/* HEADER MODAL */}
        {/* =================================================================== */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-xs shrink-0 ${
                !shift.isOpen
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600'
                  : closingMode === 'tutup_toko'
                  ? 'bg-gradient-to-br from-indigo-700 to-slate-800'
                  : 'bg-gradient-to-br from-teal-600 to-emerald-600'
              }`}
            >
              {!shift.isOpen ? (
                <Sun className="w-5 h-5 text-amber-100" />
              ) : closingMode === 'tutup_toko' ? (
                <Moon className="w-5 h-5 text-amber-300" />
              ) : (
                <Power className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                {!shift.isOpen
                  ? '☀️ Buka Kasir / Mulai Shift Pagi'
                  : closingMode === 'tutup_toko'
                  ? '🌙 Tutup Kasir Malam (Toko Tutup)'
                  : '🔄 Serah Terima Shift Langsung (Siang)'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {!shift.isOpen
                  ? 'Konter buka operasional hari baru · Jam buka pagi tercatat otomatis'
                  : 'Operasional tidak 24 jam · Jam tutup malam tercatat presisi di sistem'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsShiftModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 rounded-lg cursor-pointer"
            title="Tutup"
          >
            ✕
          </button>
        </div>

        {/* =================================================================== */}
        {/* BODY A: JIKA REGISTER SEDANG TUTUP -> TAMPILKAN FORM BUKA SHIFT PAGI */}
        {/* =================================================================== */}
        {!shift.isOpen ? (
          <form onSubmit={handleExecuteOpenShift} className="space-y-3.5 text-xs overflow-y-auto pr-0.5">
            {/* Banner Audit Penutupan Semalam */}
            <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-amber-300" />
                  Catatan Tutup Shift Malam Terakhir:
                </span>
                <span className="text-[9.5px] bg-white/15 px-2 py-0.5 rounded font-mono">
                  Register Saat Ini: TUTUP
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Ditutup Semalam Oleh:</span>
                  <span className="font-extrabold text-white flex items-center gap-1">
                    <User className="w-3 h-3 text-teal-400" />
                    {shift.closedBy || 'Siti (Kasir Sore)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Jam Tutup Malam:</span>
                  <span className="font-mono font-bold text-amber-200">
                    {shift.closedAt || '22:15 WIB · Semalam'}
                  </span>
                </div>
              </div>
              <div className="pt-1.5 border-t border-white/10 flex justify-between items-baseline font-bold text-xs">
                <span className="text-slate-300">Sisa Uang Laci Ditinggal Semalam:</span>
                <span className="text-sm font-extrabold text-emerald-400 font-mono">
                  Rp {drawerCashBalance.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Input 1: Jam Mulai Shift Pagi */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-extrabold text-slate-800 text-xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-700" />
                  <span>1. Waktu Buka Kasir Pagi:</span>
                </label>
                <button
                  type="button"
                  onClick={() => setOpenStartTime(getFormattedNow())}
                  className="text-[10px] text-teal-700 underline font-semibold cursor-pointer"
                >
                  Ambil Jam Sekarang
                </button>
              </div>
              <input
                type="text"
                required
                value={openStartTime}
                onChange={(e) => setOpenStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono font-bold text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                placeholder="Contoh: 08:00 WIB · 9 Nov 2026"
              />
              <p className="text-[10.5px] text-slate-500">
                Waktu ini akan tercatat dalam log pembukaan shift dan struk transaksi pelanggan.
              </p>
            </div>

            {/* Input 2: Pilih Slot Petugas Shift Pagi */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <label className="font-extrabold text-slate-900 text-xs">
                2. Pilih Petugas yang Menjaga Pagi Ini:
              </label>

              <div className="grid grid-cols-3 gap-2">
                {/* Slot Kasir 1 (Default Pagi) */}
                <button
                  type="button"
                  onClick={() => handleSelectOpenSlot('kasir_1')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    openSlot === 'kasir_1'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 text-emerald-950 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9.5px] font-black bg-emerald-700 text-white px-1.5 py-0.2 rounded font-mono">
                      SHIFT 1
                    </span>
                    {openSlot === 'kasir_1' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <div className="font-extrabold text-xs truncate">
                    {cashierProfiles.kasir_1?.name || 'Kasir 1'}
                  </div>
                  <div className="text-[9.5px] text-emerald-700 font-semibold mt-0.5">Shift Pagi (Standar)</div>
                </button>

                {/* Slot Kasir 2 */}
                <button
                  type="button"
                  onClick={() => handleSelectOpenSlot('kasir_2')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    openSlot === 'kasir_2'
                      ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-400 text-teal-950 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9.5px] font-black bg-teal-700 text-white px-1.5 py-0.2 rounded font-mono">
                      SHIFT 2
                    </span>
                    {openSlot === 'kasir_2' && <CheckCircle className="w-3.5 h-3.5 text-teal-600" />}
                  </div>
                  <div className="font-extrabold text-xs truncate">
                    {cashierProfiles.kasir_2?.name || 'Kasir 2'}
                  </div>
                  <div className="text-[9.5px] text-slate-500 mt-0.5">Shift Sore</div>
                </button>

                {/* Slot Owner */}
                <button
                  type="button"
                  onClick={() => handleSelectOpenSlot('owner')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    openSlot === 'owner'
                      ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400 text-amber-950 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9.5px] font-black bg-amber-500 text-amber-950 px-1.5 py-0.2 rounded font-mono flex items-center gap-0.5">
                      <Crown className="w-2.5 h-2.5" /> OWNER
                    </span>
                    {openSlot === 'owner' && <CheckCircle className="w-3.5 h-3.5 text-amber-600" />}
                  </div>
                  <div className="font-extrabold text-xs truncate">
                    {cashierProfiles.owner?.name || 'Owner'}
                  </div>
                  <div className="text-[9.5px] text-slate-500 mt-0.5">Diskon 100% / Rp 0</div>
                </button>
              </div>
            </div>

            {/* Input 3: Nama Kasir & Tukar Sip */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-slate-800 text-xs">
                  3. Nama Petugas yang Berjaga:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isOpenShiftSwapped;
                    setIsOpenShiftSwapped(nextVal);
                    if (!nextVal) {
                      setOpenCashierName(cashierProfiles[openSlot]?.name || '');
                    }
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                    isOpenShiftSwapped
                      ? 'bg-amber-400 border-amber-500 text-amber-950 shadow-xs'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{isOpenShiftSwapped ? 'Tukar Sip: AKTIF' : 'Ada Tukar Sip?'}</span>
                </button>
              </div>

              <input
                type="text"
                required
                value={openCashierName}
                onChange={(e) => {
                  setOpenCashierName(e.target.value);
                  setIsOpenShiftSwapped(true);
                }}
                className="w-full px-3 py-1.5 bg-white border-2 border-slate-300 focus:border-teal-500 rounded-xl font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 shadow-xs"
                placeholder="Ketik nama petugas yang berjaga..."
              />
            </div>

            {/* Input 4: Konfirmasi Modal Awal Kas Laci Pagi */}
            <div className="space-y-1 pt-1 border-t border-slate-100">
              <div className="flex justify-between items-baseline">
                <label className="font-extrabold text-slate-800 text-xs">
                  4. Modal Awal Uang Laci Kasir Pagi (Rp):
                </label>
                <span className="text-[10px] text-slate-500">Hitung fisik di laci</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={openStartingCash || ''}
                  onChange={(e) => setOpenStartingCash(Number(e.target.value) || 0)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  placeholder="0"
                />
              </div>
              <p className="text-[10.5px] text-slate-500">
                Otomatis terisi dari sisa kas yang ditinggal semalam (Rp {drawerCashBalance.toLocaleString('id-ID')}). Anda dapat menyesuaikan jika ada tambahan modal receh pagi.
              </p>
            </div>

            {/* Tombol Aksi Buka Kasir */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(false)}
                className="px-3 py-2 text-slate-500 hover:text-slate-700 font-semibold cursor-pointer text-xs"
              >
                Batal
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-teal-600 hover:from-amber-400 hover:to-teal-500 text-white rounded-xl font-extrabold shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 text-xs shadow-amber-900/20"
              >
                <Sun className="w-4 h-4 text-amber-200" />
                <span>☀️ Buka Kasir & Mulai Layanan Shift</span>
              </button>
            </div>
          </form>
        ) : (
          /* =================================================================== */
          /* BODY B: JIKA REGISTER SEDANG BUKA -> TUTUP TOKO MALAM VS GANTI SHIFT */
          /* =================================================================== */
          <div className="space-y-3.5 text-xs overflow-y-auto pr-0.5">
            {/* Status Shift yang Sedang Berjalan */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium text-[11px]">Shift Sedang Berjalan:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${
                    shift.cashierSlot === 'owner'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : shift.cashierSlot === 'kasir_1'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-teal-100 text-teal-900 border border-teal-300'
                  }`}
                >
                  {shift.cashierSlot === 'owner'
                    ? '👑 OWNER'
                    : shift.cashierSlot === 'kasir_1'
                    ? '👤 SHIFT 1 (PAGI)'
                    : '👤 SHIFT 2 (SORE)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">Petugas Bertugas:</span>
                <div className="flex items-center gap-1 font-bold text-slate-900">
                  <User className="w-3 h-3 text-teal-600" />
                  <span>{shift.cashierName}</span>
                  {shift.isSwappedShift && (
                    <span className="text-[9px] bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-bold border border-amber-300">
                      Tukar Sip
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">Jam Buka Shift:</span>
                <span className="font-mono font-bold text-slate-700">{shift.startTime}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 flex justify-between items-baseline font-bold text-xs">
                <span className="text-slate-700">Saldo Kas Laci (Menurut Sistem):</span>
                <span className="text-sm font-extrabold text-emerald-900 font-mono">
                  Rp {drawerCashBalance.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* TAB SELECTOR: Tutup Toko Malam (Standar) vs Ganti Shift Langsung */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setClosingMode('tutup_toko')}
                className={`py-2 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  closingMode === 'tutup_toko'
                    ? 'bg-white text-indigo-950 shadow-xs border border-slate-200 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Moon className={`w-3.5 h-3.5 ${closingMode === 'tutup_toko' ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>🌙 Tutup Toko Malam</span>
              </button>

              <button
                type="button"
                onClick={() => setClosingMode('serah_terima')}
                className={`py-2 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  closingMode === 'serah_terima'
                    ? 'bg-white text-teal-950 shadow-xs border border-slate-200 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${closingMode === 'serah_terima' ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>🔄 Ganti Shift Siang</span>
              </button>
            </div>

            {/* FORM SESUAI PILIHAN MODE */}
            {closingMode === 'tutup_toko' ? (
              /* ============================================================== */
              /* SUB-MODE 1: TUTUP TOKO MALAM (REGISTER OFF, TIDAK LANGSUNG BUKA) */
              /* ============================================================== */
              <form onSubmit={handleExecuteNightClose} className="space-y-3">
                <div className="p-2.5 bg-indigo-50/80 border border-indigo-200 text-indigo-950 rounded-xl text-xs space-y-1">
                  <div className="font-extrabold flex items-center gap-1.5 text-indigo-900">
                    <Moon className="w-4 h-4 text-amber-500" />
                    <span>Konter Tidak 24 Jam · Toko Tutup Malam</span>
                  </div>
                  <p className="text-[11px] text-indigo-900 leading-relaxed">
                    Sistem akan mencatat <strong>jam tutup malam secara presisi</strong> dan mematikan register kasir. Toko tidak akan langsung berubah menjadi kasir pagi. Kasir pagi baru akan membuka kasir besok saat mulai beroperasi.
                  </p>
                </div>

                {/* 1. Hitung Uang Fisik Aktual */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="font-extrabold text-slate-800 text-xs">
                      1. Hitung Uang Fisik Aktual di Laci Kasir: *
                    </label>
                    <span className="text-[10px] text-slate-500">Hitung lembar uang di laci</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={actualCash || ''}
                      onChange={(e) => setActualCash(Number(e.target.value) || 0)}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                      placeholder="0"
                    />
                  </div>

                  {/* Status Selisih Fisik */}
                  <div
                    className={`p-2 rounded-xl border flex items-center justify-between font-mono font-bold text-[11px] ${
                      difference === 0
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : difference > 0
                        ? 'bg-blue-50 text-blue-900 border-blue-200'
                        : 'bg-rose-50 text-rose-900 border-rose-200'
                    }`}
                  >
                    <span>Selisih Fisik Laci:</span>
                    <span>
                      {difference === 0
                        ? 'Rp 0 (Sesuai Fisik Laci)'
                        : difference > 0
                        ? `+Rp ${difference.toLocaleString('id-ID')} (Lebih)`
                        : `-Rp ${Math.abs(difference).toLocaleString('id-ID')} (Kurang)`}
                    </span>
                  </div>
                </div>

                {/* Rincian Setor ke Owner & Sisa Laci */}
                <div className="p-3 bg-white rounded-xl border-2 border-amber-400 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                    <span className="font-extrabold text-amber-950 flex items-center gap-1 text-xs">
                      <Banknote className="w-4 h-4 text-amber-700" /> Rincian Setoran Hasil Penjualan Malam:
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                      Setor ke Owner / Brankas
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Kas Fisik di Laci:</span>
                      <span className="font-mono font-bold text-slate-900">
                        Rp {actualCash.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <div className="flex items-center gap-1">
                        <span>Modal Laci Ditinggal untuk Pagi:</span>
                        <button
                          type="button"
                          onClick={() => setIsEditingStandardCash(!isEditingStandardCash)}
                          className="text-[10px] text-teal-700 underline font-semibold cursor-pointer"
                        >
                          {isEditingStandardCash ? 'Batal' : 'Ubah'}
                        </button>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        -Rp {standardDrawerCash.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {isEditingStandardCash && (
                      <div className="p-2 bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-600 font-bold shrink-0">Set Nominal:</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={tempStandardCash || ''}
                          onChange={(e) => setTempStandardCash(Number(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                        />
                        <button
                          type="button"
                          onClick={handleSaveStandardDrawerCash}
                          className="px-2 py-1 bg-teal-700 text-white rounded text-[10px] font-bold cursor-pointer shrink-0"
                        >
                          Simpan
                        </button>
                      </div>
                    )}

                    <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center font-extrabold text-sm">
                      <span className="text-amber-950">JUMLAH DISETOR KE OWNER:</span>
                      <span className="font-mono text-base text-amber-700">
                        Rp {effectiveDepositAmount.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-emerald-800 font-bold pt-0.5">
                      <span>Sisa Kas Laci Ditinggal di Laci untuk Pagi:</span>
                      <span className="font-mono">Rp {remainingInDrawer.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Catatan Tutup Malam */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                    Catatan Penutupan Malam (Opsional):
                  </label>
                  <input
                    type="text"
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="Contoh: Toko tutup pukul 22:15 WIB, kas fisik cocok, uang disetor ke Owner..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-xs"
                  />
                </div>

                {/* Tombol Aksi Tutup Malam */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsShiftModalOpen(false)}
                    className="px-3 py-2 text-slate-500 hover:text-slate-700 font-semibold cursor-pointer text-xs"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-gradient-to-r from-indigo-700 via-slate-800 to-slate-900 hover:from-indigo-600 hover:to-slate-800 text-white rounded-xl font-extrabold shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 text-xs shadow-slate-900/20"
                  >
                    <Moon className="w-4 h-4 text-amber-400" />
                    <span>
                      🌙 Tutup Kasir Malam (Toko Tutup · Register OFF)
                    </span>
                  </button>
                </div>
              </form>
            ) : (
              /* ============================================================== */
              /* SUB-MODE 2: GANTI SHIFT SIANG LANGSUNG (HANDOVER)               */
              /* ============================================================== */
              <form onSubmit={handleExecuteHandover} className="space-y-3">
                <div className="p-2.5 bg-teal-50/80 border border-teal-200 text-teal-950 rounded-xl text-xs space-y-1">
                  <div className="font-extrabold flex items-center gap-1.5 text-teal-900">
                    <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                    <span>Serah Terima Kasir Siang Hari (Toko Tetap Buka)</span>
                  </div>
                  <p className="text-[11px] text-teal-900 leading-relaxed">
                    Uang laci diserah-terimakan ke petugas berikutnya (misal Shift 1 ke Shift 2). Transaksi langsung berlanjut tanpa mematikan register.
                  </p>
                </div>

                {/* 1. Hitung Uang Fisik Aktual */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="font-extrabold text-slate-800 text-xs">
                      1. Hitung Uang Fisik Aktual di Laci: *
                    </label>
                    <span className="text-[10px] text-slate-500">Hitung bersama kasir pengganti</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={actualCash || ''}
                      onChange={(e) => setActualCash(Number(e.target.value) || 0)}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                      placeholder="0"
                    />
                  </div>

                  <div
                    className={`p-2 rounded-xl border flex items-center justify-between font-mono font-bold text-[11px] ${
                      difference === 0
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : difference > 0
                        ? 'bg-blue-50 text-blue-900 border-blue-200'
                        : 'bg-rose-50 text-rose-900 border-rose-200'
                    }`}
                  >
                    <span>Selisih Fisik Laci:</span>
                    <span>
                      {difference === 0
                        ? 'Rp 0 (Sesuai)'
                        : difference > 0
                        ? `+Rp ${difference.toLocaleString('id-ID')} (Lebih)`
                        : `-Rp ${Math.abs(difference).toLocaleString('id-ID')} (Kurang)`}
                    </span>
                  </div>
                </div>

                {/* 2. Pilih Petugas Pengganti */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <label className="font-extrabold text-slate-900 text-xs">
                    2. Pilih Petugas Pengganti:
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectNextSlot('kasir_1')}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        nextSlot === 'kasir_1'
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 text-emerald-950'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-[9px] font-black bg-emerald-700 text-white px-1 py-0.2 rounded font-mono w-max">
                        SHIFT 1
                      </span>
                      <div className="font-extrabold text-xs truncate mt-1">
                        {cashierProfiles.kasir_1?.name || 'Kasir 1'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectNextSlot('kasir_2')}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        nextSlot === 'kasir_2'
                          ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-400 text-teal-950'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-[9px] font-black bg-teal-700 text-white px-1 py-0.2 rounded font-mono w-max">
                        SHIFT 2
                      </span>
                      <div className="font-extrabold text-xs truncate mt-1">
                        {cashierProfiles.kasir_2?.name || 'Kasir 2'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectNextSlot('owner')}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        nextSlot === 'owner'
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400 text-amber-950'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-[9px] font-black bg-amber-500 text-amber-950 px-1 py-0.2 rounded font-mono w-max">
                        OWNER
                      </span>
                      <div className="font-extrabold text-xs truncate mt-1">
                        {cashierProfiles.owner?.name || 'Owner'}
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. Nama Petugas & Tukar Sip */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-800 text-xs">
                      3. Nama Petugas Pengganti:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !isShiftSwapped;
                        setIsShiftSwapped(nextVal);
                        if (!nextVal) {
                          setCandidateCashierName(cashierProfiles[nextSlot]?.name || '');
                        }
                      }}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                        isShiftSwapped
                          ? 'bg-amber-400 border-amber-500 text-amber-950 shadow-xs'
                          : 'bg-white border-slate-300 text-slate-600'
                      }`}
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{isShiftSwapped ? 'Tukar Sip: AKTIF' : 'Ada Tukar Sip?'}</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    required
                    value={candidateCashierName}
                    onChange={(e) => {
                      setCandidateCashierName(e.target.value);
                      setIsShiftSwapped(true);
                    }}
                    className="w-full px-3 py-1.5 bg-white border-2 border-slate-300 rounded-xl font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Nama kasir pengganti..."
                  />
                </div>

                {/* Tombol Aksi Serah Terima */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsShiftModalOpen(false)}
                    className="px-3 py-2 text-slate-500 hover:text-slate-700 font-semibold cursor-pointer text-xs"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-extrabold shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 text-xs shadow-teal-900/20"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>
                      Serahkan Laci & Buka {nextSlot === 'kasir_1' ? 'Shift 1' : nextSlot === 'kasir_2' ? 'Shift 2' : 'Owner'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
