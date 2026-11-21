import React, { useState, useEffect } from 'react';
import {
  X,
  ClipboardPaste,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ArrowRight,
  FileInput,
  RotateCcw,
  Wallet,
  Building2,
  Printer,
} from 'lucide-react';
import { AtmMiniType, PPOBCategory } from '../types/pos';
import {
  QuickImportMode,
  ParsedAtmMiniItem,
  ParsedPPOBItem,
  ATM_MINI_RECEIPT_SAMPLES,
  PPOB_RECEIPT_SAMPLES,
  parseAtmMiniReceipts,
  parsePPOBReceipts,
} from '../utils/receiptTextParser';

interface QuickReceiptImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: QuickImportMode;
  onFillAtmMiniForm?: (item: ParsedAtmMiniItem) => void;
  onRecordAtmMiniItems?: (items: ParsedAtmMiniItem[], openReceiptOnSingle: boolean) => void;
  onFillPPOBForm?: (item: ParsedPPOBItem) => void;
  onRecordPPOBItems?: (items: ParsedPPOBItem[], openReceiptOnSingle: boolean) => void;
}

const formatRpDigits = (val: number): string =>
  val > 0 ? Math.trunc(val).toLocaleString('id-ID') : '';

const parseRpDigits = (raw: string): number => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return 0;
  const num = parseInt(digits, 10);
  return Number.isFinite(num) ? num : 0;
};

const computeAtmItemImpact = (item: ParsedAtmMiniItem) => {
  const totalAdmin = item.adminEdcFee + item.counterFee;
  if (item.atmType === 'tarik_tunai_atm') {
    const isPotong = item.adminDeductionType === 'potong_tunai';
    const isTunaiKonter = item.adminDeductionType === 'tunai_konter';
    const cashOut = isPotong ? Math.max(0, item.nominal - totalAdmin) : item.nominal;
    const digitalIn = isPotong || isTunaiKonter ? item.nominal : item.nominal + totalAdmin;

    if (isTunaiKonter) {
      if (item.paymentMethod === 'qris') {
        return {
          drawerDelta: -cashOut,
          digitalDelta: digitalIn + totalAdmin,
          customerTotal: item.nominal,
        };
      }
      return {
        drawerDelta: totalAdmin - cashOut,
        digitalDelta: digitalIn,
        customerTotal: item.nominal,
      };
    }

    return {
      drawerDelta: -cashOut,
      digitalDelta: digitalIn,
      customerTotal: item.nominal,
    };
  }

  const totalCustomer = item.nominal + totalAdmin;
  if (item.paymentMethod === 'qris') {
    return {
      drawerDelta: 0,
      digitalDelta: item.counterFee,
      customerTotal: totalCustomer,
    };
  }
  return {
    drawerDelta: totalCustomer,
    digitalDelta: -(item.nominal + item.adminEdcFee),
    customerTotal: totalCustomer,
  };
};

export const QuickReceiptImportModal: React.FC<QuickReceiptImportModalProps> = ({
  isOpen,
  onClose,
  mode,
  onFillAtmMiniForm,
  onRecordAtmMiniItems,
  onFillPPOBForm,
  onRecordPPOBItems,
}) => {
  const [rawText, setRawText] = useState('');
  const [atmItems, setAtmItems] = useState<ParsedAtmMiniItem[]>([]);
  const [ppobItems, setPpobItems] = useState<ParsedPPOBItem[]>([]);
  const [clipboardHint, setClipboardHint] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoOpenReceipt, setAutoOpenReceipt] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setClipboardHint(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const handleParseText = (text: string) => {
    setRawText(text);
    setErrorMsg(null);
    if (!text.trim()) {
      setAtmItems([]);
      setPpobItems([]);
      return;
    }
    if (mode === 'atm_mini') {
      setAtmItems(parseAtmMiniReceipts(text));
    } else {
      setPpobItems(parsePPOBReceipts(text));
    }
  };

  const handlePasteFromClipboard = async () => {
    setClipboardHint(null);
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        setClipboardHint('Browser membatasi tempel otomatis — silakan tekan Ctrl+V / tahan lalu Tempel di kotak teks.');
        return;
      }
      const clipText = await navigator.clipboard.readText();
      if (!clipText.trim()) {
        setClipboardHint('Clipboard sedang kosong. Salin teks struk atau notifikasi dari aplikasi lain terlebih dahulu.');
        return;
      }
      handleParseText(clipText);
    } catch {
      setClipboardHint('Izin clipboard ditolak browser. Klik kotak teks di bawah lalu tekan Ctrl+V (atau tahan > Tempel).');
    }
  };

  const handleClear = () => {
    setRawText('');
    setAtmItems([]);
    setPpobItems([]);
    setClipboardHint(null);
    setErrorMsg(null);
  };

  if (!isOpen) return null;

  const samples = mode === 'atm_mini' ? ATM_MINI_RECEIPT_SAMPLES : PPOB_RECEIPT_SAMPLES;
  const activeCount = mode === 'atm_mini' ? atmItems.length : ppobItems.length;

  const validAtmItems = atmItems.filter((it) => it.nominal > 0);
  const validPpobItems = ppobItems.filter((it) => it.sellingPrice > 0);
  const validCount = mode === 'atm_mini' ? validAtmItems.length : validPpobItems.length;

  const totalDrawerDelta =
    mode === 'atm_mini'
      ? validAtmItems.reduce((sum, it) => sum + computeAtmItemImpact(it).drawerDelta, 0)
      : validPpobItems.reduce(
          (sum, it) => sum + (it.paymentMethod === 'tunai' ? it.sellingPrice : 0),
          0
        );

  const totalCounterProfit =
    mode === 'atm_mini'
      ? validAtmItems.reduce((sum, it) => sum + it.counterFee, 0)
      : validPpobItems.reduce((sum, it) => sum + (it.sellingPrice - it.hpp), 0);

  const updateAtmItem = (id: string, patch: Partial<ParsedAtmMiniItem>) => {
    setAtmItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        if (patch.atmType) {
          if (patch.atmType === 'topup_ewallet_atm') {
            next.channel = 'ewallet';
            next.cardType = 'E-Wallet';
          } else if (patch.atmType === 'qris_atm') {
            next.channel = 'qris';
            next.cardType = 'QRIS';
          } else if (patch.atmType === 'mbanking_atm') {
            next.channel = 'mbanking';
            next.cardType = 'M-Banking';
          } else if (next.cardType === 'E-Wallet' || next.cardType === 'QRIS' || next.cardType === 'M-Banking') {
            next.channel = 'kartu_debit';
            next.cardType = 'GPN';
          }
        }
        return next;
      })
    );
  };

  const updatePpobItem = (id: string, patch: Partial<ParsedPPOBItem>) => {
    setPpobItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        if (patch.hpp !== undefined || patch.loketProfit !== undefined) {
          next.sellingPrice = Math.max(0, next.hpp + next.loketProfit);
        } else if (patch.sellingPrice !== undefined) {
          next.loketProfit = Math.max(0, next.sellingPrice - next.hpp);
        }
        return next;
      })
    );
  };

  const handleRecordAll = () => {
    if (mode === 'atm_mini') {
      if (validAtmItems.length === 0) {
        setErrorMsg('Isi nominal transaksi lebih dari Rp 0 sebelum mencatat ke Kas & Riwayat.');
        return;
      }
      onRecordAtmMiniItems?.(validAtmItems, autoOpenReceipt && validAtmItems.length === 1);
      handleClear();
      onClose();
    } else {
      if (validPpobItems.length === 0) {
        setErrorMsg('Pastikan Harga Jual lebih dari Rp 0 dan Nomor Tujuan terisi sebelum mencatat.');
        return;
      }
      const missingTarget = validPpobItems.find((it) => !it.targetNumber.trim());
      if (missingTarget) {
        setErrorMsg('Nomor HP / ID Pelanggan wajib diisi pada setiap transaksi PPOB.');
        return;
      }
      onRecordPPOBItems?.(validPpobItems, autoOpenReceipt && validPpobItems.length === 1);
      handleClear();
      onClose();
    }
  };

  const handleFillSingle = () => {
    if (mode === 'atm_mini' && atmItems[0]) {
      onFillAtmMiniForm?.(atmItems[0]);
      handleClear();
      onClose();
    } else if (mode === 'ppob' && ppobItems[0]) {
      onFillPPOBForm?.(ppobItems[0]);
      handleClear();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
              <ClipboardPaste className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                Tempel Struk &amp; Impor Cepat Multi-Aplikasi ·{' '}
                {mode === 'atm_mini' ? 'ATM Mini' : 'PPOB'}
              </h3>
              <p className="text-[11px] text-slate-300 truncate">
                {mode === 'atm_mini'
                  ? 'BRImo · BCA · Livin’ Mandiri · BNI · DANA · GoPay · OVO · ShopeePay · QRIS'
                  : 'OrderKuota · Mitra Bukalapak · Payfazz · Digipos · Token PLN · Wifi · Pulsa'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
            aria-label="Tutup modal impor struk"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/70">
          {/* Paste Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 shrink-0" />
                  <span>Tempel dari Clipboard</span>
                </button>

                {rawText && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span>Bersihkan</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10.5px] font-semibold text-slate-500">Contoh cepat:</span>
                {samples.map((smp) => (
                  <button
                    key={smp.label}
                    type="button"
                    onClick={() => handleParseText(smp.text)}
                    className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 rounded-md transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {smp.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => handleParseText(e.target.value)}
              placeholder={
                mode === 'atm_mini'
                  ? 'Tempel teks struk / notifikasi dari BRImo, DANA, GoPay, BCA, atau catatan WA di sini...\nBisa langsung tempel beberapa transaksi sekaligus (pisahkan per baris baru / baris kosong).'
                  : 'Tempel teks struk sukses dari OrderKuota, Mitra Bukalapak, Digipos, Payfazz, atau tagihan PLN/Wifi di sini...\nBisa langsung tempel beberapa transaksi sekaligus!'
              }
              className="w-full px-3 py-2.5 text-xs sm:text-[13px] bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y"
            />

            {clipboardHint && (
              <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{clipboardHint}</span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Items Section */}
          {activeCount > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="text-xs font-extrabold text-slate-800">
                    Hasil Deteksi Otomatis ({activeCount} Transaksi)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Periksa atau sesuaikan angka sebelum dicatat ke Kas &amp; Riwayat
                </span>
              </div>

              {mode === 'atm_mini'
                ? atmItems.map((item, idx) => {
                    const impact = computeAtmItemImpact(item);
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 flex-wrap">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[11px] font-mono font-bold text-slate-500">
                              #{idx + 1}
                            </span>
                            <span className="px-2 py-0.5 text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 rounded-md">
                              {item.sourceApp}
                            </span>
                            {item.confidence === 'tinggi' ? (
                              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Siap dicatat
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Periksa nominal / tujuan
                              </span>
                            )}
                          </div>

                          {atmItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setAtmItems((prev) => prev.filter((x) => x.id !== item.id))
                              }
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                              title="Hapus baris ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                          <div>
                            <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                              Jenis Layanan
                            </label>
                            <select
                              value={item.atmType}
                              onChange={(e) =>
                                updateAtmItem(item.id, {
                                  atmType: e.target.value as AtmMiniType,
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                              <option value="transfer_atm">Transfer Bank</option>
                              <option value="tarik_tunai_atm">Tarik Tunai</option>
                              <option value="topup_ewallet_atm">Top Up E-Wallet</option>
                              <option value="mbanking_atm">M-Banking</option>
                              <option value="qris_atm">QRIS Merchant</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                              Bank / E-Wallet / App
                            </label>
                            <input
                              type="text"
                              value={item.bankName}
                              onChange={(e) =>
                                updateAtmItem(item.id, { bankName: e.target.value })
                              }
                              placeholder="Contoh: BRI / DANA / BCA"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                              No. Rek / HP Tujuan
                            </label>
                            <input
                              type="text"
                              value={item.targetAccountOrPhone}
                              onChange={(e) =>
                                updateAtmItem(item.id, {
                                  targetAccountOrPhone: e.target.value,
                                })
                              }
                              placeholder="08xx / No. Rekening"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                              Nama Nasabah
                            </label>
                            <input
                              type="text"
                              value={item.customerName}
                              onChange={(e) =>
                                updateAtmItem(item.id, { customerName: e.target.value })
                              }
                              placeholder="Nama pelanggan..."
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                              Nominal Pokok (Rp) *
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatRpDigits(item.nominal)}
                              onChange={(e) =>
                                updateAtmItem(item.id, {
                                  nominal: parseRpDigits(e.target.value),
                                })
                              }
                              placeholder="0"
                              className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg font-mono tabular-nums font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                              Admin Bank/App (Rp)
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatRpDigits(item.adminEdcFee)}
                              onChange={(e) =>
                                updateAtmItem(item.id, {
                                  adminEdcFee: parseRpDigits(e.target.value),
                                })
                              }
                              placeholder="0"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                              Jasa Konter / Laba (Rp)
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatRpDigits(item.counterFee)}
                              onChange={(e) =>
                                updateAtmItem(item.id, {
                                  counterFee: parseRpDigits(e.target.value),
                                })
                              }
                              placeholder="0"
                              className="w-full px-2.5 py-1.5 bg-emerald-50/70 border border-emerald-300 rounded-lg font-mono tabular-nums font-black text-emerald-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                              Pembayaran Pelanggan
                            </label>
                            <select
                              value={item.paymentMethod}
                              onChange={(e) =>
                                updateAtmItem(item.id, {
                                  paymentMethod: e.target.value as 'tunai' | 'qris',
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                              <option value="tunai">Tunai (Uang Laci)</option>
                              <option value="qris">QRIS Non-Tunai</option>
                            </select>
                          </div>
                        </div>

                        {item.atmType === 'tarik_tunai_atm' && (
                          <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="font-bold text-slate-600">Skema Admin Tarik Tunai:</span>
                            {(
                              [
                                { id: 'tambah_transfer', label: 'Kirim Sekalian Admin' },
                                { id: 'potong_tunai', label: 'Potong Uang Tunai' },
                                { id: 'tunai_konter', label: 'Admin Tunai di Konter (Masuk Laci)' },
                              ] as const
                            ).map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                  updateAtmItem(item.id, { adminDeductionType: opt.id })
                                }
                                className={`px-2.5 py-1 rounded-md font-semibold border transition cursor-pointer ${
                                  item.adminDeductionType === opt.id
                                    ? 'bg-teal-700 text-white border-teal-700'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] bg-slate-50/80 -mx-3.5 -mb-3.5 px-3.5 py-2 rounded-b-xl">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                              Kas Laci:{' '}
                              <span
                                className={`font-mono tabular-nums font-black ${
                                  impact.drawerDelta >= 0
                                    ? 'text-emerald-700'
                                    : 'text-rose-700'
                                }`}
                              >
                                {impact.drawerDelta >= 0 ? '+' : '-'}Rp{' '}
                                {Math.abs(impact.drawerDelta).toLocaleString('id-ID')}
                              </span>
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <Building2 className="w-3.5 h-3.5 text-sky-600" />
                              Saldo Digital:{' '}
                              <span
                                className={`font-mono tabular-nums font-black ${
                                  impact.digitalDelta >= 0 ? 'text-sky-700' : 'text-amber-700'
                                }`}
                              >
                                {impact.digitalDelta >= 0 ? '+' : '-'}Rp{' '}
                                {Math.abs(impact.digitalDelta).toLocaleString('id-ID')}
                              </span>
                            </span>
                          </div>
                          {item.referenceNo && (
                            <span className="font-mono text-[10.5px] text-slate-500">
                              Ref: {item.referenceNo}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                : ppobItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-3 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] font-mono font-bold text-slate-500">
                            #{idx + 1}
                          </span>
                          <span className="px-2 py-0.5 text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 rounded-md">
                            {item.sourceApp}
                          </span>
                          {item.confidence === 'tinggi' ? (
                            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Siap dicatat
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Periksa ID / nominal
                            </span>
                          )}
                        </div>

                        {ppobItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setPpobItems((prev) => prev.filter((x) => x.id !== item.id))
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                        <div>
                          <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                            Kategori PPOB
                          </label>
                          <select
                            value={item.category}
                            onChange={(e) =>
                              updatePpobItem(item.id, {
                                category: e.target.value as PPOBCategory,
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="pulsa">Pulsa Reguler</option>
                            <option value="data">Paket Data / Kuota</option>
                            <option value="pln">Token PLN (Prabayar)</option>
                            <option value="pln_bulanan">Listrik Bulanan</option>
                            <option value="wifi">Wifi / Internet</option>
                            <option value="game">Top Up Game</option>
                            <option value="bpjs">BPJS Kesehatan</option>
                            <option value="pdam">PDAM / Air</option>
                            <option value="tagihan">Tagihan Lainnya</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                            Provider / Operator
                          </label>
                          <input
                            type="text"
                            value={item.provider}
                            onChange={(e) =>
                              updatePpobItem(item.id, { provider: e.target.value })
                            }
                            placeholder="Telkomsel / PLN / Indihome"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                            No. HP / ID Pelanggan *
                          </label>
                          <input
                            type="text"
                            value={item.targetNumber}
                            onChange={(e) =>
                              updatePpobItem(item.id, { targetNumber: e.target.value })
                            }
                            placeholder="08xx / ID Meteran / User ID"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                            Nama Pelanggan
                          </label>
                          <input
                            type="text"
                            value={item.customerName}
                            onChange={(e) =>
                              updatePpobItem(item.id, { customerName: e.target.value })
                            }
                            placeholder="Opsional..."
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div className="sm:col-span-2 lg:col-span-1">
                          <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                            Nama Paket / Keterangan
                          </label>
                          <input
                            type="text"
                            value={item.packageName}
                            onChange={(e) =>
                              updatePpobItem(item.id, { packageName: e.target.value })
                            }
                            placeholder="Cth: Token PLN 50.000"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                            Modal / HPP (Rp)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatRpDigits(item.hpp)}
                            onChange={(e) =>
                              updatePpobItem(item.id, { hpp: parseRpDigits(e.target.value) })
                            }
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono tabular-nums font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                            Admin Loket / Laba (Rp)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatRpDigits(item.loketProfit)}
                            onChange={(e) =>
                              updatePpobItem(item.id, {
                                loketProfit: parseRpDigits(e.target.value),
                              })
                            }
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 bg-emerald-50/70 border border-emerald-300 rounded-lg font-mono tabular-nums font-black text-emerald-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                            Harga Jual (Rp) · Bayar
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatRpDigits(item.sellingPrice)}
                              onChange={(e) =>
                                updatePpobItem(item.id, {
                                  sellingPrice: parseRpDigits(e.target.value),
                                })
                              }
                              placeholder="0"
                              className="w-full min-w-0 px-2 py-1.5 bg-white border border-teal-300 rounded-lg font-mono tabular-nums font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            <select
                              value={item.paymentMethod}
                              onChange={(e) =>
                                updatePpobItem(item.id, {
                                  paymentMethod: e.target.value as 'tunai' | 'qris',
                                })
                              }
                              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none shrink-0"
                            >
                              <option value="tunai">Tunai</option>
                              <option value="qris">QRIS</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] bg-slate-50/80 -mx-3.5 -mb-3.5 px-3.5 py-2 rounded-b-xl">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-semibold text-slate-700">
                            {item.paymentMethod === 'tunai' ? 'Kas Laci:' : 'Pembayaran QRIS:'}{' '}
                            <span className="font-mono tabular-nums font-black text-emerald-700">
                              +Rp {item.sellingPrice.toLocaleString('id-ID')}
                            </span>
                          </span>
                          <span className="font-semibold text-slate-700">
                            Laba Konter:{' '}
                            <span
                              className={`font-mono tabular-nums font-black ${
                                item.sellingPrice - item.hpp >= 0
                                  ? 'text-teal-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              {item.sellingPrice - item.hpp >= 0 ? '+' : '-'}Rp{' '}
                              {Math.abs(item.sellingPrice - item.hpp).toLocaleString('id-ID')}
                            </span>
                          </span>
                        </div>
                        {item.referenceNo && (
                          <span className="font-mono text-[10.5px] text-slate-500">
                            Ref/SN: {item.referenceNo}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 text-center space-y-1.5">
              <ClipboardPaste className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">
                Belum ada teks struk ditempel
              </p>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                Salin bukti transaksi atau notifikasi dari aplikasi bank, e-wallet, atau agen PPOB
                Anda lalu tempel di atas. Sistem otomatis membaca nominal, admin, tujuan, dan nama pelanggan.
              </p>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="px-4 sm:px-5 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <span className="font-extrabold text-slate-800">
                {validCount} Transaksi Siap
              </span>
              {validCount > 0 && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-600 font-semibold">
                    Net Kas Laci:{' '}
                    <span
                      className={`font-mono tabular-nums font-black ${
                        totalDrawerDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {totalDrawerDelta >= 0 ? '+' : '-'}Rp{' '}
                      {Math.abs(totalDrawerDelta).toLocaleString('id-ID')}
                    </span>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-600 font-semibold">
                    Total Laba/Jasa:{' '}
                    <span className="font-mono tabular-nums font-black text-teal-700">
                      +Rp {totalCounterProfit.toLocaleString('id-ID')}
                    </span>
                  </span>
                </>
              )}
            </div>

            {validCount === 1 && (
              <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoOpenReceipt}
                  onChange={(e) => setAutoOpenReceipt(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <Printer className="w-3 h-3 text-slate-500" />
                <span>Buka struk thermal otomatis setelah dicatat</span>
              </label>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end flex-wrap">
            {activeCount === 1 && (
              <button
                type="button"
                onClick={handleFillSingle}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <FileInput className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span>Isi ke Form</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRecordAll}
              disabled={validCount === 0}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-600 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed active:scale-95 whitespace-nowrap shrink-0"
            >
              <span>
                {validCount > 1
                  ? `Catat ${validCount} Transaksi ke Kas & Riwayat`
                  : 'Catat Langsung ke Kas & Riwayat'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
