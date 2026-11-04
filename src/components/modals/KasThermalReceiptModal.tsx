import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Bluetooth,
  Smartphone,
  Share2,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { CashMutation } from '../../types/pos';
import {
  printViaWebBluetooth,
  printViaRawBT,
  shareReceiptText,
  getSavedBluetoothDeviceName,
  forgetBluetoothDevice,
} from '../../utils/thermalPrinter';

interface KasThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredMutations: CashMutation[];
  totalMasukTunai: number;
  totalKeluarTunai: number;
  totalNonTunai: number;
  totalKasbonAktif: number;
}

export const KasThermalReceiptModal: React.FC<KasThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  filteredMutations,
  totalMasukTunai,
  totalKeluarTunai,
  totalNonTunai,
  totalKasbonAktif,
}) => {
  const { storeProfile, shift, drawerCashBalance, mutations } = usePOS();
  
  // Print options
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [printScope, setPrintScope] = useState<'filtered' | 'all' | 'summary_only'>('filtered');
  const [maxRows, setMaxRows] = useState<number>(30);
  const [copied, setCopied] = useState(false);
  const [isPrintingBT, setIsPrintingBT] = useState(false);
  const [btStatus, setBtStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [btMessage, setBtMessage] = useState('');
  const [savedBtDevice, setSavedBtDevice] = useState<string>(getSavedBluetoothDeviceName());

  useEffect(() => {
    if (isOpen) {
      setSavedBtDevice(getSavedBluetoothDeviceName());
      setBtStatus('idle');
      setBtMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const selectedMutations =
    printScope === 'all'
      ? mutations
      : printScope === 'filtered'
      ? filteredMutations
      : [];

  const displayMutations = selectedMutations.slice(0, maxRows);
  const now = new Date();
  const printDateStr = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const printTimeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const divider = paperWidth === '58mm' ? '--------------------------------' : '------------------------------------------------';
  const doubleDivider = paperWidth === '58mm' ? '================================' : '================================================';

  const generateKasReceiptText = (): string => {
    let lines: string[] = [];
    lines.push(storeProfile.name || 'JU-FAT CELL');
    if (storeProfile.subtitle) lines.push(storeProfile.subtitle);
    if (storeProfile.address) lines.push(storeProfile.address);
    if (storeProfile.phone) lines.push(`WA/Telp: ${storeProfile.phone}`);
    lines.push(divider);
    lines.push('*** LAPORAN MUTASI KAS & LACI ***');
    lines.push(divider);
    lines.push(`Waktu Cetak : ${printDateStr} ${printTimeStr}`);
    lines.push(`Kasir Shift : ${shift.cashierName || 'Petugas'}`);
    lines.push(`Status Shift: ${shift.isOpen ? 'SHIFT SEDANG AKTIF' : 'SHIFT DITUTUP'}`);
    lines.push(divider);
    lines.push('RINGKASAN KAS FISIK LACI:');
    lines.push(`Modal Awal  : Rp ${shift.startingCash.toLocaleString('id-ID')}`);
    lines.push(`Masuk Tunai : +Rp ${totalMasukTunai.toLocaleString('id-ID')}`);
    lines.push(`Keluar Tunai: -Rp ${totalKeluarTunai.toLocaleString('id-ID')}`);
    lines.push(`SALDO LACI  : Rp ${drawerCashBalance.toLocaleString('id-ID')}`);
    lines.push(divider);
    lines.push(`Non-Tunai   : Rp ${totalNonTunai.toLocaleString('id-ID')}`);
    lines.push(`Kasbon Aktif: Rp ${totalKasbonAktif.toLocaleString('id-ID')}`);
    lines.push(divider);

    if (printScope !== 'summary_only' && displayMutations.length > 0) {
      lines.push(`RINCIAN MUTASI TERAKHIR (${displayMutations.length} data):`);
      displayMutations.forEach((m, idx) => {
        const sign = m.type === 'masuk' ? '+' : '-';
        lines.push(`${idx + 1}. [${m.timestamp || '-'}] Rp ${sign}${m.amount.toLocaleString('id-ID')}`);
        lines.push(`   ${m.description} (${m.category ? m.category.replace(/_/g, ' ') : 'Kas'})`);
      });
      lines.push(divider);
    }

    lines.push('Kasir Bertugas: __________________');
    lines.push('Supervisor/Owner: ________________');
    lines.push(divider);
    lines.push(storeProfile.receiptFooter || 'JU-FAT CELL - TRANSAKSI AMAN & TERPERCAYA');
    lines.push('Dicetak dari Sistem POS Ju-Fat Cell');
    return lines.join('\n');
  };

  const handleCopyText = () => {
    const text = generateKasReceiptText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handlePrintBluetooth = async () => {
    setIsPrintingBT(true);
    setBtStatus('idle');
    setBtMessage('Mencari & menghubungkan ke printer Bluetooth...');

    try {
      const text = generateKasReceiptText();
      const res = await printViaWebBluetooth(text, paperWidth);
      setIsPrintingBT(false);
      if (res.success) {
        setBtStatus('success');
        setBtMessage(res.message);
        if (res.deviceName) setSavedBtDevice(res.deviceName);
      } else {
        setBtStatus('error');
        setBtMessage(res.message);
      }
    } catch (err: any) {
      setIsPrintingBT(false);
      setBtStatus('error');
      setBtMessage(err.message || 'Gagal mengirim data ke printer Bluetooth.');
    }
  };

  const handlePrintRawBT = () => {
    const text = generateKasReceiptText();
    const success = printViaRawBT(text, paperWidth);
    if (!success) {
      handleCopyText();
    }
  };

  const handleShareReceipt = async () => {
    const text = generateKasReceiptText();
    const didShare = await shareReceiptText('Laporan Kas Ju-Fat Cell', text);
    if (!didShare) {
      handleCopyText();
    }
  };

  const handleForgetBT = () => {
    forgetBluetoothDevice();
    setSavedBtDevice('');
    setBtStatus('idle');
    setBtMessage('Perangkat Bluetooth dilepas. Anda dapat memilih printer baru saat mencetak.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-slate-200 flex flex-col max-h-[94vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cetak Laporan Kas Termal</h3>
              <p className="text-[11px] text-slate-500">Struk mutasi laci format printer thermal POS</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Print Configuration Controls */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3 space-y-2.5 shrink-0 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Paper Size selector */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">Lebar Kertas:</span>
              <div className="flex bg-slate-200/80 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPaperWidth('58mm')}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer text-xs ${
                    paperWidth === '58mm'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  58mm (Kecil)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperWidth('80mm')}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer text-xs ${
                    paperWidth === '80mm'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  80mm (Standar)
                </button>
              </div>
            </div>

            {/* Scope selector */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">Cakupan Data:</span>
              <select
                value={printScope}
                onChange={(e) => setPrintScope(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="filtered">Data Terfilter ({filteredMutations.length} baris)</option>
                <option value="all">Semua Mutasi ({mutations.length} baris)</option>
                <option value="summary_only">Hanya Ringkasan Kas/Laci</option>
              </select>
            </div>
          </div>

          {printScope !== 'summary_only' && selectedMutations.length > 30 && (
            <div className="flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200/70 pt-1.5">
              <span>Batas baris transaksi tercetak:</span>
              <div className="flex items-center gap-1">
                {[15, 30, 50, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxRows(num)}
                    className={`px-2 py-0.5 rounded font-mono font-bold cursor-pointer transition ${
                      maxRows === num
                        ? 'bg-teal-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bluetooth Device & Copy Action */}
          <div className="flex items-center justify-between gap-2 border-t border-slate-200/70 pt-2">
            <div className="flex items-center gap-1.5">
              {savedBtDevice ? (
                <div className="flex items-center gap-1 bg-teal-100 text-teal-900 px-2 py-0.5 rounded-md text-[10px] font-bold">
                  <Bluetooth className="w-3 h-3 text-teal-700" />
                  <span className="max-w-[120px] truncate">{savedBtDevice}</span>
                  <button
                    type="button"
                    onClick={handleForgetBT}
                    className="text-teal-700 hover:text-red-600 underline ml-1 cursor-pointer text-[9.5px]"
                    title="Putus & ganti printer Bluetooth"
                  >
                    Ganti
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Bluetooth className="w-3 h-3 text-slate-400" /> Siap konek Bluetooth
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleCopyText}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-teal-900 bg-white hover:bg-teal-50 border border-slate-300 hover:border-teal-400 rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0"
              title="Salin teks laporan kas untuk dikirim via WhatsApp"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bluetooth Alert / Feedback Banner */}
        {btMessage && (
          <div
            className={`p-2 rounded-xl mb-2 text-xs flex items-start gap-2 shrink-0 border ${
              btStatus === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : btStatus === 'error'
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-blue-50 text-blue-900 border-blue-300'
            }`}
          >
            {btStatus === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : btStatus === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-[11px] leading-tight">
              <p className="font-semibold">{btMessage}</p>
              {btStatus === 'error' && (
                <p className="text-[10px] text-amber-800 mt-0.5">
                  💡 Tips HP: Jika printer Anda tipe Bluetooth Classic (bukan BLE), gunakan tombol <strong>"Cetak via RawBT"</strong> di bawah untuk langsung print dari HP tanpa pairing browser!
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setBtMessage('')}
              className="text-slate-400 hover:text-slate-600 text-[10px] font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Printable Thermal Receipt Container */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-2 sm:p-4 rounded-xl flex justify-center border border-slate-200 min-h-[300px]">
          <div
            id="printable-receipt"
            style={{ width: paperWidth, maxWidth: paperWidth }}
            className="bg-white p-3.5 shadow-md border border-dashed border-slate-300 rounded-lg text-slate-950 font-mono text-[11px] leading-tight select-text transition-all duration-150 mx-auto"
          >
            {/* Header Profil Toko */}
            <div className="text-center space-y-0.5 pb-1">
              {storeProfile.logo && (
                <div className="flex justify-center mb-1">
                  <img
                    src={storeProfile.logo}
                    alt={storeProfile.name}
                    className="max-h-10 max-w-[120px] object-contain mx-auto"
                  />
                </div>
              )}
              <h2 className="font-black text-sm tracking-wide uppercase">
                {storeProfile.name || 'JU-FAT CELL'}
              </h2>
              {storeProfile.subtitle && (
                <p className="text-[10px] text-slate-600">{storeProfile.subtitle}</p>
              )}
              {storeProfile.address && (
                <p className="text-[9px] text-slate-500">{storeProfile.address}</p>
              )}
              {storeProfile.phone && (
                <p className="text-[9px] text-slate-500">Telp/WA: {storeProfile.phone}</p>
              )}
            </div>

            <div className="text-center font-bold text-slate-700 py-0.5 text-[10px]">
              {doubleDivider}
            </div>

            {/* Document Header */}
            <div className="text-center space-y-0.5 py-0.5">
              <div className="font-extrabold text-[11px] tracking-wider uppercase">
                LAPORAN KAS & MUTASI LACI
              </div>
              <div className="text-[9px] text-slate-600">
                Waktu Cetak: {printDateStr} {printTimeStr}
              </div>
              <div className="text-[9px] text-slate-600">
                Petugas/Kasir: <span className="font-bold">{shift.cashierName || 'Kasir'}</span> (Shift {shift.shiftNumber || 1})
              </div>
            </div>

            <div className="text-center font-bold text-slate-700 py-0.5 text-[10px]">
              {divider}
            </div>

            {/* Ringkasan Keuangan Laci Kasir */}
            <div className="space-y-1 text-[10px]">
              <div className="text-[10px] font-bold text-slate-900 pb-0.5 uppercase tracking-wider text-center">
                -- RINGKASAN SALDO KASIR --
              </div>
              <div className="flex justify-between">
                <span>Modal Awal Laci:</span>
                <span className="font-bold">Rp {(shift.startingCash || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-emerald-800">
                <span>Total Kas Masuk (Tunai):</span>
                <span className="font-bold">+Rp {totalMasukTunai.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-rose-800">
                <span>Total Kas Keluar (Tunai):</span>
                <span className="font-bold">-Rp {totalKeluarTunai.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-blue-800">
                <span>Non-Tunai / QRIS:</span>
                <span className="font-bold">Rp {totalNonTunai.toLocaleString('id-ID')}</span>
              </div>
              {totalKasbonAktif > 0 && (
                <div className="flex justify-between text-purple-900">
                  <span>Kasbon/Piutang Aktif:</span>
                  <span className="font-bold">Rp {totalKasbonAktif.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            <div className="text-center font-bold text-slate-700 py-0.5 text-[10px]">
              {doubleDivider}
            </div>

            {/* Highlighted Drawer Balance */}
            <div className="py-1 text-center bg-slate-50 border border-slate-300 rounded my-1">
              <div className="text-[9px] font-bold uppercase text-slate-600">
                SALDO KAS FISIK DI LACI
              </div>
              <div className="text-sm font-black text-slate-950 tracking-wider">
                Rp {drawerCashBalance.toLocaleString('id-ID')}
              </div>
            </div>

            {/* Daftar Rincian Mutasi Transaksi (jika dipilih) */}
            {printScope !== 'summary_only' && (
              <>
                <div className="text-center font-bold text-slate-700 py-0.5 text-[10px]">
                  {divider}
                </div>
                <div className="text-[10px] font-bold text-slate-900 pb-1 text-center uppercase tracking-wider">
                  -- RINCIAN TRANSAKSI ({displayMutations.length} BARIS) --
                </div>

                <div className="space-y-1.5 py-0.5 text-[9px]">
                  {displayMutations.map((m, idx) => (
                    <div key={m.id || idx} className="border-b border-dotted border-slate-200 pb-1">
                      <div className="flex justify-between font-bold text-[9.5px]">
                        <span className="text-slate-600">
                          {m.timestamp} • {m.category.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`font-black ${
                            m.type === 'masuk'
                              ? 'text-emerald-800'
                              : 'text-rose-800'
                          }`}
                        >
                          {m.type === 'masuk' ? '+' : '-'}
                          Rp {m.amount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="text-slate-800 break-words leading-tight">
                        {m.description}
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-500 pt-0.5">
                        <span className="uppercase">
                          {m.paymentMethod === 'tunai' ? '💵 Tunai' : '📱 Non-Tunai / QRIS'}
                        </span>
                        <span>Saldo: Rp {(m.runningCashBalance || 0).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  ))}
                  {selectedMutations.length > maxRows && (
                    <div className="text-center text-[8.5px] italic text-slate-500 pt-0.5">
                      ... {selectedMutations.length - maxRows} data lainnya tidak dicetak
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="text-center font-bold text-slate-700 py-0.5 text-[10px]">
              {doubleDivider}
            </div>

            {/* Tanda Tangan / Verifikasi Fisik */}
            <div className="pt-2 pb-1 text-[9px] space-y-4">
              <div className="flex justify-between px-1 text-center">
                <div>
                  <div className="text-slate-600 text-[8px]">Kasir Bertugas:</div>
                  <div className="h-6"></div>
                  <div className="font-bold border-t border-slate-400 pt-0.5 text-[8.5px]">
                    ( {shift.cashierName || 'Kasir'} )
                  </div>
                </div>
                <div>
                  <div className="text-slate-600 text-[8px]">Owner / Supervisor:</div>
                  <div className="h-6"></div>
                  <div className="font-bold border-t border-slate-400 pt-0.5 text-[8.5px]">
                    ( .................... )
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Barcode / Info */}
            <div className="text-center space-y-0.5 pt-2 border-t border-dashed border-slate-300">
              <div className="font-mono text-xs tracking-widest font-extrabold text-slate-800">
                ||| | |||| | ||| |||| | || | |||| ||
              </div>
              <p className="text-[8px] text-slate-500">
                {storeProfile.receiptFooter || 'JU-FAT CELL • TRANSAKSI AMAN & TERPERCAYA'}
              </p>
              <p className="text-[7.5px] text-slate-400">
                Dicetak Otomatis dari Sistem POS Ju-Fat Cell
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-2.5 mt-2 border-t border-slate-100 shrink-0 space-y-2">
          {/* Row 1: Direct Bluetooth & RawBT Mobile Thermal Print */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrintBluetooth}
              disabled={isPrintingBT}
              className="py-2.5 px-3 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 hover:from-teal-600 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shadow-teal-900/20 cursor-pointer active:scale-95 disabled:opacity-50"
              title="Sambungkan dan cetak langsung via Bluetooth browser (BLE POS Printer)"
            >
              {isPrintingBT ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                  <span>Menghubungkan Printer...</span>
                </>
              ) : (
                <>
                  <Bluetooth className="w-4 h-4 text-cyan-300" />
                  <span>Cetak ke Printer Bluetooth</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrintRawBT}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
              title="Cetak lewat aplikasi RawBT Android (Sangat cocok untuk printer Bluetooth HP)"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Cetak via RawBT (Android)</span>
            </button>
          </div>

          {/* Row 2: Secondary / Fallback Print & Share & Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleShareReceipt}
              className="flex-1 py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              title="Kirim laporan kas ke WhatsApp atau bagikan via HP"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kirim WA / Share</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-2 px-2.5 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              title="Gunakan dialog print sistem standar (USB / Windows / Mac)"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print USB / PC</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
