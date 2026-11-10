import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  CreditCard,
  QrCode,
  Banknote,
  Receipt,
  AlertTriangle,
  User,
  Percent,
  X,
  Package,
  LayoutGrid,
  List,
  Barcode,
  ArrowLeft,
  ChevronRight,
  Printer,
  History,
  Sparkles,
  Crown,
  Gift,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { ProductCategory, PaymentMethod, Product } from '../../types/pos';

export const KasirView: React.FC = () => {
  const {
    products,
    categories,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartTotalCount,
    checkoutPOS,
    transactions,
    openReceipt,
    drawerCashBalance,
    shift,
    setIsMasterCartModalOpen,
  } = usePOS();

  const hasMultiMenuItems = cart.some((c) => c.itemType && c.itemType !== 'produk');

  const isOwner = shift.cashierSlot === 'owner' || shift.role === 'owner';

  const allCategories: ProductCategory[] = ['Semua', ...categories];
  const [selectedCat, setSelectedCat] = useState<ProductCategory>('Semua');
  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanFeedback, setScanFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [customerName, setCustomerName] = useState('Pelanggan Umum');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [customerPhone, setCustomerPhone] = useState('');
  const [debtDueDate, setDebtDueDate] = useState(() => {
    return new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  });
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [checkoutNote, setCheckoutNote] = useState('');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Audio beep feedback for barcode scanner
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // Audio autoplay restrictions fallback
    }
  };

  // Barcode / SKU Auto-Add Handler
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = barcodeInput.trim();
    if (!cleanCode) return;

    // Search for product with exact SKU or barcode match (case-insensitive)
    const foundProduct = products.find(
      (p) =>
        p.sku.toLowerCase() === cleanCode.toLowerCase() ||
        (p.barcode && p.barcode.toLowerCase() === cleanCode.toLowerCase())
    );

    if (foundProduct) {
      if (foundProduct.stock <= 0) {
        setScanFeedback({
          message: `Stok produk "${foundProduct.name}" habis (0 ${foundProduct.unit})!`,
          type: 'error',
        });
      } else {
        addToCart(foundProduct);
        playBeep();
        const remainingAfter = foundProduct.stock - 1;
        const isNearOut = remainingAfter <= foundProduct.minStock;
        setScanFeedback({
          message: isNearOut
            ? `"${foundProduct.name}" masuk keranjang! (⚠️ Peringatan: Sisa ${remainingAfter} ${foundProduct.unit}, stok menipis!)`
            : `"${foundProduct.name}" (${foundProduct.sku}) otomatis masuk keranjang!`,
          type: 'success',
        });
      }
    } else {
      setScanFeedback({
        message: `Produk dengan SKU / Barcode "${cleanCode}" tidak ditemukan di database!`,
        type: 'error',
      });
    }

    setBarcodeInput('');
    // Keep focus for rapid continuous scanning
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 40);
  };

  // Keyboard shortcut F2 to quickly focus the barcode scanner
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCat === 'Semua' || p.category === selectedCat;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    return matchesCat && matchesSearch;
  });

  const taxAmount = Math.round((cartSubtotal - discountAmount) * (taxPercent / 100));
  const finalTotal = Math.max(0, cartSubtotal - discountAmount + taxAmount);
  const changeAmount = paymentMethod === 'tunai' ? Math.max(0, cashTendered - finalTotal) : 0;
  const isCashInsufficient = paymentMethod === 'tunai' && cashTendered < finalTotal;

  // Handle Quick Payment preset
  const setQuickCash = (amount: number) => {
    setCashTendered(amount);
    setCheckoutError(null);
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setCheckoutError(null);

    // Validasi Pembayaran Rp 0 (Khusus yang jaga Owner)
    if (finalTotal === 0 && !isOwner) {
      setCheckoutError('Pembayaran Rp 0 (Diskon 100% / Gratis) hanya diizinkan untuk shift Owner! Silakan ganti ke shift Owner.');
      return;
    }

    // Validasi Pembayaran Uang Tunai / Bayar Sebagian (Sisa Kasbon)
    const isPartial = paymentMethod === 'tunai' && cashTendered > 0 && cashTendered < finalTotal;

    if (paymentMethod === 'tunai' && cashTendered === 0 && finalTotal > 0) {
      setCheckoutError('Uang tunai diterima Rp 0! Ketik nominal uang yang dibayar, atau pilih metode "Kasbon" jika belum bayar sama sekali.');
      return;
    }

    // Validasi Kasbon / Hutang & Bayar Sebagian
    let resolvedCustomerName = customerName.trim();
    if (paymentMethod === 'hutang' || isPartial) {
      // Jika nama masih default 'Pelanggan Umum' atau kosong, tetapi user pernah mengetik di No HP/Catatan (misal "Kk erni"), gunakan itu!
      if ((!resolvedCustomerName || resolvedCustomerName.toLowerCase() === 'pelanggan umum') && customerPhone.trim()) {
        resolvedCustomerName = customerPhone.trim();
        setCustomerName(resolvedCustomerName);
      }

      if (!resolvedCustomerName || resolvedCustomerName.toLowerCase() === 'pelanggan umum') {
        setCheckoutError(
          isPartial
            ? 'Untuk Bayar Sebagian (Sisa Kasbon), silakan ketik Nama Pelanggan agar tersimpan jelas di Buku Hutang!'
            : 'Untuk Kasbon, silakan ketik Nama Pelanggan pada kolom yang tersedia!'
        );
        return;
      }
    }

    const finalName = resolvedCustomerName || 'Pelanggan Umum';

    checkoutPOS(
      paymentMethod,
      cashTendered,
      finalName,
      discountAmount,
      taxPercent,
      checkoutNote,
      customerPhone,
      debtDueDate,
      isPartial,
      isPartial ? cashTendered : undefined
    );

    // Reset checkout form
    setCustomerName('Pelanggan Umum');
    setDiscountAmount(0);
    setTaxPercent(0);
    setCashTendered(0);
    setCheckoutNote('');
    setCustomerPhone('');
    setCheckoutError(null);
    setIsMobileCartOpen(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Left Column: Product Selection Grid */}
      <div className="flex-1 flex flex-col h-full bg-[#f8fafc] md:border-r border-slate-200 min-w-0">
        {/* Rapid Barcode Scanner Bar at the Top */}
        <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 p-3 text-white shadow-sm border-b border-teal-500/30">
          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-teal-100 pointer-events-none">
                <Barcode className="w-4 h-4" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider hidden sm:inline">
                  Barcode / SKU:
                </span>
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode USB/Bluetooth atau ketik SKU (cth: ACC-TC-IP18W) lalu Enter..."
                className="w-full pl-8 sm:pl-36 pr-8 py-2 text-xs bg-white/20 hover:bg-white/25 focus:bg-white focus:text-slate-900 text-white placeholder-teal-100/80 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 font-mono transition"
              />
              {barcodeInput && (
                <button
                  type="button"
                  onClick={() => setBarcodeInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-teal-100 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-extrabold rounded-xl transition shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
              title="Tambahkan otomatis ke keranjang"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Scan / Tambah</span>
            </button>

            <button
              type="button"
              onClick={() => barcodeInputRef.current?.focus()}
              className="px-2.5 py-2 bg-teal-800/60 hover:bg-teal-800 text-teal-100 border border-teal-300/40 text-[10px] font-mono font-bold rounded-xl transition shrink-0 cursor-pointer hidden md:flex items-center gap-1"
              title="Shortcut keyboard: Tekan F2 untuk langsung fokus ke scanner"
            >
              <span>F2</span>
            </button>
          </form>

          {/* Instant Scan Feedback Toast */}
          {scanFeedback && (
            <div
              className={`mt-2 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                scanFeedback.type === 'success'
                  ? 'bg-white/20 text-white border border-white/40 shadow-xs'
                  : 'bg-rose-500/90 text-white border border-rose-400 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2">
                {scanFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-amber-300 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-300 shrink-0" />
                )}
                <span>{scanFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setScanFeedback(null)}
                className="text-xs hover:opacity-75 cursor-pointer ml-2 px-1 text-white/80"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 bg-white border-b border-slate-200 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk berdasarkan nama, kode SKU, atau scan barcode..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle (Grid vs List - both without photos) */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-teal-800 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Tampilan Kotak Kompak (Tanpa Foto)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md text-xs transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-teal-800 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Tampilan Baris Padat (Tanpa Foto)"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Reprint Thermal Receipt Button */}
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 hover:border-teal-300 transition cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Cetak Ulang Struk Penjualan Terakhir (58mm / 80mm)"
            >
              <Printer className="w-4 h-4 text-teal-600" />
              <span className="hidden sm:inline">Cetak Ulang Struk</span>
            </button>

            {/* Mobile Cart Trigger Button */}
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="md:hidden relative p-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl shadow-xs shrink-0 flex items-center justify-center cursor-pointer active:scale-95"
              title="Buka Keranjang Belanja"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartTotalCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-amber-950 text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartTotalCount}
                </span>
              )}
            </button>

            <div className="hidden sm:block text-xs text-teal-900 font-mono font-bold tabular-nums shrink-0 bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded-lg">
              {filteredProducts.length} Produk
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {allCategories.map((cat) => {
              const active = selectedCat === cat;
              const count =
                cat === 'Semua'
                  ? products.length
                  : products.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                    active
                      ? 'bg-gradient-to-r from-teal-700 to-emerald-700 text-white shadow-sm ring-1 ring-teal-600 font-extrabold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/60 font-semibold'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Listing (No Photos - Space Efficient) */}
        <div className="flex-1 overflow-y-auto p-3.5">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Package className="w-12 h-12 stroke-[1.5] text-slate-300" />
              <p className="text-sm font-medium">Tidak ada produk ditemukan</p>
              <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau kategori</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Compact Grid View without Photos */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {filteredProducts.map((p) => {
                const inCart = cart.find((c) => c.product.id === p.id);
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock > 0 && p.stock <= p.minStock;

                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`bg-white rounded-xl border border-slate-200/90 p-3 flex flex-col justify-between transition-all group relative cursor-pointer select-none hover:shadow-md hover:border-emerald-500 hover:bg-emerald-50/10 ${
                      isOutOfStock
                        ? 'opacity-55 cursor-not-allowed bg-slate-50'
                        : inCart
                        ? 'ring-1.5 ring-emerald-600 bg-emerald-50/20 shadow-xs'
                        : ''
                    }`}
                  >
                    <div>
                      {/* Top category & stock badge */}
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight truncate max-w-[90px] bg-slate-100 px-1.5 py-0.5 rounded">
                          {p.category}
                        </span>

                        {isOutOfStock ? (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-red-100 text-red-700">
                            Habis
                          </span>
                        ) : isLowStock ? (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-100 text-amber-800">
                            Sisa {p.stock}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-emerald-100/70 text-emerald-800 font-mono">
                            {p.stock} {p.unit}
                          </span>
                        )}
                      </div>

                      {/* Product Name */}
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-emerald-950 transition">
                        {p.name}
                      </h4>

                      {/* SKU / Barcode */}
                      <div className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                        {p.sku} {p.barcode ? `· ${p.barcode}` : ''}
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      <div>
                        <div className="text-xs font-extrabold text-emerald-800 font-mono tabular-nums">
                          Rp {p.price.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">
                          Margin +Rp {(p.price - p.hpp).toLocaleString('id-ID')}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {inCart && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-md shadow-xs">
                            {inCart.quantity}x
                          </span>
                        )}
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isOutOfStock) addToCart(p);
                          }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                            isOutOfStock
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs active:scale-95'
                          }`}
                          title="Tambah ke keranjang"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Row / List View without Photos (Ultra-dense) */
            <div className="space-y-1.5">
              {filteredProducts.map((p) => {
                const inCart = cart.find((c) => c.product.id === p.id);
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock > 0 && p.stock <= p.minStock;

                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`bg-white rounded-lg border border-slate-200/90 px-3 py-2 flex items-center justify-between gap-3 transition-all cursor-pointer hover:shadow-xs hover:border-emerald-500 hover:bg-emerald-50/20 select-none ${
                      isOutOfStock
                        ? 'opacity-55 cursor-not-allowed bg-slate-50'
                        : inCart
                        ? 'ring-1.5 ring-emerald-600 bg-emerald-50/30'
                        : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase px-1.5 py-0.5 bg-slate-100 rounded shrink-0">
                        {p.category}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 hidden sm:inline shrink-0">
                        ({p.sku} {p.barcode ? `· ${p.barcode}` : ''})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        {isOutOfStock ? (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-red-100 text-red-700">
                            Habis
                          </span>
                        ) : isLowStock ? (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-100 text-amber-800">
                            Sisa {p.stock}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500">
                            Stok: {p.stock} {p.unit}
                          </span>
                        )}
                      </div>

                      <div className="w-28 text-right">
                        <span className="text-xs font-bold text-emerald-800 font-mono tabular-nums">
                          Rp {p.price.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {inCart && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded">
                            {inCart.quantity}x
                          </span>
                        )}
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isOutOfStock) addToCart(p);
                          }}
                          className={`w-6 h-6 rounded flex items-center justify-center transition cursor-pointer ${
                            isOutOfStock
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Real-time Cart & Checkout Panel (Desktop) */}
      <div className="hidden md:flex w-96 bg-white flex-col h-full border-l border-slate-200 shadow-sm shrink-0">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">Keranjang Belanja</h3>
                {hasMultiMenuItems && (
                  <button
                    type="button"
                    onClick={() => setIsMasterCartModalOpen(true)}
                    className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-teal-100 text-teal-800 border border-teal-300 rounded cursor-pointer hover:bg-teal-200 transition"
                    title="Lihat & kelola di Keranjang Besar"
                  >
                    Multi-Menu
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                  {cartTotalCount} item terpilih
                </p>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Kas: Rp {drawerCashBalance.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="px-2 py-1 text-slate-600 hover:text-teal-900 hover:bg-teal-50 rounded-lg transition border border-slate-200 hover:border-teal-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Riwayat & Cetak Ulang Struk Kasir"
            >
              <History className="w-3.5 h-3.5 text-teal-600" />
              <span>Struk</span>
            </button>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Customer input */}
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nama Pelanggan (Umum / Langganan)"
            className="w-full text-xs bg-transparent focus:outline-none text-slate-700 font-medium"
          />
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <ShoppingCart className="w-10 h-10 stroke-[1.2] text-slate-300" />
              <p className="text-xs font-medium">Keranjang masih kosong</p>
              <p className="text-[11px] text-slate-400 text-center">
                Klik produk pada katalog di sebelah kiri untuk menambahkan
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const itemKey = item.id || item.product.id;
              const itemType = item.itemType || 'produk';
              const canAdjustQty = itemType === 'produk' || itemType === 'percetakan';
              const maxStock = itemType === 'produk' ? item.product.stock : 9999;
              const badgeLabel =
                itemType === 'ppob'
                  ? 'PPOB'
                  : itemType === 'percetakan'
                  ? 'CETAK'
                  : itemType === 'service'
                  ? 'SERVIS'
                  : itemType === 'atm_mini'
                  ? 'ATM MINI'
                  : null;
              const badgeColor =
                itemType === 'ppob'
                  ? 'bg-sky-100 text-sky-800 border-sky-200'
                  : itemType === 'percetakan'
                  ? 'bg-violet-100 text-violet-800 border-violet-200'
                  : itemType === 'service'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-pink-100 text-pink-800 border-pink-200';
              const subInfo =
                itemType === 'ppob'
                  ? item.metadata?.targetNumber
                    ? `Tujuan: ${item.metadata.targetNumber}`
                    : item.metadata?.provider
                  : itemType === 'percetakan'
                  ? item.metadata?.specNote || `Rp ${item.product.price.toLocaleString('id-ID')} / ${item.metadata?.unit || item.product.unit}`
                  : itemType === 'service'
                  ? `Tiket ${item.metadata?.serviceTicketId || '-'} · ${item.metadata?.customerName || ''}`
                  : itemType === 'atm_mini'
                  ? `Rek/HP: ${item.metadata?.targetAccountOrPhone || item.metadata?.bankName || '-'}`
                  : `Rp ${item.product.price.toLocaleString('id-ID')} / ${item.product.unit || 'pcs'}`;

              return (
                <div
                  key={itemKey}
                  className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/70 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {badgeLabel && (
                        <span className={`px-1 py-0.2 text-[9px] font-black rounded border shrink-0 ${badgeColor}`}>
                          {badgeLabel}
                        </span>
                      )}
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {item.product.name}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums truncate mt-0.5">
                      {subInfo}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {canAdjustQty ? (
                      <div className="flex items-center border border-slate-200 rounded-md bg-white">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(itemKey, item.quantity - 1)}
                          className="p-1 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold font-mono text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(itemKey, item.quantity + 1)}
                          disabled={itemType === 'produk' && item.quantity >= maxStock}
                          className="p-1 hover:bg-slate-100 text-slate-600 transition disabled:opacity-30 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-white border border-slate-200 rounded text-slate-600">
                        {item.quantity}x
                      </span>
                    )}

                    <div className="text-right min-w-[70px]">
                      <span className="text-xs font-bold text-slate-900 font-mono tabular-nums block">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(itemKey)}
                      className="text-slate-400 hover:text-red-500 p-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Calculations & Checkout Form */}
        <form onSubmit={handleCheckout} className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
          {/* Subtotal, Diskon & PPN */}
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal Barang:</span>
              <span className="font-mono tabular-nums font-semibold text-slate-800">
                Rp {cartSubtotal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Sistem Diskon */}
            <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <Percent className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Diskon / Potongan:</span>
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-mono text-xs">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={discountAmount || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setDiscountAmount(val);
                      if (val >= cartSubtotal && isOwner) {
                        setCashTendered(0);
                      }
                    }}
                    placeholder="0"
                    className="w-24 text-right px-2 py-0.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Preset Diskon Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pt-0.5">
                {[
                  { label: '0%', val: 0 },
                  { label: '5%', val: Math.round(cartSubtotal * 0.05) },
                  { label: '10%', val: Math.round(cartSubtotal * 0.1) },
                  { label: '20%', val: Math.round(cartSubtotal * 0.2) },
                  { label: '50%', val: Math.round(cartSubtotal * 0.5) },
                ].map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => {
                      setDiscountAmount(d.val);
                      setCheckoutError(null);
                    }}
                    className={`px-1.5 py-0.5 text-[10px] rounded font-bold transition cursor-pointer shrink-0 ${
                      discountAmount === d.val && d.val > 0
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}

                {/* 👑 Preset 100% / Bayar Rp 0 (Khusus Owner) */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isOwner) {
                      setCheckoutError('Diskon 100% (Bayar Rp 0) hanya diizinkan untuk shift Owner!');
                      return;
                    }
                    setDiscountAmount(cartSubtotal);
                    setCashTendered(0);
                    setCheckoutError(null);
                  }}
                  className={`px-2 py-0.5 text-[10px] rounded font-black transition cursor-pointer shrink-0 flex items-center gap-1 ${
                    finalTotal === 0 && discountAmount >= cartSubtotal
                      ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-500 shadow-xs'
                      : isOwner
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60'
                  }`}
                  title={isOwner ? 'Owner: Bayar Rp 0 / Gratis 100%' : 'Khusus shift Owner'}
                >
                  <span>👑 100% (Rp 0)</span>
                </button>
              </div>
            </div>

            {/* Total Highlight */}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Total Tagihan:</span>
              <span className="text-xl font-extrabold text-emerald-900 font-mono tabular-nums">
                Rp {finalTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1.5 uppercase">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'tunai', label: 'Tunai', icon: Banknote, activeStyle: 'bg-emerald-600 text-white border-emerald-500 shadow-sm' },
                { id: 'qris', label: 'QRIS', icon: QrCode, activeStyle: 'bg-sky-600 text-white border-sky-500 shadow-sm' },
                { id: 'transfer', label: 'Transfer', icon: CreditCard, activeStyle: 'bg-indigo-600 text-white border-indigo-500 shadow-sm' },
                { id: 'hutang', label: 'Kasbon', icon: Receipt, activeStyle: 'bg-amber-600 text-white border-amber-500 shadow-sm' },
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id as PaymentMethod);
                      if (m.id === 'tunai' && cashTendered === 0) {
                        setCashTendered(finalTotal);
                      }
                      if (m.id === 'hutang') {
                        if (customerName === 'Pelanggan Umum') {
                          setCustomerName('');
                        }
                      }
                      setCheckoutError(null);
                    }}
                    className={`py-2 px-1 text-xs font-bold rounded-xl flex flex-col items-center gap-1 transition cursor-pointer border active:scale-95 ${
                      active
                        ? m.activeStyle
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 font-semibold'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* QRIS Guidance */}
          {paymentMethod === 'qris' && (
            <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl space-y-1.5 text-sky-950">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-sky-600" />
                  <span>QRIS Merchant Ju-Fat Cell</span>
                </span>
                <span className="text-[10px] bg-sky-200/70 text-sky-800 px-1.5 py-0.5 rounded font-mono">
                  ID10202688190
                </span>
              </div>
              <p className="text-[11px] text-sky-800">
                Arahkan pelanggan scan kode QRIS toko sebesar <span className="font-bold font-mono">Rp {finalTotal.toLocaleString('id-ID')}</span>.
              </p>
            </div>
          )}

          {/* Kasbon / Hutang Direct Input Fields */}
          {paymentMethod === 'hutang' && (
            <div className="p-3 bg-amber-50/90 border-2 border-amber-300 rounded-xl space-y-2.5 text-amber-950 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 border-b border-amber-200/80 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-extrabold">Data Kasbon Pelanggan</span>
                </div>
                <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-extrabold uppercase">
                  Masuk Buku Hutang
                </span>
              </div>

              {/* Kolom Nama Pelanggan Kasbon (Wajib) */}
              <div>
                <label className="text-[11px] font-extrabold text-amber-950 flex items-center justify-between mb-1">
                  <span>Nama Pelanggan yang Berhutang / Kasbon *</span>
                  <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                    Wajib Diisi
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName === 'Pelanggan Umum' ? '' : customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (checkoutError) setCheckoutError(null);
                  }}
                  placeholder="Ketik nama pelanggan di sini (cth: Kk Erni, Pak RT, Mas Danang)..."
                  className={`w-full px-3 py-2 text-xs bg-white border-2 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs ${
                    checkoutError && (!customerName.trim() || customerName.trim() === 'Pelanggan Umum')
                      ? 'border-rose-500 bg-rose-50/40 animate-pulse'
                      : 'border-amber-400'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
                    Jatuh Tempo Kasbon:
                  </label>
                  <input
                    type="date"
                    value={debtDueDate}
                    onChange={(e) => setDebtDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
                    Catatan / No. HP (Opsional):
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Boleh dikosongkan..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="p-2 bg-amber-100/80 rounded-lg text-[11px] text-amber-950 font-medium border border-amber-200 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>
                  Dicatat sebesar <strong className="font-mono">Rp {finalTotal.toLocaleString('id-ID')}</strong> atas nama:{' '}
                  <strong className="text-amber-950 underline font-bold">
                    {customerName.trim() && customerName.trim() !== 'Pelanggan Umum' ? customerName.trim() : (customerPhone.trim() ? customerPhone.trim() : '(Ketik nama di atas)')}
                  </strong>
                </span>
              </div>
            </div>
          )}

          {/* Cash Tendered & Shortcuts (Only for Tunai) */}
          {paymentMethod === 'tunai' && (
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">Uang Diterima:</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={cashTendered || ''}
                    onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-36 text-right pl-7 pr-2.5 py-1 text-sm bg-white border border-slate-300 rounded font-mono font-bold text-slate-900 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 gap-1.5 text-xs font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setQuickCash(finalTotal)}
                  className="py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-2xs cursor-pointer active:scale-95 text-center font-bold"
                >
                  Uang Pas
                </button>
                {[50000, 100000, 200000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setQuickCash(amt)}
                    className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-200/80 cursor-pointer active:scale-95 text-center font-bold"
                  >
                    {amt >= 1000 ? `${amt / 1000}rb` : amt}
                  </button>
                ))}
              </div>

              {/* Kembalian / Sisa Kasbon Banner */}
              <div
                className={`p-2.5 rounded-xl border text-xs font-mono font-bold ${
                  isCashInsufficient
                    ? cashTendered > 0
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{isCashInsufficient ? (cashTendered > 0 ? 'Sisa Kasbon (Masuk Buku Hutang):' : 'Uang Kurang:') : 'Kembalian:'}</span>
                  <span className="text-sm font-black">
                    Rp{' '}
                    {isCashInsufficient
                      ? (finalTotal - cashTendered).toLocaleString('id-ID')
                      : changeAmount.toLocaleString('id-ID')}
                  </span>
                </div>
                {isCashInsufficient && cashTendered > 0 && (
                  <p className="text-[10px] font-sans font-medium text-amber-800 mt-1 pt-1 border-t border-amber-200">
                    💡 <strong>Bayar Sebagian Aktif:</strong> Uang Rp {cashTendered.toLocaleString('id-ID')} masuk ke laci, sisa Rp {(finalTotal - cashTendered).toLocaleString('id-ID')} otomatis dicatat ke Buku Kasbon atas nama {customerName || 'pelanggan'}.
                  </p>
                )}
              </div>

              {/* Tampilkan kolom input Nama & Jatuh Tempo jika bayar sebagian dan nama masih Pelanggan Umum */}
              {isCashInsufficient && cashTendered > 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                  <div>
                    <label className="text-[10px] font-extrabold text-amber-950 flex items-center justify-between mb-0.5">
                      <span>Nama Pelanggan yang Kasbon Sisa: *</span>
                      <span className="text-[9px] text-rose-600 font-bold bg-rose-50 px-1 rounded border border-rose-200">
                        Wajib Diisi
                      </span>
                    </label>
                    <input
                      type="text"
                      value={customerName === 'Pelanggan Umum' ? '' : customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (checkoutError) setCheckoutError(null);
                      }}
                      placeholder="Ketik nama pelanggan berhutang..."
                      className="w-full px-2.5 py-1 text-xs bg-white border border-amber-400 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="font-bold text-amber-900 block mb-0.5">Jatuh Tempo:</span>
                      <input
                        type="date"
                        value={debtDueDate}
                        onChange={(e) => setDebtDueDate(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-amber-900 block mb-0.5">No. HP / WA:</span>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Opsional..."
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation Error Banner */}
          {checkoutError && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{checkoutError}</span>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutError(null)}
                className="text-rose-500 hover:text-rose-700 ml-1 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Submit Checkout Button */}
          <button
            type="submit"
            disabled={cart.length === 0 || (paymentMethod === 'tunai' && cashTendered === 0 && finalTotal > 0) || (finalTotal === 0 && !isOwner)}
            className={`w-full py-3.5 px-4 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition duration-150 cursor-pointer ${
              cart.length === 0 || (paymentMethod === 'tunai' && cashTendered === 0 && finalTotal > 0) || (finalTotal === 0 && !isOwner)
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : finalTotal === 0 && isOwner
                ? 'bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 hover:brightness-110 text-white ring-2 ring-amber-300 shadow-amber-950/20 active:scale-[0.99]'
                : isCashInsufficient && cashTendered > 0
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-900/20 active:scale-[0.99]'
                : 'bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-900/20 active:scale-[0.99]'
            }`}
          >
            {finalTotal === 0 && isOwner ? (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>🎁 Bayar Rp 0 & Cetak Struk (Owner Gratis)</span>
              </>
            ) : finalTotal === 0 && !isOwner ? (
              <span>Bayar Rp 0 Khusus Owner (Ganti Shift)</span>
            ) : isCashInsufficient && cashTendered > 0 ? (
              <>
                <Receipt className="w-4 h-4 text-amber-200" />
                <span>Bayar Rp {cashTendered.toLocaleString('id-ID')} & Sisa Kasbon Rp {(finalTotal - cashTendered).toLocaleString('id-ID')}</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-amber-300" />
                <span>Bayar & Cetak Struk (Rp {finalTotal.toLocaleString('id-ID')})</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Mobile Full-Screen Cart & Checkout Drawer */}
      {isMobileCartOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white flex flex-col h-full animate-in slide-in-from-bottom duration-200 select-none">
          {/* Mobile Cart Header */}
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 text-white shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(false)}
              className="p-1.5 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white transition cursor-pointer flex items-center gap-1.5 font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
            <div className="text-center">
              <h3 className="text-sm font-extrabold text-white leading-tight">Keranjang & Bayar</h3>
              <p className="text-[11px] text-teal-100 font-mono">{cartTotalCount} item terpilih</p>
            </div>
            {cart.length > 0 ? (
              <button
                onClick={clearCart}
                className="text-xs text-rose-200 hover:text-white font-semibold flex items-center gap-1 cursor-pointer bg-rose-600/60 px-2 py-1 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            ) : (
              <div className="w-12"></div>
            )}
          </div>

          {/* Customer input */}
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50 shrink-0">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nama Pelanggan (Umum / Langganan)"
              className="w-full text-xs bg-transparent focus:outline-none text-slate-700 font-medium"
            />
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
            {cart.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <ShoppingCart className="w-10 h-10 stroke-[1.2] text-slate-300" />
                <p className="text-xs font-medium">Keranjang belanja kosong</p>
                <button
                  type="button"
                  onClick={() => setIsMobileCartOpen(false)}
                  className="mt-2 text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  Pilih produk dari katalog
                </button>
              </div>
            ) : (
            cart.map((item) => {
              const itemKey = item.id || item.product.id;
              const itemType = item.itemType || 'produk';
              const canAdjustQty = itemType === 'produk' || itemType === 'percetakan';
              const maxStock = itemType === 'produk' ? item.product.stock : 9999;
              const badgeLabel =
                itemType === 'ppob'
                  ? 'PPOB'
                  : itemType === 'percetakan'
                  ? 'CETAK'
                  : itemType === 'service'
                  ? 'SERVIS'
                  : itemType === 'atm_mini'
                  ? 'ATM MINI'
                  : null;
              const badgeColor =
                itemType === 'ppob'
                  ? 'bg-sky-100 text-sky-800 border-sky-200'
                  : itemType === 'percetakan'
                  ? 'bg-violet-100 text-violet-800 border-violet-200'
                  : itemType === 'service'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-pink-100 text-pink-800 border-pink-200';

              return (
                <div
                  key={itemKey}
                  className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {badgeLabel && (
                        <span className={`px-1 py-0.2 text-[9px] font-black rounded border shrink-0 ${badgeColor}`}>
                          {badgeLabel}
                        </span>
                      )}
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {item.product.name}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      Rp {item.product.price.toLocaleString('id-ID')}
                      {itemType === 'ppob' && item.metadata?.targetNumber ? ` · ${item.metadata.targetNumber}` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {canAdjustQty ? (
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(itemKey, item.quantity - 1)}
                          className="p-1 text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold font-mono text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(itemKey, item.quantity + 1)}
                          disabled={itemType === 'produk' && item.quantity >= maxStock}
                          className="p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-white border border-slate-200 rounded text-slate-600">
                        {item.quantity}x
                      </span>
                    )}

                    <span className="text-xs font-bold text-slate-900 font-mono w-20 text-right tabular-nums">
                      Rp {item.subtotal.toLocaleString('id-ID')}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeFromCart(itemKey)}
                      className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
            )}
          </div>

          {/* Checkout Form */}
          <form onSubmit={handleCheckout} className="border-t border-slate-200 bg-slate-50 p-3.5 space-y-3 shrink-0">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal Barang:</span>
                <span className="font-mono font-semibold text-slate-800">
                  Rp {cartSubtotal.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Sistem Diskon Mobile */}
              <div className="space-y-1 bg-white p-2 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-700">Diskon (Rp):</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={discountAmount || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setDiscountAmount(val);
                      if (val >= cartSubtotal && isOwner) setCashTendered(0);
                    }}
                    placeholder="0"
                    className="w-24 text-right px-2 py-0.5 text-xs bg-slate-50 border border-slate-300 rounded font-mono font-bold"
                  />
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pt-0.5">
                  {[
                    { label: '0%', val: 0 },
                    { label: '5%', val: Math.round(cartSubtotal * 0.05) },
                    { label: '10%', val: Math.round(cartSubtotal * 0.1) },
                    { label: '20%', val: Math.round(cartSubtotal * 0.2) },
                    { label: '50%', val: Math.round(cartSubtotal * 0.5) },
                  ].map((d) => (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => setDiscountAmount(d.val)}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 font-bold shrink-0 border border-slate-200"
                    >
                      {d.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isOwner) {
                        setCheckoutError('Diskon 100% (Bayar Rp 0) hanya diizinkan untuk shift Owner!');
                        return;
                      }
                      setDiscountAmount(cartSubtotal);
                      setCashTendered(0);
                    }}
                    className={`px-2 py-0.5 text-[10px] rounded font-black shrink-0 ${
                      finalTotal === 0 && discountAmount >= cartSubtotal
                        ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-500'
                        : isOwner
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-400 opacity-60'
                    }`}
                  >
                    👑 100% (Rp 0)
                  </button>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total Tagihan:</span>
                <span className="text-xl font-extrabold text-emerald-900 font-mono">
                  Rp {finalTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'tunai', label: 'Tunai', icon: Banknote, activeStyle: 'bg-emerald-600 text-white border-emerald-500 shadow-sm' },
                { id: 'qris', label: 'QRIS', icon: QrCode, activeStyle: 'bg-sky-600 text-white border-sky-500 shadow-sm' },
                { id: 'transfer', label: 'Transfer', icon: CreditCard, activeStyle: 'bg-indigo-600 text-white border-indigo-500 shadow-sm' },
                { id: 'hutang', label: 'Kasbon', icon: Receipt, activeStyle: 'bg-amber-600 text-white border-amber-500 shadow-sm' },
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id as PaymentMethod);
                      if (m.id === 'tunai' && cashTendered === 0) setCashTendered(finalTotal);
                      if (m.id === 'hutang') {
                        if (customerName === 'Pelanggan Umum') {
                          setCustomerName('');
                        }
                      }
                      setCheckoutError(null);
                    }}
                    className={`py-2 px-1 text-xs font-bold rounded-xl flex flex-col items-center gap-1 transition cursor-pointer border active:scale-95 ${
                      active
                        ? m.activeStyle
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 font-semibold'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* QRIS Guidance Mobile */}
            {paymentMethod === 'qris' && (
              <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl space-y-1.5 text-sky-950">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-sky-600" />
                    <span>QRIS Ju-Fat Cell</span>
                  </span>
                  <span className="text-[10px] bg-sky-200/70 text-sky-800 px-1.5 py-0.5 rounded font-mono">
                    ID10202688190
                  </span>
                </div>
                <p className="text-[11px] text-sky-800">
                  Scan QRIS toko sebesar <span className="font-bold font-mono">Rp {finalTotal.toLocaleString('id-ID')}</span>.
                </p>
              </div>
            )}

            {/* Kasbon / Hutang Direct Input Fields Mobile */}
            {paymentMethod === 'hutang' && (
              <div className="p-3 bg-amber-50/95 border-2 border-amber-300 rounded-xl space-y-2.5 text-amber-950 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900 border-b border-amber-200/80 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-extrabold">Data Kasbon Pelanggan</span>
                  </div>
                  <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-extrabold uppercase">
                    Masuk Buku Hutang
                  </span>
                </div>

                {/* Kolom Nama Pelanggan Kasbon (Wajib) */}
                <div>
                  <label className="text-[11px] font-extrabold text-amber-950 flex items-center justify-between mb-1">
                    <span>Nama Pelanggan yang Kasbon *</span>
                    <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                      Wajib Diisi
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName === 'Pelanggan Umum' ? '' : customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (checkoutError) setCheckoutError(null);
                    }}
                    placeholder="Ketik Nama Pelanggan (cth: Kk Erni, Mas Danang, Bu RT)..."
                    className={`w-full px-3 py-2 text-xs bg-white border-2 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs ${
                      checkoutError && (!customerName.trim() || customerName.trim() === 'Pelanggan Umum')
                        ? 'border-rose-500 bg-rose-50/40 animate-pulse'
                        : 'border-amber-400'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
                      Jatuh Tempo Kasbon:
                    </label>
                    <input
                      type="date"
                      value={debtDueDate}
                      onChange={(e) => setDebtDueDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
                      Catatan / No. HP (Opsional):
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Boleh dikosongkan..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="p-2 bg-amber-100/80 rounded-lg text-[11px] text-amber-950 font-medium border border-amber-200 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>
                    Dicatat sebesar <strong className="font-mono">Rp {finalTotal.toLocaleString('id-ID')}</strong> atas nama:{' '}
                    <strong className="text-amber-950 underline font-bold">
                      {customerName.trim() && customerName.trim() !== 'Pelanggan Umum' ? customerName.trim() : (customerPhone.trim() ? customerPhone.trim() : '(Ketik nama di atas)')}
                    </strong>
                  </span>
                </div>
              </div>
            )}

            {/* Cash Tendered & Shortcuts */}
            {paymentMethod === 'tunai' && (
              <div className="space-y-1.5 pt-1 border-t border-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">Uang Diterima:</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={cashTendered || ''}
                      onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-32 text-right pl-7 pr-2.5 py-1 text-sm bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-xs font-mono font-bold">
                  <button
                    type="button"
                    onClick={() => setQuickCash(finalTotal)}
                    className="py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-2xs active:scale-95 text-center cursor-pointer"
                  >
                    Uang Pas
                  </button>
                  {[50000, 100000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuickCash(amt)}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg border border-slate-200/80 active:scale-95 text-center cursor-pointer"
                    >
                      {amt >= 1000 ? `${amt / 1000}rb` : amt}
                    </button>
                  ))}
                </div>

                <div
                  className={`p-2.5 rounded-xl border text-xs font-mono font-bold ${
                    isCashInsufficient
                      ? cashTendered > 0
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{isCashInsufficient ? (cashTendered > 0 ? 'Sisa Kasbon (Masuk Buku Hutang):' : 'Kurang:') : 'Kembalian:'}</span>
                    <span className="text-sm font-black">
                      Rp{' '}
                      {isCashInsufficient
                        ? (finalTotal - cashTendered).toLocaleString('id-ID')
                        : changeAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {isCashInsufficient && cashTendered > 0 && (
                    <p className="text-[10px] font-sans font-medium text-amber-800 mt-1 pt-1 border-t border-amber-200">
                      💡 <strong>Bayar Sebagian Aktif:</strong> Uang Rp {cashTendered.toLocaleString('id-ID')} masuk ke laci, sisa Rp {(finalTotal - cashTendered).toLocaleString('id-ID')} otomatis dicatat ke Buku Kasbon atas nama {customerName || 'pelanggan'}.
                    </p>
                  )}
                </div>

                {isCashInsufficient && cashTendered > 0 && (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                    <div>
                      <label className="text-[10px] font-extrabold text-amber-950 flex items-center justify-between mb-0.5">
                        <span>Nama Pelanggan yang Kasbon Sisa: *</span>
                        <span className="text-[9px] text-rose-600 font-bold bg-rose-50 px-1 rounded border border-rose-200">
                          Wajib Diisi
                        </span>
                      </label>
                      <input
                        type="text"
                        value={customerName === 'Pelanggan Umum' ? '' : customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          if (checkoutError) setCheckoutError(null);
                        }}
                        placeholder="Ketik nama pelanggan berhutang..."
                        className="w-full px-2.5 py-1 text-xs bg-white border border-amber-400 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="font-bold text-amber-900 block mb-0.5">Jatuh Tempo:</span>
                        <input
                          type="date"
                          value={debtDueDate}
                          onChange={(e) => setDebtDueDate(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-amber-900 block mb-0.5">No. HP / WA:</span>
                        <input
                          type="text"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Opsional..."
                          className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Validation Error Banner Mobile */}
            {checkoutError && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutError(null)}
                  className="text-rose-500 hover:text-rose-700 ml-1 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={cart.length === 0 || (paymentMethod === 'tunai' && cashTendered === 0 && finalTotal > 0) || (finalTotal === 0 && !isOwner)}
              className={`w-full py-3.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
                cart.length === 0 || (paymentMethod === 'tunai' && cashTendered === 0 && finalTotal > 0) || (finalTotal === 0 && !isOwner)
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : finalTotal === 0 && isOwner
                  ? 'bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 text-white ring-2 ring-amber-300 active:scale-[0.99]'
                  : isCashInsufficient && cashTendered > 0
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-900/20 active:scale-[0.99]'
                  : 'bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 text-white shadow-teal-900/20 active:scale-[0.99]'
              }`}
            >
              {finalTotal === 0 && isOwner ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>🎁 Bayar Rp 0 & Cetak Struk (Owner Gratis)</span>
                </>
              ) : finalTotal === 0 && !isOwner ? (
                <span>Bayar Rp 0 Khusus Owner (Ganti Shift)</span>
              ) : isCashInsufficient && cashTendered > 0 ? (
                <>
                  <Receipt className="w-4 h-4 text-amber-200" />
                  <span>Bayar Rp {cashTendered.toLocaleString('id-ID')} & Sisa Kasbon Rp {(finalTotal - cashTendered).toLocaleString('id-ID')}</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-amber-300" />
                  <span>Bayar & Cetak Struk (Rp {finalTotal.toLocaleString('id-ID')})</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Mobile Floating Bottom Bar */}
      {cartTotalCount > 0 && !isMobileCartOpen && (
        <div className="md:hidden fixed bottom-16 left-3 right-3 z-30 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-teal-500/40 flex items-center justify-between animate-in slide-in-from-bottom duration-150 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
              <ShoppingCart className="w-4 h-4" />
              <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                {cartTotalCount}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-teal-200 truncate">{cartTotalCount} item terpilih</div>
              <div className="text-sm font-extrabold font-mono text-white truncate">
                Rp {finalTotal.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileCartOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
          >
            <span>Bayar Sekarang</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal Cetak Ulang Struk Kasir POS */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden my-auto flex flex-col max-h-[88vh]">
            <div className="p-4 bg-gradient-to-r from-teal-700 to-emerald-700 text-white flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-sm">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Riwayat & Cetak Ulang Struk Kasir</h3>
                  <p className="text-[11px] text-teal-100">Daftar struk transaksi penjualan POS Ju-Fat Cell</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 bg-slate-50">
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Receipt className="w-10 h-10 mx-auto text-slate-300 stroke-[1.2]" />
                  <p className="text-xs font-semibold">Belum ada riwayat transaksi penjualan kasir</p>
                </div>
              ) : (
                transactions.slice(0, 30).map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:border-teal-400 transition shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">{tx.invoiceNo}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {tx.paymentMethod}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {tx.date} • Kasir: {tx.cashier} • Pelanggan: <span className="font-semibold text-slate-700">{tx.customerName}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-sm text-emerald-800">
                          Rp {tx.total.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                      <span className="truncate max-w-[280px]">
                        {tx.items.length} item: {tx.items.map((i) => `${i.product.name} (${i.quantity}x)`).join(', ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsHistoryModalOpen(false);
                          openReceipt(tx);
                        }}
                        className="ml-2 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-300" />
                        <span>Cetak Struk</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
