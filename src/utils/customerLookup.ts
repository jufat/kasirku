import {
  AgencyTransaction,
  AtmMiniTransaction,
  DebtRecord,
  PPOBCategory,
  PPOBTransaction,
  PrintOrder,
  ServiceTicket,
} from '../types/pos';

export type CustomerSuggestionKind =
  | 'ewallet'
  | 'bank'
  | 'mbanking'
  | 'card'
  | 'qris'
  | 'ppob_hp'
  | 'ppob_pln'
  | 'ppob_pln_bulanan'
  | 'ppob_wifi'
  | 'ppob_game'
  | 'ppob_tagihan'
  | 'phone_general';

export interface CustomerDirectoryEntry {
  id: string;
  customerName: string;
  targetValue: string; // No HP / No ID / No Rekening / User ID Game
  displayTarget: string;
  kind: CustomerSuggestionKind;
  channelTag: string;
  provider?: string;
  cardType?: AtmMiniTransaction['cardType'];
  cardLast4?: string;
  ppobCategory?: PPOBCategory;
  gameUserId?: string;
  gameZoneId?: string;
  usageCount: number;
  lastDate: string;
}

export interface CustomerDirectorySources {
  atmMiniTransactions?: AtmMiniTransaction[];
  agencyTransactions?: AgencyTransaction[];
  ppobTransactions?: PPOBTransaction[];
  services?: ServiceTicket[];
  debts?: DebtRecord[];
  printOrders?: PrintOrder[];
}

const EWALLET_BRANDS = [
  'DANA',
  'GoPay',
  'OVO',
  'i.Saku',
  'ShopeePay',
  'LinkAja',
  'Maxim Driver',
  'AstraPay',
];

const GENERIC_NAMES = new Set([
  '',
  '-',
  'pelanggan',
  'pelanggan umum',
  'umum',
  'pelanggan kasbon',
  'pelanggan ppob',
  'pelanggan listrik',
  'pelanggan wifi',
  'pelanggan agen',
  'nasabah',
  'nasabah edc',
  'pelanggan qris',
  'nasabah m-banking',
  'nasabah m-banking / e-wallet',
  'player game',
  'pembeli',
  'customer',
  'guest',
]);

export const isGenericCustomerName = (name?: string): boolean => {
  const cleaned = (name || '').trim().replace(/\s+/g, ' ').toLowerCase();
  if (!cleaned) return true;
  if (GENERIC_NAMES.has(cleaned)) return true;
  if (cleaned.startsWith('pelanggan umum')) return true;
  return false;
};

const detectEwalletBrand = (...texts: Array<string | undefined>): string | undefined => {
  const combined = texts.filter(Boolean).join(' ').toLowerCase();
  return EWALLET_BRANDS.find((brand) => combined.includes(brand.toLowerCase()));
};

const extractIndonesianPhone = (...texts: Array<string | undefined>): string | undefined => {
  for (const text of texts) {
    if (!text) continue;
    const match = text.match(/(?:\+?62|0)8[\d\s-]{6,14}/);
    if (match) {
      let digits = match[0].replace(/\D/g, '');
      if (digits.startsWith('62')) {
        digits = `0${digits.slice(2)}`;
      }
      if (digits.length >= 9 && digits.length <= 15) {
        return digits;
      }
    }
  }
  return undefined;
};

const normalizeValidPhone = (raw?: string): string | undefined => {
  if (!raw) return undefined;
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('62') && digits.length >= 10) {
    digits = `0${digits.slice(2)}`;
  }
  if (digits.length < 8 || /^0+$/.test(digits)) return undefined;
  return digits;
};

const extractInsideParentheses = (raw?: string): string | undefined => {
  if (!raw) return undefined;
  const match = raw.match(/\(([^)]+)\)/);
  return match?.[1]?.trim();
};

export const buildCustomerDirectory = (
  sources: CustomerDirectorySources
): CustomerDirectoryEntry[] => {
  const entryMap = new Map<string, CustomerDirectoryEntry>();

  const upsert = (entry: Omit<CustomerDirectoryEntry, 'id' | 'usageCount'>) => {
    const cleanName = entry.customerName.trim().replace(/\s+/g, ' ');
    const cleanTarget = entry.targetValue.trim();
    if (isGenericCustomerName(cleanName)) return;
    if (!cleanTarget && !entry.cardLast4) return;

    const dedupeKey = `${cleanName.toLowerCase()}::${(cleanTarget || entry.cardLast4 || '').toLowerCase()}::${entry.kind}`;
    const existing = entryMap.get(dedupeKey);
    if (existing) {
      existing.usageCount += 1;
      if (entry.lastDate > existing.lastDate) {
        existing.lastDate = entry.lastDate;
      }
      return;
    }

    entryMap.set(dedupeKey, {
      ...entry,
      id: dedupeKey,
      customerName: cleanName,
      targetValue: cleanTarget,
      usageCount: 1,
    });
  };

  // 1. ATM Mini Transactions
  (sources.atmMiniTransactions || []).forEach((tx) => {
    if (isGenericCustomerName(tx.customerName)) return;

    const ewBrand = detectEwalletBrand(tx.bankName, tx.targetAccountOrPhone, tx.cardNumberMasked);
    const extractedPhone = extractIndonesianPhone(tx.targetAccountOrPhone, tx.cardNumberMasked);

    if (tx.cardType === 'E-Wallet' || tx.type === 'topup_ewallet_atm' || ewBrand) {
      const targetVal = extractedPhone || (tx.targetAccountOrPhone || '').trim();
      if (targetVal) {
        upsert({
          customerName: tx.customerName,
          targetValue: targetVal,
          displayTarget: targetVal,
          kind: 'ewallet',
          channelTag: `E-Wallet · ${ewBrand || tx.bankName}`,
          provider: ewBrand || tx.bankName,
          cardType: 'E-Wallet',
          lastDate: tx.date || '',
        });
      }
      return;
    }

    if (tx.type === 'mbanking_atm' || tx.cardType === 'M-Banking') {
      const rawTarget = (tx.targetAccountOrPhone || '').trim();
      // Jika format "Tarik Tunai M-Banking BRImo (0812xxx)" ambil isi kurung jika berupa nomor
      const paren = extractInsideParentheses(rawTarget);
      const cleanVal =
        extractedPhone ||
        (paren && /\d{5,}/.test(paren) ? paren : rawTarget.startsWith('Tarik Tunai') ? '' : rawTarget);
      if (cleanVal) {
        upsert({
          customerName: tx.customerName,
          targetValue: cleanVal,
          displayTarget: cleanVal,
          kind: 'mbanking',
          channelTag: `M-Banking · ${tx.bankName.split(' ')[0]}`,
          provider: tx.bankName,
          cardType: tx.cardType,
          lastDate: tx.date || '',
        });
      }
      return;
    }

    if (tx.type === 'transfer_atm') {
      const rawTarget = (tx.targetAccountOrPhone || '').trim();
      if (rawTarget) {
        upsert({
          customerName: tx.customerName,
          targetValue: rawTarget,
          displayTarget: rawTarget,
          kind: 'bank',
          channelTag: `Transfer · ${tx.bankName}`,
          provider: tx.bankName,
          cardType: tx.cardType,
          lastDate: tx.date || '',
        });
      }
      return;
    }

    if (tx.type === 'tarik_tunai_atm') {
      const last4Match = (tx.cardNumberMasked || '').match(/(\d{4})$/);
      const last4 = last4Match?.[1];
      if (last4) {
        upsert({
          customerName: tx.customerName,
          targetValue: last4,
          displayTarget: `Kartu •••• ${last4} (${tx.bankName})`,
          kind: 'card',
          channelTag: `Debit ${tx.bankName}`,
          provider: tx.bankName,
          cardType: tx.cardType,
          cardLast4: last4,
          lastDate: tx.date || '',
        });
      }
    }
  });

  // 2. Agency Transactions (Transfer & Agen)
  (sources.agencyTransactions || []).forEach((tx) => {
    if (isGenericCustomerName(tx.customerName)) return;
    const ewBrand = detectEwalletBrand(tx.provider);
    if (tx.type === 'ewallet' || ewBrand) {
      const hp = normalizeValidPhone(tx.targetNumber) || tx.targetNumber.trim();
      if (hp) {
        upsert({
          customerName: tx.customerName,
          targetValue: hp,
          displayTarget: hp,
          kind: 'ewallet',
          channelTag: `E-Wallet · ${ewBrand || tx.provider}`,
          provider: ewBrand || tx.provider,
          cardType: 'E-Wallet',
          lastDate: tx.date || '',
        });
      }
    } else if (tx.targetNumber && tx.targetNumber.trim() !== '-') {
      upsert({
        customerName: tx.customerName,
        targetValue: tx.targetNumber.trim(),
        displayTarget: `${tx.targetNumber.trim()} (${tx.provider})`,
        kind: 'bank',
        channelTag: `Agen · ${tx.provider}`,
        provider: tx.provider,
        lastDate: tx.date || '',
      });
    }
  });

  // 3. PPOB Transactions
  (sources.ppobTransactions || []).forEach((tx) => {
    if (isGenericCustomerName(tx.customerName)) return;
    const target = (tx.targetNumber || '').trim();
    if (!target || target === '-') return;

    if (tx.category === 'pulsa' || tx.category === 'data') {
      upsert({
        customerName: tx.customerName,
        targetValue: target,
        displayTarget: target,
        kind: 'ppob_hp',
        channelTag: `${tx.category === 'data' ? 'Paket Data' : 'Pulsa'} · ${tx.provider}`,
        provider: tx.provider,
        ppobCategory: tx.category,
        lastDate: tx.date || '',
      });
    } else if (tx.category === 'pln') {
      upsert({
        customerName: tx.customerName,
        targetValue: target,
        displayTarget: target,
        kind: 'ppob_pln',
        channelTag: 'Token PLN (Prabayar)',
        provider: 'PLN',
        ppobCategory: 'pln',
        lastDate: tx.date || '',
      });
    } else if (tx.category === 'pln_bulanan') {
      upsert({
        customerName: tx.customerName,
        targetValue: target,
        displayTarget: target,
        kind: 'ppob_pln_bulanan',
        channelTag: 'Listrik Bulanan (PLN)',
        provider: 'PLN Pascabayar',
        ppobCategory: 'pln_bulanan',
        lastDate: tx.date || '',
      });
    } else if (tx.category === 'wifi') {
      upsert({
        customerName: tx.customerName,
        targetValue: target,
        displayTarget: target,
        kind: 'ppob_wifi',
        channelTag: `Wifi · ${tx.provider}`,
        provider: tx.provider,
        ppobCategory: 'wifi',
        lastDate: tx.date || '',
      });
    } else if (tx.category === 'game') {
      const zoneMatch = target.match(/^(.+?)\s*\(([^)]+)\)$/);
      const uid = zoneMatch ? zoneMatch[1].trim() : target;
      const zid = zoneMatch ? zoneMatch[2].trim() : '';
      upsert({
        customerName: tx.customerName,
        targetValue: target,
        displayTarget: target,
        kind: 'ppob_game',
        channelTag: `Game · ${tx.provider}`,
        provider: tx.provider,
        ppobCategory: 'game',
        gameUserId: uid,
        gameZoneId: zid,
        lastDate: tx.date || '',
      });
    } else {
      upsert({
        customerName: tx.customerName,
        targetValue: target,
        displayTarget: target,
        kind: 'ppob_tagihan',
        channelTag: `${tx.category.toUpperCase()} · ${tx.provider}`,
        provider: tx.provider,
        ppobCategory: tx.category,
        lastDate: tx.date || '',
      });
    }
  });

  // 4. Secondary fallback phone numbers from Services, Debts, Print Orders
  (sources.services || []).forEach((s) => {
    const phone = normalizeValidPhone(s.customerPhone);
    if (phone && !isGenericCustomerName(s.customerName)) {
      upsert({
        customerName: s.customerName,
        targetValue: phone,
        displayTarget: phone,
        kind: 'phone_general',
        channelTag: 'No. HP (Service HP)',
        lastDate: s.dateIn || '',
      });
    }
  });

  (sources.debts || []).forEach((d) => {
    const phone = normalizeValidPhone(d.customerPhone);
    if (phone && !isGenericCustomerName(d.customerName)) {
      upsert({
        customerName: d.customerName,
        targetValue: phone,
        displayTarget: phone,
        kind: 'phone_general',
        channelTag: 'No. HP (Kasbon)',
        lastDate: d.date || '',
      });
    }
  });

  (sources.printOrders || []).forEach((p) => {
    const phone = normalizeValidPhone(p.customerPhone);
    if (phone && !isGenericCustomerName(p.customerName)) {
      upsert({
        customerName: p.customerName,
        targetValue: phone,
        displayTarget: phone,
        kind: 'phone_general',
        channelTag: 'No. HP (Percetakan)',
        lastDate: p.date || '',
      });
    }
  });

  // Suppress redundant phone_general if exact same name + phone already exists as ewallet or ppob_hp
  const richerKeys = new Set<string>();
  entryMap.forEach((item) => {
    if (item.kind === 'ewallet' || item.kind === 'ppob_hp') {
      richerKeys.add(`${item.customerName.toLowerCase()}::${item.targetValue}`);
    }
  });

  return Array.from(entryMap.values()).filter((item) => {
    if (item.kind === 'phone_general') {
      return !richerKeys.has(`${item.customerName.toLowerCase()}::${item.targetValue}`);
    }
    return true;
  });
};

export const searchCustomerDirectory = (
  entries: CustomerDirectoryEntry[],
  query: string,
  preferKinds: CustomerSuggestionKind[] = [],
  limit: number = 8
): CustomerDirectoryEntry[] => {
  const q = query.trim().toLowerCase();
  const preferSet = new Set(preferKinds);

  const scored = entries
    .map((entry) => {
      const nameLower = entry.customerName.toLowerCase();
      const targetLower = entry.targetValue.toLowerCase();
      const tagLower = entry.channelTag.toLowerCase();

      if (q) {
        const matchesName = nameLower.includes(q);
        const matchesTarget = targetLower.includes(q);
        const matchesTag = tagLower.includes(q);
        if (!matchesName && !matchesTarget && !matchesTag) return null;
      }

      let score = 0;
      if (q) {
        if (nameLower === q) score += 100;
        else if (nameLower.startsWith(q)) score += 60;
        else if (nameLower.includes(q)) score += 35;
        else if (targetLower.includes(q)) score += 20;
        else score += 10;
      }

      if (preferSet.has(entry.kind)) {
        const idx = preferKinds.indexOf(entry.kind);
        score += Math.max(10, 40 - idx * 6);
      } else if (entry.kind !== 'phone_general') {
        score += 5;
      }

      score += Math.min(10, entry.usageCount * 2);

      return { entry, score };
    })
    .filter((x): x is { entry: CustomerDirectoryEntry; score: number } => Boolean(x))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.entry.lastDate.localeCompare(a.entry.lastDate);
    });

  return scored.slice(0, limit).map((x) => x.entry);
};
