import React, { useState, useEffect } from 'react';
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
  Building,
  Sliders,
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

  // Cash Physical Reconciliation
  const [actualCash, setActualCash] = useState<number>(drawerCashBalance);
  const [closingNotes, setClosingNotes] = useState('');

  // Target Next Officer Selection (Hanya 3 Pilihan: Shift 1, Shift 2, Owner)
  const [nextSlot, setNextSlot] = useState<CashierSlot>('kasir_2');
  const [candidateCashierName, setCandidateCashierName] = useState('');
  const [isShiftSwapped, setIsShiftSwapped] = useState(false);

  // Deposit customization (bisa override otomatis jika kasir ingin setor nominal berbeda)
  const [customDepositAmount, setCustomDepositAmount] = useState<number | null>(null);
  const [isEditingStandardCash, setIsEditingStandardCash] = useState(false);
  const [tempStandardCash, setTempStandardCash] = useState<number>(standardDrawerCash);

  // Sync state when modal opens
  useEffect(() => {
    if (isShiftModalOpen) {
      setActualCash(drawerCashBalance);
      setClosingNotes('');
      setIsShiftSwapped(false);
      setCustomDepositAmount(null);
      setIsEditingStandardCash(false);
      setTempStandardCash(standardDrawerCash);

      // Rekomendasi otomatis petugas selanjutnya:
      // Jika Shift 1 -> lanjut ke Shift 2
      // Jika Shift 2 -> lanjut ke Shift 1 (untuk besok) atau Owner
      // Jika Owner -> lanjut ke Shift 1
      const initialNextSlot: CashierSlot =
        shift.cashierSlot === 'kasir_1'
          ? 'kasir_2'
          : shift.cashierSlot === 'kasir_2'
          ? 'kasir_1'
          : 'kasir_1';

      setNextSlot(initialNextSlot);
      setCandidateCashierName(cashierProfiles[initialNextSlot]?.name || '');
    }
  }, [isShiftModalOpen, shift.isOpen, shift.cashierSlot, drawerCashBalance, cashierProfiles, standardDrawerCash]);

  if (!isShiftModalOpen) return null;

  const difference = actualCash - drawerCashBalance;

  // Aturan Bisnis Shift:
  // 1. Shift 1 closing -> Shift 2: Uang laci masuk langsung ke laci Shift 2 (TIDAK SETOR)
  // 2. Shift 1 closing -> Owner: Wajib hitungan untuk SETOR ke Owner
  // 3. Shift 2 closing: LANGSUNG hitungan untuk SETOR (akhir hari)
  // 4. Owner closing: Bisa setor atau serahkan langsung
  const isShift1ToShift2 = shift.cashierSlot === 'kasir_1' && nextSlot === 'kasir_2';
  const isShift1ToOwner = shift.cashierSlot === 'kasir_1' && nextSlot === 'owner';
  const isShift2Closing = shift.cashierSlot === 'kasir_2';
  const isOwnerClosing = shift.cashierSlot === 'owner';

  // Penentuan apakah closing ini wajib/disarankan hitungan setor:
  const isDepositMode = isShift1ToOwner || isShift2Closing;

  // Hitungan kalkulasi setoran standar:
  // Total fisik laci dikurangi uang laci yang telah ditentukan
  const calculatedDeposit = Math.max(0, actualCash - standardDrawerCash);
  const effectiveDepositAmount =
    customDepositAmount !== null ? Math.max(0, customDepositAmount) : calculatedDeposit;
  const remainingInDrawer = Math.max(0, actualCash - effectiveDepositAmount);

  const handleSelectNextSlot = (slot: CashierSlot) => {
    setNextSlot(slot);
    if (!isShiftSwapped) {
      setCandidateCashierName(cashierProfiles[slot]?.name || '');
    }
  };

  const handleSaveStandardDrawerCash = () => {
    setStandardDrawerCash(tempStandardCash);
    setIsEditingStandardCash(false);
  };

  // Eksekusi Tutup Shift & Lanjut Buka Shift Baru
  const handleExecuteShiftTransition = (e: React.FormEvent) => {
    e.preventDefault();

    const finalName =
      candidateCashierName.trim() || cashierProfiles[nextSlot]?.name || 'Petugas Kasir';

    const defaultTitle =
      nextSlot === 'kasir_1'
        ? 'Shift 1 (Pagi)'
        : nextSlot === 'kasir_2'
        ? 'Shift 2 (Sore)'
        : 'Shift Fleksibel (Owner)';

    if (isDepositMode && effectiveDepositAmount > 0) {
      // Skenario Setor (Shift 2 closing atau Shift 1 ke Owner)
      const recipient =
        isShift1ToOwner
          ? `Owner (${cashierProfiles.owner.name})`
          : 'Owner / Brankas Konter';

      closeShiftDrawer(actualCash, closingNotes, {
        depositAmount: effectiveDepositAmount,
        depositRecipient: recipient,
        remainingCashForDrawer: remainingInDrawer,
      });

      // Buka shift baru dengan sisa uang laci tetap
      openNewShift(
        remainingInDrawer,
        finalName,
        nextSlot,
        defaultTitle,
        isShiftSwapped
      );
    } else {
      // Skenario Shift 1 ke Shift 2: Seluruh uang fisik di laci langsung masuk laci Shift 2!
      closeShiftDrawer(actualCash, closingNotes);

      openNewShift(
        actualCash,
        finalName,
        nextSlot,
        defaultTitle,
        isShiftSwapped
      );
    }

    setIsShiftModalOpen(false);
  };

  // Eksekusi Tutup Shift & Toko Standby (Tanpa langsung buka shift baru)
  const handleCloseAndStandby = () => {
    if (isDepositMode && effectiveDepositAmount > 0) {
      const recipient =
        isShift1ToOwner
          ? `Owner (${cashierProfiles.owner.name})`
          : 'Owner / Brankas Konter';

      closeShiftDrawer(actualCash, closingNotes, {
        depositAmount: effectiveDepositAmount,
        depositRecipient: recipient,
        remainingCashForDrawer: remainingInDrawer,
      });
    } else {
      closeShiftDrawer(actualCash, closingNotes);
    }
    setIsShiftModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-slate-200 space-y-3.5 my-auto max-h-[96vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-xs shrink-0 ${
                isDepositMode
                  ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                  : 'bg-gradient-to-br from-teal-600 to-emerald-600'
              }`}
            >
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                {shift.isOpen
                  ? isDepositMode
                    ? 'Tutup Shift & Hitungan Setor Kas'
                    : 'Serah Terima Laci & Tutup Shift'
                  : 'Buka Shift Baru Kasir Ju-Fat Cell'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Sistem 3 Peran: <strong>Shift 1</strong>, <strong>Shift 2</strong>, dan <strong>Owner</strong>
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

        {/* Content Body */}
        <form onSubmit={handleExecuteShiftTransition} className="space-y-3.5 text-xs overflow-y-auto pr-0.5">
          {/* Status Shift yang Sedang Berjalan */}
          {shift.isOpen && (
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
              <div className="pt-1.5 border-t border-slate-200 flex justify-between items-baseline font-bold text-xs">
                <span className="text-slate-700">Saldo Kas Laci (Menurut Sistem):</span>
                <span className="text-sm font-extrabold text-emerald-900 font-mono">
                  Rp {drawerCashBalance.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          {/* Bagian 1: Input Uang Fisik Aktual di Laci */}
          {shift.isOpen && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <label className="font-extrabold text-slate-800 text-xs">
                  1. Hitung Uang Fisik Aktual di Laci (Manual) *
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
                  value={actualCash}
                  onChange={(e) => setActualCash(Number(e.target.value) || 0)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  placeholder="Ketik uang fisik di laci..."
                />
              </div>

              {/* Status Selisih Kas Laci */}
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
                    ? 'Rp 0 (Sesuai Fisik)'
                    : difference > 0
                    ? `+Rp ${difference.toLocaleString('id-ID')} (Lebih)`
                    : `-Rp ${Math.abs(difference).toLocaleString('id-ID')} (Kurang)`}
                </span>
              </div>
            </div>
          )}

          {/* Bagian 2: Pilihan Petugas Selanjutnya (HANYA SHIFT 1, SHIFT 2, OWNER) */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-900 text-xs">
                2. Pilih Petugas yang Bertugas Selanjutnya:
              </label>
              <span className="text-[10px] text-slate-500 font-semibold">Hanya 3 Pilihan</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Slot Shift 1 */}
              <button
                type="button"
                onClick={() => handleSelectNextSlot('kasir_1')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  nextSlot === 'kasir_1'
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 text-emerald-950 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9.5px] font-black bg-emerald-700 text-white px-1.5 py-0.2 rounded font-mono">
                    SHIFT 1
                  </span>
                  {nextSlot === 'kasir_1' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <div className="font-extrabold text-xs truncate">
                  {cashierProfiles.kasir_1?.name || 'Kasir 1'}
                </div>
                <div className="text-[9.5px] text-slate-500 mt-0.5">Shift Pagi</div>
              </button>

              {/* Slot Shift 2 */}
              <button
                type="button"
                onClick={() => handleSelectNextSlot('kasir_2')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  nextSlot === 'kasir_2'
                    ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-400 text-teal-950 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9.5px] font-black bg-teal-700 text-white px-1.5 py-0.2 rounded font-mono">
                    SHIFT 2
                  </span>
                  {nextSlot === 'kasir_2' && <CheckCircle className="w-3.5 h-3.5 text-teal-600" />}
                </div>
                <div className="font-extrabold text-xs truncate">
                  {cashierProfiles.kasir_2?.name || 'Kasir 2'}
                </div>
                <div className="text-[9.5px] text-slate-500 mt-0.5">Shift Sore</div>
              </button>

              {/* Slot Owner */}
              <button
                type="button"
                onClick={() => handleSelectNextSlot('owner')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  nextSlot === 'owner'
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400 text-amber-950 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9.5px] font-black bg-amber-500 text-amber-950 px-1.5 py-0.2 rounded font-mono flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" /> OWNER
                  </span>
                  {nextSlot === 'owner' && <CheckCircle className="w-3.5 h-3.5 text-amber-600" />}
                </div>
                <div className="font-extrabold text-xs truncate">
                  {cashierProfiles.owner?.name || 'Owner'}
                </div>
                <div className="text-[9.5px] text-slate-500 mt-0.5">Akses Penuh</div>
              </button>
            </div>
          </div>

          {/* Banner Logika Bisnis Shift & Uang Laci */}
          {shift.isOpen && (
            <div className="rounded-xl border p-3 space-y-2 transition-all">
              {/* KASUS A: Shift 1 closing -> Shift 2 */}
              {isShift1ToShift2 && (
                <div className="bg-emerald-50/80 border-emerald-200 text-emerald-950 p-2.5 rounded-lg space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-black text-emerald-900">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>UANG LACI SHIFT 1 LANGSUNG MASUK KE LACI SHIFT 2</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Sesuai sistem, seluruh uang fisik terhitung di laci (<strong>Rp {actualCash.toLocaleString('id-ID')}</strong>) otomatis diserah-terimakan langsung menjadi <strong>Modal Awal Laci Shift 2</strong>.
                  </p>
                  <p className="text-[10.5px] text-emerald-700 font-medium">
                    💡 Kasir 1 tidak perlu setor uang sekarang. Hitungan setoran penuh hasil penjualan seharian akan dilakukan saat Shift 2 closing nanti.
                  </p>
                </div>
              )}

              {/* KASUS B: Shift 1 closing -> Owner */}
              {isShift1ToOwner && (
                <div className="bg-amber-50/90 border-amber-300 text-amber-950 p-2.5 rounded-lg space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-black text-amber-900">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span>SHIFT 1 DIGANTIKAN OWNER: WAJIB HITUNGAN UNTUK SETOR!</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Karena Shift 1 digantikan oleh <strong>Owner</strong>, maka Kasir 1 harus melakukan hitungan setoran uang hasil penjualan ke Owner.
                  </p>
                </div>
              )}

              {/* KASUS C: Shift 2 Closing */}
              {isShift2Closing && (
                <div className="bg-blue-50/90 border-blue-300 text-blue-950 p-2.5 rounded-lg space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-black text-blue-900">
                    <Banknote className="w-4 h-4 text-blue-600" />
                    <span>SHIFT 2 CLOSING: LANGSUNG HITUNGAN UNTUK SETOR AKHIR HARI</span>
                  </div>
                  <p className="text-[11px] text-blue-900 leading-relaxed">
                    Shift 2 selesai (akhir operasional konter). Seluruh uang di atas modal laci tetap dihitung untuk <strong>disetorkan ke Owner / Brankas</strong>.
                  </p>
                </div>
              )}

              {/* KASUS D: Owner Closing */}
              {isOwnerClosing && (
                <div className="bg-slate-50 border-slate-200 text-slate-900 p-2.5 rounded-lg space-y-1 text-xs">
                  <div className="font-black text-slate-800">Tutup Shift Owner</div>
                  <p className="text-[11px] text-slate-600">
                    Anda dapat menyetor kas atau langsung menyerahkan saldo laci ke kasir selanjutnya.
                  </p>
                </div>
              )}

              {/* Kalkulator Setoran Kas (Jika Mode Setor Aktif) */}
              {isDepositMode && (
                <div className="p-3 bg-white rounded-xl border-2 border-amber-400 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                    <span className="font-extrabold text-amber-950 flex items-center gap-1 text-xs">
                      <Banknote className="w-4 h-4 text-amber-700" /> Rincian Hitungan Setoran Kasir:
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                      Wajib Setor
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
                        <span>Uang Laci yang Telah Ditentukan:</span>
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

                    {/* Form Ubah Uang Laci yang Ditentukan */}
                    {isEditingStandardCash && (
                      <div className="p-2 bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-600 font-bold shrink-0">Set Nominal:</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={tempStandardCash}
                          onChange={(e) => setTempStandardCash(Number(e.target.value) || 0)}
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
                      <span className="text-amber-950">JUMLAH YANG HARUS DISETOR:</span>
                      <span className="font-mono text-base text-amber-700">
                        Rp {effectiveDepositAmount.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-emerald-800 font-bold pt-0.5">
                      <span>Sisa Kas Laci Tetap (Tinggal di Laci):</span>
                      <span className="font-mono">Rp {remainingInDrawer.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bagian 3: Nama Petugas di Struk & Fitur Tukar Shift (Anti-Tukar Nama) */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-800 text-xs">
                3. Nama Petugas Selanjutnya (Struk & Laporan): *
              </label>
              {/* Toggle Tukar Shift */}
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
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
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
              className="w-full px-3 py-1.5 bg-white border-2 border-slate-300 focus:border-teal-500 rounded-xl font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 shadow-xs"
              placeholder="Ketik nama petugas yang bertugas..."
            />

            {isShiftSwapped && (
              <div className="p-1.5 bg-amber-50 border border-amber-300 rounded-lg text-[10.5px] text-amber-900 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Tukar Shift Aktif:</strong> Petugas pengganti{' '}
                  <strong>"{candidateCashierName}"</strong> akan dicetak pada struk penjualan kasir & laporan mutasi laci sehingga nama tidak tertukar.
                </div>
              </div>
            )}
          </div>

          {/* Catatan Serah Terima (Opsional) */}
          {shift.isOpen && (
            <div>
              <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                Catatan Serah Terima / Tutup Shift (Opsional)
              </label>
              <input
                type="text"
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Contoh: Uang fisik pas, diserahkan ke Shift 2..."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-xs"
              />
            </div>
          )}

          {/* Tombol Aksi */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
            {shift.isOpen && (
              <button
                type="button"
                onClick={handleCloseAndStandby}
                className="w-full sm:w-auto px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition cursor-pointer text-xs"
                title="Tutup shift dan jangan langsung buka shift baru (Laci Standby/Toko Tutup)"
              >
                {isDepositMode ? 'Setor & Standby Toko' : 'Tutup Shift & Standby'}
              </button>
            )}

            <div className="w-full sm:w-auto flex items-center gap-2 justify-end ml-auto">
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(false)}
                className="px-3 py-2 text-slate-500 hover:text-slate-700 font-semibold cursor-pointer text-xs"
              >
                Batal
              </button>

              <button
                type="submit"
                className={`w-full sm:w-auto px-4 py-2.5 text-white rounded-xl font-extrabold shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 text-xs ${
                  isDepositMode
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-900/20'
                    : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-teal-900/20'
                }`}
              >
                {isDepositMode ? (
                  <>
                    <Banknote className="w-4 h-4 text-amber-200" />
                    <span>
                      Setor Rp {effectiveDepositAmount.toLocaleString('id-ID')} & Masuk{' '}
                      {nextSlot === 'kasir_1'
                        ? 'Shift 1'
                        : nextSlot === 'kasir_2'
                        ? 'Shift 2'
                        : 'Owner'}
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>
                      Serahkan Laci & Buka{' '}
                      {nextSlot === 'kasir_1'
                        ? 'Shift 1'
                        : nextSlot === 'kasir_2'
                        ? 'Shift 2'
                        : 'Owner'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
