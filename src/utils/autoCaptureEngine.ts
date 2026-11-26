import {
  ParsedAtmMiniItem,
  ParsedPPOBItem,
  parseAtmMiniReceipts,
  parsePPOBReceipts,
  splitReceiptBlocks,
} from './receiptTextParser';

export interface AutoCaptureSettings {
  rushModeAtmMini: boolean;
  rushModePpob: boolean;
  autoClipboardEnabled: boolean;
  autoCommitMode: 'auto_save' | 'queue_confirm';
  webhookEnabled: boolean;
  webhookStoreKey: string;
}

export const DEFAULT_AUTO_CAPTURE_SETTINGS: AutoCaptureSettings = {
  rushModeAtmMini: false,
  rushModePpob: false,
  autoClipboardEnabled: true,
  autoCommitMode: 'auto_save',
  webhookEnabled: true,
  webhookStoreKey: '',
};

export interface PendingAutoCaptureItem {
  id: string;
  serverId?: string;
  fingerprint: string;
  receivedAt: string;
  source: 'clipboard' | 'paste' | 'webhook';
  domain: 'atm_mini' | 'ppob';
  rawText: string;
  sourceApp: string;
  atmItems?: ParsedAtmMiniItem[];
  ppobItems?: ParsedPPOBItem[];
}

export interface AutoRecordedLogItem {
  id: string;
  txId: string;
  domain: 'atm_mini' | 'ppob';
  source: 'clipboard' | 'paste' | 'webhook' | 'rush_tap';
  sourceApp: string;
  summary: string;
  customerName: string;
  targetNumber?: string;
  amount: number;
  recordedAt: string;
  reverted?: boolean;
}

export function normalizeWebhookStoreKey(raw?: string): string {
  const cleaned = (raw || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  return cleaned || 'JUFAT-AUTO';
}

export function extractPrimaryRefForHash(text: string): string {
  const match = text.match(
    /(?:no\.?\s*ref(?:erensi)?|ref(?:\s*no)?|sn|serial\s*number|rrn|trace(?:\s*no)?|id\s*trx|kode\s*penarikan)[:\s#-]*([A-Z0-9][A-Z0-9-]{3,30})/i
  );
  return match && match[1] ? match[1].trim().toLowerCase() : '';
}

export function computeReceiptFingerprint(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const ref = extractPrimaryRefForHash(trimmed);
  const normalized = trimmed
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\d{2}:\d{2}(?::\d{2})?/g, '')
    .trim();

  // Simple deterministic FNV-1a 32-bit hash
  const basis = ref ? `ref:${ref}|${normalized.slice(0, 80)}` : normalized;
  let hash = 0x811c9dc5;
  for (let i = 0; i < basis.length; i++) {
    hash ^= basis.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fp-${(hash >>> 0).toString(36)}-${basis.length}`;
}

export function looksLikeTransactionReceipt(rawText: string): boolean {
  const text = rawText.trim();
  if (text.length < 12 || text.length > 5000) return false;

  // Reject URLs or code snippets pasted accidentally
  if (/^https?:\/\//i.test(text) && !text.includes('\n')) return false;

  const hasMoney =
    /(?:rp\.?\s*\d|idr\s*\d|\b\d+(?:[.,]\d+)?\s*(?:rb|ribu|k|jt|juta)\b|(?:nominal|tagihan|pokok|harga|hrg|modal|hpp|total|sebesar|bayar|tarik|transfer|top\s*up|topup)\s*[:=]?\s*(?:rp\.?\s*)?\d)/i.test(
      text
    );

  const hasKeyword =
    /(?:berhasil|sukses|brimo|livin|mybca|bca|bri|bni|mandiri|bsi|seabank|dana|gopay|ovo|shopeepay|linkaja|qris|tarik\s*tunai|transfer|top\s*up|topup|orderkuota|digipos|payfazz|mitra\s*bukalapak|pulsa|kuota|paket\s*data|token|pln|listrik|indihome|iconnet|biznet|wifi|bpjs|pdam|diamond|mlbb|free\s*fire|no\.?\s*ref|id\s*pel|idpel|sn:)/i.test(
      text
    );

  return hasMoney && hasKeyword;
}

export function detectReceiptDomain(
  rawText: string,
  preferredDomain?: 'atm_mini' | 'ppob'
): 'atm_mini' | 'ppob' {
  const lower = rawText.toLowerCase();

  let ppobScore = 0;
  let atmScore = 0;

  if (
    /\b(orderkuota|digipos|payfazz|fazz|mitra\s*bukalapak|pulsa|kuota|paket\s*data|token\s*pln|token\s*listrik|pln|stroom|kwh|idpel|id\s*pel|indihome|iconnet|biznet|first\s*media|myrepublic|wifi|bpjs|pdam|mobile\s*legends|mlbb|free\s*fire|pubg|genshin|diamond|sn\s*:)\b/i.test(
      lower
    )
  ) {
    ppobScore += 4;
  }

  if (
    /\b(brimo|livin|mybca|bca\s*mobile|m-bca|m-transfer|bni\s*mobile|bsi\s*mobile|seabank|edc|kartu\s*debit|gpn|tarik\s*tunai|cashout|cardless|rekening|no\.?\s*rek|qris|dana|gopay|ovo|shopeepay|linkaja|top\s*up\s*saldo)\b/i.test(
      lower
    )
  ) {
    atmScore += 4;
  }

  if (/\btransfer\s+ke\b/i.test(lower)) atmScore += 3;
  if (/\btagihan\b/i.test(lower) && !/\bva\s*bank\b/i.test(lower)) ppobScore += 2;

  if (ppobScore > atmScore) return 'ppob';
  if (atmScore > ppobScore) return 'atm_mini';
  return preferredDomain || 'atm_mini';
}

export function parseIncomingCaptureToPending(
  rawText: string,
  source: 'clipboard' | 'paste' | 'webhook',
  options?: {
    preferredDomain?: 'atm_mini' | 'ppob';
    serverId?: string;
    receivedAt?: string;
  }
): PendingAutoCaptureItem | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const blocks = splitReceiptBlocks(trimmed);
  if (blocks.length === 0) return null;

  const domain = detectReceiptDomain(trimmed, options?.preferredDomain);
  const fingerprint = computeReceiptFingerprint(trimmed);
  const receivedAt =
    options?.receivedAt ||
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (domain === 'atm_mini') {
    const atmItems = parseAtmMiniReceipts(trimmed);
    const sourceApp = atmItems[0]?.sourceApp || 'Aplikasi Bank/E-Wallet';
    return {
      id: `cap-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      serverId: options?.serverId,
      fingerprint,
      receivedAt,
      source,
      domain: 'atm_mini',
      rawText: trimmed,
      sourceApp,
      atmItems,
    };
  }

  const ppobItems = parsePPOBReceipts(trimmed);
  const sourceApp = ppobItems[0]?.sourceApp || 'Aplikasi PPOB';
  return {
    id: `cap-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    serverId: options?.serverId,
    fingerprint,
    receivedAt,
    source,
    domain: 'ppob',
    rawText: trimmed,
    sourceApp,
    ppobItems,
  };
}
