// Utility for Bluetooth Thermal Printer (ESC/POS) & RawBT integration

export interface BluetoothPrinterDevice {
  id: string;
  name: string;
}

// Common GATT Services for BLE Thermal Printers (Panda, Iware, Goojprt, MPT-II, PT-210, POS-58, BellaV, Zjiang, etc.)
const THERMAL_PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer Service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Chinese POS BLE Service (Goojprt, Panda, PT-210)
  '0000ff00-0000-1000-8000-00805f9b34fb', // RPP02N, POS-58, ZJ-58
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '0000fff0-0000-1000-8000-00805f9b34fb', // BellaV, Iware, EP-58
  '0000fee7-0000-1000-8000-00805f9b34fb', // Tencent / WeChat POS BLE
  '0000ae30-0000-1000-8000-00805f9b34fb',
  '0000ae00-0000-1000-8000-00805f9b34fb',
  '0000af30-0000-1000-8000-00805f9b34fb',
  '0000e7b0-0000-1000-8000-00805f9b34fb',
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic Semiconductor UART
];

const THERMAL_PRINTER_CHAR_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  '0000ffe1-0000-1000-8000-00805f9b34fb',
  '0000ff01-0000-1000-8000-00805f9b34fb',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '0000fff1-0000-1000-8000-00805f9b34fb',
  '0000fff2-0000-1000-8000-00805f9b34fb',
  '0000fee8-0000-1000-8000-00805f9b34fb',
  '0000ae01-0000-1000-8000-00805f9b34fb',
  '0000ae31-0000-1000-8000-00805f9b34fb',
  '0000ae32-0000-1000-8000-00805f9b34fb',
  '49535343-1e4d-4bd9-ba61-23c647249616',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
  '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
];

let cachedDevice: any = null;
let cachedCharacteristic: any = null;

export const isWebBluetoothSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
};

export const getSavedBluetoothDeviceName = (): string => {
  try {
    return localStorage.getItem('jufat_bt_printer_name') || '';
  } catch {
    return '';
  }
};

export const forgetBluetoothDevice = () => {
  try {
    if (cachedDevice && cachedDevice.gatt && cachedDevice.gatt.connected) {
      cachedDevice.gatt.disconnect();
    }
  } catch {
    // ignore
  }
  cachedDevice = null;
  cachedCharacteristic = null;
  try {
    localStorage.removeItem('jufat_bt_printer_name');
  } catch {
    // ignore
  }
};

/**
 * Convert plain text receipt into ESC/POS binary command buffer
 */
export const buildEscPosBytes = (text: string, paperWidth: '58mm' | '80mm' = '58mm'): Uint8Array => {
  const encoder = new TextEncoder();
  const bytes: number[] = [];

  // ESC @ : Initialize printer
  bytes.push(0x1b, 0x40);

  // Character set: Indonesian/English (ASCII)
  bytes.push(0x1b, 0x74, 0x00);

  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Check if line should be centered (Header, title, dividers, or footer)
    const isHeader =
      i < 6 ||
      line.startsWith('***') ||
      line.startsWith('---') ||
      line.startsWith('===') ||
      line.toLowerCase().includes('terima kasih') ||
      line.toLowerCase().includes('garansi') ||
      line.toLowerCase().includes('status:') ||
      line.includes('||| | ||||');

    const isDoubleHeight =
      line.startsWith('***') ||
      line.toLowerCase().includes('total') ||
      (i < 3 && line.length > 0 && !line.includes(':'));

    // Text Alignment
    if (isHeader) {
      bytes.push(0x1b, 0x61, 0x01); // Center
    } else {
      bytes.push(0x1b, 0x61, 0x00); // Left
    }

    // Bold & Height
    if (isDoubleHeight) {
      bytes.push(0x1b, 0x45, 0x01); // Bold ON
    } else {
      bytes.push(0x1b, 0x45, 0x00); // Bold OFF
    }

    // Convert string to bytes
    const encodedLine = encoder.encode(rawLine);
    for (let b = 0; b < encodedLine.length; b++) {
      bytes.push(encodedLine[b]);
    }

    // LF (Newline)
    bytes.push(0x0a);
  }

  // Feed 4 lines so receipt is clear of tear bar
  bytes.push(0x1b, 0x64, 0x04);

  // GS V 66 0 : Cut paper (ignored safely if printer has no auto-cutter)
  bytes.push(0x1d, 0x56, 0x42, 0x00);

  return new Uint8Array(bytes);
};

/**
 * Print directly via Web Bluetooth API (Supported on Chrome Android, Edge, Opera, Desktop Chrome)
 */
export const printViaWebBluetooth = async (
  receiptText: string,
  paperWidth: '58mm' | '80mm' = '58mm'
): Promise<{ success: boolean; message: string; deviceName?: string }> => {
  if (!isWebBluetoothSupported()) {
    return {
      success: false,
      message: 'Browser Anda belum mendukung Web Bluetooth. Silakan gunakan tombol RawBT atau cetak sistem.',
    };
  }

  try {
    let characteristic = cachedCharacteristic;
    let device = cachedDevice;

    // If no active connection or disconnected, request/reconnect device
    if (!characteristic || !device || !device.gatt || !device.gatt.connected) {
      // Prompt user to select their Bluetooth thermal printer
      // Note: Must be invoked during a user gesture (button click)
      device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: THERMAL_PRINTER_SERVICE_UUIDS,
      });

      if (!device) {
        return { success: false, message: 'Pemilihan printer bluetooth dibatalkan.' };
      }

      cachedDevice = device;
      try {
        localStorage.setItem('jufat_bt_printer_name', device.name || 'Printer Bluetooth');
      } catch {
        // ignore
      }

      // Connect to GATT Server
      const server = await device.gatt.connect();

      // Find suitable service
      let service: any = null;
      for (const serviceUuid of THERMAL_PRINTER_SERVICE_UUIDS) {
        try {
          service = await server.getPrimaryService(serviceUuid);
          if (service) break;
        } catch {
          // try next
        }
      }

      // If specific service not found, query all services
      if (!service) {
        try {
          const services = await server.getPrimaryServices();
          if (services && services.length > 0) {
            service = services[0];
          }
        } catch (e) {
          console.warn('Could not get primary services list:', e);
        }
      }

      if (!service) {
        throw new Error('Layanan pencetakan tidak ditemukan pada perangkat Bluetooth ini.');
      }

      // Find writable characteristic
      for (const charUuid of THERMAL_PRINTER_CHAR_UUIDS) {
        try {
          characteristic = await service.getCharacteristic(charUuid);
          if (characteristic) break;
        } catch {
          // try next
        }
      }

      // If specific characteristic not found, search all characteristics in the service
      if (!characteristic) {
        const characteristics = await service.getCharacteristics();
        characteristic = characteristics.find(
          (c: any) =>
            c.properties.write ||
            c.properties.writeWithoutResponse ||
            c.properties.reliableWrite
        );
      }

      if (!characteristic) {
        throw new Error('Karakteristik cetak ESC/POS tidak ditemukan pada printer.');
      }

      cachedCharacteristic = characteristic;
    }

    // Prepare ESC/POS byte buffer
    const escPosData = buildEscPosBytes(receiptText, paperWidth);

    // Send in chunks (max 50-100 bytes) to avoid BLE MTU overflow
    const chunkSize = 64;
    for (let offset = 0; offset < escPosData.length; offset += chunkSize) {
      const slice = escPosData.slice(offset, offset + chunkSize);
      if (characteristic.writeValueWithoutResponse) {
        await characteristic.writeValueWithoutResponse(slice);
      } else {
        await characteristic.writeValue(slice);
      }
      // Brief pause between packets to let printer buffer process
      await new Promise((r) => setTimeout(r, 25));
    }

    return {
      success: true,
      message: `Struk berhasil dicetak ke ${device.name || 'Printer Bluetooth'}!`,
      deviceName: device.name || 'Printer Bluetooth',
    };
  } catch (err: any) {
    console.error('Web Bluetooth Error:', err);
    // Reset cache on connection failure so next click can re-pick
    cachedCharacteristic = null;
    return {
      success: false,
      message: err.message || 'Gagal terhubung ke printer Bluetooth. Coba pastikan Bluetooth & printer aktif.',
    };
  }
};

/**
 * Print via RawBT (Android Intent / URL Scheme)
 * RawBT is the standard bridge used across Indonesia for printing from mobile browsers to any Bluetooth thermal printer.
 */
export const printViaRawBT = (receiptText: string, paperWidth: '58mm' | '80mm' = '58mm'): boolean => {
  try {
    const escPosBytes = buildEscPosBytes(receiptText, paperWidth);

    // Convert bytes to base64
    let binary = '';
    const len = escPosBytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(escPosBytes[i]);
    }
    const base64Data = window.btoa(binary);

    // Standard Android Intent for RawBT with Play Store fallback if not yet installed
    const rawBtIntent = `intent:data:application/octet-stream;base64,${base64Data}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dru.a402d.rawbtprinter;end;`;
    const rawBtDirect = `rawbt:data:application/octet-stream;base64,${base64Data}`;

    const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent || '');
    if (isAndroid) {
      window.location.href = rawBtIntent;
    } else {
      window.location.href = rawBtDirect;
    }
    return true;
  } catch (e) {
    console.error('Error invoking RawBT:', e);
    return false;
  }
};

/**
 * Share receipt text using Web Share API (can share directly to Bluetooth Print app or WhatsApp)
 */
export const shareReceiptText = async (title: string, text: string): Promise<boolean> => {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
};
