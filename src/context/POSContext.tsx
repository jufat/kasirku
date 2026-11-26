import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Product,
  CartItem,
  CartItemType,
  CartItemMetadata,
  POSTransaction,
  AgencyTransaction,
  AtmMiniTransaction,
  AtmMiniType,
  PPOBTransaction,
  PPOBCategory,
  ServiceTicket,
  CashMutation,
  DebtRecord,
  ReturnRecord,
  ShiftState,
  ProductCategory,
  PaymentMethod,
  PPOBPackage,
  StoreProfile,
  PrintOrder,
  PrintOrderItem,
  PrintOrderStatus,
  PrintServiceItem,
  SyncTransactionEvent,
  CashierSlot,
  CashierProfile,
  ShiftRecord,
} from '../types/pos';
import * as XLSX from 'xlsx';
import {
  INITIAL_PRODUCTS,
  INITIAL_MUTATIONS,
  INITIAL_AGENCY_TXS,
  INITIAL_ATM_MINI_TXS,
  INITIAL_SERVICES,
  INITIAL_DEBTS,
  INITIAL_RETURNS,
  INITIAL_SHIFT,
  INITIAL_SHIFT_HISTORY,
  INITIAL_CATEGORIES,
  INITIAL_PPOB_PACKAGES,
  INITIAL_STORE_PROFILE,
  INITIAL_PRINT_ORDERS,
  PRINT_PRICE_LIST,
  DEFAULT_CASHIER_PROFILES,
} from '../data/initialData';
import {
  normalizeProductRecord,
  computeStockValuation,
  StockValuationAudit,
  findMatchingProductIndex,
  mergeProductRecords,
  deduplicateProducts,
} from '../utils/stockValuation';
import {
  calculateTieredPricing,
  serializePriceTiersText,
} from '../utils/tieredPricing';
import {
  AutoCaptureSettings,
  DEFAULT_AUTO_CAPTURE_SETTINGS,
  PendingAutoCaptureItem,
  AutoRecordedLogItem,
  normalizeWebhookStoreKey,
  computeReceiptFingerprint,
  looksLikeTransactionReceipt,
  parseIncomingCaptureToPending,
} from '../utils/autoCaptureEngine';
import { ParsedAtmMiniItem, ParsedPPOBItem } from '../utils/receiptTextParser';

interface POSContextType {
  // Navigation & Role
  activeTab: string;
  setActiveTab: (tab: string) => void;
  shift: ShiftState;
  setShift: React.Dispatch<React.SetStateAction<ShiftState>>;
  cashierProfiles: Record<CashierSlot, CashierProfile>;
  updateCashierProfile: (slot: CashierSlot, name: string) => void;
  switchCashierRole: (slot: CashierSlot, customName?: string, isSwapped?: boolean) => void;
  toggleRole: () => void;

  // Store Profile, Logo & Production / Demo Mode
  storeProfile: StoreProfile;
  updateStoreProfile: (profile: Partial<StoreProfile>) => void;
  exitDemoMode: (option: 'keep_products' | 'clear_all') => void;
  enterDemoMode: () => void;
  lastSavedTime: string;

  // Products & Cart
  products: Product[];
  transactions: POSTransaction[];
  selectedCategory: ProductCategory;
  setSelectedCategory: (cat: ProductCategory) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  cart: CartItem[];
  addToCart: (product: Product, addQty?: number) => void;
  addPPOBToCart: (
    pkg: { name: string; price: number; hpp: number; category: PPOBCategory; provider: string; desc?: string },
    targetNumber: string,
    customerName?: string,
    period?: string,
    adminFee?: number
  ) => void;
  addPrintItemToCart: (
    item: PrintOrderItem,
    customerName?: string,
    customerPhone?: string,
    fileOrNote?: string
  ) => void;
  addPrintOrderToCart: (
    items: PrintOrderItem[],
    customerName?: string,
    customerPhone?: string,
    fileOrNote?: string
  ) => void;
  addServiceToCart: (ticket: ServiceTicket, overrideRemaining?: number) => boolean;
  addAtmMiniToCart: (payload: {
    type: AtmMiniType;
    bankName: string;
    cardType: AtmMiniTransaction['cardType'];
    cardNumberMasked: string;
    customerName: string;
    nominal: number;
    adminEdcFee: number;
    counterFee: number;
    targetAccountOrPhone?: string;
    note?: string;
  }) => void;
  addCustomCartItem: (item: {
    name: string;
    price: number;
    hpp: number;
    quantity?: number;
    categoryName?: string;
    itemType?: CartItemType;
    metadata?: CartItemMetadata;
  }) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTotalCount: number;
  isMasterCartModalOpen: boolean;
  setIsMasterCartModalOpen: (open: boolean) => void;

  // Checkout & Auto-Journaling
  checkoutPOS: (
    paymentMethod: PaymentMethod,
    cashTendered: number,
    customerName: string,
    discountAmount: number,
    taxPercent: number,
    note?: string,
    customerPhone?: string,
    dueDate?: string,
    isPartialPayment?: boolean,
    paidAmount?: number
  ) => POSTransaction;

  // Agency
  agencyTransactions: AgencyTransaction[];
  recordAgencyTransaction: (
    type: AgencyTransaction['type'],
    provider: string,
    targetNumber: string,
    customerName: string,
    nominal: number,
    bankAdminFee: number,
    counterFee: number,
    note?: string
  ) => AgencyTransaction;

  // ATM Mini (EDC)
  atmMiniTransactions: AtmMiniTransaction[];
  recordAtmMiniTransaction: (
    type: AtmMiniTransaction['type'],
    bankName: string,
    cardType: AtmMiniTransaction['cardType'],
    cardNumberMasked: string,
    customerName: string,
    nominal: number,
    adminEdcFee: number,
    counterFee: number,
    targetAccountOrPhone?: string,
    note?: string,
    paymentMethod?: 'tunai' | 'qris' | 'hutang',
    customerPhone?: string,
    dueDate?: string,
    adminDeductionType?: 'tambah_transfer' | 'potong_tunai' | 'tunai_konter',
    discount?: number,
    paidAmount?: number,
    options?: { suppressReceiptModal?: boolean; cashBalanceOffset?: number }
  ) => AtmMiniTransaction;

  // PPOB
  ppobPackages: PPOBPackage[];
  addPPOBPackage: (pkg: Omit<PPOBPackage, 'id'>) => PPOBPackage;
  updatePPOBPackage: (pkg: PPOBPackage) => void;
  deletePPOBPackage: (id: string) => void;
  ppobTransactions: PPOBTransaction[];
  recordPPOBTransaction: (
    category: PPOBTransaction['category'],
    provider: string,
    targetNumber: string,
    packageName: string,
    hpp: number,
    sellingPrice: number,
    customerName: string,
    paymentMethod?: 'tunai' | 'qris' | 'hutang',
    customerPhone?: string,
    dueDate?: string,
    note?: string,
    discount?: number,
    options?: { suppressReceiptModal?: boolean; cashBalanceOffset?: number }
  ) => PPOBTransaction;
  updatePPOBTransaction: (tx: PPOBTransaction) => void;
  deletePPOBTransaction: (id: string) => void;
  revertAtmMiniTransaction: (id: string) => boolean;
  revertPPOBTransaction: (id: string) => boolean;

  // Service HP
  services: ServiceTicket[];
  addServiceTicket: (
    ticket: Omit<ServiceTicket, 'id' | 'dateIn'>,
    paymentMethod?: 'tunai' | 'qris' | 'hutang',
    dueDate?: string
  ) => ServiceTicket;
  updateServiceStatus: (
    id: string,
    newStatus: ServiceTicket['status'],
    paymentMethod?: 'tunai' | 'qris' | 'hutang',
    dueDate?: string,
    customerPhone?: string,
    note?: string,
    partialPaidAmount?: number
  ) => void;
  updateServiceTicket: (
    id: string,
    updates: {
      problemDescription?: string;
      sparepartCost: number;
      laborFee: number;
      discount?: number;
      technicianNote?: string;
      warrantyDays?: number;
      revisionReason?: string;
    }
  ) => ServiceTicket | null;
  deleteServiceTicket: (id: string) => void;

  // Percetakan & Fotokopi
  printOrders: PrintOrder[];
  addPrintOrder: (order: Omit<PrintOrder, 'id' | 'date'>, dueDate?: string) => PrintOrder;
  updatePrintOrderStatus: (
    id: string,
    newStatus: PrintOrderStatus,
    paymentMethod?: 'tunai' | 'qris' | 'hutang',
    dueDate?: string,
    customerPhone?: string,
    note?: string,
    partialPaidAmount?: number
  ) => void;
  deletePrintOrder: (id: string) => void;
  printServices: PrintServiceItem[];
  addPrintService: (service: Omit<PrintServiceItem, 'id'>) => PrintServiceItem;
  updatePrintService: (service: PrintServiceItem) => void;
  deletePrintService: (id: string) => void;
  resetPrintServices: () => void;

  // Cash Ledger & Auto-Journal
  mutations: CashMutation[];
  addCashMutation: (
    type: 'masuk' | 'keluar',
    category: CashMutation['category'],
    description: string,
    amount: number,
    paymentMethod?: 'tunai' | 'non_tunai'
  ) => void;
  drawerCashBalance: number;
  updateStartingCash: (amount: number) => void;
  adjustDrawerCash: (targetBalance: number, note?: string) => void;
  exportCashMutationCSV: () => void;

  // Digital Operational Balance (Bank & E-Wallet) & Real-Time Sync Event
  digitalBalance: number;
  updateDigitalBalance: (amount: number) => void;
  lastSyncEvent: SyncTransactionEvent | null;
  clearLastSyncEvent: () => void;

  // Debts & Returns
  debts: DebtRecord[];
  payDebt: (debtId: string, payAmount: number, discountAmount?: number) => void;
  addDebt: (debt: Omit<DebtRecord, 'id' | 'remainingAmount' | 'status'>) => void;
  returns: ReturnRecord[];
  updateReturnStatus: (id: string, newStatus: ReturnRecord['status']) => void;
  addReturnRecord: (ret: Omit<ReturnRecord, 'id' | 'returNo' | 'date'>) => void;

  // Product Catalog Management
  addProduct: (
    newProd: Omit<Product, 'id'>,
    options?: { hppMode?: 'weighted' | 'latest' }
  ) => {
    product: Product;
    merged: boolean;
    addedStock: number;
    assetHppDelta: number;
    revenueDelta: number;
    nextTotalAssetHpp: number;
    nextTotalRevenue: number;
  };
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  restockProduct: (
    id: string,
    addQty: number,
    newHpp?: number,
    options?: { newPrice?: number; hppMode?: 'weighted' | 'latest' }
  ) => void;
  recalculateProductCatalog: () => StockValuationAudit;
  deduplicateTwinProducts: () => { removedDuplicateCount: number; mergedNames: string[] };

  // Categories & Excel Operations
  categories: string[];
  addCategory: (categoryName: string) => boolean;
  deleteCategory: (categoryName: string) => void;
  importProductsFromExcel: (newProds: Omit<Product, 'id'>[]) => {
    totalRows: number;
    addedCount: number;
    mergedCount: number;
    totalUnitsAdded: number;
    assetHppDelta: number;
    revenueDelta: number;
  };
  exportProductsToExcel: () => void;
  downloadExcelTemplate: () => void;

  // Receipts & Modals
  receiptData:
    | POSTransaction
    | AgencyTransaction
    | ServiceTicket
    | AtmMiniTransaction
    | PPOBTransaction
    | PrintOrder
    | null;
  isReceiptModalOpen: boolean;
  openReceipt: (
    data:
      | POSTransaction
      | AgencyTransaction
      | ServiceTicket
      | AtmMiniTransaction
      | PPOBTransaction
      | PrintOrder
  ) => void;
  closeReceipt: () => void;
  isShiftModalOpen: boolean;
  setIsShiftModalOpen: (open: boolean) => void;
  isCashMutationModalOpen: boolean;
  setIsCashMutationModalOpen: (open: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  isBottomNavVisible: boolean;
  setIsBottomNavVisible: React.Dispatch<React.SetStateAction<boolean>>;
  toggleBottomNav: () => void;

  // Shift Drawer Closing, History & Standard Drawer Cash Setting
  standardDrawerCash: number;
  setStandardDrawerCash: (amount: number) => void;
  shiftHistory: ShiftRecord[];
  closeShiftDrawer: (
    actualCash: number,
    note?: string,
    depositOptions?: {
      depositAmount: number;
      depositRecipient: string;
      remainingCashForDrawer: number;
    },
    closeType?: 'tutup_toko' | 'serah_terima'
  ) => {
    systemCash: number;
    actualCash: number;
    difference: number;
    depositAmount?: number;
    remainingCash?: number;
  };
  openNewShift: (
    startingCash: number,
    cashierName: string,
    slot?: CashierSlot,
    shiftTitle?: string,
    isSwapped?: boolean,
    customStartTime?: string
  ) => void;

  // System Database
  exportBackupJSON: () => void;
  importBackupJSON: (jsonStr: string) => boolean;
  resetAllDemoData: () => void;

  // PC & HP Data Sync
  syncCode: string;
  setSyncCode: (code: string) => void;
  isSyncModalOpen: boolean;
  setIsSyncModalOpen: (open: boolean) => void;
  isSyncing: boolean;
  lastSyncTime: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncMessage: string;
  isAutoSyncEnabled: boolean;
  generateNewSyncCode: () => Promise<{ success: boolean; code?: string; message?: string }>;
  pushDataToCloud: (targetCode?: string) => Promise<{ success: boolean; message: string }>;
  pullDataFromCloud: (targetCode: string) => Promise<{ success: boolean; message: string; data?: any }>;
  disconnectSync: () => void;
  toggleAutoSync: (enabled: boolean) => void;

  // Auto-Capture & Mode Kilat (Anti-Terlewat PPOB & ATM Mini)
  autoCaptureSettings: AutoCaptureSettings;
  updateAutoCaptureSettings: (patch: Partial<AutoCaptureSettings>) => void;
  pendingAutoCaptures: PendingAutoCaptureItem[];
  autoRecordedLogs: AutoRecordedLogItem[];
  latestAutoCaptureToast: AutoRecordedLogItem | null;
  dismissLatestAutoCaptureToast: () => void;
  isAutoCaptureModalOpen: boolean;
  setIsAutoCaptureModalOpen: (open: boolean) => void;
  clipboardStatus: 'idle' | 'ready' | 'denied' | 'unsupported';
  checkClipboardNow: (preferredDomain?: 'atm_mini' | 'ppob') => Promise<{
    status: 'recorded' | 'queued' | 'duplicate' | 'ignored' | 'empty' | 'denied';
    message: string;
  }>;
  processIncomingCaptureText: (
    rawText: string,
    source: 'clipboard' | 'paste' | 'webhook',
    options?: {
      preferredDomain?: 'atm_mini' | 'ppob';
      serverId?: string;
      receivedAt?: string;
      forceQueueOnly?: boolean;
    }
  ) => {
    status: 'recorded' | 'queued' | 'duplicate' | 'ignored';
    message: string;
    recordedCount?: number;
  };
  commitPendingAutoCapture: (pendingId: string, openReceiptOnSingle?: boolean) => number;
  dismissPendingAutoCapture: (pendingId: string) => void;
  undoAutoRecordedLog: (logId: string) => boolean;
  clearAutoRecordedLogs: () => void;
  recordRushLogEntry: (entry: Omit<AutoRecordedLogItem, 'id' | 'recordedAt'>) => AutoRecordedLogItem;
  testWebhookAutoCapture: (sampleType: 'atm_mini' | 'ppob') => Promise<{ success: boolean; message: string }>;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load states with localStorage caching
  const [activeTab, setActiveTab] = useState<string>('kasir');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('jufat_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('jufat_products');
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const deduped = deduplicateProducts(parsed);
          if (deduped.removedDuplicateCount > 0) {
            try {
              localStorage.setItem('jufat_products', JSON.stringify(deduped.products));
            } catch {
              // ignore storage errors
            }
          }
          return deduped.products;
        }
      }
    } catch {
      // ignore corrupted storage
    }
    return INITIAL_PRODUCTS;
  });

  const [cart, setCart] = useState<CartItem[]>([]);

  const [transactions, setTransactions] = useState<POSTransaction[]>(() => {
    const saved = localStorage.getItem('jufat_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [agencyTransactions, setAgencyTransactions] = useState<AgencyTransaction[]>(() => {
    const saved = localStorage.getItem('jufat_agency_txs');
    return saved ? JSON.parse(saved) : INITIAL_AGENCY_TXS;
  });

  const [atmMiniTransactions, setAtmMiniTransactions] = useState<AtmMiniTransaction[]>(() => {
    const saved = localStorage.getItem('jufat_atm_mini_txs');
    return saved ? JSON.parse(saved) : INITIAL_ATM_MINI_TXS;
  });

  const [ppobPackages, setPpobPackages] = useState<PPOBPackage[]>(() => {
    const saved = localStorage.getItem('jufat_ppob_packages');
    if (!saved) return INITIAL_PPOB_PACKAGES;
    try {
      const parsed: PPOBPackage[] = JSON.parse(saved);
      let merged = [...parsed];
      let needsSave = false;

      const hasGame = merged.some((p) => p.category === 'game');
      if (!hasGame) {
        const gamePackages = INITIAL_PPOB_PACKAGES.filter((p) => p.category === 'game');
        merged = [...merged, ...gamePackages];
        needsSave = true;
      }

      const hasPlnBulanan = merged.some((p) => p.category === 'pln_bulanan');
      if (!hasPlnBulanan) {
        const plnBulananPackages = INITIAL_PPOB_PACKAGES.filter((p) => p.category === 'pln_bulanan');
        merged = [...merged, ...plnBulananPackages];
        needsSave = true;
      }

      const hasWifi = merged.some((p) => p.category === 'wifi');
      if (!hasWifi) {
        const wifiPackages = INITIAL_PPOB_PACKAGES.filter((p) => p.category === 'wifi');
        merged = [...merged, ...wifiPackages];
        needsSave = true;
      }

      if (needsSave) {
        try {
          localStorage.setItem('jufat_ppob_packages', JSON.stringify(merged));
        } catch {
          // ignore
        }
      }
      return merged;
    } catch {
      return INITIAL_PPOB_PACKAGES;
    }
  });

  const [ppobTransactions, setPpobTransactions] = useState<PPOBTransaction[]>(() => {
    const saved = localStorage.getItem('jufat_ppob_txs');
    return saved ? JSON.parse(saved) : [];
  });

  const [services, setServices] = useState<ServiceTicket[]>(() => {
    const saved = localStorage.getItem('jufat_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [printOrders, setPrintOrders] = useState<PrintOrder[]>(() => {
    const saved = localStorage.getItem('jufat_print_orders');
    return saved ? JSON.parse(saved) : INITIAL_PRINT_ORDERS;
  });

  const [printServices, setPrintServices] = useState<PrintServiceItem[]>(() => {
    try {
      const saved = localStorage.getItem('jufat_print_services');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return PRINT_PRICE_LIST;
  });

  const [mutations, setMutations] = useState<CashMutation[]>(() => {
    const saved = localStorage.getItem('jufat_mutations');
    if (saved) {
      try {
        const parsed: CashMutation[] = JSON.parse(saved);
        // Migrasi data warisan: pastikan uang transfer tunai dicatat penuh (pokok + admin) bukan hanya adminnya
        const upgraded = parsed.map((m) => {
          if (m.id === 'mut-003' && m.amount === 5000) {
            return {
              ...m,
              description: 'Terima Tunai Transfer BRI [TRX-AG-8801] (Bpk. Sugeng) - Nominal Rp 1.500.000 + Admin/Jasa Rp 7.500',
              amount: 1507500,
              runningCashBalance: 2052500,
            };
          }
          return m;
        });
        return upgraded;
      } catch {
        return INITIAL_MUTATIONS;
      }
    }
    return INITIAL_MUTATIONS;
  });

  const [debts, setDebts] = useState<DebtRecord[]>(() => {
    const saved = localStorage.getItem('jufat_debts');
    return saved ? JSON.parse(saved) : INITIAL_DEBTS;
  });

  const [returns, setReturns] = useState<ReturnRecord[]>(() => {
    const saved = localStorage.getItem('jufat_returns');
    return saved ? JSON.parse(saved) : INITIAL_RETURNS;
  });

  const [cashierProfiles, setCashierProfiles] = useState<Record<CashierSlot, CashierProfile>>(() => {
    try {
      const saved = localStorage.getItem('jufat_cashier_profiles');
      if (saved) {
        return { ...DEFAULT_CASHIER_PROFILES, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CASHIER_PROFILES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('jufat_cashier_profiles', JSON.stringify(cashierProfiles));
    } catch (e) {
      console.error(e);
    }
  }, [cashierProfiles]);

  const [shift, setShift] = useState<ShiftState>(() => {
    try {
      const saved = localStorage.getItem('jufat_shift');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.cashierSlot) {
          parsed.cashierSlot = parsed.role === 'owner' ? 'owner' : 'kasir_1';
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SHIFT;
  });

  const [shiftHistory, setShiftHistory] = useState<ShiftRecord[]>(() => {
    try {
      const saved = localStorage.getItem('jufat_shift_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_SHIFT_HISTORY;
  });

  useEffect(() => {
    try {
      localStorage.setItem('jufat_shift_history', JSON.stringify(shiftHistory));
    } catch {
      // ignore
    }
  }, [shiftHistory]);

  // Uang Laci yang Telah Ditentukan (Standard Drawer Cash - Default Rp 500.000)
  const [standardDrawerCash, setStandardDrawerCashState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('jufat_standard_drawer_cash');
      if (saved) {
        const val = Number(saved);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch {
      // ignore
    }
    return 500000;
  });

  const setStandardDrawerCash = (amount: number) => {
    const val = Math.max(0, amount);
    setStandardDrawerCashState(val);
    try {
      localStorage.setItem('jufat_standard_drawer_cash', val.toString());
    } catch {
      // ignore
    }
  };

  const [storeProfile, setStoreProfile] = useState<StoreProfile>(() => {
    try {
      const saved = localStorage.getItem('jufat_store_profile');
      if (saved) {
        const parsed: StoreProfile = JSON.parse(saved);
        if (!parsed.logo || parsed.logo === '') {
          parsed.logo = '/assets/aistudio/logo_f5879a0f.png';
          try {
            localStorage.setItem('jufat_store_profile', JSON.stringify(parsed));
          } catch {
            // ignore
          }
        }
        return parsed;
      }
      return INITIAL_STORE_PROFILE;
    } catch {
      return INITIAL_STORE_PROFILE;
    }
  });

  const [lastSavedTime, setLastSavedTime] = useState<string>('Tersimpan Aman');

  // Modal triggers
  const [receiptData, setReceiptData] = useState<
    | POSTransaction
    | AgencyTransaction
    | ServiceTicket
    | AtmMiniTransaction
    | PPOBTransaction
    | PrintOrder
    | null
  >(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isCashMutationModalOpen, setIsCashMutationModalOpen] = useState(false);
  const [isMasterCartModalOpen, setIsMasterCartModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isBottomNavVisible, setIsBottomNavVisible] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('jufat_bottom_nav_visible');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('jufat_bottom_nav_visible', JSON.stringify(isBottomNavVisible));
    } catch (e) {
      console.error(e);
    }
  }, [isBottomNavVisible]);

  const toggleBottomNav = () => setIsBottomNavVisible((prev) => !prev);

  // Data Sync State (PC & HP Sync)
  const [syncCode, setSyncCode] = useState<string>(() => {
    return localStorage.getItem('jufat_sync_code') || '';
  });
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('jufat_last_sync_time') || '';
  });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('jufat_auto_sync') === 'true';
  });

  // Sync back to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('jufat_store_profile', JSON.stringify(storeProfile));
      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(now);
    } catch (err) {
      console.error('Error saving store profile:', err);
    }
  }, [storeProfile]);
  useEffect(() => {
    localStorage.setItem('jufat_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('jufat_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('jufat_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('jufat_agency_txs', JSON.stringify(agencyTransactions));
  }, [agencyTransactions]);

  useEffect(() => {
    localStorage.setItem('jufat_atm_mini_txs', JSON.stringify(atmMiniTransactions));
  }, [atmMiniTransactions]);

  useEffect(() => {
    localStorage.setItem('jufat_ppob_packages', JSON.stringify(ppobPackages));
  }, [ppobPackages]);

  useEffect(() => {
    localStorage.setItem('jufat_ppob_txs', JSON.stringify(ppobTransactions));
  }, [ppobTransactions]);

  useEffect(() => {
    localStorage.setItem('jufat_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('jufat_print_orders', JSON.stringify(printOrders));
  }, [printOrders]);

  useEffect(() => {
    try {
      localStorage.setItem('jufat_print_services', JSON.stringify(printServices));
    } catch (e) {
      console.error(e);
    }
  }, [printServices]);

  useEffect(() => {
    localStorage.setItem('jufat_mutations', JSON.stringify(mutations));
  }, [mutations]);

  useEffect(() => {
    localStorage.setItem('jufat_debts', JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem('jufat_returns', JSON.stringify(returns));
  }, [returns]);

  useEffect(() => {
    localStorage.setItem('jufat_shift', JSON.stringify(shift));
  }, [shift]);

  // Current physical cash drawer balance derived from cash mutations
  const drawerCashBalance = mutations.reduce((acc, curr) => {
    if (curr.paymentMethod === 'tunai') {
      return curr.type === 'masuk' ? acc + curr.amount : acc - curr.amount;
    }
    return acc;
  }, 0);

  // Digital Operational Balance (Bank & E-Wallet)
  const [digitalBalance, setDigitalBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('jufat_digital_operational_balance');
      return saved ? Number(saved) : 8750000;
    } catch {
      return 8750000;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('jufat_digital_operational_balance', digitalBalance.toString());
    } catch (e) {
      console.error(e);
    }
  }, [digitalBalance]);

  const updateDigitalBalance = (newAmount: number) => {
    const valid = Math.max(0, newAmount);
    setDigitalBalance(valid);
  };

  // Inter-Module Real-Time Sync Event State
  const [lastSyncEvent, setLastSyncEvent] = useState<SyncTransactionEvent | null>(() => {
    try {
      const saved = localStorage.getItem('jufat_last_sync_event');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (lastSyncEvent) {
      try {
        localStorage.setItem('jufat_last_sync_event', JSON.stringify(lastSyncEvent));
      } catch (e) {
        console.error(e);
      }
    }
  }, [lastSyncEvent]);

  const clearLastSyncEvent = () => setLastSyncEvent(null);

  // Cart helper calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const cartTotalCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const addToCart = (product: Product, addQty: number = 1) => {
    if (product.stock <= 0) return;
    const cleanAdd = Math.max(1, Math.round(Number(addQty) || 1));

    setCart((prev) => {
      const existing = prev.find(
        (item) => (!item.itemType || item.itemType === 'produk') && item.product.id === product.id
      );
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        const nextQty = Math.min(product.stock, existing.quantity + cleanAdd);
        const pricing = calculateTieredPricing(product, nextQty);
        return prev.map((item) =>
          (!item.itemType || item.itemType === 'produk') && item.product.id === product.id
            ? {
                ...item,
                product,
                quantity: nextQty,
                subtotal: Math.max(0, pricing.totalPrice - item.discount),
                metadata: {
                  ...item.metadata,
                  pricingSummary: pricing.hasWholesaleApplied ? pricing.summaryLabel : undefined,
                  pricingSavings: pricing.savings > 0 ? pricing.savings : undefined,
                  retailSubtotal: pricing.retailTotal,
                },
              }
            : item
        );
      }

      const initialQty = Math.min(product.stock, cleanAdd);
      const pricing = calculateTieredPricing(product, initialQty);
      return [
        ...prev,
        {
          id: product.id,
          itemType: 'produk',
          product,
          quantity: initialQty,
          discount: 0,
          subtotal: pricing.totalPrice,
          metadata: pricing.hasWholesaleApplied || pricing.savings > 0
            ? {
                pricingSummary: pricing.hasWholesaleApplied ? pricing.summaryLabel : undefined,
                pricingSavings: pricing.savings > 0 ? pricing.savings : undefined,
                retailSubtotal: pricing.retailTotal,
              }
            : undefined,
        },
      ];
    });
  };

  const addPPOBToCart = (
    pkg: { name: string; price: number; hpp: number; category: PPOBCategory; provider: string; desc?: string },
    targetNumber: string,
    customerName?: string,
    period?: string,
    adminFee?: number
  ) => {
    const itemId = `ppob-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const categoryLabel =
      pkg.category === 'pln_bulanan'
        ? 'Listrik Bulanan (PLN)'
        : pkg.category === 'wifi'
        ? 'Tagihan Wifi / Net'
        : pkg.category === 'pln'
        ? 'Token PLN'
        : pkg.category === 'game'
        ? 'Top Up Game'
        : `PPOB ${pkg.category.toUpperCase()}`;

    const virtualProduct: Product = {
      id: itemId,
      sku: `PPOB-${pkg.provider.slice(0, 4).toUpperCase().replace(/\s+/g, '')}`,
      name: `${pkg.name} (${targetNumber})`,
      category: categoryLabel,
      hpp: pkg.hpp,
      price: pkg.price,
      stock: 9999,
      minStock: 0,
      unit: 'trx',
    };

    const cartItem: CartItem = {
      id: itemId,
      itemType: 'ppob',
      product: virtualProduct,
      quantity: 1,
      discount: 0,
      subtotal: pkg.price,
      metadata: {
        ppobCategory: pkg.category,
        targetNumber,
        provider: pkg.provider,
        packageName: pkg.name,
        period,
        adminFee,
        rawPrice: pkg.price,
        customerName: customerName?.trim() || undefined,
      },
    };

    setCart((prev) => [...prev, cartItem]);
  };

  const addPrintItemToCart = (
    item: PrintOrderItem,
    customerName?: string,
    customerPhone?: string,
    fileOrNote?: string
  ) => {
    const itemId = `prn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const virtualProduct: Product = {
      id: itemId,
      sku: `PRN-${item.category.slice(0, 4).toUpperCase()}`,
      name: `${item.serviceName}${item.specNote ? ` [${item.specNote}]` : ''}`,
      category: 'Percetakan & Copy',
      hpp: Math.round(item.pricePerUnit * 0.4), // estimasi hpp bahan 40%
      price: item.pricePerUnit,
      stock: 9999,
      minStock: 0,
      unit: item.unit || 'lbr',
    };

    const cartItem: CartItem = {
      id: itemId,
      itemType: 'percetakan',
      product: virtualProduct,
      quantity: item.quantity,
      discount: 0,
      subtotal: item.subtotal,
      metadata: {
        printCategory: item.category,
        specNote: item.specNote,
        unit: item.unit,
        customerName: customerName?.trim() || undefined,
        customerPhone: customerPhone?.trim() || undefined,
        fileOrNote: fileOrNote?.trim() || undefined,
      },
    };

    setCart((prev) => [...prev, cartItem]);
  };

  const addPrintOrderToCart = (
    items: PrintOrderItem[],
    customerName?: string,
    customerPhone?: string,
    fileOrNote?: string
  ) => {
    items.forEach((item, idx) => {
      const itemId = `prn-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
      const virtualProduct: Product = {
        id: itemId,
        sku: `PRN-${item.category.slice(0, 4).toUpperCase()}`,
        name: `${item.serviceName}${item.specNote ? ` [${item.specNote}]` : ''}`,
        category: 'Percetakan & Copy',
        hpp: Math.round(item.pricePerUnit * 0.4),
        price: item.pricePerUnit,
        stock: 9999,
        minStock: 0,
        unit: item.unit || 'lbr',
      };

      const cartItem: CartItem = {
        id: itemId,
        itemType: 'percetakan',
        product: virtualProduct,
        quantity: item.quantity,
        discount: 0,
        subtotal: item.subtotal,
        metadata: {
          printCategory: item.category,
          specNote: item.specNote,
          unit: item.unit,
          customerName: customerName?.trim() || undefined,
          customerPhone: customerPhone?.trim() || undefined,
          fileOrNote: fileOrNote?.trim() || undefined,
        },
      };

      setCart((prev) => [...prev, cartItem]);
    });
  };

  const addServiceToCart = (ticket: ServiceTicket, overrideRemaining?: number): boolean => {
    const alreadyInCart = cart.some(
      (c) => c.itemType === 'service' && c.metadata?.serviceTicketId === ticket.id
    );
    if (alreadyInCart) return false;

    const remaining =
      overrideRemaining !== undefined
        ? Math.max(0, overrideRemaining)
        : Math.max(0, ticket.totalCost - ticket.downPayment);

    const itemId = `srv-${ticket.id}`;
    const virtualProduct: Product = {
      id: itemId,
      sku: ticket.id,
      name: `Pelunasan Servis ${ticket.deviceModel} (${ticket.id})`,
      category: 'Service HP',
      hpp: Math.max(0, ticket.sparepartCost - ticket.downPayment),
      price: remaining,
      stock: 1,
      minStock: 0,
      unit: 'unit',
    };

    const cartItem: CartItem = {
      id: itemId,
      itemType: 'service',
      product: virtualProduct,
      quantity: 1,
      discount: 0,
      subtotal: remaining,
      metadata: {
        serviceTicketId: ticket.id,
        deviceModel: ticket.deviceModel,
        technicianName: ticket.technicianName,
        problemDescription: ticket.problemDescription,
        originalTotalCost: ticket.totalCost,
        downPaymentPaid: ticket.downPayment,
        customerName: ticket.customerName,
        customerPhone: ticket.customerPhone,
      },
    };

    setCart((prev) => [...prev, cartItem]);
    return true;
  };

  const addAtmMiniToCart = (payload: {
    type: AtmMiniType;
    bankName: string;
    cardType: AtmMiniTransaction['cardType'];
    cardNumberMasked: string;
    customerName: string;
    nominal: number;
    adminEdcFee: number;
    counterFee: number;
    targetAccountOrPhone?: string;
    note?: string;
  }) => {
    const itemId = `atm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const totalDebited = payload.nominal + payload.adminEdcFee + payload.counterFee;
    const typeLabel =
      payload.type === 'transfer_atm'
        ? payload.cardType === 'QRIS' || payload.cardType === 'M-Banking'
          ? 'Transfer Bank'
          : 'Transfer EDC'
        : payload.type === 'topup_ewallet_atm'
        ? 'Top Up E-Wallet'
        : payload.type === 'mbanking_atm'
        ? 'Mobile Banking'
        : payload.type === 'qris_atm'
        ? 'Pembayaran QRIS'
        : 'Layanan ATM Mini';

    const virtualProduct: Product = {
      id: itemId,
      sku: `ATM-${payload.cardType.slice(0, 4).toUpperCase()}`,
      name: `${typeLabel} ${payload.bankName}${
        payload.targetAccountOrPhone ? ` (${payload.targetAccountOrPhone})` : ''
      }`,
      category: 'ATM Mini & Transfer',
      hpp: payload.nominal + payload.adminEdcFee,
      price: totalDebited,
      stock: 1,
      minStock: 0,
      unit: 'trx',
    };

    const cartItem: CartItem = {
      id: itemId,
      itemType: 'atm_mini',
      product: virtualProduct,
      quantity: 1,
      discount: 0,
      subtotal: totalDebited,
      metadata: {
        atmType: payload.type,
        bankName: payload.bankName,
        cardType: payload.cardType,
        cardNumberMasked: payload.cardNumberMasked,
        customerName: payload.customerName?.trim() || undefined,
        nominal: payload.nominal,
        adminEdcFee: payload.adminEdcFee,
        counterFee: payload.counterFee,
        targetAccountOrPhone: payload.targetAccountOrPhone,
        note: payload.note,
      },
    };

    setCart((prev) => [...prev, cartItem]);
  };

  const addCustomCartItem = (item: {
    name: string;
    price: number;
    hpp: number;
    quantity?: number;
    categoryName?: string;
    itemType?: CartItemType;
    metadata?: CartItemMetadata;
  }) => {
    const itemId = `cst-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const qty = item.quantity || 1;
    const virtualProduct: Product = {
      id: itemId,
      sku: `ITEM-${Math.floor(100 + Math.random() * 900)}`,
      name: item.name,
      category: item.categoryName || 'Item Tambahan',
      hpp: item.hpp,
      price: item.price,
      stock: 9999,
      minStock: 0,
      unit: 'item',
    };

    const cartItem: CartItem = {
      id: itemId,
      itemType: item.itemType || 'produk',
      product: virtualProduct,
      quantity: qty,
      discount: 0,
      subtotal: item.price * qty,
      metadata: item.metadata,
    };

    setCart((prev) => [...prev, cartItem]);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const cleanQty = Math.max(1, Math.round(Number(quantity) || 1));
    setCart((prev) =>
      prev.map((item) => {
        const matches = (item.id && item.id === productId) || item.product.id === productId;
        if (!matches) return item;

        const isRetailProduct = !item.itemType || item.itemType === 'produk';
        const latestProduct = isRetailProduct
          ? products.find((p) => p.id === item.product.id) || item.product
          : item.product;
        const maxStock = isRetailProduct ? latestProduct.stock : 9999;
        const clampedQty = Math.min(cleanQty, maxStock);

        if (isRetailProduct) {
          const pricing = calculateTieredPricing(latestProduct, clampedQty);
          return {
            ...item,
            product: latestProduct,
            quantity: clampedQty,
            subtotal: Math.max(0, pricing.totalPrice - item.discount),
            metadata: {
              ...item.metadata,
              pricingSummary: pricing.hasWholesaleApplied ? pricing.summaryLabel : undefined,
              pricingSavings: pricing.savings > 0 ? pricing.savings : undefined,
              retailSubtotal: pricing.retailTotal,
            },
          };
        }

        return {
          ...item,
          quantity: clampedQty,
          subtotal: Math.max(0, clampedQty * item.product.price - item.discount),
        };
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) =>
      prev.filter((item) => {
        const matches = (item.id && item.id === productId) || item.product.id === productId;
        return !matches;
      })
    );
  };

  const clearCart = () => setCart([]);

  // Auto-Journaling Function for Cashier POS / Master Cart
  const checkoutPOS = (
    paymentMethod: PaymentMethod,
    cashTendered: number,
    customerName: string,
    discountAmount: number,
    taxPercent: number,
    note?: string,
    customerPhone?: string,
    dueDate?: string,
    isPartialPayment?: boolean,
    paidAmount?: number
  ): POSTransaction => {
    const subtotal = cartSubtotal;
    const taxAmount = Math.round((subtotal - discountAmount) * (taxPercent / 100));
    const finalTotal = Math.max(0, subtotal - discountAmount + taxAmount);
    const invoiceNo = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // Deteksi Pembayaran Parsial / Bayar Sebagian (Sisa Masuk Kasbon)
    const isPartial = Boolean(
      isPartialPayment ||
      (paymentMethod === 'tunai' && cashTendered > 0 && cashTendered < finalTotal) ||
      (paymentMethod === 'hutang' && paidAmount !== undefined && paidAmount > 0)
    );

    const actualPaid = isPartial
      ? (paidAmount !== undefined ? Math.min(paidAmount, finalTotal) : Math.min(cashTendered, finalTotal))
      : (paymentMethod === 'hutang' ? 0 : finalTotal);

    const remainingDebt = isPartial
      ? Math.max(0, finalTotal - actualPaid)
      : (paymentMethod === 'hutang' ? finalTotal : 0);

    const changeAmount = (!isPartial && paymentMethod === 'tunai')
      ? Math.max(0, cashTendered - finalTotal)
      : 0;

    const resolvedPaymentMethod: PaymentMethod = isPartial ? 'hutang' : paymentMethod;
    const isMasterCart = cart.some((c) => c.itemType && c.itemType !== 'produk');

    const newTx: POSTransaction = {
      id: `tx-${Date.now()}`,
      invoiceNo,
      date: new Date().toLocaleString('id-ID'),
      cashier: shift.cashierName,
      customerName: customerName.trim() || (remainingDebt > 0 ? 'Pelanggan Kasbon' : 'Pelanggan Umum'),
      items: [...cart],
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: finalTotal,
      paymentMethod: resolvedPaymentMethod,
      cashTendered: isPartial ? actualPaid : (paymentMethod === 'tunai' ? cashTendered : finalTotal),
      changeAmount,
      paidAmount: isPartial ? actualPaid : undefined,
      remainingDebt: remainingDebt > 0 ? remainingDebt : undefined,
      isPartialPayment: isPartial && remainingDebt > 0,
      dueDate: remainingDebt > 0 ? (dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)) : undefined,
      type: 'pos_penjualan',
      note,
      isMasterCart,
    };

    // 1. Reduce Stock for regular retail products only (aggregate qty across cart lines)
    setProducts((prev) =>
      prev.map((p) => {
        const totalBoughtQty = cart
          .filter((c) => c.product.id === p.id && (!c.itemType || c.itemType === 'produk'))
          .reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);
        if (totalBoughtQty > 0) {
          return { ...p, stock: Math.max(0, (Number(p.stock) || 0) - totalBoughtQty) };
        }
        return p;
      })
    );

    const netRatio = subtotal > 0 ? Math.max(0, subtotal - discountAmount) / subtotal : 1;

    // 1b. Auto-journal PPOB items to PPOB transactions log
    const ppobItems = cart.filter((c) => c.itemType === 'ppob');
    if (ppobItems.length > 0) {
      const newPpobTxs: PPOBTransaction[] = ppobItems.map((c, idx) => {
        const netSelling = finalTotal === 0 ? 0 : Math.round(c.subtotal * netRatio);
        const hppTotal = c.product.hpp * c.quantity;
        return {
          id: `ppob-cart-${Date.now()}-${idx}`,
          refNo: `PPOB-${invoiceNo.replace('INV-', '')}-${idx + 1}`,
          date: new Date().toLocaleString('id-ID'),
          category: c.metadata?.ppobCategory || 'tagihan',
          provider: c.metadata?.provider || 'PPOB',
          targetNumber: c.metadata?.targetNumber || '-',
          packageName: c.metadata?.packageName || c.product.name,
          hpp: hppTotal,
          sellingPrice: netSelling,
          profit: netSelling - hppTotal,
          customerName: customerName.trim() || c.metadata?.customerName || 'Pelanggan PPOB',
          paymentMethod: (resolvedPaymentMethod === 'hutang' ? 'hutang' : resolvedPaymentMethod === 'qris' ? 'qris' : 'tunai'),
          status: 'sukses',
          discount: Math.max(0, c.subtotal - netSelling) || c.discount,
          masterCartInvoiceNo: invoiceNo,
        };
      });
      setPpobTransactions((prev) => [...newPpobTxs, ...prev]);
    }

    // 1c. Auto-journal Percetakan items to Print Orders log
    const printItems = cart.filter((c) => c.itemType === 'percetakan');
    if (printItems.length > 0) {
      const printRawSum = printItems.reduce((acc, c) => acc + c.subtotal, 0);
      const printNetTotal = finalTotal === 0 ? 0 : Math.round(printRawSum * netRatio);
      const printFileNote =
        printItems.find((p) => p.metadata?.fileOrNote)?.metadata?.fileOrNote ||
        note ||
        `Order via Keranjang Besar (${invoiceNo})`;
      const newPrintOrder: PrintOrder = {
        id: `PRT-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleString('id-ID'),
        customerName: customerName.trim() || printItems.find((p) => p.metadata?.customerName)?.metadata?.customerName || 'Pelanggan Umum',
        customerPhone: customerPhone?.trim() || printItems.find((p) => p.metadata?.customerPhone)?.metadata?.customerPhone || '-',
        items: printItems.map((c) => ({
          id: c.product.id,
          serviceName: c.product.name,
          category: (c.metadata?.printCategory as any) || 'print_dokumen',
          quantity: c.quantity,
          unit: c.metadata?.unit || c.product.unit || 'pcs',
          pricePerUnit: c.product.price,
          subtotal: c.subtotal,
          specNote: c.metadata?.specNote,
        })),
        totalAmount: printNetTotal,
        discount: Math.max(0, printRawSum - printNetTotal) || undefined,
        downPayment: resolvedPaymentMethod === 'hutang' ? 0 : printNetTotal,
        remainingAmount: resolvedPaymentMethod === 'hutang' ? printNetTotal : 0,
        paymentMethod: resolvedPaymentMethod,
        status: 'selesai',
        fileOrNote: printFileNote,
        dueDate: dueDate,
        masterCartInvoiceNo: invoiceNo,
      };
      setPrintOrders((prev) => [newPrintOrder, ...prev]);
    }

    // 1d. Auto-journal Service HP items (mark ticket as 'diambil')
    const serviceItems = cart.filter((c) => c.itemType === 'service' && c.metadata?.serviceTicketId);
    if (serviceItems.length > 0) {
      const serviceTicketIds = new Set(serviceItems.map((s) => s.metadata?.serviceTicketId));
      setServices((prev) =>
        prev.map((s) => {
          if (!serviceTicketIds.has(s.id)) return s;
          const matchingCart = serviceItems.find((ci) => ci.metadata?.serviceTicketId === s.id);
          const origRemaining = Math.max(0, s.totalCost - s.downPayment);
          const itemNet =
            finalTotal === 0
              ? 0
              : Math.round((matchingCart?.subtotal ?? origRemaining) * netRatio);
          const extraDiscount = Math.max(0, origRemaining - itemNet);
          return {
            ...s,
            status: 'diambil',
            dateCompleted: new Date().toLocaleString('id-ID'),
            discount: extraDiscount > 0 ? (s.discount || 0) + extraDiscount : s.discount,
            totalCost: s.downPayment + itemNet,
            downPayment: s.downPayment + itemNet,
            remainingDebt: 0,
            masterCartInvoiceNo: invoiceNo,
            technicianNote: `${s.technicianNote ? s.technicianNote + ' · ' : ''}Diambil via Keranjang Besar ${invoiceNo}`.trim(),
          };
        })
      );
    }

    // 1e. Auto-journal ATM Mini items & deduct digital bank balance for outbound transfers
    const atmItems = cart.filter((c) => c.itemType === 'atm_mini' && c.metadata);
    if (atmItems.length > 0) {
      const newAtmTxs: AtmMiniTransaction[] = atmItems.map((c, idx) => {
        const m = c.metadata!;
        const nominalVal = m.nominal || 0;
        const adminVal = m.adminEdcFee || 0;
        const itemNet = finalTotal === 0 ? 0 : Math.round(c.subtotal * netRatio);
        const effCounter = finalTotal === 0 ? 0 : Math.max(0, itemNet - nominalVal - adminVal);
        const traceNo = `TRC-${Math.floor(100000 + Math.random() * 900000)}`;
        return {
          id: `atm-cart-${Date.now()}-${idx}`,
          terminalId:
            m.cardType === 'M-Banking' || m.cardType === 'E-Wallet' || m.cardType === 'QRIS'
              ? 'DIGI-JUFAT-01'
              : 'EDC-JUFAT-01',
          traceNo,
          approvalCode: `AP${Math.floor(100000 + Math.random() * 900000)}`,
          date: new Date().toLocaleString('id-ID'),
          type: m.atmType || 'transfer_atm',
          bankName: m.bankName || 'BRI',
          cardType: m.cardType || 'GPN',
          cardNumberMasked: m.cardNumberMasked || '-',
          customerName: customerName.trim() || m.customerName || 'Nasabah',
          targetAccountOrPhone: m.targetAccountOrPhone,
          nominal: nominalVal,
          adminEdcFee: adminVal,
          counterFee: effCounter,
          totalDebited: itemNet,
          cashHandedOrReceived: itemNet,
          paymentMethod: resolvedPaymentMethod === 'hutang' ? 'hutang' : resolvedPaymentMethod === 'qris' ? 'qris' : 'tunai',
          discount: Math.max(0, (m.counterFee || 0) - effCounter) || undefined,
          status: 'sukses',
          note: `${m.note ? m.note + ' · ' : ''}Via Keranjang Besar ${invoiceNo}`.trim(),
          masterCartInvoiceNo: invoiceNo,
        };
      });
      setAtmMiniTransactions((prev) => [...newAtmTxs, ...prev]);

      // Outbound transfer/topup reduces store's digital bank operational balance by nominal + bank admin
      const totalDigitalOut = atmItems.reduce(
        (sum, c) => sum + (c.metadata?.nominal || 0) + (c.metadata?.adminEdcFee || 0),
        0
      );
      if (totalDigitalOut > 0) {
        setDigitalBalance((prev) => Math.max(0, prev - totalDigitalOut));
      }
    }

    // 2. Auto-journal to Cash Ledger & Real-Time Sync
    const txPrefix = isMasterCart ? 'Penjualan Keranjang Besar' : 'Penjualan Kasir';
    const txSyncTitle = isMasterCart
      ? (isPartial ? 'Keranjang Besar (Bayar Sebagian DP)' : `Keranjang Besar (${cart.length} item)`)
      : (isPartial ? 'Kasir (Bayar Sebagian DP)' : `Penjualan Kasir (${cart.length} item)`);

    if (actualPaid > 0) {
      if (paymentMethod === 'tunai' || isPartial) {
        const newRunning = drawerCashBalance + actualPaid;
        const newMutation: CashMutation = {
          id: `mut-${Date.now()}`,
          timestamp: nowTime,
          type: 'masuk',
          category: 'penjualan_pos',
          description: isPartial
            ? `${txPrefix} (Bayar Sebagian) ${invoiceNo} (${cart.length} item) - Diterima Rp ${actualPaid.toLocaleString('id-ID')}, Sisa Kasbon Rp ${remainingDebt.toLocaleString('id-ID')}`
            : `${txPrefix} ${invoiceNo} (${cart.length} item: ${cart
                .map((i) => `${i.product.name.slice(0, 15)}..x${i.quantity}`)
                .join(', ')})`,
          amount: actualPaid,
          paymentMethod: 'tunai',
          runningCashBalance: newRunning,
          recordedBy: shift.cashierName,
        };
        setMutations((prev) => [newMutation, ...prev]);

        setLastSyncEvent({
          id: `sync-${Date.now()}`,
          timestamp: nowTime,
          source: 'kasir',
          actionTitle: txSyncTitle,
          customerName: customerName.trim() || 'Pelanggan',
          drawerCashDelta: actualPaid,
          digitalBalanceDelta: 0,
          note: `Struk ${invoiceNo} · Masuk Kas Fisik Laci +Rp ${actualPaid.toLocaleString('id-ID')}${remainingDebt > 0 ? ` (Sisa Kasbon Rp ${remainingDebt.toLocaleString('id-ID')})` : ''}`,
        });
      } else if (paymentMethod === 'qris' || paymentMethod === 'transfer') {
        const methodUpper = paymentMethod === 'qris' ? 'QRIS' : 'Transfer Bank';
        const newMutation: CashMutation = {
          id: `mut-${Date.now()}`,
          timestamp: nowTime,
          type: 'masuk',
          category: 'penjualan_pos',
          description: `${txPrefix} ${methodUpper} ${invoiceNo} (${cart.length} item)`,
          amount: actualPaid,
          paymentMethod: 'non_tunai',
          runningCashBalance: drawerCashBalance,
          recordedBy: shift.cashierName,
        };
        setMutations((prev) => [newMutation, ...prev]);
        setDigitalBalance((prev) => prev + actualPaid);

        setLastSyncEvent({
          id: `sync-${Date.now()}`,
          timestamp: nowTime,
          source: 'kasir',
          actionTitle: `${txPrefix} ${methodUpper} (${cart.length} item)`,
          customerName: customerName.trim() || 'Pelanggan Umum',
          drawerCashDelta: 0,
          digitalBalanceDelta: actualPaid,
          note: `Struk ${invoiceNo} · Masuk Saldo Digital ${methodUpper} +Rp ${actualPaid.toLocaleString('id-ID')}`,
        });
      }
    }

    // 3. If there is remaining debt (Kasbon / Hutang), record directly into Debt Ledger
    if (remainingDebt > 0) {
      const newDebt: DebtRecord = {
        id: `dbt-${Date.now()}`,
        invoiceOrRef: invoiceNo,
        date: new Date().toISOString().slice(0, 10),
        customerName: customerName.trim() || 'Pelanggan Kasbon',
        customerPhone: customerPhone?.trim() || '-',
        totalAmount: finalTotal,
        paidAmount: actualPaid,
        remainingAmount: remainingDebt,
        dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), // default 7 days
        status: actualPaid > 0 ? 'cicilan' : 'belum_lunas',
        note: note?.trim() || (actualPaid > 0
          ? `Kasbon Sisa ${txPrefix} ${invoiceNo} (Sudah bayar Rp ${actualPaid.toLocaleString('id-ID')})`
          : `Kasbon ${txPrefix} ${invoiceNo}`),
      };
      setDebts((prev) => [newDebt, ...prev]);

      if (actualPaid === 0) {
        setLastSyncEvent({
          id: `sync-${Date.now()}`,
          timestamp: nowTime,
          source: 'kasir',
          actionTitle: `Kasbon Penuh ${txPrefix} (${cart.length} item)`,
          customerName: customerName.trim() || 'Pelanggan Kasbon',
          drawerCashDelta: 0,
          digitalBalanceDelta: 0,
          note: `Struk ${invoiceNo} · Kasbon Rp ${finalTotal.toLocaleString('id-ID')} dicatat ke Buku Piutang`,
        });
      }
    }

    // 4. Save transaction
    setTransactions((prev) => [newTx, ...prev]);
    clearCart();

    // 5. Open thermal receipt modal
    setReceiptData(newTx);
    setIsReceiptModalOpen(true);

    return newTx;
  };

  // Agency Transfer auto-journaling
  const recordAgencyTransaction = (
    type: AgencyTransaction['type'],
    provider: string,
    targetNumber: string,
    customerName: string,
    nominal: number,
    bankAdminFee: number,
    counterFee: number,
    note?: string
  ): AgencyTransaction => {
    const refNo = `AG-${Date.now().toString().slice(-6)}`;
    const totalPaid = nominal + bankAdminFee + counterFee;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newAgTx: AgencyTransaction = {
      id: `ag-${Date.now()}`,
      refNo,
      date: new Date().toLocaleString('id-ID'),
      type,
      provider,
      targetNumber,
      customerName: customerName.trim() || 'Pelanggan Agen',
      nominal,
      bankAdminFee,
      counterFee,
      totalCustomerPaid: totalPaid,
      paymentMethod: 'tunai',
      status: 'sukses',
      note,
    };

    setAgencyTransactions((prev) => [newAgTx, ...prev]);

    // Uang masuk fisik ke laci kasir: catat seluruh nominal uang tunai yang diterima (pokok + admin/jasa)
    const newRunning = drawerCashBalance + totalPaid;
    const mutation: CashMutation = {
      id: `mut-${Date.now()}`,
      timestamp: nowTime,
      type: 'masuk',
      category: 'jasa_transfer',
      description: `Terima Tunai Agen ${type.replace('_', ' ').toUpperCase()} ${provider} [${refNo}] (${customerName}) - Nominal Rp ${nominal.toLocaleString('id-ID')} + Admin/Jasa Rp ${(bankAdminFee + counterFee).toLocaleString('id-ID')}`,
      amount: totalPaid,
      paymentMethod: 'tunai',
      runningCashBalance: newRunning,
      recordedBy: shift.cashierName,
    };
    setMutations((prev) => [mutation, ...prev]);

    // Real-Time Inter-Module Sync for Agency Transaction
    const digitalOut = nominal + bankAdminFee;
    setDigitalBalance((prev) => Math.max(0, prev - digitalOut));
    setLastSyncEvent({
      id: `sync-${Date.now()}`,
      timestamp: nowTime,
      source: 'atm_mini',
      actionTitle: `Agen ${type.replace('_', ' ').toUpperCase()} ${provider}`,
      customerName: customerName.trim() || 'Pelanggan Agen',
      drawerCashDelta: totalPaid,
      digitalBalanceDelta: -digitalOut,
      note: `Ref: ${refNo} · Terima Fisik Kas: +Rp ${totalPaid.toLocaleString('id-ID')} | Saldo Bank Berkurang: -Rp ${digitalOut.toLocaleString('id-ID')}`,
    });

    setReceiptData(newAgTx);
    setIsReceiptModalOpen(true);

    return newAgTx;
  };

  // Sequence counter for collision-free batch IDs
  const batchSeqRef = React.useRef(0);
  const nextSeq = () => {
    batchSeqRef.current = (batchSeqRef.current + 1) % 10000;
    return batchSeqRef.current;
  };

  // ATM Mini (EDC) auto-journaling
  const recordAtmMiniTransaction = (
    type: AtmMiniTransaction['type'],
    bankName: string,
    cardType: AtmMiniTransaction['cardType'],
    cardNumberMasked: string,
    customerName: string,
    nominal: number,
    adminEdcFee: number,
    counterFee: number,
    targetAccountOrPhone?: string,
    note?: string,
    paymentMethod: 'tunai' | 'qris' | 'hutang' = 'tunai',
    customerPhone?: string,
    dueDate?: string,
    adminDeductionType: 'tambah_transfer' | 'potong_tunai' | 'tunai_konter' = 'tambah_transfer',
    discount?: number,
    paidAmount?: number,
    options?: { suppressReceiptModal?: boolean; cashBalanceOffset?: number }
  ): AtmMiniTransaction => {
    const seq = nextSeq();
    const baseDrawerCash = drawerCashBalance + (options?.cashBalanceOffset ?? 0);
    const traceNo = Math.floor(100000 + Math.random() * 900000).toString();
    const approvalCode = `APPR-${Math.floor(100000 + Math.random() * 900000)}`;
    const totalAdmin = adminEdcFee + counterFee;
    const isPotongTunai = type === 'tarik_tunai_atm' && adminDeductionType === 'potong_tunai';
    const isTunaiKonter = type === 'tarik_tunai_atm' && adminDeductionType === 'tunai_konter';

    const totalDebited = isPotongTunai || isTunaiKonter ? nominal : nominal + totalAdmin;
    const cashHandedOrReceived =
      type === 'tarik_tunai_atm'
        ? (isPotongTunai ? Math.max(0, nominal - totalAdmin) : nominal)
        : totalDebited;

    const counterCollectionTarget = isTunaiKonter ? totalAdmin : totalDebited;
    const isPartial =
      paidAmount !== undefined && paidAmount > 0 && paidAmount < counterCollectionTarget;
    const actualPaid = isPartial
      ? paidAmount
      : paymentMethod === 'hutang'
      ? 0
      : counterCollectionTarget;
    const remainingDebt = isPartial
      ? Math.max(0, counterCollectionTarget - actualPaid)
      : paymentMethod === 'hutang'
      ? counterCollectionTarget
      : 0;

    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newTx: AtmMiniTransaction = {
      id: `atm-${Date.now()}-${seq}`,
      terminalId: 'EDC-JUFAT-01',
      traceNo,
      approvalCode,
      date: new Date().toLocaleString('id-ID'),
      type,
      bankName,
      cardType,
      cardNumberMasked,
      customerName: customerName.trim() || 'Nasabah EDC',
      targetAccountOrPhone,
      nominal,
      adminEdcFee,
      counterFee,
      totalDebited,
      cashHandedOrReceived,
      paymentMethod: isPartial ? 'hutang' : paymentMethod,
      paidAmount: isPartial ? actualPaid : undefined,
      remainingDebt: remainingDebt > 0 ? remainingDebt : undefined,
      isPartialPayment: isPartial && remainingDebt > 0,
      dueDate: remainingDebt > 0 ? (dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)) : undefined,
      adminDeductionType: type === 'tarik_tunai_atm' ? adminDeductionType : undefined,
      discount: discount && discount > 0 ? discount : undefined,
      status: 'sukses',
      note,
    };

    setAtmMiniTransactions((prev) => [newTx, ...prev]);

    // 1. If Kasbon (Hutang) or Partial Payment, record into Debt Ledger
    if (remainingDebt > 0) {
      const newDebt: DebtRecord = {
        id: `dbt-${Date.now()}-${seq}`,
        invoiceOrRef: `EDC-${traceNo}`,
        date: new Date().toISOString().slice(0, 10),
        customerName: customerName.trim() || 'Nasabah EDC',
        customerPhone: customerPhone?.trim() || targetAccountOrPhone || '-',
        totalAmount: counterCollectionTarget,
        paidAmount: actualPaid,
        remainingAmount: remainingDebt,
        dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        status: actualPaid > 0 ? 'cicilan' : 'belum_lunas',
        note: isTunaiKonter
          ? isPartial
            ? `Kasbon Sisa Admin Tarik Tunai [${bankName}] Ref:${traceNo} (Bayar Admin Tunai Rp ${actualPaid.toLocaleString('id-ID')})${note ? ' - ' + note : ''}`
            : `Kasbon Admin Tarik Tunai [${bankName}] Ref:${traceNo}${note ? ' - ' + note : ''}`
          : isPartial
          ? `Kasbon Sisa Mini ATM ${type.replace(/_/g, ' ').toUpperCase()} [${bankName}] Ref:${traceNo} (DP Rp ${actualPaid.toLocaleString('id-ID')})${note ? ' - ' + note : ''}`
          : `Kasbon Mini ATM ${type.replace(/_/g, ' ').toUpperCase()} [${bankName}] Ref:${traceNo}${note ? ' - ' + note : ''}`,
      };
      setDebts((prev) => [newDebt, ...prev]);
    }

    // 2. Auto-Journaling Kas Laci & Inter-Module Synchronization:
    if (type === 'tarik_tunai_atm') {
      const cashOutFromDrawer = cashHandedOrReceived;
      const channelLabel =
        cardType === 'E-Wallet' || cardType === 'M-Banking' || cardType === 'QRIS'
          ? cardType
          : 'EDC';

      const mutationKeluar: CashMutation = {
        id: `mut-${Date.now()}-${seq}-out`,
        timestamp: nowTime,
        type: 'keluar',
        category: 'jasa_transfer',
        description: isTunaiKonter
          ? `Tarik Tunai ${channelLabel} ${bankName} [${traceNo}] (${customerName}) - Diserahkan pokok Rp ${cashOutFromDrawer.toLocaleString('id-ID')} (Admin Rp ${totalAdmin.toLocaleString('id-ID')} bayar tunai di konter)`
          : isPotongTunai
          ? `Tarik Tunai ${channelLabel} ${bankName} [${traceNo}] (${customerName}) - Admin Rp ${totalAdmin.toLocaleString('id-ID')} dipotong tunai (Diserahkan Rp ${cashOutFromDrawer.toLocaleString('id-ID')})`
          : `Tarik Tunai ${channelLabel} ${bankName} [${traceNo}] (${customerName}) - Nasabah kirim Rp ${totalDebited.toLocaleString('id-ID')} (Diserahkan Rp ${cashOutFromDrawer.toLocaleString('id-ID')})`,
        amount: cashOutFromDrawer,
        paymentMethod: 'tunai',
        runningCashBalance: baseDrawerCash - cashOutFromDrawer,
        recordedBy: shift.cashierName,
      };

      if (isTunaiKonter) {
        if (paymentMethod === 'qris') {
          const mutationAdminNonTunai: CashMutation = {
            id: `mut-${Date.now()}-${seq}-fee`,
            timestamp: nowTime,
            type: 'masuk',
            category: 'jasa_transfer',
            description: `Admin Tarik Tunai ${channelLabel} ${bankName} [${traceNo}] via QRIS (${customerName})`,
            amount: totalAdmin,
            paymentMethod: 'non_tunai',
            runningCashBalance: baseDrawerCash - cashOutFromDrawer,
            recordedBy: shift.cashierName,
          };
          setMutations((prev) => [mutationKeluar, mutationAdminNonTunai, ...prev]);
          setDigitalBalance((prev) => prev + totalDebited + totalAdmin);

          setLastSyncEvent({
            id: `sync-${Date.now()}-${seq}`,
            timestamp: nowTime,
            source: 'atm_mini',
            actionTitle: `Tarik Tunai ${channelLabel} ${bankName} (Admin QRIS)`,
            customerName: customerName.trim() || 'Nasabah',
            drawerCashDelta: -cashOutFromDrawer,
            digitalBalanceDelta: totalDebited + totalAdmin,
            note: `Ref: ${traceNo} · Kas Laci: -Rp ${cashOutFromDrawer.toLocaleString('id-ID')} | Saldo Digital Bank: +Rp ${(totalDebited + totalAdmin).toLocaleString('id-ID')}`,
          });
        } else {
          const cashAdminMasukLaci = actualPaid;
          const mutationsToAdd: CashMutation[] = [];

          if (cashAdminMasukLaci > 0) {
            const mutationAdminTunaiMasuk: CashMutation = {
              id: `mut-${Date.now()}-${seq}-adm`,
              timestamp: nowTime,
              type: 'masuk',
              category: 'jasa_transfer',
              description: isPartial
                ? `Admin Tunai (Bayar Sebagian) Tarik Tunai ${channelLabel} ${bankName} [${traceNo}] (${customerName}) - Masuk Uang Laci Rp ${cashAdminMasukLaci.toLocaleString('id-ID')}, Sisa Kasbon Rp ${remainingDebt.toLocaleString('id-ID')}`
                : `Bayar Admin Tunai Tarik Tunai ${channelLabel} ${bankName} [${traceNo}] (${customerName}) - Masuk Uang Laci (EDC/App Rp ${adminEdcFee.toLocaleString('id-ID')} + Jasa Rp ${counterFee.toLocaleString('id-ID')})`,
              amount: cashAdminMasukLaci,
              paymentMethod: 'tunai',
              runningCashBalance: baseDrawerCash - cashOutFromDrawer + cashAdminMasukLaci,
              recordedBy: shift.cashierName,
            };
            mutationsToAdd.push(mutationAdminTunaiMasuk);
          }

          mutationsToAdd.push(mutationKeluar);
          setMutations((prev) => [...mutationsToAdd, ...prev]);
          setDigitalBalance((prev) => prev + totalDebited);

          const netDrawerDelta = cashAdminMasukLaci - cashOutFromDrawer;
          setLastSyncEvent({
            id: `sync-${Date.now()}-${seq}`,
            timestamp: nowTime,
            source: 'atm_mini',
            actionTitle: `Tarik Tunai ${channelLabel} ${bankName} (Admin Tunai Konter)`,
            customerName: customerName.trim() || 'Nasabah',
            drawerCashDelta: netDrawerDelta,
            digitalBalanceDelta: totalDebited,
            note:
              cashAdminMasukLaci > 0
                ? `Ref: ${traceNo} · Uang Tarikan: -Rp ${cashOutFromDrawer.toLocaleString('id-ID')} & Admin Masuk Laci: +Rp ${cashAdminMasukLaci.toLocaleString('id-ID')} (Net Laci ${netDrawerDelta >= 0 ? '+' : '-'}Rp ${Math.abs(netDrawerDelta).toLocaleString('id-ID')}) | Digital: +Rp ${totalDebited.toLocaleString('id-ID')}`
                : `Ref: ${traceNo} · Uang Tarikan: -Rp ${cashOutFromDrawer.toLocaleString('id-ID')} (Admin Kasbon Rp ${remainingDebt.toLocaleString('id-ID')}) | Digital: +Rp ${totalDebited.toLocaleString('id-ID')}`,
          });
        }
      } else {
        const mutationLaba: CashMutation = {
          id: `mut-${Date.now()}-${seq}-fee`,
          timestamp: nowTime,
          type: 'masuk',
          category: 'jasa_transfer',
          description: `Laba Jasa Tarik Tunai ${channelLabel} ${bankName} [${traceNo}] (${customerName})`,
          amount: counterFee,
          paymentMethod: 'non_tunai',
          runningCashBalance: baseDrawerCash - cashOutFromDrawer,
          recordedBy: shift.cashierName,
        };

        setMutations((prev) => [mutationKeluar, mutationLaba, ...prev]);
        setDigitalBalance((prev) => prev + totalDebited);

        setLastSyncEvent({
          id: `sync-${Date.now()}-${seq}`,
          timestamp: nowTime,
          source: 'atm_mini',
          actionTitle: `Tarik Tunai ${channelLabel} ${bankName}`,
          customerName: customerName.trim() || 'Nasabah EDC',
          drawerCashDelta: -cashOutFromDrawer,
          digitalBalanceDelta: totalDebited,
          note: `Ref: ${traceNo} · Kas Laci: -Rp ${cashOutFromDrawer.toLocaleString('id-ID')} | Saldo Digital Bank: +Rp ${totalDebited.toLocaleString('id-ID')}`,
        });
      }
    } else {
      const serviceName =
        type === 'transfer_atm'
          ? 'Transfer EDC'
          : type === 'topup_ewallet_atm'
          ? 'Top Up E-Wallet'
          : type === 'mbanking_atm'
          ? 'Mobile Banking'
          : type === 'qris_atm'
          ? 'Sistem QRIS'
          : 'Layanan EDC';

      if (paymentMethod === 'tunai' || (isPartial && actualPaid > 0)) {
        const fullCashReceived = actualPaid;
        const newRunning = baseDrawerCash + fullCashReceived;
        const mutation: CashMutation = {
          id: `mut-${Date.now()}-${seq}`,
          timestamp: nowTime,
          type: 'masuk',
          category: 'jasa_transfer',
          description: isPartial
            ? `Terima Tunai (Bayar Sebagian) ${serviceName} ${bankName} [${traceNo}] (${customerName}) - Diterima Rp ${actualPaid.toLocaleString('id-ID')}, Sisa Kasbon Rp ${remainingDebt.toLocaleString('id-ID')}`
            : `Terima Tunai ${serviceName} ${bankName} [${traceNo}] (${customerName}) - Nominal Rp ${nominal.toLocaleString('id-ID')} + Admin/Jasa Rp ${(adminEdcFee + counterFee).toLocaleString('id-ID')}`,
          amount: fullCashReceived,
          paymentMethod: 'tunai',
          runningCashBalance: newRunning,
          recordedBy: shift.cashierName,
        };
        setMutations((prev) => [mutation, ...prev]);

        const digitalOut = nominal + adminEdcFee;
        setDigitalBalance((prev) => Math.max(0, prev - digitalOut));

        setLastSyncEvent({
          id: `sync-${Date.now()}-${seq}`,
          timestamp: nowTime,
          source: 'atm_mini',
          actionTitle: `${serviceName} ${bankName}`,
          customerName: customerName.trim() || 'Nasabah EDC',
          drawerCashDelta: fullCashReceived,
          digitalBalanceDelta: -digitalOut,
          note: `Ref: ${traceNo} · Terima Tunai Laci: +Rp ${fullCashReceived.toLocaleString('id-ID')} | Saldo Bank Berkurang: -Rp ${digitalOut.toLocaleString('id-ID')}`,
        });
      } else if (paymentMethod === 'qris') {
        const mutation: CashMutation = {
          id: `mut-${Date.now()}-${seq}`,
          timestamp: nowTime,
          type: 'masuk',
          category: 'jasa_transfer',
          description: `Laba Jasa Mini ATM via QRIS ${serviceName} ${bankName} [${traceNo}] (${customerName})`,
          amount: counterFee,
          paymentMethod: 'non_tunai',
          runningCashBalance: baseDrawerCash,
          recordedBy: shift.cashierName,
        };
        setMutations((prev) => [mutation, ...prev]);
        setDigitalBalance((prev) => prev + counterFee);

        setLastSyncEvent({
          id: `sync-${Date.now()}-${seq}`,
          timestamp: nowTime,
          source: 'atm_mini',
          actionTitle: `${serviceName} ${bankName} (QRIS)`,
          customerName: customerName.trim() || 'Nasabah EDC',
          drawerCashDelta: 0,
          digitalBalanceDelta: counterFee,
          note: `Ref: ${traceNo} · Laba Jasa Non-Tunai Masuk Digital +Rp ${counterFee.toLocaleString('id-ID')}`,
        });
      }
    }

    if (!options?.suppressReceiptModal) {
      setReceiptData(newTx);
      setIsReceiptModalOpen(true);
    }

    return newTx;
  };

  // PPOB auto-journaling
  const recordPPOBTransaction = (
    category: PPOBTransaction['category'],
    provider: string,
    targetNumber: string,
    packageName: string,
    hpp: number,
    sellingPrice: number,
    customerName: string,
    paymentMethod: 'tunai' | 'qris' | 'hutang' = 'tunai',
    customerPhone?: string,
    dueDate?: string,
    note?: string,
    discount?: number,
    options?: { suppressReceiptModal?: boolean; cashBalanceOffset?: number }
  ): PPOBTransaction => {
    const seq = nextSeq();
    const baseDrawerCash = drawerCashBalance + (options?.cashBalanceOffset ?? 0);
    const refNo = `PPOB-${Date.now().toString().slice(-4)}${String(seq).padStart(2, '0')}`;
    const profit = sellingPrice - hpp;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newTx: PPOBTransaction = {
      id: `ppob-${Date.now()}-${seq}`,
      refNo,
      date: new Date().toLocaleString('id-ID'),
      category,
      provider,
      targetNumber,
      packageName,
      hpp,
      sellingPrice,
      discount: discount && discount > 0 ? discount : undefined,
      profit,
      customerName: customerName || 'Pelanggan PPOB',
      paymentMethod,
      status: 'sukses',
    };

    setPpobTransactions((prev) => [newTx, ...prev]);

    // 1. If Kasbon (Hutang), immediately add to Debt Ledger
    if (paymentMethod === 'hutang') {
      const newDebt: DebtRecord = {
        id: `dbt-${Date.now()}-${seq}`,
        invoiceOrRef: refNo,
        date: new Date().toISOString().slice(0, 10),
        customerName: customerName.trim() || 'Pelanggan PPOB',
        customerPhone: customerPhone?.trim() || targetNumber || '-',
        totalAmount: sellingPrice,
        paidAmount: 0,
        remainingAmount: sellingPrice,
        dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        status: 'belum_lunas',
        note: note?.trim() || `Kasbon PPOB ${category.toUpperCase()} ${provider} ${packageName} (${targetNumber})`,
      };
      setDebts((prev) => [newDebt, ...prev]);
    } else if (paymentMethod === 'tunai' && sellingPrice > 0) {
      // Auto-journal into Cash Harian
      const mutation: CashMutation = {
        id: `mut-${Date.now()}-${seq}`,
        timestamp: nowTime,
        type: 'masuk',
        category: 'pulsa_ppob',
        description: `Penjualan ${category.toUpperCase()} ${provider} ${packageName} [${refNo}] (${targetNumber})`,
        amount: sellingPrice,
        paymentMethod: 'tunai',
        runningCashBalance: baseDrawerCash + sellingPrice,
        recordedBy: shift.cashierName,
      };
      setMutations((prev) => [mutation, ...prev]);
    } else if (paymentMethod === 'qris' && sellingPrice > 0) {
      // QRIS
      const mutation: CashMutation = {
        id: `mut-${Date.now()}-${seq}`,
        timestamp: nowTime,
        type: 'masuk',
        category: 'pulsa_ppob',
        description: `Penjualan QRIS ${category.toUpperCase()} ${provider} ${packageName} [${refNo}] (${targetNumber})`,
        amount: sellingPrice,
        paymentMethod: 'non_tunai',
        runningCashBalance: baseDrawerCash,
        recordedBy: shift.cashierName,
      };
      setMutations((prev) => [mutation, ...prev]);
    }

    if (!options?.suppressReceiptModal) {
      setReceiptData(newTx);
      setIsReceiptModalOpen(true);
    }

    return newTx;
  };

  // PPOB Package Management
  const addPPOBPackage = (pkgData: Omit<PPOBPackage, 'id'>): PPOBPackage => {
    const newPkg: PPOBPackage = {
      ...pkgData,
      id: `pkg-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    };
    setPpobPackages((prev) => [...prev, newPkg]);
    return newPkg;
  };

  const updatePPOBPackage = (updatedPkg: PPOBPackage) => {
    setPpobPackages((prev) =>
      prev.map((p) => (p.id === updatedPkg.id ? updatedPkg : p))
    );
  };

  const deletePPOBPackage = (id: string) => {
    setPpobPackages((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePPOBTransaction = (updatedTx: PPOBTransaction) => {
    setPpobTransactions((prev) =>
      prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    );
  };

  const deletePPOBTransaction = (id: string) => {
    setPpobTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const revertPPOBTransaction = (id: string): boolean => {
    const target = ppobTransactions.find((t) => t.id === id);
    if (!target) return false;

    setPpobTransactions((prev) => prev.filter((t) => t.id !== id));
    setDebts((prev) => prev.filter((d) => d.invoiceOrRef !== target.refNo));
    setMutations((prev) =>
      prev.filter((m) => {
        if (m.category !== 'pulsa_ppob') return true;
        if (m.description.includes(`[${target.refNo}]`)) return false;
        // Fallback match for legacy PPOB records without [refNo]
        if (
          target.targetNumber &&
          m.description.includes(`(${target.targetNumber})`) &&
          m.amount === target.sellingPrice &&
          m.description.includes(target.packageName)
        ) {
          return false;
        }
        return true;
      })
    );
    return true;
  };

  const revertAtmMiniTransaction = (id: string): boolean => {
    const target = atmMiniTransactions.find((t) => t.id === id);
    if (!target) return false;

    setAtmMiniTransactions((prev) => prev.filter((t) => t.id !== id));
    setDebts((prev) => prev.filter((d) => d.invoiceOrRef !== `EDC-${target.traceNo}`));
    setMutations((prev) =>
      prev.filter((m) => !(m.category === 'jasa_transfer' && m.description.includes(`[${target.traceNo}]`)))
    );

    const totalAdmin = target.adminEdcFee + target.counterFee;
    const isTunaiKonter =
      target.type === 'tarik_tunai_atm' && target.adminDeductionType === 'tunai_konter';

    if (target.type === 'tarik_tunai_atm') {
      const revertDigital =
        target.totalDebited + (isTunaiKonter && target.paymentMethod === 'qris' ? totalAdmin : 0);
      setDigitalBalance((prev) => Math.max(0, prev - revertDigital));
    } else if (
      target.paymentMethod === 'tunai' ||
      (target.isPartialPayment && (target.paidAmount || 0) > 0)
    ) {
      const digitalOut = target.nominal + target.adminEdcFee;
      setDigitalBalance((prev) => prev + digitalOut);
    } else if (target.paymentMethod === 'qris') {
      setDigitalBalance((prev) => Math.max(0, prev - target.counterFee));
    }

    return true;
  };

  // Service HP Management
  const addServiceTicket = (
    ticketData: Omit<ServiceTicket, 'id' | 'dateIn'>,
    paymentMethod: 'tunai' | 'qris' | 'hutang' = 'tunai',
    dueDate?: string
  ): ServiceTicket => {
    const id = `SRV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newTicket: ServiceTicket = {
      ...ticketData,
      id,
      dateIn: new Date().toLocaleString('id-ID'),
    };

    setServices((prev) => [newTicket, ...prev]);

    // 1. If Kasbon from start, immediately record to Debt Ledger!
    if (paymentMethod === 'hutang') {
      const debtAmount = newTicket.totalCost - newTicket.downPayment;
      const newDebt: DebtRecord = {
        id: `dbt-${Date.now()}`,
        invoiceOrRef: id,
        date: new Date().toISOString().slice(0, 10),
        customerName: newTicket.customerName.trim() || 'Pelanggan Servis',
        customerPhone: newTicket.customerPhone || '-',
        totalAmount: newTicket.totalCost,
        paidAmount: newTicket.downPayment,
        remainingAmount: debtAmount,
        dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        status: newTicket.downPayment > 0 ? 'cicilan' : 'belum_lunas',
        note: `Kasbon Servis HP ${id} (${newTicket.deviceModel} - ${newTicket.problemDescription})`,
      };
      setDebts((prev) => [newDebt, ...prev]);
    }

    // 2. If down payment is given and not hutang, auto journal to Cash or Non-tunai
    if (newTicket.downPayment > 0 && paymentMethod !== 'hutang') {
      const mutation: CashMutation = {
        id: `mut-${Date.now()}`,
        timestamp: nowTime,
        type: 'masuk',
        category: 'service_hp',
        description: `DP Service ${id} (${newTicket.deviceModel} - ${newTicket.customerName})`,
        amount: newTicket.downPayment,
        paymentMethod: paymentMethod === 'tunai' ? 'tunai' : 'non_tunai',
        runningCashBalance:
          paymentMethod === 'tunai'
            ? drawerCashBalance + newTicket.downPayment
            : drawerCashBalance,
        recordedBy: shift.cashierName,
      };
      setMutations((prev) => [mutation, ...prev]);
    }

    setReceiptData(newTicket);
    setIsReceiptModalOpen(true);

    return newTicket;
  };

  const updateServiceStatus = (
    id: string,
    newStatus: ServiceTicket['status'],
    paymentMethod: 'tunai' | 'qris' | 'hutang' = 'tunai',
    dueDate?: string,
    customerPhone?: string,
    note?: string,
    partialPaidAmount?: number
  ) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const wasNotDiambil = s.status !== 'diambil';
          const isNowDiambil = newStatus === 'diambil';

          if (wasNotDiambil && isNowDiambil) {
            const remaining = Math.max(0, s.totalCost - s.downPayment);
            if (remaining > 0) {
              const nowTime = new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              });

              const isPartial = partialPaidAmount !== undefined && partialPaidAmount < remaining && partialPaidAmount >= 0;
              const actualPaid = isPartial ? partialPaidAmount : (paymentMethod === 'hutang' ? 0 : remaining);
              const debtRemaining = Math.max(0, remaining - actualPaid);

              // 1. Catat kas masuk jika ada nominal yang dibayar
              if (actualPaid > 0) {
                if (paymentMethod === 'tunai' || isPartial) {
                  const mutation: CashMutation = {
                    id: `mut-${Date.now()}`,
                    timestamp: nowTime,
                    type: 'masuk',
                    category: 'service_hp',
                    description: isPartial
                      ? `Pelunasan Servis Sebagian ${s.id} (${s.deviceModel} - ${s.customerName}) - Diterima Rp ${actualPaid.toLocaleString('id-ID')}, Sisa Kasbon Rp ${debtRemaining.toLocaleString('id-ID')}`
                      : `Pelunasan Service ${s.id} (${s.deviceModel} - ${s.customerName})`,
                    amount: actualPaid,
                    paymentMethod: 'tunai',
                    runningCashBalance: drawerCashBalance + actualPaid,
                    recordedBy: shift.cashierName,
                  };
                  setMutations((prevMut) => [mutation, ...prevMut]);
                } else {
                  // QRIS
                  const mutation: CashMutation = {
                    id: `mut-${Date.now()}`,
                    timestamp: nowTime,
                    type: 'masuk',
                    category: 'service_hp',
                    description: `Pelunasan QRIS Service ${s.id} (${s.deviceModel} - ${s.customerName})`,
                    amount: actualPaid,
                    paymentMethod: 'non_tunai',
                    runningCashBalance: drawerCashBalance,
                    recordedBy: shift.cashierName,
                  };
                  setMutations((prevMut) => [mutation, ...prevMut]);
                  setDigitalBalance((p) => p + actualPaid);
                }
              }

              // 2. Jika ada sisa belum lunas, otomatis masuk kasbon / hutang
              if (debtRemaining > 0) {
                const newDebt: DebtRecord = {
                  id: `dbt-${Date.now()}`,
                  invoiceOrRef: s.id,
                  date: new Date().toISOString().slice(0, 10),
                  customerName: s.customerName.trim() || 'Pelanggan Servis',
                  customerPhone: customerPhone?.trim() || s.customerPhone || '-',
                  totalAmount: s.totalCost,
                  paidAmount: s.downPayment + actualPaid,
                  remainingAmount: debtRemaining,
                  dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
                  status: (s.downPayment + actualPaid) > 0 ? 'cicilan' : 'belum_lunas',
                  note: isPartial
                    ? `Kasbon Sisa Pelunasan Servis ${s.id} (${s.deviceModel})${note ? ' - ' + note : ''}`
                    : `Kasbon Pelunasan Servis HP ${s.id} (${s.deviceModel} - ${s.problemDescription})${note ? ' - ' + note : ''}`,
                };
                setDebts((prevDebts) => [newDebt, ...prevDebts]);
              }

              return {
                ...s,
                status: newStatus,
                downPayment: s.downPayment + actualPaid,
                remainingDebt: debtRemaining > 0 ? debtRemaining : undefined,
                isPartialPayment: debtRemaining > 0 && (s.downPayment + actualPaid) > 0,
                dueDate: debtRemaining > 0 ? (dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)) : undefined,
                dateCompleted: new Date().toLocaleString('id-ID'),
              };
            }
          }

          return {
            ...s,
            status: newStatus,
            dateCompleted:
              newStatus === 'selesai' || newStatus === 'diambil'
                ? new Date().toLocaleString('id-ID')
                : s.dateCompleted,
          };
        }
        return s;
      })
    );
  };

  const updateServiceTicket = (
    id: string,
    updates: {
      problemDescription?: string;
      sparepartCost: number;
      laborFee: number;
      discount?: number;
      technicianNote?: string;
      warrantyDays?: number;
      revisionReason?: string;
    }
  ): ServiceTicket | null => {
    const target = services.find((s) => s.id === id);
    if (!target) return null;

    const cleanSparepart = Math.max(0, Math.round(Number(updates.sparepartCost) || 0));
    const cleanLabor = Math.max(0, Math.round(Number(updates.laborFee) || 0));
    const cleanDiscount = Math.max(0, Math.round(Number(updates.discount) || 0));
    const nextTotal = Math.max(0, cleanSparepart + cleanLabor - cleanDiscount);
    const nextProblem =
      updates.problemDescription !== undefined
        ? updates.problemDescription.trim() || target.problemDescription
        : target.problemDescription;
    const nextNote =
      updates.technicianNote !== undefined ? updates.technicianNote.trim() : target.technicianNote;
    const nextWarranty =
      updates.warrantyDays !== undefined
        ? Math.max(0, Math.round(Number(updates.warrantyDays) || 0))
        : target.warrantyDays;

    const costChanged = nextTotal !== target.totalCost;
    const initialEstimatedCost =
      target.initialEstimatedCost !== undefined
        ? target.initialEstimatedCost
        : costChanged
        ? target.totalCost
        : undefined;

    const existingHistory = target.costRevisionHistory || [];
    const nextHistory =
      costChanged || (updates.revisionReason && updates.revisionReason.trim().length > 0)
        ? [
            ...existingHistory,
            {
              date: new Date().toLocaleString('id-ID'),
              reason:
                updates.revisionReason?.trim() ||
                'Penyesuaian estimasi biaya setelah pemeriksaan teknisi',
              prevTotal: target.totalCost,
              newTotal: nextTotal,
              addedAmount: nextTotal - target.totalCost,
            },
          ]
        : existingHistory;

    const nextRemainingDebt =
      target.remainingDebt !== undefined
        ? Math.max(0, nextTotal - target.downPayment)
        : undefined;

    const updatedTicket: ServiceTicket = {
      ...target,
      problemDescription: nextProblem,
      sparepartCost: cleanSparepart,
      laborFee: cleanLabor,
      discount: cleanDiscount > 0 ? cleanDiscount : undefined,
      totalCost: nextTotal,
      technicianNote: nextNote || undefined,
      warrantyDays: nextWarranty,
      initialEstimatedCost,
      costRevisionHistory: nextHistory.length > 0 ? nextHistory : undefined,
      remainingDebt: nextRemainingDebt && nextRemainingDebt > 0 ? nextRemainingDebt : undefined,
    };

    setServices((prev) => prev.map((s) => (s.id === id ? updatedTicket : s)));

    // Sync unpaid DebtRecord if any exists for this service ticket
    setDebts((prevDebts) =>
      prevDebts.map((d) => {
        if (d.invoiceOrRef === id && d.status !== 'lunas') {
          const rem = Math.max(0, nextTotal - d.paidAmount);
          return {
            ...d,
            totalAmount: nextTotal,
            remainingAmount: rem,
            status: rem === 0 ? 'lunas' : d.paidAmount > 0 ? 'cicilan' : 'belum_lunas',
            note: updates.revisionReason?.trim()
              ? `${d.note} [Revisi: ${updates.revisionReason.trim()}]`
              : d.note,
          };
        }
        return d;
      })
    );

    // Sync matching item in Keranjang Besar if present
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.itemType === 'service' && item.metadata?.serviceTicketId === id) {
          const rem = Math.max(0, nextTotal - updatedTicket.downPayment);
          return {
            ...item,
            product: {
              ...item.product,
              hpp: Math.max(0, cleanSparepart - updatedTicket.downPayment),
              price: rem,
            },
            subtotal: Math.max(0, rem - item.discount),
            metadata: {
              ...item.metadata,
              problemDescription: nextProblem,
              originalTotalCost: nextTotal,
            },
          };
        }
        return item;
      })
    );

    return updatedTicket;
  };

  const deleteServiceTicket = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  // Percetakan & Fotokopi Management
  const addPrintOrder = (
    orderData: Omit<PrintOrder, 'id' | 'date'>,
    dueDate?: string
  ): PrintOrder => {
    const id = `PRT-2026-${Math.floor(100 + Math.random() * 900)}`;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newOrder: PrintOrder = {
      ...orderData,
      id,
      date: new Date().toLocaleString('id-ID'),
    };

    setPrintOrders((prev) => [newOrder, ...prev]);

    // 1. If payment method is hutang / kasbon, record debt directly
    const unpaidAmount =
      newOrder.paymentMethod === 'hutang'
        ? newOrder.totalAmount - newOrder.downPayment
        : newOrder.remainingAmount;

    if (newOrder.paymentMethod === 'hutang' || unpaidAmount > 0) {
      if (newOrder.paymentMethod === 'hutang') {
        const newDebt: DebtRecord = {
          id: `dbt-${Date.now()}`,
          invoiceOrRef: id,
          date: new Date().toISOString().slice(0, 10),
          customerName: newOrder.customerName.trim() || 'Pelanggan Percetakan',
          customerPhone: newOrder.customerPhone || '-',
          totalAmount: newOrder.totalAmount,
          paidAmount: newOrder.downPayment,
          remainingAmount: unpaidAmount,
          dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          status: newOrder.downPayment > 0 ? 'cicilan' : 'belum_lunas',
          note: `Kasbon Percetakan Order ${id} (${newOrder.items
            .map((i) => `${i.serviceName} x${i.quantity}`)
            .join(', ')})`,
        };
        setDebts((prev) => [newDebt, ...prev]);
      }
    }

    // 2. If down payment is paid in cash, auto-journal to Cash Drawer
    if (newOrder.downPayment > 0) {
      const mutation: CashMutation = {
        id: `mut-${Date.now()}`,
        timestamp: nowTime,
        type: 'masuk',
        category: 'percetakan',
        description: `DP Order Percetakan ${id} (${newOrder.customerName})`,
        amount: newOrder.downPayment,
        paymentMethod: newOrder.paymentMethod === 'tunai' ? 'tunai' : 'non_tunai',
        runningCashBalance:
          newOrder.paymentMethod === 'tunai'
            ? drawerCashBalance + newOrder.downPayment
            : drawerCashBalance,
        recordedBy: shift.cashierName,
      };
      setMutations((prev) => [mutation, ...prev]);
    }

    setReceiptData(newOrder);
    setIsReceiptModalOpen(true);

    return newOrder;
  };

  const updatePrintOrderStatus = (
    id: string,
    newStatus: PrintOrderStatus,
    paymentMethod: 'tunai' | 'qris' | 'hutang' = 'tunai',
    dueDate?: string,
    customerPhone?: string,
    note?: string,
    partialPaidAmount?: number
  ) => {
    setPrintOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const wasNotDiambil = o.status !== 'diambil';
          const isNowDiambil = newStatus === 'diambil';

          if (wasNotDiambil && isNowDiambil) {
            const remaining = Math.max(0, o.totalAmount - o.downPayment);
            if (remaining > 0) {
              const nowTime = new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              });

              const isPartial = partialPaidAmount !== undefined && partialPaidAmount < remaining && partialPaidAmount >= 0;
              const actualPaid = isPartial ? partialPaidAmount : (paymentMethod === 'hutang' ? 0 : remaining);
              const debtRemaining = Math.max(0, remaining - actualPaid);

              // 1. Catat kas masuk jika ada nominal dibayar
              if (actualPaid > 0) {
                if (paymentMethod === 'tunai' || isPartial) {
                  const mutation: CashMutation = {
                    id: `mut-${Date.now()}`,
                    timestamp: nowTime,
                    type: 'masuk',
                    category: 'percetakan',
                    description: isPartial
                      ? `Pelunasan Percetakan Sebagian ${o.id} (${o.customerName}) - Diterima Rp ${actualPaid.toLocaleString('id-ID')}, Sisa Kasbon Rp ${debtRemaining.toLocaleString('id-ID')}`
                      : `Pelunasan Percetakan ${o.id} (${o.customerName})`,
                    amount: actualPaid,
                    paymentMethod: 'tunai',
                    runningCashBalance: drawerCashBalance + actualPaid,
                    recordedBy: shift.cashierName,
                  };
                  setMutations((prevMut) => [mutation, ...prevMut]);
                } else {
                  const mutation: CashMutation = {
                    id: `mut-${Date.now()}`,
                    timestamp: nowTime,
                    type: 'masuk',
                    category: 'percetakan',
                    description: `Pelunasan QRIS Percetakan ${o.id} (${o.customerName})`,
                    amount: actualPaid,
                    paymentMethod: 'non_tunai',
                    runningCashBalance: drawerCashBalance,
                    recordedBy: shift.cashierName,
                  };
                  setMutations((prevMut) => [mutation, ...prevMut]);
                  setDigitalBalance((p) => p + actualPaid);
                }
              }

              // 2. Jika ada sisa belum lunas, otomatis masuk kasbon / hutang
              if (debtRemaining > 0) {
                const newDebt: DebtRecord = {
                  id: `dbt-${Date.now()}`,
                  invoiceOrRef: o.id,
                  date: new Date().toISOString().slice(0, 10),
                  customerName: o.customerName.trim() || 'Pelanggan Percetakan',
                  customerPhone: customerPhone?.trim() || o.customerPhone || '-',
                  totalAmount: o.totalAmount,
                  paidAmount: o.downPayment + actualPaid,
                  remainingAmount: debtRemaining,
                  dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
                  status: (o.downPayment + actualPaid) > 0 ? 'cicilan' : 'belum_lunas',
                  note: isPartial
                    ? `Kasbon Sisa Pelunasan Percetakan ${o.id} (${o.items.map((i) => i.serviceName).join(', ')})${note ? ' - ' + note : ''}`
                    : `Kasbon Pelunasan Percetakan ${o.id} (${o.items.map((i) => i.serviceName).join(', ')})${note ? ' - ' + note : ''}`,
                };
                setDebts((prevDebts) => [newDebt, ...prevDebts]);
              }

              return {
                ...o,
                status: newStatus,
                downPayment: o.downPayment + actualPaid,
                remainingAmount: debtRemaining,
                isPartialPayment: debtRemaining > 0 && (o.downPayment + actualPaid) > 0,
                dueDate: debtRemaining > 0 ? (dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)) : undefined,
                dateCompleted: new Date().toLocaleString('id-ID'),
              };
            }
          }

          return {
            ...o,
            status: newStatus,
            dateCompleted:
              newStatus === 'selesai' || newStatus === 'diambil'
                ? new Date().toLocaleString('id-ID')
                : o.dateCompleted,
          };
        }
        return o;
      })
    );
  };

  const deletePrintOrder = (id: string) => {
    setPrintOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const addPrintService = (
    srvData: Omit<PrintServiceItem, 'id'>
  ): PrintServiceItem => {
    const newSrv: PrintServiceItem = {
      ...srvData,
      id: `srv-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    };
    setPrintServices((prev) => [...prev, newSrv]);
    return newSrv;
  };

  const updatePrintService = (updatedSrv: PrintServiceItem) => {
    setPrintServices((prev) =>
      prev.map((s) => (s.id === updatedSrv.id ? updatedSrv : s))
    );
  };

  const deletePrintService = (id: string) => {
    setPrintServices((prev) => prev.filter((s) => s.id !== id));
  };

  const resetPrintServices = () => {
    setPrintServices(PRINT_PRICE_LIST);
    try {
      localStorage.setItem('jufat_print_services', JSON.stringify(PRINT_PRICE_LIST));
    } catch (e) {
      console.error(e);
    }
  };

  // Manual cash mutation (e.g., Pengeluaran operasional / Kas Masuk modal)
  const addCashMutation = (
    type: 'masuk' | 'keluar',
    category: CashMutation['category'],
    description: string,
    amount: number,
    paymentMethod: 'tunai' | 'non_tunai' = 'tunai'
  ) => {
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const newRunning =
      paymentMethod === 'tunai'
        ? type === 'masuk'
          ? drawerCashBalance + amount
          : drawerCashBalance - amount
        : drawerCashBalance;

    const newMutation: CashMutation = {
      id: `mut-${Date.now()}`,
      timestamp: nowTime,
      type,
      category,
      description,
      amount,
      paymentMethod,
      runningCashBalance: newRunning,
      recordedBy: shift.cashierName,
    };
    setMutations((prev) => [newMutation, ...prev]);

    // Closed-loop accounting for Bank Deposits / Cash injection
    if (category === 'setor_bank' && type === 'keluar') {
      setDigitalBalance((prev) => prev + amount);
      setLastSyncEvent({
        id: `sync-${Date.now()}`,
        timestamp: nowTime,
        source: 'manual',
        actionTitle: 'Setor Kas Laci ke Rekening Bank',
        customerName: shift.cashierName,
        drawerCashDelta: -amount,
        digitalBalanceDelta: amount,
        note: `Setor Bank: Kas fisik keluar -Rp ${amount.toLocaleString('id-ID')} | Saldo rekening bertambah +Rp ${amount.toLocaleString('id-ID')}`,
      });
    } else {
      setLastSyncEvent({
        id: `sync-${Date.now()}`,
        timestamp: nowTime,
        source: 'manual',
        actionTitle: `Mutasi Kas ${type === 'masuk' ? 'Masuk (+)' : 'Keluar (-)'}`,
        customerName: shift.cashierName,
        drawerCashDelta: type === 'masuk' ? amount : -amount,
        digitalBalanceDelta: 0,
        note: description || `Mutasi kas laci: ${type === 'masuk' ? '+' : '-'}Rp ${amount.toLocaleString('id-ID')}`,
      });
    }
  };

  // Update Starting Cash dynamically (Modal Awal Laci)
  const updateStartingCash = (amount: number) => {
    const validAmount = Math.max(0, amount);
    setShift((prev) => ({
      ...prev,
      startingCash: validAmount,
    }));
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setMutations((prev) => {
      const filtered = prev.filter((m) => m.category !== 'modal_shift');
      const newModalMutation: CashMutation = {
        id: `mut-modal-${Date.now()}`,
        timestamp: nowTime,
        type: 'masuk',
        category: 'modal_shift',
        description: `Modal Kas Awal Laci (${validAmount.toLocaleString('id-ID')})`,
        amount: validAmount,
        paymentMethod: 'tunai',
        runningCashBalance: validAmount,
        recordedBy: shift.cashierName,
      };
      return [newModalMutation, ...filtered];
    });
  };

  // Direct Drawer Cash Physical Adjustment (Sesuaikan Saldo Kas Laci ke Angka Berapa Saja)
  const adjustDrawerCash = (targetBalance: number, note?: string) => {
    const validTarget = Math.max(0, targetBalance);
    const diff = validTarget - drawerCashBalance;
    if (diff === 0) return;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const isMasuk = diff > 0;
    const absDiff = Math.abs(diff);
    const newMutation: CashMutation = {
      id: `mut-adj-${Date.now()}`,
      timestamp: nowTime,
      type: isMasuk ? 'masuk' : 'keluar',
      category: 'lain_lain',
      description: note?.trim() || `Penyesuaian Fisik Saldo Laci (${validTarget.toLocaleString('id-ID')})`,
      amount: absDiff,
      paymentMethod: 'tunai',
      runningCashBalance: validTarget,
      recordedBy: shift.cashierName,
    };
    setMutations((prev) => [newMutation, ...prev]);
  };

  // Pay Debt (Pelunasan Piutang)
  const payDebt = (debtId: string, payAmount: number, discountAmount = 0) => {
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    setDebts((prev) =>
      prev.map((d) => {
        if (d.id === debtId) {
          const newDiscount = (d.discount || 0) + discountAmount;
          const newPaid = d.paidAmount + payAmount;
          const effectiveTotal = Math.max(0, d.totalAmount - newDiscount);
          const newRemain = Math.max(0, effectiveTotal - newPaid);
          const newStatus = newRemain === 0 ? 'lunas' : 'cicilan';

          // Auto-journal into Cash Harian ONLY if actual money paid > 0
          if (payAmount > 0) {
            const mutation: CashMutation = {
              id: `mut-${Date.now()}`,
              timestamp: nowTime,
              type: 'masuk',
              category: 'piutang_masuk',
              description: `Pembayaran Piutang ${d.customerName} (${d.invoiceOrRef})${
                discountAmount > 0 ? ` [Diskon Rp ${discountAmount.toLocaleString('id-ID')}]` : ''
              }`,
              amount: payAmount,
              paymentMethod: 'tunai',
              runningCashBalance: drawerCashBalance + payAmount,
              recordedBy: shift.cashierName,
            };
            setMutations((prevMut) => [mutation, ...prevMut]);
          }

          return {
            ...d,
            discount: newDiscount > 0 ? newDiscount : undefined,
            paidAmount: newPaid,
            remainingAmount: newRemain,
            status: newStatus,
          };
        }
        return d;
      })
    );
  };

  const addDebt = (debt: Omit<DebtRecord, 'id' | 'remainingAmount' | 'status'>) => {
    const newDebt: DebtRecord = {
      ...debt,
      id: `dbt-${Date.now()}`,
      remainingAmount: debt.totalAmount - debt.paidAmount,
      status: debt.paidAmount >= debt.totalAmount ? 'lunas' : debt.paidAmount > 0 ? 'cicilan' : 'belum_lunas',
    };
    setDebts((prev) => [newDebt, ...prev]);
  };

  // Return items
  const updateReturnStatus = (id: string, newStatus: ReturnRecord['status']) => {
    setReturns((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
  };

  const addReturnRecord = (ret: Omit<ReturnRecord, 'id' | 'returNo' | 'date'>) => {
    const newRecord: ReturnRecord = {
      ...ret,
      id: `ret-${Date.now()}`,
      returNo: `RET-${Date.now().toString().slice(-5)}`,
      date: new Date().toISOString().slice(0, 10),
    };
    setReturns((prev) => [newRecord, ...prev]);
  };

  const syncProductInCart = (updatedProd: Product) => {
    setCart((prev) =>
      prev.map((item) => {
        if ((!item.itemType || item.itemType === 'produk') && item.product.id === updatedProd.id) {
          const clampedQty = Math.min(item.quantity, Math.max(0, updatedProd.stock));
          const pricing = calculateTieredPricing(updatedProd, clampedQty);
          return {
            ...item,
            product: updatedProd,
            quantity: clampedQty,
            subtotal: Math.max(0, pricing.totalPrice - item.discount),
            metadata: {
              ...item.metadata,
              pricingSummary: pricing.hasWholesaleApplied ? pricing.summaryLabel : undefined,
              pricingSavings: pricing.savings > 0 ? pricing.savings : undefined,
              retailSubtotal: pricing.retailTotal,
            },
          };
        }
        return item;
      })
    );
  };

  // Product Catalog
  const addProduct = (
    newProd: Omit<Product, 'id'>,
    options?: { hppMode?: 'weighted' | 'latest' }
  ) => {
    const { product: incoming } = normalizeProductRecord({
      ...newProd,
      id: `prod-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    });

    if (
      incoming.category &&
      !categories.some((c) => c.toLowerCase() === incoming.category.toLowerCase())
    ) {
      setCategories((prev) => [...prev, incoming.category]);
    }

    const prevValuation = computeStockValuation(products);
    const matchIdx = findMatchingProductIndex(products, incoming);

    if (matchIdx >= 0) {
      const existing = products[matchIdx];
      const mergedProduct = mergeProductRecords(existing, incoming, {
        hppMode: options?.hppMode ?? 'weighted',
        preferIncomingPrice: true,
      });
      const nextList = products.map((p, idx) => (idx === matchIdx ? mergedProduct : p));
      setProducts(nextList);
      syncProductInCart(mergedProduct);

      const nextValuation = computeStockValuation(nextList);
      return {
        product: mergedProduct,
        merged: true,
        addedStock: incoming.stock,
        assetHppDelta: nextValuation.totalAssetHpp - prevValuation.totalAssetHpp,
        revenueDelta: nextValuation.totalPotentialRevenue - prevValuation.totalPotentialRevenue,
        nextTotalAssetHpp: nextValuation.totalAssetHpp,
        nextTotalRevenue: nextValuation.totalPotentialRevenue,
      };
    }

    const nextList = [incoming, ...products];
    setProducts(nextList);
    const nextValuation = computeStockValuation(nextList);
    return {
      product: incoming,
      merged: false,
      addedStock: incoming.stock,
      assetHppDelta: nextValuation.totalAssetHpp - prevValuation.totalAssetHpp,
      revenueDelta: nextValuation.totalPotentialRevenue - prevValuation.totalPotentialRevenue,
      nextTotalAssetHpp: nextValuation.totalAssetHpp,
      nextTotalRevenue: nextValuation.totalPotentialRevenue,
    };
  };

  const updateProduct = (updated: Product) => {
    const { product } = normalizeProductRecord(updated);
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    syncProductInCart(product);
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const restockProduct = (
    id: string,
    addQty: number,
    newHpp?: number,
    options?: { newPrice?: number; hppMode?: 'weighted' | 'latest' }
  ) => {
    const cleanQty = Math.max(0, Math.round(Number(addQty) || 0));
    const cleanNewHpp =
      newHpp !== undefined && Number.isFinite(newHpp) && newHpp > 0
        ? Math.round(newHpp)
        : undefined;
    const cleanNewPrice =
      options?.newPrice !== undefined && Number.isFinite(options.newPrice) && options.newPrice > 0
        ? Math.round(options.newPrice)
        : undefined;
    const hppMode = options?.hppMode ?? 'weighted';

    let updatedTarget: Product | null = null;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const baseStock = Math.max(0, Math.round(Number(p.stock) || 0));
          const oldHpp = Math.max(0, Math.round(Number(p.hpp) || 0));
          const nextStock = Math.max(0, baseStock + cleanQty);

          let nextHpp = oldHpp;
          if (cleanNewHpp !== undefined) {
            if (hppMode === 'latest' || baseStock <= 0 || oldHpp <= 0) {
              nextHpp = cleanNewHpp;
            } else {
              nextHpp = Math.round(
                (baseStock * oldHpp + cleanQty * cleanNewHpp) / Math.max(1, nextStock)
              );
            }
          }

          updatedTarget = {
            ...p,
            stock: nextStock,
            hpp: nextHpp,
            ...(cleanNewPrice !== undefined ? { price: cleanNewPrice } : {}),
          };
          return updatedTarget;
        }
        return p;
      })
    );

    if (updatedTarget) {
      syncProductInCart(updatedTarget);
    }
  };

  const deduplicateTwinProducts = () => {
    const deduped = deduplicateProducts(products);
    if (deduped.removedDuplicateCount > 0) {
      setProducts(deduped.products);
      try {
        localStorage.setItem('jufat_products', JSON.stringify(deduped.products));
      } catch {
        // ignore storage errors
      }
    }
    return {
      removedDuplicateCount: deduped.removedDuplicateCount,
      mergedNames: deduped.mergedNames,
    };
  };

  const recalculateProductCatalog = (): StockValuationAudit => {
    const prevRawHpp = products.reduce(
      (acc, p) => acc + (Number(p.stock) || 0) * (Number(p.hpp) || 0),
      0
    );
    const prevRawRev = products.reduce(
      (acc, p) => acc + (Number(p.stock) || 0) * (Number(p.price) || 0),
      0
    );

    let fixedCount = 0;
    const normalizedList: Product[] = products.map((p) => {
      const res = normalizeProductRecord(p);
      if (res.wasFixed) fixedCount += 1;
      return res.product;
    });

    const deduped = deduplicateProducts(normalizedList);
    setProducts(deduped.products);
    try {
      localStorage.setItem('jufat_products', JSON.stringify(deduped.products));
    } catch {
      // ignore storage errors
    }

    const valuation = computeStockValuation(deduped.products);
    return {
      ...valuation,
      auditedAt: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      fixedCount,
      mergedDuplicateCount: deduped.removedDuplicateCount,
      mergedNames: deduped.mergedNames,
      previousAssetHpp: Number.isFinite(prevRawHpp) ? Math.round(prevRawHpp) : 0,
      previousPotentialRevenue: Number.isFinite(prevRawRev) ? Math.round(prevRawRev) : 0,
      assetDiff:
        valuation.totalAssetHpp - (Number.isFinite(prevRawHpp) ? Math.round(prevRawHpp) : 0),
      revenueDiff:
        valuation.totalPotentialRevenue -
        (Number.isFinite(prevRawRev) ? Math.round(prevRawRev) : 0),
    };
  };

  // Category Management
  const addCategory = (categoryName: string): boolean => {
    const trimmed = categoryName.trim();
    if (!trimmed) return false;
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      return false; // Already exists
    }
    setCategories((prev) => [...prev, trimmed]);
    return true;
  };

  const deleteCategory = (categoryName: string) => {
    setCategories((prev) => prev.filter((c) => c !== categoryName));
  };

  // Excel Product Operations
  const importProductsFromExcel = (newProds: Omit<Product, 'id'>[]) => {
    if (newProds.length === 0) {
      return {
        totalRows: 0,
        addedCount: 0,
        mergedCount: 0,
        totalUnitsAdded: 0,
        assetHppDelta: 0,
        revenueDelta: 0,
      };
    }

    // Automatically register any new categories found in the Excel import
    const newCatNames: string[] = [];
    newProds.forEach((p) => {
      if (
        p.category &&
        !categories.some((c) => c.toLowerCase() === p.category.toLowerCase()) &&
        !newCatNames.includes(p.category)
      ) {
        newCatNames.push(p.category);
      }
    });

    if (newCatNames.length > 0) {
      setCategories((prev) => [...prev, ...newCatNames]);
    }

    const prevValuation = computeStockValuation(products);
    const workingList = [...products];
    const newlyAdded: Product[] = [];
    let addedCount = 0;
    let mergedCount = 0;
    let totalUnitsAdded = 0;

    newProds.forEach((p, idx) => {
      const normalized = normalizeProductRecord({
        ...p,
        id: `prod-${Date.now()}-${idx}-${Math.floor(100 + Math.random() * 900)}`,
      }).product;
      totalUnitsAdded += normalized.stock;

      const matchInNew = findMatchingProductIndex(newlyAdded, normalized);
      if (matchInNew >= 0) {
        newlyAdded[matchInNew] = mergeProductRecords(newlyAdded[matchInNew], normalized, {
          hppMode: 'weighted',
          preferIncomingPrice: true,
        });
        mergedCount += 1;
        return;
      }

      const matchInExisting = findMatchingProductIndex(workingList, normalized);
      if (matchInExisting >= 0) {
        workingList[matchInExisting] = mergeProductRecords(
          workingList[matchInExisting],
          normalized,
          {
            hppMode: 'weighted',
            preferIncomingPrice: true,
          }
        );
        mergedCount += 1;
      } else {
        newlyAdded.push(normalized);
        addedCount += 1;
      }
    });

    const finalProducts = [...newlyAdded, ...workingList];
    setProducts(finalProducts);

    const nextValuation = computeStockValuation(finalProducts);
    return {
      totalRows: newProds.length,
      addedCount,
      mergedCount,
      totalUnitsAdded,
      assetHppDelta: nextValuation.totalAssetHpp - prevValuation.totalAssetHpp,
      revenueDelta: nextValuation.totalPotentialRevenue - prevValuation.totalPotentialRevenue,
    };
  };

  const exportProductsToExcel = () => {
    const data = products.map((p) => ({
      'Kode SKU': p.sku,
      'Nama Produk': p.name,
      'Kategori': p.category,
      'HPP (Modal)': p.hpp,
      'Harga Jual': p.price,
      'Harga Grosir / Paket': serializePriceTiersText(p.priceTiers),
      'Laba Satuan': p.price - p.hpp,
      'Stok (Pcs)': p.stock,
      'Batas Minimum Stok': p.minStock,
      'Satuan': p.unit,
      'Barcode': p.barcode || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Katalog Produk');
    XLSX.writeFile(
      workbook,
      `JuFatCell_KatalogStok_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const downloadExcelTemplate = () => {
    const templateData = [
      {
        'Kode SKU': 'MIN-ES-01',
        'Nama Produk': 'Es Minuman Segar (Ecer & Paket 3)',
        'Kategori': 'Minuman & Es',
        'HPP (Modal)': 1000,
        'Harga Jual': 2000,
        'Harga Grosir / Paket': '3=5000 (Paket 3)',
        'Stok': 60,
        'Batas Minimum Stok': 12,
        'Satuan': 'pcs',
        'Barcode': '89910012399',
      },
      {
        'Kode SKU': 'ATK-HVS-A4',
        'Nama Produk': 'Kertas HVS A4 75gr (Ecer / Per 4 Lbr / 1 Rim)',
        'Kategori': 'ATK & Kertas',
        'HPP (Modal)': 95,
        'Harga Jual': 500,
        'Harga Grosir / Paket': '4=1000 (Per 4 Lbr); 500=55000 (1 Rim)',
        'Stok': 1500,
        'Batas Minimum Stok': 250,
        'Satuan': 'lembar',
        'Barcode': '89910012398',
      },
      {
        'Kode SKU': 'ACC-CASE-CLR',
        'Nama Produk': 'Case Silikon Bening Anti Crack All Tipe',
        'Kategori': 'Case & Pelindung',
        'HPP (Modal)': 7000,
        'Harga Jual': 15000,
        'Harga Grosir / Paket': '',
        'Stok': 30,
        'Batas Minimum Stok': 10,
        'Satuan': 'pcs',
        'Barcode': '',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Tambah Produk');
    XLSX.writeFile(workbook, 'Template_Tambah_Produk_JuFatCell.xlsx');
  };

  // Manage Cashier Profiles (2 Kasir & 1 Owner)
  const updateCashierProfile = (slot: CashierSlot, name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    setCashierProfiles((prev) => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        name: cleanName,
      },
    }));
    setShift((prev) => {
      if (prev.cashierSlot === slot && !prev.isSwappedShift) {
        return { ...prev, cashierName: cleanName };
      }
      return prev;
    });
  };

  const switchCashierRole = (slot: CashierSlot, customName?: string, isSwapped: boolean = false) => {
    const profile = cashierProfiles[slot] || DEFAULT_CASHIER_PROFILES[slot];
    const finalName = customName?.trim() || profile.name;
    setShift((prev) => ({
      ...prev,
      role: profile.role,
      cashierSlot: slot,
      cashierName: finalName,
      cashierEmail: profile.email,
      isSwappedShift: isSwapped,
      originalCashierName: profile.name,
      shiftName: prev.shiftName || profile.defaultShiftName,
    }));
  };

  // Toggle role between Kasir 1, Kasir 2, and Owner
  const toggleRole = () => {
    setShift((prev) => {
      const nextSlot: CashierSlot =
        prev.cashierSlot === 'kasir_1'
          ? 'kasir_2'
          : prev.cashierSlot === 'kasir_2'
          ? 'owner'
          : 'kasir_1';
      const profile = cashierProfiles[nextSlot] || DEFAULT_CASHIER_PROFILES[nextSlot];
      return {
        ...prev,
        role: profile.role,
        cashierSlot: nextSlot,
        cashierName: profile.name,
        cashierEmail: profile.email,
        isSwappedShift: false,
        originalCashierName: undefined,
      };
    });
  };

  // Receipt Modal actions
  const openReceipt = (
    data:
      | POSTransaction
      | AgencyTransaction
      | ServiceTicket
      | AtmMiniTransaction
      | PPOBTransaction
      | PrintOrder
  ) => {
    setReceiptData(data);
    setIsReceiptModalOpen(true);
  };

  const closeReceipt = () => {
    setReceiptData(null);
    setIsReceiptModalOpen(false);
  };

  // Shift Drawer Closing & Reconciliation (Dukungan Setoran Kasir & Tutup Toko Bukan 24 Jam)
  const closeShiftDrawer = (
    actualCash: number,
    note?: string,
    depositOptions?: {
      depositAmount: number;
      depositRecipient: string;
      remainingCashForDrawer: number;
    },
    closeType: 'tutup_toko' | 'serah_terima' = 'tutup_toko'
  ) => {
    const diff = actualCash - drawerCashBalance;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const nowDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const fullTimeStr = `${nowTime} WIB · ${nowDate}`;

    // 1. Catat rekonsiliasi selisih kas fisik jika ada selisih
    if (diff !== 0) {
      const mutation: CashMutation = {
        id: `mut-${Date.now()}`,
        timestamp: nowTime,
        type: diff >= 0 ? 'masuk' : 'keluar',
        category: 'modal_shift',
        description: `Rekonsiliasi Tutup Shift ${shift.shiftName} (${shift.cashierName}) - Kas Fisik Rp ${actualCash.toLocaleString(
          'id-ID'
        )} (Selisih: Rp ${diff.toLocaleString('id-ID')}) ${note ? `[${note}]` : ''}`,
        amount: Math.abs(diff),
        paymentMethod: 'tunai',
        runningCashBalance: actualCash,
        recordedBy: shift.cashierName,
      };
      setMutations((prev) => [mutation, ...prev]);
    }

    // 2. Jika ada opsi setoran (misal Shift 2 closing akhir hari atau Shift 1 diserahkan ke Owner)
    let finalRemainingCash = actualCash;
    if (depositOptions && depositOptions.depositAmount > 0) {
      finalRemainingCash = depositOptions.remainingCashForDrawer;
      const depositMutation: CashMutation = {
        id: `mut-dep-${Date.now()}`,
        timestamp: nowTime,
        type: 'keluar',
        category: 'setor_bank',
        description: `Setoran Kas Tutup ${shift.shiftName} (${shift.cashierName}) ke ${depositOptions.depositRecipient}: Rp ${depositOptions.depositAmount.toLocaleString(
          'id-ID'
        )} · Sisa Modal Laci Tetap: Rp ${depositOptions.remainingCashForDrawer.toLocaleString('id-ID')}`,
        amount: depositOptions.depositAmount,
        paymentMethod: 'tunai',
        runningCashBalance: finalRemainingCash,
        recordedBy: shift.cashierName,
      };
      setMutations((prev) => [depositMutation, ...prev]);
    }

    // 3. Catat Riwayat Shift (Shift Record)
    const newRecord: ShiftRecord = {
      id: `shift-rec-${Date.now()}`,
      shiftNumber: shift.shiftNumber,
      shiftName: shift.shiftName,
      cashierName: shift.cashierName,
      cashierSlot: shift.cashierSlot,
      role: shift.role,
      startTime: shift.startTime,
      endTime: fullTimeStr,
      duration: `${shift.startTime} s/d ${nowTime} WIB`,
      startingCash: shift.startingCash,
      systemCash: drawerCashBalance,
      actualCash,
      difference: diff,
      depositAmount: depositOptions?.depositAmount,
      depositRecipient: depositOptions?.depositRecipient,
      remainingCashInDrawer: finalRemainingCash,
      note: note || (closeType === 'tutup_toko' ? 'Tutup kasir malam (Toko Tutup)' : 'Serah terima pergantian shift'),
      closeType,
    };
    setShiftHistory((prev) => [newRecord, ...prev]);

    // 4. Update Shift State: Register menjadi TUTUP (isOpen = false)
    setShift((prev) => ({
      ...prev,
      isOpen: false,
      closedAt: fullTimeStr,
      closedBy: shift.cashierName,
      closingCash: finalRemainingCash,
      closingNotes: note,
    }));

    return {
      systemCash: drawerCashBalance,
      actualCash,
      difference: diff,
      depositAmount: depositOptions?.depositAmount,
      remainingCash: finalRemainingCash,
    };
  };

  const openNewShift = (
    startingCash: number,
    cashierName: string,
    slot: CashierSlot = 'kasir_1',
    shiftTitle?: string,
    isSwapped: boolean = false,
    customStartTime?: string
  ) => {
    const nextShiftNum = shift.shiftNumber + 1;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const nowDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const fullStartTime = customStartTime || `${nowTime} WIB · ${nowDate}`;
    const profile = cashierProfiles[slot] || DEFAULT_CASHIER_PROFILES[slot];
    const finalName = cashierName.trim() || profile.name;

    const defaultTitle =
      slot === 'owner'
        ? `Shift ${nextShiftNum} (Owner)`
        : slot === 'kasir_1'
        ? `Shift ${nextShiftNum} (Pagi)`
        : `Shift ${nextShiftNum} (Sore)`;

    const newShiftState: ShiftState = {
      shiftNumber: nextShiftNum,
      shiftName: shiftTitle?.trim() || defaultTitle,
      cashierName: finalName,
      cashierEmail: profile.email,
      role: profile.role,
      cashierSlot: slot,
      isSwappedShift: isSwapped,
      originalCashierName: profile.name,
      startTime: fullStartTime,
      startingCash,
      isOpen: true,
      closedAt: shift.closedAt,
      closedBy: shift.closedBy,
      closingCash: shift.closingCash,
    };

    setShift(newShiftState);

    // Record starting cash mutation
    const mutation: CashMutation = {
      id: `mut-${Date.now()}`,
      timestamp: nowTime,
      type: 'masuk',
      category: 'modal_shift',
      description: `Buka Kas Awal Laci ${newShiftState.shiftName} (${finalName}${isSwapped ? ' - Tukar Shift' : ''}) - Modal: Rp ${startingCash.toLocaleString('id-ID')}`,
      amount: startingCash,
      paymentMethod: 'tunai',
      runningCashBalance: startingCash,
      recordedBy: finalName,
    };
    setMutations((prev) => [mutation, ...prev]);
  };

  // Export mutations as clean CSV file
  const exportCashMutationCSV = () => {
    const headers = ['ID', 'Waktu', 'Tipe', 'Kategori', 'Deskripsi', 'Metode', 'Nominal (Rp)', 'Saldo Kas Laci (Rp)', 'Petugas'];
    const rows = mutations.map((m) => [
      m.id,
      m.timestamp,
      m.type.toUpperCase(),
      m.category,
      `"${m.description.replace(/"/g, '""')}"`,
      m.paymentMethod,
      m.amount,
      m.runningCashBalance,
      m.recordedBy,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `JuFatCell_KasHarian_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Store Profile, Logo & Production / Demo Mode Management
  const updateStoreProfile = (newProfile: Partial<StoreProfile>) => {
    setStoreProfile((prev) => {
      const updated = { ...prev, ...newProfile };
      try {
        localStorage.setItem('jufat_store_profile', JSON.stringify(updated));
        const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLastSavedTime(now);
      } catch (err) {
        console.error('Gagal menyimpan profil:', err);
      }
      return updated;
    });
  };

  const exitDemoMode = (option: 'keep_products' | 'clear_all') => {
    // 1. Bersihkan transaksi demo kasir, agen, edc, ppob, servis, hutang & retur
    setCart([]);
    setTransactions([]);
    setAgencyTransactions([]);
    setAtmMiniTransactions([]);
    setPpobTransactions([]);
    setServices([]);
    setDebts([]);
    setReturns([]);

    // 2. Buat mutasi modal kas awal yang bersih
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const cleanMutation: CashMutation = {
      id: `mut-${Date.now()}`,
      timestamp: nowTime,
      type: 'masuk',
      category: 'modal_shift',
      description: 'Modal Awal Kas Laci Toko Nyata (Mode Produksi)',
      amount: shift.startingCash,
      paymentMethod: 'tunai',
      runningCashBalance: shift.startingCash,
      recordedBy: shift.cashierName,
    };
    setMutations([cleanMutation]);

    // 3. Jika pengguna memilih bersih total (tanpa produk contoh)
    if (option === 'clear_all') {
      setProducts([]);
    }

    // 4. Update status isDemoMode ke false
    setStoreProfile((prev) => {
      const updated: StoreProfile = { ...prev, isDemoMode: false };
      try {
        localStorage.setItem('jufat_store_profile', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });

    // 5. Simpan langsung ke localStorage untuk memastikan data aman dan tidak hilang
    try {
      localStorage.setItem('jufat_transactions', JSON.stringify([]));
      localStorage.setItem('jufat_agency_txs', JSON.stringify([]));
      localStorage.setItem('jufat_atm_mini_txs', JSON.stringify([]));
      localStorage.setItem('jufat_ppob_txs', JSON.stringify([]));
      localStorage.setItem('jufat_services', JSON.stringify([]));
      localStorage.setItem('jufat_print_orders', JSON.stringify([]));
      localStorage.setItem('jufat_debts', JSON.stringify([]));
      localStorage.setItem('jufat_returns', JSON.stringify([]));
      localStorage.setItem('jufat_mutations', JSON.stringify([cleanMutation]));
      setPrintOrders([]);
      if (option === 'clear_all') {
        localStorage.setItem('jufat_products', JSON.stringify([]));
      }
      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(now);
    } catch (err) {
      console.error(err);
    }
  };

  const enterDemoMode = () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setCart([]);
    setTransactions([]);
    setAgencyTransactions(INITIAL_AGENCY_TXS);
    setAtmMiniTransactions(INITIAL_ATM_MINI_TXS);
    setPpobPackages(INITIAL_PPOB_PACKAGES);
    setPpobTransactions([]);
    setServices(INITIAL_SERVICES);
    setPrintOrders(INITIAL_PRINT_ORDERS);
    setMutations(INITIAL_MUTATIONS);
    setDebts(INITIAL_DEBTS);
    setReturns(INITIAL_RETURNS);
    setShift(INITIAL_SHIFT);
    setStoreProfile((prev) => {
      const updated: StoreProfile = { ...prev, isDemoMode: true };
      localStorage.setItem('jufat_store_profile', JSON.stringify(updated));
      return updated;
    });
  };

  // Backup & Restore System
  const exportBackupJSON = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      storeProfile,
      products,
      categories,
      transactions,
      agencyTransactions,
      atmMiniTransactions,
      ppobPackages,
      ppobTransactions,
      services,
      printOrders,
      printServices,
      mutations,
      debts,
      returns,
      shift,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JuFatCell_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackupJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.storeProfile) setStoreProfile(data.storeProfile);
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products.map((p: Product) => normalizeProductRecord(p).product));
      }
      if (data.categories) setCategories(data.categories);
      if (data.transactions) setTransactions(data.transactions);
      if (data.agencyTransactions) setAgencyTransactions(data.agencyTransactions);
      if (data.atmMiniTransactions) setAtmMiniTransactions(data.atmMiniTransactions);
      if (data.ppobPackages) setPpobPackages(data.ppobPackages);
      if (data.ppobTransactions) setPpobTransactions(data.ppobTransactions);
      if (data.services) setServices(data.services);
      if (data.printOrders) setPrintOrders(data.printOrders);
      if (data.printServices) setPrintServices(data.printServices);
      if (data.mutations) setMutations(data.mutations);
      if (data.debts) setDebts(data.debts);
      if (data.returns) setReturns(data.returns);
      if (data.shift) setShift(data.shift);
      return true;
    } catch {
      return false;
    }
  };

  const resetAllDemoData = () => {
    localStorage.clear();
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setCart([]);
    setTransactions([]);
    setAgencyTransactions(INITIAL_AGENCY_TXS);
    setAtmMiniTransactions(INITIAL_ATM_MINI_TXS);
    setPpobPackages(INITIAL_PPOB_PACKAGES);
    setPpobTransactions([]);
    setServices(INITIAL_SERVICES);
    setPrintOrders(INITIAL_PRINT_ORDERS);
    setPrintServices(PRINT_PRICE_LIST);
    setMutations(INITIAL_MUTATIONS);
    setDebts(INITIAL_DEBTS);
    setReturns(INITIAL_RETURNS);
    setShift(INITIAL_SHIFT);
    setStoreProfile(INITIAL_STORE_PROFILE);
  };

  // Helper to gather all store state into payload
  const getFullStatePayload = () => {
    return {
      version: '1.0',
      syncedAt: new Date().toISOString(),
      storeProfile,
      products,
      categories,
      transactions,
      agencyTransactions,
      atmMiniTransactions,
      ppobPackages,
      ppobTransactions,
      services,
      printOrders,
      printServices,
      mutations,
      debts,
      returns,
      shift,
    };
  };

  const applySyncedDataObject = (data: any): boolean => {
    try {
      if (data.storeProfile) {
        setStoreProfile(data.storeProfile);
        localStorage.setItem('jufat_store_profile', JSON.stringify(data.storeProfile));
      }
      if (data.products && Array.isArray(data.products)) {
        const cleanProducts = data.products.map((p: Product) => normalizeProductRecord(p).product);
        setProducts(cleanProducts);
        localStorage.setItem('jufat_products', JSON.stringify(cleanProducts));
      }
      if (data.categories) {
        setCategories(data.categories);
        localStorage.setItem('jufat_categories', JSON.stringify(data.categories));
      }
      if (data.transactions) {
        setTransactions(data.transactions);
        localStorage.setItem('jufat_transactions', JSON.stringify(data.transactions));
      }
      if (data.agencyTransactions) {
        setAgencyTransactions(data.agencyTransactions);
        localStorage.setItem('jufat_agency_txs', JSON.stringify(data.agencyTransactions));
      }
      if (data.atmMiniTransactions) {
        setAtmMiniTransactions(data.atmMiniTransactions);
        localStorage.setItem('jufat_atm_mini_txs', JSON.stringify(data.atmMiniTransactions));
      }
      if (data.ppobPackages) {
        setPpobPackages(data.ppobPackages);
        localStorage.setItem('jufat_ppob_packages', JSON.stringify(data.ppobPackages));
      }
      if (data.ppobTransactions) {
        setPpobTransactions(data.ppobTransactions);
        localStorage.setItem('jufat_ppob_txs', JSON.stringify(data.ppobTransactions));
      }
      if (data.services) {
        setServices(data.services);
        localStorage.setItem('jufat_services', JSON.stringify(data.services));
      }
      if (data.printOrders) {
        setPrintOrders(data.printOrders);
        localStorage.setItem('jufat_print_orders', JSON.stringify(data.printOrders));
      }
      if (data.printServices) {
        setPrintServices(data.printServices);
        localStorage.setItem('jufat_print_services', JSON.stringify(data.printServices));
      }
      if (data.mutations) {
        setMutations(data.mutations);
        localStorage.setItem('jufat_mutations', JSON.stringify(data.mutations));
      }
      if (data.debts) {
        setDebts(data.debts);
        localStorage.setItem('jufat_debts', JSON.stringify(data.debts));
      }
      if (data.returns) {
        setReturns(data.returns);
        localStorage.setItem('jufat_returns', JSON.stringify(data.returns));
      }
      if (data.shift) {
        setShift(data.shift);
        localStorage.setItem('jufat_shift', JSON.stringify(data.shift));
      }
      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(now);
      return true;
    } catch (err) {
      console.error('Error applying synced data:', err);
      return false;
    }
  };

  const pushDataToCloud = async (targetCode?: string): Promise<{ success: boolean; message: string }> => {
    const codeToUse = (targetCode || syncCode).trim().toUpperCase();
    if (!codeToUse) {
      return { success: false, message: 'Kode sinkronisasi belum dibuat atau kosong.' };
    }
    setIsSyncing(true);
    setSyncStatus('syncing');
    try {
      const payload = getFullStatePayload();
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const deviceName = isMobile ? 'Smartphone (HP)' : 'Komputer (PC)';

      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToUse, deviceName, data: payload }),
      });
      const result = await res.json();
      if (result.success) {
        setSyncStatus('success');
        setSyncCode(codeToUse);
        localStorage.setItem('jufat_sync_code', codeToUse);
        const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(timeNow);
        localStorage.setItem('jufat_last_sync_time', timeNow);
        setSyncMessage(`Data berhasil diunggah ke Kode ${codeToUse}`);
        setIsSyncing(false);
        return { success: true, message: result.message };
      } else {
        setSyncStatus('error');
        setSyncMessage(result.message || 'Gagal sinkron data');
        setIsSyncing(false);
        return { success: false, message: result.message };
      }
    } catch (err: any) {
      setSyncStatus('error');
      setSyncMessage(err?.message || 'Koneksi ke server gagal');
      setIsSyncing(false);
      return { success: false, message: err?.message || 'Gagal terhubung ke server' };
    }
  };

  const pullDataFromCloud = async (targetCode: string): Promise<{ success: boolean; message: string; data?: any }> => {
    const cleanCode = targetCode.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Kode sinkronisasi tidak boleh kosong.' };
    }
    setIsSyncing(true);
    setSyncStatus('syncing');
    try {
      const res = await fetch(`/api/sync/pull/${encodeURIComponent(cleanCode)}`);
      const result = await res.json();
      if (result.success && result.data) {
        applySyncedDataObject(result.data);
        setSyncCode(cleanCode);
        localStorage.setItem('jufat_sync_code', cleanCode);
        const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(timeNow);
        localStorage.setItem('jufat_last_sync_time', timeNow);
        setSyncStatus('success');
        setSyncMessage(`Berhasil menyinkronkan data dari Kode ${cleanCode}`);
        setIsSyncing(false);
        return {
          success: true,
          message: `Data dari ${result.deviceName || 'PC'} berhasil diterapkan ke perangkat ini!`,
          data: result.data,
        };
      } else {
        setSyncStatus('error');
        setSyncMessage(result.message || 'Kode tidak ditemukan');
        setIsSyncing(false);
        return { success: false, message: result.message || 'Kode tidak ditemukan.' };
      }
    } catch (err: any) {
      setSyncStatus('error');
      setSyncMessage(err?.message || 'Gagal menarik data');
      setIsSyncing(false);
      return { success: false, message: err?.message || 'Gagal menghubungi server' };
    }
  };

  const generateNewSyncCode = async (): Promise<{ success: boolean; code?: string; message?: string }> => {
    setIsSyncing(true);
    try {
      const payload = getFullStatePayload();
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const deviceName = isMobile ? 'Smartphone (HP)' : 'Komputer (PC)';

      const res = await fetch('/api/sync/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName, data: payload }),
      });
      const result = await res.json();
      if (result.success && result.code) {
        setSyncCode(result.code);
        localStorage.setItem('jufat_sync_code', result.code);
        const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(timeNow);
        localStorage.setItem('jufat_last_sync_time', timeNow);
        setSyncStatus('success');
        setSyncMessage(`Kode baru: ${result.code}`);
        setIsSyncing(false);
        return { success: true, code: result.code, message: result.message };
      } else {
        setIsSyncing(false);
        return { success: false, message: result.message || 'Gagal membuat kode' };
      }
    } catch (err: any) {
      setIsSyncing(false);
      return { success: false, message: err?.message || 'Gagal membuat kode' };
    }
  };

  const disconnectSync = () => {
    setSyncCode('');
    localStorage.removeItem('jufat_sync_code');
    setSyncStatus('idle');
    setSyncMessage('');
  };

  const toggleAutoSync = (enabled: boolean) => {
    setIsAutoSyncEnabled(enabled);
    localStorage.setItem('jufat_auto_sync', String(enabled));
  };

  // URL Query Sync Parameter Check (e.g. ?sync=JF-8468)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const syncParam = params.get('sync');
      if (syncParam) {
        const cleanParam = syncParam.trim().toUpperCase();
        setSyncCode(cleanParam);
        setIsSyncModalOpen(true);
      }
    }
  }, []);

  // Periodic Auto-Sync Effect (every 30 seconds when enabled and code is active)
  useEffect(() => {
    if (!isAutoSyncEnabled || !syncCode) return;
    const interval = setInterval(() => {
      pushDataToCloud(syncCode).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [isAutoSyncEnabled, syncCode, products, transactions, mutations, debts, services]);

  // =========================================================================
  // AUTO-CAPTURE & MODE KILAT ENGINE (Anti-Terlewat PPOB & ATM Mini)
  // =========================================================================
  const [autoCaptureSettings, setAutoCaptureSettings] = useState<AutoCaptureSettings>(() => {
    try {
      const saved = localStorage.getItem('jufat_auto_capture_settings');
      if (saved) {
        return { ...DEFAULT_AUTO_CAPTURE_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_AUTO_CAPTURE_SETTINGS;
  });

  const [pendingAutoCaptures, setPendingAutoCaptures] = useState<PendingAutoCaptureItem[]>(() => {
    try {
      const saved = localStorage.getItem('jufat_pending_auto_captures');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [autoRecordedLogs, setAutoRecordedLogs] = useState<AutoRecordedLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('jufat_auto_recorded_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [latestAutoCaptureToast, setLatestAutoCaptureToast] = useState<AutoRecordedLogItem | null>(null);
  const [isAutoCaptureModalOpen, setIsAutoCaptureModalOpen] = useState(false);
  const [clipboardStatus, setClipboardStatus] = useState<'idle' | 'ready' | 'denied' | 'unsupported'>('idle');

  const processedFingerprintsRef = useRef<Set<string>>((() => {
    try {
      const saved = localStorage.getItem('jufat_processed_capture_hashes');
      const arr = saved ? (JSON.parse(saved) as string[]) : [];
      return new Set(arr);
    } catch {
      return new Set<string>();
    }
  })());

  const persistFingerprints = useCallback((fp: string) => {
    processedFingerprintsRef.current.add(fp);
    const list = Array.from(processedFingerprintsRef.current).slice(-300);
    processedFingerprintsRef.current = new Set(list);
    try {
      localStorage.setItem('jufat_processed_capture_hashes', JSON.stringify(list));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('jufat_auto_capture_settings', JSON.stringify(autoCaptureSettings));
    } catch {
      // ignore
    }
  }, [autoCaptureSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('jufat_pending_auto_captures', JSON.stringify(pendingAutoCaptures.slice(0, 50)));
    } catch {
      // ignore
    }
  }, [pendingAutoCaptures]);

  useEffect(() => {
    try {
      localStorage.setItem('jufat_auto_recorded_logs', JSON.stringify(autoRecordedLogs.slice(0, 60)));
    } catch {
      // ignore
    }
  }, [autoRecordedLogs]);

  const updateAutoCaptureSettings = (patch: Partial<AutoCaptureSettings>) => {
    setAutoCaptureSettings((prev) => ({ ...prev, ...patch }));
  };

  const dismissLatestAutoCaptureToast = () => setLatestAutoCaptureToast(null);

  const recordRushLogEntry = (
    entry: Omit<AutoRecordedLogItem, 'id' | 'recordedAt'>
  ): AutoRecordedLogItem => {
    const fullEntry: AutoRecordedLogItem = {
      ...entry,
      id: `alog-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      recordedAt: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
    setAutoRecordedLogs((prev) => [fullEntry, ...prev].slice(0, 60));
    setLatestAutoCaptureToast(fullEntry);
    return fullEntry;
  };

  const commitParsedAtmItems = (
    items: ParsedAtmMiniItem[],
    source: 'clipboard' | 'paste' | 'webhook',
    openReceiptOnSingle: boolean = false
  ): AutoRecordedLogItem[] => {
    let runningCashOffset = 0;
    const logs: AutoRecordedLogItem[] = [];
    const nowLabel = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    items.forEach((item, idx) => {
      if (item.nominal <= 0) return;
      const totalAdmin = item.adminEdcFee + item.counterFee;
      const isPotong =
        item.atmType === 'tarik_tunai_atm' && item.adminDeductionType === 'potong_tunai';
      const isTunaiKonter =
        item.atmType === 'tarik_tunai_atm' && item.adminDeductionType === 'tunai_konter';
      const totalDebited = isPotong || isTunaiKonter ? item.nominal : item.nominal + totalAdmin;

      const maskedId =
        item.channel === 'ewallet'
          ? `EW-${item.bankName.toUpperCase()} · ${item.targetAccountOrPhone || '-'}`
          : item.channel === 'mbanking'
          ? `APP ${item.bankName.split(' ')[0]} · ${item.referenceNo || 'Cardless'}`
          : item.channel === 'qris'
          ? item.referenceNo || `RRN-${Math.floor(100000 + Math.random() * 900000)}`
          : `AUTO-${item.referenceNo || '8888'}`;

      const destination = item.targetAccountOrPhone
        ? `${item.targetAccountOrPhone} (${item.bankName})`
        : item.bankName;

      const shouldOpenReceipt = openReceiptOnSingle && items.length === 1 && idx === 0;

      const recordedTx = recordAtmMiniTransaction(
        item.atmType,
        item.bankName,
        item.cardType,
        maskedId,
        item.customerName || (item.sourceApp ? `Nasabah ${item.sourceApp}` : 'Nasabah'),
        item.nominal,
        item.adminEdcFee,
        item.counterFee,
        destination,
        item.note,
        item.paymentMethod,
        item.targetAccountOrPhone,
        undefined,
        item.adminDeductionType,
        undefined,
        isTunaiKonter ? totalAdmin : totalDebited,
        {
          suppressReceiptModal: !shouldOpenReceipt,
          cashBalanceOffset: runningCashOffset,
        }
      );

      if (item.atmType === 'tarik_tunai_atm') {
        const cashOut = isPotong ? Math.max(0, item.nominal - totalAdmin) : item.nominal;
        if (isTunaiKonter && item.paymentMethod === 'tunai') {
          runningCashOffset += totalAdmin - cashOut;
        } else {
          runningCashOffset -= cashOut;
        }
      } else if (item.paymentMethod === 'tunai') {
        runningCashOffset += totalDebited;
      }

      const typeLabel =
        item.atmType === 'tarik_tunai_atm'
          ? 'Tarik Tunai'
          : item.atmType === 'topup_ewallet_atm'
          ? 'Top Up'
          : item.atmType === 'qris_atm'
          ? 'QRIS'
          : 'Transfer';

      logs.push({
        id: `alog-${Date.now()}-${idx}-${Math.floor(100 + Math.random() * 900)}`,
        txId: recordedTx.id,
        domain: 'atm_mini',
        source,
        sourceApp: item.sourceApp,
        summary: `${typeLabel} ${item.bankName} Rp ${item.nominal.toLocaleString('id-ID')}`,
        customerName: recordedTx.customerName,
        targetNumber: item.targetAccountOrPhone || undefined,
        amount: item.nominal,
        recordedAt: nowLabel,
      });
    });

    if (logs.length > 0) {
      setAutoRecordedLogs((prev) => [...logs, ...prev].slice(0, 60));
      setLatestAutoCaptureToast(logs[0]);
    }
    return logs;
  };

  const commitParsedPpobItems = (
    items: ParsedPPOBItem[],
    source: 'clipboard' | 'paste' | 'webhook',
    openReceiptOnSingle: boolean = false
  ): AutoRecordedLogItem[] => {
    let runningCashOffset = 0;
    const logs: AutoRecordedLogItem[] = [];
    const nowLabel = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    items.forEach((item, idx) => {
      if (item.sellingPrice <= 0) return;
      const shouldOpenReceipt = openReceiptOnSingle && items.length === 1 && idx === 0;
      const recordedTx = recordPPOBTransaction(
        item.category,
        item.provider,
        item.targetNumber || '-',
        item.packageName,
        item.hpp,
        item.sellingPrice,
        item.customerName || 'Pelanggan PPOB',
        item.paymentMethod,
        item.targetNumber || undefined,
        undefined,
        item.note,
        undefined,
        {
          suppressReceiptModal: !shouldOpenReceipt,
          cashBalanceOffset: runningCashOffset,
        }
      );

      if (item.paymentMethod === 'tunai') {
        runningCashOffset += item.sellingPrice;
      }

      logs.push({
        id: `alog-${Date.now()}-${idx}-${Math.floor(100 + Math.random() * 900)}`,
        txId: recordedTx.id,
        domain: 'ppob',
        source,
        sourceApp: item.sourceApp,
        summary: `${item.packageName} (${item.targetNumber || '-'})`,
        customerName: recordedTx.customerName,
        targetNumber: item.targetNumber || undefined,
        amount: item.sellingPrice,
        recordedAt: nowLabel,
      });
    });

    if (logs.length > 0) {
      setAutoRecordedLogs((prev) => [...logs, ...prev].slice(0, 60));
      setLatestAutoCaptureToast(logs[0]);
    }
    return logs;
  };

  const ackServerPendingIds = (ids: string[], action: 'recorded' | 'dismissed') => {
    if (ids.length === 0) return;
    const storeKey = normalizeWebhookStoreKey(autoCaptureSettings.webhookStoreKey || syncCode);
    fetch('/api/auto-capture/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: storeKey, ids, action }),
    }).catch(() => {});
  };

  const processIncomingCaptureText = (
    rawText: string,
    source: 'clipboard' | 'paste' | 'webhook',
    options?: {
      preferredDomain?: 'atm_mini' | 'ppob';
      serverId?: string;
      receivedAt?: string;
      forceQueueOnly?: boolean;
    }
  ): {
    status: 'recorded' | 'queued' | 'duplicate' | 'ignored';
    message: string;
    recordedCount?: number;
  } => {
    if (source !== 'webhook' && !looksLikeTransactionReceipt(rawText)) {
      return {
        status: 'ignored',
        message: 'Teks bukan merupakan struk/notifikasi transaksi yang valid.',
      };
    }

    const fp = computeReceiptFingerprint(rawText);
    if (!fp) {
      return { status: 'ignored', message: 'Teks kosong.' };
    }

    if (processedFingerprintsRef.current.has(fp)) {
      if (options?.serverId) ackServerPendingIds([options.serverId], 'recorded');
      return {
        status: 'duplicate',
        message: 'Struk ini sudah tercatat sebelumnya (anti-duplikat aktif).',
      };
    }

    const activeDomainPref =
      options?.preferredDomain ||
      (activeTab === 'ppob' ? 'ppob' : activeTab === 'atm_mini' || activeTab === 'transfer' ? 'atm_mini' : undefined);

    const parsedPending = parseIncomingCaptureToPending(rawText, source, {
      preferredDomain: activeDomainPref,
      serverId: options?.serverId,
      receivedAt: options?.receivedAt,
    });

    if (!parsedPending) {
      return { status: 'ignored', message: 'Struk tidak dapat dikenali.' };
    }

    persistFingerprints(fp);

    const canAutoCommit =
      !options?.forceQueueOnly && autoCaptureSettings.autoCommitMode === 'auto_save';

    if (canAutoCommit && parsedPending.domain === 'atm_mini' && parsedPending.atmItems) {
      const allHighConfidence =
        parsedPending.atmItems.length > 0 &&
        parsedPending.atmItems.every((it) => it.confidence === 'tinggi' && it.nominal > 0);
      if (allHighConfidence) {
        const logs = commitParsedAtmItems(parsedPending.atmItems, source, false);
        if (options?.serverId) ackServerPendingIds([options.serverId], 'recorded');
        return {
          status: 'recorded',
          recordedCount: logs.length,
          message: `${logs.length} transaksi ATM Mini (${parsedPending.sourceApp}) tercatat otomatis ke Kas & Riwayat!`,
        };
      }
    }

    if (canAutoCommit && parsedPending.domain === 'ppob' && parsedPending.ppobItems) {
      const allHighConfidence =
        parsedPending.ppobItems.length > 0 &&
        parsedPending.ppobItems.every(
          (it) => it.confidence === 'tinggi' && it.sellingPrice > 0 && it.targetNumber.trim().length > 0
        );
      if (allHighConfidence) {
        const logs = commitParsedPpobItems(parsedPending.ppobItems, source, false);
        if (options?.serverId) ackServerPendingIds([options.serverId], 'recorded');
        return {
          status: 'recorded',
          recordedCount: logs.length,
          message: `${logs.length} transaksi PPOB (${parsedPending.sourceApp}) tercatat otomatis ke Kas & Riwayat!`,
        };
      }
    }

    setPendingAutoCaptures((prev) => {
      if (prev.some((p) => p.fingerprint === fp)) return prev;
      return [parsedPending, ...prev].slice(0, 30);
    });

    return {
      status: 'queued',
      message: `Struk dari ${parsedPending.sourceApp} masuk ke Antrean Otomatis untuk 1-tap konfirmasi.`,
    };
  };

  const commitPendingAutoCapture = (
    pendingId: string,
    openReceiptOnSingle: boolean = false
  ): number => {
    const target = pendingAutoCaptures.find((p) => p.id === pendingId);
    if (!target) return 0;

    let count = 0;
    if (target.domain === 'atm_mini' && target.atmItems) {
      count = commitParsedAtmItems(target.atmItems, target.source, openReceiptOnSingle).length;
    } else if (target.domain === 'ppob' && target.ppobItems) {
      count = commitParsedPpobItems(target.ppobItems, target.source, openReceiptOnSingle).length;
    }

    if (target.serverId) {
      ackServerPendingIds([target.serverId], 'recorded');
    }
    setPendingAutoCaptures((prev) => prev.filter((p) => p.id !== pendingId));
    return count;
  };

  const dismissPendingAutoCapture = (pendingId: string) => {
    const target = pendingAutoCaptures.find((p) => p.id === pendingId);
    if (target?.serverId) {
      ackServerPendingIds([target.serverId], 'dismissed');
    }
    setPendingAutoCaptures((prev) => prev.filter((p) => p.id !== pendingId));
  };

  const undoAutoRecordedLog = (logId: string): boolean => {
    const log = autoRecordedLogs.find((l) => l.id === logId);
    if (!log || log.reverted) return false;

    const ok =
      log.domain === 'atm_mini'
        ? revertAtmMiniTransaction(log.txId)
        : revertPPOBTransaction(log.txId);

    if (ok) {
      setAutoRecordedLogs((prev) =>
        prev.map((l) => (l.id === logId ? { ...l, reverted: true } : l))
      );
      setLatestAutoCaptureToast((prev) => (prev?.id === logId ? null : prev));
    }
    return ok;
  };

  const clearAutoRecordedLogs = () => {
    setAutoRecordedLogs([]);
    setLatestAutoCaptureToast(null);
  };

  const checkClipboardNow = async (preferredDomain?: 'atm_mini' | 'ppob') => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
      setClipboardStatus('unsupported');
      return {
        status: 'denied' as const,
        message: 'Browser tidak mendukung baca clipboard otomatis. Gunakan Ctrl+V langsung di layar POS.',
      };
    }

    try {
      const clipText = await navigator.clipboard.readText();
      setClipboardStatus('ready');
      if (!clipText || !clipText.trim()) {
        return { status: 'empty' as const, message: 'Clipboard kosong.' };
      }
      return processIncomingCaptureText(clipText, 'clipboard', { preferredDomain });
    } catch {
      setClipboardStatus('denied');
      return {
        status: 'denied' as const,
        message: 'Izin baca clipboard belum diizinkan browser. Cukup tekan Ctrl+V di mana saja pada menu PPOB/ATM.',
      };
    }
  };

  const testWebhookAutoCapture = async (sampleType: 'atm_mini' | 'ppob') => {
    const storeKey = normalizeWebhookStoreKey(autoCaptureSettings.webhookStoreKey || syncCode);
    const samplePayload =
      sampleType === 'atm_mini'
        ? {
            code: storeKey,
            app: 'BRImo',
            title: 'Transfer Berhasil',
            text: `Transfer ke BCA 8812093812 a.n. Rizky Pratama\nNominal: Rp 350.000\nBiaya Admin: Rp 2.500\nNo. Ref: BR${Date.now().toString().slice(-6)}`,
            domain: 'atm_mini',
          }
        : {
            code: storeKey,
            app: 'OrderKuota',
            title: 'TRX SUKSES',
            text: `TRX SUKSES OrderKuota\nToken Listrik PLN 50.000\nID Pel: 54210987654 a.n. Bu Sari\nModal: Rp 50.250\nSN: 4819-2019-${Date.now().toString().slice(-4)}`,
            domain: 'ppob',
          };

    try {
      const res = await fetch('/api/auto-capture/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samplePayload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, message: json.message || 'Gagal mengirim simulasi webhook.' };
      }

      const result = processIncomingCaptureText(
        `${samplePayload.app}\n${samplePayload.title}\n${samplePayload.text}`,
        'webhook',
        { preferredDomain: sampleType, serverId: json.id }
      );
      return { success: true, message: result.message };
    } catch {
      return { success: false, message: 'Tidak dapat menghubungi endpoint webhook server.' };
    }
  };

  const processCaptureRef = useRef(processIncomingCaptureText);
  processCaptureRef.current = processIncomingCaptureText;

  // Global Paste (Ctrl+V anywhere outside inputs) & Window Focus Clipboard Monitor
  useEffect(() => {
    if (!autoCaptureSettings.autoClipboardEnabled) return;

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const tag = activeEl?.tagName?.toLowerCase();
      const isEditingField =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        Boolean(activeEl?.isContentEditable);
      if (isEditingField) return;

      const pasted = e.clipboardData?.getData('text') || '';
      if (!pasted.trim()) return;
      if (looksLikeTransactionReceipt(pasted)) {
        e.preventDefault();
        processCaptureRef.current(pasted, 'paste');
      }
    };

    const handleWindowFocus = async () => {
      if (document.visibilityState && document.visibilityState !== 'visible') return;
      if (!navigator.clipboard?.readText) return;
      try {
        const text = await navigator.clipboard.readText();
        setClipboardStatus('ready');
        if (text && looksLikeTransactionReceipt(text)) {
          processCaptureRef.current(text, 'clipboard');
        }
      } catch {
        // Silent fallback: browsers may block unprompted background clipboard read
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [autoCaptureSettings.autoClipboardEnabled]);

  // Real Webhook Poller (/api/auto-capture/pending)
  useEffect(() => {
    if (!autoCaptureSettings.webhookEnabled) return;
    const storeKey = normalizeWebhookStoreKey(autoCaptureSettings.webhookStoreKey || syncCode);
    let cancelled = false;

    const pollPending = async () => {
      try {
        const res = await fetch(`/api/auto-capture/pending?code=${encodeURIComponent(storeKey)}`);
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (!json.success || !Array.isArray(json.items) || json.items.length === 0) return;

        for (const srvItem of json.items) {
          if (cancelled) break;
          processCaptureRef.current(srvItem.rawText, 'webhook', {
            preferredDomain: srvItem.domainHint,
            serverId: srvItem.id,
            receivedAt: srvItem.receivedAt,
          });
        }
      } catch {
        // Offline / server unavailable - skip silently
      }
    };

    pollPending();
    const timer = setInterval(pollPending, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [
    autoCaptureSettings.webhookEnabled,
    autoCaptureSettings.webhookStoreKey,
    syncCode,
  ]);

  return (
    <POSContext.Provider
      value={{
        activeTab,
        setActiveTab,
        shift,
        setShift,
        cashierProfiles,
        updateCashierProfile,
        switchCashierRole,
        toggleRole,
        storeProfile,
        updateStoreProfile,
        exitDemoMode,
        enterDemoMode,
        lastSavedTime,
        products,
        transactions,
        categories,
        addCategory,
        deleteCategory,
        importProductsFromExcel,
        exportProductsToExcel,
        downloadExcelTemplate,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        cart,
        addToCart,
        addPPOBToCart,
        addPrintItemToCart,
        addPrintOrderToCart,
        addServiceToCart,
        addAtmMiniToCart,
        addCustomCartItem,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartTotalCount,
        isMasterCartModalOpen,
        setIsMasterCartModalOpen,
        checkoutPOS,
        agencyTransactions,
        recordAgencyTransaction,
        atmMiniTransactions,
        recordAtmMiniTransaction,
        ppobPackages,
        addPPOBPackage,
        updatePPOBPackage,
        deletePPOBPackage,
        ppobTransactions,
        recordPPOBTransaction,
        updatePPOBTransaction,
        deletePPOBTransaction,
        services,
        addServiceTicket,
        updateServiceStatus,
        updateServiceTicket,
        deleteServiceTicket,
        printOrders,
        addPrintOrder,
        updatePrintOrderStatus,
        deletePrintOrder,
        printServices,
        addPrintService,
        updatePrintService,
        deletePrintService,
        resetPrintServices,
        mutations,
        addCashMutation,
        drawerCashBalance,
        updateStartingCash,
        adjustDrawerCash,
        exportCashMutationCSV,
        digitalBalance,
        updateDigitalBalance,
        lastSyncEvent,
        clearLastSyncEvent,
        debts,
        payDebt,
        addDebt,
        returns,
        updateReturnStatus,
        addReturnRecord,
        addProduct,
        updateProduct,
        deleteProduct,
        restockProduct,
        recalculateProductCatalog,
        deduplicateTwinProducts,
        receiptData,
        isReceiptModalOpen,
        openReceipt,
        closeReceipt,
        isShiftModalOpen,
        setIsShiftModalOpen,
        isCashMutationModalOpen,
        setIsCashMutationModalOpen,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        isBottomNavVisible,
        setIsBottomNavVisible,
        toggleBottomNav,
        standardDrawerCash,
        setStandardDrawerCash,
        shiftHistory,
        closeShiftDrawer,
        openNewShift,
        exportBackupJSON,
        importBackupJSON,
        resetAllDemoData,
        syncCode,
        setSyncCode,
        isSyncModalOpen,
        setIsSyncModalOpen,
        isSyncing,
        lastSyncTime,
        syncStatus,
        syncMessage,
        isAutoSyncEnabled,
        generateNewSyncCode,
        pushDataToCloud,
        pullDataFromCloud,
        disconnectSync,
        toggleAutoSync,
        revertAtmMiniTransaction,
        revertPPOBTransaction,
        autoCaptureSettings,
        updateAutoCaptureSettings,
        pendingAutoCaptures,
        autoRecordedLogs,
        latestAutoCaptureToast,
        dismissLatestAutoCaptureToast,
        isAutoCaptureModalOpen,
        setIsAutoCaptureModalOpen,
        clipboardStatus,
        checkClipboardNow,
        processIncomingCaptureText,
        commitPendingAutoCapture,
        dismissPendingAutoCapture,
        undoAutoRecordedLog,
        clearAutoRecordedLogs,
        recordRushLogEntry,
        testWebhookAutoCapture,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) throw new Error('usePOS must be used within a POSProvider');
  return context;
};
