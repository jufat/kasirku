import React, { useState, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  Tag,
  CheckCircle,
  X,
  FileSpreadsheet,
  Download,
  Upload,
  Layers,
  FolderPlus,
  Sparkles,
  Info,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  Check,
  ShoppingCart,
  DollarSign,
  Wallet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { usePOS } from '../../context/POSContext';
import { Product, ProductCategory } from '../../types/pos';

export const StokKategoriView: React.FC = () => {
  const {
    products,
    categories,
    addCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    restockProduct,
    importProductsFromExcel,
    exportProductsToExcel,
    downloadExcelTemplate,
    addCashMutation,
    drawerCashBalance,
  } = usePOS();

  const [selectedCat, setSelectedCat] = useState<string>('Semua');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'needs_restock' | 'out_of_stock' | 'low_stock' | 'safe'>('all');
  const [search, setSearch] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Quick Restock Modal state
  const [restockTarget, setRestockTarget] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockNewHpp, setRestockNewHpp] = useState<number>(0);
  const [restockSupplier, setRestockSupplier] = useState<string>('Distributor Konter');
  const [restockDeductCash, setRestockDeductCash] = useState<boolean>(false);
  const [restockFeedback, setRestockFeedback] = useState<string>('');

  // New single product form state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState<string>(categories[0] || 'Kabel & Charger');
  const [hpp, setHpp] = useState<number>(20000);
  const [price, setPrice] = useState<number>(35000);
  const [stock, setStock] = useState<number>(10);
  const [minStock, setMinStock] = useState<number>(5);
  const [unit, setUnit] = useState('pcs');

  // Category management form
  const [newCatName, setNewCatName] = useState('');
  const [catMsg, setCatMsg] = useState('');

  // Excel Import state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelParsedProducts, setExcelParsedProducts] = useState<Omit<Product, 'id'>[]>([]);
  const [importNotice, setImportNotice] = useState('');

  const unitProfit = price - hpp;
  const profitMarginPercent = hpp > 0 ? Math.round((unitProfit / hpp) * 100) : 0;

  const allCategories = ['Semua', ...categories];

  // Stock Analytics & Health
  const totalItems = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const totalAssetHpp = products.reduce((acc, p) => acc + p.stock * p.hpp, 0);
  const totalPotentialRevenue = products.reduce((acc, p) => acc + p.stock * p.price, 0);
  const totalPotentialProfit = totalPotentialRevenue - totalAssetHpp;

  const outOfStockProducts = products.filter((p) => p.stock <= 0);
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= p.minStock);
  const criticalProducts = [...outOfStockProducts, ...lowStockProducts];
  const safeProducts = products.filter((p) => p.stock > p.minStock);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCat === 'Semua' || p.category === selectedCat;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));

    let matchesStockStatus = true;
    if (stockStatusFilter === 'needs_restock') {
      matchesStockStatus = p.stock <= p.minStock;
    } else if (stockStatusFilter === 'out_of_stock') {
      matchesStockStatus = p.stock <= 0;
    } else if (stockStatusFilter === 'low_stock') {
      matchesStockStatus = p.stock > 0 && p.stock <= p.minStock;
    } else if (stockStatusFilter === 'safe') {
      matchesStockStatus = p.stock > p.minStock;
    }

    return matchesCat && matchesSearch && matchesStockStatus;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setSku(`ACC-${Date.now().toString().slice(-4)}`);
    setBarcode('');
    setCategory(categories[0] || 'Kabel & Charger');
    setHpp(15000);
    setPrice(25000);
    setStock(15);
    setMinStock(5);
    setUnit('pcs');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setSku(prod.sku);
    setBarcode(prod.barcode || '');
    setCategory(prod.category);
    setHpp(prod.hpp);
    setPrice(prod.price);
    setStock(prod.stock);
    setMinStock(prod.minStock);
    setUnit(prod.unit);
    setIsAddModalOpen(true);
  };

  // Open Restock Modal
  const handleOpenRestock = (prod: Product) => {
    setRestockTarget(prod);
    setRestockQty(prod.stock <= 0 ? 15 : 10);
    setRestockNewHpp(prod.hpp);
    setRestockSupplier('Distributor Grosir');
    setRestockDeductCash(false);
    setRestockFeedback('');
    setIsRestockModalOpen(true);
  };

  // Confirm Restock
  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockTarget || restockQty <= 0) return;

    const totalExpense = restockQty * (restockNewHpp > 0 ? restockNewHpp : restockTarget.hpp);

    // Update stock & optional updated HPP
    restockProduct(restockTarget.id, restockQty, restockNewHpp > 0 ? restockNewHpp : undefined);

    // Auto-record to Cash Drawer if owner selected it
    if (restockDeductCash && totalExpense > 0) {
      addCashMutation(
        'keluar',
        'belanja_stok',
        `Restok ${restockQty} ${restockTarget.unit} ${restockTarget.name} (${restockSupplier || 'Distributor'})`,
        totalExpense,
        'tunai'
      );
    }

    setRestockFeedback(`Berhasil restok +${restockQty} ${restockTarget.unit} untuk "${restockTarget.name}"!`);
    setTimeout(() => {
      setIsRestockModalOpen(false);
      setRestockFeedback('');
      setRestockTarget(null);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        name,
        sku,
        barcode,
        category,
        hpp,
        price,
        stock,
        minStock,
        unit,
      });
    } else {
      addProduct({
        name,
        sku,
        barcode,
        category,
        hpp,
        price,
        stock,
        minStock,
        unit,
      });
    }

    setIsAddModalOpen(false);
  };

  // Add new category
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const success = addCategory(newCatName);
    if (success) {
      setCatMsg(`Kategori "${newCatName}" berhasil ditambahkan!`);
      setNewCatName('');
      setTimeout(() => setCatMsg(''), 2500);
    } else {
      setCatMsg(`Kategori "${newCatName}" sudah ada sebelumnya!`);
      setTimeout(() => setCatMsg(''), 2500);
    }
  };

  // Process Excel File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rawJson.length === 0) {
          alert('File Excel kosong atau format kolom tidak sesuai.');
          return;
        }

        const parsed: Omit<Product, 'id'>[] = rawJson.map((row, idx) => {
          const prodName = row['Nama Produk'] || row['name'] || row['NAMA'] || `Produk Baru ${idx + 1}`;
          const prodSku = row['Kode SKU'] || row['sku'] || row['SKU'] || `IMP-${Date.now().toString().slice(-4)}-${idx + 1}`;
          const prodCat = row['Kategori'] || row['category'] || categories[0] || 'Kabel & Charger';
          const prodHpp = Number(row['HPP Modal'] || row['hpp'] || row['modal'] || 10000);
          const prodPrice = Number(row['Harga Jual'] || row['price'] || row['harga'] || 15000);
          const prodStock = Number(row['Stok Awal'] || row['stock'] || row['stok'] || 10);
          const prodMin = Number(row['Batas Minimum'] || row['minStock'] || row['min_stok'] || 5);
          const prodUnit = row['Satuan'] || row['unit'] || 'pcs';
          const prodBarcode = row['Barcode'] || row['barcode'] || undefined;

          return {
            name: String(prodName),
            sku: String(prodSku),
            category: String(prodCat),
            hpp: Math.max(0, isNaN(prodHpp) ? 0 : prodHpp),
            price: Math.max(0, isNaN(prodPrice) ? 0 : prodPrice),
            stock: Math.max(0, isNaN(prodStock) ? 0 : prodStock),
            minStock: Math.max(1, isNaN(prodMin) ? 3 : prodMin),
            unit: String(prodUnit),
            barcode: prodBarcode ? String(prodBarcode) : undefined,
          };
        });

        setExcelParsedProducts(parsed);
      } catch (err) {
        alert('Gagal memproses file Excel. Pastikan format file .xlsx atau .csv valid.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleConfirmExcelImport = () => {
    if (excelParsedProducts.length === 0) return;
    const count = importProductsFromExcel(excelParsedProducts);
    setImportNotice(`Berhasil menambahkan ${count} produk baru dari Excel ke database!`);
    setTimeout(() => {
      setImportNotice('');
      setExcelParsedProducts([]);
      setExcelFileName('');
      setIsExcelModalOpen(false);
    }, 1800);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      {/* Top Header & Actions Bar */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Package className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Manajemen Stok & Peringatan Restok
              </h3>
              {criticalProducts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                  {criticalProducts.length} Perlu Restok
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Katalog persediaan, batas minimum stok (low stock alert), nilai aset modal & impor Excel
            </p>
          </div>
        </div>

        {/* Action Buttons: Tambah Produk, Tambah via Excel, Ekspor Excel, Kelola Kategori */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 flex items-center gap-1.5 transition cursor-pointer"
            title="Kelola & Buat Kategori Baru"
          >
            <FolderPlus className="w-3.5 h-3.5 text-slate-600" />
            <span>Kelola Kategori</span>
          </button>

          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300 flex items-center gap-1.5 transition cursor-pointer"
            title="Tambah Banyak Produk dengan File Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={exportProductsToExcel}
            className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-300 flex items-center gap-1.5 transition cursor-pointer"
            title="Ekspor Seluruh Katalog Produk ke File Excel .xlsx"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 text-xs font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl shadow-sm shadow-teal-900/20 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-amber-300 stroke-[2.5]" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Top 4 Summary Cards (Stock Health & Asset Valuation) */}
      <div className="p-4 bg-slate-50/70 border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        {/* Card 1: Total Aset Modal HPP */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Nilai Aset Stok (HPP)
            </span>
            <span className="text-base font-extrabold text-slate-900 font-mono tabular-nums block mt-0.5">
              Rp {totalAssetHpp.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-teal-700 font-medium">
              {totalStockUnits} total unit barang
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Potensi Omzet & Profit */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Potensi Omzet Penjualan
            </span>
            <span className="text-base font-extrabold text-emerald-700 font-mono tabular-nums block mt-0.5">
              Rp {totalPotentialRevenue.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">
              Potensi Profit: +Rp {totalPotentialProfit.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Peringatan Stok Kritis (Habis & Menipis) */}
        <div
          onClick={() => setStockStatusFilter('needs_restock')}
          className={`p-3 rounded-xl border shadow-xs flex items-center justify-between cursor-pointer transition ${
            criticalProducts.length > 0
              ? 'bg-rose-50/80 border-rose-300 hover:bg-rose-100/80'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
          title="Klik untuk memfilter daftar barang yang perlu direstok"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold text-rose-800 uppercase tracking-wider block">
                Perlu Restok Segera
              </span>
              {criticalProducts.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
              )}
            </div>
            <span className="text-base font-extrabold text-rose-900 font-mono tabular-nums block mt-0.5">
              {criticalProducts.length} Produk Kritis
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                {outOfStockProducts.length} Habis
              </span>
              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                {lowStockProducts.length} Menipis
              </span>
            </div>
          </div>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              criticalProducts.length > 0
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* Card 4: Stok Aman */}
        <div
          onClick={() => setStockStatusFilter('safe')}
          className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
          title="Klik untuk melihat produk stok aman"
        >
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Stok Aman Terpenuhi
            </span>
            <span className="text-base font-extrabold text-emerald-900 font-mono tabular-nums block mt-0.5">
              {safeProducts.length} Produk
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Di atas batas minimum restok
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Prominent Low Stock Alert Banner (When critical items exist) */}
      {criticalProducts.length > 0 && stockStatusFilter !== 'safe' && (
        <div className="mx-4 mt-3 p-3.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 text-white rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-rose-600 flex items-center justify-center font-bold shadow-xs shrink-0">
              <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs md:text-sm font-extrabold tracking-tight">
                  Peringatan Low Stock Alert: {criticalProducts.length} Barang Perlu Segera Direstok!
                </h4>
                <span className="text-[10px] bg-white/20 font-mono px-2 py-0.2 rounded-full font-bold">
                  Batas Min Aktif
                </span>
              </div>
              <p className="text-[11px] text-white/90 mt-0.5">
                Stok barang di bawah telah menyentuh batas kritis atau habis (0 pcs). Segera pesan ke supplier agar kasir tidak kehabisan barang.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              onClick={() => setStockStatusFilter('needs_restock')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition cursor-pointer shadow-xs ${
                stockStatusFilter === 'needs_restock'
                  ? 'bg-white text-slate-950 ring-2 ring-white/60'
                  : 'bg-white/20 hover:bg-white text-white hover:text-slate-900'
              }`}
            >
              Filter Barang Menipis
            </button>
            {criticalProducts[0] && (
              <button
                onClick={() => handleOpenRestock(criticalProducts[0])}
                className="px-3 py-1.5 text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-xl transition cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restok Cepat</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Bar: Search, Stock Status Filter & Category Tabs */}
      <div className="p-4 bg-white border-b border-slate-200 space-y-3">
        {/* Row 1: Search & Stock Status Toggle Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama barang, kode SKU, atau barcode..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
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

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {[
              { id: 'all', label: 'Semua Status', count: products.length, color: 'slate' },
              {
                id: 'needs_restock',
                label: '⚠️ Perlu Restok',
                count: criticalProducts.length,
                color: 'rose',
                urgent: criticalProducts.length > 0,
              },
              { id: 'out_of_stock', label: 'Stok Habis (0)', count: outOfStockProducts.length, color: 'red' },
              { id: 'low_stock', label: 'Stok Menipis', count: lowStockProducts.length, color: 'amber' },
              { id: 'safe', label: 'Stok Aman', count: safeProducts.length, color: 'emerald' },
            ].map((tab) => {
              const active = stockStatusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStockStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    active
                      ? tab.id === 'needs_restock'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      active
                        ? 'bg-white/20 text-white'
                        : tab.urgent
                        ? 'bg-rose-100 text-rose-700 font-extrabold'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Kategori:
          </span>
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
                className={`px-3 py-1 text-xs font-bold rounded-xl transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
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

      {/* Product Catalog Table */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-2.5 px-3">Kode SKU / Barcode</th>
                <th className="py-2.5 px-3">Nama Produk</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3 text-right">HPP (Modal)</th>
                <th className="py-2.5 px-3 text-right">Harga Jual</th>
                <th className="py-2.5 px-3 text-right">Laba Satuan</th>
                <th className="py-2.5 px-3 text-center">Status & Sisa Stok</th>
                <th className="py-2.5 px-3 text-center">Batas Min</th>
                <th className="py-2.5 px-3 text-center">Aksi & Restok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 space-y-2">
                    <Package className="w-10 h-10 text-slate-300 mx-auto stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Tidak ada produk yang cocok dengan filter</p>
                    <button
                      onClick={() => {
                        setSelectedCat('Semua');
                        setStockStatusFilter('all');
                        setSearch('');
                      }}
                      className="text-xs text-teal-700 font-bold hover:underline cursor-pointer"
                    >
                      Reset Semua Filter
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const profit = p.price - p.hpp;
                  const marginPct = p.hpp > 0 ? Math.round((profit / p.hpp) * 100) : 0;
                  const isOutOfStock = p.stock <= 0;
                  const isLow = p.stock > 0 && p.stock <= p.minStock;

                  // Visual Stock Health Ratio
                  const stockRatio = Math.min(100, Math.round((p.stock / Math.max(1, p.minStock * 2)) * 100));

                  return (
                    <tr
                      key={p.id}
                      className={`transition ${
                        isOutOfStock
                          ? 'bg-rose-50/40 hover:bg-rose-50/70'
                          : isLow
                          ? 'bg-amber-50/40 hover:bg-amber-50/70'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          {isOutOfStock && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                          {isLow && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                          <span>{p.sku}</span>
                        </div>
                        {p.barcode && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            BC: {p.barcode}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 line-clamp-1">{p.name}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-600 tabular-nums">
                        Rp {p.hpp.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        Rp {p.price.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <span className="font-bold text-teal-800 block">
                          +Rp {profit.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-teal-600 font-semibold">
                          ({marginPct}%)
                        </span>
                      </td>

                      {/* Stock Level with Visual Bar & Badge */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono ${
                              isOutOfStock
                                ? 'bg-rose-500 text-white ring-1 ring-rose-400'
                                : isLow
                                ? 'bg-amber-400 text-amber-950 ring-1 ring-amber-300'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isOutOfStock
                              ? '0 Habis'
                              : isLow
                              ? `${p.stock} ${p.unit} (Menipis)`
                              : `${p.stock} ${p.unit} (Aman)`}
                          </span>

                          {/* Progress indicator */}
                          <div className="w-20 bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isOutOfStock
                                  ? 'bg-rose-500'
                                  : isLow
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.max(5, stockRatio)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Min Stock Threshold */}
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-500 tabular-nums">
                        {p.minStock} {p.unit}
                      </td>

                      {/* Actions & Restock Button */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Dedicated Restock Button */}
                          <button
                            onClick={() => handleOpenRestock(p)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 active:scale-95 ${
                              isOutOfStock || isLow
                                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                                : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                            }`}
                            title="Restok produk & update modal/catatan supplier"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Restok</span>
                          </button>

                          {/* Instant +10 Quick Restock */}
                          <button
                            onClick={() => restockProduct(p.id, 10)}
                            className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer"
                            title="Tambah langsung +10 pcs"
                          >
                            +10
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Edit Data Produk & Batas Minimum"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus produk "${p.name}"?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* QUICK RESTOCK MODAL (Fitur Restok Cepat dengan Pengingat Kas Laci) */}
      {isRestockModalOpen && restockTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-xs">
                  <RefreshCw className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-tight">
                    Restok Barang & Tambah Stok
                  </h4>
                  <p className="text-[11px] text-teal-100">
                    Perbarui persediaan produk dan sinkronkan kas masuk/keluar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmRestock} className="p-5 space-y-4 text-xs">
              {/* Product Info Banner */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm truncate max-w-[260px]">
                    {restockTarget.name}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-500">
                    {restockTarget.sku}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span>Kategori: {restockTarget.category}</span>
                  <span
                    className={`font-bold px-2 py-0.2 rounded ${
                      restockTarget.stock <= 0
                        ? 'bg-rose-100 text-rose-800'
                        : restockTarget.stock <= restockTarget.minStock
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Stok Saat Ini: {restockTarget.stock} {restockTarget.unit} (Min: {restockTarget.minStock})
                  </span>
                </div>
              </div>

              {/* Quantity to Add */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Jumlah Tambah Stok ({restockTarget.unit}) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={restockQty}
                    onChange={(e) => setRestockQty(Math.max(1, Number(e.target.value) || 0))}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                  <div className="text-right font-mono text-xs font-bold text-teal-800 bg-teal-50 px-3 py-2 rounded-xl border border-teal-200 shrink-0">
                    Total Nanti: {restockTarget.stock + restockQty} {restockTarget.unit}
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-5 gap-1.5 mt-2">
                  {[5, 10, 20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRestockQty(amt)}
                      className={`py-1 text-xs font-mono font-bold rounded-lg border transition cursor-pointer ${
                        restockQty === amt
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Updated HPP Modal / Harga Beli */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Harga Modal / HPP Baru (Rp)
                  </label>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    value={restockNewHpp}
                    onChange={(e) => setRestockNewHpp(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none text-right"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    HPP lama: Rp {restockTarget.hpp.toLocaleString('id-ID')}
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Catatan / Nama Distributor
                  </label>
                  <input
                    type="text"
                    value={restockSupplier}
                    onChange={(e) => setRestockSupplier(e.target.value)}
                    placeholder="Contoh: Grosir Roxy Mas"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Total Belanja Calculation & Cash Drawer Mutation Checkbox */}
              <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-teal-900">Total Pengeluaran Belanja Restok:</span>
                  <span className="text-sm font-extrabold text-teal-950 font-mono">
                    Rp {(restockQty * (restockNewHpp > 0 ? restockNewHpp : restockTarget.hpp)).toLocaleString('id-ID')}
                  </span>
                </div>

                <label className="flex items-start gap-2 pt-1 border-t border-teal-200/60 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={restockDeductCash}
                    onChange={(e) => setRestockDeductCash(e.target.checked)}
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-[11px] text-teal-900 font-medium">
                    Catat otomatis sebagai pengeluaran kas di laci fisik konter (Saldo Laci saat ini: Rp{' '}
                    {drawerCashBalance.toLocaleString('id-ID')})
                  </span>
                </label>
              </div>

              {restockFeedback && (
                <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl font-bold flex items-center gap-2 border border-emerald-300 animate-in fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{restockFeedback}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold rounded-xl shadow-md shadow-teal-900/20 cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-amber-300 stroke-[3]" />
                  <span>Konfirmasi Restok</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MANAGEMENT MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-teal-700" />
                <h4 className="font-bold text-slate-900 text-sm">Kelola Kategori Produk</h4>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategorySubmit} className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Tambah Kategori Baru
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Contoh: Hydrogel & Skin, Speaker Bluetooth..."
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer shrink-0 active:scale-95"
                >
                  + Tambah
                </button>
              </div>
              {catMsg && (
                <p className="text-xs font-semibold text-teal-700">{catMsg}</p>
              )}
            </form>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600 block mb-2">
                Daftar Kategori Aktif ({categories.length})
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {categories.map((c) => (
                  <div
                    key={c}
                    className="flex items-center justify-between px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-800"
                  >
                    <span>{c}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Yakin ingin menghapus kategori "${c}"?`)) {
                          deleteCategory(c);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXCEL IMPORT / TEMPLATE MODAL */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Import Data Produk dari File Excel / CSV
                </h4>
              </div>
              <button
                onClick={() => {
                  setIsExcelModalOpen(false);
                  setExcelParsedProducts([]);
                  setExcelFileName('');
                }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">Belum punya format Excel?</span>
                  <button
                    onClick={downloadExcelTemplate}
                    className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Template Excel</span>
                  </button>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Unduh template dengan kolom: Nama Produk, Kode SKU, Kategori, HPP Modal, Harga Jual, Stok Awal, Batas Minimum, Satuan, dan Barcode.
                </p>
              </div>

              {/* Upload Input Area */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  Pilih File Spreadsheet (.xlsx / .csv)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-800 hover:file:bg-teal-100 cursor-pointer border border-slate-300 rounded-xl p-1 bg-slate-50"
                />
              </div>

              {excelFileName && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block">File: {excelFileName}</span>
                  <span className="text-emerald-700 font-bold">
                    ✓ Terdeteksi {excelParsedProducts.length} baris produk siap diimpor.
                  </span>
                </div>
              )}

              {importNotice && (
                <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl font-bold border border-emerald-300">
                  {importNotice}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsExcelModalOpen(false);
                  setExcelParsedProducts([]);
                  setExcelFileName('');
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={excelParsedProducts.length === 0}
                onClick={handleConfirmExcelImport}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition ${
                  excelParsedProducts.length === 0
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer'
                }`}
              >
                Impor {excelParsedProducts.length} Produk Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-sm">
                {editingProduct ? 'Edit Data Produk & Batas Stok' : 'Tambah Produk Baru ke Database'}
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kabel Fast Charging 65W GaN"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kode SKU</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Barcode (Opsional)</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="899..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">Kategori Produk</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setIsCategoryModalOpen(true);
                      }}
                      className="text-[10px] text-teal-700 font-bold hover:underline cursor-pointer"
                    >
                      + Kategori
                    </button>
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Satuan Barang</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="pcs / box / meter"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Price & Margin Calculation */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      HPP / Harga Modal (Rp)
                    </label>
                    <input
                      type="number"
                      step="500"
                      value={hpp}
                      onChange={(e) => setHpp(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-right font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Harga Jual (Rp)</label>
                    <input
                      type="number"
                      step="500"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-right font-bold text-emerald-800"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-bold text-slate-800">Kalkulasi Laba Satuan:</span>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-teal-900 font-mono">
                      +Rp {unitProfit.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-teal-600 font-semibold ml-1.5">
                      ({profitMarginPercent}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock input & Minimum Stock Alert Threshold */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jumlah Stok Saat Ini</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-bold text-slate-900"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-rose-800">
                      Batas Minimum (Alert) *
                    </label>
                    <span className="text-[10px] text-rose-600 font-bold">Peringatan</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-rose-50 border border-rose-300 rounded-xl font-mono text-right font-bold text-rose-900 focus:ring-2 focus:ring-rose-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Sistem otomatis menandai stok menipis jika sisa stok ≤ angka ini.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-md shadow-teal-900/20 cursor-pointer active:scale-95"
                >
                  {editingProduct ? 'Perbarui Produk' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
