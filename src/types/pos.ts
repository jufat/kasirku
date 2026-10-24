export type ProductCategory = string;

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  hpp: number; // Harga Pokok Penjualan
  price: number; // Harga Jual
  stock: number;
  minStock: number;
  unit: string;
  image?: string;
  barcode?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  subtotal: number;
}

export type PaymentMethod = 'tunai' | 'qris' | 'transfer' | 'hutang';

export interface POSTransaction {
  id: string;
  invoiceNo: string;
  date: string;
  cashier: string;
  customerName: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashTendered: number;
  changeAmount: number;
  type: 'pos_penjualan';
  note?: string;
}

export type AgencyType =
  | 'transfer_bank'
  | 'tarik_tunai'
  | 'setor_tunai'
  | 'ewallet'
  | 'briva_va';

export interface AgencyTransaction {
  id: string;
  refNo: string;
  date: string;
  type: AgencyType;
  provider: string; // BCA, BRI, Mandiri, BNI, DANA, GoPay, OVO, ShopeePay, etc.
  targetNumber: string; // No Rekening / No HP / No VA
  customerName: string;
  customerPhone?: string;
  nominal: number;
  bankAdminFee: number;
  counterFee: number; // Laba Jasa Konter Ju-Fat Cell
  totalCustomerPaid: number;
  paymentMethod: 'tunai' | 'transfer';
  status: 'sukses' | 'pending' | 'gagal';
  note?: string;
}

export type AtmMiniType =
  | 'tarik_tunai_atm'
  | 'transfer_atm'
  | 'topup_ewallet_atm'
  | 'mbanking_atm'
  | 'qris_atm'
  | 'cek_saldo_atm';

export interface AtmMiniTransaction {
  id: string;
  terminalId: string;
  traceNo: string;
  approvalCode: string;
  date: string;
  type: AtmMiniType;
  bankName: string;
  cardType: 'GPN' | 'Mastercard' | 'Visa' | 'BCA Card' | 'QRIS' | 'M-Banking';
  cardNumberMasked: string;
  customerName: string;
  targetAccountOrPhone?: string;
  nominal: number;
  adminEdcFee: number;
  counterFee: number;
  totalDebited: number;
  cashHandedOrReceived: number;
  status: 'sukses' | 'gagal';
  note?: string;
}

export type PPOBCategory = 'pulsa' | 'data' | 'pln' | 'bpjs' | 'pdam' | 'tagihan';

export interface PPOBPackage {
  id: string;
  category: PPOBCategory;
  provider: string; // e.g. Telkomsel, Indosat, XL, Axis, Tri, Smartfren, PLN, Tagihan
  name: string;
  hpp: number;
  price: number;
  desc?: string;
}

export interface PPOBTransaction {
  id: string;
  refNo: string;
  date: string;
  category: PPOBCategory;
  provider: string;
  targetNumber: string;
  packageName: string;
  hpp: number;
  sellingPrice: number;
  profit: number;
  customerName: string;
  paymentMethod: 'tunai' | 'qris';
  status: 'sukses' | 'proses';
}

export type ServiceStatus = 'antrean' | 'proses' | 'selesai' | 'diambil';

export interface ServiceTicket {
  id: string; // e.g. SRV-2026-001
  dateIn: string;
  dateCompleted?: string;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  imeiOrSn?: string;
  problemDescription: string;
  status: ServiceStatus;
  sparepartCost: number;
  laborFee: number;
  downPayment: number;
  totalCost: number;
  technicianName: string;
  warrantyDays: number;
  technicianNote?: string;
}

export type CashMutationCategory =
  | 'penjualan_pos'
  | 'jasa_transfer'
  | 'pulsa_ppob'
  | 'service_hp'
  | 'operasional_keluar'
  | 'belanja_stok'
  | 'piutang_masuk'
  | 'setor_bank'
  | 'modal_shift'
  | 'lain_lain';

export interface CashMutation {
  id: string;
  timestamp: string;
  type: 'masuk' | 'keluar';
  category: CashMutationCategory;
  description: string;
  amount: number;
  paymentMethod: 'tunai' | 'non_tunai';
  runningCashBalance: number;
  recordedBy: string;
}

export interface DebtRecord {
  id: string;
  invoiceOrRef: string;
  date: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'belum_lunas' | 'cicilan' | 'lunas';
  note?: string;
}

export interface ReturnRecord {
  id: string;
  returNo: string;
  date: string;
  productName: string;
  sku: string;
  supplierName: string;
  quantity: number;
  unitHpp: number;
  reason: string;
  status: 'menunggu_supplier' | 'diganti_unit' | 'refund_dana';
}

export interface ShiftState {
  shiftNumber: number;
  shiftName: string;
  cashierName: string;
  cashierEmail: string;
  role: 'owner' | 'kasir';
  startTime: string;
  startingCash: number; // Kas Awal di Laci
  isOpen: boolean;
}

export interface StoreProfile {
  name: string;
  subtitle: string;
  address: string;
  phone: string;
  receiptFooter: string;
  logo?: string; // Base64 data URL or image URL
  isDemoMode: boolean; // true = Demo Mode with mock data, false = Live Production Mode
}

