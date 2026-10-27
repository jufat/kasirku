import React, { useState } from 'react';
import {
  Printer,
  Copy,
  Image as ImageIcon,
  FileText,
  Scissors,
  CheckCircle,
  Clock,
  Phone,
  Search,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Receipt,
  Calculator,
  Calendar,
  X,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  Edit2,
  RotateCcw,
  SlidersHorizontal,
  FolderPlus,
  Settings,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import {
  PrintOrder,
  PrintOrderItem,
  PrintOrderStatus,
  PrintServiceCategory,
  PaymentMethod,
  PrintPriceTier,
  PrintServiceItem,
} from '../../types/pos';

export const PercetakanView: React.FC = () => {
  const {
    printOrders,
    addPrintOrder,
    updatePrintOrderStatus,
    deletePrintOrder,
    openReceipt,
    storeProfile,
    printServices,
    addPrintService,
    updatePrintService,
    deletePrintService,
    resetPrintServices,
  } = usePOS();

  // Mobile navigation tab: Form / Calculator vs History & Queue
  const [mobileTab, setMobileTab] = useState<'create' | 'queue'>('create');

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Quick Calculator State
  const [calcServiceId, setCalcServiceId] = useState<string>(() => {
    return printServices[0]?.id || 'srv-print-bw';
  });
  const [calcQty, setCalcQty] = useState<number>(10);
  const [calcSpecNote, setCalcSpecNote] = useState('');
  const [customUnitPrice, setCustomUnitPrice] = useState<number | null>(null);
  const [showTierGuideModal, setShowTierGuideModal] = useState(false);

  // Price Catalog Modal Filters & Search
  const [priceCatalogSearch, setPriceCatalogSearch] = useState('');
  const [priceCatalogCategory, setPriceCatalogCategory] = useState<string>('all');

  // Service Edit / Add State
  const [editingService, setEditingService] = useState<PrintServiceItem | null>(null);
  const [isCreatingNewService, setIsCreatingNewService] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<PrintServiceCategory>('print_dokumen');
  const [formUnit, setFormUnit] = useState('lembar');
  const [formPrice, setFormPrice] = useState<number>(1000);
  const [formDesc, setFormDesc] = useState('');
  const [formTiers, setFormTiers] = useState<PrintPriceTier[]>([]);

  // Active Order Builder State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderItems, setOrderItems] = useState<PrintOrderItem[]>([]);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [deadline, setDeadline] = useState('Hari ini');
  const [fileOrNote, setFileOrNote] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Fallback if no services exist
  const fallbackService: PrintServiceItem = {
    id: 'srv-fallback',
    category: 'print_dokumen',
    name: 'Print HVS Hitam Putih (B/W)',
    price: 750,
    unit: 'lembar',
    desc: 'Kertas HVS 75/80gsm A4/F4',
    tiers: [
      { minQty: 1, price: 750, label: '1 - 20 lbr' },
      { minQty: 21, price: 600, label: '21 - 50 lbr' },
      { minQty: 51, price: 500, label: '51 - 100 lbr' },
      { minQty: 101, price: 400, label: '101+ lbr (Grosir)' },
    ],
  };

  // Current selected service for quick calculator
  const activeCalcService =
    printServices.find((s) => s.id === calcServiceId) || printServices[0] || fallbackService;

  // Helper: Open edit modal
  const handleOpenEditService = (service: PrintServiceItem) => {
    setEditingService(service);
    setIsCreatingNewService(false);
    setFormName(service.name);
    setFormCategory(service.category);
    setFormUnit(service.unit);
    setFormPrice(service.price);
    setFormDesc(service.desc || '');
    setFormTiers(service.tiers ? [...service.tiers.map((t) => ({ ...t }))] : []);
  };

  // Helper: Open create new service modal
  const handleOpenCreateService = () => {
    setEditingService(null);
    setIsCreatingNewService(true);
    setFormName('');
    setFormCategory('print_dokumen');
    setFormUnit('lembar');
    setFormPrice(1000);
    setFormDesc('');
    setFormTiers([
      { minQty: 1, price: 1000, label: '1 - 20 lbr' },
      { minQty: 21, price: 850, label: '21 - 50 lbr' },
      { minQty: 51, price: 700, label: '51 - 100 lbr' },
      { minQty: 101, price: 600, label: '101+ lbr (Grosir)' },
    ]);
  };

  // Helper: Save service changes (Edit or Create)
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Nama layanan percetakan wajib diisi!');
      return;
    }
    if (formPrice <= 0) {
      alert('Harga satuan dasar harus lebih dari 0!');
      return;
    }
    if (!formUnit.trim()) {
      alert('Satuan hitung (cth: lembar, pcs, meter) wajib diisi!');
      return;
    }

    // Clean and sort tiers by minQty ascending
    const cleanedTiers = formTiers
      .filter((t) => t.minQty > 0 && t.price > 0)
      .sort((a, b) => a.minQty - b.minQty);

    if (editingService) {
      const updated: PrintServiceItem = {
        ...editingService,
        name: formName.trim(),
        category: formCategory,
        unit: formUnit.trim(),
        price: formPrice,
        desc: formDesc.trim() || undefined,
        tiers: cleanedTiers.length > 0 ? cleanedTiers : undefined,
      };
      updatePrintService(updated);
      setSuccessToast(`Tarif layanan "${updated.name}" berhasil diperbarui!`);
    } else {
      const added = addPrintService({
        name: formName.trim(),
        category: formCategory,
        unit: formUnit.trim(),
        price: formPrice,
        desc: formDesc.trim() || undefined,
        tiers: cleanedTiers.length > 0 ? cleanedTiers : undefined,
      });
      setCalcServiceId(added.id);
      setCustomUnitPrice(null);
      setSuccessToast(`Layanan cetak baru "${added.name}" berhasil ditambahkan!`);
    }

    setEditingService(null);
    setIsCreatingNewService(false);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Helper: Delete service
  const handleDeleteService = (service: PrintServiceItem) => {
    if (
      confirm(
        `Hapus layanan percetakan "${service.name}" (${service.unit})?\nLayanan ini akan dihapus dari daftar tarif percetakan.`
      )
    ) {
      deletePrintService(service.id);
      if (calcServiceId === service.id) {
        const remaining = printServices.filter((s) => s.id !== service.id);
        if (remaining.length > 0) {
          setCalcServiceId(remaining[0].id);
          setCustomUnitPrice(null);
        }
      }
      setSuccessToast(`Layanan "${service.name}" berhasil dihapus dari daftar tarif.`);
      setTimeout(() => setSuccessToast(''), 4000);
    }
  };

  // Helper: Reset services to default
  const handleResetServices = () => {
    if (
      confirm(
        'Kembalikan seluruh daftar harga percetakan ke tarif standar bawaan Ju-Fat Cell? Layanan yang ditambahkan atau diubah sendiri akan di-reset.'
      )
    ) {
      resetPrintServices();
      setCalcServiceId('srv-print-bw');
      setCustomUnitPrice(null);
      setSuccessToast('Tarif percetakan berhasil dikembalikan ke standar awal Ju-Fat!');
      setTimeout(() => setSuccessToast(''), 4000);
    }
  };

  // Tier helpers in Editor Modal
  const handleAddTierRow = () => {
    const lastTier = formTiers[formTiers.length - 1];
    const nextMinQty = lastTier ? lastTier.minQty + 50 : 20;
    const nextPrice = lastTier
      ? Math.max(100, Math.round((lastTier.price * 0.85) / 50) * 50)
      : Math.max(100, Math.round((formPrice * 0.85) / 50) * 50);
    setFormTiers((prev) => [
      ...prev,
      {
        minQty: nextMinQty,
        price: nextPrice,
        label: `>= ${nextMinQty} ${formUnit || 'unit'}`,
      },
    ]);
  };

  const handleUpdateTierRow = (
    index: number,
    field: keyof PrintPriceTier,
    value: any
  ) => {
    setFormTiers((prev) =>
      prev.map((t, idx) => (idx === index ? { ...t, [field]: value } : t))
    );
  };

  const handleRemoveTierRow = (index: number) => {
    setFormTiers((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Helper: Resolve volume discount tier based on quantity ("semakin banyak semakin murah")
  const resolveServiceTier = (
    service: PrintServiceItem,
    quantity: number
  ) => {
    if (!service.tiers || service.tiers.length === 0) {
      return {
        tierPrice: service.price,
        activeTier: undefined,
        savingsPerUnit: 0,
        discountPercent: 0,
      };
    }
    const sorted = [...service.tiers].sort((a, b) => b.minQty - a.minQty);
    const matched = sorted.find((t) => quantity >= t.minQty);
    const tierPrice = matched ? matched.price : service.price;
    const savingsPerUnit = Math.max(0, service.price - tierPrice);
    const discountPercent =
      service.price > 0 ? Math.round((savingsPerUnit / service.price) * 100) : 0;
    return {
      tierPrice,
      activeTier: matched,
      savingsPerUnit,
      discountPercent,
    };
  };

  const tierInfo = resolveServiceTier(activeCalcService, calcQty);
  const isCustomOverridden =
    customUnitPrice !== null && customUnitPrice !== tierInfo.tierPrice;
  const effectiveUnitPrice =
    customUnitPrice !== null ? customUnitPrice : tierInfo.tierPrice;
  const calcSubtotal = effectiveUnitPrice * (calcQty || 0);
  const totalUnitSavings =
    Math.max(0, activeCalcService.price - effectiveUnitPrice) * (calcQty || 0);

  // Switch service: reset custom price override
  const handleServiceChange = (serviceId: string) => {
    setCalcServiceId(serviceId);
    setCustomUnitPrice(null);
  };

  // Add calculated item to current order
  const handleAddCalculatedToOrder = () => {
    if (calcQty <= 0) {
      alert('Jumlah (Qty) minimal 1!');
      return;
    }

    const newItem: PrintOrderItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      serviceName: activeCalcService.name,
      category: activeCalcService.category as PrintServiceCategory,
      quantity: calcQty,
      unit: activeCalcService.unit,
      pricePerUnit: effectiveUnitPrice,
      basePrice: activeCalcService.price,
      isCustomPrice: isCustomOverridden,
      subtotal: calcSubtotal,
      specNote: calcSpecNote.trim() || undefined,
    };

    setOrderItems((prev) => [...prev, newItem]);
    setCalcSpecNote('');

    // Pre-fill downPayment if not set
    const newTotal = orderItems.reduce((acc, i) => acc + i.subtotal, 0) + calcSubtotal;
    if (downPayment === 0) {
      setDownPayment(newTotal);
    }
  };

  // Inline edit quantity in cart
  const handleUpdateItemQty = (id: string, newQty: number) => {
    const validQty = Math.max(1, newQty);
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        // If not custom price, recalculate tier price for new quantity
        let updatedPrice = item.pricePerUnit;
        const matchingSrv = printServices.find((s) => s.name === item.serviceName);
        if (matchingSrv && !item.isCustomPrice) {
          const tInfo = resolveServiceTier(matchingSrv, validQty);
          updatedPrice = tInfo.tierPrice;
        }
        return {
          ...item,
          quantity: validQty,
          pricePerUnit: updatedPrice,
          subtotal: updatedPrice * validQty,
        };
      })
    );
  };

  // Inline edit unit price in cart (flexible cashier negotiation)
  const handleUpdateItemPrice = (id: string, newPrice: number) => {
    const validPrice = Math.max(0, newPrice);
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          pricePerUnit: validPrice,
          isCustomPrice: true,
          subtotal: validPrice * item.quantity,
        };
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setOrderItems((prev) => prev.filter((i) => i.id !== id));
  };

  const totalOrderAmount = orderItems.reduce((acc, i) => acc + i.subtotal, 0);
  const remainingBill = Math.max(0, totalOrderAmount - downPayment);

  // Submit complete order
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (orderItems.length === 0) {
      alert('Tambahkan minimal 1 item layanan percetakan ke dalam daftar!');
      return;
    }

    if (!customerName.trim()) {
      alert('Nama pelanggan percetakan wajib diisi!');
      return;
    }

    const order = addPrintOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || '-',
      items: orderItems,
      totalAmount: totalOrderAmount,
      downPayment: Math.min(downPayment, totalOrderAmount),
      remainingAmount: remainingBill,
      paymentMethod,
      status: 'antrean',
      deadline: deadline.trim() || undefined,
      fileOrNote: fileOrNote.trim() || undefined,
    });

    setSuccessToast(`Pesanan Percetakan ${order.id} berhasil dicatat & masuk antrean!`);
    setTimeout(() => setSuccessToast(''), 4500);

    // Reset Form
    setCustomerName('');
    setCustomerPhone('');
    setOrderItems([]);
    setDownPayment(0);
    setFileOrNote('');
    setMobileTab('queue'); // Switch to queue on mobile
  };

  // Filtered orders list
  const filteredOrders = printOrders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((i) => i.serviceName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Service Category Chips
  const categoryFilters = [
    { id: 'all', label: 'Semua Layanan', icon: Layers },
    { id: 'print_dokumen', label: 'Print Dokumen', icon: FileText },
    { id: 'fotokopi', label: 'Fotokopi HVS', icon: Copy },
    { id: 'cetak_foto', label: 'Cetak Pas Foto & Polaroid', icon: ImageIcon },
    { id: 'banner_spanduk', label: 'Banner & Spanduk', icon: Printer },
    { id: 'stiker_label', label: 'Stiker & Label', icon: Tag },
    { id: 'jilid_laminating', label: 'Jilid & Laminating', icon: Scissors },
    { id: 'kartu_nama_id', label: 'Kartu Nama & Nota', icon: CreditCard },
  ];

  const filteredPriceList = printServices.filter((item) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'kartu_nama_id') {
      return item.category === 'kartu_nama_id' || item.category === 'undangan_nota';
    }
    return item.category === selectedCategory;
  });

  // Metrics for counters
  const antreanCount = printOrders.filter((o) => o.status === 'antrean').length;
  const prosesCount = printOrders.filter((o) => o.status === 'proses').length;
  const selesaiCount = printOrders.filter((o) => o.status === 'selesai').length;
  const totalOmzetPercetakan = printOrders.reduce((acc, o) => acc + o.totalAmount, 0);

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#f8fafc]">
      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex items-center bg-white border-b border-slate-200 p-2 shrink-0">
        <div className="grid grid-cols-2 w-full p-1 bg-slate-100 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setMobileTab('create')}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'create'
                ? 'bg-white text-teal-900 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-teal-600" />
            <span>Pesan & Kalkulator</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('queue')}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'queue'
                ? 'bg-white text-teal-900 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Antrean Order ({printOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Left Column: Percetakan Order Form & Price Calculator */}
      <div
        className={`${
          mobileTab === 'create' ? 'flex' : 'hidden'
        } md:flex w-full md:w-[480px] lg:w-[500px] bg-white md:border-r border-slate-200 flex-col h-full shadow-xs shrink-0 overflow-y-auto`}
      >
        {/* Terminal Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-700 via-teal-700 to-emerald-700 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-md">
                <Printer className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold tracking-tight">Percetakan & Copy</h3>
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-300 text-amber-950 uppercase tracking-wider">
                    Ju-Fat Print
                  </span>
                </div>
                <p className="text-[11px] text-teal-100">
                  Print, Fotokopi, Pas Foto, Banner Spanduk, Stiker & Jilid
                </p>
              </div>
            </div>

            <div className="text-right text-[10px] text-teal-100 font-mono">
              <span className="bg-white/20 px-2 py-1 rounded-md font-bold block">
                {antreanCount + prosesCount} Antrean Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-3.5 sm:p-5 space-y-4 flex-1">
          {successToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-bold animate-fade-in shadow-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Quick Price Calculator & Item Adder */}
          <div className="bg-indigo-50/60 rounded-2xl border border-indigo-200/90 p-3.5 sm:p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-950 font-extrabold text-xs">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <span>Kalkulator & Pilihan Layanan Percetakan</span>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full font-mono">
                Tarif Resmi
              </span>
            </div>

            {/* Service Dropdown & Tier Guide Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Pilih Jenis Layanan / Produk Cetak:
                </label>
                <button
                  type="button"
                  onClick={() => setShowTierGuideModal(true)}
                  className="text-[10px] text-indigo-700 hover:text-indigo-900 font-bold underline cursor-pointer flex items-center gap-1"
                >
                  <Tag className="w-3 h-3" />
                  <span>Daftar & Kelola Harga</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <select
                  value={calcServiceId}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-white border border-indigo-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {printServices.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.name} — Rp {srv.price.toLocaleString('id-ID')} / {srv.unit}
                    </option>
                  ))}
                </select>

                {/* Quick Action: Edit This Service */}
                <button
                  type="button"
                  onClick={() => handleOpenEditService(activeCalcService)}
                  className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0"
                  title="Ubah harga & tingkat grosir layanan ini"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                  <span className="text-[10px] font-bold hidden sm:inline">Ubah</span>
                </button>

                {/* Quick Action: Delete This Service */}
                <button
                  type="button"
                  onClick={() => handleDeleteService(activeCalcService)}
                  className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 rounded-xl transition cursor-pointer shrink-0"
                  title="Hapus layanan ini dari daftar harga"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Quick Action: Add New Service */}
                <button
                  type="button"
                  onClick={handleOpenCreateService}
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1 shrink-0"
                  title="Tambah layanan cetak baru"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="text-[10px] font-bold hidden sm:inline">Tambah</span>
                </button>
              </div>

              {/* Quick description badge of active service */}
              {activeCalcService.desc && (
                <div className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                  <span>ℹ️ Spesifikasi:</span>
                  <span className="italic text-slate-700">{activeCalcService.desc}</span>
                </div>
              )}
            </div>

            {/* Volume Pricing Tiers Banner ("Semakin Banyak Semakin Murah") */}
            {activeCalcService.tiers && activeCalcService.tiers.length > 0 && (
              <div className="space-y-1.5 p-2.5 bg-white rounded-xl border border-indigo-200">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-extrabold text-indigo-950 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Tingkat Harga Grosir (Semakin Banyak Semakin Murah):</span>
                  </span>
                  <span className="text-slate-500 font-medium">Klik untuk terapkan Qty</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {activeCalcService.tiers.map((t: PrintPriceTier) => {
                    const isActive = tierInfo.activeTier?.minQty === t.minQty && !isCustomOverridden;
                    const discount =
                      activeCalcService.price > t.price
                        ? Math.round(((activeCalcService.price - t.price) / activeCalcService.price) * 100)
                        : 0;

                    return (
                      <button
                        key={t.minQty}
                        type="button"
                        onClick={() => {
                          setCalcQty(t.minQty);
                          setCustomUnitPrice(null);
                        }}
                        className={`p-1.5 rounded-lg border text-left transition cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/40 text-emerald-950 shadow-xs'
                            : 'bg-slate-50 hover:bg-indigo-50/60 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold">{t.label || `>= ${t.minQty} ${activeCalcService.unit}`}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          )}
                        </div>
                        <div className="text-[11px] font-mono font-extrabold text-slate-900 mt-0.5">
                          Rp {t.price.toLocaleString('id-ID')}
                        </div>
                        {discount > 0 ? (
                          <div className="text-[9px] font-bold text-emerald-700">
                            Hemat {discount}% (Rp {(activeCalcService.price - t.price).toLocaleString('id-ID')})
                          </div>
                        ) : (
                          <div className="text-[9px] text-slate-400">Harga Standar</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity and Flexible Unit Price (Nego / Custom) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Quantity Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Jumlah / Qty ({activeCalcService.unit}):
                  </label>
                  <span className="text-[10px] font-mono text-indigo-700 font-bold">
                    {calcQty} {activeCalcService.unit}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCalcQty((prev) => Math.max(1, prev - 1))}
                    className="w-8 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base flex items-center justify-center cursor-pointer border border-slate-200"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={calcQty || ''}
                    onChange={(e) => setCalcQty(Math.max(1, Number(e.target.value) || 0))}
                    className="flex-1 px-2.5 py-1.5 text-center text-sm font-mono font-black bg-white border border-indigo-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCalcQty((prev) => prev + 1)}
                    className="w-8 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base flex items-center justify-center cursor-pointer border border-slate-200"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Flexible Unit Price (Editable / Nego Kasir) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Harga Satuan ({activeCalcService.unit}):
                  </label>
                  {isCustomOverridden ? (
                    <button
                      type="button"
                      onClick={() => setCustomUnitPrice(null)}
                      className="text-[9px] text-amber-700 hover:underline font-bold cursor-pointer"
                      title="Kembalikan ke harga grosir otomatis"
                    >
                      🔄 Reset Otomatis
                    </button>
                  ) : (
                    <span className="text-[9px] text-emerald-700 font-bold">
                      {tierInfo.savingsPerUnit > 0 ? `Hemat Rp ${tierInfo.savingsPerUnit.toLocaleString('id-ID')}` : 'Harga Resmi'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={effectiveUnitPrice || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCustomUnitPrice(isNaN(val) ? 0 : val);
                    }}
                    placeholder="0"
                    className={`w-full pl-8 pr-16 py-1.5 text-sm font-mono font-extrabold rounded-lg border focus:outline-none focus:ring-2 ${
                      isCustomOverridden
                        ? 'bg-amber-50 border-amber-400 text-amber-950 focus:ring-amber-500'
                        : 'bg-white border-indigo-300 text-slate-900 focus:ring-indigo-500'
                    }`}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">
                    /{activeCalcService.unit}
                  </span>
                </div>
                {isCustomOverridden && (
                  <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                    ✏️ Harga kustom / nego manual kasir aktif
                  </p>
                )}
              </div>
            </div>

            {/* Quick Qty Presets & Increments */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              <span className="text-[10px] text-slate-500 font-semibold shrink-0">Pilihan Qty:</span>
              {[1, 5, 10, 20, 50, 100, 250, 500].map((qtyVal) => (
                <button
                  key={qtyVal}
                  type="button"
                  onClick={() => setCalcQty(qtyVal)}
                  className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg border transition cursor-pointer shrink-0 ${
                    calcQty === qtyVal
                      ? 'bg-indigo-600 text-white border-indigo-700'
                      : 'bg-white hover:bg-slate-100 border-indigo-200 text-slate-700'
                  }`}
                >
                  {qtyVal}
                </button>
              ))}
              <div className="h-3 w-px bg-slate-200 mx-1 shrink-0" />
              {[10, 50, 100].map((inc) => (
                <button
                  key={`+${inc}`}
                  type="button"
                  onClick={() => setCalcQty((prev) => prev + inc)}
                  className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 transition cursor-pointer shrink-0"
                >
                  +{inc}
                </button>
              ))}
            </div>

            {/* Subtotal & Volume Discount Summary Banner */}
            <div className="p-3 bg-white rounded-xl border border-indigo-200 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">
                  Subtotal Kalkulator:
                </span>
                <div className="text-base font-black font-mono text-indigo-900 tabular-nums">
                  Rp {calcSubtotal.toLocaleString('id-ID')}
                </div>
                {totalUnitSavings > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Hemat Total Rp {totalUnitSavings.toLocaleString('id-ID')} dari harga eceran!</span>
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-medium block">
                  Per {activeCalcService.unit}:
                </span>
                <span className="text-xs font-mono font-bold text-slate-800">
                  Rp {effectiveUnitPrice.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Specific Note (e.g. Ukuran, Kertas, Laminasi) */}
            <div>
              <input
                type="text"
                value={calcSpecNote}
                onChange={(e) => setCalcSpecNote(e.target.value)}
                placeholder="Catatan spesifikasi (cth: Kertas A4 80gr, Bolak-balik, Mata Ayam 4 sudut)..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-indigo-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Add to order ticket button */}
            <button
              type="button"
              onClick={handleAddCalculatedToOrder}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Masukkan ke Daftar Pesanan Cetak</span>
            </button>
          </div>

          {/* Active Order Ticket Form */}
          <form onSubmit={handleSubmitOrder} className="space-y-3.5">
            <div className="border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-teal-600" />
                  <span>Daftar Item Pesanan ({orderItems.length})</span>
                </span>
                {orderItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setOrderItems([])}
                    className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                  >
                    Kosongkan
                  </button>
                )}
              </div>

              {orderItems.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500 space-y-1">
                  <Printer className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="font-semibold text-slate-700">Belum ada item percetakan ditambahkan</p>
                  <p className="text-[11px]">
                    Gunakan kalkulator fleksibel di atas untuk memilih layanan & klik "Masukkan ke Daftar".
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 leading-tight">
                            {item.serviceName}
                          </div>
                          {item.specNote && (
                            <div className="text-[10px] text-indigo-700 font-medium mt-0.5">
                              Catatan: {item.specNote}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Hapus item"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Flexible Inline Controls: Qty and Price per unit */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/80 items-center">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500 font-bold">Qty:</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(item.id, item.quantity - 1)}
                            className="w-5 h-6 rounded bg-white border border-slate-300 text-slate-700 font-bold flex items-center justify-center cursor-pointer hover:bg-slate-100"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemQty(item.id, Number(e.target.value) || 1)}
                            className="w-12 text-center py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(item.id, item.quantity + 1)}
                            className="w-5 h-6 rounded bg-white border border-slate-300 text-slate-700 font-bold flex items-center justify-center cursor-pointer hover:bg-slate-100"
                          >
                            +
                          </button>
                          <span className="text-[10px] text-slate-500">{item.unit}</span>
                        </div>

                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[10px] text-slate-500 font-bold">@Rp:</span>
                          <input
                            type="number"
                            min="0"
                            value={item.pricePerUnit}
                            onChange={(e) => handleUpdateItemPrice(item.id, Number(e.target.value) || 0)}
                            className="w-20 text-right py-0.5 px-1 bg-white border border-indigo-300 rounded font-mono font-bold text-xs focus:ring-1 focus:ring-indigo-500"
                            title="Harga satuan fleksibel (bisa diketik bebas untuk nego)"
                          />
                        </div>
                      </div>

                      {/* Subtotal and savings tag */}
                      <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-200">
                        <div className="flex items-center gap-1.5">
                          {item.isCustomPrice ? (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-100 text-amber-900">
                              Nego Kasir
                            </span>
                          ) : item.basePrice && item.pricePerUnit < item.basePrice ? (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-100 text-emerald-900">
                              Grosir Volume (Hemat Rp {(item.basePrice - item.pricePerUnit) * item.quantity})
                            </span>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-slate-900 text-xs">
                            Rp {item.subtotal.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Pelanggan:
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Bu Rina"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  No. WhatsApp / HP:
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tenggat / Deadline Ambil:
                </label>
                <input
                  type="text"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="Hari ini 17:00 WIB"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Metode Pembayaran DP:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="tunai">Tunai (Cash Drawer)</option>
                  <option value="qris">QRIS Standar</option>
                  <option value="transfer">Transfer Bank</option>
                  <option value="hutang">Hutang / Tempo (Nanti)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Catatan File / Permintaan Khusus:
              </label>
              <input
                type="text"
                value={fileOrNote}
                onChange={(e) => setFileOrNote(e.target.value)}
                placeholder="Cth: File PDF di WA, cetak pas foto baju putih background merah"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            {/* Financial Summary Box */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-baseline justify-between font-bold text-slate-800">
                <span>Total Biaya Cetak:</span>
                <span className="text-base font-black font-mono text-slate-900">
                  Rp {totalOrderAmount.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-semibold">Uang Muka / DP Dibayar:</span>
                <div className="flex items-center gap-1 font-mono">
                  <span className="text-slate-400 font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={downPayment || ''}
                    onChange={(e) => setDownPayment(Math.min(totalOrderAmount, Number(e.target.value) || 0))}
                    className="w-28 text-right px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-extrabold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Quick DP Buttons */}
              <div className="flex items-center justify-end gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setDownPayment(0)}
                  className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                >
                  DP 0 (Nanti)
                </button>
                <button
                  type="button"
                  onClick={() => setDownPayment(Math.round(totalOrderAmount / 2))}
                  className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                >
                  DP 50%
                </button>
                <button
                  type="button"
                  onClick={() => setDownPayment(totalOrderAmount)}
                  className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                >
                  Lunas (100%)
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold">
                <span className={remainingBill > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                  {remainingBill > 0 ? 'Sisa Tagihan Pelunasan:' : 'Status Order:'}
                </span>
                <span className="font-mono text-sm">
                  {remainingBill > 0 ? `Rp ${remainingBill.toLocaleString('id-ID')}` : 'LUNAS (LENGKAP)'}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={orderItems.length === 0}
              className={`w-full py-3 rounded-xl font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
                orderItems.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 text-white shadow-teal-900/20'
              }`}
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Simpan Pesanan & Cetak Nota Percetakan</span>
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Antrean Pesanan Percetakan & Katalog Tarif */}
      <div
        className={`${
          mobileTab === 'queue' ? 'flex' : 'hidden'
        } md:flex flex-1 flex-col h-full bg-[#f8fafc] overflow-hidden min-w-0`}
      >
        {/* Top Header Metrics & Search */}
        <div className="p-3.5 sm:p-5 bg-white border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Antrean & Manajemen Order Percetakan
              </h3>
              <p className="text-xs text-slate-500">
                Pantau status pengerjaan print, fotokopi, cetak banner & spanduk Ju-Fat Cell
              </p>
            </div>

            {/* Quick Summary Pill */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-xl bg-amber-100 text-amber-900 border border-amber-200">
                {antreanCount} Antrean
              </span>
              <span className="px-2.5 py-1 text-xs font-bold rounded-xl bg-blue-100 text-blue-900 border border-blue-200">
                {prosesCount} Proses
              </span>
              <span className="px-2.5 py-1 text-xs font-bold rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-200">
                {selesaiCount} Siap Ambil
              </span>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pelanggan, nomor HP, atau No. Order..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
              {[
                { id: 'all', label: 'Semua Status' },
                { id: 'antrean', label: 'Antrean' },
                { id: 'proses', label: 'Proses' },
                { id: 'selesai', label: 'Siap Ambil' },
                { id: 'diambil', label: 'Selesai / Diambil' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 cursor-pointer ${
                    statusFilter === st.id
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List Container */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Printer className="w-12 h-12 stroke-[1.5] text-slate-300" />
              <p className="text-sm font-bold text-slate-700">Tidak ada order percetakan ditemukan</p>
              <p className="text-xs text-slate-400">
                {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Tambahkan pesanan cetak baru melalui formulir'}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const remaining = Math.max(0, order.totalAmount - order.downPayment);
              const isLunas = remaining === 0;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:shadow-md transition space-y-3"
                >
                  {/* Top Bar: Order ID, Date, Customer & Status */}
                  <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                          {order.id}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {order.date}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 pt-0.5">
                        {order.customerName}
                      </h4>
                      {order.customerPhone && order.customerPhone !== '-' && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{order.customerPhone}</span>
                          <a
                            href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Halo Kak ${order.customerName}, info dari Ju-Fat Cell: Pesanan percetakan Anda ${order.id} saat ini berstatus ${order.status.toUpperCase()}. Terima kasih!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:text-emerald-800 text-[11px] font-bold underline flex items-center gap-0.5 ml-1"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Status Badge & Actions */}
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`px-2.5 py-1 text-xs font-black rounded-lg uppercase tracking-wider ${
                          order.status === 'antrean'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : order.status === 'proses'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : order.status === 'selesai'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 animate-pulse'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {order.status === 'antrean'
                          ? '⏳ ANTREAN CETAK'
                          : order.status === 'proses'
                          ? '⚙️ SEDANG DIPROSES'
                          : order.status === 'selesai'
                          ? '✨ SELESAI (SIAP AMBIL)'
                          : '✓ SUDAH DIAMBIL'}
                      </span>

                      {order.deadline && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          Deadline: {order.deadline}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-slate-800">{item.serviceName}</span>
                          <span className="text-slate-500 text-[11px] ml-1.5">
                            ({item.quantity} {item.unit})
                          </span>
                          {item.specNote && (
                            <span className="text-[11px] text-indigo-700 italic block">
                              [{item.specNote}]
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-extrabold text-slate-900 shrink-0">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                    {order.fileOrNote && (
                      <div className="pt-1.5 mt-1 border-t border-slate-200 text-[11px] text-slate-600">
                        <span className="font-bold text-slate-700">Catatan/File:</span> {order.fileOrNote}
                      </div>
                    )}
                  </div>

                  {/* Bottom Financial & Operational Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Total Biaya:</span>
                        <span className="font-mono font-black text-sm text-slate-900">
                          Rp {order.totalAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="border-l border-slate-200 pl-3">
                        <span className="text-[10px] text-slate-500 block">DP Masuk:</span>
                        <span className="font-mono font-bold text-xs text-emerald-800">
                          Rp {order.downPayment.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="border-l border-slate-200 pl-3">
                        <span className="text-[10px] text-slate-500 block">Sisa Tagihan:</span>
                        <span
                          className={`font-mono font-extrabold text-xs ${
                            remaining > 0 ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {remaining > 0 ? `Rp ${remaining.toLocaleString('id-ID')}` : 'Lunas'}
                        </span>
                      </div>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {order.status === 'antrean' && (
                        <button
                          type="button"
                          onClick={() => updatePrintOrderStatus(order.id, 'proses')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        >
                          Mulai Proses Cetak
                        </button>
                      )}

                      {order.status === 'proses' && (
                        <button
                          type="button"
                          onClick={() => updatePrintOrderStatus(order.id, 'selesai')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        >
                          Tandai Selesai Cetak
                        </button>
                      )}

                      {order.status === 'selesai' && (
                        <button
                          type="button"
                          onClick={() => updatePrintOrderStatus(order.id, 'diambil')}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        >
                          {remaining > 0 ? `Pelunasan & Serahkan` : `Serahkan ke Pelanggan`}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openReceipt(order)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                        title="Cetak Struk Thermal"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus order percetakan ${order.id}?`)) {
                            deletePrintOrder(order.id);
                          }
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                        title="Hapus order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL KATALOG & MANAJEMEN TARIF PERCETAKAN (EDIT & HAPUS HARGA)        */}
      {/* ========================================================================= */}
      {showTierGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden my-auto animate-scale-up flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-700 via-teal-700 to-emerald-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-tight">
                    Katalog & Manajemen Tarif Percetakan
                  </h3>
                  <p className="text-[11px] text-teal-100">
                    Atur harga eceran, tingkat grosir volume, tambah layanan baru atau hapus tarif
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTierGuideModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Sub-Header Toolbar: Search, Filters & Actions */}
            <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 space-y-2.5 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={priceCatalogSearch}
                    onChange={(e) => setPriceCatalogSearch(e.target.value)}
                    placeholder="Cari nama layanan, bahan, atau satuan cetak..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {priceCatalogSearch && (
                    <button
                      type="button"
                      onClick={() => setPriceCatalogSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenCreateService();
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Tambah Layanan Baru</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetServices}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                    title="Kembalikan semua tarif ke standar pabrik Ju-Fat"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Reset Standar</span>
                  </button>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
                {[
                  { id: 'all', label: 'Semua Layanan' },
                  { id: 'print_dokumen', label: 'Print Dokumen' },
                  { id: 'fotokopi', label: 'Fotokopi HVS' },
                  { id: 'cetak_foto', label: 'Pas Foto & Polaroid' },
                  { id: 'banner_spanduk', label: 'Banner & Spanduk' },
                  { id: 'stiker_label', label: 'Stiker & Label' },
                  { id: 'jilid_laminating', label: 'Jilid & Laminating' },
                  { id: 'kartu_nama_id', label: 'Kartu Nama & Nota' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setPriceCatalogCategory(cat.id)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition shrink-0 cursor-pointer ${
                      priceCatalogCategory === cat.id
                        ? 'bg-indigo-700 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body: Cards List */}
            <div className="p-3 sm:p-5 space-y-3 overflow-y-auto flex-1">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Prinsip Grosir Ju-Fat Print:</span> Setiap layanan dapat memiliki beberapa tingkat harga (tier). Semakin banyak pelanggan mencetak, harga per lembar/meter otomatis semakin murah. Klik tombol <b>"Ubah Harga"</b> untuk menyesuaikan tarif atau <b>"Hapus"</b> untuk membuang layanan.
                </div>
              </div>

              {(() => {
                const list = printServices.filter((srv) => {
                  const matchesCat =
                    priceCatalogCategory === 'all'
                      ? true
                      : priceCatalogCategory === 'kartu_nama_id'
                      ? srv.category === 'kartu_nama_id' || srv.category === 'undangan_nota'
                      : srv.category === priceCatalogCategory;
                  const query = priceCatalogSearch.toLowerCase().trim();
                  const matchesSearch =
                    !query ||
                    srv.name.toLowerCase().includes(query) ||
                    (srv.desc && srv.desc.toLowerCase().includes(query)) ||
                    srv.unit.toLowerCase().includes(query);
                  return matchesCat && matchesSearch;
                });

                if (list.length === 0) {
                  return (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-2">
                      <Printer className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-bold text-slate-700 text-xs">
                        Tidak ada layanan cetak yang sesuai
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Coba ubah kata kunci pencarian atau klik "+ Tambah Layanan Baru".
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenCreateService}
                        className="mt-2 px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        + Tambah Layanan Baru Sekarang
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {list.map((srv) => (
                      <div
                        key={srv.id}
                        className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-2xs hover:border-indigo-300 transition"
                      >
                        {/* Top: Name, Category, Price & Actions */}
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                                {srv.name}
                              </h4>
                              <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                                {srv.category.replace('_', ' ')}
                              </span>
                            </div>
                            {srv.desc && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{srv.desc}</p>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-medium">
                              Harga Standar (Eceran):
                            </span>
                            <span className="text-sm font-black font-mono text-indigo-900">
                              Rp {srv.price.toLocaleString('id-ID')}
                              <span className="text-[10px] text-slate-500 font-normal ml-0.5">
                                /{srv.unit}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Tiers Grid */}
                        <div className="pt-1">
                          <div className="text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                            <span>Tingkat Harga Grosir ({srv.unit}):</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {srv.tiers && srv.tiers.length > 0 ? (
                              srv.tiers.map((t: PrintPriceTier) => {
                                const disc =
                                  srv.price > t.price
                                    ? Math.round(((srv.price - t.price) / srv.price) * 100)
                                    : 0;
                                return (
                                  <div
                                    key={t.minQty}
                                    className={`p-2 rounded-xl border text-xs ${
                                      disc > 0
                                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                                        : 'bg-slate-50 border-slate-200 text-slate-800'
                                    }`}
                                  >
                                    <div className="font-bold text-[10px] text-slate-600">
                                      {t.label || `>= ${t.minQty} ${srv.unit}`}
                                    </div>
                                    <div className="font-mono font-black text-xs text-slate-900 mt-0.5">
                                      Rp {t.price.toLocaleString('id-ID')}
                                    </div>
                                    {disc > 0 ? (
                                      <span className="text-[9px] font-bold text-emerald-700 block">
                                        Hemat {disc}% (Rp {(srv.price - t.price).toLocaleString('id-ID')})
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-slate-400 block">Harga Normal</span>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="col-span-4 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono font-medium text-slate-600">
                                Tarif Tetap / Flat (tanpa potongan grosir volume)
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Action Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditService(srv)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 transition flex items-center gap-1 cursor-pointer"
                              title="Ubah nama, kategori, harga standar & tingkat grosir"
                            >
                              <Edit2 className="w-3 h-3 text-amber-700" />
                              <span>Ubah Harga</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteService(srv)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 transition flex items-center gap-1 cursor-pointer"
                              title="Hapus layanan ini dari daftar tarif"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Hapus</span>
                            </button>
                          </div>

                          {/* Select into Calculator */}
                          <button
                            type="button"
                            onClick={() => {
                              setCalcServiceId(srv.id);
                              setCustomUnitPrice(null);
                              setShowTierGuideModal(false);
                            }}
                            className="px-3 py-1 text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <span>Pilih ke Kalkulator</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500 font-medium">
                Total {printServices.length} layanan percetakan tersimpan
              </span>
              <button
                type="button"
                onClick={() => setShowTierGuideModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Tutup Katalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL FORM: TAMBAH / UBAH HARGA & LAYANAN PERCETAKAN                   */}
      {/* ========================================================================= */}
      {(editingService !== null || isCreatingNewService) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden my-auto animate-scale-up flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-amber-600 via-indigo-700 to-teal-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-black">
                  {editingService ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5 stroke-[2.5]" />}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-tight">
                    {editingService ? 'Ubah Tarif & Layanan Percetakan' : 'Tambah Layanan Percetakan Baru'}
                  </h3>
                  <p className="text-[11px] text-indigo-100">
                    {editingService
                      ? `Menyesuaikan harga eceran & grosir untuk: ${editingService.name}`
                      : 'Isi detail layanan, harga dasar, dan tingkat diskon grosir'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingService(null);
                  setIsCreatingNewService(false);
                }}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveService} className="flex flex-col overflow-hidden flex-1">
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                {/* Field: Name */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nama Layanan Cetak: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Print HVS Warna, Cetak Banner Flexi 280gr..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Field: Category & Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Kategori Layanan:
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as PrintServiceCategory)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="print_dokumen">Print Dokumen</option>
                      <option value="fotokopi">Fotokopi HVS</option>
                      <option value="cetak_foto">Cetak Pas Foto & Polaroid</option>
                      <option value="banner_spanduk">Banner & Spanduk Outdoor</option>
                      <option value="stiker_label">Stiker & Label Produk</option>
                      <option value="jilid_laminating">Jilid Buku & Laminating</option>
                      <option value="kartu_nama_id">Kartu Nama & ID Card</option>
                      <option value="undangan_nota">Nota & Undangan</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Satuan Hitung: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      placeholder="lembar, meter, pcs, rim, buku..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Field: Base Price */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Harga Satuan Standar / Eceran (Rp): <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500">Berlaku untuk Qty awal (1 - tier pertama)</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      min="50"
                      step="50"
                      value={formPrice || ''}
                      onChange={(e) => setFormPrice(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="1000"
                      className="w-full pl-9 pr-16 py-2 text-sm font-mono font-black bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      /{formUnit || 'unit'}
                    </span>
                  </div>
                </div>

                {/* Field: Description / Material spec */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Keterangan Bahan / Spesifikasi Teknis:
                  </label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Contoh: Kertas HVS 75gsm A4/F4, Tinta pigment anti air..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Field: Volume Tiers (Semakin Banyak Semakin Murah) */}
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Tingkat Harga Grosir (Semakin Banyak Semakin Murah)</span>
                      </span>
                      <p className="text-[10px] text-slate-500">
                        Atur harga otomatis lebih murah ketika pelanggan memesan dalam jumlah tertentu
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddTierRow}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-800 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      <span>+ Tambah Tier</span>
                    </button>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex items-center gap-1 flex-wrap text-[10px]">
                    <span className="text-slate-500 font-semibold">Terapkan Preset:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormTiers([
                          { minQty: 1, price: formPrice, label: `1 - 20 ${formUnit}` },
                          { minQty: 21, price: Math.round(formPrice * 0.8 / 50) * 50, label: `21 - 50 ${formUnit}` },
                          { minQty: 51, price: Math.round(formPrice * 0.67 / 50) * 50, label: `51 - 100 ${formUnit}` },
                          { minQty: 101, price: Math.round(formPrice * 0.55 / 50) * 50, label: `101+ ${formUnit} (Grosir)` },
                        ]);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium cursor-pointer"
                    >
                      4 Tingkat Grosir
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormTiers([
                          { minQty: 1, price: formPrice, label: `1 - 5 ${formUnit}` },
                          { minQty: 6, price: Math.round(formPrice * 0.88 / 500) * 500, label: `6 - 15 ${formUnit}` },
                          { minQty: 16, price: Math.round(formPrice * 0.76 / 500) * 500, label: `16+ ${formUnit}` },
                        ]);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium cursor-pointer"
                    >
                      Spanduk / Banner
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormTiers([])}
                      className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium cursor-pointer"
                    >
                      Hapus Semua (Tarif Flat)
                    </button>
                  </div>

                  {/* Tiers List / Inputs */}
                  {formTiers.length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
                      Layanan ini menggunakan tarif flat (Rp {formPrice.toLocaleString('id-ID')} /{formUnit} untuk semua jumlah).
                      Klik <b>"+ Tambah Tier"</b> atau <b>"4 Tingkat Grosir"</b> untuk mengaktifkan potongan volume.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase px-1">
                        <span className="col-span-3">Minimal Qty</span>
                        <span className="col-span-4">Harga Satuan (Rp)</span>
                        <span className="col-span-4">Label Tampilan</span>
                        <span className="col-span-1 text-center">Aksi</span>
                      </div>

                      {formTiers.map((tier, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-50 border border-slate-200 rounded-xl"
                        >
                          <div className="col-span-3">
                            <input
                              type="number"
                              min="1"
                              value={tier.minQty}
                              onChange={(e) =>
                                handleUpdateTierRow(idx, 'minQty', Number(e.target.value) || 1)
                              }
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-center"
                              placeholder="Min Qty"
                            />
                          </div>

                          <div className="col-span-4">
                            <input
                              type="number"
                              min="0"
                              step="50"
                              value={tier.price}
                              onChange={(e) =>
                                handleUpdateTierRow(idx, 'price', Number(e.target.value) || 0)
                              }
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-right text-indigo-900"
                              placeholder="Harga"
                            />
                          </div>

                          <div className="col-span-4">
                            <input
                              type="text"
                              value={tier.label || ''}
                              onChange={(e) =>
                                handleUpdateTierRow(idx, 'label', e.target.value)
                              }
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                              placeholder={`Cth: >= ${tier.minQty} ${formUnit}`}
                            />
                          </div>

                          <div className="col-span-1 flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveTierRow(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="Hapus baris tier ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Footer Buttons */}
              <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingService(null);
                    setIsCreatingNewService(false);
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-md transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  <span>{editingService ? 'Simpan Perubahan Tarif' : 'Tambahkan Layanan Baru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
