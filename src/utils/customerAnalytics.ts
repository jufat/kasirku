import {
  AgencyTransaction,
  AtmMiniTransaction,
  PPOBTransaction,
  POSTransaction,
  PrintOrder,
  ServiceTicket,
} from '../types/pos';

export interface CustomerAnalyticsSources {
  transactions: POSTransaction[];
  atmMiniTransactions: AtmMiniTransaction[];
  agencyTransactions: AgencyTransaction[];
  ppobTransactions: PPOBTransaction[];
  services: ServiceTicket[];
  printOrders: PrintOrder[];
}

export type CustomerDivision =
  | 'Kasir POS'
  | 'Keranjang Besar'
  | 'ATM Mini & Agen'
  | 'PPOB & Tagihan'
  | 'Service HP'
  | 'Percetakan';

export interface NormalizedCustomerVisit {
  id: string;
  dateKey: string;
  rawDate: string;
  division: CustomerDivision;
  rawName: string;
  normalizedKey: string;
  isAnonymous: boolean;
  phone?: string;
}

export interface CustomerIdentitySummary {
  key: string;
  displayName: string;
  phone?: string;
  visitCount: number;
  divisions: CustomerDivision[];
  lastDateKey: string;
  isAnonymous: boolean;
}

export interface CustomerPeriodStats {
  periodId: 'harian' | 'mingguan' | 'bulanan';
  label: string;
  sublabel: string;
  days: number;
  totalVisits: number;
  uniqueCustomers: number;
  repeatCustomers: number;
  singleVisitCustomers: number;
  repeatTotalVisits: number;
  repeatExtraVisits: number;
  anonymousWalkInCount: number;
  namedVisitsCount: number;
  repeatCustomerList: CustomerIdentitySummary[];
  allCustomerList: CustomerIdentitySummary[];
  divisionCounts: Record<CustomerDivision, number>;
}

const GENERIC_CUSTOMER_NAMES = new Set([
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
  'nasabah m-banking / e-wallet',
  'player game',
  'pembeli',
  'customer',
  'guest',
  'walk-in',
]);

export const toLocalDateKey = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const parseTxDateKey = (dateStr?: string): string | null => {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();

  // 1. ISO / YYYY-MM-DD (e.g. "2026-11-15 09:30" or "2026-11-15T...")
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  // 2. Indonesian locale D/M/YYYY or DD/MM/YYYY (e.g. "15/11/2026, 01.55.52")
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`;
  }

  // 3. Dash DD-MM-YYYY
  const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (dashMatch) {
    return `${dashMatch[3]}-${dashMatch[2].padStart(2, '0')}-${dashMatch[1].padStart(2, '0')}`;
  }

  // 4. Fallback native Date parsing
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return toLocalDateKey(parsed);
  }

  return null;
};

const normalizePhoneDigits = (raw?: string): string | undefined => {
  if (!raw) return undefined;
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('62') && digits.length >= 10) {
    digits = `0${digits.slice(2)}`;
  }
  if (digits.length < 8 || /^0+$/.test(digits)) {
    return undefined;
  }
  return digits;
};

const isGenericName = (rawName?: string): boolean => {
  const cleaned = (rawName || '').trim().replace(/\s+/g, ' ').toLowerCase();
  if (GENERIC_CUSTOMER_NAMES.has(cleaned)) return true;
  if (cleaned.startsWith('pelanggan umum')) return true;
  return false;
};

const resolveIdentity = (
  visitId: string,
  rawName?: string,
  rawPhone?: string
): { key: string; displayName: string; isAnonymous: boolean; phone?: string } => {
  const cleanName = (rawName || '').trim().replace(/\s+/g, ' ');
  const phone = normalizePhoneDigits(rawPhone);

  if (!isGenericName(cleanName)) {
    return {
      key: `name:${cleanName.toLowerCase()}`,
      displayName: cleanName,
      isAnonymous: false,
      phone,
    };
  }

  if (phone) {
    return {
      key: `phone:${phone}`,
      displayName: cleanName && cleanName !== '-' ? `${cleanName} (${phone})` : phone,
      isAnonymous: false,
      phone,
    };
  }

  return {
    key: `anon:${visitId}`,
    displayName: cleanName && cleanName !== '-' ? cleanName : 'Pelanggan Umum',
    isAnonymous: true,
  };
};

export const extractDeduplicatedVisits = (
  sources: CustomerAnalyticsSources
): NormalizedCustomerVisit[] => {
  const visits: NormalizedCustomerVisit[] = [];
  const masterInvoiceDateMap = new Map<string, string | null>();

  // 1. Kasir POS & Keranjang Besar
  (sources.transactions || []).forEach((tx) => {
    const dateKey = parseTxDateKey(tx.date);
    if (tx.invoiceNo) {
      masterInvoiceDateMap.set(tx.invoiceNo, dateKey);
    }
    if (!dateKey) return;

    const itemPhone = tx.items?.find((i) => i.metadata?.customerPhone)?.metadata?.customerPhone;
    const visitId = `pos-${tx.id}`;
    const identity = resolveIdentity(visitId, tx.customerName, itemPhone);

    visits.push({
      id: visitId,
      dateKey,
      rawDate: tx.date,
      division: tx.isMasterCart ? 'Keranjang Besar' : 'Kasir POS',
      rawName: tx.customerName || 'Pelanggan Umum',
      normalizedKey: identity.key,
      isAnonymous: identity.isAnonymous,
      phone: identity.phone,
    });
  });

  // 2. ATM Mini (skip jika sudah tergabung di Keranjang Besar)
  (sources.atmMiniTransactions || []).forEach((tx) => {
    if (tx.masterCartInvoiceNo && masterInvoiceDateMap.has(tx.masterCartInvoiceNo)) {
      return;
    }
    const dateKey = parseTxDateKey(tx.date);
    if (!dateKey) return;

    const visitId = `atm-${tx.id}`;
    const identity = resolveIdentity(visitId, tx.customerName);

    visits.push({
      id: visitId,
      dateKey,
      rawDate: tx.date,
      division: 'ATM Mini & Agen',
      rawName: tx.customerName || 'Nasabah EDC',
      normalizedKey: identity.key,
      isAnonymous: identity.isAnonymous,
      phone: identity.phone,
    });
  });

  // 3. Transfer & Agen
  (sources.agencyTransactions || []).forEach((tx) => {
    const dateKey = parseTxDateKey(tx.date);
    if (!dateKey) return;

    const visitId = `ag-${tx.id}`;
    const identity = resolveIdentity(visitId, tx.customerName, tx.customerPhone);

    visits.push({
      id: visitId,
      dateKey,
      rawDate: tx.date,
      division: 'ATM Mini & Agen',
      rawName: tx.customerName || 'Pelanggan Agen',
      normalizedKey: identity.key,
      isAnonymous: identity.isAnonymous,
      phone: identity.phone,
    });
  });

  // 4. PPOB (skip jika sudah tergabung di Keranjang Besar)
  (sources.ppobTransactions || []).forEach((tx) => {
    if (tx.masterCartInvoiceNo && masterInvoiceDateMap.has(tx.masterCartInvoiceNo)) {
      return;
    }
    const dateKey = parseTxDateKey(tx.date);
    if (!dateKey) return;

    const visitId = `ppob-${tx.id}`;
    const identity = resolveIdentity(visitId, tx.customerName);

    visits.push({
      id: visitId,
      dateKey,
      rawDate: tx.date,
      division: 'PPOB & Tagihan',
      rawName: tx.customerName || 'Pelanggan PPOB',
      normalizedKey: identity.key,
      isAnonymous: identity.isAnonymous,
      phone: identity.phone,
    });
  });

  // 5. Percetakan & Fotokopi (skip jika sudah tergabung di Keranjang Besar)
  (sources.printOrders || []).forEach((order) => {
    if (order.masterCartInvoiceNo && masterInvoiceDateMap.has(order.masterCartInvoiceNo)) {
      return;
    }
    const dateKey = parseTxDateKey(order.date);
    if (!dateKey) return;

    const visitId = `print-${order.id}`;
    const identity = resolveIdentity(visitId, order.customerName, order.customerPhone);

    visits.push({
      id: visitId,
      dateKey,
      rawDate: order.date,
      division: 'Percetakan',
      rawName: order.customerName || 'Pelanggan Umum',
      normalizedKey: identity.key,
      isAnonymous: identity.isAnonymous,
      phone: identity.phone,
    });
  });

  // 6. Service HP (berdasarkan tanggal masuk; skip jika masuk & diambil di hari yang sama via Keranjang Besar)
  (sources.services || []).forEach((srv) => {
    const dateKey = parseTxDateKey(srv.dateIn);
    if (!dateKey) return;
    if (
      srv.masterCartInvoiceNo &&
      masterInvoiceDateMap.get(srv.masterCartInvoiceNo) === dateKey
    ) {
      return;
    }

    const visitId = `srv-${srv.id}`;
    const identity = resolveIdentity(visitId, srv.customerName, srv.customerPhone);

    visits.push({
      id: visitId,
      dateKey,
      rawDate: srv.dateIn,
      division: 'Service HP',
      rawName: srv.customerName || 'Pelanggan Umum',
      normalizedKey: identity.key,
      isAnonymous: identity.isAnonymous,
      phone: identity.phone,
    });
  });

  return visits;
};

export const computeCustomerStatsForRange = (
  visits: NormalizedCustomerVisit[],
  options: {
    periodId: 'harian' | 'mingguan' | 'bulanan';
    label: string;
    sublabel: string;
    days: number;
    referenceDate?: Date;
  }
): CustomerPeriodStats => {
  const now = options.referenceDate || new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const rangeStart = new Date(todayStart.getTime() - Math.max(0, options.days - 1) * 86400000);

  const startKey = toLocalDateKey(rangeStart);
  const endKey = toLocalDateKey(todayStart);

  const filtered = visits.filter((v) => v.dateKey >= startKey && v.dateKey <= endKey);

  const divisionCounts: Record<CustomerDivision, number> = {
    'Kasir POS': 0,
    'Keranjang Besar': 0,
    'ATM Mini & Agen': 0,
    'PPOB & Tagihan': 0,
    'Service HP': 0,
    Percetakan: 0,
  };

  const identityMap = new Map<
    string,
    {
      displayName: string;
      phone?: string;
      visitCount: number;
      divisions: Set<CustomerDivision>;
      lastDateKey: string;
      isAnonymous: boolean;
    }
  >();

  let anonymousWalkInCount = 0;

  filtered.forEach((v) => {
    divisionCounts[v.division] = (divisionCounts[v.division] || 0) + 1;
    if (v.isAnonymous) {
      anonymousWalkInCount += 1;
    }

    const existing = identityMap.get(v.normalizedKey);
    if (existing) {
      existing.visitCount += 1;
      existing.divisions.add(v.division);
      if (v.dateKey > existing.lastDateKey) {
        existing.lastDateKey = v.dateKey;
      }
      if (!existing.phone && v.phone) {
        existing.phone = v.phone;
      }
    } else {
      identityMap.set(v.normalizedKey, {
        displayName: v.isAnonymous ? 'Pelanggan Umum' : v.rawName.trim(),
        phone: v.phone,
        visitCount: 1,
        divisions: new Set([v.division]),
        lastDateKey: v.dateKey,
        isAnonymous: v.isAnonymous,
      });
    }
  });

  const allCustomerList: CustomerIdentitySummary[] = Array.from(identityMap.entries())
    .map(([key, item]) => ({
      key,
      displayName: item.displayName,
      phone: item.phone,
      visitCount: item.visitCount,
      divisions: Array.from(item.divisions),
      lastDateKey: item.lastDateKey,
      isAnonymous: item.isAnonymous,
    }))
    .sort((a, b) => {
      if (b.visitCount !== a.visitCount) return b.visitCount - a.visitCount;
      if (a.isAnonymous !== b.isAnonymous) return a.isAnonymous ? 1 : -1;
      return b.lastDateKey.localeCompare(a.lastDateKey);
    });

  const repeatCustomerList = allCustomerList.filter((c) => !c.isAnonymous && c.visitCount >= 2);
  const uniqueCustomers = allCustomerList.length;
  const repeatCustomers = repeatCustomerList.length;
  const repeatTotalVisits = repeatCustomerList.reduce((sum, c) => sum + c.visitCount, 0);
  const repeatExtraVisits = repeatTotalVisits - repeatCustomers;
  const singleVisitCustomers = Math.max(0, uniqueCustomers - repeatCustomers);

  return {
    periodId: options.periodId,
    label: options.label,
    sublabel: options.sublabel,
    days: options.days,
    totalVisits: filtered.length,
    uniqueCustomers,
    repeatCustomers,
    singleVisitCustomers,
    repeatTotalVisits,
    repeatExtraVisits,
    anonymousWalkInCount,
    namedVisitsCount: filtered.length - anonymousWalkInCount,
    repeatCustomerList,
    allCustomerList,
    divisionCounts,
  };
};
