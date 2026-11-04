import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Copy,
  Check,
  Sparkles,
  Smartphone,
  Receipt,
  CreditCard,
  Bluetooth,
  RefreshCw,
  AlertTriangle,
  Share2,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import {
  POSTransaction,
  AgencyTransaction,
  ServiceTicket,
  AtmMiniTransaction,
  PPOBTransaction,
  PrintOrder,
} from '../../types/pos';
import {
  isWebBluetoothSupported,
  printViaWebBluetooth,
  printViaRawBT,
  shareReceiptText,
  getSavedBluetoothDeviceName,
  forgetBluetoothDevice,
} from '../../utils/thermalPrinter';

export const ThermalReceiptModal: React.FC = () => {
  const { isReceiptModalOpen, closeReceipt, receiptData, storeProfile } = usePOS();
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(() => {
    try {
      return (localStorage.getItem('jufat_thermal_paper_width') as '58mm' | '80mm') || '58mm';
    } catch {
      return '58mm';
    }
  });
  const [copied, setCopied] = useState(false);
  const [isPrintingBT, setIsPrintingBT] = useState(false);
  const [btStatus, setBtStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [btMessage, setBtMessage] = useState('');
  const [savedBtDevice, setSavedBtDevice] = useState<string>(getSavedBluetoothDeviceName());

  useEffect(() => {
    if (isReceiptModalOpen) {
      setSavedBtDevice(getSavedBluetoothDeviceName());
      setBtStatus('idle');
      setBtMessage('');
    }
  }, [isReceiptModalOpen]);

  if (!isReceiptModalOpen || !receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSetPaperWidth = (width: '58mm' | '80mm') => {
    setPaperWidth(width);
    try {
      localStorage.setItem('jufat_thermal_paper_width', width);
    } catch {
      // ignore
    }
  };

  const isPOS = 'items' in receiptData && 'invoiceNo' in receiptData;
  const isPrintOrder = 'items' in receiptData && 'remainingAmount' in receiptData && 'downPayment' in receiptData;
  const isAgency = 'nominal' in receiptData && 'counterFee' in receiptData && 'provider' in receiptData;
  const isService = 'deviceModel' in receiptData && 'problemDescription' in receiptData;
  const isAtmMini = 'terminalId' in receiptData && 'traceNo' in receiptData;
  const isPPOB = 'packageName' in receiptData && 'targetNumber' in receiptData;

  const posTx = isPOS ? (receiptData as POSTransaction) : null;
  const printTx = isPrintOrder ? (receiptData as PrintOrder) : null;
  const agTx = isAgency ? (receiptData as AgencyTransaction) : null;
  const srvTx = isService ? (receiptData as ServiceTicket) : null;
  const atmTx = isAtmMini ? (receiptData as AtmMiniTransaction) : null;
  const ppobTx = isPPOB ? (receiptData as unknown as PPOBTransaction) : null;

  // Determine Receipt Type Title & Accent
  let receiptCategoryBadge = 'STRUK TRANSAKSI';
  let receiptTitle = 'STRUK RESMI JU-FAT CELL';
  if (posTx) {
    receiptCategoryBadge = 'KASIR POS PENJUALAN';
    receiptTitle = '*** NOTA PENJUALAN KASIR ***';
  } else if (atmTx) {
    receiptCategoryBadge = 'ATM MINI / EDC';
    receiptTitle =
      atmTx.type === 'qris_atm'
        ? '*** STRUK TRANSAKSI QRIS ***'
        : atmTx.type === 'mbanking_atm'
        ? '*** STRUK MOBILE BANKING ***'
        : atmTx.type === 'tarik_tunai_atm'
        ? '*** STRUK TARIK TUNAI EDC ***'
        : atmTx.type === 'topup_ewallet_atm'
        ? '*** STRUK TOP UP E-WALLET ***'
        : atmTx.type === 'transfer_atm'
        ? '*** STRUK TRANSFER EDC ***'
        : '*** STRUK EDC MINI ATM ***';
  } else if (srvTx) {
    receiptCategoryBadge = 'SERVICE HP & ELEKTRONIK';
    receiptTitle =
      srvTx.status === 'diambil'
        ? '*** STRUK PELUNASAN SERVIS HP ***'
        : srvTx.status === 'selesai'
        ? '*** NOTA SERVIS SELESAI (SIAP AMBIL) ***'
        : '*** NOTA TANDA TERIMA SERVIS HP ***';
  } else if (printTx) {
    receiptCategoryBadge = 'PERCETAKAN & FOTOKOPI';
    receiptTitle =
      printTx.remainingAmount === 0 || printTx.status === 'selesai' || printTx.status === 'diambil'
        ? '*** STRUK PEMBAYARAN PERCETAKAN ***'
        : '*** NOTA ORDER PERCETAKAN ***';
  } else if (ppobTx) {
    receiptCategoryBadge = 'PPOB & PULSA';
    receiptTitle =
      ppobTx.category === 'game'
        ? '*** STRUK TOP UP & VOUCHER GAME ***'
        : '*** STRUK TRANSAKSI PPOB & PULSA ***';
  } else if (agTx) {
    receiptCategoryBadge = 'TRANSFER & LOKET AGEN';
    receiptTitle = '*** STRUK TRANSAKSI LOKET AGEN ***';
  }

  const divider =
    paperWidth === '58mm'
      ? '--------------------------------'
      : '------------------------------------------------';
  const doubleDivider =
    paperWidth === '58mm'
      ? '================================'
      : '================================================';

  // Plain-text generator for Bluetooth, RawBT, WhatsApp, or clipboard
  const generateReceiptText = (): string => {
    let lines: string[] = [];
    lines.push(storeProfile.name || 'JU-FAT CELL');
    if (storeProfile.subtitle) lines.push(storeProfile.subtitle);
    if (storeProfile.address) lines.push(storeProfile.address);
    if (storeProfile.phone) lines.push(`WA/Telp: ${storeProfile.phone}`);
    lines.push(divider);
    lines.push(receiptTitle);
    lines.push(divider);

    if (posTx) {
      lines.push(`No Faktur : ${posTx.invoiceNo}`);
      lines.push(`Tanggal   : ${posTx.date}`);
      lines.push(`Kasir     : ${posTx.cashier}`);
      lines.push(`Pelanggan : ${posTx.customerName}`);
      lines.push(divider);
      posTx.items.forEach((item) => {
        lines.push(`${item.product.name}`);
        lines.push(`  ${item.quantity} x Rp ${item.product.price.toLocaleString('id-ID')} = Rp ${item.subtotal.toLocaleString('id-ID')}`);
      });
      lines.push(divider);
      if (posTx.discount > 0) lines.push(`Diskon    : -Rp ${posTx.discount.toLocaleString('id-ID')}`);
      if (posTx.tax > 0) lines.push(`PPN       : Rp ${posTx.tax.toLocaleString('id-ID')}`);
      lines.push(`TOTAL     : Rp ${posTx.total.toLocaleString('id-ID')}`);
      lines.push(`Metode    : ${posTx.paymentMethod.toUpperCase()}`);
      if (posTx.paymentMethod === 'tunai') {
        lines.push(`Bayar     : Rp ${posTx.cashTendered.toLocaleString('id-ID')}`);
        lines.push(`Kembalian : Rp ${posTx.changeAmount.toLocaleString('id-ID')}`);
      }
    } else if (atmTx) {
      lines.push(`Terminal  : ${atmTx.terminalId}`);
      lines.push(`Trace No  : ${atmTx.traceNo}`);
      lines.push(`Appr Code : ${atmTx.approvalCode}`);
      lines.push(`Waktu     : ${atmTx.date}`);
      lines.push(`Bank/App  : ${atmTx.bankName} (${atmTx.cardType})`);
      lines.push(`No Kartu  : ${atmTx.cardNumberMasked}`);
      lines.push(`Nasabah   : ${atmTx.customerName}`);
      if (atmTx.targetAccountOrPhone) lines.push(`Tujuan    : ${atmTx.targetAccountOrPhone}`);
      lines.push(divider);
      lines.push(`Nominal   : Rp ${atmTx.nominal.toLocaleString('id-ID')}`);
      lines.push(`Admin EDC : Rp ${atmTx.adminEdcFee.toLocaleString('id-ID')}`);
      lines.push(`Jasa Konter: Rp ${atmTx.counterFee.toLocaleString('id-ID')}`);
      lines.push(`TOTAL     : Rp ${atmTx.totalDebited.toLocaleString('id-ID')}`);
      lines.push(
        atmTx.type === 'tarik_tunai_atm'
          ? `Tunai Diberikan: Rp ${atmTx.cashHandedOrReceived.toLocaleString('id-ID')}${
              atmTx.adminDeductionType === 'potong_tunai' ? ' (Potong Admin)' : ''
            }`
          : 'Status: BERHASIL (APPROVED)'
      );
    } else if (srvTx) {
      lines.push(`No Servis : ${srvTx.id}`);
      lines.push(`Tgl Masuk : ${srvTx.dateIn}`);
      lines.push(`Pelanggan : ${srvTx.customerName} (${srvTx.customerPhone || '-'})`);
      lines.push(`Tipe HP   : ${srvTx.deviceModel}`);
      if (srvTx.imeiOrSn) lines.push(`IMEI/SN   : ${srvTx.imeiOrSn}`);
      lines.push(`Teknisi   : ${srvTx.technicianName || 'Kang Ju-Fat'}`);
      lines.push(divider);
      lines.push(`Keluhan   : ${srvTx.problemDescription}`);
      lines.push(`Sparepart : Rp ${srvTx.sparepartCost.toLocaleString('id-ID')}`);
      lines.push(`Jasa Servis: Rp ${srvTx.laborFee.toLocaleString('id-ID')}`);
      lines.push(`TOTAL BIAYA: Rp ${srvTx.totalCost.toLocaleString('id-ID')}`);
      lines.push(`DP Masuk  : Rp ${srvTx.downPayment.toLocaleString('id-ID')}`);
      const sisa = Math.max(0, srvTx.totalCost - srvTx.downPayment);
      lines.push(`Status    : ${sisa === 0 || srvTx.status === 'diambil' ? 'LUNAS' : `Sisa Rp ${sisa.toLocaleString('id-ID')}`}`);
      lines.push(`Garansi   : ${srvTx.warrantyDays} Hari`);
    } else if (printTx) {
      lines.push(`No Order  : ${printTx.id}`);
      lines.push(`Tanggal   : ${printTx.date}`);
      lines.push(`Pelanggan : ${printTx.customerName} (${printTx.customerPhone || '-'})`);
      if (printTx.deadline) lines.push(`Deadline  : ${printTx.deadline}`);
      lines.push(divider);
      printTx.items.forEach((item) => {
        lines.push(`${item.serviceName} ${item.specNote ? `[${item.specNote}]` : ''}`);
        lines.push(`  ${item.quantity} ${item.unit} x Rp ${item.pricePerUnit.toLocaleString('id-ID')} = Rp ${item.subtotal.toLocaleString('id-ID')}`);
      });
      lines.push(divider);
      lines.push(`TOTAL ORDER: Rp ${printTx.totalAmount.toLocaleString('id-ID')}`);
      lines.push(`DP Dibayar : Rp ${printTx.downPayment.toLocaleString('id-ID')} (${printTx.paymentMethod.toUpperCase()})`);
      lines.push(`Status     : ${printTx.remainingAmount === 0 ? 'LUNAS' : `Sisa Tagihan Rp ${printTx.remainingAmount.toLocaleString('id-ID')}`}`);
    } else if (ppobTx) {
      lines.push(`No Ref    : ${ppobTx.refNo}`);
      lines.push(`Waktu     : ${ppobTx.date}`);
      lines.push(`Pelanggan : ${ppobTx.customerName}`);
      lines.push(`Provider  : ${ppobTx.provider}`);
      lines.push(`No Tujuan : ${ppobTx.targetNumber}`);
      lines.push(`Paket     : ${ppobTx.packageName}`);
      lines.push(divider);
      lines.push(`TOTAL     : Rp ${ppobTx.sellingPrice.toLocaleString('id-ID')}`);
      lines.push(`Status    : PENGISIAN SUKSES`);
    } else if (agTx) {
      lines.push(`No Ref    : ${agTx.refNo}`);
      lines.push(`Tanggal   : ${agTx.date}`);
      lines.push(`Layanan   : ${agTx.type.replace('_', ' ').toUpperCase()}`);
      lines.push(`Tujuan    : ${agTx.targetNumber} (${agTx.customerName})`);
      lines.push(divider);
      lines.push(`Pokok     : Rp ${agTx.nominal.toLocaleString('id-ID')}`);
      lines.push(`Admin     : Rp ${(agTx.bankAdminFee + agTx.counterFee).toLocaleString('id-ID')}`);
      lines.push(`TOTAL     : Rp ${agTx.totalCustomerPaid.toLocaleString('id-ID')}`);
    }

    lines.push(divider);
    lines.push(storeProfile.receiptFooter || 'TERIMA KASIH ATAS KUNJUNGAN ANDA!');
    lines.push('Simpan struk ini sebagai bukti pembayaran yang sah');
    return lines.join('\n');
  };

  const handleCopyTextReceipt = () => {
    const fullText = generateReceiptText();
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handlePrintBluetooth = async () => {
    setIsPrintingBT(true);
    setBtStatus('idle');
    setBtMessage('Mencari & menghubungkan ke printer Bluetooth...');

    try {
      const fullText = generateReceiptText();
      const res = await printViaWebBluetooth(fullText, paperWidth);
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
    const fullText = generateReceiptText();
    const success = printViaRawBT(fullText, paperWidth);
    if (!success) {
      handleCopyTextReceipt();
    }
  };

  const handleShareReceipt = async () => {
    const fullText = generateReceiptText();
    const didShare = await shareReceiptText(storeProfile.name || 'Struk Transaksi', fullText);
    if (!didShare) {
      handleCopyTextReceipt();
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
      <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-slate-200 flex flex-col max-h-[94vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900">Cetak Struk Termal POS</h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-teal-100 text-teal-800">
                  {receiptCategoryBadge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Format printer kasir thermal Bluetooth & USB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeReceipt}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Tutup Preview Struk"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Paper Size Selector & Quick Actions */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 mb-2 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600 text-[11px]">Lebar Kertas:</span>
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => handleSetPaperWidth('58mm')}
                className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer text-[11px] ${
                  paperWidth === '58mm'
                    ? 'bg-teal-700 text-white shadow-xs font-black'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                58mm (Kecil)
              </button>
              <button
                type="button"
                onClick={() => handleSetPaperWidth('80mm')}
                className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer text-[11px] ${
                  paperWidth === '80mm'
                    ? 'bg-teal-700 text-white shadow-xs font-black'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                80mm (Standar)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {savedBtDevice ? (
              <div className="flex items-center gap-1 bg-teal-100 text-teal-900 px-2 py-0.5 rounded-md text-[10px] font-bold">
                <Bluetooth className="w-3 h-3 text-teal-700" />
                <span className="max-w-[100px] truncate">{savedBtDevice}</span>
                <button
                  type="button"
                  onClick={handleForgetBT}
                  className="text-teal-700 hover:text-red-600 underline ml-1 cursor-pointer text-[9.5px]"
                  title="Putus & ganti printer Bluetooth"
                >
                  Ganti
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleCopyTextReceipt}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-teal-900 bg-white hover:bg-teal-50 border border-slate-300 hover:border-teal-400 rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0"
              title="Salin teks struk untuk dikirim via WhatsApp"
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
        <div className="flex-1 overflow-y-auto flex justify-center bg-slate-100 p-2 sm:p-3 rounded-xl border border-slate-200">
          <div
            id="printable-receipt"
            className={`w-full bg-white p-3.5 sm:p-4 rounded shadow-xs text-slate-900 font-mono leading-tight space-y-2 select-text border border-dashed border-slate-300 transition-all ${
              paperWidth === '58mm'
                ? 'max-w-[285px] text-[10.5px]'
                : 'max-w-[365px] text-[11.5px]'
            }`}
            style={{
              fontFamily: '"JetBrains Mono", monospace, Courier, "Courier New"',
              letterSpacing: '-0.02em',
            }}
          >
            {/* Header / Store Brand */}
            <div className="text-center space-y-0.5">
              {storeProfile.logo ? (
                <div className="flex justify-center mb-1.5">
                  <img
                    src={storeProfile.logo}
                    alt={storeProfile.name}
                    className="max-h-12 max-w-[130px] object-contain mx-auto"
                  />
                </div>
              ) : null}
              <h2 className="font-black text-sm tracking-wider uppercase text-slate-900">
                {storeProfile.name || 'JU-FAT CELL'}
              </h2>
              {storeProfile.subtitle && (
                <p className="text-[10px] text-slate-600 font-medium">{storeProfile.subtitle}</p>
              )}
              {storeProfile.address && (
                <p className="text-[9px] text-slate-500">{storeProfile.address}</p>
              )}
              {storeProfile.phone && (
                <p className="text-[9px] text-slate-500">WhatsApp / Telp: {storeProfile.phone}</p>
              )}
            </div>

            <div className="text-center font-bold text-slate-400 select-none overflow-hidden my-0.5 text-[10px]">
              {divider}
            </div>

            {/* Receipt Subtitle / Module Title */}
            <div className="text-center font-extrabold text-slate-900 py-0.5 text-[11px] tracking-wide">
              {receiptTitle}
            </div>

            <div className="text-center font-bold text-slate-400 select-none overflow-hidden my-0.5 text-[10px]">
              {divider}
            </div>

            {/* Transaction Metadata Info */}
            <div className="space-y-0.5 text-[10px]">
              {/* 1. POS Meta */}
              {posTx && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">No Faktur :</span>
                    <span className="font-bold text-slate-900">{posTx.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tanggal   :</span>
                    <span>{posTx.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kasir     :</span>
                    <span>{posTx.cashier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pelanggan :</span>
                    <span className="font-bold text-slate-900">{posTx.customerName}</span>
                  </div>
                  {posTx.note && (
                    <div className="flex justify-between text-slate-500 italic">
                      <span>Catatan   :</span>
                      <span>{posTx.note}</span>
                    </div>
                  )}
                </>
              )}

              {/* 2. ATM Mini Meta */}
              {atmTx && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Terminal ID:</span>
                    <span className="font-bold">{atmTx.terminalId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Trace No   :</span>
                    <span className="font-bold text-slate-900">{atmTx.traceNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Appr Code  :</span>
                    <span className="font-bold text-emerald-800">{atmTx.approvalCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Waktu Trx  :</span>
                    <span>{atmTx.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      {atmTx.type === 'qris_atm'
                        ? 'Penyedia   :'
                        : atmTx.type === 'mbanking_atm' || atmTx.cardType === 'M-Banking'
                        ? 'Kanal/Bank :'
                        : 'Bank/Kartu :'}
                    </span>
                    <span className="font-bold">
                      {atmTx.bankName} ({atmTx.cardType})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      {atmTx.type === 'qris_atm'
                        ? 'NMID / Ref :'
                        : atmTx.type === 'mbanking_atm' || atmTx.cardType === 'M-Banking'
                        ? 'Token/Ref  :'
                        : 'No Kartu   :'}
                    </span>
                    <span className="font-mono font-bold">{atmTx.cardNumberMasked}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Nasabah:</span>
                    <span className="font-bold text-slate-900">{atmTx.customerName}</span>
                  </div>
                  {atmTx.targetAccountOrPhone && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tujuan/Akun:</span>
                      <span className="font-mono font-bold text-teal-900">
                        {atmTx.targetAccountOrPhone}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* 3. Service HP Meta */}
              {srvTx && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">No Servis (SPK):</span>
                    <span className="font-black text-emerald-800">{srvTx.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tgl Masuk :</span>
                    <span>{srvTx.dateIn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pelanggan :</span>
                    <span className="font-bold text-slate-900">{srvTx.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">No Telp/WA:</span>
                    <span>{srvTx.customerPhone || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tipe HP   :</span>
                    <span className="font-black text-slate-900">{srvTx.deviceModel}</span>
                  </div>
                  {srvTx.imeiOrSn && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">IMEI / SN :</span>
                      <span className="font-mono">{srvTx.imeiOrSn}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Teknisi PJ:</span>
                    <span className="font-semibold">{srvTx.technicianName || 'Kang Ju-Fat'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status    :</span>
                    <span className="font-bold uppercase text-indigo-800">
                      {srvTx.status === 'diambil'
                        ? 'SUDAH DIAMBIL (LUNAS)'
                        : srvTx.status === 'selesai'
                        ? 'SELESAI (SIAP AMBIL)'
                        : srvTx.status === 'proses'
                        ? 'DALAM PENGERJAAN'
                        : 'ANTREAN MASUK'}
                    </span>
                  </div>
                </>
              )}

              {/* 4. Percetakan Meta */}
              {printTx && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">No Order  :</span>
                    <span className="font-black text-slate-900">{printTx.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tanggal   :</span>
                    <span>{printTx.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pelanggan :</span>
                    <span className="font-bold text-slate-900">{printTx.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">No Telp/WA:</span>
                    <span>{printTx.customerPhone || '-'}</span>
                  </div>
                  {printTx.deadline && (
                    <div className="flex justify-between text-amber-900 font-semibold">
                      <span>Deadline  :</span>
                      <span>{printTx.deadline}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status    :</span>
                    <span className="font-bold uppercase text-indigo-700">
                      {printTx.remainingAmount === 0 || printTx.status === 'selesai' || printTx.status === 'diambil'
                        ? 'LUNAS / SELESAI'
                        : printTx.status}
                    </span>
                  </div>
                </>
              )}

              {/* 5. Agency / PPOB Meta */}
              {agTx && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">No Ref    :</span>
                    <span className="font-bold text-slate-900">{agTx.refNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tanggal   :</span>
                    <span>{agTx.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Layanan   :</span>
                    <span className="uppercase font-bold">{agTx.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Provider  :</span>
                    <span className="font-bold">{agTx.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">No Tujuan :</span>
                    <span className="font-bold font-mono">{agTx.targetNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama      :</span>
                    <span>{agTx.customerName}</span>
                  </div>
                </>
              )}

              {ppobTx && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">No Ref    :</span>
                    <span className="font-bold text-slate-900">{ppobTx.refNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Waktu     :</span>
                    <span>{ppobTx.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Layanan   :</span>
                    <span className="font-bold uppercase">
                      {ppobTx.category === 'game' ? 'TOP UP GAME' : ppobTx.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      {ppobTx.category === 'game' ? 'Game/App  :' : 'Provider  :'}
                    </span>
                    <span className="font-bold">{ppobTx.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      {ppobTx.category === 'game' ? 'ID Akun   :' : 'No Tujuan :'}
                    </span>
                    <span className="font-mono font-bold text-slate-900">{ppobTx.targetNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pelanggan :</span>
                    <span>{ppobTx.customerName}</span>
                  </div>
                </>
              )}
            </div>

            <div className="text-center font-bold text-slate-400 select-none overflow-hidden my-0.5 text-[10px]">
              {divider}
            </div>

            {/* Rincian Item Transaksi */}

            {/* A. POS Items */}
            {posTx && (
              <div className="space-y-1.5 py-0.5">
                {posTx.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-bold text-slate-900">{item.product.name}</div>
                    <div className="flex justify-between text-slate-600 text-[10px]">
                      <span>
                        {item.quantity} {item.product.unit || 'pcs'} x Rp{' '}
                        {item.product.price.toLocaleString('id-ID')}
                      </span>
                      <span className="font-bold text-slate-900">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* B. Percetakan Items */}
            {printTx && (
              <div className="space-y-1.5 py-0.5">
                {printTx.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-bold text-slate-900">{item.serviceName}</div>
                    {item.specNote && (
                      <div className="text-[10px] text-slate-500 italic">[{item.specNote}]</div>
                    )}
                    <div className="flex justify-between text-slate-600 text-[10px]">
                      <span>
                        {item.quantity} {item.unit} x Rp {item.pricePerUnit.toLocaleString('id-ID')}
                      </span>
                      <span className="font-bold text-slate-900">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
                {printTx.fileOrNote && (
                  <div className="pt-1 text-[10px] text-slate-600 border-t border-dashed border-slate-200">
                    <span className="font-bold">Catatan/File:</span> {printTx.fileOrNote}
                  </div>
                )}
              </div>
            )}

            {/* C. Service HP Breakdown */}
            {srvTx && (
              <div className="space-y-1 py-0.5">
                <div className="text-[10px] text-slate-700 bg-slate-50 p-1 rounded border border-slate-200">
                  <span className="font-bold text-slate-900">Keluhan Kerusakan:</span>
                  <p className="mt-0.5 text-slate-800">{srvTx.problemDescription}</p>
                </div>
                {srvTx.technicianNote && (
                  <div className="text-[10px] text-slate-600 italic">
                    <span className="font-bold not-italic">Catatan Teknisi:</span> {srvTx.technicianNote}
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Estimasi Sparepart :</span>
                  <span className="font-mono">Rp {srvTx.sparepartCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Jasa Teknisi       :</span>
                  <span className="font-mono">Rp {srvTx.laborFee.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}

            {/* D. ATM Mini Breakdown */}
            {atmTx && (
              <div className="space-y-1 py-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Layanan Transaksi:</span>
                  <span className="font-bold uppercase text-slate-900">
                    {atmTx.type === 'tarik_tunai_atm'
                      ? 'TARIK TUNAI EDC'
                      : atmTx.type === 'transfer_atm'
                      ? 'TRANSFER EDC'
                      : atmTx.type === 'topup_ewallet_atm'
                      ? 'TOP UP E-WALLET'
                      : atmTx.type === 'mbanking_atm'
                      ? 'MOBILE BANKING'
                      : atmTx.type === 'qris_atm'
                      ? 'SISTEM QRIS'
                      : atmTx.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Nominal Pokok:</span>
                  <span className="font-mono font-bold">Rp {atmTx.nominal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Biaya Admin EDC/Bank:</span>
                  <span className="font-mono">Rp {atmTx.adminEdcFee.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Jasa Konter Ju-Fat:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    Rp {atmTx.counterFee.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            {/* E. Agency & PPOB Breakdown */}
            {agTx && (
              <div className="space-y-1 py-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Nominal Pokok:</span>
                  <span className="font-mono font-bold">Rp {agTx.nominal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Admin Bank:</span>
                  <span className="font-mono">Rp {agTx.bankAdminFee.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Jasa Loket:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    Rp {agTx.counterFee.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            {ppobTx && (
              <div className="space-y-1 py-0.5">
                <div className="flex justify-between font-bold text-slate-900">
                  <span className="text-slate-600">Paket/Voucher:</span>
                  <span>{ppobTx.packageName}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>Status Server:</span>
                  <span className="text-emerald-700 font-bold uppercase">{ppobTx.status}</span>
                </div>
              </div>
            )}

            <div className="text-center font-bold text-slate-400 select-none overflow-hidden my-0.5 text-[10px]">
              {divider}
            </div>

            {/* Totals & Payment Summary */}
            <div className="space-y-1 pt-0.5 text-xs">
              {/* POS Total */}
              {posTx && (
                <>
                  {posTx.discount > 0 && (
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Diskon:</span>
                      <span className="font-mono font-bold text-red-600">
                        -Rp {posTx.discount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  {posTx.tax > 0 && (
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>PPN:</span>
                      <span className="font-mono">Rp {posTx.tax.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-slate-900 text-sm">
                    <span>TOTAL:</span>
                    <span className="font-mono">Rp {posTx.total.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 text-[10px] pt-0.5">
                    <span>Metode Bayar:</span>
                    <span className="font-bold uppercase">{posTx.paymentMethod}</span>
                  </div>
                  {posTx.paymentMethod === 'tunai' ? (
                    <>
                      <div className="flex justify-between text-slate-700 text-[10px]">
                        <span>Uang Tunai (Bayar):</span>
                        <span className="font-mono">
                          Rp {posTx.cashTendered.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between font-black text-slate-900 text-[11px]">
                        <span>Kembalian:</span>
                        <span className="font-mono">
                          Rp {posTx.changeAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </>
                  ) : posTx.paymentMethod === 'hutang' ? (
                    <div className="flex justify-between font-bold text-red-700 text-[11px]">
                      <span>Status Pembayaran:</span>
                      <span>KASBON (HUTANG)</span>
                    </div>
                  ) : (
                    <div className="flex justify-between font-bold text-emerald-800 text-[11px]">
                      <span>Status Pembayaran:</span>
                      <span>LUNAS ({posTx.paymentMethod.toUpperCase()})</span>
                    </div>
                  )}
                </>
              )}

              {/* Service Total */}
              {srvTx && (
                <>
                  <div className="flex justify-between font-black text-slate-900 text-sm">
                    <span>TOTAL BIAYA SERVIS:</span>
                    <span className="font-mono">Rp {srvTx.totalCost.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold text-[10.5px]">
                    <span>DP / Uang Muka Masuk:</span>
                    <span className="font-mono">Rp {srvTx.downPayment.toLocaleString('id-ID')}</span>
                  </div>
                  {(() => {
                    const sisa = Math.max(0, srvTx.totalCost - srvTx.downPayment);
                    const isFullyPaid = sisa === 0 || srvTx.status === 'diambil';
                    return (
                      <div
                        className={`flex justify-between font-black text-[11px] pt-0.5 ${
                          isFullyPaid ? 'text-emerald-800' : 'text-red-600'
                        }`}
                      >
                        <span>{isFullyPaid ? 'STATUS PELUNASAN:' : 'SISA PELUNASAN:'}</span>
                        <span className="font-mono">
                          {isFullyPaid ? 'LUNAS' : `Rp ${sisa.toLocaleString('id-ID')}`}
                        </span>
                      </div>
                    );
                  })()}
                </>
              )}

              {/* Percetakan Total */}
              {printTx && (
                <>
                  <div className="flex justify-between font-black text-slate-900 text-sm">
                    <span>TOTAL ORDER CETAK:</span>
                    <span className="font-mono">Rp {printTx.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 text-[10.5px]">
                    <span>Pembayaran Masuk:</span>
                    <span className="font-mono font-bold">
                      Rp {printTx.downPayment.toLocaleString('id-ID')} ({printTx.paymentMethod.toUpperCase()})
                    </span>
                  </div>
                  <div
                    className={`flex justify-between font-black text-[11px] pt-0.5 ${
                      printTx.remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-800'
                    }`}
                  >
                    <span>
                      {printTx.remainingAmount > 0 ? 'SISA TAGIHAN:' : 'STATUS PEMBAYARAN:'}
                    </span>
                    <span className="font-mono">
                      {printTx.remainingAmount > 0
                        ? `Rp ${printTx.remainingAmount.toLocaleString('id-ID')}`
                        : 'LUNAS'}
                    </span>
                  </div>
                </>
              )}

              {/* ATM Mini Total */}
              {atmTx && (
                <>
                  <div className="flex justify-between font-black text-slate-900 text-sm">
                    <span>TOTAL TRANSAKSI:</span>
                    <span className="font-mono">
                      Rp {atmTx.totalDebited.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {atmTx.type === 'tarik_tunai_atm' ? (
                    <div className="flex justify-between text-emerald-800 font-black text-[11px] bg-emerald-50/80 p-1 rounded border border-emerald-200">
                      <span>Uang Fisik Diterima Nasabah:</span>
                      <span className="font-mono">
                        Rp {atmTx.cashHandedOrReceived.toLocaleString('id-ID')}
                        {atmTx.adminDeductionType === 'potong_tunai' && (
                          <span className="text-[9px] font-normal text-amber-800 ml-1">(Potong Admin)</span>
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-slate-700 text-[10px]">
                      <span>Uang Diterima Kasir:</span>
                      <span className="font-mono font-bold">
                        Rp {atmTx.totalDebited.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  <div className="text-center text-[10px] text-emerald-800 font-extrabold bg-emerald-50 py-1 rounded mt-1 border border-emerald-300">
                    STATUS: TRANSAKSI BERHASIL (APPROVED)
                  </div>
                </>
              )}

              {/* Agency Total */}
              {agTx && (
                <>
                  <div className="flex justify-between font-black text-slate-900 text-sm">
                    <span>TOTAL DIBAYAR:</span>
                    <span className="font-mono">
                      Rp {agTx.totalCustomerPaid.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-center text-[10px] text-emerald-800 font-extrabold bg-emerald-50 py-1 rounded mt-1 border border-emerald-300">
                    STATUS: TRANSAKSI BERHASIL
                  </div>
                </>
              )}

              {/* PPOB Total */}
              {ppobTx && (
                <>
                  <div className="flex justify-between font-black text-slate-900 text-sm">
                    <span>TOTAL BAYAR:</span>
                    <span className="font-mono">
                      Rp {ppobTx.sellingPrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700 text-[10px] pt-0.5">
                    <span>Metode: {ppobTx.paymentMethod.toUpperCase()}</span>
                    <span>Produk: {ppobTx.packageName}</span>
                  </div>
                  <div className="text-center text-[10px] text-emerald-800 font-extrabold bg-emerald-50 py-1 rounded mt-1 border border-emerald-300">
                    STATUS: PENGISIAN SUKSES
                  </div>
                </>
              )}
            </div>

            <div className="text-center font-bold text-slate-400 select-none overflow-hidden my-1 text-[10px]">
              {divider}
            </div>

            {/* Special Instructions & Terms */}
            {srvTx ? (
              <div className="space-y-1 text-[8.5px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                <div className="font-bold text-slate-800 text-[9px] text-center">
                  KETENTUAN KLAIM & PENGAMBILAN SERVIS:
                </div>
                <p>1. Wajib membawa struk/nota ini saat mengambil unit perangkat.</p>
                <p>2. Garansi servis ({srvTx.warrantyDays} hari) berlaku untuk kerusakan yang sama.</p>
                <p>3. Garansi tidak berlaku jika segel rusak, terkena cairan, atau jatuh.</p>
                <p>4. Barang yang tidak diambil &gt; 30 hari di luar tanggung jawab konter.</p>
              </div>
            ) : printTx ? (
              <div className="space-y-1 text-[8.5px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200 text-center">
                <p className="font-bold text-slate-800">KETENTUAN HASIL CETAKAN:</p>
                <p>Harap periksa kembali hasil cetakan sebelum meninggalkan konter.</p>
                <p>File pesanan disimpan maksimal 7 hari dari tanggal order.</p>
              </div>
            ) : null}

            {/* Barcode Graphic Representation */}
            <div className="text-center space-y-1 pt-1 pb-1">
              <div className="font-mono text-xs tracking-widest font-extrabold text-slate-800 select-none">
                ||| | |||| | ||| |||| | || | |||| ||
              </div>
              <p className="text-[9px] font-bold text-slate-600 uppercase">
                {srvTx
                  ? `GARANSI RESMI JU-FAT: ${srvTx.warrantyDays} HARI`
                  : storeProfile.receiptFooter || 'TERIMA KASIH ATAS KUNJUNGAN ANDA!'}
              </p>
              <p className="text-[8px] text-slate-400">
                {srvTx
                  ? 'Simpan struk fisik ini sebagai bukti resmi garansi'
                  : 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-2.5 mt-2 border-t border-slate-100 shrink-0 space-y-2">
          {/* Row 1: Direct Mobile & Bluetooth Thermal Print */}
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
              onClick={closeReceipt}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleShareReceipt}
              className="flex-1 py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              title="Kirim struk ke WhatsApp pelanggan atau bagikan via HP"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kirim Struk (WA)</span>
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
