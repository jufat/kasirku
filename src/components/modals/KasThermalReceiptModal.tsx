import React, { useState } from 'react';
import { Printer, X } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { CashMutation } from '../../types/pos';

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
        </div>

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
        <div className="flex items-center gap-2 pt-3 mt-2 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer text-center"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-teal-900/20 cursor-pointer active:scale-95"
          >
            <Printer className="w-3.5 h-3.5 text-amber-300" />
            <span>Cetak ke Printer Termal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
