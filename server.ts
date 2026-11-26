import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const SYNC_FILE = path.join(DATA_DIR, 'sync-store.json');
const AUTO_CAPTURE_FILE = path.join(DATA_DIR, 'auto-capture-queue.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache loaded from file
let syncDatabase: Record<
  string,
  {
    code: string;
    deviceName: string;
    lastUpdated: string;
    timestamp: number;
    data: any;
    version: number;
  }
> = {};

interface ServerAutoCaptureItem {
  id: string;
  storeKey: string;
  rawText: string;
  sourceApp?: string;
  domainHint?: 'atm_mini' | 'ppob';
  receivedAt: string;
  timestamp: number;
  fingerprint: string;
  status: 'pending' | 'recorded' | 'dismissed';
}

let autoCaptureQueue: Record<string, ServerAutoCaptureItem[]> = {};

if (fs.existsSync(SYNC_FILE)) {
  try {
    const raw = fs.readFileSync(SYNC_FILE, 'utf-8');
    syncDatabase = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load sync-store.json', err);
    syncDatabase = {};
  }
}

if (fs.existsSync(AUTO_CAPTURE_FILE)) {
  try {
    const raw = fs.readFileSync(AUTO_CAPTURE_FILE, 'utf-8');
    autoCaptureQueue = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load auto-capture-queue.json', err);
    autoCaptureQueue = {};
  }
}

function persistSyncDatabase() {
  try {
    fs.writeFileSync(SYNC_FILE, JSON.stringify(syncDatabase, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist sync-store.json', err);
  }
}

function persistAutoCaptureQueue() {
  try {
    fs.writeFileSync(AUTO_CAPTURE_FILE, JSON.stringify(autoCaptureQueue, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist auto-capture-queue.json', err);
  }
}

function normalizeStoreKey(raw?: unknown): string {
  const str = typeof raw === 'string' ? raw : '';
  const cleaned = str.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  return cleaned || 'JUFAT-AUTO';
}

function serverFingerprint(text: string): string {
  const norm = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\d{2}:\d{2}(?::\d{2})?/g, '');
  let h = 0x811c9dc5;
  for (let i = 0; i < norm.length; i++) {
    h ^= norm.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `srv-${(h >>> 0).toString(36)}-${norm.length}`;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use('/api', express.json({ limit: '50mb' }));
  app.use('/api', express.text({ type: 'text/*', limit: '2mb' }));
  app.use('/api', express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health / ping route
  app.get('/api/sync/ping', (req, res) => {
    res.json({ ok: true, timestamp: Date.now(), service: 'Ju-Fat Sync Engine' });
  });

  // Auto-Capture Webhook: receive forwarded phone notifications / SMS / receipts (POST or GET)
  const handleAutoCaptureWebhook = (req: express.Request, res: express.Response) => {
    const bodyObj =
      typeof req.body === 'string'
        ? { text: req.body }
        : req.body && typeof req.body === 'object'
        ? req.body
        : {};

    const storeKey = normalizeStoreKey(
      req.query.code || req.query.storeKey || bodyObj.code || bodyObj.storeKey
    );
    const title = String(req.query.title || bodyObj.title || '').trim();
    const appName = String(req.query.app || bodyObj.app || bodyObj.sourceApp || '').trim();
    const message = String(
      req.query.text ||
        req.query.message ||
        bodyObj.text ||
        bodyObj.message ||
        bodyObj.body ||
        bodyObj.content ||
        ''
    ).trim();

    const combinedLines = [appName ? `[${appName}]` : '', title, message]
      .filter(Boolean)
      .join('\n')
      .trim();

    if (!combinedLines) {
      return res.status(400).json({
        success: false,
        message: 'Teks notifikasi / struk (text atau message) tidak boleh kosong.',
      });
    }

    const fp = serverFingerprint(combinedLines);
    const list = autoCaptureQueue[storeKey] || [];
    const recentDuplicate = list.find(
      (item) => item.fingerprint === fp && Date.now() - item.timestamp < 6 * 60 * 60 * 1000
    );

    if (recentDuplicate) {
      return res.json({
        success: true,
        duplicate: true,
        id: recentDuplicate.id,
        storeKey,
        message: 'Notifikasi struk yang sama sudah pernah diterima (anti-duplikat aktif).',
      });
    }

    const domainHint =
      req.query.domain === 'ppob' || bodyObj.domain === 'ppob'
        ? 'ppob'
        : req.query.domain === 'atm_mini' || bodyObj.domain === 'atm_mini'
        ? 'atm_mini'
        : undefined;

    const entry: ServerAutoCaptureItem = {
      id: `wh-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      storeKey,
      rawText: combinedLines,
      sourceApp: appName || undefined,
      domainHint,
      receivedAt: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      timestamp: Date.now(),
      fingerprint: fp,
      status: 'pending',
    };

    autoCaptureQueue[storeKey] = [entry, ...list].slice(0, 150);
    persistAutoCaptureQueue();

    return res.json({
      success: true,
      duplicate: false,
      id: entry.id,
      storeKey,
      receivedAt: entry.receivedAt,
      message: `Notifikasi diterima di antrean otomatis (${storeKey}).`,
    });
  };

  app.post('/api/auto-capture/webhook', handleAutoCaptureWebhook);
  app.get('/api/auto-capture/webhook', handleAutoCaptureWebhook);

  app.get('/api/auto-capture/pending', (req, res) => {
    const storeKey = normalizeStoreKey(req.query.code || req.query.storeKey);
    const list = autoCaptureQueue[storeKey] || [];
    const pending = list.filter((it) => it.status === 'pending');
    res.json({
      success: true,
      storeKey,
      pendingCount: pending.length,
      items: pending,
    });
  });

  app.post('/api/auto-capture/ack', (req, res) => {
    const storeKey = normalizeStoreKey(req.body?.code || req.body?.storeKey);
    const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const action: 'recorded' | 'dismissed' =
      req.body?.action === 'dismissed' ? 'dismissed' : 'recorded';

    if (ids.length === 0) {
      return res.json({ success: true, updated: 0 });
    }

    const idSet = new Set(ids);
    const list = autoCaptureQueue[storeKey] || [];
    let updated = 0;
    autoCaptureQueue[storeKey] = list.map((item) => {
      if (idSet.has(item.id) && item.status === 'pending') {
        updated++;
        return { ...item, status: action };
      }
      return item;
    });
    persistAutoCaptureQueue();

    res.json({ success: true, storeKey, updated });
  });

  app.delete('/api/auto-capture/clear', (req, res) => {
    const storeKey = normalizeStoreKey(req.query.code || req.body?.code);
    autoCaptureQueue[storeKey] = [];
    persistAutoCaptureQueue();
    res.json({ success: true, storeKey, message: 'Antrean auto-capture dibersihkan.' });
  });

  // Generate a new sync code (e.g. JF-4829)
  app.post('/api/sync/generate-code', (req, res) => {
    const { deviceName = 'PC Kasir', data } = req.body;
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const code = `JF-${randomDigits}`;
    const nowStr = new Date().toLocaleString('id-ID');

    syncDatabase[code] = {
      code,
      deviceName,
      lastUpdated: nowStr,
      timestamp: Date.now(),
      data: data || null,
      version: 1,
    };
    persistSyncDatabase();

    res.json({
      success: true,
      code,
      message: `Kode sinkronisasi ${code} berhasil dibuat!`,
      lastUpdated: nowStr,
      version: 1,
    });
  });

  // Push / Upload data to sync code
  app.post('/api/sync/push', (req, res) => {
    const { code, deviceName = 'Perangkat', data } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Kode sinkronisasi wajib diisi!' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = syncDatabase[cleanCode];
    const nowStr = new Date().toLocaleString('id-ID');
    const version = existing ? (existing.version || 1) + 1 : 1;

    syncDatabase[cleanCode] = {
      code: cleanCode,
      deviceName,
      lastUpdated: nowStr,
      timestamp: Date.now(),
      data,
      version,
    };
    persistSyncDatabase();

    res.json({
      success: true,
      code: cleanCode,
      lastUpdated: nowStr,
      version,
      message: `Data berhasil disinkronkan ke kode ${cleanCode}!`,
    });
  });

  // Pull / Download data by sync code
  app.get('/api/sync/pull/:code', (req, res) => {
    const code = req.params.code?.trim().toUpperCase();
    const room = syncDatabase[code];

    if (!room || !room.data) {
      return res.status(404).json({
        success: false,
        message: `Kode ${code} belum ditemukan atau belum ada data yang diunggah.`,
      });
    }

    res.json({
      success: true,
      code,
      deviceName: room.deviceName,
      lastUpdated: room.lastUpdated,
      timestamp: room.timestamp,
      version: room.version,
      data: room.data,
    });
  });

  // Check sync code status (lightweight)
  app.get('/api/sync/status/:code', (req, res) => {
    const code = req.params.code?.trim().toUpperCase();
    const room = syncDatabase[code];

    if (!room) {
      return res.status(404).json({
        success: false,
        exists: false,
        message: `Kode ${code} tidak aktif.`,
      });
    }

    res.json({
      success: true,
      exists: true,
      code,
      deviceName: room.deviceName,
      lastUpdated: room.lastUpdated,
      timestamp: room.timestamp,
      version: room.version,
      dataSummary: {
        productCount: room.data?.products?.length || 0,
        transactionCount: room.data?.transactions?.length || 0,
        storeName: room.data?.storeProfile?.name || 'Ju-Fat Cell',
      },
    });
  });

  // Vite middleware in dev or static files in prod
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  VITE v6.1.1  ready in 200 ms\n\n  ➜  Local:   http://localhost:${PORT}/\n  ➜  Network: http://0.0.0.0:${PORT}/\n`);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
