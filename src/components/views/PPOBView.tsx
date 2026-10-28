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

export const PPOBView: React.FC = () => {
  const {
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

  const [category, setCategory] = useState<PPOBCategory>('pulsa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('Telkomsel');

  // Game specific state
  const [selectedGame, setSelectedGame] = useState<string>('Mobile Legends');
  const [gameUserId, setGameUserId] = useState('');
  const [gameZoneId, setGameZoneId] = useState('');
  const [gameSearchQuery, setGameSearchQuery] = useState('');

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
  const [ppobCustomerPhone, setPpobCustomerPhone] = useState('');
  const [ppobDueDate, setPpobDueDate] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [ppobNote, setPpobNote] = useState('');

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
            ? 'Nomor Meteran / ID Pelanggan PLN wajib diisi!'
            : 'Nomor HP Pelanggan wajib diisi!'
        );
        return;
      }
    }

    setSelectedPackageForCheckout(pkg);
    setPpobCashReceived(pkg.price);
    setPpobPaymentMethod('tunai');
    setPpobCustomerPhone(phoneNumber.trim() || '');
    setPpobNote('');
  };

  const handleConfirmPurchase = () => {
    if (!selectedPackageForCheckout) return;
    const pkg = selectedPackageForCheckout;
    let target = phoneNumber.trim();
    if (category === 'game') {
      target = gameZoneId.trim()
        ? `${gameUserId.trim()} (${gameZoneId.trim()})`
        : gameUserId.trim();
    }

    const tx = recordPPOBTransaction(
      category,
      category === 'pln' ? 'PLN Prepaid' : pkg.provider,
      target,
      pkg.name,
      pkg.hpp,
      pkg.price,
      customerName.trim() || (category === 'game' ? 'Player Game' : 'Pelanggan PPOB'),
      ppobPaymentMethod,
      ppobCustomerPhone.trim() || target,
      ppobDueDate,
      ppobNote.trim() || undefined
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
      `Pembelian ${pkg.name} untuk ${target} (${methodLabel}) berhasil diproses!`
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
      setPkgDesc('Token listrik PLN');
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
            className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'buy'
                ? 'bg-white text-teal-900 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-teal-600" />
            <span>Pilih Paket & Isi</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('history')}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'history'
                ? 'bg-white text-teal-900 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
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
                { id: 'data', label: 'Paket Data / Kuota', icon: Wifi },
                { id: 'pln', label: 'Token Listrik PLN', icon: Zap },
                { id: 'game', label: 'Top Up Game & Voucher', icon: Gamepad2, highlight: true },
                { id: 'bpjs', label: 'BPJS & Tagihan', icon: HeartPulse },
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
                        ? c.highlight
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm font-extrabold ring-2 ring-violet-300'
                          : 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm font-bold ring-2 ring-teal-300'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 font-medium'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${c.highlight && !active ? 'text-violet-600' : ''}`} />
                    <span>{c.label}</span>
                    {c.highlight && !active && (
                      <span className="bg-amber-100 text-amber-900 text-[9px] px-1.5 py-0.2 rounded-full font-extrabold uppercase">
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
              title="Geser menu ke kanan (Game, BPJS, PDAM)"
              aria-label="Geser menu ke kanan"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* DYNAMIC FORM: When Game is Selected vs Pulsa/PLN */}
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
          ) : (
            /* Standard Phone / Meteran Input for Pulsa, Data, PLN, etc. */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  {category === 'pln' ? 'Nomor Meteran / ID Pelanggan PLN' : 'Nomor HP Pelanggan'}
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
                    <option value="PLN">PLN Prepaid Listrik</option>
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
                : `Katalog Paket ${category === 'pln' ? 'PLN' : selectedProvider}`}
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
                return (
                  <div
                    key={pkg.id}
                    className={`bg-white border rounded-xl p-3.5 transition flex flex-col justify-between group relative ${
                      isGame
                        ? 'border-violet-100 hover:border-violet-400 hover:shadow-md'
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
                            isGame ? 'text-violet-900' : 'text-emerald-800'
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
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500'
                            : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500'
                        }`}
                      >
                        <span>{isGame ? 'Top Up' : 'Beli'}</span>
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
              return (
                <div
                  key={tx.id}
                  className={`bg-white p-3 rounded-lg border shadow-xs space-y-1.5 text-xs group transition ${
                    isGameTx ? 'border-violet-200 hover:border-violet-400' : 'border-slate-200/80 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0 pr-1">
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase shrink-0 ${
                          isGameTx
                            ? 'bg-violet-100 text-violet-800 border border-violet-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tx.category === 'game' ? 'GAME' : tx.category}
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
                      if (newCat === 'pln') setPkgProvider('PLN');
                      if (newCat === 'pulsa' || newCat === 'data') setPkgProvider('Telkomsel');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  >
                    <option value="game">🎮 Top Up & Voucher Game</option>
                    <option value="pulsa">📱 Pulsa Reguler</option>
                    <option value="data">🌐 Paket Data / Kuota</option>
                    <option value="pln">⚡ Token Listrik PLN</option>
                    <option value="bpjs">🏥 BPJS Kesehatan</option>
                    <option value="pdam">💧 PDAM Air</option>
                    <option value="tagihan">🧾 Tagihan Bulanan</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {pkgCategory === 'game' ? 'Nama Game / Voucher' : 'Operator / Provider'}
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
                  ) : (
                    <input
                      type="text"
                      required
                      value={pkgProvider}
                      onChange={(e) => setPkgProvider(e.target.value)}
                      placeholder="Telkomsel, Indosat, PLN, dll."
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
                    step="100"
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
                    step="100"
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
                  <span className="text-lg font-black font-mono text-emerald-800">
                    Rp {selectedPackageForCheckout.price.toLocaleString('id-ID')}
                  </span>
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
                            setPpobCashReceived(selectedPackageForCheckout.price);
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
                      Tagihan: Rp {selectedPackageForCheckout.price.toLocaleString('id-ID')}
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
                      placeholder={selectedPackageForCheckout.price.toString()}
                    />
                  </div>

                  {/* Quick cash buttons */}
                  <div className="flex items-center gap-1 overflow-x-auto pt-0.5">
                    <button
                      type="button"
                      onClick={() => setPpobCashReceived(selectedPackageForCheckout.price)}
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
                        ppobCashReceived >= selectedPackageForCheckout.price
                          ? 'text-emerald-800'
                          : 'text-rose-600'
                      }`}
                    >
                      {ppobCashReceived >= selectedPackageForCheckout.price
                        ? `Rp ${(ppobCashReceived - selectedPackageForCheckout.price).toLocaleString('id-ID')}`
                        : `Kurang Rp ${(selectedPackageForCheckout.price - ppobCashReceived).toLocaleString('id-ID')}`}
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
                    Minta pembeli scan kode QRIS sebesar <span className="font-bold font-mono">Rp {selectedPackageForCheckout.price.toLocaleString('id-ID')}</span>.
                  </p>
                  <p className="text-[10px] text-sky-700">
                    💡 Saldo masuk ke rekening QRIS toko, saldo kas laci tetap aman.
                  </p>
                </div>
              )}

              {/* Detail Pembayaran Kasbon (Hutang) */}
              {ppobPaymentMethod === 'hutang' && (
                <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-2 text-amber-950">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                    <Receipt className="w-4 h-4 text-amber-600" />
                    <span>Data Kasbon Pelanggan (Masuk Buku Hutang)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
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
                    <div>
                      <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
                        Jatuh Tempo:
                      </label>
                      <input
                        type="date"
                        value={ppobDueDate}
                        onChange={(e) => setPpobDueDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                  <p className="text-[11px] text-amber-800">
                    ⚡ Total tagihan <span className="font-bold">Rp {selectedPackageForCheckout.price.toLocaleString('id-ID')}</span> akan otomatis masuk ke menu <span className="font-bold">Hutang & Retur</span> atas nama <span className="underline font-bold">{customerName.trim() || 'Pelanggan PPOB'}</span>.
                  </p>
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
                className="flex-2 py-2.5 px-4 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <CheckCircle className="w-4 h-4 text-amber-300" />
                <span>Konfirmasi & Proses Transaksi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
