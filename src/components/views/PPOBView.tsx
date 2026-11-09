import React, { useState, useRef } from 'react';
import {
  Zap,
  Phone,
  Wifi,
  CheckCircle,
  Droplets,
  HeartPulse,
  Plus,
  Edit2,
  Trash2,
  Tag,
  AlertCircle,
  X,
  Clock,
  Gamepad2,
  Printer,
  Sparkles,
  Flame,
  Search,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Banknote,
  QrCode,
  Receipt,
  Globe,
  Smartphone,
  Building2,
  Calculator,
  ArrowRight,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { PPOBCategory, PPOBPackage, PPOBTransaction } from '../../types/pos';

const POPULAR_GAMES = [
  'Semua Game',
  'Mobile Legends',
  'Free Fire',
  'PUBG Mobile',
  'Genshin Impact',
  'Honor of Kings',
  'Roblox',
  'Valorant',
  'Steam Wallet',
] as const;

const POPULAR_WIFI_PROVIDERS = [
  'Semua Wifi',
  'Indihome',
  'Iconnet',
  'Biznet',
  'First Media',
  'MyRepublic',
  'XL Satu',
  'CBN Fiber',
] as const;

export const PPOBView: React.FC = () => {
  const {
    shift,
    ppobPackages,
    addPPOBPackage,
    updatePPOBPackage,
    deletePPOBPackage,
    ppobTransactions,
    recordPPOBTransaction,
    updatePPOBTransaction,
    deletePPOBTransaction,
    openReceipt,
  } = usePOS();

  const isOwner = shift.cashierSlot === 'owner' || shift.role === 'owner';

  const [category, setCategory] = useState<PPOBCategory>('pulsa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('Telkomsel');

  // Game specific state
  const [selectedGame, setSelectedGame] = useState<string>('Mobile Legends');
  const [gameUserId, setGameUserId] = useState('');
  const [gameZoneId, setGameZoneId] = useState('');
  const [gameSearchQuery, setGameSearchQuery] = useState('');

  // Wifi specific state
  const [selectedWifiProvider, setSelectedWifiProvider] = useState<string>('Semua Wifi');
  const [wifiSearchQuery, setWifiSearchQuery] = useState('');
  const wifiScrollRef = useRef<HTMLDivElement>(null);

  // Listrik Bulanan & Tagihan Bebas state
  const [plnPeriod, setPlnPeriod] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  });

  const [customPlnBillAmount, setCustomPlnBillAmount] = useState<number>(150000);
  const [customPlnAdminFee, setCustomPlnAdminFee] = useState<number>(3000);

  const [customWifiBillAmount, setCustomWifiBillAmount] = useState<number>(280000);
  const [customWifiAdminFee, setCustomWifiAdminFee] = useState<number>(3500);
  const [customWifiProvider, setCustomWifiProvider] = useState<string>('Indihome');

  const [successMessage, setSuccessMessage] = useState('');
  const [mobileTab, setMobileTab] = useState<'buy' | 'history'>('buy');
  const [lastTxForReceipt, setLastTxForReceipt] = useState<PPOBTransaction | null>(null);

  // Scroll references and helper functions for horizontal tabs
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const gameScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollGames = (direction: 'left' | 'right') => {
    if (gameScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      gameScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollWifi = (direction: 'left' | 'right') => {
    if (wifiScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      wifiScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Quick Pay Handlers for Custom Bill Amount
  const handlePayCustomPlnBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      alert('Nomor Meteran / ID Pelanggan PLN Pascabayar wajib diisi!');
      return;
    }
    const amount = Number(customPlnBillAmount) || 0;
    const admin = Number(customPlnAdminFee) || 0;
    if (amount <= 0) {
      alert('Nominal tagihan listrik harus lebih dari Rp 0!');
      return;
    }

    const customPkg: PPOBPackage = {
      id: `custom-plnpost-${Date.now()}`,
      category: 'pln_bulanan',
      provider: 'PLN Pascabayar',
      name: `Tagihan Listrik Rp ${amount.toLocaleString('id-ID')}`,
      hpp: amount,
      price: amount + admin,
      desc: `Tagihan PLN Bulanan (${plnPeriod}) · Admin Loket Rp ${admin.toLocaleString('id-ID')}`,
    };

    handleInitiatePurchase(customPkg);
  };

  const handlePayCustomWifiBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      alert('Nomor Pelanggan / ID Sambungan Wifi wajib diisi!');
      return;
    }
    const amount = Number(customWifiBillAmount) || 0;
    const admin = Number(customWifiAdminFee) || 0;
    if (amount <= 0) {
      alert('Nominal tagihan wifi harus lebih dari Rp 0!');
      return;
    }

    const providerName =
      selectedWifiProvider !== 'Semua Wifi' ? selectedWifiProvider : customWifiProvider;

    const customPkg: PPOBPackage = {
      id: `custom-wifi-${Date.now()}`,
      category: 'wifi',
      provider: providerName,
      name: `Tagihan ${providerName} Rp ${amount.toLocaleString('id-ID')}`,
      hpp: amount,
      price: amount + admin,
      desc: `Tagihan Wifi & Internet ${providerName} · Admin Rp ${admin.toLocaleString('id-ID')}`,
    };

    handleInitiatePurchase(customPkg);
  };

  // Modals for Packages
  const [packageModalMode, setPackageModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingPackage, setEditingPackage] = useState<PPOBPackage | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<PPOBPackage | null>(null);

  // Form states for Package Modal
  const [pkgName, setPkgName] = useState('');
  const [pkgCategory, setPkgCategory] = useState<PPOBCategory>('pulsa');
  const [pkgProvider, setPkgProvider] = useState('Telkomsel');
  const [pkgHpp, setPkgHpp] = useState(5000);
  const [pkgPrice, setPkgPrice] = useState(7000);
  const [pkgDesc, setPkgDesc] = useState('');

  // Modals for Transaction edit/delete
  const [editingTransaction, setEditingTransaction] = useState<PPOBTransaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<PPOBTransaction | null>(null);

  // Form states for Transaction Edit Modal
  const [txTargetNumber, setTxTargetNumber] = useState('');
  const [txCustomerName, setTxCustomerName] = useState('');
  const [txSellingPrice, setTxSellingPrice] = useState(0);

  // Auto detect provider based on Indonesian phone prefixes
  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    const cleaned = val.replace(/\D/g, '');
    if (
      cleaned.startsWith('0811') ||
      cleaned.startsWith('0812') ||
      cleaned.startsWith('0813') ||
      cleaned.startsWith('0821') ||
      cleaned.startsWith('0822') ||
      cleaned.startsWith('0852') ||
      cleaned.startsWith('0853')
    ) {
      setSelectedProvider('Telkomsel');
    } else if (
      cleaned.startsWith('0814') ||
      cleaned.startsWith('0815') ||
      cleaned.startsWith('0816') ||
      cleaned.startsWith('0855') ||
      cleaned.startsWith('0856') ||
      cleaned.startsWith('0857') ||
      cleaned.startsWith('0858')
    ) {
      setSelectedProvider('Indosat');
    } else if (
      cleaned.startsWith('0817') ||
      cleaned.startsWith('0818') ||
      cleaned.startsWith('0819') ||
      cleaned.startsWith('0859') ||
      cleaned.startsWith('0877') ||
      cleaned.startsWith('0878')
    ) {
      setSelectedProvider('XL');
    } else if (
      cleaned.startsWith('0838') ||
      cleaned.startsWith('0831') ||
      cleaned.startsWith('0832') ||
      cleaned.startsWith('0833')
    ) {
      setSelectedProvider('Axis');
    } else if (
      cleaned.startsWith('0895') ||
      cleaned.startsWith('0896') ||
      cleaned.startsWith('0897') ||
      cleaned.startsWith('0898') ||
      cleaned.startsWith('0899')
    ) {
      setSelectedProvider('Tri');
    } else if (
      cleaned.startsWith('0881') ||
      cleaned.startsWith('0882') ||
      cleaned.startsWith('0888')
    ) {
      setSelectedProvider('Smartfren');
    }
  };

  // PPOB Interactive Payment / Checkout Modal
  const [selectedPackageForCheckout, setSelectedPackageForCheckout] = useState<PPOBPackage | null>(null);
  const [ppobPaymentMethod, setPpobPaymentMethod] = useState<'tunai' | 'qris' | 'hutang'>('tunai');
  const [ppobCashReceived, setPpobCashReceived] = useState<number>(0);
  const [ppobDiscount, setPpobDiscount] = useState<number>(0);
  const [ppobCustomerPhone, setPpobCustomerPhone] = useState('');
  const [ppobDebtorName, setPpobDebtorName] = useState('');
  const [ppobKasbonError, setPpobKasbonError] = useState<string | null>(null);
  const [ppobDueDate, setPpobDueDate] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [ppobNote, setPpobNote] = useState('');

  const finalPPOBPrice = selectedPackageForCheckout
    ? Math.max(0, selectedPackageForCheckout.price - ppobDiscount)
    : 0;

  const handleInitiatePurchase = (pkg: PPOBPackage) => {
    let target = phoneNumber.trim();
    if (category === 'game') {
      if (!gameUserId.trim()) {
        alert('User ID / Player ID Game wajib diisi!');
        return;
      }
      target = gameZoneId.trim()
        ? `${gameUserId.trim()} (${gameZoneId.trim()})`
        : gameUserId.trim();
    } else {
      if (!phoneNumber.trim()) {
        alert(
          category === 'pln'
            ? 'Nomor Meteran / ID Pelanggan PLN Prabayar wajib diisi!'
            : category === 'pln_bulanan'
            ? 'Nomor Meteran / ID Pelanggan PLN Pascabayar wajib diisi!'
            : category === 'wifi'
            ? 'Nomor Pelanggan / ID Sambungan Wifi wajib diisi!'
            : 'Nomor HP Pelanggan wajib diisi!'
        );
        return;
      }
    }

    setSelectedPackageForCheckout(pkg);
    setPpobDiscount(0);
    setPpobCashReceived(pkg.price);
    setPpobPaymentMethod('tunai');
    setPpobCustomerPhone(phoneNumber.trim() || '');
    setPpobDebtorName(customerName.trim());
    setPpobKasbonError(null);
    setPpobNote('');
  };

  const handleConfirmPurchase = () => {
    if (!selectedPackageForCheckout) return;
    const pkg = selectedPackageForCheckout;

    if (finalPPOBPrice === 0 && !isOwner) {
      alert('Transaksi PPOB Rp 0 (Diskon 100%) hanya diizinkan untuk OWNER yang sedang bertugas!');
      return;
    }

    let finalCustomerName = customerName.trim();
    if (ppobPaymentMethod === 'hutang') {
      const debtorName = ppobDebtorName.trim() || customerName.trim();
      if (!debtorName || debtorName.toLowerCase() === 'pelanggan ppob' || debtorName.toLowerCase() === 'player game') {
        setPpobKasbonError('Nama Pelanggan yang Kasbon wajib diisi agar tersimpan di Buku Hutang!');
        return;
      }
      finalCustomerName = debtorName;
      setCustomerName(debtorName);
    }

    let target = phoneNumber.trim();
    if (category === 'game') {
      target = gameZoneId.trim()
        ? `${gameUserId.trim()} (${gameZoneId.trim()})`
        : gameUserId.trim();
    }

    const providerLabel =
      category === 'pln'
        ? 'PLN Prepaid'
        : category === 'pln_bulanan'
        ? 'PLN Pascabayar'
        : pkg.provider;

    const defaultCustomerName =
      category === 'game'
        ? 'Player Game'
        : category === 'pln_bulanan'
        ? 'Pelanggan Listrik'
        : category === 'wifi'
        ? 'Pelanggan Wifi'
        : 'Pelanggan PPOB';

    const tx = recordPPOBTransaction(
      category,
      providerLabel,
      target,
      pkg.name,
      pkg.hpp,
      finalPPOBPrice,
      finalCustomerName || defaultCustomerName,
      ppobPaymentMethod,
      ppobCustomerPhone.trim() || target,
      ppobDueDate,
      ppobNote.trim() || undefined,
      ppobDiscount > 0 ? ppobDiscount : undefined
    );

    setSelectedPackageForCheckout(null);
    setLastTxForReceipt(tx);
    const methodLabel =
      ppobPaymentMethod === 'tunai'
        ? 'Tunai'
        : ppobPaymentMethod === 'qris'
        ? 'QRIS'
        : 'Kasbon (Hutang)';

    setSuccessMessage(
      finalPPOBPrice === 0
        ? `Pembelian ${pkg.name} untuk ${target} Rp 0 (GRATIS OWNER) berhasil diproses!`
        : `Pembelian ${pkg.name} untuk ${target} (${methodLabel}) berhasil diproses!`
    );
    setTimeout(() => setSuccessMessage(''), 6000);
  };

  // Open Add Package Modal
  const openAddPackageModal = () => {
    setPackageModalMode('add');
    setEditingPackage(null);
    setPkgName('');
    setPkgCategory(category);
    if (category === 'game') {
      setPkgProvider(selectedGame !== 'Semua Game' ? selectedGame : 'Mobile Legends');
      setPkgHpp(20000);
      setPkgPrice(24000);
      setPkgDesc('Top up instan ID & Server');
    } else if (category === 'pln') {
      setPkgProvider('PLN');
      setPkgHpp(20500);
      setPkgPrice(23000);
      setPkgDesc('Token listrik PLN (Prabayar)');
    } else if (category === 'pln_bulanan') {
      setPkgProvider('PLN Pascabayar');
      setPkgHpp(100000);
      setPkgPrice(103000);
      setPkgDesc('Tagihan listrik bulanan · Admin Loket Rp 3.000');
    } else if (category === 'wifi') {
      setPkgProvider(selectedWifiProvider !== 'Semua Wifi' ? selectedWifiProvider : 'Indihome');
      setPkgHpp(280000);
      setPkgPrice(283500);
      setPkgDesc('Tagihan bulanan Wifi · Admin Loket Rp 3.500');
    } else {
      setPkgProvider(selectedProvider);
      setPkgHpp(10000);
      setPkgPrice(12000);
      setPkgDesc('');
    }
  };

  // Open Edit Package Modal
  const openEditPackageModal = (pkg: PPOBPackage, e: React.MouseEvent) => {
    e.stopPropagation();
    setPackageModalMode('edit');
    setEditingPackage(pkg);
    setPkgName(pkg.name);
    setPkgCategory(pkg.category);
    setPkgProvider(pkg.provider);
    setPkgHpp(pkg.hpp);
    setPkgPrice(pkg.price);
    setPkgDesc(pkg.desc || '');
  };

  // Save Package (Add or Edit)
  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) {
      alert('Nama paket wajib diisi!');
      return;
    }

    if (packageModalMode === 'edit' && editingPackage) {
      updatePPOBPackage({
        ...editingPackage,
        name: pkgName.trim(),
        category: pkgCategory,
        provider: pkgProvider.trim(),
        hpp: Number(pkgHpp) || 0,
        price: Number(pkgPrice) || 0,
        desc: pkgDesc.trim() || undefined,
      });
    } else if (packageModalMode === 'add') {
      addPPOBPackage({
        name: pkgName.trim(),
        category: pkgCategory,
        provider: pkgProvider.trim(),
        hpp: Number(pkgHpp) || 0,
        price: Number(pkgPrice) || 0,
        desc: pkgDesc.trim() || undefined,
      });
    }

    setPackageModalMode(null);
    setEditingPackage(null);
  };

  // Open Edit Transaction Modal
  const openEditTransactionModal = (tx: PPOBTransaction) => {
    setEditingTransaction(tx);
    setTxTargetNumber(tx.targetNumber);
    setTxCustomerName(tx.customerName);
    setTxSellingPrice(tx.sellingPrice);
  };

  // Save Transaction Edit
  const handleSaveTransactionEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    const newPrice = Number(txSellingPrice) || 0;
    const newProfit = newPrice - editingTransaction.hpp;

    updatePPOBTransaction({
      ...editingTransaction,
      targetNumber: txTargetNumber.trim(),
      customerName: txCustomerName.trim() || 'Pelanggan PPOB',
      sellingPrice: newPrice,
      profit: newProfit,
    });

    setEditingTransaction(null);
  };

  // Filter packages for currently active category and provider
  const filteredPackages = ppobPackages.filter((pkg) => {
    if (category === 'pulsa' || category === 'data') {
      return (
        pkg.category === category &&
        (pkg.provider.toLowerCase() === selectedProvider.toLowerCase() ||
          pkg.provider.toLowerCase() === 'semua')
      );
    }
    if (category === 'game') {
      if (pkg.category !== 'game') return false;
      const matchesGame =
        selectedGame === 'Semua Game' ||
        pkg.provider.toLowerCase() === selectedGame.toLowerCase();
      const matchesSearch =
        !gameSearchQuery.trim() ||
        pkg.name.toLowerCase().includes(gameSearchQuery.toLowerCase()) ||
        pkg.provider.toLowerCase().includes(gameSearchQuery.toLowerCase());
      return matchesGame && matchesSearch;
    }
    if (category === 'pln') {
      return pkg.category === 'pln';
    }
    if (category === 'pln_bulanan') {
      return pkg.category === 'pln_bulanan';
    }
    if (category === 'wifi') {
      if (pkg.category !== 'wifi') return false;
      const matchesProvider =
        selectedWifiProvider === 'Semua Wifi' ||
        pkg.provider.toLowerCase() === selectedWifiProvider.toLowerCase();
      const matchesSearch =
        !wifiSearchQuery.trim() ||
        pkg.name.toLowerCase().includes(wifiSearchQuery.toLowerCase()) ||
        pkg.provider.toLowerCase().includes(wifiSearchQuery.toLowerCase());
      return matchesProvider && matchesSearch;
    }
    if (category === 'bpjs') {
      return pkg.category === 'bpjs' || pkg.category === 'tagihan';
    }
    if (category === 'pdam') {
      return pkg.category === 'pdam' || pkg.category === 'tagihan';
    }
    return pkg.category === category;
  });

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#f8f9fa]">
      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex items-center bg-white border-b border-slate-200 p-2 shrink-0">
        <div className="grid grid-cols-2 w-full p-1 bg-slate-100 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setMobileTab('buy')}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              mobileTab === 'buy'
                ? 'bg-white text-teal-950 shadow-sm font-black ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
            }`}
          >
            <Zap className="w-4 h-4 text-teal-600" />
            <span>Pilih Paket & Isi</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('history')}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              mobileTab === 'history'
                ? 'bg-white text-teal-950 shadow-sm font-black ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
            }`}
          >
            <Clock className="w-4 h-4 text-teal-600" />
            <span>Riwayat ({ppobTransactions.length})</span>
          </button>
        </div>
      </div>

      {/* Left Column: Selection & Package Grid */}
      <div
        className={`${
          mobileTab === 'buy' ? 'flex' : 'hidden'
        } md:flex flex-1 flex-col h-full md:border-r border-slate-200 bg-white overflow-hidden min-w-0`}
      >
        {/* Category & Input Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50 space-y-3">
          {/* Category Tabs with Restored & Visible Horizontal Scroll + Quick Arrows */}
          <div className="relative group">
            {/* Left Scroll Arrow */}
            <button
              type="button"
              onClick={() => scrollCategories('left')}
              className="hidden sm:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white hover:bg-teal-50 border border-slate-300 rounded-full items-center justify-center shadow-md text-slate-700 hover:text-teal-700 transition cursor-pointer active:scale-95"
              title="Geser menu ke kiri"
              aria-label="Geser menu ke kiri"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable Container with Visible Styled Scrollbar */}
            <div
              ref={categoryScrollRef}
              className="flex items-center gap-2 overflow-x-auto pb-2.5 pt-0.5 px-0.5 scroll-smooth touch-pan-x [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-slate-200/80 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-teal-500/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-teal-600"
            >
              {[
                { id: 'pulsa', label: 'Pulsa Reguler', icon: Phone },
                { id: 'data', label: 'Paket Data / Kuota', icon: Smartphone },
                { id: 'pln', label: 'Token PLN (Prabayar)', icon: Zap },
                { id: 'pln_bulanan', label: 'Listrik Bulanan (PLN)', icon: Receipt, highlight: 'amber' },
                { id: 'wifi', label: 'Tagihan Wifi / Internet', icon: Wifi, highlight: 'sky' },
                { id: 'game', label: 'Top Up Game & Voucher', icon: Gamepad2, highlight: 'violet' },
                { id: 'bpjs', label: 'BPJS Kesehatan', icon: HeartPulse },
                { id: 'pdam', label: 'PDAM & Utilitas', icon: Droplets },
              ].map((c) => {
                const Icon = c.icon;
                const active = category === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={(e) => {
                      setCategory(c.id as PPOBCategory);
                      e.currentTarget.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'center',
                      });
                    }}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition shrink-0 cursor-pointer shadow-2xs whitespace-nowrap select-none ${
                      active
                        ? c.highlight === 'violet'
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm font-extrabold ring-2 ring-violet-300'
                          : c.highlight === 'amber'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm font-extrabold ring-2 ring-amber-300'
                          : c.highlight === 'sky'
                          ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-sm font-extrabold ring-2 ring-sky-300'
                          : 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm font-bold ring-2 ring-teal-300'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 font-medium'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${
                      c.highlight === 'violet' && !active
                        ? 'text-violet-600'
                        : c.highlight === 'amber' && !active
                        ? 'text-amber-600'
                        : c.highlight === 'sky' && !active
                        ? 'text-sky-600'
                        : ''
                    }`} />
                    <span>{c.label}</span>
                    {(c.id === 'pln_bulanan' || c.id === 'wifi' || c.id === 'game') && !active && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold uppercase ${
                        c.id === 'pln_bulanan'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : c.id === 'wifi'
                          ? 'bg-sky-100 text-sky-900 border border-sky-300'
                          : 'bg-violet-100 text-violet-900 border border-violet-300'
                      }`}>
                        Baru
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Scroll Arrow */}
            <button
              type="button"
              onClick={() => scrollCategories('right')}
              className="hidden sm:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white hover:bg-teal-50 border border-slate-300 rounded-full items-center justify-center shadow-md text-slate-700 hover:text-teal-700 transition cursor-pointer active:scale-95"
              title="Geser menu ke kanan"
              aria-label="Geser menu ke kanan"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* DYNAMIC FORMS BY CATEGORY */}
          {category === 'game' ? (
            <div className="space-y-3 bg-white p-3.5 rounded-xl border border-violet-200/80 shadow-xs">
              {/* Game Selector Chips / Badges with Horizontal Scroll and Arrows */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-extrabold text-violet-950 flex items-center gap-1">
                    <Gamepad2 className="w-3.5 h-3.5 text-violet-600" />
                    <span>Pilih Game & Voucher:</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {filteredPackages.length} item aktif
                  </span>
                </div>

                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => scrollGames('left')}
                    className="hidden sm:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white hover:bg-violet-50 border border-violet-200 rounded-full items-center justify-center shadow-xs text-violet-700 active:scale-95 transition cursor-pointer"
                    title="Geser game ke kiri"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <div
                    ref={gameScrollRef}
                    className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-0.5 px-0.5 scroll-smooth touch-pan-x [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-200/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-violet-400 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-violet-600"
                  >
                    {POPULAR_GAMES.map((gameName) => {
                      const active = selectedGame === gameName;
                      return (
                        <button
                          key={gameName}
                          type="button"
                          onClick={(e) => {
                            setSelectedGame(gameName);
                            e.currentTarget.scrollIntoView({
                              behavior: 'smooth',
                              block: 'nearest',
                              inline: 'center',
                            });
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer whitespace-nowrap select-none ${
                            active
                              ? 'bg-violet-700 text-white shadow-xs ring-1 ring-violet-400'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {gameName === 'Mobile Legends' && '⚔️ '}
                          {gameName === 'Free Fire' && '🔥 '}
                          {gameName === 'PUBG Mobile' && '🎯 '}
                          {gameName === 'Genshin Impact' && '✨ '}
                          {gameName === 'Roblox' && '🧱 '}
                          {gameName === 'Valorant' && '💥 '}
                          {gameName === 'Steam Wallet' && '🎮 '}
                          {gameName}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => scrollGames('right')}
                    className="hidden sm:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white hover:bg-violet-50 border border-violet-200 rounded-full items-center justify-center shadow-xs text-violet-700 active:scale-95 transition cursor-pointer"
                    title="Geser game ke kanan"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Game Account Input Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 border-t border-slate-100">
                <div className={selectedGame === 'Mobile Legends' || selectedGame === 'Genshin Impact' ? 'md:col-span-1' : 'md:col-span-2'}>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {selectedGame === 'Mobile Legends'
                      ? 'User ID Game MLBB *'
                      : selectedGame === 'Genshin Impact'
                      ? 'UID Genshin *'
                      : selectedGame === 'Free Fire'
                      ? 'Player ID Free Fire *'
                      : selectedGame === 'PUBG Mobile'
                      ? 'Player ID PUBG *'
                      : selectedGame === 'Roblox'
                      ? 'Username Akun Roblox *'
                      : selectedGame === 'Valorant'
                      ? 'Riot ID & Tagline *'
                      : selectedGame === 'Steam Wallet'
                      ? 'No HP / WA Penerima Kode *'
                      : 'User ID / ID Akun Game *'}
                  </label>
                  <input
                    type="text"
                    value={gameUserId}
                    onChange={(e) => setGameUserId(e.target.value)}
                    placeholder={
                      selectedGame === 'Mobile Legends'
                        ? 'Contoh: 128910419'
                        : selectedGame === 'Genshin Impact'
                        ? 'Contoh: 819203819'
                        : selectedGame === 'Roblox'
                        ? 'Contoh: GamerJuFat99'
                        : selectedGame === 'Valorant'
                        ? 'Contoh: JuFat#ID1'
                        : selectedGame === 'Steam Wallet'
                        ? 'Contoh: 08123456789'
                        : 'Masukkan ID Akun Game'
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-violet-200 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-violet-500 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Server / Zone ID (for Mobile Legends & Genshin) */}
                {(selectedGame === 'Mobile Legends' || selectedGame === 'Genshin Impact') && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {selectedGame === 'Mobile Legends' ? 'Zone / Server ID *' : 'Server Genshin *'}
                    </label>
                    <input
                      type="text"
                      value={gameZoneId}
                      onChange={(e) => setGameZoneId(e.target.value)}
                      placeholder={selectedGame === 'Mobile Legends' ? 'Contoh: 2104' : 'Asia / America'}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-violet-200 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-violet-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nickname / Nama Pembeli (Opsional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: JuFat_Slayer"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-violet-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Search or Quick Note */}
              <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5 text-violet-800 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                  <span>Top up instan resmi & otomatis masuk langsung ke akun pemain.</span>
                </div>
                <div className="relative w-44 shrink-0">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={gameSearchQuery}
                    onChange={(e) => setGameSearchQuery(e.target.value)}
                    placeholder="Cari item / nominal..."
                    className="w-full pl-7 pr-2 py-1 text-xs bg-slate-100 rounded-md border border-slate-200 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : category === 'pln_bulanan' ? (
            /* ============================================================== */
            /* DYNAMIC FORM: PEMBAYARAN LISTRIK BULANAN (PLN PASCABAYAR)       */
            /* ============================================================== */
            <div className="space-y-3 bg-white p-3.5 rounded-xl border-2 border-amber-300 shadow-xs">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-950 uppercase tracking-tight">
                      Loket Pembayaran Listrik Bulanan (PLN Pascabayar)
                    </h4>
                    <p className="text-[10.5px] text-slate-500">
                      Bayar tagihan listrik bulanan resmi PLN untuk rumah tangga & usaha
                    </p>
                  </div>
                </div>
                <span className="text-[9.5px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-black font-mono">
                  PLN PASCABAYAR
                </span>
              </div>

              {/* Input Nomor ID Pelanggan & Nama Pelanggan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div className="md:col-span-2">
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                    Nomor ID Pelanggan PLN / No Meteran (12 Digit) *
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Contoh: 512039182390"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-amber-300 rounded-lg font-mono font-black text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nama Pemilik Rekening / Pelanggan
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Custom Bill Calculator Card for Listrik Bulanan */}
              <form
                onSubmit={handlePayCustomPlnBill}
                className="bg-gradient-to-r from-amber-50 to-amber-100/60 p-3 rounded-xl border border-amber-300 space-y-2"
              >
                <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                  <span className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-amber-700" />
                    <span>⚡ Bayar Tagihan Listrik Sesuai Rekening (Nominal Bebas)</span>
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold">
                    Hitung Tagihan & Admin Otomatis
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                      Jumlah Tagihan PLN Pokok (Rp): *
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="1000"
                        step="100"
                        required
                        value={customPlnBillAmount}
                        onChange={(e) => setCustomPlnBillAmount(Number(e.target.value) || 0)}
                        placeholder="Contoh: 187500"
                        className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                      Biaya Admin Loket (Rp):
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={customPlnAdminFee}
                        onChange={(e) => setCustomPlnAdminFee(Number(e.target.value) || 0)}
                        className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                      Periode Bulan Tagihan:
                    </label>
                    <input
                      type="text"
                      value={plnPeriod}
                      onChange={(e) => setPlnPeriod(e.target.value)}
                      placeholder="Contoh: November 2026"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Total Bayar Pelanggan:</span>
                      <span className="font-mono font-black text-sm text-amber-950">
                        Rp {(customPlnBillAmount + customPlnAdminFee).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="border-l border-amber-300 pl-3">
                      <span className="text-[10px] text-slate-500 block">Untung Loket:</span>
                      <span className="font-mono font-bold text-xs text-emerald-700">
                        +Rp {customPlnAdminFee.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black rounded-lg shadow-sm flex items-center gap-1.5 text-xs cursor-pointer active:scale-95 transition"
                  >
                    <span>⚡ Lanjut Bayar Tagihan Listrik</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          ) : category === 'wifi' ? (
            /* ============================================================== */
            /* DYNAMIC FORM: PEMBAYARAN TAGIHAN WIFI & INTERNET RUMAH          */
            /* ============================================================== */
            <div className="space-y-3 bg-white p-3.5 rounded-xl border-2 border-sky-300 shadow-xs">
              <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-sky-950 uppercase tracking-tight">
                      Loket Pembayaran Tagihan Wifi & Internet Rumah
                    </h4>
                    <p className="text-[10.5px] text-slate-500">
                      Indihome, Iconnet PLN, Biznet, First Media, MyRepublic, XL Satu, dll.
                    </p>
                  </div>
                </div>
                <span className="text-[9.5px] bg-sky-100 text-sky-900 border border-sky-300 px-2 py-0.5 rounded font-black font-mono">
                  MULTI PROVIDER WIFI
                </span>
              </div>

              {/* Provider Selector Chips with Horizontal Scroll */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-extrabold text-sky-950 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-sky-600" />
                    <span>Pilih Provider Wifi:</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {filteredPackages.length} paket aktif
                  </span>
                </div>

                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => scrollWifi('left')}
                    className="hidden sm:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white hover:bg-sky-50 border border-sky-200 rounded-full items-center justify-center shadow-xs text-sky-700 active:scale-95 transition cursor-pointer"
                    title="Geser provider wifi ke kiri"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <div
                    ref={wifiScrollRef}
                    className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-0.5 px-0.5 scroll-smooth touch-pan-x [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-200/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sky-400 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-sky-600"
                  >
                    {POPULAR_WIFI_PROVIDERS.map((providerName) => {
                      const active = selectedWifiProvider === providerName;
                      return (
                        <button
                          key={providerName}
                          type="button"
                          onClick={(e) => {
                            setSelectedWifiProvider(providerName);
                            if (providerName !== 'Semua Wifi') {
                              setCustomWifiProvider(providerName);
                            }
                            e.currentTarget.scrollIntoView({
                              behavior: 'smooth',
                              block: 'nearest',
                              inline: 'center',
                            });
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer whitespace-nowrap select-none ${
                            active
                              ? 'bg-sky-700 text-white shadow-xs ring-1 ring-sky-400'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {providerName === 'Indihome' && '🔴 '}
                          {providerName === 'Iconnet' && '⚡ '}
                          {providerName === 'Biznet' && '🔵 '}
                          {providerName === 'First Media' && '📺 '}
                          {providerName === 'MyRepublic' && '🚀 '}
                          {providerName === 'XL Satu' && '📶 '}
                          {providerName === 'CBN Fiber' && '🌐 '}
                          {providerName}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => scrollWifi('right')}
                    className="hidden sm:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white hover:bg-sky-50 border border-sky-200 rounded-full items-center justify-center shadow-xs text-sky-700 active:scale-95 transition cursor-pointer"
                    title="Geser provider wifi ke kanan"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Input Nomor Pelanggan Wifi & Nama */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 border-t border-slate-100">
                <div className="md:col-span-2">
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                    Nomor Pelanggan / ID Sambungan Wifi *
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Contoh: 121908239012 (No Sambungan Indihome/Iconnet/Biznet)"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-sky-300 rounded-lg font-mono font-black text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nama Pelanggan Wifi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Agus Pratama"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Custom Bill Calculator Card for Wifi */}
              <form
                onSubmit={handlePayCustomWifiBill}
                className="bg-gradient-to-r from-sky-50 to-blue-50 p-3 rounded-xl border border-sky-300 space-y-2"
              >
                <div className="flex items-center justify-between border-b border-sky-200 pb-1.5">
                  <span className="font-extrabold text-sky-950 text-xs flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-sky-700" />
                    <span>🌐 Bayar Tagihan Wifi Sesuai Nota (Nominal Bebas)</span>
                  </span>
                  <span className="text-[10px] text-sky-800 font-bold">
                    Input Tagihan Riil ISP
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                      Provider Wifi:
                    </label>
                    <select
                      value={customWifiProvider}
                      onChange={(e) => setCustomWifiProvider(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-sky-300 rounded-lg font-bold text-slate-800 focus:outline-none text-xs"
                    >
                      {POPULAR_WIFI_PROVIDERS.filter((p) => p !== 'Semua Wifi').map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                      Tagihan Pokok Wifi (Rp): *
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="1000"
                        step="100"
                        required
                        value={customWifiBillAmount}
                        onChange={(e) => setCustomWifiBillAmount(Number(e.target.value) || 0)}
                        placeholder="Contoh: 312450"
                        className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-sky-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                      Biaya Admin Loket (Rp):
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={customWifiAdminFee}
                        onChange={(e) => setCustomWifiAdminFee(Number(e.target.value) || 0)}
                        className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-sky-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-sky-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Total Bayar Pelanggan:</span>
                      <span className="font-mono font-black text-sm text-sky-950">
                        Rp {(customWifiBillAmount + customWifiAdminFee).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="border-l border-sky-300 pl-3">
                      <span className="text-[10px] text-slate-500 block">Untung Loket:</span>
                      <span className="font-mono font-bold text-xs text-emerald-700">
                        +Rp {customWifiAdminFee.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black rounded-lg shadow-sm flex items-center gap-1.5 text-xs cursor-pointer active:scale-95 transition"
                  >
                    <span>🌐 Lanjut Bayar Tagihan Wifi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Standard Phone / Meteran Input for Pulsa, Data, Token PLN, etc. */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  {category === 'pln' ? 'Nomor Meteran / ID Pelanggan Token PLN (Prabayar)' : 'Nomor HP Pelanggan'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder={
                      category === 'pln' ? 'Contoh: 14028918230' : 'Contoh: 081234567890'
                    }
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  {category !== 'pln' && phoneNumber.length >= 4 && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {selectedProvider}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Operator / Jaringan
                </label>
                <select
                  disabled={category === 'pln'}
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-100"
                >
                  {category === 'pln' ? (
                    <option value="PLN">PLN Prepaid (Token)</option>
                  ) : (
                    ['Telkomsel', 'Indosat', 'XL', 'Axis', 'Tri', 'Smartfren'].map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Action Header for Packages */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-800">
              {category === 'game'
                ? `Katalog Top Up ${selectedGame}`
                : category === 'pln_bulanan'
                ? 'Katalog Tagihan Listrik Bulanan (PLN Pascabayar)'
                : category === 'wifi'
                ? `Katalog Tagihan Wifi & Internet ${selectedWifiProvider !== 'Semua Wifi' ? selectedWifiProvider : ''}`
                : category === 'pln'
                ? 'Katalog Token Listrik PLN (Prabayar)'
                : `Katalog Paket ${selectedProvider}`}
            </span>
            <span className="text-[11px] font-mono font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
              {filteredPackages.length} Item
            </span>
          </div>

          <button
            onClick={openAddPackageModal}
            className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Paket</span>
          </button>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between gap-2 font-medium animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            {lastTxForReceipt && (
              <button
                type="button"
                onClick={() => openReceipt(lastTxForReceipt)}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-md flex items-center gap-1 text-[11px] shrink-0 cursor-pointer shadow-xs"
              >
                <Printer className="w-3 h-3 text-amber-300" />
                <span>Cetak Struk</span>
              </button>
            )}
          </div>
        )}

        {/* Denom Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredPackages.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Gamepad2 className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-medium">Belum ada item / paket untuk kategori ini</p>
              <button
                onClick={openAddPackageModal}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
              >
                + Tambah Item/Paket Baru
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPackages.map((pkg) => {
                const profit = pkg.price - pkg.hpp;
                const isGame = pkg.category === 'game';
                const isPlnBulanan = pkg.category === 'pln_bulanan';
                const isWifi = pkg.category === 'wifi';
                const isBill = isPlnBulanan || isWifi || pkg.category === 'bpjs' || pkg.category === 'pdam' || pkg.category === 'tagihan';

                return (
                  <div
                    key={pkg.id}
                    className={`bg-white border rounded-xl p-3.5 transition flex flex-col justify-between group relative ${
                      isGame
                        ? 'border-violet-100 hover:border-violet-400 hover:shadow-md'
                        : isPlnBulanan
                        ? 'border-amber-200/90 hover:border-amber-500 hover:shadow-md bg-linear-to-b from-amber-50/20 to-white'
                        : isWifi
                        ? 'border-sky-200/90 hover:border-sky-500 hover:shadow-md bg-linear-to-b from-sky-50/20 to-white'
                        : 'border-slate-200 hover:border-emerald-500 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Top Header of Card: Provider & Action Buttons */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`text-[10px] uppercase font-bold font-mono tracking-wider px-1.5 py-0.5 rounded ${
                            isGame
                              ? 'bg-violet-50 text-violet-800 border border-violet-200'
                              : isPlnBulanan
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : isWifi
                              ? 'bg-sky-100 text-sky-900 border border-sky-300'
                              : 'text-slate-500 bg-slate-50'
                          }`}
                        >
                          {pkg.provider}
                        </span>

                        {/* Edit & Hapus Buttons for Package */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => openEditPackageModal(pkg, e)}
                            className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
                            title="Edit Paket"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPackageToDelete(pkg);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                            title="Hapus Paket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug flex items-center gap-1 mt-1">
                        {isGame && <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        {isPlnBulanan && <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        {isWifi && <Globe className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                        <span>{pkg.name}</span>
                      </h4>
                      {pkg.desc && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{pkg.desc}</p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
                      <div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Modal: Rp {pkg.hpp.toLocaleString('id-ID')}
                        </div>
                        <div
                          className={`text-sm font-extrabold font-mono tabular-nums ${
                            isGame
                              ? 'text-violet-900'
                              : isPlnBulanan
                              ? 'text-amber-900'
                              : isWifi
                              ? 'text-sky-900'
                              : 'text-emerald-800'
                          }`}
                        >
                          Rp {pkg.price.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-bold font-mono">
                          Laba +Rp {profit.toLocaleString('id-ID')}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInitiatePurchase(pkg)}
                        className={`px-3.5 py-1.5 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 ${
                          isGame
                            ? 'bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500'
                            : isPlnBulanan
                            ? 'bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500'
                            : isWifi
                            ? 'bg-linear-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500'
                            : 'bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500'
                        }`}
                      >
                        <span>{isGame ? 'Top Up' : isBill ? 'Bayar' : 'Beli'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: PPOB Live Transaction Log */}
      <div
        className={`${
          mobileTab === 'history' ? 'flex' : 'hidden'
        } md:flex w-full md:w-84 bg-slate-50 flex-col h-full md:border-l border-slate-200 overflow-hidden shrink-0`}
      >
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Riwayat Transaksi PPOB</span>
            </h4>
            <p className="text-[11px] text-slate-500">Pulsa, Game, Token & Tagihan</p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
            {ppobTransactions.length} Total
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {ppobTransactions.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-1.5">
              <Zap className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-medium">Belum ada transaksi PPOB</p>
              <p className="text-[10px] text-slate-400 text-center">
                Pilih paket di kiri untuk memproses pembelian
              </p>
            </div>
          ) : (
            ppobTransactions.map((tx) => {
              const isGameTx = tx.category === 'game';
              const isPlnBulananTx = tx.category === 'pln_bulanan';
              const isWifiTx = tx.category === 'wifi';

              const txBorder = isGameTx
                ? 'border-violet-200 hover:border-violet-400'
                : isPlnBulananTx
                ? 'border-amber-200 hover:border-amber-400'
                : isWifiTx
                ? 'border-sky-200 hover:border-sky-400'
                : 'border-slate-200/80 hover:border-slate-400';

              const catBadge = isGameTx
                ? 'bg-violet-100 text-violet-800 border border-violet-200'
                : isPlnBulananTx
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : isWifiTx
                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                : 'bg-slate-100 text-slate-600';

              const catLabel =
                tx.category === 'game'
                  ? 'GAME'
                  : tx.category === 'pln_bulanan'
                  ? 'LISTRIK BLN'
                  : tx.category === 'wifi'
                  ? 'WIFI / NET'
                  : tx.category === 'pln'
                  ? 'PLN TOKEN'
                  : tx.category.toUpperCase();

              return (
                <div
                  key={tx.id}
                  className={`bg-white p-3 rounded-lg border shadow-xs space-y-1.5 text-xs group transition ${txBorder}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0 pr-1">
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase shrink-0 ${catBadge}`}
                      >
                        {catLabel}
                      </span>
                      <span className="font-bold text-slate-800 truncate">{tx.packageName}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                      +Rp {tx.profit.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-700 font-semibold truncate max-w-[170px]">
                      {tx.targetNumber}
                    </span>
                    <span className="text-slate-500 text-[10px] truncate max-w-[90px]">
                      {tx.customerName}
                    </span>
                  </div>

                  {/* Bottom line: Ref, Price, Print Receipt, and Action Buttons (Edit & Hapus) */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100 font-mono">
                    <span>{tx.refNo}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">
                        Rp {tx.sellingPrice.toLocaleString('id-ID')}
                      </span>
                      {/* Print Receipt Button */}
                      <button
                        type="button"
                        onClick={() => openReceipt(tx)}
                        className="p-1 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded transition cursor-pointer"
                        title="Cetak Struk Transaksi"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {/* Edit Button */}
                      <button
                        onClick={() => openEditTransactionModal(tx)}
                        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
                        title="Edit Data Transaksi"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {/* Delete Button */}
                      <button
                        onClick={() => setTxToDelete(tx)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                        title="Hapus Transaksi dari Riwayat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL: Tambah / Edit Paket Pulsa & PPOB */}
      {packageModalMode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {packageModalMode === 'edit'
                      ? 'Edit Paket Pulsa / Game / PPOB'
                      : 'Tambah Paket Pulsa / Game / PPOB Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Katalog Konter Ju-Fat Cell</p>
                </div>
              </div>
              <button
                onClick={() => setPackageModalMode(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Paket / Item *</label>
                <input
                  type="text"
                  required
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  placeholder="Contoh: MLBB 86 Diamonds atau Pulsa 15.000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={pkgCategory}
                    onChange={(e) => {
                      const newCat = e.target.value as PPOBCategory;
                      setPkgCategory(newCat);
                      if (newCat === 'game') setPkgProvider('Mobile Legends');
                      else if (newCat === 'pln') setPkgProvider('PLN');
                      else if (newCat === 'pln_bulanan') setPkgProvider('PLN Pascabayar');
                      else if (newCat === 'wifi') setPkgProvider('Indihome');
                      else if (newCat === 'pulsa' || newCat === 'data') setPkgProvider('Telkomsel');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  >
                    <option value="game">🎮 Top Up & Voucher Game</option>
                    <option value="pulsa">📱 Pulsa Reguler</option>
                    <option value="data">🌐 Paket Data / Kuota</option>
                    <option value="pln">⚡ Token Listrik PLN (Prabayar)</option>
                    <option value="pln_bulanan">⚡ Listrik Bulanan (PLN Pascabayar)</option>
                    <option value="wifi">🌐 Pembayaran Wifi & Internet</option>
                    <option value="bpjs">🏥 BPJS Kesehatan</option>
                    <option value="pdam">💧 PDAM Air</option>
                    <option value="tagihan">🧾 Tagihan Bulanan Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {pkgCategory === 'game'
                      ? 'Nama Game / Voucher'
                      : pkgCategory === 'wifi'
                      ? 'Provider Wifi / Internet'
                      : 'Operator / Provider'}
                  </label>
                  {pkgCategory === 'game' ? (
                    <select
                      value={pkgProvider}
                      onChange={(e) => setPkgProvider(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                    >
                      {POPULAR_GAMES.filter((g) => g !== 'Semua Game').map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                      <option value="Lainnya">Game Lainnya...</option>
                    </select>
                  ) : pkgCategory === 'wifi' ? (
                    <select
                      value={pkgProvider}
                      onChange={(e) => setPkgProvider(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                    >
                      {POPULAR_WIFI_PROVIDERS.filter((w) => w !== 'Semua Wifi').map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                      <option value="Lainnya">Provider Wifi Lainnya...</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={pkgProvider}
                      onChange={(e) => setPkgProvider(e.target.value)}
                      placeholder="Telkomsel, Indosat, PLN Pascabayar, dll."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Harga Beli / HPP (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    min="0"
                    value={pkgHpp}
                    onChange={(e) => setPkgHpp(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-right font-semibold focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    required
                    step="any"
                    min="0"
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-emerald-300 rounded-lg font-mono text-right font-bold text-emerald-800 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Profit Preview */}
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                <span className="text-emerald-900 font-medium">Estimasi Laba per Transaksi:</span>
                <span className="font-mono font-extrabold text-emerald-800 text-sm">
                  +Rp {(pkgPrice - pkgHpp).toLocaleString('id-ID')}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Keterangan / Deskripsi (Opsional)
                </label>
                <input
                  type="text"
                  value={pkgDesc}
                  onChange={(e) => setPkgDesc(e.target.value)}
                  placeholder="Contoh: Top up via User ID & Server / 24 Jam"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPackageModalMode(null)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {packageModalMode === 'edit' ? 'Simpan Perubahan' : 'Tambahkan Paket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Paket */}
      {packageToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hapus Paket?</h3>
                <p className="text-xs text-slate-500">Paket akan dihapus dari katalog pilihan</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">{packageToDelete.name}</div>
              <div className="text-slate-500">
                Provider / Game:{' '}
                <span className="font-semibold">{packageToDelete.provider}</span>
              </div>
              <div className="text-slate-500 font-mono">
                Harga Jual: Rp {packageToDelete.price.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPackageToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePPOBPackage(packageToDelete.id);
                  setPackageToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition cursor-pointer"
              >
                Ya, Hapus Paket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Transaksi PPOB */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Edit Data Transaksi PPOB</h3>
                <p className="text-[11px] text-slate-500 font-mono">{editingTransaction.refNo}</p>
              </div>
              <button
                onClick={() => setEditingTransaction(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransactionEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Paket / Item</label>
                <input
                  type="text"
                  disabled
                  value={editingTransaction.packageName}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nomor HP / ID Akun Game *
                </label>
                <input
                  type="text"
                  required
                  value={txTargetNumber}
                  onChange={(e) => setTxTargetNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Pelanggan / Akun</label>
                <input
                  type="text"
                  value={txCustomerName}
                  onChange={(e) => setTxCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Harga Jual (Rp) *</label>
                <input
                  type="number"
                  required
                  value={txSellingPrice}
                  onChange={(e) => setTxSellingPrice(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-right font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Transaksi */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hapus Riwayat Transaksi?</h3>
                <p className="text-xs text-slate-500">
                  Data transaksi ini akan dihapus dari riwayat PPOB
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-mono text-slate-400 text-[10px]">{txToDelete.refNo}</div>
              <div className="font-bold text-slate-800">{txToDelete.packageName}</div>
              <div className="text-slate-600 font-mono">Tujuan: {txToDelete.targetNumber}</div>
              <div className="text-slate-600 font-mono">
                Total: Rp {txToDelete.sellingPrice.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePPOBTransaction(txToDelete.id);
                  setTxToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition cursor-pointer"
              >
                Ya, Hapus Transaksi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Pembayaran PPOB Interaktif (Tunai, QRIS, Kasbon/Hutang)            */}
      {/* ========================================================================= */}
      {selectedPackageForCheckout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-teal-700 to-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="text-sm font-extrabold">Pembayaran & Proses Transaksi PPOB</h3>
                  <p className="text-[10px] text-emerald-100">Ju-Fat Cell · Konter Pulsa, Data & Game</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPackageForCheckout(null)}
                className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
              {/* Product and Destination Summary */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {selectedPackageForCheckout.provider} · {selectedPackageForCheckout.category.toUpperCase()}
                  </span>
                  <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full font-mono">
                    Laba +Rp {(selectedPackageForCheckout.price - selectedPackageForCheckout.hpp).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="font-extrabold text-sm text-slate-900">
                  {selectedPackageForCheckout.name}
                </div>
                <div className="text-slate-600 font-mono text-xs flex items-center gap-1">
                  <span>Tujuan:</span>
                  <span className="font-bold text-teal-900">
                    {category === 'game'
                      ? gameZoneId.trim()
                        ? `${gameUserId.trim()} (${gameZoneId.trim()})`
                        : gameUserId.trim()
                      : phoneNumber.trim()}
                  </span>
                  {customerName.trim() && (
                    <span className="text-slate-500 text-[11px]">({customerName.trim()})</span>
                  )}
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between items-baseline">
                  <span className="font-bold text-slate-800">Total Tagihan:</span>
                  <div className="text-right">
                    {ppobDiscount > 0 && (
                      <span className="text-[11px] text-slate-400 line-through font-mono block">
                        Rp {selectedPackageForCheckout.price.toLocaleString('id-ID')}
                      </span>
                    )}
                    <span className={`text-lg font-black font-mono ${finalPPOBPrice === 0 ? 'text-amber-600' : 'text-emerald-800'}`}>
                      {finalPPOBPrice === 0 ? 'Rp 0 (GRATIS OWNER)' : `Rp ${finalPPOBPrice.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                </div>

                {/* DISKON TRANSAKSI PPOB */}
                <div className="mt-1.5 pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 font-bold text-slate-700">
                      <Tag className="w-3.5 h-3.5 text-teal-600" />
                      <span>Diskon / Potongan Harga:</span>
                      {isOwner && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1 py-0.2 rounded font-black">
                          👑 Owner (Bisa Rp 0)
                        </span>
                      )}
                    </div>
                    {ppobDiscount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPpobDiscount(0);
                          setPpobCashReceived(selectedPackageForCheckout.price);
                        }}
                        className="text-[10px] text-rose-600 underline cursor-pointer"
                      >
                        Reset Diskon
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
                        onClick={() => {
                          setPpobDiscount(p.val);
                          setPpobCashReceived(Math.max(0, selectedPackageForCheckout.price - p.val));
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                          ppobDiscount === p.val
                            ? 'bg-teal-600 text-white border-teal-600 font-black'
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
                          setPpobDiscount(selectedPackageForCheckout.price);
                          setPpobCashReceived(0);
                        } else {
                          alert('Diskon 100% (Bayar Rp 0) hanya diizinkan untuk OWNER yang sedang bertugas!');
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-black border transition cursor-pointer flex items-center gap-1 ${
                        ppobDiscount === selectedPackageForCheckout.price
                          ? 'bg-amber-400 text-slate-950 border-amber-400 font-black'
                          : isOwner
                          ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                          : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                      }`}
                    >
                      <span>👑 100% (Rp 0)</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="text-[11px] text-slate-500">Nominal Diskon Manual:</span>
                    <div className="flex items-center gap-1 font-mono">
                      <span className="text-slate-400 font-bold">Rp</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={ppobDiscount || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          if (!isOwner && val >= selectedPackageForCheckout.price) {
                            alert('Hanya OWNER yang dapat menetapkan pembayaran PPOB Rp 0!');
                            setPpobDiscount(Math.max(0, selectedPackageForCheckout.price - 500));
                            setPpobCashReceived(500);
                            return;
                          }
                          setPpobDiscount(val);
                          setPpobCashReceived(Math.max(0, selectedPackageForCheckout.price - val));
                        }}
                        placeholder="0"
                        className="w-24 text-right px-2 py-0.5 bg-white border border-slate-300 rounded font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Pilih Metode Pembayaran:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'tunai', label: 'Tunai', icon: Banknote },
                    { id: 'qris', label: 'QRIS', icon: QrCode },
                    { id: 'hutang', label: 'Kasbon', icon: Receipt },
                  ].map((m) => {
                    const Icon = m.icon;
                    const active = ppobPaymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPpobPaymentMethod(m.id as any);
                          if (m.id === 'tunai' && ppobCashReceived === 0) {
                            setPpobCashReceived(finalPPOBPrice);
                          }
                        }}
                        className={`py-2 px-1 text-xs font-bold rounded-xl flex flex-col items-center gap-1 transition cursor-pointer border ${
                          active
                            ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-600 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detail Pembayaran Tunai */}
              {ppobPaymentMethod === 'tunai' && (
                <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl space-y-2 text-emerald-950">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-700" />
                      <span>Uang Fisik Diterima Kasir:</span>
                    </span>
                    <span className="text-[11px] font-mono font-bold text-emerald-900">
                      Tagihan: Rp {finalPPOBPrice.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={ppobCashReceived || ''}
                      onChange={(e) => setPpobCashReceived(Number(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-1.5 text-sm font-mono font-black bg-white border border-emerald-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder={finalPPOBPrice.toString()}
                    />
                  </div>

                  {/* Quick cash buttons */}
                  <div className="flex items-center gap-1 overflow-x-auto pt-0.5">
                    <button
                      type="button"
                      onClick={() => setPpobCashReceived(finalPPOBPrice)}
                      className="px-2 py-0.5 text-[10px] font-bold bg-emerald-200 hover:bg-emerald-300 text-emerald-950 rounded transition cursor-pointer"
                    >
                      Uang Pas
                    </button>
                    {[20000, 50000, 100000, 200000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setPpobCashReceived(amt)}
                        className="px-2 py-0.5 text-[10px] font-mono font-bold bg-white border border-emerald-300 text-emerald-800 rounded hover:bg-emerald-100 transition cursor-pointer shrink-0"
                      >
                        Rp {amt.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>

                  {/* Kembalian */}
                  <div className="flex items-center justify-between pt-1 border-t border-emerald-200 text-xs">
                    <span className="font-bold text-slate-700">Uang Kembalian:</span>
                    <span
                      className={`font-mono font-black text-sm ${
                        ppobCashReceived >= finalPPOBPrice
                          ? 'text-emerald-800'
                          : 'text-rose-600'
                      }`}
                    >
                      {ppobCashReceived >= finalPPOBPrice
                        ? `Rp ${(ppobCashReceived - finalPPOBPrice).toLocaleString('id-ID')}`
                        : `Kurang Rp ${(finalPPOBPrice - ppobCashReceived).toLocaleString('id-ID')}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Detail Pembayaran QRIS */}
              {ppobPaymentMethod === 'qris' && (
                <div className="p-3 bg-sky-50 border-2 border-sky-300 rounded-xl space-y-1.5 text-sky-950">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-sky-600" />
                      <span>QRIS Ju-Fat Cell</span>
                    </span>
                    <span className="text-[10px] bg-sky-200 text-sky-800 px-1.5 py-0.5 rounded font-mono">
                      ID10202688190
                    </span>
                  </div>
                  <p className="text-xs text-sky-900">
                    Minta pembeli scan kode QRIS sebesar <span className="font-bold font-mono">Rp {finalPPOBPrice.toLocaleString('id-ID')}</span>.
                  </p>
                  <p className="text-[10px] text-sky-700">
                    💡 Saldo masuk ke rekening QRIS toko, saldo kas laci tetap aman.
                  </p>
                </div>
              )}

              {/* Detail Pembayaran Kasbon (Hutang) */}
              {ppobPaymentMethod === 'hutang' && (
                <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-xl space-y-2.5 text-amber-950">
                  <div className="flex items-center justify-between font-bold text-xs text-amber-900 pb-1.5 border-b border-amber-200">
                    <div className="flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-amber-600" />
                      <span>Data Kasbon Pelanggan (Masuk Buku Hutang)</span>
                    </div>
                    <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Nama Wajib Diisi *
                    </span>
                  </div>

                  {/* Input Nama Pelanggan yang Berhutang / Kasbon */}
                  <div>
                    <label className="text-[11px] font-extrabold text-amber-950 flex items-center justify-between mb-1">
                      <span>Nama Orang / Pelanggan yang Kasbon *</span>
                      <span className="text-[10px] text-amber-800 font-semibold">Tersimpan di Buku Hutang</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={ppobDebtorName}
                      onChange={(e) => {
                        setPpobDebtorName(e.target.value);
                        if (ppobKasbonError) setPpobKasbonError(null);
                      }}
                      placeholder="Ketik nama orang yang berhutang (cth: Pak Sugeng, Mas Budi, Bu Erni)..."
                      className={`w-full px-3 py-2 text-xs bg-white border-2 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs ${
                        ppobKasbonError ? 'border-rose-500 bg-rose-50/50 animate-pulse' : 'border-amber-400'
                      }`}
                    />
                    {ppobKasbonError && (
                      <p className="text-[10px] font-bold text-rose-600 mt-1">
                        ⚠️ {ppobKasbonError}
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
                        value={ppobDueDate}
                        onChange={(e) => setPpobDueDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
                        No. WA / HP:
                      </label>
                      <input
                        type="text"
                        value={ppobCustomerPhone}
                        onChange={(e) => setPpobCustomerPhone(e.target.value)}
                        placeholder={phoneNumber.trim() || '08...'}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
                      Catatan Kasbon (Opsional):
                    </label>
                    <input
                      type="text"
                      value={ppobNote}
                      onChange={(e) => setPpobNote(e.target.value)}
                      placeholder="Cth: Nanti sore dibayar / tetangga sebelah"
                      className="w-full px-2.5 py-1 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="p-2 bg-amber-100/90 rounded-lg text-[11px] text-amber-950 font-medium border border-amber-300 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>
                      Dicatat sebesar <strong className="font-mono font-bold">Rp {finalPPOBPrice.toLocaleString('id-ID')}</strong> di Buku Hutang atas nama:{' '}
                      <strong className="underline font-bold text-amber-950">
                        {ppobDebtorName.trim() || customerName.trim() || '(Ketik nama di atas)'}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedPackageForCheckout(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                className={`flex-2 py-2.5 px-4 font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                  finalPPOBPrice === 0 && isOwner
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 ring-2 ring-amber-400/50 hover:brightness-105'
                    : 'bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-500 hover:to-emerald-500 text-white'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-amber-300" />
                <span>
                  {finalPPOBPrice === 0 && isOwner
                    ? '🎁 Bayar Rp 0 & Proses (Owner Gratis)'
                    : 'Konfirmasi & Proses Transaksi'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
