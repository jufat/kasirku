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
  } = usePOS();

  const allCategories: ProductCategory[] = ['Semua', ...categories];
  const [selectedCat, setSelectedCat] = useState<ProductCategory>('Semua');
  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanFeedback, setScanFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [customerName, setCustomerName] = useState('Pelanggan Umum');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [checkoutNote, setCheckoutNote] = useState('');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

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
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (paymentMethod === 'tunai' && cashTendered < finalTotal) {
      alert(`Nominal pembayaran uang tunai kurang! Minimal Rp ${finalTotal.toLocaleString('id-ID')}`);
      return;
    }

    checkoutPOS(
      paymentMethod,
      cashTendered,
      customerName,
      discountAmount,
      taxPercent,
      checkoutNote
    );

    // Reset checkout form
    setDiscountAmount(0);
    setTaxPercent(0);
    setCashTendered(0);
    setCheckoutNote('');
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
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-900'
                  }`}
                >
                  {cat}
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
              <h3 className="text-sm font-bold text-slate-900 leading-tight">Keranjang Belanja</h3>
              <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                {cartTotalCount} item terpilih
              </p>
            </div>
          </div>

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
            cart.map((item) => (
              <div
                key={item.product.id}
                className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/70 flex items-start justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {item.product.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                    Rp {item.product.price.toLocaleString('id-ID')} / pcs
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center border border-slate-200 rounded-md bg-white">
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 hover:bg-slate-100 text-slate-600 transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold font-mono text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="p-1 hover:bg-slate-100 text-slate-600 transition disabled:opacity-30"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <span className="text-xs font-bold text-slate-900 font-mono tabular-nums block">
                      Rp {item.subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-slate-400 hover:text-red-500 p-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
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

            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1">
                <Percent className="w-3 h-3 text-emerald-600" />
                <span>Diskon (Rp):</span>
              </span>
              <input
                type="number"
                min="0"
                step="500"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-24 text-right px-2 py-0.5 text-xs bg-white border border-slate-300 rounded font-mono"
              />
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
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: 'tunai', label: 'Tunai', icon: Banknote },
                { id: 'qris', label: 'QRIS', icon: QrCode },
                { id: 'transfer', label: 'Transfer', icon: CreditCard },
                { id: 'hutang', label: 'Tempo', icon: Receipt },
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
                    }}
                    className={`py-1.5 px-2 text-xs font-bold rounded-xl flex flex-col items-center gap-1 transition cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

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
              <div className="grid grid-cols-4 gap-1 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setQuickCash(finalTotal)}
                  className="py-1 bg-emerald-100/70 hover:bg-emerald-100 text-emerald-800 font-bold rounded border border-emerald-200 cursor-pointer"
                >
                  Uang Pas
                </button>
                {[50000, 100000, 200000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setQuickCash(amt)}
                    className="py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 cursor-pointer"
                  >
                    {amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>

              {/* Kembalian Banner */}
              <div
                className={`p-2 rounded-lg flex items-center justify-between text-xs font-mono font-bold ${
                  isCashInsufficient
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                }`}
              >
                <span>{isCashInsufficient ? 'Kurang:' : 'Kembalian:'}</span>
                <span className="text-sm">
                  Rp{' '}
                  {isCashInsufficient
                    ? (finalTotal - cashTendered).toLocaleString('id-ID')
                    : changeAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          {/* Submit Checkout Button */}
          <button
            type="submit"
            disabled={cart.length === 0 || isCashInsufficient}
            className={`w-full py-3 px-4 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition duration-150 cursor-pointer ${
              cart.length === 0 || isCashInsufficient
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : 'bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-900/20 active:scale-[0.99]'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-amber-300" />
            <span>Bayar & Cetak Struk (Selesai)</span>
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
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {item.product.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Rp {item.product.price.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 text-slate-600 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold font-mono text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-xs font-bold text-slate-900 font-mono w-20 text-right">
                      Rp {item.subtotal.toLocaleString('id-ID')}
                    </span>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Form */}
          <form onSubmit={handleCheckout} className="border-t border-slate-200 bg-slate-50 p-3.5 space-y-3 shrink-0">
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal Barang:</span>
                <span className="font-mono font-semibold text-slate-800">
                  Rp {cartSubtotal.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Diskon (Rp):</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 text-right px-2 py-0.5 text-xs bg-white border border-slate-300 rounded font-mono"
                />
              </div>
              <div className="pt-1.5 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total Tagihan:</span>
                <span className="text-xl font-extrabold text-emerald-900 font-mono">
                  Rp {finalTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: 'tunai', label: 'Tunai', icon: Banknote },
                { id: 'qris', label: 'QRIS', icon: QrCode },
                { id: 'transfer', label: 'Transfer', icon: CreditCard },
                { id: 'hutang', label: 'Tempo', icon: Receipt },
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
                    }}
                    className={`py-1.5 text-xs font-bold rounded-xl flex flex-col items-center gap-1 transition cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

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

                <div className="grid grid-cols-4 gap-1 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setQuickCash(finalTotal)}
                    className="py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200"
                  >
                    Uang Pas
                  </button>
                  {[50000, 100000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuickCash(amt)}
                      className="py-1 bg-white text-slate-700 rounded-lg border border-slate-200"
                    >
                      {amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                </div>

                <div
                  className={`p-2 rounded-lg flex items-center justify-between text-xs font-mono font-bold ${
                    isCashInsufficient
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  }`}
                >
                  <span>{isCashInsufficient ? 'Kurang:' : 'Kembalian:'}</span>
                  <span className="text-sm">
                    Rp{' '}
                    {isCashInsufficient
                      ? (finalTotal - cashTendered).toLocaleString('id-ID')
                      : changeAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={cart.length === 0 || isCashInsufficient}
              className={`w-full py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
                cart.length === 0 || isCashInsufficient
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 text-white shadow-teal-900/20 active:scale-[0.99]'
              }`}
            >
              <CheckCircle className="w-4 h-4 text-amber-300" />
              <span>Bayar & Cetak Struk (Selesai)</span>
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
    </div>
  );
};
