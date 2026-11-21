import { Product } from '../types/pos';

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

  return {
    product: {
      ...raw,
      name,
      sku,
      category,
      unit,
      hpp,
      price,
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
