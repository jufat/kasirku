import React, { useState } from 'react';
import {
  Printer,
  Copy,
  Image as ImageIcon,
  FileText,
  Scissors,
  CheckCircle,
  Clock,
  Phone,
  Search,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Receipt,
  Calculator,
  Calendar,
  X,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  Edit2,
  RotateCcw,
  SlidersHorizontal,
  FolderPlus,
  Settings,
  Zap,
  Eye,
  EyeOff,
  History,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import {
  PrintOrder,
  PrintOrderItem,
  PrintOrderStatus,
  PrintServiceCategory,
  PaymentMethod,
  PrintPriceTier,
  PrintServiceItem,
} from '../../types/pos';

interface LiveThermalReceiptPaperProps {
  storeProfile: {
    name?: string;
    subtitle?: string;
    address?: string;
    phone?: string;
    logo?: string;
  };
  orderItems: PrintOrderItem[];
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  cashTendered: number;
  changeAmount: number;
  debtDueDate: string;
  fileOrNote: string;
  totalOrderAmount: number;
  rawTotalOrderAmount?: number;
  discountAmount?: number;
  effectiveCashTendered: number;
  paperWidth: '58mm' | '80mm';
  setPaperWidth: (w: '58mm' | '80mm') => void;
  onPayAndPrint: () => void;
  onClose?: () => void;
  isInline?: boolean;
}

const LiveThermalReceiptPaper: React.FC<LiveThermalReceiptPaperProps> = ({
  storeProfile,
  orderItems,
  customerName,
  customerPhone,
  paymentMethod,
  changeAmount,
  debtDueDate,
  fileOrNote,
  totalOrderAmount,
  rawTotalOrderAmount = totalOrderAmount,
  discountAmount = 0,
  effectiveCashTendered,
  paperWidth,
  setPaperWidth,
  onPayAndPrint,
  onClose,
  isInline = false,
}) => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex flex-col items-center justify-center w-full ${isInline ? 'p-1' : 'p-3 sm:p-5'}`}>
      {/* Control Toolbar */}
      <div className="w-full max-w-sm mb-3 flex items-center justify-between gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kertas:</span>
          <div className="flex rounded-lg bg-white p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setPaperWidth('58mm')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                paperWidth === '58mm'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              58mm
            </button>
            <button
              type="button"
              onClick={() => setPaperWidth('80mm')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                paperWidth === '80mm'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              80mm
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Live Preview Real-Time
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition cursor-pointer"
              title="Tutup Preview"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Realistic Thermal Receipt Paper */}
      <div
        className={`w-full transition-all duration-200 ${
          paperWidth === '58mm' ? 'max-w-[290px]' : 'max-w-[360px]'
        }`}
      >
        {/* Top Sawtooth Tear Effect */}
        <div className="w-full h-2.5 overflow-hidden text-white drop-shadow-sm flex">
          <svg
            className="w-full h-2.5 text-white fill-current"
            preserveAspectRatio="none"
            viewBox="0 0 100 10"
          >
            <polygon points="0,10 2.5,0 5,10 7.5,0 10,10 12.5,0 15,10 17.5,0 20,10 22.5,0 25,10 27.5,0 30,10 32.5,0 35,10 37.5,0 40,10 42.5,0 45,10 47.5,0 50,10 52.5,0 55,10 57.5,0 60,10 62.5,0 65,10 67.5,0 70,10 72.5,0 75,10 77.5,0 80,10 82.5,0 85,10 87.5,0 90,10 92.5,0 95,10 97.5,0 100,10" />
          </svg>
        </div>

        {/* Paper Body */}
        <div className="bg-white px-4 py-3.5 shadow-xl border-x border-slate-200/80 text-slate-900 font-mono text-[11px] leading-tight space-y-2 select-text">
          {/* Store Header */}
          <div className="text-center space-y-0.5">
            {storeProfile.logo ? (
              <div className="flex justify-center mb-1">
                <img
                  src={storeProfile.logo}
                  alt={storeProfile.name || 'Store'}
                  className="max-h-10 max-w-[120px] object-contain mx-auto"
                />
              </div>
            ) : null}
            <h2 className="font-extrabold text-sm tracking-wider uppercase text-slate-950">
              {storeProfile.name || 'JU-FAT CELL & PRINT'}
            </h2>
            <p className="text-[10px] text-slate-600">{storeProfile.subtitle || 'Percetakan & Fotokopi Kilat'}</p>
            <p className="text-[9px] text-slate-500">{storeProfile.address || 'Konter Utama Ju-Fat'}</p>
            <p className="text-[9px] text-slate-500">WhatsApp: {storeProfile.phone || '0812-xxxx-xxxx'}</p>
          </div>

          <div className="border-b border-dashed border-slate-400 my-1" />

          {/* Meta Info */}
          <div className="space-y-0.5 text-[10px]">
            <div className="text-center font-bold text-slate-800 pb-0.5 border-b border-dashed border-slate-300">
              *** NOTA ORDER PERCETAKAN & COPY ***
            </div>
            <div className="flex justify-between pt-0.5">
              <span>No Order  :</span>
              <span className="font-bold text-slate-700">PRN-DRAFT-LIVE</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal   :</span>
              <span>{currentDate} {currentTime}</span>
            </div>
            <div className="flex justify-between">
              <span>Pelanggan :</span>
              <span className="font-bold">{customerName.trim() || 'Pelanggan Umum'}</span>
            </div>
            <div className="flex justify-between">
              <span>No Telp   :</span>
              <span>{customerPhone.trim() || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span>Status    :</span>
              <span
                className={`font-bold uppercase ${
                  paymentMethod === 'hutang' ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {paymentMethod === 'hutang' ? 'KASBON (HUTANG)' : 'LUNAS (SELESAI)'}
              </span>
            </div>
          </div>

          <div className="border-b border-dashed border-slate-400 my-1" />

          {/* Itemized List */}
          <div className="space-y-1.5 py-1">
            {orderItems.length === 0 ? (
              <div className="text-center py-4 text-slate-400 italic text-[10px] space-y-1">
                <Printer className="w-5 h-5 mx-auto text-slate-300" />
                <p>(Tagihan masih kosong)</p>
                <p className="text-[9px]">Pilih layanan cetak / fotokopi di kasir untuk melihat struk</p>
              </div>
            ) : (
              orderItems.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-bold text-slate-800 flex items-start justify-between">
                    <span>{item.serviceName}</span>
                    {item.isCustomPrice && (
                      <span className="text-[9px] text-amber-700 font-normal italic">[nego]</span>
                    )}
                  </div>
                  {item.specNote && (
                    <div className="text-[10px] text-indigo-700 italic">[{item.specNote}]</div>
                  )}
                  <div className="flex justify-between text-slate-600 text-[10px]">
                    <span>
                      {item.quantity} {item.unit} x Rp {item.pricePerUnit.toLocaleString('id-ID')}
                    </span>
                    <span className="font-bold text-slate-800 font-mono">
                      Rp {item.subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))
            )}

            {fileOrNote && (
              <div className="pt-1 text-[10px] text-slate-500 border-t border-dashed border-slate-200">
                Catatan: {fileOrNote}
              </div>
            )}
          </div>

          <div className="border-b border-dashed border-slate-400 my-1" />

          {/* Totals & Breakdown */}
          <div className="space-y-1 py-1">
            {discountAmount > 0 && (
              <>
                <div className="flex justify-between text-slate-700 text-xs">
                  <span>Subtotal:</span>
                  <span className="font-mono">Rp {rawTotalOrderAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-rose-600 text-xs font-bold">
                  <span>Diskon:</span>
                  <span className="font-mono">-Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold text-slate-900 text-sm">
              <span>TOTAL BAYAR:</span>
              <span className={`font-mono ${totalOrderAmount === 0 ? 'text-emerald-700 font-extrabold' : ''}`}>
                {totalOrderAmount === 0 ? 'Rp 0 (GRATIS OWNER)' : `Rp ${totalOrderAmount.toLocaleString('id-ID')}`}
              </span>
            </div>

            <div className="flex justify-between text-slate-700 text-[10px] pt-1">
              <span>Metode Pembayaran:</span>
              <span className="font-bold uppercase font-mono">{paymentMethod}</span>
            </div>

            {paymentMethod === 'tunai' && (
              <>
                <div className="flex justify-between text-slate-700 text-[10px]">
                  <span>Uang Diterima:</span>
                  <span className="font-mono font-bold">
                    Rp {effectiveCashTendered.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800 text-[11px]">
                  <span>Kembalian:</span>
                  <span className="font-mono">
                    Rp {changeAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </>
            )}

            {paymentMethod === 'hutang' && (
              <>
                <div className="flex justify-between text-amber-800 font-bold text-[10px]">
                  <span>Sisa Tagihan (Kasbon):</span>
                  <span className="font-mono">Rp {totalOrderAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[9px]">
                  <span>Jatuh Tempo:</span>
                  <span>{debtDueDate}</span>
                </div>
              </>
            )}

            {paymentMethod === 'qris' && (
              <div className="text-[10px] text-sky-800 flex justify-between">
                <span>QRIS Counter:</span>
                <span className="font-mono">NMID: ID10202688190</span>
              </div>
            )}

            <div
              className={`flex justify-between font-bold text-[11px] pt-0.5 ${
                paymentMethod === 'hutang' ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              <span>Status Pembayaran:</span>
              <span>{paymentMethod === 'hutang' ? 'BELUM LUNAS (KASBON)' : 'LUNAS (100%)'}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-slate-400 my-1.5" />

          {/* Barcode Mockup */}
          <div className="text-center space-y-1 pt-1">
            <div className="flex items-center justify-center gap-0.5 h-8 px-4 bg-slate-50 border border-slate-200/60 rounded">
              {[4, 2, 5, 2, 3, 6, 2, 4, 3, 5, 2, 6, 3, 4, 2, 5, 3, 2, 4, 5, 2, 3, 4, 6].map((w, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 h-6"
                  style={{ width: `${w}px` }}
                />
              ))}
            </div>
            <div className="text-[9px] text-slate-500 tracking-widest font-mono">
              *JU-FAT-PRINT-NOTA*
            </div>
          </div>

          <div className="border-b border-dashed border-slate-400 my-1" />

          {/* Footer Notes */}
          <div className="text-center text-[9px] text-slate-500 space-y-0.5 pt-1">
            <p className="font-semibold text-slate-700">Terima Kasih Telah Mencetak di Ju-Fat Print</p>
            <p>Periksa hasil cetakan sebelum meninggalkan counter.</p>
            <p className="italic">Simpan struk ini sebagai bukti transaksi sah.</p>
          </div>
        </div>

        {/* Bottom Sawtooth Tear Effect */}
        <div className="w-full h-2.5 overflow-hidden text-white drop-shadow-sm flex">
          <svg
            className="w-full h-2.5 text-white fill-current"
            preserveAspectRatio="none"
            viewBox="0 0 100 10"
          >
            <polygon points="0,0 2.5,10 5,0 7.5,10 10,0 12.5,10 15,0 17.5,10 20,0 22.5,10 25,0 27.5,10 30,0 32.5,10 35,0 37.5,10 40,0 42.5,10 45,0 47.5,10 50,0 52.5,10 55,0 57.5,10 60,0 62.5,10 65,0 67.5,10 70,0 72.5,10 75,0 77.5,10 80,0 82.5,10 85,0 87.5,10 90,0 92.5,10 95,0 97.5,10 100,0" />
          </svg>
        </div>

        {/* Direct Action Button below Paper */}
        <div className="mt-3">
          <button
            type="button"
            onClick={onPayAndPrint}
            disabled={orderItems.length === 0}
            className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm tracking-wide shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
              orderItems.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:brightness-110 text-white shadow-emerald-950/20'
            }`}
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>
              {orderItems.length === 0
                ? 'TAMBAHKAN ITEM UNTUK CETAK'
                : `BAYAR & CETAK STRUK INI (Rp ${totalOrderAmount.toLocaleString('id-ID')})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const PercetakanView: React.FC = () => {
  const {
    shift,
    printOrders,
    addPrintOrder,
    updatePrintOrderStatus,
    deletePrintOrder,
    openReceipt,
    storeProfile,
    printServices,
    addPrintService,
    updatePrintService,
    deletePrintService,
    resetPrintServices,
  } = usePOS();

  const isOwner = shift.cashierSlot === 'owner' || shift.role === 'owner';
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Mobile navigation tab: Form / Calculator vs Live Preview vs History & Queue
  const [mobileTab, setMobileTab] = useState<'create' | 'preview' | 'queue'>('create');

  // Live Receipt Preview States
  const [showLiveReceiptPreview, setShowLiveReceiptPreview] = useState(false);
  const [receiptPaperWidth, setReceiptPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [rightColumnTab, setRightColumnTab] = useState<'history' | 'receipt_preview'>('history');

  const toggleLiveReceiptPreview = () => {
    const nextState = !showLiveReceiptPreview;
    setShowLiveReceiptPreview(nextState);
    if (nextState) {
      setRightColumnTab('receipt_preview');
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setMobileTab('preview');
      }
    } else {
      setRightColumnTab('history');
      if (mobileTab === 'preview') {
        setMobileTab('create');
      }
    }
  };

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Quick Calculator State
  const [calcServiceId, setCalcServiceId] = useState<string>(() => {
    return printServices[0]?.id || 'srv-print-bw';
  });
  const [calcQty, setCalcQty] = useState<number>(10);
  const [calcSpecNote, setCalcSpecNote] = useState('');
  const [customUnitPrice, setCustomUnitPrice] = useState<number | null>(null);
  const [showTierGuideModal, setShowTierGuideModal] = useState(false);

  // Price Catalog Modal Filters & Search
  const [priceCatalogSearch, setPriceCatalogSearch] = useState('');
  const [priceCatalogCategory, setPriceCatalogCategory] = useState<string>('all');

  // Service Edit / Add State
  const [editingService, setEditingService] = useState<PrintServiceItem | null>(null);
  const [isCreatingNewService, setIsCreatingNewService] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<PrintServiceCategory>('print_dokumen');
  const [formUnit, setFormUnit] = useState('lembar');
  const [formPrice, setFormPrice] = useState<number>(1000);
  const [formDesc, setFormDesc] = useState('');
  const [formTiers, setFormTiers] = useState<PrintPriceTier[]>([]);

  // Active Direct Payment Builder State (Mode Langsung Bayar)
  const [customerName, setCustomerName] = useState('Pelanggan Umum');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderItems, setOrderItems] = useState<PrintOrderItem[]>([]);
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [debtDueDate, setDebtDueDate] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [fileOrNote, setFileOrNote] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Settle & Pickup Modal State for Percetakan
  const [settlingPrintOrder, setSettlingPrintOrder] = useState<PrintOrder | null>(null);
  const [settlePrintMethod, setSettlePrintMethod] = useState<'tunai' | 'qris' | 'hutang'>('tunai');
  const [settlePrintCashReceived, setSettlePrintCashReceived] = useState<number>(0);
  const [settlePrintDiscount, setSettlePrintDiscount] = useState<number>(0);
  const [settlePrintDueDate, setSettlePrintDueDate] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [settlePrintPhone, setSettlePrintPhone] = useState('');
  const [settlePrintNote, setSettlePrintNote] = useState('');

  const handleOpenSettlePrintOrder = (order: PrintOrder) => {
    const rem = order.remainingAmount ?? Math.max(0, order.totalAmount - order.downPayment);
    if (rem > 0) {
      setSettlingPrintOrder(order);
      setSettlePrintDiscount(0);
      setSettlePrintMethod('tunai');
      setSettlePrintCashReceived(rem);
      setSettlePrintPhone(order.customerPhone && order.customerPhone !== '-' ? order.customerPhone : '');
      setSettlePrintDueDate(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
      setSettlePrintNote(`Pelunasan cetak ${order.id} - ${order.customerName}`);
    } else {
      updatePrintOrderStatus(order.id, 'diambil');
      openReceipt({
        ...order,
        status: 'diambil',
        remainingAmount: 0,
        downPayment: order.totalAmount,
      });
    }
  };

  const handleConfirmSettlePrintOrder = () => {
    if (!settlingPrintOrder) return;
    const baseRem = settlingPrintOrder.remainingAmount ?? Math.max(0, settlingPrintOrder.totalAmount - settlingPrintOrder.downPayment);
    const actualRemaining = Math.max(0, baseRem - settlePrintDiscount);

    if (actualRemaining === 0 && !isOwner) {
      alert('Pelunasan Rp 0 (Diskon 100%) hanya diizinkan untuk OWNER yang sedang bertugas!');
      return;
    }

    updatePrintOrderStatus(
      settlingPrintOrder.id,
      'diambil',
      settlePrintMethod,
      settlePrintDueDate,
      settlePrintPhone || settlingPrintOrder.customerPhone,
      settlePrintNote
    );
    const orderCopy: PrintOrder = {
      ...settlingPrintOrder,
      discount: (settlingPrintOrder.discount || 0) + settlePrintDiscount,
      status: 'diambil',
      remainingAmount: 0,
      downPayment: settlingPrintOrder.totalAmount,
      paymentMethod: settlePrintMethod,
    };
    setSettlingPrintOrder(null);
    setSuccessToast(
      actualRemaining === 0
        ? `Pesanan ${settlingPrintOrder.id} dilunasi Rp 0 (GRATIS OWNER) & diserahkan!`
        : settlePrintMethod === 'hutang'
        ? `Pesanan ${settlingPrintOrder.id} diserahkan & sisa tagihan masuk ke Buku Hutang / Kasbon!`
        : `Pesanan ${settlingPrintOrder.id} berhasil dilunasi (${settlePrintMethod.toUpperCase()}) & diserahkan!`
    );
    setTimeout(() => setSuccessToast(''), 4500);

    // Auto open thermal receipt for customer (Struk Pelunasan Percetakan)
    openReceipt(orderCopy);
  };

  // Fallback if no services exist
  const fallbackService: PrintServiceItem = {
    id: 'srv-fallback',
    category: 'print_dokumen',
    name: 'Print HVS Hitam Putih (B/W)',
    price: 750,
    unit: 'lembar',
    desc: 'Kertas HVS 75/80gsm A4/F4',
    tiers: [
      { minQty: 1, price: 750, label: '1 - 20 lbr' },
      { minQty: 21, price: 600, label: '21 - 50 lbr' },
      { minQty: 51, price: 500, label: '51 - 100 lbr' },
      { minQty: 101, price: 400, label: '101+ lbr (Grosir)' },
    ],
  };

  // Current selected service for quick calculator
  const activeCalcService =
    printServices.find((s) => s.id === calcServiceId) || printServices[0] || fallbackService;

  // Helper: Open edit modal
  const handleOpenEditService = (service: PrintServiceItem) => {
    setEditingService(service);
    setIsCreatingNewService(false);
    setFormName(service.name);
    setFormCategory(service.category);
    setFormUnit(service.unit);
    setFormPrice(service.price);
    setFormDesc(service.desc || '');
    setFormTiers(service.tiers ? [...service.tiers.map((t) => ({ ...t }))] : []);
  };

  // Helper: Open create new service modal
  const handleOpenCreateService = () => {
    setEditingService(null);
    setIsCreatingNewService(true);
    setFormName('');
    setFormCategory('print_dokumen');
    setFormUnit('lembar');
    setFormPrice(1000);
    setFormDesc('');
    setFormTiers([
      { minQty: 1, price: 1000, label: '1 - 20 lbr' },
      { minQty: 21, price: 850, label: '21 - 50 lbr' },
      { minQty: 51, price: 700, label: '51 - 100 lbr' },
      { minQty: 101, price: 600, label: '101+ lbr (Grosir)' },
    ]);
  };

  // Helper: Save service changes (Edit or Create)
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Nama layanan percetakan wajib diisi!');
      return;
    }
    if (formPrice <= 0) {
      alert('Harga satuan dasar harus lebih dari 0!');
      return;
    }
    if (!formUnit.trim()) {
      alert('Satuan hitung (cth: lembar, pcs, meter) wajib diisi!');
      return;
    }

    // Clean and sort tiers by minQty ascending
    const cleanedTiers = formTiers
      .filter((t) => t.minQty > 0 && t.price > 0)
      .sort((a, b) => a.minQty - b.minQty);

    if (editingService) {
      const updated: PrintServiceItem = {
        ...editingService,
        name: formName.trim(),
        category: formCategory,
        unit: formUnit.trim(),
        price: formPrice,
        desc: formDesc.trim() || undefined,
        tiers: cleanedTiers.length > 0 ? cleanedTiers : undefined,
      };
      updatePrintService(updated);
      setSuccessToast(`Tarif layanan "${updated.name}" berhasil diperbarui!`);
    } else {
      const added = addPrintService({
        name: formName.trim(),
        category: formCategory,
        unit: formUnit.trim(),
        price: formPrice,
        desc: formDesc.trim() || undefined,
        tiers: cleanedTiers.length > 0 ? cleanedTiers : undefined,
      });
      setCalcServiceId(added.id);
      setCustomUnitPrice(null);
      setSuccessToast(`Layanan cetak baru "${added.name}" berhasil ditambahkan!`);
    }

    setEditingService(null);
    setIsCreatingNewService(false);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Helper: Delete service
  const handleDeleteService = (service: PrintServiceItem) => {
    if (
      confirm(
        `Hapus layanan percetakan "${service.name}" (${service.unit})?\nLayanan ini akan dihapus dari daftar tarif percetakan.`
      )
    ) {
      deletePrintService(service.id);
      if (calcServiceId === service.id) {
        const remaining = printServices.filter((s) => s.id !== service.id);
        if (remaining.length > 0) {
          setCalcServiceId(remaining[0].id);
          setCustomUnitPrice(null);
        }
      }
      setSuccessToast(`Layanan "${service.name}" berhasil dihapus dari daftar tarif.`);
      setTimeout(() => setSuccessToast(''), 4000);
    }
  };

  // Helper: Reset services to default
  const handleResetServices = () => {
    if (
      confirm(
        'Kembalikan seluruh daftar harga percetakan ke tarif standar bawaan Ju-Fat Cell? Layanan yang ditambahkan atau diubah sendiri akan di-reset.'
      )
    ) {
      resetPrintServices();
      setCalcServiceId('srv-print-bw');
      setCustomUnitPrice(null);
      setSuccessToast('Tarif percetakan berhasil dikembalikan ke standar awal Ju-Fat!');
      setTimeout(() => setSuccessToast(''), 4000);
    }
  };

  // Tier helpers in Editor Modal
  const handleAddTierRow = () => {
    const lastTier = formTiers[formTiers.length - 1];
    const nextMinQty = lastTier ? lastTier.minQty + 50 : 20;
    const nextPrice = lastTier
      ? Math.max(100, Math.round((lastTier.price * 0.85) / 50) * 50)
      : Math.max(100, Math.round((formPrice * 0.85) / 50) * 50);
    setFormTiers((prev) => [
      ...prev,
      {
        minQty: nextMinQty,
        price: nextPrice,
        label: `>= ${nextMinQty} ${formUnit || 'unit'}`,
      },
    ]);
  };

  const handleUpdateTierRow = (
    index: number,
    field: keyof PrintPriceTier,
    value: any
  ) => {
    setFormTiers((prev) =>
      prev.map((t, idx) => (idx === index ? { ...t, [field]: value } : t))
    );
  };

  const handleRemoveTierRow = (index: number) => {
    setFormTiers((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Helper: Resolve volume discount tier based on quantity ("semakin banyak semakin murah")
  const resolveServiceTier = (
    service: PrintServiceItem,
    quantity: number
  ) => {
    if (!service.tiers || service.tiers.length === 0) {
      return {
        tierPrice: service.price,
        activeTier: undefined,
        savingsPerUnit: 0,
        discountPercent: 0,
      };
    }
    const sorted = [...service.tiers].sort((a, b) => b.minQty - a.minQty);
    const matched = sorted.find((t) => quantity >= t.minQty);
    const tierPrice = matched ? matched.price : service.price;
    const savingsPerUnit = Math.max(0, service.price - tierPrice);
    const discountPercent =
      service.price > 0 ? Math.round((savingsPerUnit / service.price) * 100) : 0;
    return {
      tierPrice,
      activeTier: matched,
      savingsPerUnit,
      discountPercent,
    };
  };

  const tierInfo = resolveServiceTier(activeCalcService, calcQty);
  const isCustomOverridden =
    customUnitPrice !== null && customUnitPrice !== tierInfo.tierPrice;
  const effectiveUnitPrice =
    customUnitPrice !== null ? customUnitPrice : tierInfo.tierPrice;
  const calcSubtotal = effectiveUnitPrice * (calcQty || 0);
  const totalUnitSavings =
    Math.max(0, activeCalcService.price - effectiveUnitPrice) * (calcQty || 0);

  // Switch service: reset custom price override
  const handleServiceChange = (serviceId: string) => {
    setCalcServiceId(serviceId);
    setCustomUnitPrice(null);
  };

  // Add calculated item to current order
  const handleAddCalculatedToOrder = () => {
    if (calcQty <= 0) {
      alert('Jumlah (Qty) minimal 1!');
      return;
    }

    const newItem: PrintOrderItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      serviceName: activeCalcService.name,
      category: activeCalcService.category as PrintServiceCategory,
      quantity: calcQty,
      unit: activeCalcService.unit,
      pricePerUnit: effectiveUnitPrice,
      basePrice: activeCalcService.price,
      isCustomPrice: isCustomOverridden,
      subtotal: calcSubtotal,
      specNote: calcSpecNote.trim() || undefined,
    };

    setOrderItems((prev) => [...prev, newItem]);
    setCalcSpecNote('');
  };

  // Quick 1-click adder for popular items
  const handleAddQuickItem = (serviceQuery: string, defaultQty: number = 1) => {
    const srv =
      printServices.find((s) => s.id === serviceQuery) ||
      printServices.find((s) => s.name.toLowerCase().includes(serviceQuery.toLowerCase())) ||
      printServices[0];
    if (!srv) return;
    const tInfo = resolveServiceTier(srv, defaultQty);
    const newItem: PrintOrderItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      serviceName: srv.name,
      category: srv.category as PrintServiceCategory,
      quantity: defaultQty,
      unit: srv.unit,
      pricePerUnit: tInfo.tierPrice,
      basePrice: srv.price,
      isCustomPrice: false,
      subtotal: tInfo.tierPrice * defaultQty,
    };
    setOrderItems((prev) => [...prev, newItem]);
  };

  // Inline edit quantity in cart
  const handleUpdateItemQty = (id: string, newQty: number) => {
    const validQty = Math.max(1, newQty);
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        // If not custom price, recalculate tier price for new quantity
        let updatedPrice = item.pricePerUnit;
        const matchingSrv = printServices.find((s) => s.name === item.serviceName);
        if (matchingSrv && !item.isCustomPrice) {
          const tInfo = resolveServiceTier(matchingSrv, validQty);
          updatedPrice = tInfo.tierPrice;
        }
        return {
          ...item,
          quantity: validQty,
          pricePerUnit: updatedPrice,
          subtotal: updatedPrice * validQty,
        };
      })
    );
  };

  // Inline edit unit price in cart (flexible cashier negotiation)
  const handleUpdateItemPrice = (id: string, newPrice: number) => {
    const validPrice = Math.max(0, newPrice);
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          pricePerUnit: validPrice,
          isCustomPrice: true,
          subtotal: validPrice * item.quantity,
        };
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setOrderItems((prev) => prev.filter((i) => i.id !== id));
  };

  const rawTotalOrderAmount = orderItems.reduce((acc, i) => acc + i.subtotal, 0);
  const totalOrderAmount = Math.max(0, rawTotalOrderAmount - discountAmount);
  const effectiveCashTendered = cashTendered > 0 ? cashTendered : totalOrderAmount;
  const changeAmount =
    paymentMethod === 'tunai' ? Math.max(0, effectiveCashTendered - totalOrderAmount) : 0;

  // Mode Langsung Bayar (Direct POS Checkout on the spot)
  const handleDirectPayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (orderItems.length === 0) {
      alert('Tambahkan minimal 1 item percetakan / fotokopi terlebih dahulu!');
      return;
    }

    if (totalOrderAmount === 0 && !isOwner) {
      alert('Pembayaran Rp 0 (Gratis) khusus diizinkan untuk OWNER yang sedang bertugas!');
      return;
    }

    const isHutang = paymentMethod === 'hutang';
    if (isHutang && (!customerName.trim() || customerName.trim().toLowerCase() === 'pelanggan umum')) {
      alert('Mohon masukkan Nama Orang / Pelanggan yang Kasbon agar tersimpan jelas di Buku Hutang & Kasbon!');
      return;
    }

    const finalCustomerName = customerName.trim() || 'Pelanggan Umum';
    const paidAmount = isHutang ? 0 : totalOrderAmount;
    const remainingAmount = isHutang ? totalOrderAmount : 0;

    const order = addPrintOrder(
      {
        customerName: finalCustomerName,
        customerPhone: customerPhone.trim() || '-',
        items: orderItems,
        totalAmount: totalOrderAmount,
        discount: discountAmount > 0 ? discountAmount : undefined,
        downPayment: paidAmount,
        remainingAmount: remainingAmount,
        paymentMethod,
        status: 'selesai', // Langsung selesai & lunas di tempat!
        deadline: 'Selesai di tempat',
        fileOrNote: fileOrNote.trim() || undefined,
      },
      isHutang ? debtDueDate : undefined
    );

    // Buka struk transaksi percetakan langsung
    openReceipt(order);

    setSuccessToast(
      isHutang
        ? `Transaksi Kasbon ${order.id} Rp ${totalOrderAmount.toLocaleString('id-ID')} atas nama ${finalCustomerName} berhasil dicatat ke Buku Hutang!`
        : totalOrderAmount === 0
        ? `Pembayaran ${order.id} Rp 0 (GRATIS OWNER) Berhasil Diproses!`
        : `Pembayaran ${order.id} Rp ${totalOrderAmount.toLocaleString('id-ID')} (${paymentMethod.toUpperCase()}) Berhasil & Lunas!`
    );
    setTimeout(() => setSuccessToast(''), 4500);

    // Reset Form for next customer
    setOrderItems([]);
    setCustomerName('Pelanggan Umum');
    setCustomerPhone('');
    setCashTendered(0);
    setDiscountAmount(0);
    setFileOrNote('');
  };

  // Filtered orders list
  const filteredOrders = printOrders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((i) => i.serviceName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Service Category Chips
  const categoryFilters = [
    { id: 'all', label: 'Semua Layanan', icon: Layers },
    { id: 'print_dokumen', label: 'Print Dokumen', icon: FileText },
    { id: 'fotokopi', label: 'Fotokopi HVS', icon: Copy },
    { id: 'cetak_foto', label: 'Cetak Pas Foto & Polaroid', icon: ImageIcon },
    { id: 'banner_spanduk', label: 'Banner & Spanduk', icon: Printer },
    { id: 'stiker_label', label: 'Stiker & Label', icon: Tag },
    { id: 'jilid_laminating', label: 'Jilid & Laminating', icon: Scissors },
    { id: 'kartu_nama_id', label: 'Kartu Nama & Nota', icon: CreditCard },
  ];

  const filteredPriceList = printServices.filter((item) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'kartu_nama_id') {
      return item.category === 'kartu_nama_id' || item.category === 'undangan_nota';
    }
    return item.category === selectedCategory;
  });

  // Metrics for counters
  const antreanCount = printOrders.filter((o) => o.status === 'antrean').length;
  const prosesCount = printOrders.filter((o) => o.status === 'proses').length;
  const selesaiCount = printOrders.filter((o) => o.status === 'selesai').length;
  const totalOmzetPercetakan = printOrders.reduce((acc, o) => acc + o.totalAmount, 0);

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#f8fafc]">
      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex items-center bg-white border-b border-slate-200 p-2 shrink-0">
        <div className="grid grid-cols-3 w-full p-1 bg-slate-100 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setMobileTab('create')}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              mobileTab === 'create'
                ? 'bg-white text-emerald-950 shadow-sm font-black ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Kasir Cetak</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileTab('preview');
              setShowLiveReceiptPreview(true);
            }}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              mobileTab === 'preview'
                ? 'bg-white text-amber-950 shadow-sm font-black ring-1 ring-amber-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">Live Struk</span>
            {orderItems.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('queue')}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              mobileTab === 'queue'
                ? 'bg-white text-teal-950 shadow-sm font-black ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">Riwayat ({printOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Left Column: Kasir Cetak Sederhana & Lengkap */}
      <div
        className={`${
          mobileTab === 'create' ? 'flex' : 'hidden'
        } md:flex w-full md:w-[490px] lg:w-[520px] bg-white md:border-r border-slate-200 flex-col h-full shadow-xs shrink-0 overflow-y-auto`}
      >
        {/* Terminal Header */}
        <div className="p-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold">
                <Printer className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                  <span>Kasir Percetakan & Fotokopi</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Print, Fotokopi, Foto, Banner, Jilid & Nota
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowTierGuideModal(true)}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                title="Kelola daftar harga dan tingkat grosir"
              >
                <Tag className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">Tarif & Grosir</span>
              </button>

              <button
                type="button"
                onClick={toggleLiveReceiptPreview}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                  showLiveReceiptPreview
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Tampilkan simulasi visual struk termal"
              >
                {showLiveReceiptPreview ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="hidden sm:inline">Live Struk</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-4 space-y-4 flex-1 pb-32 sm:pb-8">
          {successToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-bold animate-fade-in shadow-2xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 1: PILIH & SESUAIKAN LAYANAN PERCETAKAN              */}
          {/* ========================================================= */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>1. Pilih Layanan Percetakan</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {filteredPriceList.length} Layanan
              </span>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'print_dokumen', label: 'Print Dokumen' },
                { id: 'fotokopi', label: 'Fotokopi' },
                { id: 'cetak_foto', label: 'Foto' },
                { id: 'banner_spanduk', label: 'Banner' },
                { id: 'jilid_laminating', label: 'Jilid/Laminating' },
                { id: 'kartu_nama_id', label: 'Nota/ID' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition shrink-0 cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Quick Grid of Services */}
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-0.5">
              {filteredPriceList.map((srv) => {
                const isSelected = activeCalcService.id === srv.id;
                const minTierPrice = srv.tiers && srv.tiers.length > 0
                  ? Math.min(...srv.tiers.map((t) => t.price))
                  : null;

                return (
                  <div
                    key={srv.id}
                    onClick={() => handleServiceChange(srv.id)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white border-teal-500 ring-2 ring-teal-500/30 shadow-xs'
                        : 'bg-white hover:bg-slate-100/70 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 line-clamp-1 leading-snug">
                        {srv.name}
                      </div>
                      <div className="text-[11px] font-mono font-extrabold text-teal-700 mt-0.5">
                        Rp {srv.price.toLocaleString('id-ID')}
                        <span className="text-[10px] text-slate-400 font-normal"> /{srv.unit}</span>
                      </div>
                      {minTierPrice && minTierPrice < srv.price && (
                        <div className="text-[9px] text-emerald-700 font-bold mt-0.5">
                          Grosir s/d Rp {minTierPrice.toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[9px] text-slate-500 capitalize truncate">
                        {srv.category.replace('_', ' ')}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddQuickItem(srv.id, 1);
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 cursor-pointer transition active:scale-95"
                        title="Tambah 1 item langsung ke tagihan"
                      >
                        + Tambah
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Customizer / Calculator for the active service */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 truncate">
                  Sesuaikan: <span className="text-teal-700">{activeCalcService.name}</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Satuan: {activeCalcService.unit}
                </span>
              </div>

              {/* Wholesale Tier Buttons (if available) */}
              {activeCalcService.tiers && activeCalcService.tiers.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-500">
                    Pilihan Paket Grosir (Klik untuk set Qty):
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                    {activeCalcService.tiers.map((t) => {
                      const isActive = tierInfo.activeTier?.minQty === t.minQty && !isCustomOverridden;
                      return (
                        <button
                          key={t.minQty}
                          type="button"
                          onClick={() => {
                            setCalcQty(t.minQty);
                            setCustomUnitPrice(null);
                          }}
                          className={`px-2 py-1 text-[10px] rounded-lg border font-mono transition shrink-0 cursor-pointer ${
                            isActive
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-1 ring-emerald-400'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          ≥{t.minQty} {activeCalcService.unit} (Rp {t.price.toLocaleString('id-ID')})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Qty & Unit Price Controls */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">
                    Jumlah / Qty ({activeCalcService.unit}):
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCalcQty((prev) => Math.max(1, prev - 1))}
                      className="w-7 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer border border-slate-200"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={calcQty || ''}
                      onChange={(e) => setCalcQty(Math.max(1, Number(e.target.value) || 0))}
                      className="w-full text-center py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => setCalcQty((prev) => prev + 1)}
                      className="w-7 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer border border-slate-200"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-600">
                      Harga Satuan (Rp):
                    </label>
                    {isCustomOverridden && (
                      <button
                        type="button"
                        onClick={() => setCustomUnitPrice(null)}
                        className="text-[9px] text-amber-700 hover:underline font-bold"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={effectiveUnitPrice || ''}
                    onChange={(e) => setCustomUnitPrice(Number(e.target.value) || 0)}
                    placeholder="0"
                    className={`w-full px-2 py-1 text-right text-xs font-mono font-bold rounded-lg border focus:ring-1 ${
                      isCustomOverridden
                        ? 'bg-amber-50 border-amber-400 text-amber-950 focus:ring-amber-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:ring-teal-500'
                    }`}
                    title="Harga satuan bisa diedit untuk negosiasi kasir"
                  />
                </div>
              </div>

              {/* Optional Spec Note */}
              <input
                type="text"
                value={calcSpecNote}
                onChange={(e) => setCalcSpecNote(e.target.value)}
                placeholder="Catatan spesifikasi (opsional, cth: Kertas F4, bolak-balik)..."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />

              {/* Add Calculated Item Button */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-xs">
                  <span className="text-[10px] text-slate-500 block">Subtotal:</span>
                  <span className="font-mono font-extrabold text-teal-800 text-sm">
                    Rp {calcSubtotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddCalculatedToOrder}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Masukkan Tagihan</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* STEP 2: DAFTAR ITEM TAGIHAN / KERANJANG CETAK             */}
          {/* ========================================================= */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-teal-600" />
                <span>2. Keranjang Tagihan ({orderItems.length})</span>
              </span>
              {orderItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setOrderItems([])}
                  className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {orderItems.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 space-y-1">
                <Printer className="w-5 h-5 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600">Keranjang Masih Kosong</p>
                <p className="text-[11px] text-slate-400">
                  Pilih layanan di atas atau klik "+ Tambah" untuk memasukkan item cetak.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 leading-tight">
                          {item.serviceName}
                        </div>
                        {item.specNote && (
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                            Catatan: {item.specNote}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Hapus item"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/80 items-center">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500 font-bold">Qty:</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(item.id, item.quantity - 1)}
                          className="w-5 h-6 rounded bg-white border border-slate-300 text-slate-700 font-bold flex items-center justify-center cursor-pointer hover:bg-slate-100"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItemQty(item.id, Number(e.target.value) || 1)}
                          className="w-11 text-center py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(item.id, item.quantity + 1)}
                          className="w-5 h-6 rounded bg-white border border-slate-300 text-slate-700 font-bold flex items-center justify-center cursor-pointer hover:bg-slate-100"
                        >
                          +
                        </button>
                        <span className="text-[10px] text-slate-500 truncate">{item.unit}</span>
                      </div>

                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[10px] text-slate-500 font-bold">@Rp:</span>
                        <input
                          type="number"
                          min="0"
                          value={item.pricePerUnit}
                          onChange={(e) => handleUpdateItemPrice(item.id, Number(e.target.value) || 0)}
                          className="w-20 text-right py-0.5 px-1 bg-white border border-slate-300 rounded font-mono font-bold text-xs focus:ring-1 focus:ring-teal-500"
                          title="Harga satuan fleksibel / nego kasir"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-200">
                      <div>
                        {item.isCustomPrice && (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Nego Kasir
                          </span>
                        )}
                      </div>
                      <div className="font-mono font-black text-slate-900 text-xs">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* STEP 3: RINCIAN PEMBAYARAN & CETAK STRUK                  */}
          {/* ========================================================= */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-xs font-bold text-teal-400 block uppercase tracking-wider">
                  3. Total Tagihan Percetakan
                </span>
                <span className="text-[11px] text-slate-400">
                  {orderItems.length} item • {discountAmount > 0 ? 'Diskon Aktif' : 'Lunas / Kasbon'}
                </span>
              </div>
              <div className="text-right">
                {discountAmount > 0 && (
                  <div className="text-[11px] text-slate-400 line-through font-mono">
                    Rp {rawTotalOrderAmount.toLocaleString('id-ID')}
                  </div>
                )}
                <span className={`text-2xl font-black font-mono tracking-tight ${totalOrderAmount === 0 ? 'text-amber-400' : 'text-teal-300'}`}>
                  Rp {totalOrderAmount.toLocaleString('id-ID')}
                </span>
                {totalOrderAmount === 0 && isOwner && (
                  <span className="block text-[10px] font-black text-amber-300 uppercase tracking-wider">
                    👑 Owner Rp 0 (Gratis)
                  </span>
                )}
              </div>
            </div>

            {/* SISTEM DISKON PERCETAKAN */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-teal-300">
                  <Tag className="w-3.5 h-3.5 text-teal-400" />
                  <span>Potongan / Diskon Order</span>
                  {isOwner ? (
                    <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded font-black">
                      👑 Akses Bebas Owner (Hingga Rp 0)
                    </span>
                  ) : (
                    <span className="text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                      Kasir Standar
                    </span>
                  )}
                </div>
                {discountAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => setDiscountAmount(0)}
                    className="text-[10px] text-rose-400 hover:text-rose-300 underline font-semibold cursor-pointer"
                  >
                    Reset Diskon
                  </button>
                )}
              </div>

              {/* Preset Chips */}
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { label: '0%', val: 0 },
                  { label: '5%', val: Math.round(rawTotalOrderAmount * 0.05) },
                  { label: '10%', val: Math.round(rawTotalOrderAmount * 0.1) },
                  { label: '20%', val: Math.round(rawTotalOrderAmount * 0.2) },
                  { label: '50%', val: Math.round(rawTotalOrderAmount * 0.5) },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setDiscountAmount(preset.val)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      discountAmount === preset.val
                        ? 'bg-teal-500 text-slate-950 border-teal-400 font-black shadow-xs'
                        : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}

                {/* Owner Special 100% Free / Rp 0 */}
                <button
                  type="button"
                  onClick={() => {
                    if (isOwner) {
                      setDiscountAmount(rawTotalOrderAmount);
                    } else {
                      alert('Diskon 100% (Bayar Rp 0) hanya diizinkan bila yang bertugas di kasir adalah OWNER!');
                    }
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black border transition cursor-pointer flex items-center gap-1 ${
                    discountAmount === rawTotalOrderAmount && rawTotalOrderAmount > 0
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                      : isOwner
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30'
                      : 'bg-slate-800 text-slate-500 border-slate-700 opacity-60'
                  }`}
                  title={isOwner ? 'Khusus Owner: Gratiskan Order (Rp 0)' : 'Hanya untuk Owner'}
                >
                  <span>👑 100% (Rp 0)</span>
                </button>
              </div>

              {/* Custom Discount Input */}
              <div className="flex items-center gap-2 pt-0.5 text-xs">
                <span className="text-[11px] text-slate-400">Nominal Diskon (Rp):</span>
                <div className="flex items-center gap-1 flex-1 justify-end font-mono">
                  <span className="text-slate-500 font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={discountAmount || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      if (!isOwner && val >= rawTotalOrderAmount && rawTotalOrderAmount > 0) {
                        alert('Hanya OWNER yang dapat memberikan diskon hingga total bayar Rp 0!');
                        setDiscountAmount(Math.max(0, rawTotalOrderAmount - 500));
                        return;
                      }
                      setDiscountAmount(val);
                    }}
                    placeholder="0"
                    className="w-32 text-right px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-teal-300 focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>
            </div>

            {/* Customer Name & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-300 block mb-1">
                  Nama Pelanggan / Kasbon: <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama Pelanggan (Wajib jika Kasbon)"
                  className={`w-full px-2.5 py-1.5 text-xs bg-slate-800 border rounded-lg text-white font-medium focus:bg-slate-900 focus:outline-none ${
                    paymentMethod === 'hutang'
                      ? 'border-amber-400 focus:border-amber-300 ring-1 ring-amber-400/30'
                      : 'border-slate-700 focus:border-teal-400'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-300 block mb-1">
                  No. WhatsApp / HP (Opsional):
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0812..."
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:bg-slate-900 focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-[10px] font-bold text-slate-300 block mb-1.5">
                Pilih Metode Pembayaran:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'tunai', label: 'Tunai', icon: Banknote },
                  { id: 'qris', label: 'QRIS', icon: QrCode },
                  { id: 'hutang', label: 'Kasbon', icon: Receipt },
                  { id: 'transfer', label: 'Transfer', icon: CreditCard },
                ].map((m) => {
                  const Icon = m.icon;
                  const active = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(m.id as PaymentMethod);
                        if (m.id === 'tunai' && cashTendered === 0) {
                          setCashTendered(totalOrderAmount);
                        }
                      }}
                      className={`py-2 px-1 text-xs font-bold rounded-xl flex flex-col items-center gap-1 transition cursor-pointer border ${
                        active
                          ? m.id === 'hutang'
                            ? 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-sm scale-[1.02]'
                            : 'bg-teal-500 text-slate-950 font-black border-teal-300 shadow-sm scale-[1.02]'
                          : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-750 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contextual Details for Selected Method */}
            {paymentMethod === 'tunai' && (
              <div className="bg-slate-800/95 rounded-xl p-3 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-bold text-slate-300 shrink-0">
                    Uang Diterima:
                  </label>
                  <div className="flex items-center gap-1 font-mono flex-1 justify-end">
                    <span className="text-slate-400 text-xs font-bold">Rp</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={cashTendered || ''}
                      onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                      placeholder={totalOrderAmount > 0 ? String(totalOrderAmount) : '0'}
                      className="w-36 text-right px-2.5 py-1 bg-slate-900 border border-teal-500/70 rounded-lg text-sm font-black text-teal-300 focus:outline-none focus:ring-1 focus:ring-teal-400"
                    />
                  </div>
                </div>

                {/* Quick Cash Presets */}
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setCashTendered(totalOrderAmount)}
                    className="px-2 py-1 text-[10px] font-black rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30 cursor-pointer transition"
                  >
                    Uang Pas
                  </button>
                  {[2000, 5000, 10000, 20000, 50000, 100000].map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() =>
                        setCashTendered((prev) => (prev > 0 ? prev + nominal : nominal))
                      }
                      className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-700 hover:bg-slate-650 text-slate-200 border border-slate-600 cursor-pointer transition"
                    >
                      +{nominal >= 1000 ? `${nominal / 1000}rb` : nominal}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Kembalian:</span>
                  <span
                    className={`font-mono text-sm font-black ${
                      changeAmount > 0
                        ? 'text-amber-300'
                        : effectiveCashTendered >= totalOrderAmount
                        ? 'text-teal-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {effectiveCashTendered < totalOrderAmount && totalOrderAmount > 0
                      ? `Kurang Rp ${(totalOrderAmount - effectiveCashTendered).toLocaleString('id-ID')}`
                      : `Rp ${changeAmount.toLocaleString('id-ID')}`}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'qris' && (
              <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold text-teal-300">
                  <span className="flex items-center gap-1.5">
                    <QrCode className="w-4 h-4" /> QRIS Ju-Fat Cell
                  </span>
                  <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                    NMID: ID10202688190
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Arahkan pelanggan scan QRIS sebesar <b className="font-mono text-white">Rp {totalOrderAmount.toLocaleString('id-ID')}</b>.
                </p>
              </div>
            )}

            {paymentMethod === 'hutang' && (
              <div className="bg-amber-950/60 border border-amber-600/50 rounded-xl p-3 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Receipt className="w-4 h-4" /> Kasbon Percetakan (Catat ke Buku Hutang)
                </div>
                <div>
                  <label className="text-[10px] font-bold text-amber-200 block mb-1">
                    Jatuh Tempo Pembayaran:
                  </label>
                  <input
                    type="date"
                    value={debtDueDate}
                    onChange={(e) => setDebtDueDate(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-900 border border-amber-500/50 rounded-lg text-white font-mono text-xs focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-amber-200/90 leading-tight">
                  Tagihan Rp {totalOrderAmount.toLocaleString('id-ID')} akan otomatis tercatat ke <b>Buku Hutang & Kasbon</b> atas nama <b className="text-white">{customerName.trim() || '...'}</b>.
                </p>
              </div>
            )}

            {paymentMethod === 'transfer' && (
              <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold text-teal-300">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" /> Transfer Bank Konter
                  </span>
                  <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                    BCA / BRI
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Transfer pas sebesar <b className="font-mono text-white">Rp {totalOrderAmount.toLocaleString('id-ID')}</b> ke rekening konter Ju-Fat Cell.
                </p>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => handleDirectPayment()}
              disabled={orderItems.length === 0}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-wide transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                orderItems.length === 0
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : totalOrderAmount === 0 && isOwner
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-lg shadow-amber-950/40 border border-amber-300 ring-2 ring-amber-400/50 hover:brightness-105'
                  : paymentMethod === 'hutang'
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-950/40'
                  : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-teal-950/40'
              }`}
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>
                {orderItems.length === 0
                  ? 'PILIH ITEM CETAK DI ATAS'
                  : totalOrderAmount === 0 && isOwner
                  ? '🎁 BAYAR Rp 0 & CETAK STRUK (OWNER GRATIS)'
                  : paymentMethod === 'hutang'
                  ? `CATAT KASBON & STRUK (Rp ${totalOrderAmount.toLocaleString('id-ID')})`
                  : `BAYAR & CETAK STRUK (Rp ${totalOrderAmount.toLocaleString('id-ID')})`}
              </span>
            </button>
          </div>

          {/* Inline Live Receipt Preview (Saat toggle aktif) */}
          {showLiveReceiptPreview && (
            <div className="bg-slate-900 rounded-2xl border border-amber-400 p-3.5 shadow-xl space-y-2 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs">
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <span>Live Preview Struk Kasir Termal</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLiveReceiptPreview(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-md text-xs cursor-pointer"
                  title="Tutup Preview"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <LiveThermalReceiptPaper
                storeProfile={storeProfile}
                orderItems={orderItems}
                customerName={customerName}
                customerPhone={customerPhone}
                paymentMethod={paymentMethod}
                cashTendered={cashTendered}
                changeAmount={changeAmount}
                debtDueDate={debtDueDate}
                fileOrNote={fileOrNote}
                totalOrderAmount={totalOrderAmount}
                rawTotalOrderAmount={rawTotalOrderAmount}
                discountAmount={discountAmount}
                effectiveCashTendered={effectiveCashTendered}
                paperWidth={receiptPaperWidth}
                setPaperWidth={setReceiptPaperWidth}
                onPayAndPrint={() => handleDirectPayment()}
                isInline={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Riwayat Transaksi & Live Struk Termal Preview */}
      <div
        className={`${
          mobileTab === 'queue' || mobileTab === 'preview' ? 'flex' : 'hidden'
        } md:flex flex-1 flex-col h-full bg-[#f8fafc] overflow-hidden min-w-0`}
      >
        {/* Top Header Mode Tabs (Riwayat vs Live Preview) */}
        <div className="bg-slate-900 px-3.5 sm:px-5 py-2.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/90 rounded-xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => {
                setRightColumnTab('history');
                if (mobileTab === 'preview') setMobileTab('queue');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                rightColumnTab === 'history' && mobileTab !== 'preview'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat & Antrean ({printOrders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRightColumnTab('receipt_preview');
                setShowLiveReceiptPreview(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                rightColumnTab === 'receipt_preview' || mobileTab === 'preview'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Live Struk Termal</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {orderItems.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                  rightColumnTab === 'receipt_preview' || mobileTab === 'preview'
                    ? 'bg-slate-900 text-amber-300'
                    : 'bg-amber-400 text-slate-950'
                }`}>
                  {orderItems.length}
                </span>
              )}
            </button>
          </div>

          {(rightColumnTab === 'receipt_preview' || mobileTab === 'preview') && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-300 hidden sm:inline font-medium">
                Kertas Termal:
              </span>
              <div className="flex items-center p-0.5 bg-slate-800 rounded-lg border border-slate-700 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setReceiptPaperWidth('58mm')}
                  className={`px-2.5 py-1 rounded font-bold transition cursor-pointer ${
                    receiptPaperWidth === '58mm'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  58mm
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptPaperWidth('80mm')}
                  className={`px-2.5 py-1 rounded font-bold transition cursor-pointer ${
                    receiptPaperWidth === '80mm'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  80mm
                </button>
              </div>
            </div>
          )}
        </div>

        {rightColumnTab === 'receipt_preview' || mobileTab === 'preview' ? (
          /* Dedicated Full Live Preview Panel */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-36 sm:pb-12 bg-slate-900 flex flex-col items-center">
            <div className="w-full max-w-md mb-3 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span>Simulasi Real-Time Struk Kasir Termal</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Preview
              </span>
            </div>

            <LiveThermalReceiptPaper
              storeProfile={storeProfile}
              orderItems={orderItems}
              customerName={customerName}
              customerPhone={customerPhone}
              paymentMethod={paymentMethod}
              cashTendered={cashTendered}
              changeAmount={changeAmount}
              debtDueDate={debtDueDate}
              fileOrNote={fileOrNote}
              totalOrderAmount={totalOrderAmount}
              rawTotalOrderAmount={rawTotalOrderAmount}
              discountAmount={discountAmount}
              effectiveCashTendered={effectiveCashTendered}
              paperWidth={receiptPaperWidth}
              setPaperWidth={setReceiptPaperWidth}
              onPayAndPrint={() => handleDirectPayment()}
              isInline={false}
            />
          </div>
        ) : (
          <>
            {/* Top Header Metrics & Search */}
            <div className="p-3.5 sm:p-4 bg-white border-b border-slate-200 space-y-3 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Riwayat Transaksi & Antrean Percetakan
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{printOrders.length} Total Transaksi</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700 font-semibold">{selesaiCount} Selesai</span>
                    {(antreanCount > 0 || prosesCount > 0) && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-700 font-semibold">{antreanCount} Antrean</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-blue-700 font-semibold">{prosesCount} Proses</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Total Omzet Percetakan:
                  </span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    Rp {totalOmzetPercetakan.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama pelanggan, nomor HP, atau No. Order..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 max-w-full">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'antrean', label: 'Antrean' },
                    { id: 'proses', label: 'Proses' },
                    { id: 'selesai', label: 'Siap Ambil' },
                    { id: 'diambil', label: 'Selesai / Diambil' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStatusFilter(st.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 cursor-pointer ${
                        statusFilter === st.id
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

        {/* Orders List Container */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 pb-36 sm:pb-12 space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Printer className="w-12 h-12 stroke-[1.5] text-slate-300" />
              <p className="text-sm font-bold text-slate-700">Tidak ada order percetakan ditemukan</p>
              <p className="text-xs text-slate-400">
                {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Tambahkan pesanan cetak baru melalui formulir'}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const remaining = Math.max(0, order.totalAmount - order.downPayment);
              const isLunas = remaining === 0;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:shadow-md transition space-y-3"
                >
                  {/* Top Bar: Order ID, Date, Customer & Status */}
                  <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                          {order.id}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {order.date}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 pt-0.5">
                        {order.customerName}
                      </h4>
                      {order.customerPhone && order.customerPhone !== '-' && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{order.customerPhone}</span>
                          <a
                            href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Halo Kak ${order.customerName}, info dari Ju-Fat Cell: Pesanan percetakan Anda ${order.id} saat ini berstatus ${order.status.toUpperCase()}. Terima kasih!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:text-emerald-800 text-[11px] font-bold underline flex items-center gap-0.5 ml-1"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Status Badge & Actions */}
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg uppercase tracking-wider border ${
                          order.status === 'antrean'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : order.status === 'proses'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : order.status === 'selesai'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {order.status === 'antrean'
                          ? '⏳ Antrean'
                          : order.status === 'proses'
                          ? '⚙️ Sedang Diproses'
                          : order.status === 'selesai'
                          ? '✓ Siap Ambil / Selesai'
                          : 'Sudah Diambil'}
                      </span>

                      {order.deadline && (
                        <span className="text-[10px] text-slate-400">
                          Deadline: {order.deadline}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-slate-800">{item.serviceName}</span>
                          <span className="text-slate-500 text-[11px] ml-1.5">
                            ({item.quantity} {item.unit})
                          </span>
                          {item.specNote && (
                            <span className="text-[11px] text-indigo-700 italic block">
                              [{item.specNote}]
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-extrabold text-slate-900 shrink-0">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                    {order.fileOrNote && (
                      <div className="pt-1.5 mt-1 border-t border-slate-200 text-[11px] text-slate-600">
                        <span className="font-bold text-slate-700">Catatan/File:</span> {order.fileOrNote}
                      </div>
                    )}
                  </div>

                  {/* Bottom Financial & Operational Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Total Biaya:</span>
                        <span className="font-mono font-black text-sm text-slate-900">
                          Rp {order.totalAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="border-l border-slate-200 pl-3">
                        <span className="text-[10px] text-slate-500 block">DP Masuk:</span>
                        <span className="font-mono font-bold text-xs text-emerald-800">
                          Rp {order.downPayment.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="border-l border-slate-200 pl-3">
                        <span className="text-[10px] text-slate-500 block">Sisa Tagihan:</span>
                        <span
                          className={`font-mono font-extrabold text-xs ${
                            remaining > 0 ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {remaining > 0 ? `Rp ${remaining.toLocaleString('id-ID')}` : 'Lunas'}
                        </span>
                      </div>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {order.status === 'antrean' && (
                        <button
                          type="button"
                          onClick={() => updatePrintOrderStatus(order.id, 'proses')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        >
                          Mulai Proses Cetak
                        </button>
                      )}

                      {order.status === 'proses' && (
                        <button
                          type="button"
                          onClick={() => updatePrintOrderStatus(order.id, 'selesai')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        >
                          Tandai Selesai Cetak
                        </button>
                      )}

                      {order.status === 'selesai' && (
                        <button
                          type="button"
                          onClick={() => handleOpenSettlePrintOrder(order)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        >
                          {remaining > 0 ? `Pelunasan & Serahkan` : `Serahkan ke Pelanggan`}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openReceipt(order)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 hover:border-teal-300 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        title="Cetak Struk Termal Percetakan (58mm / 80mm)"
                      >
                        <Printer className="w-3.5 h-3.5 text-teal-600" />
                        <span>Struk Termal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus order percetakan ${order.id}?`)) {
                            deletePrintOrder(order.id);
                          }
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                        title="Hapus order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL KATALOG & MANAJEMEN TARIF PERCETAKAN (EDIT & HAPUS HARGA)        */}
      {/* ========================================================================= */}
      {showTierGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden my-auto animate-scale-up flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-700 via-teal-700 to-emerald-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-tight">
                    Katalog & Manajemen Tarif Percetakan
                  </h3>
                  <p className="text-[11px] text-teal-100">
                    Atur harga eceran, tingkat grosir volume, tambah layanan baru atau hapus tarif
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTierGuideModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Sub-Header Toolbar: Search, Filters & Actions */}
            <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 space-y-2.5 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={priceCatalogSearch}
                    onChange={(e) => setPriceCatalogSearch(e.target.value)}
                    placeholder="Cari nama layanan, bahan, atau satuan cetak..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {priceCatalogSearch && (
                    <button
                      type="button"
                      onClick={() => setPriceCatalogSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenCreateService();
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Tambah Layanan Baru</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetServices}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                    title="Kembalikan semua tarif ke standar pabrik Ju-Fat"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Reset Standar</span>
                  </button>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
                {[
                  { id: 'all', label: 'Semua Layanan' },
                  { id: 'print_dokumen', label: 'Print Dokumen' },
                  { id: 'fotokopi', label: 'Fotokopi HVS' },
                  { id: 'cetak_foto', label: 'Pas Foto & Polaroid' },
                  { id: 'banner_spanduk', label: 'Banner & Spanduk' },
                  { id: 'stiker_label', label: 'Stiker & Label' },
                  { id: 'jilid_laminating', label: 'Jilid & Laminating' },
                  { id: 'kartu_nama_id', label: 'Kartu Nama & Nota' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setPriceCatalogCategory(cat.id)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition shrink-0 cursor-pointer ${
                      priceCatalogCategory === cat.id
                        ? 'bg-indigo-700 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body: Cards List */}
            <div className="p-3 sm:p-5 space-y-3 overflow-y-auto flex-1">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Prinsip Grosir Ju-Fat Print:</span> Setiap layanan dapat memiliki beberapa tingkat harga (tier). Semakin banyak pelanggan mencetak, harga per lembar/meter otomatis semakin murah. Klik tombol <b>"Ubah Harga"</b> untuk menyesuaikan tarif atau <b>"Hapus"</b> untuk membuang layanan.
                </div>
              </div>

              {(() => {
                const list = printServices.filter((srv) => {
                  const matchesCat =
                    priceCatalogCategory === 'all'
                      ? true
                      : priceCatalogCategory === 'kartu_nama_id'
                      ? srv.category === 'kartu_nama_id' || srv.category === 'undangan_nota'
                      : srv.category === priceCatalogCategory;
                  const query = priceCatalogSearch.toLowerCase().trim();
                  const matchesSearch =
                    !query ||
                    srv.name.toLowerCase().includes(query) ||
                    (srv.desc && srv.desc.toLowerCase().includes(query)) ||
                    srv.unit.toLowerCase().includes(query);
                  return matchesCat && matchesSearch;
                });

                if (list.length === 0) {
                  return (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-2">
                      <Printer className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-bold text-slate-700 text-xs">
                        Tidak ada layanan cetak yang sesuai
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Coba ubah kata kunci pencarian atau klik "+ Tambah Layanan Baru".
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenCreateService}
                        className="mt-2 px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        + Tambah Layanan Baru Sekarang
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {list.map((srv) => (
                      <div
                        key={srv.id}
                        className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-2xs hover:border-indigo-300 transition"
                      >
                        {/* Top: Name, Category, Price & Actions */}
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                                {srv.name}
                              </h4>
                              <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                                {srv.category.replace('_', ' ')}
                              </span>
                            </div>
                            {srv.desc && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{srv.desc}</p>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-medium">
                              Harga Standar (Eceran):
                            </span>
                            <span className="text-sm font-black font-mono text-indigo-900">
                              Rp {srv.price.toLocaleString('id-ID')}
                              <span className="text-[10px] text-slate-500 font-normal ml-0.5">
                                /{srv.unit}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Tiers Grid */}
                        <div className="pt-1">
                          <div className="text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                            <span>Tingkat Harga Grosir ({srv.unit}):</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {srv.tiers && srv.tiers.length > 0 ? (
                              srv.tiers.map((t: PrintPriceTier) => {
                                const disc =
                                  srv.price > t.price
                                    ? Math.round(((srv.price - t.price) / srv.price) * 100)
                                    : 0;
                                return (
                                  <div
                                    key={t.minQty}
                                    className={`p-2 rounded-xl border text-xs ${
                                      disc > 0
                                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                                        : 'bg-slate-50 border-slate-200 text-slate-800'
                                    }`}
                                  >
                                    <div className="font-bold text-[10px] text-slate-600">
                                      {t.label || `>= ${t.minQty} ${srv.unit}`}
                                    </div>
                                    <div className="font-mono font-black text-xs text-slate-900 mt-0.5">
                                      Rp {t.price.toLocaleString('id-ID')}
                                    </div>
                                    {disc > 0 ? (
                                      <span className="text-[9px] font-bold text-emerald-700 block">
                                        Hemat {disc}% (Rp {(srv.price - t.price).toLocaleString('id-ID')})
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-slate-400 block">Harga Normal</span>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="col-span-4 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono font-medium text-slate-600">
                                Tarif Tetap / Flat (tanpa potongan grosir volume)
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Action Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditService(srv)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 transition flex items-center gap-1 cursor-pointer"
                              title="Ubah nama, kategori, harga standar & tingkat grosir"
                            >
                              <Edit2 className="w-3 h-3 text-amber-700" />
                              <span>Ubah Harga</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteService(srv)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 transition flex items-center gap-1 cursor-pointer"
                              title="Hapus layanan ini dari daftar tarif"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Hapus</span>
                            </button>
                          </div>

                          {/* Select into Calculator */}
                          <button
                            type="button"
                            onClick={() => {
                              setCalcServiceId(srv.id);
                              setCustomUnitPrice(null);
                              setShowTierGuideModal(false);
                            }}
                            className="px-3 py-1 text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <span>Pilih ke Kalkulator</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500 font-medium">
                Total {printServices.length} layanan percetakan tersimpan
              </span>
              <button
                type="button"
                onClick={() => setShowTierGuideModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Tutup Katalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL FORM: TAMBAH / UBAH HARGA & LAYANAN PERCETAKAN                   */}
      {/* ========================================================================= */}
      {(editingService !== null || isCreatingNewService) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden my-auto animate-scale-up flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-amber-600 via-indigo-700 to-teal-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-black">
                  {editingService ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5 stroke-[2.5]" />}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-tight">
                    {editingService ? 'Ubah Tarif & Layanan Percetakan' : 'Tambah Layanan Percetakan Baru'}
                  </h3>
                  <p className="text-[11px] text-indigo-100">
                    {editingService
                      ? `Menyesuaikan harga eceran & grosir untuk: ${editingService.name}`
                      : 'Isi detail layanan, harga dasar, dan tingkat diskon grosir'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingService(null);
                  setIsCreatingNewService(false);
                }}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveService} className="flex flex-col overflow-hidden flex-1">
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                {/* Field: Name */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nama Layanan Cetak: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Print HVS Warna, Cetak Banner Flexi 280gr..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Field: Category & Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Kategori Layanan:
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as PrintServiceCategory)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="print_dokumen">Print Dokumen</option>
                      <option value="fotokopi">Fotokopi HVS</option>
                      <option value="cetak_foto">Cetak Pas Foto & Polaroid</option>
                      <option value="banner_spanduk">Banner & Spanduk Outdoor</option>
                      <option value="stiker_label">Stiker & Label Produk</option>
                      <option value="jilid_laminating">Jilid Buku & Laminating</option>
                      <option value="kartu_nama_id">Kartu Nama & ID Card</option>
                      <option value="undangan_nota">Nota & Undangan</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Satuan Hitung: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      placeholder="lembar, meter, pcs, rim, buku..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Field: Base Price */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Harga Satuan Standar / Eceran (Rp): <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500">Berlaku untuk Qty awal (1 - tier pertama)</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={formPrice || ''}
                      onChange={(e) => setFormPrice(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="1000"
                      className="w-full pl-9 pr-16 py-2 text-sm font-mono font-black bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      /{formUnit || 'unit'}
                    </span>
                  </div>
                </div>

                {/* Field: Description / Material spec */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Keterangan Bahan / Spesifikasi Teknis:
                  </label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Contoh: Kertas HVS 75gsm A4/F4, Tinta pigment anti air..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Field: Volume Tiers (Semakin Banyak Semakin Murah) */}
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Tingkat Harga Grosir (Semakin Banyak Semakin Murah)</span>
                      </span>
                      <p className="text-[10px] text-slate-500">
                        Atur harga otomatis lebih murah ketika pelanggan memesan dalam jumlah tertentu
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddTierRow}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-800 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      <span>+ Tambah Tier</span>
                    </button>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex items-center gap-1 flex-wrap text-[10px]">
                    <span className="text-slate-500 font-semibold">Terapkan Preset:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormTiers([
                          { minQty: 1, price: formPrice, label: `1 - 20 ${formUnit}` },
                          { minQty: 21, price: Math.round(formPrice * 0.8 / 50) * 50, label: `21 - 50 ${formUnit}` },
                          { minQty: 51, price: Math.round(formPrice * 0.67 / 50) * 50, label: `51 - 100 ${formUnit}` },
                          { minQty: 101, price: Math.round(formPrice * 0.55 / 50) * 50, label: `101+ ${formUnit} (Grosir)` },
                        ]);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium cursor-pointer"
                    >
                      4 Tingkat Grosir
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormTiers([
                          { minQty: 1, price: formPrice, label: `1 - 5 ${formUnit}` },
                          { minQty: 6, price: Math.round(formPrice * 0.88 / 500) * 500, label: `6 - 15 ${formUnit}` },
                          { minQty: 16, price: Math.round(formPrice * 0.76 / 500) * 500, label: `16+ ${formUnit}` },
                        ]);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium cursor-pointer"
                    >
                      Spanduk / Banner
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormTiers([])}
                      className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium cursor-pointer"
                    >
                      Hapus Semua (Tarif Flat)
                    </button>
                  </div>

                  {/* Tiers List / Inputs */}
                  {formTiers.length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
                      Layanan ini menggunakan tarif flat (Rp {formPrice.toLocaleString('id-ID')} /{formUnit} untuk semua jumlah).
                      Klik <b>"+ Tambah Tier"</b> atau <b>"4 Tingkat Grosir"</b> untuk mengaktifkan potongan volume.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase px-1">
                        <span className="col-span-3">Minimal Qty</span>
                        <span className="col-span-4">Harga Satuan (Rp)</span>
                        <span className="col-span-4">Label Tampilan</span>
                        <span className="col-span-1 text-center">Aksi</span>
                      </div>

                      {formTiers.map((tier, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-50 border border-slate-200 rounded-xl"
                        >
                          <div className="col-span-3">
                            <input
                              type="number"
                              min="1"
                              value={tier.minQty}
                              onChange={(e) =>
                                handleUpdateTierRow(idx, 'minQty', Number(e.target.value) || 1)
                              }
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-center"
                              placeholder="Min Qty"
                            />
                          </div>

                          <div className="col-span-4">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={tier.price}
                              onChange={(e) =>
                                handleUpdateTierRow(idx, 'price', Number(e.target.value) || 0)
                              }
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-right text-indigo-900"
                              placeholder="Harga"
                            />
                          </div>

                          <div className="col-span-4">
                            <input
                              type="text"
                              value={tier.label || ''}
                              onChange={(e) =>
                                handleUpdateTierRow(idx, 'label', e.target.value)
                              }
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                              placeholder={`Cth: >= ${tier.minQty} ${formUnit}`}
                            />
                          </div>

                          <div className="col-span-1 flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveTierRow(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="Hapus baris tier ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Footer Buttons */}
              <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingService(null);
                    setIsCreatingNewService(false);
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-md transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  <span>{editingService ? 'Simpan Perubahan Tarif' : 'Tambahkan Layanan Baru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pelunasan & Serahkan Hasil Cetak (Tunai, QRIS, Kasbon) */}
      {settlingPrintOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-300" />
                  Pelunasan & Serahkan Hasil Cetak
                </h3>
                <p className="text-[11px] text-teal-100">
                  Order #{settlingPrintOrder.id} • {settlingPrintOrder.customerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettlingPrintOrder(null)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[82vh] overflow-y-auto">
              {/* Order summary card */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Pelanggan:</span>
                  <span className="font-bold text-slate-800">{settlingPrintOrder.customerName} ({settlingPrintOrder.customerPhone})</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Item Cetak:</span>
                  <span className="font-bold text-slate-800 text-right truncate max-w-[200px]">
                    {settlingPrintOrder.items.map((i) => `${i.serviceName} (${i.quantity} ${i.unit})`).join(', ')}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Total Biaya</span>
                    <span className="font-mono font-bold text-xs text-slate-900">
                      Rp {settlingPrintOrder.totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">DP Masuk</span>
                    <span className="font-mono font-bold text-xs text-emerald-700">
                      Rp {settlingPrintOrder.downPayment.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="bg-rose-50 p-2 rounded-lg border border-rose-200">
                    <span className="text-[10px] text-rose-700 font-bold block">Sisa Tagihan</span>
                    <span className="font-mono font-extrabold text-xs text-rose-700">
                      Rp {(settlingPrintOrder.remainingAmount ?? (settlingPrintOrder.totalAmount - settlingPrintOrder.downPayment)).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* DISKON PELUNASAN PERCETAKAN */}
                <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Tag className="w-3.5 h-3.5 text-teal-600" />
                      <span>Diskon / Potongan Pelunasan</span>
                      {isOwner && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1 py-0.2 rounded font-black">
                          👑 Owner (Bisa Rp 0)
                        </span>
                      )}
                    </div>
                    {settlePrintDiscount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSettlePrintDiscount(0);
                          const rem = settlingPrintOrder.remainingAmount ?? (settlingPrintOrder.totalAmount - settlingPrintOrder.downPayment);
                          setSettlePrintCashReceived(rem);
                        }}
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline"
                      >
                        Hapus Diskon
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    {[
                      { label: '0', val: 0 },
                      { label: '5rb', val: 5000 },
                      { label: '10rb', val: 10000 },
                      { label: '25rb', val: 25000 },
                      {
                        label: '50%',
                        val: Math.round(
                          ((settlingPrintOrder.remainingAmount ?? (settlingPrintOrder.totalAmount - settlingPrintOrder.downPayment))) * 0.5
                        ),
                      },
                    ].map((p) => {
                      const baseRem = settlingPrintOrder.remainingAmount ?? (settlingPrintOrder.totalAmount - settlingPrintOrder.downPayment);
                      const safeVal = Math.min(baseRem, p.val);
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            setSettlePrintDiscount(safeVal);
                            const newRem = Math.max(0, baseRem - safeVal);
                            setSettlePrintCashReceived(newRem);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                            settlePrintDiscount === safeVal
                              ? 'bg-teal-600 text-white border-teal-600 font-black'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        const baseRem = settlingPrintOrder.remainingAmount ?? (settlingPrintOrder.totalAmount - settlingPrintOrder.downPayment);
                        if (isOwner) {
                          setSettlePrintDiscount(baseRem);
                          setSettlePrintCashReceived(0);
                        } else {
                          alert('Pelunasan Rp 0 (Diskon 100%) hanya diizinkan untuk OWNER yang sedang bertugas!');
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-black border transition cursor-pointer flex items-center gap-1 ${
                        settlePrintDiscount === (settlingPrintOrder.remainingAmount ?? (settlingPrintOrder.totalAmount - settlingPrintOrder.downPayment))
                          ? 'bg-amber-400 text-slate-950 border-amber-400 font-black'
                          : isOwner
                          ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                          : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                      }`}
                    >
                      <span>👑 100% Sisa Rp 0</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                    <span className="text-slate-600 font-medium">Sisa Wajib Bayar:</span>
                    <span className="font-mono font-black text-sm text-slate-900">
                      {Math.max(
                        0,
                        (settlingPrintOrder.remainingAmount ?? (settlingPrintOrder.totalAmount - settlingPrintOrder.downPayment)) -
                          settlePrintDiscount
                      ) === 0 ? (
                        <span className="text-amber-700 font-black">Rp 0 (GRATIS OWNER)</span>
                      ) : (
                        `Rp ${Math.max(
                          0,
                          (settlingPrintOrder.remainingAmount ?? (settlingPrintOrder.totalAmount - settlingPrintOrder.downPayment)) -
                            settlePrintDiscount
                        ).toLocaleString('id-ID')}`
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Metode Pembayaran Pelunasan:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'tunai', label: 'Tunai', icon: Banknote, color: 'emerald' },
                    { id: 'qris', label: 'QRIS', icon: QrCode, color: 'blue' },
                    { id: 'hutang', label: 'Kasbon / Hutang', icon: Receipt, color: 'rose' },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = settlePrintMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSettlePrintMethod(m.id as any);
                          const rem = settlingPrintOrder.remainingAmount ?? (settlingPrintOrder.totalAmount - settlingPrintOrder.downPayment);
                          if (m.id === 'tunai' && settlePrintCashReceived < rem) {
                            setSettlePrintCashReceived(rem);
                          }
                        }}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer text-xs font-bold ${
                          isSelected
                            ? m.id === 'hutang'
                              ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-400/40 shadow-xs'
                              : m.id === 'qris'
                              ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-400/40 shadow-xs'
                              : 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-400/40 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Method specific fields */}
              {settlePrintMethod === 'tunai' && (
                <div className="space-y-2 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Uang Diterima:</span>
                    <span className="text-[11px] text-slate-500">Pas / Lebih</span>
                  </div>
                  <input
                    type="number"
                    min={settlingPrintOrder.remainingAmount ?? (settlingPrintOrder.totalAmount - settlingPrintOrder.downPayment)}
                    step="any"
                    value={settlePrintCashReceived || ''}
                    onChange={(e) => setSettlePrintCashReceived(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-mono font-black text-sm text-right text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Masukkan nominal uang tunai..."
                  />
                  <div className="flex items-center justify-between pt-1 text-xs font-bold">
                    <span className="text-slate-600">Kembalian:</span>
                    <span className="font-mono text-sm text-emerald-700">
                      Rp {Math.max(0, settlePrintCashReceived - (settlingPrintOrder.remainingAmount ?? (settlingPrintOrder.totalAmount - settlingPrintOrder.downPayment))).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              {settlePrintMethod === 'qris' && (
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1.5 text-xs text-blue-900">
                  <div className="flex items-center gap-2 font-bold text-blue-950">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span>Pembayaran QRIS Dinamis</span>
                  </div>
                  <p className="text-[11px] text-blue-800">
                    Arahkan pelanggan untuk scan QRIS toko sebesar <b className="font-mono">Rp {(settlingPrintOrder.remainingAmount ?? (settlingPrintOrder.totalAmount - settlingPrintOrder.downPayment)).toLocaleString('id-ID')}</b>. Pastikan notifikasi dana masuk telah diterima.
                  </p>
                </div>
              )}

              {settlePrintMethod === 'hutang' && (
                <div className="space-y-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Sisa Tagihan Masuk ke Kasbon / Buku Hutang</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    Pelanggan membawa pulang hasil cetak. Tagihan sebesar <b className="font-mono font-bold">Rp {(settlingPrintOrder.remainingAmount ?? (settlingPrintOrder.totalAmount - settlingPrintOrder.downPayment)).toLocaleString('id-ID')}</b> akan otomatis tersimpan di menu <b>Hutang & Retur</b>.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                        Jatuh Tempo:
                      </label>
                      <input
                        type="date"
                        value={settlePrintDueDate}
                        onChange={(e) => setSettlePrintDueDate(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                        No. WhatsApp / HP:
                      </label>
                      <input
                        type="text"
                        value={settlePrintPhone}
                        onChange={(e) => setSettlePrintPhone(e.target.value)}
                        placeholder="0812..."
                        className="w-full px-2 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                      Catatan / Keterangan:
                    </label>
                    <input
                      type="text"
                      value={settlePrintNote}
                      onChange={(e) => setSettlePrintNote(e.target.value)}
                      placeholder="Cth: Janji bayar hari Sabtu"
                      className="w-full px-2 py-1.5 bg-white border border-rose-300 rounded-lg text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSettlingPrintOrder(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSettlePrintOrder}
                className={`px-5 py-2 text-xs font-extrabold rounded-xl shadow-md transition cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                  Math.max(
                    0,
                    (settlingPrintOrder.remainingAmount ?? (settlingPrintOrder.totalAmount - settlingPrintOrder.downPayment)) -
                      settlePrintDiscount
                  ) === 0 && isOwner
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 ring-2 ring-amber-400/50 hover:brightness-105'
                    : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-200" />
                <span>
                  {Math.max(
                    0,
                    (settlingPrintOrder.remainingAmount ?? (settlingPrintOrder.totalAmount - settlingPrintOrder.downPayment)) -
                      settlePrintDiscount
                  ) === 0 && isOwner
                    ? '🎁 Pelunasan Rp 0 & Serahkan (Owner Gratis)'
                    : 'Konfirmasi Pelunasan & Serahkan'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
