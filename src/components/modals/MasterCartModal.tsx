import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  User,
  Percent,
  Banknote,
  QrCode,
  CreditCard,
  Receipt,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Layers,
  Zap,
  Printer,
  Wrench,
  Landmark,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { CartItemType, PaymentMethod } from '../../types/pos';

const DEPT_CONFIG: Record<
  CartItemType,
  { label: string; shortLabel: string; badgeClass: string; tab: string }
> = {
  produk: {
    label: 'KASIR',
    shortLabel: 'Kasir',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    tab: 'kasir',
  },
  ppob: {
    label: 'PPOB',
    shortLabel: 'PPOB',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
    tab: 'ppob',
  },
  percetakan: {
    label: 'CETAK',
    shortLabel: 'Percetakan',
    badgeClass: 'bg-violet-100 text-violet-800 border-violet-200',
    tab: 'percetakan',
  },
  service: {
    label: 'SERVIS',
    shortLabel: 'Service HP',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    tab: 'service',
  },
  atm_mini: {
    label: 'ATM MINI',
    shortLabel: 'ATM Mini',
    badgeClass: 'bg-pink-100 text-pink-800 border-pink-200',
    tab: 'atm_mini',
  },
};

const sanitizeRupiahInput = (raw: string): string => {
  const withoutTrailingCents = raw.replace(/,0{1,2}\s*$/, '');
  return withoutTrailingCents.replace(/[^\d.]/g, '');
};

const parseExactRupiah = (raw: string): number => {
  const withoutTrailingCents = raw.replace(/,0{1,2}\s*$/, '');
  const digits = withoutTrailingCents.replace(/\D/g, '');
  if (!digits) return 0;
  const parsed = parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const MasterCartModal: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    cartTotalCount,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    checkoutPOS,
    isMasterCartModalOpen,
    setIsMasterCartModalOpen,
    setActiveTab,
    shift,
    drawerCashBalance,
  } = usePOS();

  const isOwner = shift.cashierSlot === 'owner' || shift.role === 'owner';

  const [customerName, setCustomerName] = useState('Pelanggan Umum');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [discountInput, setDiscountInput] = useState<string>('');
  const [cashTenderedInput, setCashTenderedInput] = useState<string>('');
  const discountAmount = parseExactRupiah(discountInput);
  const cashTendered = parseExactRupiah(cashTenderedInput);
  const setDiscountAmount = (val: number) =>
    setDiscountInput(val > 0 ? Math.trunc(val).toLocaleString('id-ID') : '');
  const setCashTendered = (val: number) =>
    setCashTenderedInput(val > 0 ? Math.trunc(val).toLocaleString('id-ID') : '');
  const [debtDueDate, setDebtDueDate] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [checkoutNote, setCheckoutNote] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Sync customer info & reset transient checkout states when modal opens
  useEffect(() => {
    if (!isMasterCartModalOpen) return;
    const itemWithCustomer = cart.find(
      (c) => c.metadata?.customerName && c.metadata.customerName.trim().length > 0
    );
    const itemWithPhone = cart.find(
      (c) => c.metadata?.customerPhone && c.metadata.customerPhone.trim().length > 0
    );

    if (itemWithCustomer?.metadata?.customerName) {
      setCustomerName(itemWithCustomer.metadata.customerName);
    } else {
      setCustomerName('Pelanggan Umum');
    }

    if (itemWithPhone?.metadata?.customerPhone) {
      setCustomerPhone(itemWithPhone.metadata.customerPhone);
    } else {
      setCustomerPhone('');
    }

    setDiscountAmount(0);
    setPaymentMethod('tunai');
    setCashTendered(0);
    setCheckoutNote('');
    setCheckoutError(null);
  }, [isMasterCartModalOpen]);

  // Keep discount within valid bounds if items are deleted while modal is open
  useEffect(() => {
    if (discountAmount > cartSubtotal) {
      setDiscountAmount(cartSubtotal);
    }
  }, [cartSubtotal, discountAmount]);

  if (!isMasterCartModalOpen) return null;

  const finalTotal = Math.max(0, cartSubtotal - discountAmount);
  const isCashInsufficient = paymentMethod === 'tunai' && cashTendered < finalTotal;
  const changeAmount =
    paymentMethod === 'tunai' && cashTendered >= finalTotal ? cashTendered - finalTotal : 0;

  // Count breakdown per department
  const deptCounts = cart.reduce<Record<CartItemType, number>>(
    (acc, item) => {
      const t = item.itemType || 'produk';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    },
    { produk: 0, ppob: 0, percetakan: 0, service: 0, atm_mini: 0 }
  );

  const activeDeptCount = (Object.values(deptCounts) as number[]).filter((n) => n > 0).length;

  const handleNavigateTab = (tab: string) => {
    setIsMasterCartModalOpen(false);
    setActiveTab(tab);
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setCheckoutError(null);

    if (finalTotal === 0 && !isOwner) {
      setCheckoutError(
        'Pembayaran Rp 0 (Diskon 100% / Gratis) hanya diizinkan untuk shift Owner! Silakan ganti ke shift Owner.'
      );
      return;
    }

    const isPartial =
      paymentMethod === 'tunai' && cashTendered > 0 && cashTendered < finalTotal;

    if (paymentMethod === 'tunai' && cashTendered === 0 && finalTotal > 0) {
      setCheckoutError(
        'Uang tunai diterima Rp 0! Ketik nominal uang yang dibayar, klik "Uang Pas", atau pilih metode "Kasbon".'
      );
      return;
    }

    let resolvedCustomerName = customerName.trim();
    if (paymentMethod === 'hutang' || isPartial) {
      if (
        (!resolvedCustomerName || resolvedCustomerName.toLowerCase() === 'pelanggan umum') &&
        customerPhone.trim()
      ) {
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
      0,
      checkoutNote.trim() || undefined,
      customerPhone.trim() || undefined,
      debtDueDate,
      isPartial,
      isPartial ? cashTendered : undefined
    );

    setIsMasterCartModalOpen(false);
  };

  const renderItemSubtitle = (item: (typeof cart)[number]) => {
    const t = item.itemType || 'produk';
    const m = item.metadata;
    if (t === 'ppob' && m) {
      return [
        m.targetNumber ? `Tujuan: ${m.targetNumber}` : null,
        m.provider || null,
        m.period || null,
        m.customerName ? `Plg: ${m.customerName}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
    }
    if (t === 'percetakan') {
      const unitLabel = m?.unit || item.product.unit || 'pcs';
      return [
        `Rp ${item.product.price.toLocaleString('id-ID')} / ${unitLabel}`,
        m?.specNote || null,
        m?.fileOrNote ? `Catatan: ${m.fileOrNote}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
    }
    if (t === 'service' && m) {
      return [
        m.serviceTicketId ? `Tiket ${m.serviceTicketId}` : null,
        m.customerName || null,
        m.problemDescription || null,
        m.downPaymentPaid && m.downPaymentPaid > 0
          ? `DP sdh bayar Rp ${m.downPaymentPaid.toLocaleString('id-ID')}`
          : null,
      ]
        .filter(Boolean)
        .join(' · ');
    }
    if (t === 'atm_mini' && m) {
      return [
        m.targetAccountOrPhone
          ? `Tujuan: ${m.targetAccountOrPhone}`
          : m.cardNumberMasked && m.cardNumberMasked !== '-'
          ? `Kartu: ${m.cardNumberMasked}`
          : null,
        m.bankName || null,
        `Pokok Rp ${(m.nominal || 0).toLocaleString('id-ID')}`,
        m.counterFee ? `Jasa Rp ${m.counterFee.toLocaleString('id-ID')}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
    }
    return `Rp ${item.product.price.toLocaleString('id-ID')} / ${item.product.unit || 'pcs'}`;
  };

  const quickTabs = [
    { key: 'produk' as CartItemType, tab: 'kasir', label: 'Kasir', icon: ShoppingBag },
    { key: 'ppob' as CartItemType, tab: 'ppob', label: 'PPOB', icon: Zap },
    { key: 'percetakan' as CartItemType, tab: 'percetakan', label: 'Percetakan', icon: Printer },
    { key: 'service' as CartItemType, tab: 'service', label: 'Service HP', icon: Wrench },
    { key: 'atm_mini' as CartItemType, tab: 'atm_mini', label: 'ATM Mini', icon: Landmark },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsMasterCartModalOpen(false);
      }}
    >
      <div className="bg-white w-full max-w-4xl h-[94dvh] md:h-auto md:max-h-[90dvh] rounded-t-2xl md:rounded-2xl shadow-2xl border border-teal-200/80 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-700 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                  Keranjang Besar (Gabungan Semua Menu)
                </h2>
                {activeDeptCount > 1 && (
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md bg-amber-400 text-slate-950 whitespace-nowrap shrink-0">
                    {activeDeptCount} Layanan Digabung
                  </span>
                )}
              </div>
              <p className="text-[11px] text-teal-100 truncate">
                {cart.length === 0
                  ? 'Gabung belanja Kasir, PPOB, Cetak, Servis & ATM Mini dalam 1 struk & 1 pembayaran'
                  : `${cartTotalCount} item dari ${activeDeptCount} kategori · Kas Laci: Rp ${drawerCashBalance.toLocaleString('id-ID')}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="px-2.5 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kosongkan</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsMasterCartModalOpen(false)}
              className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer shrink-0"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Navigation Pills Row (+ Tambah Item dari Menu Lain) */}
        <div className="px-4 py-2.5 bg-teal-50/70 border-b border-teal-100 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-[11px] font-bold text-teal-900 whitespace-nowrap shrink-0">
            + Tambah Item:
          </span>
          {quickTabs.map((qt) => {
            const Icon = qt.icon;
            const count = deptCounts[qt.key];
            return (
              <button
                key={qt.tab}
                type="button"
                onClick={() => handleNavigateTab(qt.tab)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
                  count > 0
                    ? 'bg-white text-teal-900 border-teal-400 shadow-2xs ring-1 ring-teal-200'
                    : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200 hover:border-teal-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>{qt.label}</span>
                {count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black bg-teal-600 text-white">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Body: Split Item List (left/top) & Unified Payment Form (right/bottom) */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* Left / Top: Bundled Cart Items */}
          <div className="flex-1 flex flex-col min-w-0 lg:overflow-y-auto p-4 bg-slate-50/70 space-y-2.5">
            {cart.length === 0 ? (
              <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200">
                  <ShoppingCart className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Keranjang Besar Masih Kosong
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tambahkan barang dari <strong>Kasir</strong>, tagihan/pulsa di{' '}
                    <strong>PPOB</strong>, cetak di <strong>Percetakan</strong>, pelunasan{' '}
                    <strong>Service HP</strong>, atau transfer di <strong>ATM Mini</strong>{' '}
                    lalu bayar sekaligus dalam 1 struk.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  {quickTabs.map((qt) => (
                    <button
                      key={qt.tab}
                      type="button"
                      onClick={() => handleNavigateTab(qt.tab)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap"
                    >
                      <span>Buka {qt.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              cart.map((item) => {
                const itemKey = item.id || item.product.id;
                const itemType: CartItemType = item.itemType || 'produk';
                const dept = DEPT_CONFIG[itemType] || DEPT_CONFIG.produk;
                const canAdjustQty = itemType === 'produk' || itemType === 'percetakan';
                const maxStock = itemType === 'produk' ? item.product.stock : 9999;

                return (
                  <div
                    key={itemKey}
                    className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded border uppercase tracking-wide shrink-0 ${dept.badgeClass}`}
                        >
                          {dept.label}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {item.product.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium break-words">
                        {renderItemSubtitle(item)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {canAdjustQty ? (
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(itemKey, item.quantity - 1)}
                            className="p-1.5 hover:bg-white text-slate-600 rounded-l-lg transition cursor-pointer"
                            title="Kurangi jumlah"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold font-mono tabular-nums text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(itemKey, item.quantity + 1)}
                            disabled={itemType === 'produk' && item.quantity >= maxStock}
                            className="p-1.5 hover:bg-white text-slate-600 rounded-r-lg transition disabled:opacity-30 cursor-pointer"
                            title="Tambah jumlah"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="px-2 py-1 text-[11px] font-bold font-mono tabular-nums bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                          {item.quantity}x {itemType === 'service' ? 'unit' : 'trx'}
                        </span>
                      )}

                      <div className="text-right min-w-[84px]">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 font-mono tabular-nums block">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(itemKey)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Hapus item dari keranjang"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right / Bottom: Unified Payment Form */}
          <form
            onSubmit={handleCheckout}
            className="w-full lg:w-[400px] shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 lg:overflow-y-auto p-4 space-y-3"
          >
            {/* Customer Name Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 uppercase">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>Nama Pelanggan</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (checkoutError) setCheckoutError(null);
                }}
                placeholder="Nama Pelanggan (Umum / Langganan)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Subtotal & Discount Card */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal Gabungan ({cartTotalCount} item):</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  Rp {cartSubtotal.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <Percent className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Diskon (Rp):</span>
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={discountInput}
                  onChange={(e) => {
                    const sanitized = sanitizeRupiahInput(e.target.value);
                    const val = Math.max(0, parseExactRupiah(sanitized));
                    setDiscountInput(sanitized);
                    if (val >= cartSubtotal && isOwner) {
                      setCashTendered(0);
                    }
                    setCheckoutError(null);
                  }}
                  placeholder="0"
                  className="w-28 text-right px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg font-mono tabular-nums font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Preset Discount Chips */}
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
                    disabled={cart.length === 0}
                    onClick={() => {
                      setDiscountAmount(d.val);
                      setCheckoutError(null);
                    }}
                    className={`px-2 py-0.5 text-[10px] rounded font-bold transition cursor-pointer shrink-0 disabled:opacity-40 ${
                      discountAmount === d.val && d.val > 0
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={() => {
                    if (!isOwner) {
                      setCheckoutError(
                        'Diskon 100% (Bayar Rp 0) hanya diizinkan untuk shift Owner!'
                      );
                      return;
                    }
                    setDiscountAmount(cartSubtotal);
                    setCashTendered(0);
                    setCheckoutError(null);
                  }}
                  className={`px-2 py-0.5 text-[10px] rounded font-black transition cursor-pointer shrink-0 disabled:opacity-40 ${
                    finalTotal === 0 && discountAmount >= cartSubtotal && cart.length > 0
                      ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-500'
                      : isOwner
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60'
                  }`}
                  title={isOwner ? 'Owner: Bayar Rp 0 / Gratis 100%' : 'Khusus shift Owner'}
                >
                  👑 100% (Rp 0)
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-xs font-extrabold text-slate-900 uppercase">
                  Total Gabungan:
                </span>
                <span className="text-xl font-black text-emerald-900 font-mono tabular-nums">
                  Rp {finalTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1.5 uppercase">
                Metode Pembayaran (1x Bayar)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  {
                    id: 'tunai',
                    label: 'Tunai',
                    icon: Banknote,
                    activeStyle: 'bg-emerald-600 text-white border-emerald-500 shadow-sm',
                  },
                  {
                    id: 'qris',
                    label: 'QRIS',
                    icon: QrCode,
                    activeStyle: 'bg-sky-600 text-white border-sky-500 shadow-sm',
                  },
                  {
                    id: 'transfer',
                    label: 'Transfer',
                    icon: CreditCard,
                    activeStyle: 'bg-indigo-600 text-white border-indigo-500 shadow-sm',
                  },
                  {
                    id: 'hutang',
                    label: 'Kasbon',
                    icon: Receipt,
                    activeStyle: 'bg-amber-600 text-white border-amber-500 shadow-sm',
                  },
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
                        if (m.id === 'hutang' && customerName === 'Pelanggan Umum') {
                          setCustomerName('');
                        }
                        setCheckoutError(null);
                      }}
                      className={`py-2 px-1 text-xs font-bold rounded-xl flex flex-col items-center gap-1 transition cursor-pointer border active:scale-95 ${
                        active
                          ? m.activeStyle
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QRIS / Transfer Info */}
            {(paymentMethod === 'qris' || paymentMethod === 'transfer') && (
              <div
                className={`p-2.5 rounded-xl border text-xs ${
                  paymentMethod === 'qris'
                    ? 'bg-sky-50 border-sky-200 text-sky-950'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-950'
                }`}
              >
                <div className="font-bold mb-0.5">
                  {paymentMethod === 'qris' ? 'Scan QRIS Toko Ju-Fat Cell' : 'Transfer Rekening Toko'}
                </div>
                <p className="text-[11px]">
                  Dana masuk ke Saldo Digital sebesar{' '}
                  <strong className="font-mono tabular-nums">
                    Rp {finalTotal.toLocaleString('id-ID')}
                  </strong>
                  .
                </p>
              </div>
            )}

            {/* Tunai Input & Quick Shortcuts & Partial DP Detection */}
            {paymentMethod === 'tunai' && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700">Uang Diterima:</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cashTenderedInput}
                      onChange={(e) => {
                        setCashTenderedInput(sanitizeRupiahInput(e.target.value));
                        setCheckoutError(null);
                      }}
                      placeholder="0"
                      className="w-36 text-right pl-7 pr-2.5 py-1.5 text-sm bg-white border border-slate-300 rounded-lg font-mono tabular-nums font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-xs font-mono font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setCashTendered(finalTotal);
                      setCheckoutError(null);
                    }}
                    className="py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer active:scale-95 font-sans font-bold"
                  >
                    Uang Pas
                  </button>
                  {[50000, 100000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setCashTendered(amt);
                        setCheckoutError(null);
                      }}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-200 cursor-pointer active:scale-95"
                    >
                      {amt / 1000}rb
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
                    <span className="font-sans">
                      {isCashInsufficient
                        ? cashTendered > 0
                          ? 'Sisa Kasbon (Buku Hutang):'
                          : 'Uang Kurang:'
                        : 'Kembalian:'}
                    </span>
                    <span className="text-sm font-black tabular-nums">
                      Rp{' '}
                      {isCashInsufficient
                        ? (finalTotal - cashTendered).toLocaleString('id-ID')
                        : changeAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {isCashInsufficient && cashTendered > 0 && (
                    <p className="text-[10px] font-sans font-medium text-amber-800 mt-1 pt-1 border-t border-amber-200">
                      <strong>Bayar Sebagian DP:</strong> Rp{' '}
                      {cashTendered.toLocaleString('id-ID')} masuk laci kas, sisa Rp{' '}
                      {(finalTotal - cashTendered).toLocaleString('id-ID')} otomatis masuk
                      Buku Kasbon.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Kasbon / Partial Payment Debtor Fields */}
            {(paymentMethod === 'hutang' || (isCashInsufficient && cashTendered > 0)) && (
              <div className="p-3 bg-amber-50/90 border-2 border-amber-300 rounded-xl space-y-2 text-amber-950">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Data Kasbon Pelanggan</span>
                  <span className="text-[10px] bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded font-extrabold uppercase">
                    Wajib Isi Nama
                  </span>
                </div>

                <input
                  type="text"
                  value={customerName === 'Pelanggan Umum' ? '' : customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (checkoutError) setCheckoutError(null);
                  }}
                  placeholder="Ketik nama pelanggan berhutang (Wajib)..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-amber-400 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <label className="font-bold text-amber-900 block mb-0.5">Jatuh Tempo:</label>
                    <input
                      type="date"
                      value={debtDueDate}
                      onChange={(e) => setDebtDueDate(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-amber-900 block mb-0.5">No. HP / Catatan:</label>
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

            {/* Optional Note */}
            <div>
              <input
                type="text"
                value={checkoutNote}
                onChange={(e) => setCheckoutNote(e.target.value)}
                placeholder="Catatan transaksi gabungan (opsional)..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Validation Error */}
            {checkoutError && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutError(null)}
                  className="text-rose-500 hover:text-rose-700 cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                cart.length === 0 ||
                (paymentMethod === 'tunai' && cashTendered === 0 && finalTotal > 0) ||
                (finalTotal === 0 && !isOwner)
              }
              className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
                cart.length === 0 ||
                (paymentMethod === 'tunai' && cashTendered === 0 && finalTotal > 0) ||
                (finalTotal === 0 && !isOwner)
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  : finalTotal === 0 && isOwner
                  ? 'bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 hover:brightness-110 text-white ring-2 ring-amber-300 active:scale-[0.99]'
                  : isCashInsufficient && cashTendered > 0
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white active:scale-[0.99]'
                  : 'bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-500 hover:to-emerald-500 text-white active:scale-[0.99]'
              }`}
            >
              {finalTotal === 0 && isOwner && cart.length > 0 ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>🎁 Bayar Rp 0 & Cetak Struk (Owner Gratis)</span>
                </>
              ) : finalTotal === 0 && !isOwner && cart.length > 0 ? (
                <span>Bayar Rp 0 Khusus Owner (Ganti Shift)</span>
              ) : isCashInsufficient && cashTendered > 0 ? (
                <>
                  <Receipt className="w-4 h-4 text-amber-200 shrink-0" />
                  <span>
                    Bayar Rp {cashTendered.toLocaleString('id-ID')} & Kasbon Rp{' '}
                    {(finalTotal - cashTendered).toLocaleString('id-ID')}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Bayar Sekaligus & Cetak 1 Struk Gabungan</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
