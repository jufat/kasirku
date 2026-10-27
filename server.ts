import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const SYNC_FILE = path.join(DATA_DIR, 'sync-store.json');

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

if (fs.existsSync(SYNC_FILE)) {
  try {
    const raw = fs.readFileSync(SYNC_FILE, 'utf-8');
    syncDatabase = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load sync-store.json', err);
    syncDatabase = {};
  }
}

function persistSyncDatabase() {
  try {
    fs.writeFileSync(SYNC_FILE, JSON.stringify(syncDatabase, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist sync-store.json', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use('/api', express.json({ limit: '50mb' }));
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
      server: { middlewareMode: true },
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ju-Fat POS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
