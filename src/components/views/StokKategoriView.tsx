import React, { useState, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  X,
  FileSpreadsheet,
  Download,
  FolderPlus,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Check,
  ChevronUp,
  ChevronDown,
  Calculator,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { usePOS } from '../../context/POSContext';
import { Product, ProductPriceTier } from '../../types/pos';
import {
  computeStockValuation,
  parseStockNumber,
  StockValuationAudit,
  findMatchingProductIndex,
  mergeProductRecords,
  countDuplicateProductGroups,
} from '../../utils/stockValuation';
import {
  calculateTieredPricing,
  formatCompactRupiah,
  parsePriceTiersText,
  sanitizePriceTiers,
} from '../../utils/tieredPricing';

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
    recalculateProductCatalog,
    deduplicateTwinProducts,
    importProductsFromExcel,
    exportProductsToExcel,
    downloadExcelTemplate,
    addCashMutation,
    drawerCashBalance,
  } = usePOS();

  const [selectedCat, setSelectedCat] = useState<string>('Semua');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'needs_restock' | 'out_of_stock' | 'low_stock' | 'safe'>('all');
  const [search, setSearch] = useState('');
  const [showSummaryCards, setShowSummaryCards] = useState<boolean>(true);
  const [stockActivityBanner, setStockActivityBanner] = useState<{
    title: string;
    detail: string;
    assetHppDelta: number;
    revenueDelta: number;
    mergedNotice?: string;
  } | null>(null);

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
  const [restockNewPrice, setRestockNewPrice] = useState<number>(0);
  const [restockHppMode, setRestockHppMode] = useState<'weighted' | 'latest'>('weighted');
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
  const [addHppMode, setAddHppMode] = useState<'weighted' | 'latest'>('weighted');
  const [priceTiers, setPriceTiers] = useState<ProductPriceTier[]>([]);
  const [newTierQty, setNewTierQty] = useState<string>('');
  const [newTierPrice, setNewTierPrice] = useState<string>('');
  const [newTierLabel, setNewTierLabel] = useState<string>('');
  const [tierFormError, setTierFormError] = useState<string>('');

  // Category management form
  const [newCatName, setNewCatName] = useState('');
  const [catMsg, setCatMsg] = useState('');

  // Excel Import state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelParsedProducts, setExcelParsedProducts] = useState<Omit<Product, 'id'>[]>([]);
  const [importNotice, setImportNotice] = useState('');
  const [excelError, setExcelError] = useState('');

  // Inline confirmation states (no window.confirm)
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null);

  // Audit / Hitung Ulang state
  const [valuationAudit, setValuationAudit] = useState<StockValuationAudit | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const unitProfit = price - hpp;
  const profitMarginPercent = hpp > 0 ? Math.round((unitProfit / hpp) * 100) : 0;

  const allCategories = ['Semua', ...categories];

  // Stock Analytics & Health (Sanitized & Non-negative)
  const globalValuation = React.useMemo(() => computeStockValuation(products), [products]);
  const totalStockUnits = globalValuation.totalUnits;
  const totalAssetHpp = globalValuation.totalAssetHpp;
  const totalPotentialRevenue = globalValuation.totalPotentialRevenue;
  const totalPotentialProfit = globalValuation.totalPotentialProfit;

  const outOfStockProducts = products.filter((p) => (Number(p.stock) || 0) <= 0);
  const lowStockProducts = products.filter(
    (p) => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= (Number(p.minStock) || 0)
  );
  const criticalProducts = [...outOfStockProducts, ...lowStockProducts];
  const safeProducts = products.filter(
    (p) => (Number(p.stock) || 0) > (Number(p.minStock) || 0)
  );

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const stockNum = Math.max(0, Number(p.stock) || 0);
    const minNum = Math.max(0, Number(p.minStock) || 0);
    const matchesCat = selectedCat === 'Semua' || p.category === selectedCat;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));

    let matchesStockStatus = true;
    if (stockStatusFilter === 'needs_restock') {
      matchesStockStatus = stockNum <= minNum;
    } else if (stockStatusFilter === 'out_of_stock') {
      matchesStockStatus = stockNum <= 0;
    } else if (stockStatusFilter === 'low_stock') {
      matchesStockStatus = stockNum > 0 && stockNum <= minNum;
    } else if (stockStatusFilter === 'safe') {
      matchesStockStatus = stockNum > minNum;
    }

    return matchesCat && matchesSearch && matchesStockStatus;
  });

  const filteredValuation = React.useMemo(
    () => computeStockValuation(filteredProducts),
    [filteredProducts]
  );
  const isFilterActive = filteredProducts.length !== products.length;

  const duplicateTwinCount = React.useMemo(
    () => countDuplicateProductGroups(products),
    [products]
  );

  // Detect matching twin product while adding new product
  const matchedTwinProduct = React.useMemo(() => {
    if (editingProduct) return null;
    if (!name.trim() && !barcode.trim()) return null;
    const idx = findMatchingProductIndex(products, {
      name,
      sku: '', // match on explicit name or barcode while typing new product
      barcode,
    });
    return idx >= 0 ? products[idx] : null;
  }, [editingProduct, name, barcode, products]);

  const handleMergeTwinsNow = () => {
    const res = deduplicateTwinProducts();
    if (res.removedDuplicateCount > 0) {
      setStockActivityBanner({
        title: `${res.removedDuplicateCount} produk kembar digabung menjadi satu`,
        detail: `Produk tergabung: ${res.mergedNames.slice(0, 3).join(', ')}${
          res.mergedNames.length > 3 ? ` (+${res.mergedNames.length - 3} lainnya)` : ''
        }`,
        assetHppDelta: 0,
        revenueDelta: 0,
      });
    }
  };

  const handleRecalculateAssets = () => {
    const audit = recalculateProductCatalog();
    setValuationAudit(audit);
    setIsAuditModalOpen(true);
  };

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
    setPriceTiers([]);
    setNewTierQty('');
    setNewTierPrice('');
    setNewTierLabel('');
    setTierFormError('');
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
    setPriceTiers(sanitizePriceTiers(prod.priceTiers));
    setNewTierQty('');
    setNewTierPrice('');
    setNewTierLabel('');
    setTierFormError('');
    setIsAddModalOpen(true);
  };

  // Open Restock Modal
  const handleOpenRestock = (prod: Product) => {
    setRestockTarget(prod);
    setRestockQty(prod.stock <= 0 ? 15 : 10);
    setRestockNewHpp(prod.hpp);
    setRestockNewPrice(prod.price);
    setRestockHppMode('weighted');
    setRestockSupplier('Distributor Grosir');
    setRestockDeductCash(false);
    setRestockFeedback('');
    setIsRestockModalOpen(true);
  };

  // Confirm Restock
  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockTarget || restockQty <= 0) return;

    const cleanHpp = restockNewHpp > 0 ? Math.round(restockNewHpp) : restockTarget.hpp;
    const cleanPrice = restockNewPrice > 0 ? Math.round(restockNewPrice) : restockTarget.price;
    const nextStock = restockTarget.stock + restockQty;
    const nextHpp =
      restockNewHpp > 0
        ? restockHppMode === 'latest' || restockTarget.stock <= 0 || restockTarget.hpp <= 0
          ? cleanHpp
          : Math.round(
              (restockTarget.stock * restockTarget.hpp + restockQty * cleanHpp) /
                Math.max(1, nextStock)
            )
        : restockTarget.hpp;

    const prevAsset = restockTarget.stock * restockTarget.hpp;
    const prevRev = restockTarget.stock * restockTarget.price;
    const nextAsset = nextStock * nextHpp;
    const nextRev = nextStock * cleanPrice;
    const totalExpense = restockQty * cleanHpp;

    // Update stock + active HPP + optional updated selling price
    restockProduct(
      restockTarget.id,
      restockQty,
      restockNewHpp > 0 ? cleanHpp : undefined,
      {
        newPrice: restockNewPrice > 0 ? cleanPrice : undefined,
        hppMode: restockHppMode,
      }
    );

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

    setStockActivityBanner({
      title: `Barang Masuk: +${restockQty} ${restockTarget.unit} ${restockTarget.name}`,
      detail: `Stok jadi ${nextStock.toLocaleString('id-ID')} ${restockTarget.unit} · HPP aktif Rp ${nextHpp.toLocaleString('id-ID')} · Jual Rp ${cleanPrice.toLocaleString('id-ID')}`,
      assetHppDelta: nextAsset - prevAsset,
      revenueDelta: nextRev - prevRev,
    });

    setRestockFeedback(
      `Restok +${restockQty} ${restockTarget.unit} berhasil! Aset HPP & Potensi Omzet aktif diperbarui.`
    );
    setTimeout(() => {
      setIsRestockModalOpen(false);
      setRestockFeedback('');
      setRestockTarget(null);
    }, 1000);
  };

  const handleAddPriceTier = () => {
    setTierFormError('');
    const qtyNum = Math.round(Number(newTierQty) || 0);
    const priceNum = Math.round(Number(newTierPrice) || 0);
    if (qtyNum < 2) {
      setTierFormError('Jumlah paket grosir minimal 2 ' + (unit || 'pcs') + '.');
      return;
    }
    if (priceNum < 0 || newTierPrice.trim() === '') {
      setTierFormError('Masukkan total harga paket yang valid.');
      return;
    }
    const nextTiers = sanitizePriceTiers([
      ...priceTiers,
      {
        id: `tier-${qtyNum}`,
        qty: qtyNum,
        price: priceNum,
        label: newTierLabel.trim() || undefined,
      },
    ]);
    setPriceTiers(nextTiers);
    setNewTierQty('');
    setNewTierPrice('');
    setNewTierLabel('');
  };

  const handleRemovePriceTier = (qtyToRemove: number) => {
    setPriceTiers((prev) => prev.filter((t) => t.qty !== qtyToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Auto-include pending valid draft tier if user filled it without clicking "+ Tambah"
    let combinedTiers = [...priceTiers];
    const draftQty = Math.round(Number(newTierQty) || 0);
    const draftPrice = Math.round(Number(newTierPrice) || 0);
    if (draftQty >= 2 && newTierPrice.trim() !== '' && draftPrice >= 0) {
      combinedTiers.push({
        id: `tier-${draftQty}`,
        qty: draftQty,
        price: draftPrice,
        label: newTierLabel.trim() || undefined,
      });
    }
    const finalTiers = sanitizePriceTiers(combinedTiers);

    if (editingProduct) {
      const prevAsset = editingProduct.stock * editingProduct.hpp;
      const prevRev = editingProduct.stock * editingProduct.price;
      updateProduct({
        ...editingProduct,
        name,
        sku,
        barcode,
        category,
        hpp,
        price,
        priceTiers: finalTiers.length > 0 ? finalTiers : undefined,
        stock,
        minStock,
        unit,
      });
      setStockActivityBanner({
        title: `Data Produk Diperbarui: ${name.trim()}`,
        detail: `Stok ${stock} ${unit} · HPP Rp ${hpp.toLocaleString('id-ID')} · Harga Jual Rp ${price.toLocaleString('id-ID')}`,
        assetHppDelta: stock * hpp - prevAsset,
        revenueDelta: stock * price - prevRev,
      });
    } else {
      const res = addProduct(
        {
          name,
          sku,
          barcode,
          category,
          hpp,
          price,
          priceTiers: finalTiers.length > 0 ? finalTiers : undefined,
          stock,
          minStock,
          unit,
        },
        { hppMode: addHppMode }
      );
      setStockActivityBanner({
        title: res.merged
          ? `Produk Sama Digabung Otomatis: ${res.product.name}`
          : `Produk Baru Masuk: ${res.product.name}`,
        detail: `Stok aktif ${res.product.stock.toLocaleString('id-ID')} ${res.product.unit} · HPP aktif Rp ${res.product.hpp.toLocaleString('id-ID')} · Jual Rp ${res.product.price.toLocaleString('id-ID')}`,
        assetHppDelta: res.assetHppDelta,
        revenueDelta: res.revenueDelta,
        mergedNotice: res.merged
          ? `Produk kembar otomatis disatukan (+${res.addedStock} ${res.product.unit} masuk).`
          : undefined,
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
    setExcelError('');
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rawJson.length === 0) {
          setExcelParsedProducts([]);
          setExcelError('File Excel kosong atau format kolom tidak sesuai.');
          return;
        }

        const parsed: Omit<Product, 'id'>[] = rawJson.map((row, idx) => {
          const prodName =
            row['Nama Produk'] ?? row['name'] ?? row['NAMA'] ?? `Produk Baru ${idx + 1}`;
          const prodSku =
            row['Kode SKU'] ??
            row['sku'] ??
            row['SKU'] ??
            `IMP-${Date.now().toString().slice(-4)}-${idx + 1}`;
          const prodCat =
            row['Kategori'] ?? row['category'] ?? categories[0] ?? 'Kabel & Charger';

          const rawHpp =
            row['HPP (Modal)'] ??
            row['HPP Modal'] ??
            row['HPP'] ??
            row['hpp'] ??
            row['modal'] ??
            0;
          const rawPrice =
            row['Harga Jual'] ?? row['price'] ?? row['harga'] ?? 0;
          const rawStock =
            row['Stok (Pcs)'] ??
            row['Stok'] ??
            row['Stok Awal'] ??
            row['stock'] ??
            row['stok'] ??
            0;
          const rawMin =
            row['Batas Minimum Stok'] ??
            row['Batas Minimum'] ??
            row['minStock'] ??
            row['min_stok'] ??
            5;
          const prodUnit = row['Satuan'] ?? row['unit'] ?? 'pcs';
          const prodBarcode = row['Barcode'] ?? row['barcode'] ?? undefined;
          const rawTiers =
            row['Harga Grosir / Paket'] ??
            row['Harga Grosir'] ??
            row['Grosir'] ??
            row['priceTiers'];

          const prodHpp = Math.max(0, Math.round(parseStockNumber(rawHpp, 0)));
          const prodPrice = Math.max(0, Math.round(parseStockNumber(rawPrice, 0)));
          const prodStock = Math.max(0, Math.round(parseStockNumber(rawStock, 0)));
          const prodMin = Math.max(1, Math.round(parseStockNumber(rawMin, 5)));
          const prodTiers = parsePriceTiersText(rawTiers);

          return {
            name: String(prodName).trim(),
            sku: String(prodSku).trim(),
            category: String(prodCat).trim(),
            hpp: prodHpp,
            price: prodPrice,
            priceTiers: prodTiers.length > 0 ? prodTiers : undefined,
            stock: prodStock,
            minStock: prodMin,
            unit: String(prodUnit).trim() || 'pcs',
            barcode: prodBarcode ? String(prodBarcode).trim() : undefined,
          };
        });

        setExcelParsedProducts(parsed);
      } catch {
        setExcelParsedProducts([]);
        setExcelError('Gagal memproses file Excel. Pastikan format file .xlsx atau .csv valid.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleConfirmExcelImport = () => {
    if (excelParsedProducts.length === 0) return;
    const summary = importProductsFromExcel(excelParsedProducts);
    setImportNotice(
      `Berhasil memproses ${summary.totalRows} baris (${summary.addedCount} produk baru, ${summary.mergedCount} produk kembar digabung, +${summary.totalUnitsAdded.toLocaleString('id-ID')} unit).`
    );
    setStockActivityBanner({
      title: `Impor Barang Masuk (${summary.totalUnitsAdded.toLocaleString('id-ID')} unit)`,
      detail: `${summary.addedCount} produk baru + ${summary.mergedCount} produk sama digabung menjadi satu.`,
      assetHppDelta: summary.assetHppDelta,
      revenueDelta: summary.revenueDelta,
    });
    setTimeout(() => {
      setImportNotice('');
      setExcelParsedProducts([]);
      setExcelFileName('');
      setIsExcelModalOpen(false);
    }, 1600);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      {/* Top Header & Actions Bar (Compact & Sleek) */}
      <div className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-xs shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Package className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight truncate">
                Manajemen Stok &amp; Peringatan Restok
              </h3>
              {criticalProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setStockStatusFilter('needs_restock')}
                  className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200 transition cursor-pointer shrink-0"
                >
                  {criticalProducts.length} Kritis
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Katalog persediaan, batas minimum stok, nilai aset modal &amp; impor Excel
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {duplicateTwinCount > 0 && (
            <button
              type="button"
              onClick={handleMergeTwinsNow}
              className="px-3 min-h-[36px] text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
              title="Gabungkan produk dengan nama/SKU/barcode sama menjadi satu"
            >
              <span>Gabung Kembar ({duplicateTwinCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRecalculateAssets}
            className="px-3 min-h-[36px] text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg border border-amber-300 flex items-center gap-1.5 transition cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
            title="Hitung ulang Nilai Aset (HPP) & Potensi Omzet serta gabung produk kembar"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Hitung Ulang</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSummaryCards(!showSummaryCards)}
            className="px-2.5 min-h-[36px] text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
            title={showSummaryCards ? 'Sembunyikan Kotak Ringkasan' : 'Tampilkan Kotak Ringkasan'}
          >
            {showSummaryCards ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
            <span className="hidden sm:inline">{showSummaryCards ? 'Tutup Ringkasan' : 'Lihat Ringkasan'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-2.5 min-h-[36px] text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
            title="Kelola & Buat Kategori Baru"
          >
            <FolderPlus className="w-3.5 h-3.5 text-slate-600" />
            <span>Kategori</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setExcelError('');
              setIsExcelModalOpen(true);
            }}
            className="px-2.5 min-h-[36px] text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
            title="Tambah Banyak Produk dengan File Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Impor</span>
          </button>

          <button
            type="button"
            onClick={exportProductsToExcel}
            className="px-2.5 min-h-[36px] text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
            title="Ekspor Seluruh Katalog Produk ke File Excel .xlsx"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3 min-h-[36px] text-xs font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-lg shadow-xs flex items-center gap-1 transition cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-amber-300 stroke-[2.5]" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Top 4 Summary Cards (Diperkecil / Micro-Cards agar layar lega untuk tabel) */}
      {showSummaryCards && (
        <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-slate-50/90 border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 shrink-0">
          {/* Card 1: Total Aset Modal HPP */}
          <div className="bg-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg border border-slate-200/90 shadow-2xs flex items-center justify-between gap-1.5 hover:border-teal-300 transition">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block truncate">
                  Nilai Aset (HPP)
                </span>
                {globalValuation.anomalies.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRecalculateAssets}
                    className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 rounded hover:bg-amber-200 cursor-pointer shrink-0"
                    title="Ada anomali harga/HPP yang perlu dicek"
                  >
                    Cek
                  </button>
                )}
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 font-mono tabular-nums block leading-tight">
                Rp {totalAssetHpp.toLocaleString('id-ID')}
              </span>
              <span className="text-[9px] text-teal-700 font-semibold truncate block">
                {isFilterActive
                  ? `Filter: Rp ${filteredValuation.totalAssetHpp.toLocaleString('id-ID')} (${filteredValuation.totalUnits} unit)`
                  : `${totalStockUnits.toLocaleString('id-ID')} unit barang`}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRecalculateAssets}
              className="w-6 h-6 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0 cursor-pointer transition"
              title="Hitung Ulang & Audit Nilai Aset"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Potensi Omzet & Profit */}
          <div className="bg-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg border border-slate-200/90 shadow-2xs flex items-center justify-between gap-1.5 hover:border-emerald-300 transition">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block truncate">
                Potensi Omzet
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-700 font-mono tabular-nums block leading-tight">
                Rp {totalPotentialRevenue.toLocaleString('id-ID')}
              </span>
              <span className="text-[9px] text-emerald-600 font-bold truncate block">
                {isFilterActive
                  ? `Filter: Rp ${filteredValuation.totalPotentialRevenue.toLocaleString('id-ID')}`
                  : `Laba: +Rp ${totalPotentialProfit.toLocaleString('id-ID')}`}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRecalculateAssets}
              className="w-6 h-6 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 cursor-pointer transition"
              title="Hitung Ulang & Audit Potensi Omzet"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Peringatan Stok Kritis (Habis & Menipis) */}
          <div
            onClick={() => setStockStatusFilter('needs_restock')}
            className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg border shadow-2xs flex items-center justify-between gap-1.5 cursor-pointer transition ${
              criticalProducts.length > 0
                ? 'bg-rose-50/90 border-rose-300 hover:bg-rose-100/90'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
            title="Klik untuk memfilter daftar barang yang perlu direstok"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-tight block truncate">
                  Perlu Restok
                </span>
                {criticalProducts.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shrink-0" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-rose-900 font-mono tabular-nums block leading-tight">
                {criticalProducts.length} Kritis
              </span>
              <div className="flex items-center gap-1 text-[9px] font-extrabold truncate">
                <span className="text-rose-700">{outOfStockProducts.length} Habis</span>
                <span className="text-slate-300">•</span>
                <span className="text-amber-700">{lowStockProducts.length} Menipis</span>
              </div>
            </div>
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                criticalProducts.length > 0
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4: Stok Aman */}
          <div
            onClick={() => setStockStatusFilter('safe')}
            className="bg-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg border border-slate-200/90 shadow-2xs flex items-center justify-between gap-1.5 cursor-pointer hover:bg-slate-50 transition"
            title="Klik untuk melihat produk stok aman"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block truncate">
                Stok Aman
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-900 font-mono tabular-nums block leading-tight">
                {safeProducts.length} Produk
              </span>
              <span className="text-[9px] text-slate-500 font-medium truncate block">
                Di atas batas min
              </span>
            </div>
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      )}

      {/* Live Incoming Stock Valuation & Merge Activity Banner */}
      {stockActivityBanner && (
        <div className="mx-2.5 mt-2 sm:mx-4 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-start sm:items-center gap-2 min-w-0">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
            <div className="min-w-0">
              <div className="font-extrabold truncate">{stockActivityBanner.title}</div>
              <div className="text-[11px] text-emerald-800 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                <span>{stockActivityBanner.detail}</span>
                {stockActivityBanner.assetHppDelta !== 0 && (
                  <span className="font-mono font-bold text-slate-900">
                    Aset HPP: {stockActivityBanner.assetHppDelta >= 0 ? '+' : '-'}Rp{' '}
                    {Math.abs(stockActivityBanner.assetHppDelta).toLocaleString('id-ID')}
                  </span>
                )}
                {stockActivityBanner.revenueDelta !== 0 && (
                  <span className="font-mono font-bold text-emerald-700">
                    Potensi Omzet: {stockActivityBanner.revenueDelta >= 0 ? '+' : '-'}Rp{' '}
                    {Math.abs(stockActivityBanner.revenueDelta).toLocaleString('id-ID')}
                  </span>
                )}
              </div>
              {stockActivityBanner.mergedNotice && (
                <div className="text-[10.5px] font-bold text-teal-800 mt-0.5">
                  {stockActivityBanner.mergedNotice}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStockActivityBanner(null)}
            className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-700 cursor-pointer shrink-0"
            title="Tutup info"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Bar: Search, Stock Status Filter & Category Tabs (Compact) */}
      <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-white border-b border-slate-200 space-y-1.5 shrink-0">
        {/* Row 1: Search & Stock Status Toggle Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama barang, kode SKU, atau barcode..."
              className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {[
              { id: 'all', label: 'Semua', count: products.length, color: 'slate' },
              {
                id: 'needs_restock',
                label: '⚠️ Perlu Restok',
                count: criticalProducts.length,
                color: 'rose',
                urgent: criticalProducts.length > 0,
              },
              { id: 'out_of_stock', label: 'Habis (0)', count: outOfStockProducts.length, color: 'red' },
              { id: 'low_stock', label: 'Menipis', count: lowStockProducts.length, color: 'amber' },
              { id: 'safe', label: 'Aman', count: safeProducts.length, color: 'emerald' },
            ].map((tab) => {
              const active = stockStatusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStockStatusFilter(tab.id as any)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95 ${
                    active
                      ? tab.id === 'needs_restock'
                        ? 'bg-rose-600 text-white shadow-sm font-extrabold ring-1 ring-rose-500'
                        : 'bg-gradient-to-r from-teal-700 to-emerald-700 text-white shadow-sm ring-1 ring-teal-600 font-extrabold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/60 font-semibold'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                      active
                        ? 'bg-white/20 text-white'
                        : tab.urgent
                        ? 'bg-rose-100 text-rose-800 font-black'
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

        {/* Row 2: Category Tabs & Result Counter */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
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
                  className={`px-2.5 py-1 text-xs font-bold rounded-xl transition shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-800 font-extrabold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/60 font-semibold'
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

          <div className="hidden sm:block text-[10px] font-semibold text-slate-500 shrink-0">
            {filteredProducts.length} barang cocok
          </div>
        </div>
      </div>

      {/* Product Catalog Table */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 pb-20 md:pb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                <th className="py-2 px-2.5">Kode SKU / Barcode</th>
                <th className="py-2 px-2.5">Nama Produk</th>
                <th className="py-2 px-2.5">Kategori</th>
                <th className="py-2 px-2.5 text-right">HPP (Modal)</th>
                <th className="py-2 px-2.5 text-right">Harga Jual</th>
                <th className="py-2 px-2.5 text-right">Laba Satuan</th>
                <th className="py-2 px-2.5 text-center">Status & Sisa Stok</th>
                <th className="py-2 px-2.5 text-right">Aset HPP &amp; Omzet</th>
                <th className="py-2 px-2.5 text-center">Batas Min</th>
                <th className="py-2 px-2.5 text-center">Aksi & Restok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 space-y-2">
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
                  const safeStock = Math.max(0, Number(p.stock) || 0);
                  const safeHpp = Math.max(0, Number(p.hpp) || 0);
                  const safePrice = Math.max(0, Number(p.price) || 0);
                  const profit = safePrice - safeHpp;
                  const marginPct = safeHpp > 0 ? Math.round((profit / safeHpp) * 100) : 0;
                  const rowAssetHpp = safeStock * safeHpp;
                  const rowPotentialRev = safeStock * safePrice;
                  const isOutOfStock = safeStock <= 0;
                  const isLow = safeStock > 0 && safeStock <= p.minStock;

                  // Visual Stock Health Ratio
                  const stockRatio = Math.min(100, Math.round((safeStock / Math.max(1, p.minStock * 2)) * 100));

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
                      <td className="py-1.5 px-2.5 font-mono font-bold text-slate-700">
                        <div className="flex items-center gap-1">
                          {isOutOfStock && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                          {isLow && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                          <span className="text-[11px]">{p.sku}</span>
                        </div>
                        {p.barcode && (
                          <div className="text-[9px] text-slate-400 font-normal">
                            BC: {p.barcode}
                          </div>
                        )}
                      </td>
                      <td className="py-1.5 px-2.5">
                        <div className="font-bold text-slate-900 line-clamp-1 text-xs">{p.name}</div>
                      </td>
                      <td className="py-1.5 px-2.5">
                        <span className="px-1.5 py-0.2 rounded-md text-[9px] font-semibold bg-slate-100 text-slate-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-medium text-slate-600 tabular-nums text-xs">
                        Rp {safeHpp.toLocaleString('id-ID')}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900 tabular-nums text-xs">
                        <div>
                          Rp {safePrice.toLocaleString('id-ID')}
                          <span className="text-[10px] font-normal text-slate-400">/{p.unit}</span>
                        </div>
                        {p.priceTiers && p.priceTiers.length > 0 && (
                          <div className="flex flex-wrap justify-end gap-1 mt-0.5">
                            {p.priceTiers.slice(0, 3).map((t) => (
                              <span
                                key={t.qty}
                                className="px-1 py-0.2 rounded text-[9px] font-bold bg-teal-50 text-teal-800 border border-teal-200 whitespace-nowrap"
                                title={`${t.label || `${t.qty} ${p.unit}`} = Rp ${t.price.toLocaleString('id-ID')}`}
                              >
                                {t.label ? `${t.label}:` : `${t.qty} ${p.unit}:`} {formatCompactRupiah(t.price)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono tabular-nums">
                        <span className={`font-bold block text-xs ${profit < 0 ? 'text-rose-700' : 'text-teal-800'}`}>
                          {profit >= 0 ? '+' : '-'}Rp {Math.abs(profit).toLocaleString('id-ID')}
                        </span>
                        <span className={`text-[9px] font-semibold ${profit < 0 ? 'text-rose-600' : 'text-teal-600'}`}>
                          ({marginPct}%)
                        </span>
                      </td>

                      {/* Stock Level with Visual Bar & Badge */}
                      <td className="py-1.5 px-2.5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase font-mono ${
                              isOutOfStock
                                ? 'bg-rose-500 text-white ring-1 ring-rose-400'
                                : isLow
                                ? 'bg-amber-400 text-amber-950 ring-1 ring-amber-300'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isOutOfStock
                              ? '0 Habis'
                              : `${safeStock} ${p.unit}`}
                          </span>

                          {/* Progress indicator */}
                          <div className="w-16 bg-slate-200 h-1 rounded-full mt-1 overflow-hidden">
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

                      {/* Row Total Asset (HPP) & Potential Revenue */}
                      <td className="py-1.5 px-2.5 text-right font-mono tabular-nums">
                        <div className="text-[11px] font-bold text-slate-800">
                          Rp {rowAssetHpp.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-700">
                          Omzet: Rp {rowPotentialRev.toLocaleString('id-ID')}
                        </div>
                      </td>

                      {/* Min Stock Threshold */}
                      <td className="py-1.5 px-2.5 text-center font-mono font-semibold text-slate-500 tabular-nums text-xs">
                        {p.minStock} {p.unit}
                      </td>

                      {/* Actions & Restock Button */}
                      <td className="py-1.5 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenRestock(p)}
                            className={`px-2.5 min-h-[34px] text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 active:scale-95 whitespace-nowrap ${
                              isOutOfStock || isLow
                                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                                : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                            }`}
                            title="Restok produk & update modal/catatan supplier"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Restok</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              restockProduct(p.id, 10);
                              setStockActivityBanner({
                                title: `Barang Masuk Cepat: +10 ${p.unit} ${p.name}`,
                                detail: `Stok aktif jadi ${(p.stock + 10).toLocaleString('id-ID')} ${p.unit} · HPP Rp ${p.hpp.toLocaleString('id-ID')}`,
                                assetHppDelta: 10 * p.hpp,
                                revenueDelta: 10 * p.price,
                              });
                            }}
                            className="px-2.5 min-h-[34px] text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer whitespace-nowrap"
                            title="Tambah langsung +10 unit & aktifkan Aset HPP + Potensi Omzet"
                          >
                            +10
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="min-w-[34px] min-h-[34px] flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Edit Data Produk & Batas Minimum"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {confirmDeleteProductId === p.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  deleteProduct(p.id);
                                  setConfirmDeleteProductId(null);
                                }}
                                className="px-2 min-h-[30px] text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-md cursor-pointer"
                              >
                                Hapus
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteProductId(null)}
                                className="px-2 min-h-[30px] text-[11px] font-semibold text-slate-600 hover:bg-slate-200 rounded-md cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteProductId(p.id)}
                              className="min-w-[34px] min-h-[34px] flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Hapus Produk"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredProducts.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/90 border-t-2 border-slate-200 font-bold text-xs">
                  <td colSpan={6} className="py-2.5 px-2.5 text-slate-800">
                    Total Terhitung ({filteredProducts.length} produk ditampilkan)
                  </td>
                  <td className="py-2.5 px-2.5 text-center font-mono tabular-nums text-slate-900">
                    {filteredValuation.totalUnits.toLocaleString('id-ID')} unit
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono tabular-nums">
                    <div className="text-slate-900 font-extrabold">
                      Aset: Rp {filteredValuation.totalAssetHpp.toLocaleString('id-ID')}
                    </div>
                    <div className="text-emerald-700 font-extrabold">
                      Omzet: Rp {filteredValuation.totalPotentialRevenue.toLocaleString('id-ID')}
                    </div>
                  </td>
                  <td colSpan={2} className="py-2.5 px-2.5 text-right font-mono tabular-nums text-[11px] text-teal-800">
                    Est. Laba: +Rp {filteredValuation.totalPotentialProfit.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            )}
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

                {/* Wholesale Pack Quick Restock Shortcuts (if product has tiers like 1 Rim = 500 lbr) */}
                {restockTarget.priceTiers && restockTarget.priceTiers.length > 0 && (
                  <div className="mt-2 p-2 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-extrabold text-teal-900 uppercase block">
                      Restok Cepat Sesuai Paket Grosir:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {restockTarget.priceTiers.map((tier) => {
                        const tLabel = tier.label || `${tier.qty} ${restockTarget.unit}`;
                        return (
                          <React.Fragment key={tier.qty}>
                            <button
                              type="button"
                              onClick={() => setRestockQty(tier.qty)}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer whitespace-nowrap ${
                                restockQty === tier.qty
                                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                                  : 'bg-white hover:bg-teal-100 text-teal-900 border-teal-300'
                              }`}
                            >
                              1× {tLabel} ({tier.qty.toLocaleString('id-ID')} {restockTarget.unit})
                            </button>
                            <button
                              type="button"
                              onClick={() => setRestockQty(tier.qty * 2)}
                              className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer whitespace-nowrap ${
                                restockQty === tier.qty * 2
                                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                                  : 'bg-white hover:bg-teal-100 text-teal-800 border-teal-200'
                              }`}
                            >
                              2× ({(tier.qty * 2).toLocaleString('id-ID')})
                            </button>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

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

              {/* Updated HPP Modal, Selling Price & Distributor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    HPP / Harga Beli Batch Ini (Rp)
                  </label>
                  <input
                    type="number"
                    step="any"
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
                    Harga Jual Ecer Aktif (Rp)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={restockNewPrice}
                    onChange={(e) => setRestockNewPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none text-right"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Jual lama: Rp {restockTarget.price.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {restockTarget.stock > 0 &&
                restockTarget.hpp > 0 &&
                restockNewHpp > 0 &&
                restockNewHpp !== restockTarget.hpp && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                    <span className="text-[10.5px] font-extrabold text-amber-950 block">
                      HPP Batch Masuk Berbeda dari HPP Lama — Pilih Cara Hitung HPP:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRestockHppMode('weighted')}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          restockHppMode === 'weighted'
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-white text-slate-700 border-amber-300 hover:bg-amber-100/60'
                        }`}
                      >
                        Rata-rata Otomatis
                      </button>
                      <button
                        type="button"
                        onClick={() => setRestockHppMode('latest')}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          restockHppMode === 'latest'
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-white text-slate-700 border-amber-300 hover:bg-amber-100/60'
                        }`}
                      >
                        Pakai HPP Baru Saja
                      </button>
                    </div>
                  </div>
                )}

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

              {/* Live Active HPP & Omzet Preview + Total Belanja */}
              {(() => {
                const effHpp = restockNewHpp > 0 ? Math.round(restockNewHpp) : restockTarget.hpp;
                const effPrice =
                  restockNewPrice > 0 ? Math.round(restockNewPrice) : restockTarget.price;
                const nextStock = restockTarget.stock + restockQty;
                const nextHpp =
                  restockNewHpp > 0
                    ? restockHppMode === 'latest' ||
                      restockTarget.stock <= 0 ||
                      restockTarget.hpp <= 0
                      ? effHpp
                      : Math.round(
                          (restockTarget.stock * restockTarget.hpp + restockQty * effHpp) /
                            Math.max(1, nextStock)
                        )
                    : restockTarget.hpp;
                const nextAsset = nextStock * nextHpp;
                const nextRevenue = nextStock * effPrice;
                const assetDelta = nextAsset - restockTarget.stock * restockTarget.hpp;
                const revenueDelta = nextRevenue - restockTarget.stock * restockTarget.price;

                return (
                  <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl space-y-2">
                    <div className="grid grid-cols-2 gap-2 pb-2 border-b border-teal-200/70">
                      <div className="bg-white/90 px-2.5 py-1.5 rounded-lg border border-teal-200/70">
                        <span className="text-[10px] font-bold text-slate-500 block">
                          Nilai Aset (HPP) Aktif
                        </span>
                        <span className="text-xs font-extrabold text-slate-900 font-mono tabular-nums block">
                          Rp {nextAsset.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-teal-700">
                          ({assetDelta >= 0 ? '+' : '-'}Rp{' '}
                          {Math.abs(assetDelta).toLocaleString('id-ID')} · HPP @Rp{' '}
                          {nextHpp.toLocaleString('id-ID')})
                        </span>
                      </div>
                      <div className="bg-white/90 px-2.5 py-1.5 rounded-lg border border-emerald-200/70">
                        <span className="text-[10px] font-bold text-slate-500 block">
                          Potensi Omzet Aktif
                        </span>
                        <span className="text-xs font-extrabold text-emerald-800 font-mono tabular-nums block">
                          Rp {nextRevenue.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-700">
                          ({revenueDelta >= 0 ? '+' : '-'}Rp{' '}
                          {Math.abs(revenueDelta).toLocaleString('id-ID')})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between font-bold">
                      <span className="text-teal-900">Total Belanja Restok Ini:</span>
                      <span className="text-sm font-extrabold text-teal-950 font-mono tabular-nums">
                        Rp {(restockQty * effHpp).toLocaleString('id-ID')}
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
                );
              })()}

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
                    className="flex items-center justify-between px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-800 gap-2"
                  >
                    <span className="truncate">{c}</span>
                    {confirmDeleteCategory === c ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            deleteCategory(c);
                            setConfirmDeleteCategory(null);
                          }}
                          className="px-2.5 min-h-[30px] text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-md cursor-pointer"
                        >
                          Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteCategory(null)}
                          className="px-2 min-h-[30px] text-[11px] font-semibold text-slate-600 hover:bg-slate-200 rounded-md cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteCategory(c)}
                        className="min-w-[34px] min-h-[34px] flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer shrink-0"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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

              {excelError && (
                <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl font-bold border border-rose-200">
                  {excelError}
                </div>
              )}

              {excelFileName && !excelError && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-800 block">File: {excelFileName}</span>
                  <span className="text-emerald-700 font-bold block">
                    ✓ Terdeteksi {excelParsedProducts.length} baris produk siap diimpor.
                  </span>
                  {excelParsedProducts.length > 0 && (() => {
                    const totalUnits = excelParsedProducts.reduce((s, r) => s + (r.stock || 0), 0);
                    const addHpp = excelParsedProducts.reduce(
                      (s, r) => s + (r.stock || 0) * (r.hpp || 0),
                      0
                    );
                    const addRev = excelParsedProducts.reduce(
                      (s, r) => s + (r.stock || 0) * (r.price || 0),
                      0
                    );
                    const twinMatches = excelParsedProducts.filter(
                      (r) => findMatchingProductIndex(products, r) >= 0
                    ).length;
                    return (
                      <div className="text-[11px] text-slate-600 font-mono space-y-0.5 pt-1 border-t border-slate-200">
                        <div>
                          Total masuk: {totalUnits.toLocaleString('id-ID')} unit · Tambahan Aset HPP: +Rp{' '}
                          {addHpp.toLocaleString('id-ID')} · Potensi Omzet: +Rp{' '}
                          {addRev.toLocaleString('id-ID')}
                        </div>
                        {twinMatches > 0 && (
                          <div className="font-sans font-bold text-teal-800">
                            {twinMatches} baris produk sama/kembar akan digabung otomatis ke produk eksisting!
                          </div>
                        )}
                      </div>
                    );
                  })()}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92dvh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0 bg-white">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">
                  {editingProduct ? 'Edit Data Produk & Harga Grosir' : 'Tambah Produk Baru ke Database'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Isi satuan terkecil (mis. pcs / lembar) agar stok gudang &amp; paket grosir terpotong otomatis
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kertas HVS A4 75gr / Es Minuman Segar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                />
                {matchedTwinProduct && (
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[11px] text-amber-950 leading-snug">
                        <span className="font-extrabold block">
                          Produk sama sudah ada di gudang ({matchedTwinProduct.name})
                        </span>
                        <span>
                          Stok saat ini: <strong>{matchedTwinProduct.stock} {matchedTwinProduct.unit}</strong> ·
                          HPP: <strong>Rp {matchedTwinProduct.hpp.toLocaleString('id-ID')}</strong> ·
                          Jual: <strong>Rp {matchedTwinProduct.price.toLocaleString('id-ID')}</strong>.
                          Saat disimpan, stok akan <strong>digabung menjadi satu produk</strong> (tidak kembar).
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(matchedTwinProduct)}
                        className="px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10.5px] font-bold whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Edit Saja
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1 border-t border-amber-200/80">
                      <span className="text-[10px] font-bold text-amber-900">Hitung HPP gabung:</span>
                      <button
                        type="button"
                        onClick={() => setAddHppMode('weighted')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                          addHppMode === 'weighted'
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-white text-slate-700 border-amber-300'
                        }`}
                      >
                        Rata-rata Otomatis
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddHppMode('latest')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                          addHppMode === 'latest'
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-white text-slate-700 border-amber-300'
                        }`}
                      >
                        Pakai HPP Baru
                      </button>
                    </div>
                  </div>
                )}
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
                  <label className="font-bold text-slate-700 block mb-1">Satuan Terkecil (Gudang)</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="pcs / lembar / bungkus"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Price & Margin Calculation */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      HPP / Modal per {unit || 'pcs'} (Rp)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={hpp}
                      onChange={(e) => setHpp(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-right font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Harga Ecer / 1 {unit || 'pcs'} (Rp)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-right font-bold text-emerald-800"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-bold text-slate-800">Laba Ecer per {unit || 'pcs'}:</span>
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

              {/* Wholesale / Tiered Pricing Builder */}
              <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-teal-950 block">
                      Harga Grosir / Paket Kelipatan (Opsional)
                    </span>
                    <span className="text-[10.5px] text-teal-800 leading-snug block mt-0.5">
                      Contoh: Beli 3 pcs = Rp 5.000 (otomatis berlaku kelipatan 3, 6, 9 + sisa ecer), atau Kertas 4 lbr = Rp 1.000 &amp; 500 lbr (1 Rim) = Rp 55.000.
                    </span>
                  </div>
                  {priceTiers.length > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-teal-700 text-white rounded-md shrink-0 whitespace-nowrap">
                      {priceTiers.length} Paket
                    </span>
                  )}
                </div>

                {/* Existing Tiers List */}
                {priceTiers.length > 0 && (
                  <div className="space-y-1.5">
                    {priceTiers.map((tier) => {
                      const perUnit = Math.round(tier.price / tier.qty);
                      const retailCompare = tier.qty * price;
                      const hemat = Math.max(0, retailCompare - tier.price);
                      const belowHpp = hpp > 0 && perUnit < hpp;
                      return (
                        <div
                          key={tier.qty}
                          className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border bg-white ${
                            belowHpp ? 'border-amber-300 bg-amber-50/60' : 'border-teal-200'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-slate-900">
                                {tier.label ? `${tier.label} ` : ''}({tier.qty.toLocaleString('id-ID')} {unit || 'pcs'})
                              </span>
                              <span className="font-mono font-black text-emerald-800">
                                = Rp {tier.price.toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 flex-wrap">
                              <span>@ Rp {perUnit.toLocaleString('id-ID')}/{unit || 'pcs'}</span>
                              {hemat > 0 && (
                                <span className="text-emerald-700 font-bold">
                                  Hemat Rp {hemat.toLocaleString('id-ID')}
                                </span>
                              )}
                              {belowHpp && (
                                <span className="text-rose-700 font-bold">
                                  (Di bawah HPP Rp {hpp.toLocaleString('id-ID')})
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePriceTier(tier.qty)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0"
                            title="Hapus paket grosir ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Mini Live Simulation */}
                    {priceTiers[0] && (
                      <div className="px-2.5 py-1.5 bg-white/80 rounded-lg border border-teal-200/80 text-[10.5px] text-teal-900 font-mono">
                        <span className="font-sans font-bold text-teal-800 mr-1">Simulasi Kasir:</span>
                        {(() => {
                          const sampleQty = priceTiers[0].qty;
                          const plusOne = calculateTieredPricing({ price, unit, priceTiers }, sampleQty + 1);
                          const doubled = calculateTieredPricing({ price, unit, priceTiers }, sampleQty * 2);
                          return `${sampleQty + 1} ${unit || 'pcs'} = Rp ${plusOne.totalPrice.toLocaleString('id-ID')} · ${sampleQty * 2} ${unit || 'pcs'} = Rp ${doubled.totalPrice.toLocaleString('id-ID')}`;
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Add New Tier Row */}
                <div className="grid grid-cols-12 gap-1.5 items-end pt-1">
                  <div className="col-span-3">
                    <label className="text-[10px] font-bold text-teal-900 block mb-0.5">
                      Isi ({unit || 'pcs'})
                    </label>
                    <input
                      type="number"
                      min="2"
                      value={newTierQty}
                      onChange={(e) => {
                        setNewTierQty(e.target.value);
                        if (tierFormError) setTierFormError('');
                      }}
                      placeholder="3 / 4 / 500"
                      className="w-full px-2 py-1.5 bg-white border border-teal-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="text-[10px] font-bold text-teal-900 block mb-0.5">
                      Harga Paket (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newTierPrice}
                      onChange={(e) => {
                        setNewTierPrice(e.target.value);
                        if (tierFormError) setTierFormError('');
                      }}
                      placeholder="5000 / 55000"
                      className="w-full px-2 py-1.5 bg-white border border-teal-300 rounded-lg font-mono font-bold text-emerald-900 text-right focus:outline-none focus:ring-1 focus:ring-teal-600"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[10px] font-bold text-teal-900 block mb-0.5">
                      Label (Opsional)
                    </label>
                    <input
                      type="text"
                      value={newTierLabel}
                      onChange={(e) => setNewTierLabel(e.target.value)}
                      placeholder="Paket 3 / 1 Rim"
                      className="w-full px-2 py-1.5 bg-white border border-teal-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                    />
                  </div>
                  <div className="col-span-2">
                    <button
                      type="button"
                      onClick={handleAddPriceTier}
                      className="w-full min-h-[32px] px-2 py-1.5 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-0.5 whitespace-nowrap"
                      title="Tambahkan paket grosir"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Pakai</span>
                    </button>
                  </div>
                </div>

                {tierFormError && (
                  <p className="text-[10.5px] font-bold text-rose-700">{tierFormError}</p>
                )}
              </div>

              {/* Stock input & Minimum Stock Alert Threshold */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Stok Gudang ({unit || 'pcs'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Stok disimpan dalam satuan {unit || 'pcs'} dan berkurang otomatis saat jual ecer/grosir.
                  </span>
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

              {/* Live Active HPP & Potential Omzet Valuation Box */}
              {(() => {
                const entryAsset = Math.max(0, stock) * Math.max(0, hpp);
                const entryOmzet = Math.max(0, stock) * Math.max(0, price);
                const entryProfit = entryOmzet - entryAsset;
                const mergedPreview = matchedTwinProduct
                  ? mergeProductRecords(
                      matchedTwinProduct,
                      {
                        ...matchedTwinProduct,
                        name,
                        sku,
                        barcode,
                        category,
                        hpp,
                        price,
                        stock,
                        minStock,
                        unit,
                      },
                      { hppMode: addHppMode, preferIncomingPrice: true }
                    )
                  : null;

                return (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                        <span className="text-[9.5px] font-bold text-slate-500 block">
                          Nilai Aset (HPP)
                        </span>
                        <span className="text-xs font-extrabold text-slate-900 font-mono tabular-nums">
                          Rp {entryAsset.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="bg-white px-2 py-1.5 rounded-lg border border-emerald-200">
                        <span className="text-[9.5px] font-bold text-slate-500 block">
                          Potensi Omzet Aktif
                        </span>
                        <span className="text-xs font-extrabold text-emerald-800 font-mono tabular-nums">
                          Rp {entryOmzet.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="bg-white px-2 py-1.5 rounded-lg border border-teal-200">
                        <span className="text-[9.5px] font-bold text-slate-500 block">
                          Estimasi Laba Total
                        </span>
                        <span className="text-xs font-extrabold text-teal-800 font-mono tabular-nums">
                          {entryProfit >= 0 ? '+' : '-'}Rp {Math.abs(entryProfit).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                    {mergedPreview && (
                      <div className="text-[10.5px] font-semibold text-teal-900 pt-1 border-t border-emerald-200/80 font-mono">
                        Gabung dengan stok lama → Stok jadi {mergedPreview.stock} {mergedPreview.unit} ·
                        HPP Rp {mergedPreview.hpp.toLocaleString('id-ID')} · Aset Rp{' '}
                        {(mergedPreview.stock * mergedPreview.hpp).toLocaleString('id-ID')} · Omzet Rp{' '}
                        {(mergedPreview.stock * mergedPreview.price).toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>
                );
              })()}

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

      {/* AUDIT & HITUNG ULANG NILAI ASET (HPP) & POTENSI OMZET MODAL */}
      {isAuditModalOpen && valuationAudit && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 z-50"
          onClick={() => setIsAuditModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                  <Calculator className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm sm:text-base tracking-tight truncate">
                    Hasil Hitung Ulang Nilai Aset &amp; Potensi Omzet
                  </h4>
                  <p className="text-[11px] text-slate-300 truncate">
                    Dihitung ulang pukul {valuationAudit.auditedAt} · {valuationAudit.totalProducts} produk ({valuationAudit.totalUnits.toLocaleString('id-ID')} unit)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/70 text-xs">
              {/* Normalization & Diff Alert */}
              <div
                className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                  valuationAudit.fixedCount > 0 || valuationAudit.assetDiff !== 0 || valuationAudit.revenueDiff !== 0
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}
              >
                {valuationAudit.fixedCount > 0 ? (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-extrabold">
                    {valuationAudit.fixedCount > 0 || (valuationAudit.mergedDuplicateCount || 0) > 0
                      ? `${valuationAudit.fixedCount} data produk dinormalisasi${
                          (valuationAudit.mergedDuplicateCount || 0) > 0
                            ? ` & ${valuationAudit.mergedDuplicateCount} produk sama/kembar digabung menjadi satu`
                            : ''
                        } & disimpan ulang.`
                      : 'Seluruh angka stok, HPP, dan harga jual valid & telah dihitung ulang dari database produk terbaru.'}
                  </p>
                  {(valuationAudit.assetDiff !== 0 || valuationAudit.revenueDiff !== 0) && (
                    <p className="text-[11px] font-mono tabular-nums">
                      Koreksi Aset HPP: {valuationAudit.assetDiff >= 0 ? '+' : '-'}Rp{' '}
                      {Math.abs(valuationAudit.assetDiff).toLocaleString('id-ID')} · Koreksi Omzet:{' '}
                      {valuationAudit.revenueDiff >= 0 ? '+' : '-'}Rp{' '}
                      {Math.abs(valuationAudit.revenueDiff).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>

              {/* 4 KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Nilai Aset (HPP)
                  </span>
                  <span className="text-sm font-black text-slate-900 font-mono tabular-nums block mt-0.5">
                    Rp {valuationAudit.totalAssetHpp.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Potensi Omzet
                  </span>
                  <span className="text-sm font-black text-emerald-700 font-mono tabular-nums block mt-0.5">
                    Rp {valuationAudit.totalPotentialRevenue.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Potensi Laba
                  </span>
                  <span className="text-sm font-black text-teal-700 font-mono tabular-nums block mt-0.5">
                    +Rp {valuationAudit.totalPotentialProfit.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Rata-rata Margin
                  </span>
                  <span className="text-sm font-black text-slate-900 font-mono tabular-nums block mt-0.5">
                    {valuationAudit.averageMarginPct}%
                  </span>
                </div>
              </div>

              {/* Breakdown Per Kategori */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-extrabold text-slate-800">Rincian Nilai Aset &amp; Omzet Per Kategori</span>
                  <span className="text-[10.5px] text-slate-500 font-mono">
                    Rumus: ∑ (Stok × Harga)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200 text-[10.5px] text-slate-600 font-bold">
                        <th className="py-2 px-3">Kategori</th>
                        <th className="py-2 px-3 text-center">Produk</th>
                        <th className="py-2 px-3 text-center">Total Unit</th>
                        <th className="py-2 px-3 text-right">Nilai Aset (HPP)</th>
                        <th className="py-2 px-3 text-right">Potensi Omzet</th>
                        <th className="py-2 px-3 text-right">Est. Laba</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {valuationAudit.byCategory.map((cat) => (
                        <tr key={cat.category} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-800">{cat.category}</td>
                          <td className="py-2 px-3 text-center font-mono tabular-nums text-slate-600">
                            {cat.productCount}
                          </td>
                          <td className="py-2 px-3 text-center font-mono tabular-nums text-slate-800 font-semibold">
                            {cat.unitCount.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-900 font-bold">
                            Rp {cat.assetHpp.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-700 font-bold">
                            Rp {cat.potentialRevenue.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums text-teal-700 font-semibold">
                            +Rp {cat.potentialProfit.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Deteksi Anomali Produk */}
              {valuationAudit.anomalies.length > 0 && (
                <div className="bg-white rounded-xl border border-amber-300 overflow-hidden">
                  <div className="px-3.5 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
                    <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Temuan Anomali Hitungan ({valuationAudit.anomalies.length} Produk)</span>
                    </span>
                    <span className="text-[10.5px] text-amber-800 font-semibold">
                      Perlu dicek agar total akurat
                    </span>
                  </div>
                  <div className="divide-y divide-amber-100">
                    {valuationAudit.anomalies.map(({ product: ap, reasons }) => (
                      <div
                        key={ap.id}
                        className="px-3.5 py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">
                            {ap.name}{' '}
                            <span className="text-[10px] font-mono text-slate-500">({ap.sku})</span>
                          </div>
                          <div className="text-[11px] text-amber-800">
                            {reasons.join(' · ')}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAuditModalOpen(false);
                            handleOpenEdit(ap);
                          }}
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-lg text-[11px] cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Edit Produk
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRecalculateAssets}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Hitung Ulang Lagi</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white text-xs font-extrabold rounded-xl cursor-pointer whitespace-nowrap shrink-0"
              >
                Selesai &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
