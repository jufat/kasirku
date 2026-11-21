import { AtmMiniTransaction, AtmMiniType, PPOBCategory } from '../types/pos';

export type QuickImportMode = 'atm_mini' | 'ppob';

export type ParseConfidence = 'tinggi' | 'sedang' | 'perlu_cek';

export interface ParsedAtmMiniItem {
  id: string;
  sourceApp: string;
  referenceNo: string;
  rawExcerpt: string;
  atmType: AtmMiniType;
  channel: 'kartu_debit' | 'ewallet' | 'mbanking' | 'qris';
  bankName: string;
  cardType: AtmMiniTransaction['cardType'];
  targetAccountOrPhone: string;
  customerName: string;
  nominal: number;
  adminEdcFee: number;
  counterFee: number;
  paymentMethod: 'tunai' | 'qris';
  adminDeductionType: 'tambah_transfer' | 'potong_tunai' | 'tunai_konter';
  note: string;
  confidence: ParseConfidence;
}

export interface ParsedPPOBItem {
  id: string;
  sourceApp: string;
  referenceNo: string;
  rawExcerpt: string;
  category: PPOBCategory;
  provider: string;
  targetNumber: string;
  gameZoneId?: string;
  packageName: string;
  hpp: number;
  loketProfit: number;
  sellingPrice: number;
  customerName: string;
  paymentMethod: 'tunai' | 'qris';
  note: string;
  confidence: ParseConfidence;
}

export interface QuickReceiptSample {
  label: string;
  text: string;
}

export const ATM_MINI_RECEIPT_SAMPLES: QuickReceiptSample[] = [
  {
    label: 'Transfer BRImo',
    text: `BRImo - Transaksi Berhasil\nTransfer ke BCA 1234567890 a.n. Budi Santoso\nNominal: Rp 500.000\nBiaya Admin: Rp 2.500\nNo. Ref: BR91827364`,
  },
  {
    label: 'Top Up DANA',
    text: `Top Up Saldo DANA Berhasil\nNomor Tujuan: 081298765432 a.n. Siti Aminah\nNominal: Rp 150.000\nAdmin: Rp 1.000\nRef: DN-881209`,
  },
  {
    label: 'Batch 2 Struk',
    text: `Transfer BRI 500rb ke 002101049281 Budi\nTarik Tunai DANA 200rb 081234567890 Ani`,
  },
];

export const PPOB_RECEIPT_SAMPLES: QuickReceiptSample[] = [
  {
    label: 'Token PLN',
    text: `TRX SUKSES OrderKuota\nToken Listrik PLN 50.000\nID Pel: 54210987654 a.n. Hendra\nModal: Rp 50.250\nSN: 4819-2019-4812-1029`,
  },
  {
    label: 'Listrik / Wifi',
    text: `Pembayaran Indihome SUKSES\nID Pelanggan: 142109283741 a.n. Ibu Ratna\nTagihan: Rp 315.000\nAdmin App: Rp 2.500`,
  },
  {
    label: 'Batch Pulsa & PLN',
    text: `Pulsa Telkomsel 081234567890 25rb Modal 24.400 Budi\nToken PLN 542109876542 50rb Modal 50.200 Pak Andi`,
  },
];

// Normalize Indonesian phone numbers (e.g. +62812... / 62812... -> 0812...)
export function normalizeIndoPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('628') && digits.length >= 10 && digits.length <= 15) {
    return '0' + digits.slice(2);
  }
  return digits;
}

export function detectTelcoOperatorFromPhone(phone: string): string {
  const cleaned = normalizeIndoPhone(phone);
  if (/^08(11|12|13|21|22|23|51|52|53)/.test(cleaned)) return 'Telkomsel';
  if (/^08(14|15|16|55|56|57|58)/.test(cleaned)) return 'Indosat';
  if (/^08(17|18|19|59|77|78)/.test(cleaned)) return 'XL';
  if (/^08(31|32|33|38)/.test(cleaned)) return 'Axis';
  if (/^08(95|96|97|98|99)/.test(cleaned)) return 'Tri';
  if (/^08(81|82|83|84|85|86|87|88|89)/.test(cleaned)) return 'Smartfren';
  return 'Telkomsel';
}

// Parse currency values including Indonesian separators & shorthand ("500rb", "1.5jt", "Rp 157.200,00")
export function parseFlexibleRupiah(rawSnippet: string): number {
  let s = rawSnippet.trim().toLowerCase();
  if (!s) return 0;

  // Strip currency prefix
  s = s.replace(/^(rp\.?|idr)\s*/i, '').trim();

  // Handle jt / juta shorthand (e.g., 1.5jt or 1,5 jt -> 1.500.000)
  const jtMatch = s.match(/^(\d+(?:[.,]\d+)?)\s*(jt|juta)\b/);
  if (jtMatch) {
    const normalizedFloat = parseFloat(jtMatch[1].replace(',', '.'));
    return Number.isFinite(normalizedFloat) ? Math.round(normalizedFloat * 1_000_000) : 0;
  }

  // Handle rb / ribu / k shorthand (e.g., 500rb, 25k, 2.5rb)
  const rbMatch = s.match(/^(\d+(?:[.,]\d+)?)\s*(rb|ribu|k)\b/);
  if (rbMatch) {
    const rawNum = rbMatch[1];
    // Treat "1.500rb" as 1500*1000 vs "2.5rb" as 2.5*1000
    if (/^\d+\.\d{3}$/.test(rawNum)) {
      return parseInt(rawNum.replace('.', ''), 10) * 1000;
    }
    const normalizedFloat = parseFloat(rawNum.replace(',', '.'));
    return Number.isFinite(normalizedFloat) ? Math.round(normalizedFloat * 1000) : 0;
  }

  // Strip trailing decimals like ,00 or .00
  s = s.replace(/[.,]0{1,2}$/, '');

  // Handle formatted numbers: 150.000 or 150,000 or 157200
  const digits = s.replace(/\D/g, '');
  if (!digits) return 0;
  const val = parseInt(digits, 10);
  if (!Number.isFinite(val) || val > 250_000_000) return 0;
  return val;
}

function hasMonetarySignal(line: string): boolean {
  return /(?:rp\.?\s*\d|idr\s*\d|\b\d+(?:[.,]\d+)?\s*(?:rb|ribu|k|jt|juta)\b|(?:nominal|tagihan|pokok|harga|hrg|modal|hpp|total|sebesar|bayar|tarik|transfer|top\s*up|topup)\s*[:=]?\s*(?:rp\.?\s*)?\d)/i.test(
    line
  );
}

// Split raw paste into 1 or more receipt blocks while keeping multi-line single receipts whole
export function splitReceiptBlocks(rawText: string): string[] {
  const normalized = rawText.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  // 1. Explicit horizontal separators (---, ===, ***)
  const explicitChunks = normalized
    .split(/\n\s*[-=*_]{3,}\s*\n/g)
    .map((c) => c.trim())
    .filter(Boolean);

  if (explicitChunks.length > 1) {
    return explicitChunks;
  }

  // 2. Check blank-line separated chunks: only treat them as separate receipts if >= 2 chunks contain their own monetary values
  const paragraphChunks = normalized
    .split(/\n\s*\n+/g)
    .map((c) => c.trim())
    .filter(Boolean);

  if (paragraphChunks.length > 1) {
    const moneyChunks = paragraphChunks.filter((c) => hasMonetarySignal(c));
    if (moneyChunks.length >= 2) {
      // Merge non-monetary orphan chunks (like a store footer) into the preceding chunk
      const merged: string[] = [];
      for (const chunk of paragraphChunks) {
        if (merged.length > 0 && !hasMonetarySignal(chunk)) {
          merged[merged.length - 1] = `${merged[merged.length - 1]}\n${chunk}`;
        } else {
          merged.push(chunk);
        }
      }
      if (merged.length > 1) return merged;
    }
  }

  // 3. Compact multi-line notes/WhatsApp lists where EVERY line looks like a separate transaction
  const lines = normalized
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length >= 2 && lines.length <= 20) {
    const linesWithMoneyAndAction = lines.filter(
      (l) =>
        hasMonetarySignal(l) &&
        /(?:transfer|tf|tarik|cashout|wd|top\s*up|topup|isi\s*saldo|dana|gopay|ovo|shopeepay|linkaja|qris|pulsa|kuota|data|token|pln|listrik|wifi|indihome|biznet|iconnet|bpjs|pdam|game|ml|mlbb|ff|pubg|08\d{7,11})/i.test(
          l
        )
    );
    // Avoid splitting a single receipt whose own labeled lines happen to mention Nominal/Admin/Total
    const looksLikeSingleReceiptFields = lines.some((l) =>
      /^(?:nominal|biaya\s*admin|admin|total(?:\s*bayar)?|no\.?\s*ref|ref|sn|tanggal|status|berhasil)\s*[:=-]?/i.test(
        l
      )
    );
    if (!looksLikeSingleReceiptFields && linesWithMoneyAndAction.length === lines.length) {
      return lines;
    }
  }

  return [normalized];
}

function detectSourceApp(text: string): string {
  const lower = text.toLowerCase();
  if (/\bbrimo\b/.test(lower)) return 'BRImo';
  if (/\blivin\b|\bmandiri\b/.test(lower) && /livin/.test(lower)) return "Livin' Mandiri";
  if (/\b(mybca|bca\s*mobile|m-transfer|m-bca)\b/.test(lower)) return 'BCA Mobile';
  if (/\bbni\s*mobile|wondr\b/.test(lower)) return 'BNI Mobile';
  if (/\bbsi\s*mobile\b/.test(lower)) return 'BSI Mobile';
  if (/\bseabank\b/.test(lower)) return 'SeaBank';
  if (/\borderkuota\b/.test(lower)) return 'OrderKuota';
  if (/\bmitra\s*bukalapak\b/.test(lower)) return 'Mitra Bukalapak';
  if (/\bpayfazz\b|\bfazz\b/.test(lower)) return 'Payfazz';
  if (/\bdigipos\b/.test(lower)) return 'Digipos';
  if (/\bdana\b/.test(lower)) return 'DANA';
  if (/\bgopay\b/.test(lower)) return 'GoPay';
  if (/\bovo\b/.test(lower)) return 'OVO';
  if (/\bshopeepay\b/.test(lower)) return 'ShopeePay';
  if (/\blinkaja\b/.test(lower)) return 'LinkAja';
  if (/\bqris\b/.test(lower)) return 'QRIS';
  if (/\b(bri|bca|bni|mandiri|bsi|cimb|danamon)\b/.test(lower)) return 'M-Banking / Bank';
  return 'Struk / Catatan';
}

function extractReferenceNo(text: string): string {
  const match = text.match(
    /(?:no\.?\s*ref(?:erensi)?|ref(?:\s*no)?|sn|serial\s*number|rrn|trace(?:\s*no)?|id\s*trx|kode\s*penarikan)[:\s#-]*([A-Z0-9][A-Z0-9-]{3,30})/i
  );
  if (match && match[1]) {
    return match[1].trim();
  }
  return '';
}

function cleanNameCandidate(raw: string): string {
  const cleaned = raw
    .replace(
      /\b(berhasil|sukses|nominal|rp\.?|idr|admin|total|ref|sn|via|sebesar|tagihan|modal|hpp|hrg|harga|id\s*pel|idpel|no\.?\s*meter|meter)\b.*$/i,
      ''
    )
    .replace(/\d+.*$/, '')
    .replace(/[()[\]{},;:-]+$/g, '')
    .trim();
  if (cleaned.length < 2 || cleaned.length > 40) return '';
  // Reject non-name words
  if (
    /^(bca|bri|bni|mandiri|bsi|dana|gopay|ovo|shopeepay|linkaja|qris|pln|wifi|indihome|pulsa|data|sukses|berhasil|transaksi)$/i.test(
      cleaned
    )
  ) {
    return '';
  }
  // Title-case nicely if ALL CAPS
  if (cleaned === cleaned.toUpperCase()) {
    return cleaned.toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());
  }
  return cleaned;
}

function extractCustomerName(text: string, refNo: string): string {
  // 1. Explicit markers with word boundaries: a.n. / Atas Nama / Nama / Penerima / Nasabah / Pelanggan
  const labelPatterns = [
    /\b(?:a\.?\s*n\.?|atas\s*nama)\s*[:.\s-]*([^\n\r]+)/i,
    /\b(?:nama\s*(?:pelanggan|penerima|nasabah)?|pelanggan|nasabah|penerima|pemilik)\s*[:.\s-]+([^\n\r]+)/i,
    /\b(?:kepada|ke)\s+(?:\d{6,}\s*[-–]?\s*)?([A-Za-z][A-Za-z\s.'-]{2,34})/i,
  ];
  for (const pat of labelPatterns) {
    const m = text.match(pat);
    if (m && m[1]) {
      const candidate = cleanNameCandidate(m[1]);
      if (candidate) return candidate;
    }
  }

  // 2. Parentheses after phone/ID e.g. "081344556677 (Ahmad)"
  const parenMatches = [...text.matchAll(/\(([A-Za-z][A-Za-z\s.'-]{2,30})\)/g)];
  for (const pm of parenMatches) {
    const cand = cleanNameCandidate(pm[1]);
    if (cand) return cand;
  }

  // 3. Trailing name in compact single-line format: "Transfer BRI 500rb ke 002101049281 Budi"
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 1) {
    const trailingMatch = lines[0].match(
      /(?:\d{3,}|rb|ribu|k|jt|juta)\s+([A-Za-z][A-Za-z\s.'-]{1,25})$/i
    );
    if (trailingMatch && trailingMatch[1] && !refNo.includes(trailingMatch[1])) {
      const cand = cleanNameCandidate(trailingMatch[1]);
      if (cand) return cand;
    }
  }

  return '';
}

function extractPhoneAndAccount(text: string, refNo: string): {
  phone: string;
  accountOrId: string;
  gameZoneId?: string;
} {
  // Check MLBB/Genshin Game ID + Zone pattern first: e.g. 128910419 (2104)
  const gamePair = text.match(/\b(\d{6,12})\s*\((\d{3,6})\)/);
  if (gamePair) {
    return {
      phone: '',
      accountOrId: gamePair[1],
      gameZoneId: gamePair[2],
    };
  }

  // Phone numbers (08... or +628... or 628...), avoiding swallowing space + denomination like "081234567890 25rb"
  let phone = '';
  const phoneMatch = text.match(
    /(?:\+?62|0)8\d(?:(?:-?\d){7,12}|\d{1,2}(?:[\s-]\d{3,4}){2,3})(?![\d])/
  );
  if (phoneMatch) {
    phone = normalizeIndoPhone(phoneMatch[0]);
  }

  // Explicitly labeled ID / Rekening
  let accountOrId = '';
  const labeledIdMatch = text.match(
    /(?:id\s*pel(?:anggan)?|idpel|no\.?\s*meter|meter(?:an)?|no\.?\s*rek(?:ening)?|rekening|rek|va|virtual\s*account|user\s*id|player\s*id|tujuan)\s*[:.#-]*\s*(\d[\d\s-]{5,20}\d)/i
  );
  if (labeledIdMatch && labeledIdMatch[1]) {
    const digits = labeledIdMatch[1].replace(/\D/g, '');
    if (digits.length >= 6 && digits !== refNo.replace(/\D/g, '')) {
      accountOrId = digits.startsWith('628') ? normalizeIndoPhone(digits) : digits;
    }
  }

  // Fallback any standalone 8-16 digit ID/account that is not refNo or money
  if (!accountOrId) {
    const allLongDigits = [...text.matchAll(/\b(\d{8,16})\b/g)];
    for (const dm of allLongDigits) {
      const candidate = dm[1];
      if (refNo && refNo.replace(/\D/g, '') === candidate) continue;
      if (phone && normalizeIndoPhone(candidate) === phone) continue;
      // Avoid picking date strings like 20261116 or timestamp
      accountOrId = candidate;
      break;
    }
  }

  if (!accountOrId && phone) {
    accountOrId = phone;
  }

  return { phone, accountOrId };
}

interface ExtractedAmounts {
  nominal: number;
  adminFee: number;
  total: number;
  hasExplicitNominal: boolean;
  hasExplicitTotal: boolean;
}

function extractAmounts(text: string): ExtractedAmounts {
  let nominal = 0;
  let adminFee = 0;
  let total = 0;
  let hasExplicitNominal = false;
  let hasExplicitTotal = false;

  const nominalRegex =
    /(?:nominal|jumlah(?:\s*transfer)?|tagihan(?:\s*pokok)?|pokok|harga(?:\s*modal)?|hrg|modal|hpp|sebesar)\s*[:=]?\s*((?:rp\.?|idr)?\s*\d[\d.,]*(?:\s*(?:rb|ribu|k|jt|juta))?)/gi;
  for (const m of text.matchAll(nominalRegex)) {
    const val = parseFlexibleRupiah(m[1]);
    if (val > 0) {
      nominal = val;
      hasExplicitNominal = true;
      break;
    }
  }

  const adminRegex =
    /(?:biaya\s*admin|admin\s*(?:bank|app|edc|trx|transaksi)|biaya\s*transaksi|\badmin\b)\s*[:=]?\s*((?:rp\.?|idr)?\s*\d[\d.,]*(?:\s*(?:rb|ribu|k))?)/gi;
  for (const m of text.matchAll(adminRegex)) {
    const val = parseFlexibleRupiah(m[1]);
    if (val >= 0 && val <= 100_000) {
      adminFee = val;
      break;
    }
  }

  const totalRegex =
    /(?:total(?:\s*(?:bayar|transaksi|debet|pembayaran))?)\s*[:=]?\s*((?:rp\.?|idr)?\s*\d[\d.,]*(?:\s*(?:rb|ribu|k|jt|juta))?)/gi;
  for (const m of text.matchAll(totalRegex)) {
    const val = parseFlexibleRupiah(m[1]);
    if (val > 0) {
      total = val;
      hasExplicitTotal = true;
      break;
    }
  }

  if (!nominal && total > 0) {
    nominal = adminFee > 0 && total > adminFee ? total - adminFee : total;
  }

  // Fallback: collect all Rp / shorthand amounts across text
  if (!nominal) {
    const rpAmounts: number[] = [];
    const rpRegex =
      /(?:(?:rp\.?|idr)\s*(\d[\d.,]*(?:\s*(?:rb|ribu|k|jt|juta))?)|(\d+(?:[.,]\d+)?\s*(?:rb|ribu|k|jt|juta)))/gi;
    for (const m of text.matchAll(rpRegex)) {
      const token = (m[1] || m[2] || '').trim();
      const val = parseFlexibleRupiah(token);
      if (val >= 500) {
        rpAmounts.push(val);
      }
    }

    if (rpAmounts.length > 0) {
      // Unique sorted descending
      const sortedDesc = [...rpAmounts].sort((a, b) => b - a);
      nominal = sortedDesc[0];
      if (!adminFee && sortedDesc.length >= 2) {
        const smallest = sortedDesc[sortedDesc.length - 1];
        if (smallest <= 15_000 && smallest < nominal) {
          adminFee = smallest;
        }
      }
    }
  }

  return {
    nominal,
    adminFee,
    total,
    hasExplicitNominal,
    hasExplicitTotal,
  };
}

function suggestAtmCounterFee(nominal: number, atmType: AtmMiniType): number {
  if (atmType === 'topup_ewallet_atm') {
    if (nominal <= 0) return 3000;
    if (nominal < 200_000) return 3000;
    if (nominal <= 1_000_000) return 4000;
    return 5000;
  }
  if (nominal <= 0) return 5000;
  if (nominal <= 500_000) return 5000;
  if (nominal <= 2_000_000) return 10000;
  return 15000;
}

function mapAtmProvider(text: string): {
  channel: 'kartu_debit' | 'ewallet' | 'mbanking' | 'qris';
  atmType: AtmMiniType;
  bankName: string;
  cardType: AtmMiniTransaction['cardType'];
} {
  const lower = text.toLowerCase();
  const isTarikTunai = /\b(tarik\s*tunai|cashout|penarikan|tarik\s*dana|wd)\b/i.test(lower);
  const isQris = /\bqris\b/i.test(lower);

  const ewalletMap: Array<[RegExp, string]> = [
    [/\bdana\b/i, 'DANA'],
    [/\bgopay\b/i, 'GoPay'],
    [/\bovo\b/i, 'OVO'],
    [/\bshopeepay\b/i, 'ShopeePay'],
    [/\blinkaja\b/i, 'LinkAja'],
    [/\bi\.?saku\b/i, 'i.Saku'],
    [/\bmaxim\b/i, 'Maxim Driver'],
    [/\bastrapay\b/i, 'AstraPay'],
  ];
  for (const [rx, label] of ewalletMap) {
    if (rx.test(lower)) {
      return {
        channel: 'ewallet',
        atmType: isTarikTunai ? 'tarik_tunai_atm' : 'topup_ewallet_atm',
        bankName: label,
        cardType: 'E-Wallet',
      };
    }
  }

  if (isQris) {
    let qrisProv = 'QRIS Merchant Ju-Fat Cell';
    if (/bca/i.test(lower)) qrisProv = 'QRIS BCA Merchant';
    else if (/brimo|bri/i.test(lower)) qrisProv = 'QRIS BRImo Merchant';
    else if (/livin|mandiri/i.test(lower)) qrisProv = "QRIS Livin' Mandiri";
    else if (/shopee/i.test(lower)) qrisProv = 'QRIS ShopeePay Merchant';
    return {
      channel: 'qris',
      atmType: isTarikTunai ? 'tarik_tunai_atm' : 'qris_atm',
      bankName: qrisProv,
      cardType: 'QRIS',
    };
  }

  const isExplicitMbanking = /\b(brimo|livin|mybca|bca\s*mobile|m-bca|m-transfer|bni\s*mobile|bsi\s*mobile|octo\s*mobile|m-banking|mbanking|mobile\s*banking|cardless)\b/i.test(
    lower
  );

  const bankMatches: Array<[RegExp, string, string]> = [
    [/\b(brimo|bri)\b/i, 'BRI', 'BRImo (Bank BRI)'],
    [/\b(mybca|bca)\b/i, 'BCA', 'BCA Mobile / myBCA'],
    [/\b(livin|mandiri)\b/i, 'Bank Mandiri', "Livin' by Mandiri"],
    [/\bbni\b/i, 'BNI', 'BNI Mobile Banking'],
    [/\bbsi\b/i, 'BSI (Bank Syariah Indonesia)', 'BSI Mobile'],
    [/\bcimb\b/i, 'CIMB Niaga', 'CIMB OCTO Mobile'],
    [/\bseabank\b/i, 'SeaBank', 'SeaBank App'],
    [/\bjago\b/i, 'Bank Jago', 'Bank Jago App'],
    [/\bdanamon\b/i, 'Bank Danamon', 'Aplikasi M-Banking Lainnya'],
  ];

  for (const [rx, edcBank, mbankApp] of bankMatches) {
    if (rx.test(lower)) {
      if (isExplicitMbanking) {
        return {
          channel: 'mbanking',
          atmType: isTarikTunai ? 'tarik_tunai_atm' : 'mbanking_atm',
          bankName: mbankApp,
          cardType: 'M-Banking',
        };
      }
      return {
        channel: 'kartu_debit',
        atmType: isTarikTunai ? 'tarik_tunai_atm' : 'transfer_atm',
        bankName: edcBank,
        cardType: edcBank === 'BCA' ? 'BCA Card' : 'GPN',
      };
    }
  }

  return {
    channel: isExplicitMbanking ? 'mbanking' : 'kartu_debit',
    atmType: isTarikTunai ? 'tarik_tunai_atm' : isExplicitMbanking ? 'mbanking_atm' : 'transfer_atm',
    bankName: isExplicitMbanking ? 'BRImo (Bank BRI)' : 'BRI',
    cardType: isExplicitMbanking ? 'M-Banking' : 'GPN',
  };
}

export function parseAtmMiniReceipts(rawText: string): ParsedAtmMiniItem[] {
  const blocks = splitReceiptBlocks(rawText);
  return blocks.map((block, index) => {
    const sourceApp = detectSourceApp(block);
    const referenceNo = extractReferenceNo(block);
    const { phone, accountOrId } = extractPhoneAndAccount(block, referenceNo);
    const customerName = extractCustomerName(block, referenceNo);
    const amounts = extractAmounts(block);
    const providerInfo = mapAtmProvider(block);

    const targetAccountOrPhone = accountOrId || phone || '';
    const counterFee = suggestAtmCounterFee(amounts.nominal, providerInfo.atmType);
    const noteParts = [`Impor ${sourceApp}`];
    if (referenceNo) noteParts.push(`Ref: ${referenceNo}`);

    const confidence: ParseConfidence =
      amounts.nominal > 0 && (targetAccountOrPhone || customerName)
        ? 'tinggi'
        : amounts.nominal > 0
        ? 'sedang'
        : 'perlu_cek';

    return {
      id: `imp-atm-${Date.now()}-${index}`,
      sourceApp,
      referenceNo,
      rawExcerpt: block.slice(0, 120),
      atmType: providerInfo.atmType,
      channel: providerInfo.channel,
      bankName: providerInfo.bankName,
      cardType: providerInfo.cardType,
      targetAccountOrPhone,
      customerName,
      nominal: amounts.nominal,
      adminEdcFee: amounts.adminFee,
      counterFee,
      paymentMethod: 'tunai',
      adminDeductionType: 'tambah_transfer',
      note: noteParts.join(' · '),
      confidence,
    };
  });
}

function suggestPpobProfit(cat: PPOBCategory): number {
  switch (cat) {
    case 'wifi':
      return 3500;
    case 'pln_bulanan':
    case 'bpjs':
    case 'pdam':
    case 'game':
    case 'tagihan':
      return 3000;
    default:
      return 2000;
  }
}

function detectPpobCategoryAndProvider(
  text: string,
  phone: string
): {
  category: PPOBCategory;
  provider: string;
} {
  const lower = text.toLowerCase();

  // Wifi / Internet
  const wifiProviders: Array<[RegExp, string]> = [
    [/\bindihome\b/i, 'Indihome'],
    [/\biconnet\b/i, 'Iconnet'],
    [/\bbiznet\b/i, 'Biznet'],
    [/\bfirst\s*media\b/i, 'First Media'],
    [/\bmyrepublic\b/i, 'MyRepublic'],
    [/\bxl\s*satu\b/i, 'XL Satu'],
    [/\bcbn\b/i, 'CBN Fiber'],
  ];
  for (const [rx, label] of wifiProviders) {
    if (rx.test(lower)) return { category: 'wifi', provider: label };
  }
  if (/\bwifi\b|\binternet\s*rumah\b|\bfiber\b/i.test(lower)) {
    return { category: 'wifi', provider: 'Indihome' };
  }

  // Game Top Up
  const gameList: Array<[RegExp, string]> = [
    [/\b(mobile\s*legends|mlbb|\bml\b)\b/i, 'Mobile Legends'],
    [/\b(free\s*fire|\bff\b)\b/i, 'Free Fire'],
    [/\b(pubg)\b/i, 'PUBG Mobile'],
    [/\b(genshin)\b/i, 'Genshin Impact'],
    [/\b(honor\s*of\s*kings|\bhok\b)\b/i, 'Honor of Kings'],
    [/\b(roblox)\b/i, 'Roblox'],
    [/\b(valorant)\b/i, 'Valorant'],
    [/\b(steam)\b/i, 'Steam Wallet'],
  ];
  for (const [rx, label] of gameList) {
    if (rx.test(lower)) return { category: 'game', provider: label };
  }
  if (/\b(diamond|uc\b|voucher\s*game|top\s*up\s*game)\b/i.test(lower)) {
    return { category: 'game', provider: 'Mobile Legends' };
  }

  // BPJS & PDAM
  if (/\bbpjs\b/i.test(lower)) return { category: 'bpjs', provider: 'BPJS Kesehatan' };
  if (/\bpdam\b|\btirta\b|\bair\s*minum\b/i.test(lower)) {
    return { category: 'pdam', provider: 'PDAM' };
  }

  // PLN Prepaid vs Postpaid
  if (/\b(pln|listrik|token|stroom|idpel|kwh)\b/i.test(lower)) {
    const isToken = /\b(token|prabayar|stroom|kwh)\b/i.test(lower);
    const isPascabayar = /\b(pascabayar|bulanan|tagihan\s*listrik|postpaid)\b/i.test(lower);
    if (isPascabayar && !isToken) {
      return { category: 'pln_bulanan', provider: 'PLN Pascabayar' };
    }
    return { category: 'pln', provider: 'PLN' };
  }

  // Telco Provider + Data vs Pulsa
  const isData = /\b(kuota|paket\s*data|freedom|hotrod|combo\s*sakti|omg|\d+\s*gb)\b/i.test(lower);
  let provider = phone ? detectTelcoOperatorFromPhone(phone) : 'Telkomsel';
  if (/\b(telkomsel|tsl|tsel|simpati|as\b|by\.?u)\b/i.test(lower)) provider = 'Telkomsel';
  else if (/\b(indosat|isat|im3|mentari)\b/i.test(lower)) provider = 'Indosat';
  else if (/\bxl\b|\bxtra\b/i.test(lower)) provider = 'XL';
  else if (/\baxis\b|\bbronet\b/i.test(lower)) provider = 'Axis';
  else if (/\b(tri|three|3\s*data|aon)\b/i.test(lower)) provider = 'Tri';
  else if (/\bsmartfren\b/i.test(lower)) provider = 'Smartfren';

  return {
    category: isData ? 'data' : 'pulsa',
    provider,
  };
}

function buildPpobPackageName(
  category: PPOBCategory,
  provider: string,
  nominal: number,
  text: string
): string {
  // Check explicit package wording like "257 Diamond", "Kuota 15GB", "Token 50.000", "Pulsa 25rb"
  const diamondMatch = text.match(/(\d+(?:[.,]\d+)?\s*(?:diamond|dm|uc|robux|vp|gc))\b/i);
  if (category === 'game' && diamondMatch) {
    return `${provider} ${diamondMatch[1]}`;
  }
  const gbMatch = text.match(/(\d+(?:[.,]\d+)?\s*gb(?:\s*\d+\s*hari)?)/i);
  if (category === 'data' && gbMatch) {
    return `Paket Data ${provider} ${gbMatch[1].toUpperCase()}`;
  }

  const formattedNom = nominal > 0 ? `Rp ${nominal.toLocaleString('id-ID')}` : '';
  switch (category) {
    case 'pln':
      return nominal > 0 ? `Token PLN ${nominal.toLocaleString('id-ID')}` : 'Token PLN Prabayar';
    case 'pln_bulanan':
      return formattedNom ? `Tagihan Listrik ${formattedNom}` : 'Tagihan Listrik PLN';
    case 'wifi':
      return formattedNom ? `Tagihan ${provider} ${formattedNom}` : `Tagihan Wifi ${provider}`;
    case 'bpjs':
      return formattedNom ? `Tagihan BPJS ${formattedNom}` : 'Tagihan BPJS Kesehatan';
    case 'pdam':
      return formattedNom ? `Tagihan PDAM ${formattedNom}` : 'Tagihan Air PDAM';
    case 'game':
      return formattedNom ? `Top Up ${provider} (${formattedNom})` : `Top Up ${provider}`;
    case 'data':
      return formattedNom ? `Paket Data ${provider} ${formattedNom}` : `Paket Data ${provider}`;
    default:
      return nominal > 0
        ? `Pulsa ${provider} ${nominal.toLocaleString('id-ID')}`
        : `Pulsa ${provider}`;
  }
}

export function parsePPOBReceipts(rawText: string): ParsedPPOBItem[] {
  const blocks = splitReceiptBlocks(rawText);
  return blocks.map((block, index) => {
    const sourceApp = detectSourceApp(block);
    const referenceNo = extractReferenceNo(block);
    const { phone, accountOrId, gameZoneId } = extractPhoneAndAccount(block, referenceNo);
    const customerName = extractCustomerName(block, referenceNo);
    const amounts = extractAmounts(block);
    const detected = detectPpobCategoryAndProvider(block, phone);

    const targetNumber =
      detected.category === 'game' && gameZoneId
        ? `${accountOrId} (${gameZoneId})`
        : detected.category === 'pulsa' || detected.category === 'data'
        ? phone || accountOrId
        : accountOrId || phone;

    // Base modal/HPP is nominal + app admin fee (if receipt had separate Tagihan & Admin App)
    const baseHpp =
      amounts.nominal > 0
        ? amounts.hasExplicitNominal || !amounts.adminFee
          ? amounts.nominal + (detected.category === 'pln_bulanan' || detected.category === 'wifi' || detected.category === 'bpjs' || detected.category === 'pdam' ? amounts.adminFee : 0)
          : amounts.nominal
        : 0;

    // Clean denomination for display name (if modal e.g. 50.250 for token 50.000, infer denom if nearby)
    const denomHintMatch = block.match(/(?:pulsa|token|pln)\s*(?:telkomsel|indosat|xl|axis|tri|smartfren|listrik)?\s*(\d[\d.,]*(?:\s*(?:rb|k))?)/i);
    const denomHint = denomHintMatch ? parseFlexibleRupiah(denomHintMatch[1]) : 0;
    const displayAmount = denomHint >= 5000 ? denomHint : amounts.nominal;

    const loketProfit = suggestPpobProfit(detected.category);
    const sellingPrice = baseHpp > 0 ? baseHpp + loketProfit : 0;
    const packageName = buildPpobPackageName(
      detected.category,
      detected.provider,
      displayAmount,
      block
    );

    const noteParts = [`Impor ${sourceApp}`];
    if (referenceNo) noteParts.push(`Ref/SN: ${referenceNo}`);

    const confidence: ParseConfidence =
      baseHpp > 0 && targetNumber ? 'tinggi' : baseHpp > 0 ? 'sedang' : 'perlu_cek';

    return {
      id: `imp-ppob-${Date.now()}-${index}`,
      sourceApp,
      referenceNo,
      rawExcerpt: block.slice(0, 120),
      category: detected.category,
      provider: detected.provider,
      targetNumber,
      gameZoneId,
      packageName,
      hpp: baseHpp,
      loketProfit,
      sellingPrice,
      customerName,
      paymentMethod: 'tunai',
      note: noteParts.join(' · '),
      confidence,
    };
  });
}
