import React, { useState } from 'react';
import {
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Smartphone,
  CheckCircle,
  History,
  Printer,
  Sparkles,
  Wifi,
  BatteryCharging,
  Layers,
  Search,
  ShieldCheck,
  Building,
  RotateCcw,
  QrCode,
  ScanLine,
  SmartphoneNfc,
  X,
  Banknote,
  AlertCircle,
  Info,
  Menu,
  ArrowLeft,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { AtmMiniType } from '../../types/pos';

const BANK_LIST = [
  'BRI',
  'BCA',
  'Bank Mandiri',
  'BNI',
  'BSI (Bank Syariah Indonesia)',
  'CIMB Niaga',
  'Bank Danamon',
  'Bank Jateng / BPD',
  'Bank Jatim',
  'Bank BJB',
  'SeaBank',
  'Bank Jago',
];

const CARD_TYPES = ['GPN', 'Mastercard', 'Visa', 'BCA Card'] as const;

const EWALLET_LIST = [
  'DANA',
  'GoPay Customer',
  'GoPay Driver',
  'OVO',
  'ShopeePay',
  'LinkAja',
  'Maxim Driver',
  'AstraPay',
];

const MBANKING_APPS = [
  'BRImo (Bank BRI)',
  'BCA Mobile / myBCA',
  'Livin\' by Mandiri',
  'BNI Mobile Banking',
  'BSI Mobile',
  'CIMB OCTO Mobile',
  'SeaBank App',
  'Bank Jago App',
  'Allo Bank',
  'Bank BJB Digi',
  'Aplikasi M-Banking Lainnya',
];

const MBANKING_TYPES = [
  'Tarik Tunai Tanpa Kartu (Cardless Cashout)',
  'Transfer Antar Bank via M-Banking',
  'Setor Tunai Tanpa Kartu (Cardless Deposit)',
  'Bayar Tagihan / Virtual Account M-Banking',
];

const QRIS_PROVIDERS = [
  'QRIS EDC Merchant Ju-Fat (NMID: ID10202688190)',
  'QRIS Statis Toko Ju-Fat Cell',
  'QRIS BCA Merchant',
  'QRIS BRImo Merchant',
  'QRIS Livin\' Mandiri Merchant',
  'QRIS ShopeePay Merchant',
  'QRIS GoPay / DANA Bisnis',
];

const QRIS_TYPES = [
  'Terima Pembayaran QRIS (Nasabah Scan QR Toko)',
  'Tarik Tunai QRIS (QRIS Cashout - Tarik Uang Tunai)',
  'Transfer / Top Up Saldo QRIS',
];

export const AtmMiniView: React.FC = () => {
  const {
    atmMiniTransactions,
    recordAtmMiniTransaction,
    openReceipt,
    setActiveTab,
    setIsMobileSidebarOpen,
  } = usePOS();

  // Mode Selection
  const [activeMode, setActiveMode] = useState<AtmMiniType>('tarik_tunai_atm');

  // Form states
  const [bankName, setBankName] = useState('BRI');
  const [cardType, setCardType] = useState<'GPN' | 'Mastercard' | 'Visa' | 'BCA Card' | 'QRIS' | 'M-Banking'>('GPN');
  const [cardNumberLast4, setCardNumberLast4] = useState('7192');
  const [customerName, setCustomerName] = useState('');
  const [targetAccountOrPhone, setTargetAccountOrPhone] = useState('');
  const [ewalletProvider, setEwalletProvider] = useState('DANA');
  const [mbankingApp, setMbankingApp] = useState(MBANKING_APPS[0]);
  const [mbankingType, setMbankingType] = useState(MBANKING_TYPES[0]);
  const [qrisProvider, setQrisProvider] = useState(QRIS_PROVIDERS[0]);
  const [qrisType, setQrisType] = useState(QRIS_TYPES[0]);
  const [qrisRrn, setQrisRrn] = useState('RRN-882901');
  const [nominal, setNominal] = useState<number>(500000);
  const [adminEdcFee, setAdminEdcFee] = useState<number>(3000);
  const [counterFee, setCounterFee] = useState<number>(5000);
  const [note, setNote] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Table filter
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [mobileTab, setMobileTab] = useState<'terminal' | 'history'>('terminal');

  // Interactive Payment Dialog states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [cashReceivedInput, setCashReceivedInput] = useState<number>(0);
  const [selectedTxDetail, setSelectedTxDetail] = useState<any | null>(null);

  // Switch mode defaults
  const handleModeChange = (mode: AtmMiniType) => {
    setActiveMode(mode);
    if (mode === 'tarik_tunai_atm') {
      setAdminEdcFee(3000);
      setCounterFee(5000);
      setCardType('GPN');
    } else if (mode === 'transfer_atm') {
      setAdminEdcFee(2500);
      setCounterFee(6000);
      setCardType('GPN');
    } else if (mode === 'topup_ewallet_atm') {
      setAdminEdcFee(1500);
      setCounterFee(3500);
      setCardType('GPN');
    } else if (mode === 'mbanking_atm') {
      setAdminEdcFee(2500);
      setCounterFee(5000);
      setCardType('M-Banking');
    } else if (mode === 'qris_atm') {
      setAdminEdcFee(1000);
      setCounterFee(3000);
      setCardType('QRIS');
    } else if (mode === 'cek_saldo_atm') {
      setNominal(0);
      setAdminEdcFee(0);
      setCounterFee(2000);
    }
  };

  const totalDebited = nominal + adminEdcFee + counterFee;

  // Step 1: Open Payment & Confirmation Dialog
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeMode !== 'cek_saldo_atm' && nominal <= 0) {
      alert('Nominal transaksi harus lebih dari Rp 0!');
      return;
    }

    if ((activeMode === 'topup_ewallet_atm' || activeMode === 'transfer_atm') && !targetAccountOrPhone.trim()) {
      alert('Nomor tujuan / rekening / no HP e-wallet wajib diisi!');
      return;
    }

    // Default cash received in modal to totalDebited
    setCashReceivedInput(totalDebited);
    setIsPaymentModalOpen(true);
  };

  // Step 2: Confirm and process transaction + open thermal receipt
  const handleConfirmAndExecuteTransaction = () => {
    let providerName = bankName;
    let actualCardType = cardType;
    let maskedIdentifier = `5221 **** **** ${cardNumberLast4.trim() || '8888'}`;
    let destination: string | undefined = undefined;

    if (activeMode === 'topup_ewallet_atm') {
      providerName = ewalletProvider;
      destination = `${targetAccountOrPhone} (${ewalletProvider})`;
    } else if (activeMode === 'transfer_atm') {
      destination = targetAccountOrPhone;
    } else if (activeMode === 'mbanking_atm') {
      providerName = mbankingApp;
      actualCardType = 'M-Banking';
      maskedIdentifier = `APP ${mbankingApp.split(' ')[0]} · ${cardNumberLast4.trim() ? 'Kode: ' + cardNumberLast4 : 'Cardless'}`;
      destination = targetAccountOrPhone ? `${targetAccountOrPhone} [${mbankingType.split(' ')[0]}]` : mbankingType;
    } else if (activeMode === 'qris_atm') {
      providerName = qrisProvider.split(' ')[0] + ' ' + (qrisProvider.split(' ')[1] || '');
      actualCardType = 'QRIS';
      maskedIdentifier = qrisRrn || `RRN-${Math.floor(100000 + Math.random() * 900000)}`;
      destination = `QRIS · ${qrisType}`;
    }

    const tx = recordAtmMiniTransaction(
      activeMode,
      providerName,
      actualCardType,
      maskedIdentifier,
      customerName ||
        (activeMode === 'qris_atm'
          ? 'Pelanggan QRIS'
          : activeMode === 'mbanking_atm'
          ? 'Nasabah M-Banking'
          : 'Nasabah EDC'),
      nominal,
      adminEdcFee,
      counterFee,
      destination,
      note
    );

    setIsPaymentModalOpen(false);

    const serviceName =
      activeMode === 'tarik_tunai_atm'
        ? 'Tarik Tunai'
        : activeMode === 'transfer_atm'
        ? 'Transfer EDC'
        : activeMode === 'topup_ewallet_atm'
        ? 'Top Up E-Wallet'
        : activeMode === 'mbanking_atm'
        ? 'Mobile Banking'
        : 'Sistem QRIS';

    setToastMessage(`Transaksi ${serviceName} berhasil diproses & dicatat ke kas laci!`);
    setTimeout(() => setToastMessage(''), 4500);

    // Auto open receipt thermal modal
    openReceipt(tx);

    // Reset fields
    setTargetAccountOrPhone('');
    setNote('');
  };

  // Calculations for daily metrics
  const totalTarikHariIni = atmMiniTransactions
    .filter((t) => t.type === 'tarik_tunai_atm')
    .reduce((acc, t) => acc + t.nominal, 0);

  const totalTransferHariIni = atmMiniTransactions
    .filter((t) => t.type === 'transfer_atm')
    .reduce((acc, t) => acc + t.nominal, 0);

  const totalTopUpHariIni = atmMiniTransactions
    .filter((t) => t.type === 'topup_ewallet_atm')
    .reduce((acc, t) => acc + t.nominal, 0);

  const totalMbankingQrisHariIni = atmMiniTransactions
    .filter((t) => t.type === 'mbanking_atm' || t.type === 'qris_atm')
    .reduce((acc, t) => acc + t.nominal, 0);

  const totalLabaAtmMini = atmMiniTransactions.reduce((acc, t) => acc + t.counterFee, 0);

  const filteredTx = atmMiniTransactions.filter((tx) => {
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesSearch =
      tx.customerName.toLowerCase().includes(search.toLowerCase()) ||
      tx.traceNo.includes(search) ||
      tx.bankName.toLowerCase().includes(search.toLowerCase()) ||
      (tx.targetAccountOrPhone && tx.targetAccountOrPhone.includes(search));
    return matchesType && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#f8fafc]">
      {/* Mobile Header Bar & Switcher (No bottom menu obstructing the view) */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 px-2.5 py-1.5 shrink-0 gap-2">
        <div className="grid grid-cols-2 flex-1 p-0.5 bg-slate-100 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setMobileTab('terminal')}
            className={`py-1.5 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'terminal'
                ? 'bg-white text-teal-900 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>EDC Transaksi</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('history')}
            className={`py-1.5 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'history'
                ? 'bg-white text-teal-900 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat ({atmMiniTransactions.length})</span>
          </button>
        </div>

        {/* Quick Nav: Back to Kasir or Open Sidebar Drawer */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('kasir')}
            className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
            title="Kembali ke Kasir Utama"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kasir</span>
          </button>
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg transition flex items-center cursor-pointer"
            title="Buka Menu Lengkap POS"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Left Column: EDC ATM Mini Terminal & Transaction Form */}
      <div
        className={`${
          mobileTab === 'terminal' ? 'flex' : 'hidden'
        } md:flex w-full md:w-[490px] bg-white md:border-r border-slate-200 flex-col h-full shadow-xs shrink-0 overflow-y-auto pb-10 md:pb-4`}
      >
        {/* Terminal Header & Device Status */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-md">
                <CreditCard className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold tracking-tight">ATM Mini & EDC</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-300 text-amber-950 uppercase tracking-wider">
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-teal-100">Terminal: EDC-JUFAT-01 · Sunmi P2 Pro Multi-Payment</p>
              </div>
            </div>

            {/* Device telemetry status */}
            <div className="text-right text-[10px] text-emerald-200/90 font-mono space-y-0.5">
              <div className="flex items-center gap-1 justify-end">
                <Wifi className="w-3 h-3 text-emerald-300" />
                <span>4G LTE 98%</span>
              </div>
              <div className="flex items-center gap-1 justify-end">
                <BatteryCharging className="w-3 h-3 text-emerald-300" />
                <span>Baterai 95%</span>
              </div>
            </div>
          </div>

          {/* 5 Main Mode Tabs: Tarik Tunai, Transfer, E-Wallet, Mobile Banking, Sistem QRIS */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mt-3 sm:mt-4 pt-3 border-t border-emerald-800/80">
            <button
              type="button"
              onClick={() => handleModeChange('tarik_tunai_atm')}
              className={`py-2 px-1 text-center rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                activeMode === 'tarik_tunai_atm'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'bg-emerald-900/60 hover:bg-emerald-800 text-white'
              }`}
              title="Tarik Uang Tunai Kartu ATM"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-tight">Tarik Tunai</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('transfer_atm')}
              className={`py-2 px-1 text-center rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                activeMode === 'transfer_atm'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'bg-emerald-900/60 hover:bg-emerald-800 text-white'
              }`}
              title="Transfer Antar Bank via EDC"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-tight">Transfer EDC</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('topup_ewallet_atm')}
              className={`py-2 px-1 text-center rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                activeMode === 'topup_ewallet_atm'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'bg-emerald-900/60 hover:bg-emerald-800 text-white'
              }`}
              title="Top Up Saldo E-Wallet"
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-tight">E-Wallet</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('mbanking_atm')}
              className={`py-2 px-1 text-center rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                activeMode === 'mbanking_atm'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'bg-emerald-900/60 hover:bg-emerald-800 text-white'
              }`}
              title="Layanan Mobile Banking (BRImo, BCA Mobile, Livin, dll)"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-tight">M-Banking</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('qris_atm')}
              className={`py-2 px-1 text-center rounded-lg text-[11px] font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                activeMode === 'qris_atm'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'bg-emerald-900/60 hover:bg-emerald-800 text-white'
              }`}
              title="Sistem QRIS Dinamis & Statis"
            >
              <QrCode className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-tight">Sistem QRIS</span>
            </button>
          </div>
        </div>

        {/* Transaction Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 pb-12 sm:pb-8 space-y-4 flex-1">
          {toastMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Mode Header Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Layanan Dipilih:</span>
            <span className="font-extrabold uppercase px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 text-right">
              {activeMode === 'tarik_tunai_atm'
                ? 'Tarik Uang Tunai Kartu Debit'
                : activeMode === 'transfer_atm'
                ? 'Transfer Antar Bank via EDC'
                : activeMode === 'topup_ewallet_atm'
                ? 'Top Up Dompet Digital (E-Wallet)'
                : activeMode === 'mbanking_atm'
                ? 'Mobile Banking (BRImo, BCA, Livin)'
                : 'Sistem Pembayaran QRIS (Scan Dynamic/Static)'}
            </span>
          </div>

          {/* Dynamic Configuration per Service Mode */}

          {/* 1. Mobile Banking Mode */}
          {activeMode === 'mbanking_atm' && (
            <div className="space-y-3 bg-purple-50/60 p-3.5 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                <SmartphoneNfc className="w-4 h-4 text-purple-700" />
                <span>Konfigurasi Mobile Banking (M-Banking)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Aplikasi M-Banking
                  </label>
                  <select
                    value={mbankingApp}
                    onChange={(e) => setMbankingApp(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-lg font-semibold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  >
                    {MBANKING_APPS.map((app) => (
                      <option key={app} value={app}>
                        {app}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Jenis Transaksi
                  </label>
                  <select
                    value={mbankingType}
                    onChange={(e) => setMbankingType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-lg font-semibold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  >
                    {MBANKING_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kode Tarik Tunai / Token / Ref
                  </label>
                  <input
                    type="text"
                    value={cardNumberLast4}
                    onChange={(e) => setCardNumberLast4(e.target.value)}
                    placeholder="Contoh: 819201 / Token"
                    className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nama Pemilik Akun / Nasabah
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama Nasabah M-Banking"
                    className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-lg font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nomor HP Nasabah / Rekening Tujuan (Opsional)
                </label>
                <input
                  type="text"
                  value={targetAccountOrPhone}
                  onChange={(e) => setTargetAccountOrPhone(e.target.value)}
                  placeholder="0812xxxx atau Nomor Rekening Bank"
                  className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-lg font-mono focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 2. Sistem QRIS Mode */}
          {activeMode === 'qris_atm' && (
            <div className="space-y-3 bg-teal-50/60 p-3.5 rounded-xl border border-teal-200">
              <div className="flex items-center justify-between text-teal-900 font-bold text-xs">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-teal-700" />
                  <span>Sistem Pembayaran QRIS Nasional (EDC Merchant)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-600 text-white font-bold">
                  NMID: ID10202688190
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Penyedia / Kanal QRIS
                  </label>
                  <select
                    value={qrisProvider}
                    onChange={(e) => setQrisProvider(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-teal-300 rounded-lg font-semibold focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  >
                    {QRIS_PROVIDERS.map((qp) => (
                      <option key={qp} value={qp}>
                        {qp}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tipe Transaksi QRIS
                  </label>
                  <select
                    value={qrisType}
                    onChange={(e) => setQrisType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-teal-300 rounded-lg font-semibold focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  >
                    {QRIS_TYPES.map((qt) => (
                      <option key={qt} value={qt}>
                        {qt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    No Referensi RRN / Order ID
                  </label>
                  <input
                    type="text"
                    value={qrisRrn}
                    onChange={(e) => setQrisRrn(e.target.value)}
                    placeholder="RRN-882901"
                    className="w-full px-3 py-2 text-xs bg-white border border-teal-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nama Akun Pembayar / Pelanggan
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso / QRIS BCA"
                    className="w-full px-3 py-2 text-xs bg-white border border-teal-300 rounded-lg font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* QRIS Live Visual Simulation Box */}
              <div className="p-2.5 bg-white rounded-lg border border-teal-200 flex items-center justify-between gap-3 shadow-2xs">
                <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-slate-900 leading-tight">
                    QRIS Siap Di-Scan Pelanggan
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Mendukung semua bank (BCA, BRI, Mandiri, BNI) & E-Wallet (Gojek, Dana, OVO, Shopee)
                  </div>
                </div>
                <span className="px-2 py-1 text-[9px] font-bold uppercase rounded bg-teal-100 text-teal-800 shrink-0">
                  QR Dinamis Aktif
                </span>
              </div>
            </div>
          )}

          {/* 3. Top Up E-Wallet Mode */}
          {activeMode === 'topup_ewallet_atm' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Pilih Dompet Digital (E-Wallet)
                </label>
                <select
                  value={ewalletProvider}
                  onChange={(e) => setEwalletProvider(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {EWALLET_LIST.map((ew) => (
                    <option key={ew} value={ew}>
                      {ew}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nomor Handphone E-Wallet
                </label>
                <input
                  type="text"
                  required
                  value={targetAccountOrPhone}
                  onChange={(e) => setTargetAccountOrPhone(e.target.value)}
                  placeholder="Contoh: 085811223344"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    4 Digit Terakhir Kartu Debitur
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={cardNumberLast4}
                    onChange={(e) => setCardNumberLast4(e.target.value.replace(/\D/g, ''))}
                    placeholder="7192"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nama Pemilik E-Wallet
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama Penerima"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Tarik Tunai & Transfer Bank Modes */}
          {(activeMode === 'tarik_tunai_atm' || activeMode === 'transfer_atm') && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Bank Penerbit Kartu
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {BANK_LIST.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Jaringan Kartu ATM
                  </label>
                  <select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {CARD_TYPES.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    4 Digit Terakhir Kartu
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={cardNumberLast4}
                    onChange={(e) => setCardNumberLast4(e.target.value.replace(/\D/g, ''))}
                    placeholder="7192"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nama Pemilik / Nasabah
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama Nasabah"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {activeMode === 'transfer_atm' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nomor Rekening Tujuan & Bank Penerima
                  </label>
                  <input
                    type="text"
                    required
                    value={targetAccountOrPhone}
                    onChange={(e) => setTargetAccountOrPhone(e.target.value)}
                    placeholder="Contoh: 012901048821503 (BRI An. Sugeng)"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Nominal Transaksi Dinamis */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>
                  {activeMode === 'tarik_tunai_atm'
                    ? 'Nominal Uang Ditarik Nasabah'
                    : 'Nominal Transaksi (Rp)'}
                </span>
                <span className="text-[10px] font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Dinamis (Bebas)
                </span>
              </label>
              <span className="text-xs font-mono text-emerald-800 font-extrabold">
                Rp {nominal.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-500 font-extrabold text-base">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                value={nominal ? nominal.toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setNominal(raw ? parseInt(raw, 10) : 0);
                }}
                placeholder="0 (Ketik nominal berapa saja)"
                className="w-full pl-12 pr-20 py-2.5 text-lg font-black bg-white border-2 border-teal-500/70 focus:border-teal-600 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-teal-400/40 focus:outline-none shadow-xs transition"
              />
              {nominal > 0 && (
                <button
                  type="button"
                  onClick={() => setNominal(0)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Hapus / Reset Angka"
                >
                  Hapus (C)
                </button>
              )}
            </div>

            {/* Quick Presets & Dynamic Additives */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Pilih Cepat (Nominal Langsung):</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                {[50000, 100000, 200000, 500000, 1000000, 1500000, 2000000, 5000000].map(
                  (amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setNominal(amt)}
                      className={`py-1 px-1 text-[11px] font-mono font-bold rounded-lg border transition cursor-pointer text-center ${
                        nominal === amt
                          ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      }`}
                    >
                      {amt >= 1000000 ? `${amt / 1000000}Jt` : `${amt / 1000}rb`}
                    </button>
                  )
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
                <span>Tambah Cepat (+ Akumulasi):</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[10000, 50000, 100000, 500000, 1000000].map((addAmt) => (
                  <button
                    key={addAmt}
                    type="button"
                    onClick={() => setNominal((prev) => prev + addAmt)}
                    className="py-1 px-1 text-[11px] font-mono font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 transition cursor-pointer text-center"
                    title={`Tambah +Rp ${addAmt.toLocaleString('id-ID')}`}
                  >
                    +{addAmt >= 1000000 ? `${addAmt / 1000000}Jt` : `${addAmt / 1000}rb`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fee & Calculation Engine */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">
                {activeMode === 'qris_atm'
                  ? 'Biaya MDR / Sistem QRIS:'
                  : activeMode === 'mbanking_atm'
                  ? 'Biaya Admin Transaksi App:'
                  : 'Biaya Admin Mesin EDC:'}
              </span>
              <div className="flex items-center gap-1 font-mono">
                <span className="text-slate-400">Rp</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={adminEdcFee}
                  onChange={(e) => setAdminEdcFee(Number(e.target.value) || 0)}
                  className="w-24 text-right px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-emerald-800 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Jasa Konter Ju-Fat (Laba):</span>
              </span>
              <div className="flex items-center gap-1 font-mono">
                <span className="text-slate-400">Rp</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={counterFee}
                  onChange={(e) => setCounterFee(Number(e.target.value) || 0)}
                  className="w-24 text-right px-2 py-0.5 bg-white border border-emerald-300 rounded text-xs font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Breakdown regarding physical cash and debited card balance */}
            <div className="pt-2 border-t border-slate-200 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-slate-700">
                  {activeMode === 'qris_atm'
                    ? 'Total Dibayar via QRIS:'
                    : activeMode === 'mbanking_atm'
                    ? 'Total Didebet / Diproses M-Banking:'
                    : 'Total Didebet dari Kartu Nasabah:'}
                </span>
                <span className="text-base font-extrabold text-slate-900 font-mono tabular-nums">
                  Rp {totalDebited.toLocaleString('id-ID')}
                </span>
              </div>

              {activeMode === 'tarik_tunai_atm' ||
              (activeMode === 'mbanking_atm' && mbankingType.includes('Tarik Tunai')) ||
              (activeMode === 'qris_atm' && qrisType.includes('Tarik Tunai')) ? (
                <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between font-medium">
                  <span>Uang Fisik Diberikan dari Laci:</span>
                  <span className="font-bold font-mono">
                    Rp {nominal.toLocaleString('id-ID')}
                  </span>
                </div>
              ) : (
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 text-[11px] flex items-center justify-between font-medium">
                  <span>Uang Fisik Diterima ke Laci:</span>
                  <span className="font-bold font-mono">
                    Rp {totalDebited.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-emerald-700 font-semibold flex items-center justify-between pt-1">
              <span>Laba Bersih Jasa Konter:</span>
              <span className="font-bold font-mono text-emerald-800">
                +Rp {counterFee.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold rounded-xl shadow-md shadow-teal-900/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {activeMode === 'qris_atm' ? (
              <QrCode className="w-4 h-4 text-amber-300" />
            ) : activeMode === 'mbanking_atm' ? (
              <ShieldCheck className="w-4 h-4 text-amber-300" />
            ) : (
              <CreditCard className="w-4 h-4 text-amber-300" />
            )}
            <span>
              {activeMode === 'tarik_tunai_atm'
                ? 'Gesek Kartu & Proses Tarik Tunai'
                : activeMode === 'transfer_atm'
                ? 'Gesek Kartu & Proses Transfer'
                : activeMode === 'topup_ewallet_atm'
                ? 'Proses Top Up E-Wallet EDC'
                : activeMode === 'mbanking_atm'
                ? 'Konfirmasi & Proses Transaksi M-Banking'
                : 'Scan QRIS & Selesaikan Pembayaran'}
            </span>
          </button>
        </form>
      </div>

      {/* Right Column: Mini ATM Analytics & Live Transaction Ledger */}
      <div
        className={`${
          mobileTab === 'history' ? 'flex' : 'hidden'
        } md:flex flex-1 flex-col h-full overflow-hidden min-w-0`}
      >
        {/* KPI Strip for Mini ATM */}
        <div className="p-3 sm:p-4 bg-white border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">
              Tarik Tunai Hari Ini
            </span>
            <span className="text-base font-extrabold text-slate-900 font-mono">
              Rp {totalTarikHariIni.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">
              Transfer EDC Hari Ini
            </span>
            <span className="text-base font-extrabold text-slate-900 font-mono">
              Rp {totalTransferHariIni.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">
              E-Wallet, M-Banking & QRIS
            </span>
            <span className="text-base font-extrabold text-slate-900 font-mono">
              Rp {(totalTopUpHariIni + totalMbankingQrisHariIni).toLocaleString('id-ID')}
            </span>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">
              Laba Bersih Jasa EDC & Digital
            </span>
            <span className="text-base font-extrabold text-emerald-900 font-mono">
              +Rp {totalLabaAtmMini.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari trace no, nama nasabah, bank, M-Banking, QRIS..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'all', label: 'Semua Transaksi' },
              { id: 'tarik_tunai_atm', label: 'Tarik Tunai' },
              { id: 'transfer_atm', label: 'Transfer EDC' },
              { id: 'topup_ewallet_atm', label: 'E-Wallet' },
              { id: 'mbanking_atm', label: 'M-Banking' },
              { id: 'qris_atm', label: 'Sistem QRIS' },
            ].map((tab) => {
              const active = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer shrink-0 ${
                    active
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Transaction Table */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Trace No / Tgl</th>
                  <th className="py-2.5 px-3">Layanan</th>
                  <th className="py-2.5 px-3">Kanal / Bank</th>
                  <th className="py-2.5 px-3">Nasabah & No Tujuan / Ref</th>
                  <th className="py-2.5 px-3 text-right">Nominal Pokok</th>
                  <th className="py-2.5 px-3 text-right">Laba Jasa</th>
                  <th className="py-2.5 px-3 text-right">Total Transaksi</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTx.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Belum ada transaksi tercatat untuk kategori ini
                    </td>
                  </tr>
                ) : (
                  filteredTx.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-mono">
                        <div className="font-bold text-slate-900">{tx.traceNo}</div>
                        <div className="text-[10px] text-slate-400">{tx.date}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            tx.type === 'tarik_tunai_atm'
                              ? 'bg-amber-100 text-amber-900'
                              : tx.type === 'transfer_atm'
                              ? 'bg-blue-100 text-blue-900'
                              : tx.type === 'topup_ewallet_atm'
                              ? 'bg-emerald-100 text-emerald-900'
                              : tx.type === 'mbanking_atm'
                              ? 'bg-purple-100 text-purple-900'
                              : 'bg-teal-100 text-teal-900'
                          }`}
                        >
                          {tx.type === 'tarik_tunai_atm'
                            ? 'Tarik Tunai'
                            : tx.type === 'transfer_atm'
                            ? 'Transfer'
                            : tx.type === 'topup_ewallet_atm'
                            ? 'Top Up E-Wallet'
                            : tx.type === 'mbanking_atm'
                            ? 'M-Banking'
                            : 'Sistem QRIS'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800">{tx.bankName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {tx.cardType} · {tx.cardNumberMasked}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{tx.customerName}</div>
                        {tx.targetAccountOrPhone && (
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[170px]">
                            {tx.targetAccountOrPhone}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800 tabular-nums">
                        Rp {tx.nominal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                        +Rp {tx.counterFee.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900 tabular-nums">
                        Rp {tx.totalDebited.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedTxDetail(tx)}
                            className="px-2 py-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 transition cursor-pointer"
                            title="Lihat Dialog Rincian Pembayaran"
                          >
                            Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => openReceipt(tx)}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1 transition cursor-pointer"
                            title="Cetak Struk Transaksi"
                          >
                            <Printer className="w-3 h-3 text-slate-500" />
                            <span>Struk</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DIALOG PEMBAYARAN & KONFIRMASI MESIN EDC ATM MINI (MODAL AKTIF)         */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-auto animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-teal-700 via-emerald-700 to-cyan-700 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold tracking-tight">Dialog Pembayaran & Otorisasi EDC</h3>
                  <p className="text-[11px] text-teal-100">Ju-Fat Cell · Terminal Sunmi P2 Pro Multi-Payment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                title="Tutup Dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Service & Customer Identification Badge */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-teal-700 text-white tracking-wider">
                    {activeMode === 'tarik_tunai_atm'
                      ? 'Layanan Tarik Tunai'
                      : activeMode === 'transfer_atm'
                      ? 'Layanan Transfer EDC'
                      : activeMode === 'topup_ewallet_atm'
                      ? 'Top Up E-Wallet'
                      : activeMode === 'mbanking_atm'
                      ? 'Mobile Banking'
                      : 'Sistem QRIS Merchant'}
                  </span>
                  <span className="text-[11px] font-mono text-teal-900 font-bold">
                    EDC-JUFAT-01
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block">Kanal / Bank:</span>
                    <span className="font-extrabold text-slate-900">
                      {activeMode === 'topup_ewallet_atm'
                        ? ewalletProvider
                        : activeMode === 'mbanking_atm'
                        ? mbankingApp
                        : activeMode === 'qris_atm'
                        ? qrisProvider
                        : `${bankName} (${cardType})`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block">Nama Nasabah:</span>
                    <span className="font-bold text-slate-900">
                      {customerName || 'Nasabah Langsung (Walk-in)'}
                    </span>
                  </div>
                </div>

                {(targetAccountOrPhone || activeMode === 'qris_atm') && (
                  <div className="pt-1 border-t border-teal-200/60 text-xs">
                    <span className="text-[10px] text-slate-500 font-medium block">
                      {activeMode === 'topup_ewallet_atm'
                        ? 'No. Handphone E-Wallet:'
                        : activeMode === 'qris_atm'
                        ? 'RRN Referensi QRIS:'
                        : 'No. Rekening / VA Tujuan:'}
                    </span>
                    <span className="font-mono font-black text-teal-950 text-sm">
                      {targetAccountOrPhone || qrisRrn}
                    </span>
                  </div>
                )}
              </div>

              {/* Financial Calculation Breakdown Table */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Nominal Pokok Transaksi:</span>
                  <span className="font-mono font-bold text-slate-900">
                    Rp {nominal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>
                    {activeMode === 'qris_atm'
                      ? 'Biaya MDR / Sistem QRIS:'
                      : activeMode === 'mbanking_atm'
                      ? 'Biaya Admin Aplikasi:'
                      : 'Biaya Admin EDC / Bank:'}
                  </span>
                  <span className="font-mono font-semibold text-slate-700">
                    Rp {adminEdcFee.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-emerald-800 font-medium">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Jasa Konter Ju-Fat (Laba):</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    +Rp {counterFee.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="border-t-2 border-slate-200 pt-2 flex items-baseline justify-between">
                  <span className="text-xs font-black text-slate-900 uppercase">
                    {activeMode === 'qris_atm'
                      ? 'Total Bayar via QRIS:'
                      : 'Total Didebet dari Kartu Nasabah:'}
                  </span>
                  <span className="text-xl font-black font-mono text-emerald-800 tabular-nums">
                    Rp {totalDebited.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Physical Cash Instruction for Cashier Drawer */}
              {activeMode === 'tarik_tunai_atm' ||
              (activeMode === 'mbanking_atm' && mbankingType.includes('Tarik Tunai')) ||
              (activeMode === 'qris_atm' && qrisType.includes('Tarik Tunai')) ? (
                <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-1 text-amber-950">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Banknote className="w-4 h-4 text-amber-600" />
                    <span>Petunjuk Kasir: Serahkan Uang Tunai ke Nasabah</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs">Uang Fisik Diberikan dari Laci:</span>
                    <span className="text-lg font-black font-mono text-amber-900">
                      Rp {nominal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-800">
                    💡 Saldo rekening bank agen Ju-Fat otomatis bertambah Rp {totalDebited.toLocaleString('id-ID')} (Nominal + Biaya Admin + Laba Jasa).
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl space-y-2 text-emerald-950">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Banknote className="w-4 h-4 text-emerald-700" />
                      <span>Uang Fisik Diterima ke Laci Kasir</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-emerald-900">
                      Wajib: Rp {totalDebited.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Cash Received Calculator for Cashier */}
                  <div className="space-y-1.5 pt-1 border-t border-emerald-200">
                    <label className="text-[11px] font-bold text-emerald-900 block">
                      Jumlah Uang Tunai Diberikan Nasabah:
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cashReceivedInput ? cashReceivedInput.toLocaleString('id-ID') : ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setCashReceivedInput(val ? parseInt(val, 10) : 0);
                        }}
                        className="w-full pl-9 pr-3 py-1.5 text-sm font-mono font-black bg-white border border-emerald-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder={totalDebited.toLocaleString('id-ID')}
                      />
                    </div>

                    {/* Quick money chips */}
                    <div className="flex items-center gap-1 overflow-x-auto pt-1">
                      <button
                        type="button"
                        onClick={() => setCashReceivedInput(totalDebited)}
                        className="px-2 py-0.5 text-[10px] font-bold bg-emerald-200/80 hover:bg-emerald-300 text-emerald-950 rounded transition cursor-pointer"
                      >
                        Uang Pas
                      </button>
                      {[50000, 100000, 200000, 500000, 1000000].map((quickCash) => (
                        <button
                          key={quickCash}
                          type="button"
                          onClick={() => setCashReceivedInput(quickCash)}
                          className="px-2 py-0.5 text-[10px] font-mono font-bold bg-white border border-emerald-300 text-emerald-800 rounded hover:bg-emerald-100 transition cursor-pointer shrink-0"
                        >
                          Rp {quickCash.toLocaleString('id-ID')}
                        </button>
                      ))}
                    </div>

                    {/* Change Amount */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="font-bold text-slate-700">Uang Kembalian Kasir:</span>
                      <span
                        className={`font-mono font-black text-sm ${
                          cashReceivedInput >= totalDebited ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {cashReceivedInput >= totalDebited
                          ? `Rp ${(cashReceivedInput - totalDebited).toLocaleString('id-ID')}`
                          : `Kurang Rp ${(totalDebited - cashReceivedInput).toLocaleString('id-ID')}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Simulated EDC Hardware Status Indicator */}
              <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-slate-800">
                    Mesin EDC Siap · Otorisasi PIN / Chip Sukses
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">
                  Trace: TRC-{Math.floor(100000 + Math.random() * 900000)}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Kembali / Ubah Input
              </button>
              <button
                type="button"
                onClick={handleConfirmAndExecuteTransaction}
                className="flex-2 py-2.5 px-4 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <CheckCircle className="w-4 h-4 text-amber-300" />
                <span>Konfirmasi & Selesaikan Transaksi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DIALOG DETAIL RIWAYAT TRANSAKSI EDC (MODAL LIHAT DATA)                  */}
      {/* ========================================================================= */}
      {selectedTxDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden my-auto animate-scale-up">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">Rincian Transaksi EDC #{selectedTxDetail.traceNo}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxDetail(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Waktu Transaksi:</span>
                <span className="font-semibold text-slate-800">{selectedTxDetail.date}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Layanan:</span>
                <span className="font-bold text-teal-800 uppercase">{selectedTxDetail.type}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Bank / Provider:</span>
                <span className="font-bold text-slate-800">{selectedTxDetail.bankName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">No Kartu / Akun:</span>
                <span className="font-mono font-bold text-slate-800">{selectedTxDetail.cardNumberMasked}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Nama Nasabah:</span>
                <span className="font-bold text-slate-900">{selectedTxDetail.customerName}</span>
              </div>
              {selectedTxDetail.targetAccountOrPhone && (
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">No Tujuan:</span>
                  <span className="font-mono font-bold text-teal-900">{selectedTxDetail.targetAccountOrPhone}</span>
                </div>
              )}
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Nominal Pokok:</span>
                <span className="font-mono font-bold text-slate-900">Rp {selectedTxDetail.nominal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Biaya Admin EDC:</span>
                <span className="font-mono text-slate-700">Rp {selectedTxDetail.adminEdcFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-emerald-700 font-bold">Laba Jasa Konter:</span>
                <span className="font-mono font-bold text-emerald-800">+Rp {selectedTxDetail.counterFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pt-1 font-bold text-sm text-slate-900">
                <span>Total Transaksi:</span>
                <span className="font-mono font-black text-emerald-800">Rp {selectedTxDetail.totalDebited.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedTxDetail(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const tx = selectedTxDetail;
                  setSelectedTxDetail(null);
                  openReceipt(tx);
                }}
                className="flex-1 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-600 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Ulang Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
