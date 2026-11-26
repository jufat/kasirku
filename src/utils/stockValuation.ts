import { Product } from '../types/pos';
import { sanitizePriceTiers } from './tieredPricing';

export interface CategoryValuationBreakdown {
  category: string;
  productCount: number;
  unitCount: number;
  assetHpp: number;
  potentialRevenue: number;
  potentialProfit: number;
}

export interface ProductValuationAnomaly {
  product: Product;
  reasons: string[];
}

export interface StockValuationResult {
  totalProducts: number;
  totalUnits: number;
  totalAssetHpp: number;
  totalPotentialRevenue: number;
  totalPotentialProfit: number;
  averageMarginPct: number;
  byCategory: CategoryValuationBreakdown[];
  anomalies: ProductValuationAnomaly[];
}

export interface StockValuationAudit extends StockValuationResult {
  auditedAt: string;
  fixedCount: number;
  mergedDuplicateCount?: number;
  mergedNames?: string[];
  previousAssetHpp: number;
  previousPotentialRevenue: number;
  assetDiff: number;
  revenueDiff: number;
}

/**
 * Parse angka dari Excel / localStorage / input string Indonesia secara aman.
 * Menangani format seperti "Rp 68.000", "68.000", "68,000", "10 pcs", atau angka murni.
 */
export function parseStockNumber(raw: unknown, fallback = 0): number {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : fallback;
  }
  if (typeof raw !== 'string') {
    return fallback;
  }

  let s = raw.trim();
  if (!s) return fallback;

  // Strip currency prefix & trailing ",00" / ".00"
  s = s.replace(/^(rp\.?|idr)\s*/i, '').trim();
  s = s.replace(/[.,]0{1,2}\s*$/, '');

  // Detect Indonesian thousand separator (e.g. 1.500.000 or 68.000) or US comma thousand separator
  if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    const parsed = Number(s.replace(/\./g, ''));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  if (/^-?\d{1,3}(,\d{3})+$/.test(s)) {
    const parsed = Number(s.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  // Handle simple decimal string or embedded number like "12 pcs"
  const normalized = s.replace(/[^\d.,-]/g, '').replace(',', '.');
  if (!normalized || normalized === '-' || normalized === '.') {
    return fallback;
  }
  const num = Number(normalized);
  return Number.isFinite(num) ? num : fallback;
}

export function normalizeProductRecord(raw: Product): {
  product: Product;
  wasFixed: boolean;
  fixReasons: string[];
} {
  const fixReasons: string[] = [];

  const rawHpp = parseStockNumber(raw.hpp, 0);
  const rawPrice = parseStockNumber(raw.price, 0);
  const rawStock = parseStockNumber(raw.stock, 0);
  const rawMin = parseStockNumber(raw.minStock, 1);

  const hpp = Math.max(0, Math.round(rawHpp));
  const price = Math.max(0, Math.round(rawPrice));
  const stock = Math.max(0, Math.round(rawStock));
  const minStock = Math.max(1, Math.round(rawMin));
  const name = typeof raw.name === 'string' ? raw.name.trim() : String(raw.name || 'Produk');
  const sku = typeof raw.sku === 'string' ? raw.sku.trim() : String(raw.sku || '');
  const category =
    typeof raw.category === 'string' && raw.category.trim()
      ? raw.category.trim()
      : 'Aksesoris & Lainnya';
  const unit = typeof raw.unit === 'string' && raw.unit.trim() ? raw.unit.trim() : 'pcs';

  if (typeof raw.hpp !== 'number' || !Number.isFinite(raw.hpp) || raw.hpp < 0 || raw.hpp !== hpp) {
    fixReasons.push('HPP dinormalisasi ke angka valid');
  }
  if (
    typeof raw.price !== 'number' ||
    !Number.isFinite(raw.price) ||
    raw.price < 0 ||
    raw.price !== price
  ) {
    fixReasons.push('Harga jual dinormalisasi ke angka valid');
  }
  if (
    typeof raw.stock !== 'number' ||
    !Number.isFinite(raw.stock) ||
    raw.stock < 0 ||
    raw.stock !== stock
  ) {
    fixReasons.push('Stok negatif/tidak valid dinormalisasi');
  }
  if (
    typeof raw.minStock !== 'number' ||
    !Number.isFinite(raw.minStock) ||
    raw.minStock < 1
  ) {
    fixReasons.push('Batas minimum stok dinormalisasi');
  }

  const sanitizedTiers = sanitizePriceTiers(raw.priceTiers);
  if (
    Array.isArray(raw.priceTiers) &&
    raw.priceTiers.length > 0 &&
    sanitizedTiers.length !== raw.priceTiers.length
  ) {
    fixReasons.push('Paket harga grosir dinormalisasi');
  }

  return {
    product: {
      ...raw,
      name,
      sku,
      category,
      unit,
      hpp,
      price,
      priceTiers: sanitizedTiers.length > 0 ? sanitizedTiers : undefined,
      stock,
      minStock,
    },
    wasFixed: fixReasons.length > 0,
    fixReasons,
  };
}

export function computeStockValuation(products: Product[]): StockValuationResult {
  let totalUnits = 0;
  let totalAssetHpp = 0;
  let totalPotentialRevenue = 0;

  const categoryMap = new Map<string, CategoryValuationBreakdown>();
  const anomalies: ProductValuationAnomaly[] = [];

  for (const rawProduct of products) {
    const { product, wasFixed, fixReasons } = normalizeProductRecord(rawProduct);
    const assetHpp = product.stock * product.hpp;
    const potentialRevenue = product.stock * product.price;
    const potentialProfit = potentialRevenue - assetHpp;

    totalUnits += product.stock;
    totalAssetHpp += assetHpp;
    totalPotentialRevenue += potentialRevenue;

    const existingCat = categoryMap.get(product.category) || {
      category: product.category,
      productCount: 0,
      unitCount: 0,
      assetHpp: 0,
      potentialRevenue: 0,
      potentialProfit: 0,
    };
    existingCat.productCount += 1;
    existingCat.unitCount += product.stock;
    existingCat.assetHpp += assetHpp;
    existingCat.potentialRevenue += potentialRevenue;
    existingCat.potentialProfit += potentialProfit;
    categoryMap.set(product.category, existingCat);

    const itemReasons: string[] = [...fixReasons];
    if (product.stock > 0 && product.hpp === 0) {
      itemReasons.push('HPP masih Rp 0 sehingga Nilai Aset (HPP) belum terhitung');
    }
    if (product.stock > 0 && product.price === 0) {
      itemReasons.push('Harga jual masih Rp 0 sehingga Potensi Omzet belum terhitung');
    }
    if (product.price > 0 && product.price < product.hpp) {
      itemReasons.push(
        `Harga jual (Rp ${product.price.toLocaleString('id-ID')}) di bawah HPP (Rp ${product.hpp.toLocaleString('id-ID')})`
      );
    }
    if (product.hpp > 0 && product.priceTiers && product.priceTiers.length > 0) {
      for (const tier of product.priceTiers) {
        const tierUnitPrice = Math.round(tier.price / tier.qty);
        if (tierUnitPrice < product.hpp) {
          const tierName = tier.label || `${tier.qty} ${product.unit}`;
          itemReasons.push(
            `Harga grosir "${tierName}" (@ Rp ${tierUnitPrice.toLocaleString('id-ID')}/${product.unit}) di bawah HPP (Rp ${product.hpp.toLocaleString('id-ID')})`
          );
        }
      }
    }

    if (itemReasons.length > 0 || wasFixed) {
      anomalies.push({
        product,
        reasons: itemReasons,
      });
    }
  }

  const totalPotentialProfit = totalPotentialRevenue - totalAssetHpp;
  const averageMarginPct =
    totalAssetHpp > 0 ? Math.round((totalPotentialProfit / totalAssetHpp) * 100) : 0;

  const byCategory = Array.from(categoryMap.values()).sort(
    (a, b) => b.assetHpp - a.assetHpp
  );

  return {
    totalProducts: products.length,
    totalUnits,
    totalAssetHpp,
    totalPotentialRevenue,
    totalPotentialProfit,
    averageMarginPct,
    byCategory,
    anomalies,
  };
}

export function normalizeProductNameKey(name: unknown): string {
  return String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function normalizeCodeKey(code: unknown): string {
  return String(code ?? '')
    .trim()
    .toLowerCase();
}

/**
 * Cari index produk yang sama/kembar berdasarkan Nama Produk (case-insensitive & spasi dinormalisasi),
 * Barcode yang sama, atau Kode SKU yang identik.
 */
export function findMatchingProductIndex(
  list: Product[],
  candidate: Pick<Product, 'name' | 'sku' | 'barcode'>,
  excludeId?: string
): number {
  const nameKey = normalizeProductNameKey(candidate.name);
  const barcodeKey = normalizeCodeKey(candidate.barcode);
  const skuKey = normalizeCodeKey(candidate.sku);

  return list.findIndex((item) => {
    if (excludeId && item.id === excludeId) return false;
    if (nameKey && normalizeProductNameKey(item.name) === nameKey) {
      return true;
    }
    const itemBarcode = normalizeCodeKey(item.barcode);
    if (barcodeKey.length >= 4 && itemBarcode.length >= 4 && itemBarcode === barcodeKey) {
      return true;
    }
    const itemSku = normalizeCodeKey(item.sku);
    if (skuKey.length >= 3 && itemSku.length >= 3 && itemSku === skuKey) {
      return true;
    }
    return false;
  });
}

/**
 * Gabungkan dua produk kembar/sama menjadi satu produk utuh.
 * Stok dijumlahkan, HPP dihitung rata-rata tertimbang (atau HPP terbaru),
 * paket grosir (priceTiers) digabung tanpa duplikasi qty, dan ID utama dipertahankan.
 */
export function mergeProductRecords(
  baseRaw: Product,
  incomingRaw: Product,
  options?: { hppMode?: 'weighted' | 'latest'; preferIncomingPrice?: boolean }
): Product {
  const base = normalizeProductRecord(baseRaw).product;
  const incoming = normalizeProductRecord(incomingRaw).product;
  const hppMode = options?.hppMode ?? 'weighted';
  const preferIncomingPrice = options?.preferIncomingPrice ?? true;

  const totalStock = Math.max(0, base.stock + incoming.stock);

  let nextHpp = base.hpp;
  if (hppMode === 'latest' && incoming.hpp > 0) {
    nextHpp = incoming.hpp;
  } else if (totalStock > 0) {
    if (base.stock > 0 && incoming.stock > 0 && base.hpp > 0 && incoming.hpp > 0) {
      nextHpp = Math.round(
        (base.stock * base.hpp + incoming.stock * incoming.hpp) / totalStock
      );
    } else if (incoming.hpp > 0 && (base.hpp === 0 || base.stock === 0)) {
      nextHpp = incoming.hpp;
    } else if (base.hpp > 0) {
      nextHpp = base.hpp;
    } else {
      nextHpp = incoming.hpp;
    }
  } else {
    nextHpp = incoming.hpp > 0 ? incoming.hpp : base.hpp;
  }

  let nextPrice = base.price;
  if (preferIncomingPrice && incoming.price > 0) {
    nextPrice = incoming.price;
  } else if (base.price > 0) {
    nextPrice = base.price;
  } else {
    nextPrice = incoming.price;
  }

  // Gabungkan paket grosir: incoming menimpa qty yang sama jika ada
  const tierMap = new Map<number, NonNullable<Product['priceTiers']>[number]>();
  for (const t of base.priceTiers || []) {
    tierMap.set(t.qty, t);
  }
  for (const t of incoming.priceTiers || []) {
    const prev = tierMap.get(t.qty);
    if (!prev || preferIncomingPrice) {
      tierMap.set(t.qty, {
        ...t,
        label: t.label || prev?.label,
      });
    }
  }
  const mergedTiers = sanitizePriceTiers(Array.from(tierMap.values()));

  const baseSkuIsTemp = /^IMP-|^ACC-\d{4}$/i.test(base.sku);
  const incomingSkuIsTemp = /^IMP-|^ACC-\d{4}$/i.test(incoming.sku);
  const nextSku =
    base.sku && (!baseSkuIsTemp || incomingSkuIsTemp || !incoming.sku)
      ? base.sku
      : incoming.sku || base.sku;

  return normalizeProductRecord({
    ...base,
    name: base.name || incoming.name,
    sku: nextSku,
    barcode: incoming.barcode || base.barcode,
    image: base.image || incoming.image,
    category: incoming.category || base.category,
    unit: base.unit || incoming.unit || 'pcs',
    hpp: nextHpp,
    price: nextPrice,
    priceTiers: mergedTiers.length > 0 ? mergedTiers : undefined,
    stock: totalStock,
    minStock: Math.max(base.minStock, incoming.minStock),
  }).product;
}

export interface DeduplicateProductsResult {
  products: Product[];
  mergedGroupCount: number;
  removedDuplicateCount: number;
  mergedNames: string[];
}

export function deduplicateProducts(list: Product[]): DeduplicateProductsResult {
  const result: Product[] = [];
  const mergedNameSet = new Set<string>();
  let removedDuplicateCount = 0;

  for (const raw of list) {
    const normalized = normalizeProductRecord(raw).product;
    const matchIdx = findMatchingProductIndex(result, normalized);
    if (matchIdx >= 0) {
      const existing = result[matchIdx];
      // Pada daftar eksisting (elemen awal biasanya lebih baru), pertahankan harga existing jika > 0
      result[matchIdx] = mergeProductRecords(existing, normalized, {
        hppMode: 'weighted',
        preferIncomingPrice: existing.price <= 0,
      });
      removedDuplicateCount += 1;
      mergedNameSet.add(existing.name);
    } else {
      result.push(normalized);
    }
  }

  return {
    products: result,
    mergedGroupCount: mergedNameSet.size,
    removedDuplicateCount,
    mergedNames: Array.from(mergedNameSet),
  };
}

export function countDuplicateProductGroups(list: Product[]): number {
  return deduplicateProducts(list).removedDuplicateCount;
}

