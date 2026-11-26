import { Product, ProductPriceTier } from '../types/pos';
import { parseStockNumber } from './stockValuation';

export interface TierBreakdownLine {
  label: string;
  packQty: number;
  packPrice: number;
  count: number;
  totalUnits: number;
  subtotal: number;
  isBase: boolean;
}

export interface TieredPricingResult {
  quantity: number;
  totalPrice: number;
  retailTotal: number;
  savings: number;
  effectiveUnitPrice: number;
  hasWholesaleApplied: boolean;
  breakdown: TierBreakdownLine[];
  summaryLabel: string;
}

/**
 * Membersihkan & mengurutkan daftar harga grosir/paket agar valid dan bebas duplikat.
 */
export function sanitizePriceTiers(rawTiers: unknown): ProductPriceTier[] {
  if (!Array.isArray(rawTiers)) return [];

  const byQty = new Map<number, ProductPriceTier>();

  for (const raw of rawTiers) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    const qty = Math.round(parseStockNumber(item.qty, 0));
    const price = Math.max(0, Math.round(parseStockNumber(item.price, 0)));
    if (!Number.isFinite(qty) || qty < 2) continue;

    const rawLabel = typeof item.label === 'string' ? item.label.trim() : '';
    const existing = byQty.get(qty);
    if (!existing || price < existing.price) {
      byQty.set(qty, {
        id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `tier-${qty}`,
        qty,
        price,
        ...(rawLabel ? { label: rawLabel } : {}),
      });
    }
  }

  return Array.from(byQty.values()).sort((a, b) => a.qty - b.qty);
}

/**
 * Menghitung harga total termurah (kombinasi kelipatan paket grosir + sisa eceran)
 * menggunakan Dynamic Programming agar akurat untuk kelipatan berapapun.
 *
 * Contoh:
 * - Es (ecer 2.000, paket 3 = 5.000): beli 3 -> 5.000; beli 4 -> 7.000; beli 6 -> 10.000
 * - Kertas (ecer 500, 4 lbr = 1.000, 500 lbr/1 rim = 55.000):
 *   beli 4 -> 1.000; beli 500 -> 55.000; beli 504 -> 56.000; beli 505 -> 56.500
 */
export function calculateTieredPricing(
  product: Pick<Product, 'price' | 'unit' | 'priceTiers'>,
  rawQuantity: number
): TieredPricingResult {
  const quantity = Math.max(0, Math.round(Number(rawQuantity) || 0));
  const unit = (product.unit || 'pcs').trim() || 'pcs';
  const unitPrice = Math.max(0, Math.round(Number(product.price) || 0));
  const retailTotal = quantity * unitPrice;

  if (quantity === 0) {
    return {
      quantity: 0,
      totalPrice: 0,
      retailTotal: 0,
      savings: 0,
      effectiveUnitPrice: unitPrice,
      hasWholesaleApplied: false,
      breakdown: [],
      summaryLabel: '',
    };
  }

  const tiers = sanitizePriceTiers(product.priceTiers);
  if (tiers.length === 0) {
    return {
      quantity,
      totalPrice: retailTotal,
      retailTotal,
      savings: 0,
      effectiveUnitPrice: unitPrice,
      hasWholesaleApplied: false,
      breakdown: [
        {
          label: 'Ecer',
          packQty: 1,
          packPrice: unitPrice,
          count: quantity,
          totalUnits: quantity,
          subtotal: retailTotal,
          isBase: true,
        },
      ],
      summaryLabel: `${quantity} ${unit} Ecer`,
    };
  }

  interface PackDef {
    qty: number;
    price: number;
    label: string;
    isBase: boolean;
  }

  const packs: PackDef[] = [
    { qty: 1, price: unitPrice, label: 'Ecer', isBase: true },
    ...tiers.map((t) => ({
      qty: t.qty,
      price: t.price,
      label: t.label?.trim() || `Paket ${t.qty} ${unit}`,
      isBase: false,
    })),
  ];

  const counts = new Array<number>(packs.length).fill(0);

  // Optimasi untuk qty sangat besar (misal > 2500 lembar):
  // Ambil kelipatan paket dengan harga per unit termurah hingga sisa <= 2500 (atau < pack.qty)
  let remaining = quantity;
  if (remaining > 2500) {
    let bestIdx = 0;
    let bestUnitCost = packs[0].price;
    for (let i = 1; i < packs.length; i++) {
      const unitCost = packs[i].price / packs[i].qty;
      if (
        unitCost < bestUnitCost ||
        (unitCost === bestUnitCost && packs[i].qty > packs[bestIdx].qty)
      ) {
        bestUnitCost = unitCost;
        bestIdx = i;
      }
    }
    const bestPack = packs[bestIdx];
    const targetRemainder = Math.max(2000, bestPack.qty);
    if (remaining > targetRemainder) {
      const preCount = Math.floor((remaining - 2000) / bestPack.qty);
      if (preCount > 0) {
        counts[bestIdx] += preCount;
        remaining -= preCount * bestPack.qty;
      }
    }
  }

  // Exact Unbounded DP untuk sisa quantity
  const dp = new Float64Array(remaining + 1);
  const choice = new Int32Array(remaining + 1);
  dp[0] = 0;
  choice[0] = -1;

  for (let i = 1; i <= remaining; i++) {
    let minCost = dp[i - 1] + packs[0].price;
    let bestPackIdx = 0;

    for (let pIdx = 1; pIdx < packs.length; pIdx++) {
      const p = packs[pIdx];
      if (p.qty <= i) {
        const cand = dp[i - p.qty] + p.price;
        if (
          cand < minCost ||
          (cand === minCost && p.qty > packs[bestPackIdx].qty)
        ) {
          minCost = cand;
          bestPackIdx = pIdx;
        }
      }
    }

    dp[i] = minCost;
    choice[i] = bestPackIdx;
  }

  let cur = remaining;
  while (cur > 0) {
    const picked = choice[cur];
    if (picked < 0) break;
    counts[picked] += 1;
    cur -= packs[picked].qty;
  }

  const breakdown: TierBreakdownLine[] = [];
  for (let i = packs.length - 1; i >= 0; i--) {
    const count = counts[i];
    if (count <= 0) continue;
    const p = packs[i];
    breakdown.push({
      label: p.label,
      packQty: p.qty,
      packPrice: p.price,
      count,
      totalUnits: count * p.qty,
      subtotal: count * p.price,
      isBase: p.isBase,
    });
  }

  const totalPrice = breakdown.reduce((sum, b) => sum + b.subtotal, 0);
  const savings = Math.max(0, retailTotal - totalPrice);
  const hasWholesaleApplied = breakdown.some((b) => !b.isBase);
  const effectiveUnitPrice = quantity > 0 ? Math.round(totalPrice / quantity) : unitPrice;

  const summaryLabel = breakdown
    .map((b) =>
      b.isBase
        ? `${b.count}× Ecer`
        : `${b.count}× ${b.label}`
    )
    .join(' + ');

  return {
    quantity,
    totalPrice,
    retailTotal,
    savings,
    effectiveUnitPrice,
    hasWholesaleApplied,
    breakdown,
    summaryLabel,
  };
}

/**
 * Format ringkas daftar paket grosir untuk badge katalog/tabel.
 */
export function formatCompactRupiah(val: number): string {
  if (val >= 1000 && val % 1000 === 0) {
    return `${(val / 1000).toLocaleString('id-ID')}rb`;
  }
  if (val >= 1000) {
    return `${Number((val / 1000).toFixed(1)).toLocaleString('id-ID')}rb`;
  }
  return `Rp ${val.toLocaleString('id-ID')}`;
}

export function serializePriceTiersText(tiers?: ProductPriceTier[]): string {
  const clean = sanitizePriceTiers(tiers);
  if (clean.length === 0) return '';
  return clean
    .map((t) => (t.label ? `${t.qty}=${t.price} (${t.label})` : `${t.qty}=${t.price}`))
    .join('; ');
}

export function parsePriceTiersText(raw: unknown): ProductPriceTier[] {
  if (Array.isArray(raw)) return sanitizePriceTiers(raw);
  if (typeof raw !== 'string' || !raw.trim()) return [];

  const parts = raw
    .split(/[;|]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed: ProductPriceTier[] = [];
  for (const part of parts) {
    // Support: "3=5000 (Paket 3)" or "500=55000" or "4:1000"
    const match = part.match(/^(\d+)\s*[=:]\s*([0-9.,]+)(?:\s*\(([^)]+)\))?/);
    if (!match) continue;
    const qty = Math.round(parseStockNumber(match[1], 0));
    const price = Math.max(0, Math.round(parseStockNumber(match[2], 0)));
    const label = match[3]?.trim() || undefined;
    if (qty >= 2) {
      parsed.push({ id: `tier-${qty}`, qty, price, label });
    }
  }

  return sanitizePriceTiers(parsed);
}
