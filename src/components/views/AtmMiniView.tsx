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
  Receipt,
  Wallet,
  Building2,
  Tag,
  Crown,
  Percent,
  ShoppingCart,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { AtmMiniType, AtmMiniTransaction } from '../../types/pos';

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
  'GoPay',
  'OVO',
  'i.Saku',
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
  'QRIS Merchant Ju-Fat Cell',
  'QRIS BCA Merchant',
  'QRIS BRImo Merchant',
  'QRIS Livin\' Mandiri',
  'QRIS ShopeePay Merchant',
  'QRIS DANA / GoPay',
  'QRIS Pelanggan (Semua Bank / E-Wallet)',
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
    drawerCashBalance,
    digitalBalance,
    shift,
    addAtmMiniToCart,
    setIsMasterCartModalOpen,
    cartTotalCount,
  } = usePOS();

  const isOwner = shift.cashierSlot === 'owner' || shift.role === 'owner';

  // 2 Primary Tabs: 'tarik_tunai' | 'transfer_topup'
  const [primaryTab, setPrimaryTab] = useState<'tarik_tunai' | 'transfer_topup'>('tarik_tunai');
  const [tarikChannel, setTarikChannel] = useState<'kartu_debit' | 'ewallet' | 'mbanking' | 'qris'>('kartu_debit');
  const [transferChannel, setTransferChannel] = useState<'kartu_debit' | 'ewallet' | 'mbanking' | 'qris'>('kartu_debit');

  // Form states
  const [bankName, setBankName] = useState('BRI');
  const [cardType, setCardType] = useState<AtmMiniTransaction['cardType']>('GPN');
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
  const [counterFeeDiscount, setCounterFeeDiscount] = useState<number>(0);
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
  const [atmMiniPaymentMethod, setAtmMiniPaymentMethod] = useState<'tunai' | 'qris' | 'hutang'>('tunai');
  const [atmMiniCustomerPhone, setAtmMiniCustomerPhone] = useState('');
  const [atmMiniDebtorName, setAtmMiniDebtorName] = useState('');
  const [atmMiniKasbonError, setAtmMiniKasbonError] = useState<string | null>(null);
  const [atmMiniDueDate, setAtmMiniDueDate] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  // Skema Admin Tarik Tunai:
  // 'tambah_transfer': nasabah kirim 103.000, fisik diserahkan 100.000 (laci keluar 100.000)
  // 'potong_tunai': nasabah kirim 100.000, fisik diserahkan 97.000 (laci keluar 97.000)
  // 'tunai_konter': nasabah kirim/debet 100.000, fisik diserahkan 100.000 (laci keluar 100.000), admin bayar tunai di konter -> masuk uang laci (+totalAdmin)
  const [adminDeductionType, setAdminDeductionType] = useState<'tambah_transfer' | 'potong_tunai' | 'tunai_konter'>('tambah_transfer');

  // Active mode mapped to AtmMiniType
  const activeMode: AtmMiniType =
    primaryTab === 'tarik_tunai'
      ? 'tarik_tunai_atm'
      : transferChannel === 'kartu_debit'
      ? 'transfer_atm'
      : transferChannel === 'ewallet'
      ? 'topup_ewallet_atm'
      : transferChannel === 'mbanking'
      ? 'mbanking_atm'
      : 'qris_atm';

  const tarikTunaiSource = tarikChannel;

  const isCurrentChannelCard =
    (primaryTab === 'tarik_tunai' && tarikChannel === 'kartu_debit') ||
    (primaryTab === 'transfer_topup' && transferChannel === 'kartu_debit');

  // Handle switching primary tab
  const handlePrimaryTabChange = (tab: 'tarik_tunai' | 'transfer_topup') => {
    setPrimaryTab(tab);
    if (tab === 'tarik_tunai') {
      if (tarikChannel === 'kartu_debit') {
        setAdminEdcFee(3000);
        setCounterFee(5000);
        setCardType('GPN');
      } else if (tarikChannel === 'ewallet') {
        setAdminEdcFee(0);
        setCounterFee(5000);
        setCardType('M-Banking');
      } else if (tarikChannel === 'mbanking') {
        setAdminEdcFee(0);
        setCounterFee(5000);
        setCardType('M-Banking');
      } else {
        setAdminEdcFee(0);
        setCounterFee(5000);
        setCardType('QRIS');
      }
    } else {
      if (transferChannel === 'kartu_debit') {
        setAdminEdcFee(2500);
        setCounterFee(6000);
        setCardType('GPN');
      } else if (transferChannel === 'ewallet') {
        setAdminEdcFee(1500);
        setCounterFee(3500);
        setCardType('GPN');
      } else if (transferChannel === 'mbanking') {
        setAdminEdcFee(0);
        setCounterFee(5000);
        setCardType('M-Banking');
      } else {
        setAdminEdcFee(0);
        setCounterFee(5000);
        setCardType('QRIS');
      }
    }
  };

  const handleTarikChannelChange = (channel: 'kartu_debit' | 'ewallet' | 'mbanking' | 'qris') => {
    setTarikChannel(channel);
    if (channel === 'kartu_debit') {
      setAdminEdcFee(3000);
      setCounterFee(5000);
      setCardType('GPN');
    } else if (channel === 'ewallet') {
      setAdminEdcFee(0);
      setCounterFee(5000);
      setCardType('M-Banking');
    } else if (channel === 'mbanking') {
      setAdminEdcFee(0);
      setCounterFee(5000);
      setCardType('M-Banking');
    } else {
      setAdminEdcFee(0);
      setCounterFee(5000);
      setCardType('QRIS');
    }
  };

  const handleTransferChannelChange = (channel: 'kartu_debit' | 'ewallet' | 'mbanking' | 'qris') => {
    setTransferChannel(channel);
    if (channel === 'kartu_debit') {
      setAdminEdcFee(2500);
      setCounterFee(6000);
      setCardType('GPN');
    } else if (channel === 'ewallet') {
      setAdminEdcFee(1500);
      setCounterFee(3500);
      setCardType('GPN');
    } else if (channel === 'mbanking') {
      setAdminEdcFee(0);
      setCounterFee(5000);
      setCardType('M-Banking');
    } else {
      setAdminEdcFee(0);
      setCounterFee(5000);
      setCardType('QRIS');
    }
  };

  const isTarikTunai = primaryTab === 'tarik_tunai';
  const effectiveCounterFee = Math.max(0, counterFee - counterFeeDiscount);
  const totalAdmin = adminEdcFee + effectiveCounterFee;
  const isPotongTunai = isTarikTunai && adminDeductionType === 'potong_tunai';
  const isTunaiKonter = isTarikTunai && adminDeductionType === 'tunai_konter';

  // Skenario 1 (tambah_transfer): Nasabah kirim 103.000, fisik diserahkan 100.000 (Laci keluar 100.000)
  // Skenario 2 (potong_tunai): Nasabah kirim 100.000, fisik diserahkan 97.000 (Laci keluar 97.000)
  // Skenario 3 (tunai_konter): Nasabah kirim 100.000, fisik diserahkan 100.000 (Laci -100.000), admin dibayar tunai di konter -> Masuk Uang Laci (+totalAdmin)
  const totalDebited = isPotongTunai || isTunaiKonter ? nominal : nominal + totalAdmin;
  const cashHandedOut = isPotongTunai ? Math.max(0, nominal - totalAdmin) : nominal;
  const netDrawerDeltaTarik = (isTunaiKonter ? totalAdmin : 0) - cashHandedOut;

  // Step 1: Open Payment & Confirmation Dialog
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (nominal <= 0) {
      alert('Nominal transaksi harus lebih dari Rp 0!');
      return;
    }

    if (effectiveCounterFee === 0 && !isOwner && counterFeeDiscount > 0) {
      alert('Jasa Konter Rp 0 (Diskon 100%) hanya diizinkan untuk OWNER yang sedang bertugas!');
      return;
    }

    if (primaryTab === 'tarik_tunai') {
      if (tarikChannel === 'ewallet' && !targetAccountOrPhone.trim()) {
        alert('Nomor HP Akun E-Wallet nasabah wajib diisi untuk penarikan tunai!');
        return;
      }
    } else {
      if (transferChannel === 'kartu_debit' && !targetAccountOrPhone.trim()) {
        alert('Nomor Rekening Tujuan & Bank Penerima wajib diisi!');
        return;
      }
      if (transferChannel === 'ewallet' && !targetAccountOrPhone.trim()) {
        alert('Nomor handphone akun e-wallet tujuan wajib diisi!');
        return;
      }
      if (transferChannel === 'mbanking' && !targetAccountOrPhone.trim()) {
        alert('Nomor Rekening Tujuan & Bank Penerima wajib diisi!');
        return;
      }
    }

    // Default payment method & cash received in modal
    setAtmMiniPaymentMethod('tunai');
    setCashReceivedInput(isTunaiKonter ? totalAdmin : totalDebited);
    setAtmMiniDebtorName(customerName.trim());
    setAtmMiniKasbonError(null);
    setIsPaymentModalOpen(true);
  };

  // Helper: Gabungkan transaksi Transfer/TopUp/M-Banking/QRIS ke Keranjang Besar
  const handleAddTransferToMasterCart = (closeModal: boolean = false) => {
    if (primaryTab !== 'transfer_topup') return;
    if (nominal <= 0) {
      alert('Nominal transaksi harus lebih dari Rp 0!');
      return;
    }
    if (effectiveCounterFee === 0 && !isOwner && counterFeeDiscount > 0) {
      alert('Jasa Konter Rp 0 (Diskon 100%) hanya diizinkan untuk OWNER yang sedang bertugas!');
      return;
    }
    if (transferChannel === 'kartu_debit' && !targetAccountOrPhone.trim()) {
      alert('Nomor Rekening Tujuan & Bank Penerima wajib diisi!');
      return;
    }
    if (transferChannel === 'ewallet' && !targetAccountOrPhone.trim()) {
      alert('Nomor handphone akun e-wallet tujuan wajib diisi!');
      return;
    }
    if (transferChannel === 'mbanking' && !targetAccountOrPhone.trim()) {
      alert('Nomor Rekening Tujuan & Bank Penerima wajib diisi!');
      return;
    }

    let providerName = bankName;
    let actualCardType: AtmMiniTransaction['cardType'] = cardType;
    let maskedIdentifier = `5221 **** **** ${cardNumberLast4.trim() || '8888'}`;
    let destination: string | undefined = undefined;

    if (transferChannel === 'kartu_debit') {
      providerName = bankName;
      actualCardType = cardType;
      maskedIdentifier = `5221 **** **** ${cardNumberLast4.trim() || '8888'}`;
      destination = targetAccountOrPhone;
    } else if (transferChannel === 'ewallet') {
      providerName = ewalletProvider;
      actualCardType = 'E-Wallet';
      maskedIdentifier = `EW-${ewalletProvider.toUpperCase()} · ${targetAccountOrPhone}`;
      destination = `${targetAccountOrPhone} (${ewalletProvider})`;
    } else if (transferChannel === 'mbanking') {
      providerName = mbankingApp;
      actualCardType = 'M-Banking';
      maskedIdentifier = `APP ${mbankingApp.split(' ')[0]} · ${
        cardNumberLast4.trim() ? 'Kode: ' + cardNumberLast4.trim() : 'Cardless'
      }`;
      destination = targetAccountOrPhone
        ? `${targetAccountOrPhone} [${mbankingType.split(' ')[0]}]`
        : mbankingType;
    } else {
      providerName = qrisProvider.split(' ')[0] + ' ' + (qrisProvider.split(' ')[1] || '');
      actualCardType = 'QRIS';
      maskedIdentifier = qrisRrn || `RRN-${Math.floor(100000 + Math.random() * 900000)}`;
      destination = `QRIS · ${qrisType}`;
    }

    const resolvedDisplayName =
      customerName.trim() ||
      (activeMode === 'qris_atm'
        ? 'Pelanggan QRIS'
        : activeMode === 'mbanking_atm'
        ? 'Nasabah M-Banking'
        : isCurrentChannelCard
        ? 'Nasabah EDC'
        : 'Nasabah');

    addAtmMiniToCart({
      type: activeMode,
      bankName: providerName,
      cardType: actualCardType,
      cardNumberMasked: maskedIdentifier,
      customerName: resolvedDisplayName,
      nominal,
      adminEdcFee,
      counterFee: effectiveCounterFee,
      targetAccountOrPhone: destination,
      note: note.trim() || undefined,
    });

    if (closeModal) setIsPaymentModalOpen(false);
    setTargetAccountOrPhone('');
    setNote('');
    setCounterFeeDiscount(0);
    setToastMessage(
      `Layanan ${providerName} Rp ${totalDebited.toLocaleString('id-ID')} masuk ke Keranjang Besar — siap digabung dengan menu lain!`
    );
    setTimeout(() => setToastMessage(''), 5500);
  };

  // Step 2: Confirm and process transaction + open thermal receipt
  const handleConfirmAndExecuteTransaction = () => {
    const isTarikTunai = primaryTab === 'tarik_tunai';
    const cashPaymentTarget = isTunaiKonter ? totalAdmin : totalDebited;
    const isPartialAtmMini =
      (!isTarikTunai || isTunaiKonter) &&
      atmMiniPaymentMethod === 'tunai' &&
      cashReceivedInput > 0 &&
      cashReceivedInput < cashPaymentTarget;

    // Validasi khusus pembayaran Kasbon / Hutang & Bayar Sebagian
    let finalCustomerName = customerName.trim();
    if (atmMiniPaymentMethod === 'hutang' || isPartialAtmMini) {
      const debtorName = atmMiniDebtorName.trim() || customerName.trim();
      if (!debtorName || debtorName.toLowerCase() === 'nasabah edc' || debtorName.toLowerCase() === 'pelanggan umum' || debtorName.toLowerCase() === 'nasabah') {
        setAtmMiniKasbonError(
          isPartialAtmMini
            ? 'Untuk Bayar Sebagian (Sisa Kasbon), Nama Pelanggan wajib diisi agar tersimpan jelas di Buku Hutang!'
            : 'Nama Orang / Pelanggan yang Kasbon wajib diisi agar tersimpan jelas di Buku Hutang!'
        );
        return;
      }
      finalCustomerName = debtorName;
      setCustomerName(debtorName);
    }

    let providerName = bankName;
    let actualCardType: AtmMiniTransaction['cardType'] = cardType;
    let maskedIdentifier = `5221 **** **** ${cardNumberLast4.trim() || '8888'}`;
    let destination: string | undefined = undefined;

    if (primaryTab === 'tarik_tunai') {
      if (tarikChannel === 'kartu_debit') {
        providerName = bankName;
        actualCardType = cardType;
        maskedIdentifier = `5221 **** **** ${cardNumberLast4.trim() || '8888'}`;
        destination = `Kartu Debit ATM (${bankName} - ${cardType})`;
      } else if (tarikChannel === 'ewallet') {
        providerName = ewalletProvider;
        actualCardType = 'E-Wallet';
        maskedIdentifier = `EW-${ewalletProvider.toUpperCase()} · ${targetAccountOrPhone}`;
        destination = `Tarik Tunai E-Wallet ${ewalletProvider} (${targetAccountOrPhone})${cardNumberLast4.trim() ? ' · Ref: ' + cardNumberLast4.trim() : ''}`;
      } else if (tarikChannel === 'mbanking') {
        providerName = mbankingApp;
        actualCardType = 'M-Banking';
        maskedIdentifier = `APP ${mbankingApp.split(' ')[0]} · ${cardNumberLast4.trim() ? 'Kode: ' + cardNumberLast4.trim() : targetAccountOrPhone || 'Cardless'}`;
        destination = `Tarik Tunai M-Banking ${mbankingApp} (${targetAccountOrPhone})${cardNumberLast4.trim() ? ' · Token: ' + cardNumberLast4.trim() : ''}`;
      } else {
        providerName = qrisProvider.split(' ')[0] + ' ' + (qrisProvider.split(' ')[1] || '');
        actualCardType = 'QRIS';
        maskedIdentifier = qrisRrn || `RRN-${Math.floor(100000 + Math.random() * 900000)}`;
        destination = `Tarik Tunai QRIS · ${qrisProvider}`;
      }
    } else {
      if (transferChannel === 'kartu_debit') {
        providerName = bankName;
        actualCardType = cardType;
        maskedIdentifier = `5221 **** **** ${cardNumberLast4.trim() || '8888'}`;
        destination = targetAccountOrPhone;
      } else if (transferChannel === 'ewallet') {
        providerName = ewalletProvider;
        actualCardType = 'E-Wallet';
        maskedIdentifier = `EW-${ewalletProvider.toUpperCase()} · ${targetAccountOrPhone}`;
        destination = `${targetAccountOrPhone} (${ewalletProvider})`;
      } else if (transferChannel === 'mbanking') {
        providerName = mbankingApp;
        actualCardType = 'M-Banking';
        maskedIdentifier = `APP ${mbankingApp.split(' ')[0]} · ${cardNumberLast4.trim() ? 'Kode: ' + cardNumberLast4.trim() : 'Cardless'}`;
        destination = targetAccountOrPhone ? `${targetAccountOrPhone} [${mbankingType.split(' ')[0]}]` : mbankingType;
      } else {
        providerName = qrisProvider.split(' ')[0] + ' ' + (qrisProvider.split(' ')[1] || '');
        actualCardType = 'QRIS';
        maskedIdentifier = qrisRrn || `RRN-${Math.floor(100000 + Math.random() * 900000)}`;
        destination = `QRIS · ${qrisType}`;
      }
    }

    const resolvedDisplayName =
      finalCustomerName ||
      (activeMode === 'qris_atm' || (primaryTab === 'tarik_tunai' && tarikChannel === 'qris')
        ? 'Pelanggan QRIS'
        : activeMode === 'mbanking_atm' || (primaryTab === 'tarik_tunai' && tarikChannel !== 'kartu_debit')
        ? 'Nasabah M-Banking / E-Wallet'
        : isCurrentChannelCard
        ? 'Nasabah EDC'
        : 'Nasabah');

    const tx = recordAtmMiniTransaction(
      activeMode,
      providerName,
      actualCardType,
      maskedIdentifier,
      resolvedDisplayName,
      nominal,
      adminEdcFee,
      effectiveCounterFee,
      destination,
      note,
      isPartialAtmMini ? 'hutang' : atmMiniPaymentMethod,
      atmMiniCustomerPhone || targetAccountOrPhone,
      atmMiniDueDate,
      adminDeductionType,
      counterFeeDiscount > 0 ? counterFeeDiscount : undefined,
      isPartialAtmMini ? cashReceivedInput : (atmMiniPaymentMethod === 'hutang' ? 0 : (isTunaiKonter ? totalAdmin : totalDebited))
    );

    setIsPaymentModalOpen(false);

    const serviceName =
      primaryTab === 'tarik_tunai'
        ? (tarikChannel === 'qris' ? 'Tarik Tunai QRIS' : tarikChannel === 'kartu_debit' ? 'Tarik Tunai Kartu EDC' : 'Tarik Tunai')
        : transferChannel === 'kartu_debit'
        ? 'Transfer EDC'
        : transferChannel === 'ewallet'
        ? 'Top Up E-Wallet'
        : transferChannel === 'mbanking'
        ? 'Mobile Banking'
        : 'Sistem QRIS';

    const toastCashMsg =
      primaryTab === 'tarik_tunai'
        ? isTunaiKonter
          ? `Tarik Tunai ${tx.bankName}: Uang tarikan keluar -Rp ${tx.cashHandedOrReceived.toLocaleString('id-ID')} & Admin tunai masuk uang laci +Rp ${totalAdmin.toLocaleString('id-ID')}.`
          : `Tarik Tunai ${tx.bankName}: Uang fisik laci berkurang -Rp ${tx.cashHandedOrReceived.toLocaleString('id-ID')} (${isPotongTunai ? 'potong admin' : 'nasabah kirim sekalian admin'}).`
        : `Transaksi ${serviceName} berhasil diproses & uang tunai Rp ${tx.cashHandedOrReceived.toLocaleString('id-ID')} dicatat ke laci!`;

    setToastMessage(toastCashMsg);
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
    let matchesType = true;
    if (filterType === 'kartu_debit') {
      matchesType =
        tx.cardType === 'GPN' ||
        tx.cardType === 'Mastercard' ||
        tx.cardType === 'Visa' ||
        tx.cardType === 'BCA Card' ||
        tx.type === 'transfer_atm' ||
        (tx.type === 'tarik_tunai_atm' &&
          !EWALLET_LIST.some((ew) => tx.bankName.includes(ew)) &&
          !MBANKING_APPS.some((m) => tx.bankName.includes(m.split(' ')[0])));
    } else if (filterType === 'ewallet') {
      matchesType =
        tx.type === 'topup_ewallet_atm' ||
        EWALLET_LIST.some((ew) => tx.bankName.toLowerCase().includes(ew.toLowerCase())) ||
        Boolean(tx.targetAccountOrPhone && EWALLET_LIST.some((ew) => tx.targetAccountOrPhone!.toLowerCase().includes(ew.toLowerCase())));
    } else if (filterType === 'mbanking') {
      matchesType =
        tx.type === 'mbanking_atm' ||
        tx.cardType === 'M-Banking' ||
        MBANKING_APPS.some((app) => tx.bankName.toLowerCase().includes(app.split(' ')[0].toLowerCase())) ||
        Boolean(tx.targetAccountOrPhone && tx.targetAccountOrPhone.toLowerCase().includes('m-banking'));
    } else if (filterType === 'qris') {
      matchesType =
        tx.type === 'qris_atm' ||
        tx.cardType === 'QRIS' ||
        tx.bankName.toLowerCase().includes('qris') ||
        Boolean(tx.targetAccountOrPhone && tx.targetAccountOrPhone.toLowerCase().includes('qris'));
    } else if (filterType !== 'all') {
      matchesType = tx.type === filterType;
    }
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
      <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 px-3 py-2 shrink-0 gap-2">
        <div className="grid grid-cols-2 flex-1 p-1 bg-slate-100 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setMobileTab('terminal')}
            className={`py-2 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              mobileTab === 'terminal'
                ? 'bg-white text-teal-950 shadow-sm font-black ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-teal-700" />
            <span>{isCurrentChannelCard ? 'EDC Terminal' : 'Form Transaksi'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('history')}
            className={`py-2 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              mobileTab === 'history'
                ? 'bg-white text-teal-950 shadow-sm font-black ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-teal-700" />
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

      {/* Left Column: ATM Mini Form */}
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
                  <h3 className="text-base font-extrabold tracking-tight">
                    {isCurrentChannelCard ? 'ATM Mini & Mesin EDC' : 'ATM Mini & Layanan Digital'}
                  </h3>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    isCurrentChannelCard ? 'bg-amber-300 text-amber-950' : 'bg-emerald-300 text-emerald-950'
                  }`}>
                    {isCurrentChannelCard ? 'EDC Online' : 'Online'}
                  </span>
                </div>
                <p className="text-[11px] text-teal-100">
                  {isCurrentChannelCard
                    ? 'Terminal: EDC-JUFAT-01 · Sunmi P2 Pro Multi-Payment'
                    : primaryTab === 'tarik_tunai'
                    ? tarikChannel === 'qris'
                      ? 'Layanan Tarik Tunai QRIS Dinamis & Statis (Non-EDC)'
                      : tarikChannel === 'ewallet'
                      ? `Layanan Tarik Tunai E-Wallet (${ewalletProvider})`
                      : `Layanan Tarik Tunai M-Banking (${mbankingApp.split(' ')[0]})`
                    : transferChannel === 'qris'
                    ? 'Layanan Pembayaran QRIS Merchant Nasional (Non-EDC)'
                    : transferChannel === 'ewallet'
                    ? `Layanan Top Up E-Wallet Digital (${ewalletProvider})`
                    : `Layanan Transfer Bank (${mbankingApp.split(' ')[0]})`}
                </p>
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

          {/* Exactly 2 Primary Tabs: Tarik Tunai and Transfer / Top Up */}
          <div className="grid grid-cols-2 gap-2 mt-3 sm:mt-4 pt-3 border-t border-emerald-800/80">
            <button
              type="button"
              onClick={() => handlePrimaryTabChange('tarik_tunai')}
              className={`py-2.5 px-3 rounded-xl transition cursor-pointer flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                primaryTab === 'tarik_tunai'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black ring-2 ring-white/60'
                  : 'bg-emerald-950/50 hover:bg-emerald-900/80 text-teal-100 hover:text-white border border-emerald-800/60'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <ArrowDownLeft className={`w-4 h-4 shrink-0 ${primaryTab === 'tarik_tunai' ? 'text-slate-950' : 'text-teal-300'}`} />
                <span className="text-xs font-black">Tarik Tunai</span>
              </div>
              <span className={`text-[9px] ${primaryTab === 'tarik_tunai' ? 'text-slate-800 font-bold' : 'text-teal-300/80'}`}>
                Kartu ATM / Fisik
              </span>
            </button>

            <button
              type="button"
              onClick={() => handlePrimaryTabChange('transfer_topup')}
              className={`py-2.5 px-3 rounded-xl transition cursor-pointer flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                primaryTab === 'transfer_topup'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black ring-2 ring-white/60'
                  : 'bg-emerald-950/50 hover:bg-emerald-900/80 text-teal-100 hover:text-white border border-emerald-800/60'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Send className={`w-4 h-4 shrink-0 ${primaryTab === 'transfer_topup' ? 'text-slate-950' : 'text-teal-300'}`} />
                <span className="text-xs font-black">Transfer / Top Up</span>
              </div>
              <span className={`text-[9px] ${primaryTab === 'transfer_topup' ? 'text-slate-800 font-bold' : 'text-teal-300/80'}`}>
                Antar Bank, E-Wallet & QRIS
              </span>
            </button>
          </div>
        </div>

        {/* Transaction Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 pb-12 sm:pb-8 space-y-4 flex-1">
          {/* Real-Time Live Synced Balances Status Bar */}
          <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-emerald-50/90 to-sky-50/90 border border-emerald-200/80 rounded-xl text-xs gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 font-semibold block">Kas Fisik Laci:</span>
                <span className="font-mono font-black text-emerald-900 text-xs truncate block">
                  Rp {drawerCashBalance.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-200 shrink-0" />

            <div className="flex items-center gap-1.5 min-w-0 text-right">
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 font-semibold block">
                  {isCurrentChannelCard ? 'Saldo Rekening EDC:' : 'Saldo Rekening Digital:'}
                </span>
                <span className="font-mono font-black text-sky-900 text-xs truncate block">
                  Rp {digitalBalance.toLocaleString('id-ID')}
                </span>
              </div>
              <Building2 className="w-3.5 h-3.5 text-sky-600 shrink-0 hidden sm:block" />
            </div>
          </div>

          {toastMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between gap-2 font-bold animate-fade-in flex-wrap">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{toastMessage}</span>
              </div>
              {cartTotalCount > 0 && (
                <button
                  type="button"
                  onClick={() => setIsMasterCartModalOpen(true)}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg flex items-center gap-1 text-[11px] cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                >
                  <ShoppingCart className="w-3 h-3 text-amber-300" />
                  <span>Buka Keranjang Besar ({cartTotalCount})</span>
                </button>
              )}
            </div>
          )}

          {/* Sub-Channel Selector Bar (Clean, neat, unified grid layout) */}
          {primaryTab === 'tarik_tunai' ? (
            <div className="p-2.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs px-0.5">
                <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-teal-700" />
                  <span>Sumber Penarikan:</span>
                </span>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                  {tarikChannel === 'kartu_debit'
                    ? 'Kartu Debit ATM'
                    : tarikChannel === 'ewallet'
                    ? 'E-Wallet'
                    : tarikChannel === 'mbanking'
                    ? 'Mobile Banking'
                    : 'QRIS Tarik Tunai'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleTarikChannelChange('kartu_debit')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    tarikChannel === 'kartu_debit'
                      ? 'bg-teal-800 text-white shadow-xs font-black ring-1 ring-teal-900'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Kartu Debit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTarikChannelChange('ewallet')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    tarikChannel === 'ewallet'
                      ? 'bg-teal-800 text-white shadow-xs font-black ring-1 ring-teal-900'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">E-Wallet</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTarikChannelChange('mbanking')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    tarikChannel === 'mbanking'
                      ? 'bg-teal-800 text-white shadow-xs font-black ring-1 ring-teal-900'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">M-Banking</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTarikChannelChange('qris')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    tarikChannel === 'qris'
                      ? 'bg-teal-800 text-white shadow-xs font-black ring-1 ring-teal-900'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">QRIS</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs px-0.5">
                <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Layanan Dipilih:</span>
                </span>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                  {transferChannel === 'kartu_debit'
                    ? 'Kartu Debit'
                    : transferChannel === 'ewallet'
                    ? 'E-Wallet'
                    : transferChannel === 'mbanking'
                    ? 'Mobile Banking'
                    : 'Sistem QRIS'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleTransferChannelChange('kartu_debit')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    transferChannel === 'kartu_debit'
                      ? 'bg-teal-800 text-white shadow-xs font-black ring-1 ring-teal-900'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Kartu Debit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTransferChannelChange('ewallet')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    transferChannel === 'ewallet'
                      ? 'bg-teal-800 text-white shadow-xs font-black ring-1 ring-teal-900'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">E-Wallet</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTransferChannelChange('mbanking')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    transferChannel === 'mbanking'
                      ? 'bg-teal-800 text-white shadow-xs font-black ring-1 ring-teal-900'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">M-Banking</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTransferChannelChange('qris')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    transferChannel === 'qris'
                      ? 'bg-teal-800 text-white shadow-xs font-black ring-1 ring-teal-900'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">QRIS</span>
                </button>
              </div>
            </div>
          )}

          {/* Dynamic Configuration Form per Service & Channel */}

          {/* 1. Tarik Tunai - Kartu Debit */}
          {primaryTab === 'tarik_tunai' && tarikChannel === 'kartu_debit' && (
            <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Bank Penerbit Kartu ATM
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
                    Nama Pemilik / Nasabah
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama Nasabah"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  4 Digit Terakhir Kartu ATM
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={cardNumberLast4}
                  onChange={(e) => setCardNumberLast4(e.target.value.replace(/\D/g, ''))}
                  placeholder="7192"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 2. Tarik Tunai - E-Wallet */}
          {primaryTab === 'tarik_tunai' && tarikChannel === 'ewallet' && (
            <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Pilih Dompet Digital (E-Wallet):
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {EWALLET_LIST.map((ew) => {
                    const active = ewalletProvider === ew;
                    return (
                      <button
                        key={ew}
                        type="button"
                        onClick={() => setEwalletProvider(ew)}
                        className={`py-2 px-1 text-xs font-bold rounded-lg border transition cursor-pointer text-center ${
                          active
                            ? 'bg-teal-700 text-white border-teal-800 shadow-xs ring-1 ring-teal-800'
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {ew}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    No. HP Akun Nasabah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={targetAccountOrPhone}
                    onChange={(e) => setTargetAccountOrPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
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
                    placeholder="Contoh: Agus Salim"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Tarik Tunai - Mobile Banking */}
          {primaryTab === 'tarik_tunai' && tarikChannel === 'mbanking' && (
            <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Aplikasi M-Banking
                  </label>
                  <select
                    value={mbankingApp}
                    onChange={(e) => setMbankingApp(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
                    Nama Pemilik Akun / Nasabah
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama Nasabah M-Banking"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nomor Rekening / No. HP Nasabah (Opsional)
                </label>
                <input
                  type="text"
                  value={targetAccountOrPhone}
                  onChange={(e) => setTargetAccountOrPhone(e.target.value)}
                  placeholder="0812xxxx atau Nomor Rekening Bank"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Tarik Tunai - QRIS */}
          {primaryTab === 'tarik_tunai' && tarikChannel === 'qris' && (
            <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <QrCode className="w-4 h-4 text-teal-600" />
                  <span>Sistem Pembayaran QRIS Nasional (Tarik Tunai)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-800 text-white font-bold tracking-wide">
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
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
                    Nama Pemilik Akun / Nasabah
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso / QRIS Nasabah"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Transfer / Top Up - Kartu Debit */}
          {primaryTab === 'transfer_topup' && transferChannel === 'kartu_debit' && (
            <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Bank Pengirim Kartu ATM
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
                    Nama Pemilik / Nasabah
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama Nasabah"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

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
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 5. Transfer / Top Up - E-Wallet */}
          {primaryTab === 'transfer_topup' && transferChannel === 'ewallet' && (
            <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tujuan Pengiriman E-Wallet:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {EWALLET_LIST.map((ew) => {
                    const active = ewalletProvider === ew;
                    return (
                      <button
                        key={ew}
                        type="button"
                        onClick={() => setEwalletProvider(ew)}
                        className={`py-2 px-1 text-xs font-bold rounded-lg border transition cursor-pointer text-center ${
                          active
                            ? 'bg-teal-700 text-white border-teal-800 shadow-xs ring-1 ring-teal-800'
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {ew}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    No. HP Akun E-Wallet Tujuan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={targetAccountOrPhone}
                    onChange={(e) => setTargetAccountOrPhone(e.target.value)}
                    placeholder="Contoh: 085811223344"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nama Pemilik Akun / Penerima
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama Penerima"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. Transfer / Top Up - Mobile Banking */}
          {primaryTab === 'transfer_topup' && transferChannel === 'mbanking' && (
            <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Aplikasi M-Banking
                  </label>
                  <select
                    value={mbankingApp}
                    onChange={(e) => setMbankingApp(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
                    Nama Pemilik Akun / Nasabah
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama Nasabah M-Banking"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

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
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 7. Transfer / Top Up - QRIS */}
          {primaryTab === 'transfer_topup' && transferChannel === 'qris' && (
            <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <QrCode className="w-4 h-4 text-teal-600" />
                  <span>Sistem Pembayaran QRIS Nasional (Ju-Fat Cell)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-800 text-white font-bold tracking-wide">
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
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
                    Nama Akun Pembayar / Pelanggan
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso / QRIS BCA"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Nominal Transaksi Dinamis */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>
                  {primaryTab === 'tarik_tunai'
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
                {(primaryTab === 'transfer_topup' && transferChannel === 'qris') || (primaryTab === 'tarik_tunai' && tarikChannel === 'qris')
                  ? 'Biaya MDR / Sistem QRIS:'
                  : (primaryTab === 'tarik_tunai' && (tarikChannel === 'mbanking' || tarikChannel === 'ewallet')) ||
                    (primaryTab === 'transfer_topup' && transferChannel === 'mbanking')
                  ? 'Biaya Admin Transaksi App:'
                  : primaryTab === 'transfer_topup' && transferChannel === 'ewallet'
                  ? 'Biaya Admin Dompet / Aplikasi:'
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

            <div className="space-y-1.5">
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

              {/* DISKON JASA KONTER */}
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1 font-bold text-slate-700">
                    <Tag className="w-3 h-3 text-emerald-600" />
                    <span>Diskon Jasa:</span>
                    {isOwner && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1 rounded font-black">
                        👑 Owner
                      </span>
                    )}
                  </div>
                  {counterFeeDiscount > 0 && (
                    <button
                      type="button"
                      onClick={() => setCounterFeeDiscount(0)}
                      className="text-[10px] text-rose-600 underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {[
                    { label: '0', val: 0 },
                    { label: '1rb', val: 1000 },
                    { label: '2rb', val: 2000 },
                    { label: '3rb', val: 3000 },
                    { label: '5rb', val: 5000 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setCounterFeeDiscount(p.val)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                        counterFeeDiscount === p.val
                          ? 'bg-emerald-600 text-white border-emerald-600 font-black'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      if (isOwner) {
                        setCounterFeeDiscount(counterFee);
                      } else {
                        alert('Gratis Jasa Konter (Rp 0) hanya diizinkan untuk OWNER yang sedang bertugas!');
                      }
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black border transition cursor-pointer flex items-center gap-1 ${
                      counterFeeDiscount === counterFee && counterFee > 0
                        ? 'bg-amber-400 text-slate-950 border-amber-400 font-black'
                        : isOwner
                        ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                        : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                    }`}
                  >
                    <span>👑 Bebas Jasa (Rp 0)</span>
                  </button>
                </div>

                {counterFeeDiscount > 0 && (
                  <div className="flex justify-between items-center text-[10px] pt-0.5 font-bold">
                    <span className="text-slate-500">Jasa Efektif:</span>
                    <span className="font-mono text-emerald-800">
                      {effectiveCounterFee === 0 ? (
                        <span className="text-amber-700 font-black">Rp 0 (GRATIS OWNER)</span>
                      ) : (
                        `Rp ${effectiveCounterFee.toLocaleString('id-ID')}`
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Opsi Skema Biaya Admin Khusus Tarik Tunai */}
            {isTarikTunai && (
              <div className="p-3 bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-amber-50/90 rounded-xl border border-amber-300 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Pilih Skema Biaya Admin Tarik Tunai:</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 whitespace-nowrap shrink-0 tabular-nums">
                    Admin: Rp {totalAdmin.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {/* Option 1: Kirim Sekalian Admin */}
                  <button
                    type="button"
                    onClick={() => setAdminDeductionType('tambah_transfer')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      adminDeductionType === 'tambah_transfer'
                        ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-500 shadow-xs'
                        : 'bg-white border-amber-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${adminDeductionType === 'tambah_transfer' ? 'bg-teal-600' : 'bg-slate-300'}`} />
                        <span>Kirim Sekalian Admin</span>
                      </span>
                      <span className="text-[11px] font-mono font-bold text-teal-900 tabular-nums whitespace-nowrap">
                        Transfer Rp {(nominal + totalAdmin).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-slate-600 pl-4">
                      <span>Diserahkan tunai: <strong className="font-mono text-slate-900 tabular-nums">Rp {nominal.toLocaleString('id-ID')}</strong></span>
                      <span className="text-rose-600 font-black font-mono tabular-nums whitespace-nowrap">Laci: -Rp {nominal.toLocaleString('id-ID')}</span>
                    </div>
                  </button>

                  {/* Option 2: Potong dari Uang Tunai */}
                  <button
                    type="button"
                    onClick={() => setAdminDeductionType('potong_tunai')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      adminDeductionType === 'potong_tunai'
                        ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-500 shadow-xs'
                        : 'bg-white border-amber-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${adminDeductionType === 'potong_tunai' ? 'bg-amber-600' : 'bg-slate-300'}`} />
                        <span>Potong dari Uang Tunai</span>
                      </span>
                      <span className="text-[11px] font-mono font-bold text-amber-900 tabular-nums whitespace-nowrap">
                        Transfer Rp {nominal.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-slate-600 pl-4">
                      <span>Diserahkan dipotong admin: <strong className="font-mono text-amber-900 tabular-nums">Rp {Math.max(0, nominal - totalAdmin).toLocaleString('id-ID')}</strong></span>
                      <span className="text-rose-600 font-black font-mono tabular-nums whitespace-nowrap">Laci: -Rp {Math.max(0, nominal - totalAdmin).toLocaleString('id-ID')}</span>
                    </div>
                  </button>

                  {/* Option 3: Admin Bayar Tunai di Konter (Masuk Uang Laci) */}
                  <button
                    type="button"
                    onClick={() => setAdminDeductionType('tunai_konter')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      adminDeductionType === 'tunai_konter'
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500 shadow-xs'
                        : 'bg-white border-amber-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${adminDeductionType === 'tunai_konter' ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                        <span>Admin Bayar Tunai di Konter</span>
                      </span>
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
                        Masuk Uang Laci
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[10px] text-slate-600 pl-4">
                      <span>Transfer pokok: <strong className="font-mono text-slate-900 tabular-nums">Rp {nominal.toLocaleString('id-ID')}</strong> · Serahkan: <strong className="font-mono text-rose-700 tabular-nums">Rp {nominal.toLocaleString('id-ID')}</strong></span>
                      <span className="text-emerald-700 font-black font-mono tabular-nums whitespace-nowrap">
                        Admin Tunai Laci: +Rp {totalAdmin.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Breakdown regarding physical cash and debited card balance */}
            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-bold text-slate-700">
                  {primaryTab === 'tarik_tunai' && tarikChannel === 'qris'
                    ? 'Total Ditransfer via QRIS oleh Nasabah:'
                    : primaryTab === 'transfer_topup' && transferChannel === 'qris'
                    ? 'Total Dibayar via QRIS:'
                    : primaryTab === 'transfer_topup' && transferChannel === 'ewallet'
                    ? 'Total Dibayar Nasabah:'
                    : primaryTab === 'transfer_topup' && transferChannel === 'mbanking'
                    ? 'Total Didebet dari Rekening / Dibayar Nasabah:'
                    : isTunaiKonter
                    ? 'Total Ditransfer / Didebet Nasabah (Pokok):'
                    : isTarikTunai
                    ? 'Total Ditransfer / Didebet Nasabah:'
                    : 'Total Didebet dari Kartu Nasabah:'}
                </span>
                <span className="text-base font-extrabold text-slate-900 font-mono tabular-nums whitespace-nowrap">
                  Rp {totalDebited.toLocaleString('id-ID')}
                </span>
              </div>

              {isTarikTunai ? (
                isTunaiKonter ? (
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-950 text-[11px] space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>Uang Tarikan Diserahkan (Keluar Laci):</span>
                      <span className="font-mono font-black text-rose-700 tabular-nums">
                        -Rp {cashHandedOut.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-emerald-800">
                      <span>Bayar Admin Tunai di Konter (Masuk Laci):</span>
                      <span className="font-mono font-black tabular-nums">
                        +Rp {totalAdmin.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] font-black pt-1 border-t border-emerald-200 text-slate-900">
                      <span>Selisih Bersih Kas Laci:</span>
                      <span className={`font-mono tabular-nums ${netDrawerDeltaTarik >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {netDrawerDeltaTarik >= 0 ? '+' : '-'}Rp {Math.abs(netDrawerDeltaTarik).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-300 text-amber-950 text-[11px] space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>Uang Fisik Diberikan dari Laci:</span>
                      <span className="font-mono text-sm font-black text-amber-900 tabular-nums">
                        Rp {cashHandedOut.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-rose-700 font-bold pt-0.5 border-t border-amber-200">
                      <span>Pengurangan Saldo Kas Laci:</span>
                      <span className="font-mono font-black tabular-nums">
                        -Rp {cashHandedOut.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 text-[11px] flex items-center justify-between font-medium">
                  <span>Uang Fisik Diterima ke Laci:</span>
                  <span className="font-bold font-mono tabular-nums">
                    Rp {totalDebited.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-emerald-700 font-semibold flex items-center justify-between pt-1">
              <span>Laba Bersih Jasa Konter:</span>
              <span className="font-bold font-mono text-emerald-800">
                {effectiveCounterFee === 0 ? (
                  <span className="text-amber-700 font-black">+Rp 0 (GRATIS OWNER)</span>
                ) : (
                  `+Rp ${effectiveCounterFee.toLocaleString('id-ID')}`
                )}
              </span>
            </div>
          </div>

          {/* Action / Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold rounded-xl shadow-md shadow-teal-900/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {(primaryTab === 'transfer_topup' && transferChannel === 'qris') || (primaryTab === 'tarik_tunai' && tarikChannel === 'qris') ? (
              <QrCode className="w-4 h-4 text-amber-300" />
            ) : (primaryTab === 'tarik_tunai' && tarikChannel === 'ewallet') ||
              (primaryTab === 'transfer_topup' && transferChannel === 'ewallet') ? (
              <Smartphone className="w-4 h-4 text-amber-300" />
            ) : (primaryTab === 'tarik_tunai' && tarikChannel === 'mbanking') ||
              (primaryTab === 'transfer_topup' && transferChannel === 'mbanking') ? (
              <ShieldCheck className="w-4 h-4 text-amber-300" />
            ) : (
              <CreditCard className="w-4 h-4 text-amber-300" />
            )}
            <span>
              {primaryTab === 'tarik_tunai'
                ? tarikChannel === 'kartu_debit'
                  ? 'Gesek Kartu & Proses Tarik Tunai'
                  : tarikChannel === 'ewallet'
                  ? `Proses Tarik Tunai E-Wallet (${ewalletProvider})`
                  : tarikChannel === 'mbanking'
                  ? 'Konfirmasi & Proses Transaksi M-Banking'
                  : 'Scan QRIS & Selesaikan Tarik Tunai'
                : transferChannel === 'kartu_debit'
                ? 'Gesek Kartu & Proses Transfer'
                : transferChannel === 'ewallet'
                ? `Proses Top Up E-Wallet (${ewalletProvider})`
                : transferChannel === 'mbanking'
                ? 'Konfirmasi & Proses Transaksi M-Banking'
                : 'Scan QRIS & Selesaikan Pembayaran'}
            </span>
          </button>

          {primaryTab === 'transfer_topup' && (
            <button
              type="button"
              onClick={() => handleAddTransferToMasterCart(false)}
              className="w-full py-2.5 px-4 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 font-bold text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              title="Gabungkan transaksi transfer / top up ini dengan belanja kasir, PPOB, atau percetakan dalam 1 pembayaran"
            >
              <ShoppingCart className="w-4 h-4 text-teal-600" />
              <span>+ Gabung ke Keranjang Besar (Bayar Sekaligus Menu Lain)</span>
            </button>
          )}
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
              Transfer Hari Ini
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
              Laba Bersih Jasa Konter
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
              { id: 'kartu_debit', label: 'Kartu Debit' },
              { id: 'ewallet', label: 'E-Wallet' },
              { id: 'mbanking', label: 'M-Banking' },
              { id: 'qris', label: 'QRIS' },
            ].map((tab) => {
              const active = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer shrink-0 ${
                    active
                      ? 'bg-teal-700 text-white shadow-xs font-black ring-1 ring-teal-800'
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
                              : tx.type === 'ewallet_mbanking_atm'
                              ? 'bg-indigo-100 text-indigo-900'
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
                            : tx.type === 'ewallet_mbanking_atm'
                            ? 'E-Wallet & M-Banking'
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
                        <div>Rp {tx.totalDebited.toLocaleString('id-ID')}</div>
                        {tx.type === 'tarik_tunai_atm' && tx.adminDeductionType === 'tunai_konter' && (
                          <div className="text-[10px] font-bold text-emerald-700">
                            +Admin Laci Rp {(tx.adminEdcFee + tx.counterFee).toLocaleString('id-ID')}
                          </div>
                        )}
                        {tx.type === 'tarik_tunai_atm' && tx.adminDeductionType === 'potong_tunai' && (
                          <div className="text-[10px] font-semibold text-amber-700">
                            Potong Admin
                          </div>
                        )}
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
                  <h3 className="text-sm font-extrabold tracking-tight">
                    {isCurrentChannelCard ? 'Dialog Pembayaran & Otorisasi EDC' : 'Dialog Konfirmasi Transaksi Digital'}
                  </h3>
                  <p className="text-[11px] text-teal-100">
                    {isCurrentChannelCard ? 'Ju-Fat Cell · Terminal Sunmi P2 Pro Multi-Payment' : 'Ju-Fat Cell · Transaksi Digital Non-EDC'}
                  </p>
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
                      ? `Layanan Tarik Tunai (${tarikTunaiSource === 'kartu_debit' ? 'Kartu ATM' : tarikTunaiSource === 'ewallet' ? 'E-Wallet' : 'M-Banking'})`
                      : activeMode === 'transfer_atm'
                      ? (isCurrentChannelCard ? 'Layanan Transfer EDC' : 'Layanan Transfer Bank')
                      : activeMode === 'topup_ewallet_atm'
                      ? 'Top Up E-Wallet'
                      : activeMode === 'mbanking_atm'
                      ? 'Mobile Banking'
                      : 'Sistem QRIS Merchant'}
                  </span>
                  {isCurrentChannelCard ? (
                    <span className="text-[11px] font-mono text-teal-900 font-bold">
                      EDC-JUFAT-01
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      TRANSAKSI DIGITAL
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block">Kanal / Bank:</span>
                    <span className="font-extrabold text-slate-900">
                      {activeMode === 'tarik_tunai_atm'
                        ? tarikTunaiSource === 'kartu_debit'
                          ? `${bankName} (${cardType})`
                          : tarikTunaiSource === 'ewallet'
                          ? `E-Wallet: ${ewalletProvider}`
                          : `M-Banking: ${mbankingApp}`
                        : activeMode === 'topup_ewallet_atm'
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

                {(targetAccountOrPhone || activeMode === 'qris_atm' || (activeMode === 'tarik_tunai_atm' && tarikTunaiSource !== 'kartu_debit')) && (
                  <div className="pt-1 border-t border-teal-200/60 text-xs">
                    <span className="text-[10px] text-slate-500 font-medium block">
                      {activeMode === 'topup_ewallet_atm' || (activeMode === 'tarik_tunai_atm' && tarikTunaiSource === 'ewallet')
                        ? 'No. Handphone E-Wallet Nasabah:'
                        : activeMode === 'qris_atm'
                        ? 'RRN Referensi QRIS:'
                        : 'No. Rekening / VA / Token Tujuan:'}
                    </span>
                    <span className="font-mono font-black text-teal-950 text-sm">
                      {targetAccountOrPhone || (activeMode === 'tarik_tunai_atm' ? cardNumberLast4 : '') || qrisRrn}
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
                      : activeMode === 'topup_ewallet_atm'
                      ? 'Biaya Admin Layanan:'
                      : isCurrentChannelCard
                      ? 'Biaya Admin EDC / Bank:'
                      : 'Biaya Admin Transaksi / App:'}
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
                    {effectiveCounterFee === 0 ? (
                      <span className="text-amber-700 font-black">+Rp 0 (GRATIS OWNER)</span>
                    ) : (
                      `+Rp ${effectiveCounterFee.toLocaleString('id-ID')}`
                    )}
                  </span>
                </div>

                <div className="border-t-2 border-slate-200 pt-2 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-black text-slate-900 uppercase">
                      {activeMode === 'qris_atm'
                        ? 'Total Bayar via QRIS:'
                        : activeMode === 'topup_ewallet_atm'
                        ? 'Total Diproses E-Wallet:'
                        : isTunaiKonter
                        ? 'Debet / Transfer Pokok Nasabah:'
                        : isTarikTunai
                        ? 'Total Ditransfer / Didebet Nasabah:'
                        : 'Total Didebet dari Kartu Nasabah:'}
                    </span>
                    <span className="text-xl font-black font-mono text-emerald-800 tabular-nums">
                      Rp {totalDebited.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {isTunaiKonter && (
                    <div className="flex items-center justify-between bg-emerald-100/80 border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs font-black text-emerald-950">
                      <span>Admin Bayar Tunai di Konter (Masuk Laci):</span>
                      <span className="font-mono tabular-nums">+Rp {totalAdmin.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pilihan Metode Pembayaran: Tunai, QRIS, Kasbon (Hutang) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">
                  {isTunaiKonter
                    ? 'Metode Terima Biaya Admin di Konter:'
                    : isCurrentChannelCard
                    ? 'Metode Pembayaran Transaksi EDC:'
                    : 'Metode Pembayaran Transaksi:'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'tunai', label: 'Tunai', icon: Banknote },
                    { id: 'qris', label: 'QRIS', icon: QrCode },
                    { id: 'hutang', label: 'Kasbon', icon: Receipt },
                  ].map((m) => {
                    const Icon = m.icon;
                    const active = atmMiniPaymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setAtmMiniPaymentMethod(m.id as any)}
                        className={`py-2 px-1 text-xs font-bold rounded-xl flex flex-col items-center gap-1 transition cursor-pointer border ${
                          active
                            ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-600 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditional Payment Guidance based on atmMiniPaymentMethod */}
              {atmMiniPaymentMethod === 'qris' && (
                <div className="p-3 bg-sky-50 border-2 border-sky-300 rounded-xl space-y-1.5 text-sky-950">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-sky-600" />
                      <span>QRIS Merchant Ju-Fat Cell</span>
                    </span>
                    <span className="text-[10px] bg-sky-200 text-sky-800 px-1.5 py-0.5 rounded font-mono">
                      ID10202688190
                    </span>
                  </div>
                  <p className="text-xs text-sky-900">
                    {isTunaiKonter
                      ? <>Minta nasabah scan QRIS untuk biaya admin sebesar <span className="font-bold font-mono">Rp {totalAdmin.toLocaleString('id-ID')}</span>.</>
                      : <>Minta nasabah scan QRIS toko sebesar <span className="font-bold font-mono">Rp {totalDebited.toLocaleString('id-ID')}</span>.</>}
                  </p>
                  <p className="text-[10px] text-sky-700">
                    {isTunaiKonter
                      ? '💡 Catatan: Bila admin dibayar uang fisik agar masuk Uang Laci, pilih metode Tunai.'
                      : '💡 Saldo masuk ke rekening QRIS toko, kas laci tetap seimbang.'}
                  </p>
                </div>
              )}

              {atmMiniPaymentMethod === 'hutang' && (
                <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-xl space-y-2.5 text-amber-950">
                  <div className="flex items-center justify-between font-bold text-xs text-amber-900 pb-1.5 border-b border-amber-200">
                    <div className="flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-amber-600" />
                      <span>Data Kasbon Nasabah (Masuk Buku Hutang)</span>
                    </div>
                    <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Nama Wajib Diisi *
                    </span>
                  </div>

                  {/* Input Nama Pelanggan yang Berhutang / Kasbon */}
                  <div>
                    <label className="text-[11px] font-extrabold text-amber-950 flex items-center justify-between mb-1">
                      <span>Nama Orang / Pelanggan yang Kasbon *</span>
                      <span className="text-[10px] text-amber-800 font-semibold">Tersimpan di Daftar Hutang</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={atmMiniDebtorName}
                      onChange={(e) => {
                        setAtmMiniDebtorName(e.target.value);
                        if (atmMiniKasbonError) setAtmMiniKasbonError(null);
                      }}
                      placeholder="Ketik nama orang yang berhutang (cth: Pak Sugeng, Mas Budi, Bu Erni)..."
                      className={`w-full px-3 py-2 text-xs bg-white border-2 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs ${
                        atmMiniKasbonError ? 'border-rose-500 bg-rose-50/50 animate-pulse' : 'border-amber-400'
                      }`}
                    />
                    {atmMiniKasbonError && (
                      <p className="text-[10px] font-bold text-rose-600 mt-1">
                        ⚠️ {atmMiniKasbonError}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
                        Jatuh Tempo Kasbon:
                      </label>
                      <input
                        type="date"
                        value={atmMiniDueDate}
                        onChange={(e) => setAtmMiniDueDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
                        No. WA / HP (Opsional):
                      </label>
                      <input
                        type="text"
                        value={atmMiniCustomerPhone}
                        onChange={(e) => setAtmMiniCustomerPhone(e.target.value)}
                        placeholder="Boleh dikosongkan..."
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="p-2 bg-amber-100/90 rounded-lg text-[11px] text-amber-950 font-medium border border-amber-300 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>
                      Dicatat sebesar <strong className="font-mono font-bold">Rp {(isTunaiKonter ? totalAdmin : totalDebited).toLocaleString('id-ID')}</strong> {isTunaiKonter ? '(Kasbon Admin Konter)' : ''} di Buku Hutang atas nama:{' '}
                      <strong className="underline font-bold text-amber-950">
                        {atmMiniDebtorName.trim() || customerName.trim() || '(Ketik nama di atas)'}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              {atmMiniPaymentMethod === 'tunai' && (
                isTarikTunai ? (
                  isTunaiKonter ? (
                    <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl space-y-2.5 text-emerald-950">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Banknote className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>Petunjuk Kasir: Serahkan Tarikan & Terima Admin Tunai</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-950 border border-emerald-300 whitespace-nowrap shrink-0">
                          Admin Masuk Laci
                        </span>
                      </div>

                      <div className="p-2 bg-white/90 rounded-lg text-[11px] leading-snug space-y-1 border border-emerald-200">
                        <div className="flex items-center justify-between text-slate-800">
                          <span>1. Nasabah transfer / debet pokok:</span>
                          <strong className="font-mono tabular-nums">Rp {nominal.toLocaleString('id-ID')}</strong>
                        </div>
                        <div className="flex items-center justify-between text-rose-700 font-bold">
                          <span>2. Serahkan uang tarikan dari laci:</span>
                          <strong className="font-mono tabular-nums">-Rp {cashHandedOut.toLocaleString('id-ID')}</strong>
                        </div>
                        <div className="flex items-center justify-between text-emerald-800 font-black">
                          <span>3. Terima admin tunai (Masuk Uang Laci):</span>
                          <strong className="font-mono tabular-nums">+Rp {totalAdmin.toLocaleString('id-ID')}</strong>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-emerald-100 font-black text-slate-900">
                          <span>Dampak Bersih Saldo Kas Laci:</span>
                          <span className={`font-mono tabular-nums ${netDrawerDeltaTarik >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {netDrawerDeltaTarik >= 0 ? '+' : '-'}Rp {Math.abs(netDrawerDeltaTarik).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {/* Cash Admin Change Calculator */}
                      <div className="space-y-1.5 pt-1 border-t border-emerald-200">
                        <label className="text-[11px] font-bold text-emerald-900 flex items-center justify-between">
                          <span>Uang Tunai Admin Diberikan Nasabah:</span>
                          <span className="font-mono text-emerald-950">Tagihan: Rp {totalAdmin.toLocaleString('id-ID')}</span>
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
                            placeholder={totalAdmin.toLocaleString('id-ID')}
                          />
                        </div>

                        <div className="flex items-center gap-1 overflow-x-auto pt-0.5">
                          <button
                            type="button"
                            onClick={() => setCashReceivedInput(totalAdmin)}
                            className="px-2 py-0.5 text-[10px] font-bold bg-emerald-200/80 hover:bg-emerald-300 text-emerald-950 rounded transition cursor-pointer whitespace-nowrap"
                          >
                            Uang Pas
                          </button>
                          {[5000, 10000, 20000, 50000, 100000].map((quickCash) => (
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

                        <div className="flex items-center justify-between pt-0.5 text-xs">
                          <span className="font-bold text-slate-700">
                            {cashReceivedInput >= totalAdmin
                              ? 'Kembalian Uang Admin:'
                              : cashReceivedInput > 0
                              ? 'Sisa Kasbon Admin (Buku Hutang):'
                              : 'Kurang Bayar Admin:'}
                          </span>
                          <span
                            className={`font-mono font-black text-sm tabular-nums ${
                              cashReceivedInput >= totalAdmin
                                ? 'text-emerald-700'
                                : cashReceivedInput > 0
                                ? 'text-amber-700'
                                : 'text-rose-600'
                            }`}
                          >
                            {cashReceivedInput >= totalAdmin
                              ? `Rp ${(cashReceivedInput - totalAdmin).toLocaleString('id-ID')}`
                              : `Rp ${(totalAdmin - cashReceivedInput).toLocaleString('id-ID')}`}
                          </span>
                        </div>

                        {cashReceivedInput > 0 && cashReceivedInput < totalAdmin && (
                          <div className="mt-1 p-2 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5">
                            <p className="text-[10px] text-amber-900 leading-tight">
                              💡 <strong>Bayar Sebagian Admin:</strong> Tunai Rp {cashReceivedInput.toLocaleString('id-ID')} masuk laci & sisa <strong className="font-mono">Rp {(totalAdmin - cashReceivedInput).toLocaleString('id-ID')}</strong> dicatat ke Buku Kasbon:
                            </p>
                            <input
                              type="text"
                              value={atmMiniDebtorName}
                              onChange={(e) => {
                                setAtmMiniDebtorName(e.target.value);
                                if (atmMiniKasbonError) setAtmMiniKasbonError(null);
                              }}
                              placeholder="Ketik nama pelanggan yang kasbon admin..."
                              className="w-full px-2.5 py-1 text-xs bg-white border border-amber-400 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            {atmMiniKasbonError && (
                              <p className="text-[10px] font-bold text-rose-600">⚠️ {atmMiniKasbonError}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-2 text-amber-950">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Banknote className="w-4 h-4 text-amber-600" />
                          <span>Petunjuk Kasir: Serahkan Uang Tunai ke Nasabah</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200/90 text-amber-950 border border-amber-300">
                          {isPotongTunai ? '✂️ Potong dari Tunai' : '📲 Kirim Sekalian Admin'}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-1 border-t border-amber-200">
                        <span className="text-xs font-bold text-slate-800">Uang Fisik Diserahkan dari Laci:</span>
                        <span className="text-xl font-black font-mono text-amber-950">
                          Rp {cashHandedOut.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="p-2 bg-white/80 rounded-lg text-[11px] leading-tight space-y-1 border border-amber-200">
                        {isPotongTunai ? (
                          <>
                            <p className="text-slate-800">
                              • Nasabah transfer pas: <strong className="font-mono">Rp {nominal.toLocaleString('id-ID')}</strong> (tidak sekalian admin).
                            </p>
                            <p className="text-slate-800">
                              • Admin <strong className="font-mono">Rp {totalAdmin.toLocaleString('id-ID')}</strong> dipotong langsung dari uang tunai.
                            </p>
                            <p className="text-rose-700 font-bold">
                              ⚡ Kas Laci Berkurang: <span className="font-mono font-black">-Rp {cashHandedOut.toLocaleString('id-ID')}</span>.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-slate-800">
                              • Nasabah transfer sekalian admin: <strong className="font-mono">Rp {totalDebited.toLocaleString('id-ID')}</strong>.
                            </p>
                            <p className="text-slate-800">
                              • Kasir menyerahkan nominal penuh: <strong className="font-mono">Rp {nominal.toLocaleString('id-ID')}</strong>.
                            </p>
                            <p className="text-rose-700 font-bold">
                              ⚡ Kas Laci Berkurang: <span className="font-mono font-black">-Rp {nominal.toLocaleString('id-ID')}</span>.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl space-y-2 text-emerald-950">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Banknote className="w-4 h-4 text-emerald-700" />
                        <span>Uang Fisik Diterima ke Laci Kasir (Dicatat Penuh)</span>
                      </div>
                      <span className="text-[11px] font-mono font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        Wajib: Rp {totalDebited.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-800 leading-tight">
                      ⚡ Kas laci akan otomatis bertambah <strong>Rp {totalDebited.toLocaleString('id-ID')}</strong> (Nominal Pokok + Admin Bank + Laba Jasa).
                    </p>

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

                      {/* Change Amount & Sisa Kasbon */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="font-bold text-slate-700">
                          {cashReceivedInput >= totalDebited
                            ? 'Uang Kembalian Kasir:'
                            : cashReceivedInput > 0
                            ? 'Sisa Kasbon (Masuk Buku Hutang):'
                            : 'Kurang Bayar:'}
                        </span>
                        <span
                          className={`font-mono font-black text-sm ${
                            cashReceivedInput >= totalDebited
                              ? 'text-emerald-700'
                              : cashReceivedInput > 0
                              ? 'text-amber-700'
                              : 'text-rose-600'
                          }`}
                        >
                          {cashReceivedInput >= totalDebited
                            ? `Rp ${(cashReceivedInput - totalDebited).toLocaleString('id-ID')}`
                            : `Rp ${(totalDebited - cashReceivedInput).toLocaleString('id-ID')}`}
                        </span>
                      </div>

                      {/* Info & Input Pelanggan Kasbon jika Bayar Sebagian */}
                      {cashReceivedInput > 0 && cashReceivedInput < totalDebited && (
                        <div className="mt-2 p-2.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                          <p className="text-[10px] text-amber-900 leading-tight">
                            💡 <strong>Mode Bayar Sebagian:</strong> Uang Rp {cashReceivedInput.toLocaleString('id-ID')} dicatat masuk laci kasir, dan sisa <strong className="font-mono">Rp {(totalDebited - cashReceivedInput).toLocaleString('id-ID')}</strong> otomatis dicatat ke Buku Kasbon atas nama nasabah di bawah ini:
                          </p>
                          <div>
                            <label className="text-[10px] font-extrabold text-amber-950 flex items-center justify-between mb-0.5">
                              <span>Nama Pelanggan yang Kasbon Sisa: *</span>
                              <span className="text-[9px] text-rose-600 font-bold bg-rose-50 px-1 rounded border border-rose-200">
                                Wajib Diisi
                              </span>
                            </label>
                            <input
                              type="text"
                              value={atmMiniDebtorName}
                              onChange={(e) => {
                                setAtmMiniDebtorName(e.target.value);
                                if (atmMiniKasbonError) setAtmMiniKasbonError(null);
                              }}
                              placeholder="Ketik nama pelanggan yang berhutang..."
                              className="w-full px-2.5 py-1 text-xs bg-white border border-amber-400 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            {atmMiniKasbonError && (
                              <p className="text-[10px] font-bold text-rose-600 mt-1">⚠️ {atmMiniKasbonError}</p>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="font-bold text-amber-900 block mb-0.5">Jatuh Tempo:</span>
                              <input
                                type="date"
                                value={atmMiniDueDate}
                                onChange={(e) => setAtmMiniDueDate(e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono"
                              />
                            </div>
                            <div>
                              <span className="font-bold text-amber-900 block mb-0.5">No. HP / WA:</span>
                              <input
                                type="text"
                                value={atmMiniCustomerPhone}
                                onChange={(e) => setAtmMiniCustomerPhone(e.target.value)}
                                placeholder="Opsional..."
                                className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {/* Simulated EDC Hardware Status Indicator - Hanya untuk Kartu Debit */}
              {((primaryTab === 'tarik_tunai' && tarikChannel === 'kartu_debit') ||
                (primaryTab === 'transfer_topup' && transferChannel === 'kartu_debit')) && (
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
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Kembali
              </button>
              {primaryTab === 'transfer_topup' && (
                <button
                  type="button"
                  onClick={() => handleAddTransferToMasterCart(true)}
                  className="py-2.5 px-3 bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-teal-600" />
                  <span>+ Gabung Keranjang</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirmAndExecuteTransaction}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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
      {selectedTxDetail && (() => {
        const isDetailCard =
          selectedTxDetail.cardType !== 'M-Banking' &&
          selectedTxDetail.cardType !== 'E-Wallet' &&
          selectedTxDetail.cardType !== 'QRIS' &&
          selectedTxDetail.type !== 'qris_atm' &&
          selectedTxDetail.type !== 'mbanking_atm' &&
          selectedTxDetail.type !== 'topup_ewallet_atm' &&
          !selectedTxDetail.cardNumberMasked?.startsWith('EW-') &&
          !selectedTxDetail.cardNumberMasked?.startsWith('APP ') &&
          !selectedTxDetail.cardNumberMasked?.startsWith('RRN-');

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden my-auto animate-scale-up">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold">
                    {isDetailCard
                      ? `Rincian Transaksi EDC #${selectedTxDetail.traceNo}`
                      : `Rincian Transaksi Digital #${selectedTxDetail.traceNo}`}
                  </h3>
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
                  <span className="font-bold text-teal-800 uppercase">
                    {selectedTxDetail.type === 'tarik_tunai_atm'
                      ? (isDetailCard ? 'Tarik Tunai EDC' : 'Tarik Tunai')
                      : selectedTxDetail.type === 'transfer_atm'
                      ? (isDetailCard ? 'Transfer EDC' : 'Transfer Bank')
                      : selectedTxDetail.type === 'topup_ewallet_atm'
                      ? 'Top Up E-Wallet'
                      : selectedTxDetail.type === 'mbanking_atm'
                      ? 'Mobile Banking'
                      : selectedTxDetail.type === 'ewallet_mbanking_atm'
                      ? 'E-Wallet & M-Banking'
                      : 'Sistem QRIS'}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Bank / Provider:</span>
                  <span className="font-bold text-slate-800">{selectedTxDetail.bankName}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">
                    {isDetailCard ? 'No Kartu:' : 'No Akun / Ref:'}
                  </span>
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
                  <span className="text-slate-500">
                    {isDetailCard ? 'Biaya Admin EDC:' : 'Biaya Admin Transaksi / App:'}
                  </span>
                  <span className="font-mono text-slate-700">Rp {selectedTxDetail.adminEdcFee.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-emerald-700 font-bold">Laba Jasa Konter:</span>
                  <span className="font-mono font-bold text-emerald-800">+Rp {selectedTxDetail.counterFee.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between pt-1 font-bold text-sm text-slate-900">
                  <span>
                    {selectedTxDetail.type === 'tarik_tunai_atm' && selectedTxDetail.adminDeductionType === 'tunai_konter'
                      ? 'Debet / Transfer Pokok:'
                      : 'Total Ditransfer / Didebet:'}
                  </span>
                  <span className="font-mono font-black text-emerald-800">Rp {selectedTxDetail.totalDebited.toLocaleString('id-ID')}</span>
                </div>
                {selectedTxDetail.type === 'tarik_tunai_atm' && (
                  selectedTxDetail.adminDeductionType === 'tunai_konter' ? (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs space-y-1 mt-1">
                      <div className="flex items-center justify-between font-bold text-amber-950">
                        <span>Uang Tarikan Diserahkan (Laci Keluar):</span>
                        <span className="font-mono text-rose-700 font-black">
                          -Rp {selectedTxDetail.cashHandedOrReceived.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-bold text-emerald-800">
                        <span>Admin Bayar Tunai (Masuk Uang Laci):</span>
                        <span className="font-mono font-black">
                          +Rp {(
                            selectedTxDetail.isPartialPayment
                              ? selectedTxDetail.paidAmount || 0
                              : selectedTxDetail.paymentMethod === 'hutang'
                              ? 0
                              : selectedTxDetail.adminEdcFee + selectedTxDetail.counterFee
                          ).toLocaleString('id-ID')}
                        </span>
                      </div>
                      {selectedTxDetail.remainingDebt && selectedTxDetail.remainingDebt > 0 ? (
                        <div className="flex items-center justify-between text-[11px] font-bold text-rose-700 pt-1 border-t border-emerald-200">
                          <span>Sisa Kasbon Admin:</span>
                          <span className="font-mono">Rp {selectedTxDetail.remainingDebt.toLocaleString('id-ID')}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs font-bold text-amber-950 mt-1">
                      <span>Uang Fisik Diserahkan (Laci):</span>
                      <span className="font-mono text-rose-700 font-black">
                        -Rp {selectedTxDetail.cashHandedOrReceived.toLocaleString('id-ID')}
                        {selectedTxDetail.adminDeductionType === 'potong_tunai' && (
                          <span className="text-[10px] text-amber-800 font-normal ml-1">(Potong Admin)</span>
                        )}
                      </span>
                    </div>
                  )
                )}
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
      );
    })()}
    </div>
  );
};
