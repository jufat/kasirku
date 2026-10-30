import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  POSTransaction,
  AgencyTransaction,
  AtmMiniTransaction,
  PPOBTransaction,
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
  PrintOrderStatus,
  PrintServiceItem,
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
  INITIAL_CATEGORIES,
  INITIAL_PPOB_PACKAGES,
  INITIAL_STORE_PROFILE,
  INITIAL_PRINT_ORDERS,
  PRINT_PRICE_LIST,
} from '../data/initialData';

interface POSContextType {
  // Navigation & Role
  activeTab: string;
  setActiveTab: (tab: string) => void;
  shift: ShiftState;
  setShift: React.Dispatch<React.SetStateAction<ShiftState>>;
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
  addToCart: (product: Product) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTotalCount: number;

  // Checkout & Auto-Journaling
  checkoutPOS: (
    paymentMethod: PaymentMethod,
    cashTendered: number,
    customerName: string,
    discountAmount: number,
    taxPercent: number,
    note?: string,
    customerPhone?: string,
    dueDate?: string
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
    dueDate?: string
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
    note?: string
  ) => PPOBTransaction;
  updatePPOBTransaction: (tx: PPOBTransaction) => void;
  deletePPOBTransaction: (id: string) => void;

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
    note?: string
  ) => void;
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
    note?: string
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

  // Debts & Returns
  debts: DebtRecord[];
  payDebt: (debtId: string, payAmount: number) => void;
  addDebt: (debt: Omit<DebtRecord, 'id' | 'remainingAmount' | 'status'>) => void;
  returns: ReturnRecord[];
  updateReturnStatus: (id: string, newStatus: ReturnRecord['status']) => void;
  addReturnRecord: (ret: Omit<ReturnRecord, 'id' | 'returNo' | 'date'>) => void;

  // Product Catalog Management
  addProduct: (newProd: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  restockProduct: (id: string, addQty: number, newHpp?: number) => void;

  // Categories & Excel Operations
  categories: string[];
  addCategory: (categoryName: string) => boolean;
  deleteCategory: (categoryName: string) => void;
  importProductsFromExcel: (newProds: Omit<Product, 'id'>[]) => number;
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

  // Shift Drawer Closing
  closeShiftDrawer: (actualCash: number, note?: string) => {
    systemCash: number;
    actualCash: number;
    difference: number;
  };
  openNewShift: (startingCash: number, cashierName: string) => void;

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
    const saved = localStorage.getItem('jufat_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
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
      const hasGame = parsed.some((p) => p.category === 'game');
      if (!hasGame) {
        const gamePackages = INITIAL_PPOB_PACKAGES.filter((p) => p.category === 'game');
        const merged = [...parsed, ...gamePackages];
        try {
          localStorage.setItem('jufat_ppob_packages', JSON.stringify(merged));
        } catch {
          // ignore
        }
        return merged;
      }
      return parsed;
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
    return saved ? JSON.parse(saved) : INITIAL_MUTATIONS;
  });

  const [debts, setDebts] = useState<DebtRecord[]>(() => {
    const saved = localStorage.getItem('jufat_debts');
    return saved ? JSON.parse(saved) : INITIAL_DEBTS;
  });

  const [returns, setReturns] = useState<ReturnRecord[]>(() => {
    const saved = localStorage.getItem('jufat_returns');
    return saved ? JSON.parse(saved) : INITIAL_RETURNS;
  });

  const [shift, setShift] = useState<ShiftState>(() => {
    const saved = localStorage.getItem('jufat_shift');
    return saved ? JSON.parse(saved) : INITIAL_SHIFT;
  });

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

  // Cart helper calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const cartTotalCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.product.price - item.discount,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          discount: 0,
          subtotal: product.price,
        },
      ];
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const clampedQty = Math.min(quantity, item.product.stock);
          return {
            ...item,
            quantity: clampedQty,
            subtotal: clampedQty * item.product.price - item.discount,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  // Auto-Journaling Function for Cashier POS
  const checkoutPOS = (
    paymentMethod: PaymentMethod,
    cashTendered: number,
    customerName: string,
    discountAmount: number,
    taxPercent: number,
    note?: string,
    customerPhone?: string,
    dueDate?: string
  ): POSTransaction => {
    const subtotal = cartSubtotal;
    const taxAmount = Math.round((subtotal - discountAmount) * (taxPercent / 100));
    const finalTotal = Math.max(0, subtotal - discountAmount + taxAmount);
    const invoiceNo = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newTx: POSTransaction = {
      id: `tx-${Date.now()}`,
      invoiceNo,
      date: new Date().toLocaleString('id-ID'),
      cashier: shift.cashierName,
      customerName: customerName.trim() || 'Pelanggan Umum',
      items: [...cart],
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: finalTotal,
      paymentMethod,
      cashTendered: paymentMethod === 'tunai' ? cashTendered : finalTotal,
      changeAmount: paymentMethod === 'tunai' ? Math.max(0, cashTendered - finalTotal) : 0,
      type: 'pos_penjualan',
      note,
    };

    // 1. Reduce Stock for each item
    setProducts((prev) =>
      prev.map((p) => {
        const bought = cart.find((c) => c.product.id === p.id);
        if (bought) {
          return { ...p, stock: Math.max(0, p.stock - bought.quantity) };
        }
        return p;
      })
    );

    // 2. Auto-journal to Cash Ledger if Tunai
    if (paymentMethod === 'tunai') {
      const newRunning = drawerCashBalance + finalTotal;
      const newMutation: CashMutation = {
        id: `mut-${Date.now()}`,
        timestamp: nowTime,
        type: 'masuk',
        category: 'penjualan_pos',
        description: `Penjualan Kasir ${invoiceNo} (${cart.length} item: ${cart
          .map((i) => `${i.product.name.slice(0, 15)}..x${i.quantity}`)
          .join(', ')})`,
        amount: finalTotal,
        paymentMethod: 'tunai',
        runningCashBalance: newRunning,
        recordedBy: shift.cashierName,
      };
      setMutations((prev) => [newMutation, ...prev]);
    } else if (paymentMethod === 'qris') {
      const newMutation: CashMutation = {
        id: `mut-${Date.now()}`,
        timestamp: nowTime,
        type: 'masuk',
        category: 'penjualan_pos',
        description: `Penjualan QRIS Kasir ${invoiceNo} (${cart.length} item)`,
        amount: finalTotal,
        paymentMethod: 'non_tunai',
        runningCashBalance: drawerCashBalance,
        recordedBy: shift.cashierName,
      };
      setMutations((prev) => [newMutation, ...prev]);
    }

    // 3. If Hutang/Kasbon, record directly into Debt Ledger
    if (paymentMethod === 'hutang') {
      const newDebt: DebtRecord = {
        id: `dbt-${Date.now()}`,
        invoiceOrRef: invoiceNo,
        date: new Date().toISOString().slice(0, 10),
        customerName: customerName.trim() || 'Pelanggan Kasbon',
        customerPhone: customerPhone?.trim() || '-',
        totalAmount: finalTotal,
        paidAmount: 0,
        remainingAmount: finalTotal,
        dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), // default 7 days
        status: 'belum_lunas',
        note: note?.trim() || `Kasbon Penjualan Kasir ${invoiceNo}`,
      };
      setDebts((prev) => [newDebt, ...prev]);
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

    // Auto-journal counter profit & physical cash in/out:
    // When customer pays cash for transfer: counter gets cash (totalPaid), but bank balances are sent out.
    // In physical cash drawer, the net cash retained is typically the counter fee + nominal (if physical cash received).
    // Ju-Fat Cell auto-journal records:
    // 1. Kas Masuk Fisik (Uang Tunai Diterima dari Pelanggan: Total Bayar)
    // 2. Or simplified counter cash in: Jasa Konter / Laba Bersih
    const newRunning = drawerCashBalance + counterFee;
    const mutation: CashMutation = {
      id: `mut-${Date.now()}`,
      timestamp: nowTime,
      type: 'masuk',
      category: 'jasa_transfer',
      description: `Laba Jasa Agen ${type.replace('_', ' ').toUpperCase()} ${provider} [${refNo}] (${customerName})`,
      amount: counterFee,
      paymentMethod: 'tunai',
      runningCashBalance: newRunning,
      recordedBy: shift.cashierName,
    };
    setMutations((prev) => [mutation, ...prev]);

    setReceiptData(newAgTx);
    setIsReceiptModalOpen(true);

    return newAgTx;
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
    dueDate?: string
  ): AtmMiniTransaction => {
    const traceNo = Math.floor(100000 + Math.random() * 900000).toString();
    const approvalCode = `APPR-${Math.floor(100000 + Math.random() * 900000)}`;
    const totalDebited = nominal + adminEdcFee + counterFee;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newTx: AtmMiniTransaction = {
      id: `atm-${Date.now()}`,
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
      cashHandedOrReceived: type === 'tarik_tunai_atm' ? nominal : totalDebited,
      paymentMethod,
      status: 'sukses',
      note,
    };

    setAtmMiniTransactions((prev) => [newTx, ...prev]);

    // 1. If Kasbon (Hutang), immediately add to Debt Ledger
    if (paymentMethod === 'hutang') {
      const debtAmount = totalDebited;
      const newDebt: DebtRecord = {
        id: `dbt-${Date.now()}`,
        invoiceOrRef: `EDC-${traceNo}`,
        date: new Date().toISOString().slice(0, 10),
        customerName: customerName.trim() || 'Nasabah EDC',
        customerPhone: customerPhone?.trim() || targetAccountOrPhone || '-',
        totalAmount: debtAmount,
        paidAmount: 0,
        remainingAmount: debtAmount,
        dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        status: 'belum_lunas',
        note: `Kasbon Mini ATM ${type.replace(/_/g, ' ').toUpperCase()} [${bankName}] Ref:${traceNo}${note ? ' - ' + note : ''}`,
      };
      setDebts((prev) => [newDebt, ...prev]);
    }

    // 2. Auto-Journaling Kas Laci:
    if (type === 'tarik_tunai_atm') {
      // Kas Keluar: uang tunai diserahkan ke nasabah dari laci
      const mutationKeluar: CashMutation = {
        id: `mut-${Date.now()}-out`,
        timestamp: nowTime,
        type: 'keluar',
        category: 'jasa_transfer',
        description: `Tarik Tunai EDC ${bankName} [${traceNo}] (${customerName}) - Uang diserahkan`,
        amount: nominal,
        paymentMethod: 'tunai',
        runningCashBalance: drawerCashBalance - nominal,
        recordedBy: shift.cashierName,
      };

      // Kas Masuk: Jasa Konter Tarik Tunai (jika tunai) atau non_tunai (jika QRIS)
      if (paymentMethod !== 'hutang') {
        const mutationMasuk: CashMutation = {
          id: `mut-${Date.now()}-in`,
          timestamp: nowTime,
          type: 'masuk',
          category: 'jasa_transfer',
          description: `Laba Jasa Tarik Tunai EDC ${bankName} [${traceNo}] (${customerName})`,
          amount: counterFee,
          paymentMethod: paymentMethod === 'tunai' ? 'tunai' : 'non_tunai',
          runningCashBalance: paymentMethod === 'tunai' ? drawerCashBalance - nominal + counterFee : drawerCashBalance - nominal,
          recordedBy: shift.cashierName,
        };
        setMutations((prev) => [mutationMasuk, mutationKeluar, ...prev]);
      } else {
        setMutations((prev) => [mutationKeluar, ...prev]);
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

      if (paymentMethod === 'tunai') {
        const mutation: CashMutation = {
          id: `mut-${Date.now()}`,
          timestamp: nowTime,
          type: 'masuk',
          category: 'jasa_transfer',
          description: `Laba Jasa Mini ATM ${serviceName} ${bankName} [${traceNo}] (${customerName})`,
          amount: counterFee,
          paymentMethod: 'tunai',
          runningCashBalance: drawerCashBalance + counterFee,
          recordedBy: shift.cashierName,
        };
        setMutations((prev) => [mutation, ...prev]);
      } else if (paymentMethod === 'qris') {
        const mutation: CashMutation = {
          id: `mut-${Date.now()}`,
          timestamp: nowTime,
          type: 'masuk',
          category: 'jasa_transfer',
          description: `Laba Jasa Mini ATM via QRIS ${serviceName} ${bankName} [${traceNo}] (${customerName})`,
          amount: counterFee,
          paymentMethod: 'non_tunai',
          runningCashBalance: drawerCashBalance,
          recordedBy: shift.cashierName,
        };
        setMutations((prev) => [mutation, ...prev]);
      }
    }

    setReceiptData(newTx);
    setIsReceiptModalOpen(true);

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
    note?: string
  ): PPOBTransaction => {
    const refNo = `PPOB-${Date.now().toString().slice(-6)}`;
    const profit = sellingPrice - hpp;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newTx: PPOBTransaction = {
      id: `ppob-${Date.now()}`,
      refNo,
      date: new Date().toLocaleString('id-ID'),
      category,
      provider,
      targetNumber,
      packageName,
      hpp,
      sellingPrice,
      profit,
      customerName: customerName || 'Pelanggan PPOB',
      paymentMethod,
      status: 'sukses',
    };

    setPpobTransactions((prev) => [newTx, ...prev]);

    // 1. If Kasbon (Hutang), immediately add to Debt Ledger
    if (paymentMethod === 'hutang') {
      const newDebt: DebtRecord = {
        id: `dbt-${Date.now()}`,
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
    } else if (paymentMethod === 'tunai') {
      // Auto-journal into Cash Harian
      const mutation: CashMutation = {
        id: `mut-${Date.now()}`,
        timestamp: nowTime,
        type: 'masuk',
        category: 'pulsa_ppob',
        description: `Penjualan ${category.toUpperCase()} ${provider} ${packageName} (${targetNumber})`,
        amount: sellingPrice,
        paymentMethod: 'tunai',
        runningCashBalance: drawerCashBalance + sellingPrice,
        recordedBy: shift.cashierName,
      };
      setMutations((prev) => [mutation, ...prev]);
    } else {
      // QRIS
      const mutation: CashMutation = {
        id: `mut-${Date.now()}`,
        timestamp: nowTime,
        type: 'masuk',
        category: 'pulsa_ppob',
        description: `Penjualan QRIS ${category.toUpperCase()} ${provider} ${packageName} (${targetNumber})`,
        amount: sellingPrice,
        paymentMethod: 'non_tunai',
        runningCashBalance: drawerCashBalance,
        recordedBy: shift.cashierName,
      };
      setMutations((prev) => [mutation, ...prev]);
    }

    setReceiptData(newTx);
    setIsReceiptModalOpen(true);

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
    note?: string
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

              // If payment method is Kasbon (Hutang), directly record to debts!
              if (paymentMethod === 'hutang') {
                const newDebt: DebtRecord = {
                  id: `dbt-${Date.now()}`,
                  invoiceOrRef: s.id,
                  date: new Date().toISOString().slice(0, 10),
                  customerName: s.customerName.trim() || 'Pelanggan Servis',
                  customerPhone: customerPhone?.trim() || s.customerPhone || '-',
                  totalAmount: s.totalCost,
                  paidAmount: s.downPayment,
                  remainingAmount: remaining,
                  dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
                  status: s.downPayment > 0 ? 'cicilan' : 'belum_lunas',
                  note: `Kasbon Pelunasan Servis HP ${s.id} (${s.deviceModel} - ${s.problemDescription})${
                    note ? ' - ' + note : ''
                  }`,
                };
                setDebts((prevDebts) => [newDebt, ...prevDebts]);
              } else if (paymentMethod === 'tunai') {
                const mutation: CashMutation = {
                  id: `mut-${Date.now()}`,
                  timestamp: nowTime,
                  type: 'masuk',
                  category: 'service_hp',
                  description: `Pelunasan Service ${s.id} (${s.deviceModel} - ${s.customerName})`,
                  amount: remaining,
                  paymentMethod: 'tunai',
                  runningCashBalance: drawerCashBalance + remaining,
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
                  amount: remaining,
                  paymentMethod: 'non_tunai',
                  runningCashBalance: drawerCashBalance,
                  recordedBy: shift.cashierName,
                };
                setMutations((prevMut) => [mutation, ...prevMut]);
              }
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
    note?: string
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

              if (paymentMethod === 'hutang') {
                const newDebt: DebtRecord = {
                  id: `dbt-${Date.now()}`,
                  invoiceOrRef: o.id,
                  date: new Date().toISOString().slice(0, 10),
                  customerName: o.customerName.trim() || 'Pelanggan Percetakan',
                  customerPhone: customerPhone?.trim() || o.customerPhone || '-',
                  totalAmount: o.totalAmount,
                  paidAmount: o.downPayment,
                  remainingAmount: remaining,
                  dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
                  status: o.downPayment > 0 ? 'cicilan' : 'belum_lunas',
                  note: `Kasbon Pelunasan Percetakan ${o.id} (${o.items.map((i) => i.serviceName).join(', ')})${
                    note ? ' - ' + note : ''
                  }`,
                };
                setDebts((prevDebts) => [newDebt, ...prevDebts]);
              } else if (paymentMethod === 'tunai') {
                const mutation: CashMutation = {
                  id: `mut-${Date.now()}`,
                  timestamp: nowTime,
                  type: 'masuk',
                  category: 'percetakan',
                  description: `Pelunasan Percetakan ${o.id} (${o.customerName})`,
                  amount: remaining,
                  paymentMethod: 'tunai',
                  runningCashBalance: drawerCashBalance + remaining,
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
                  amount: remaining,
                  paymentMethod: 'non_tunai',
                  runningCashBalance: drawerCashBalance,
                  recordedBy: shift.cashierName,
                };
                setMutations((prevMut) => [mutation, ...prevMut]);
              }
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
  const payDebt = (debtId: string, payAmount: number) => {
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    setDebts((prev) =>
      prev.map((d) => {
        if (d.id === debtId) {
          const newPaid = d.paidAmount + payAmount;
          const newRemain = Math.max(0, d.totalAmount - newPaid);
          const newStatus = newRemain === 0 ? 'lunas' : 'cicilan';

          // Auto-journal into Cash Harian
          const mutation: CashMutation = {
            id: `mut-${Date.now()}`,
            timestamp: nowTime,
            type: 'masuk',
            category: 'piutang_masuk',
            description: `Pembayaran Piutang ${d.customerName} (${d.invoiceOrRef})`,
            amount: payAmount,
            paymentMethod: 'tunai',
            runningCashBalance: drawerCashBalance + payAmount,
            recordedBy: shift.cashierName,
          };
          setMutations((prevMut) => [mutation, ...prevMut]);

          return {
            ...d,
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

  // Product Catalog
  const addProduct = (newProd: Omit<Product, 'id'>) => {
    const product: Product = {
      ...newProd,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [product, ...prev]);
  };

  const updateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const restockProduct = (id: string, addQty: number, newHpp?: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            stock: Math.max(0, p.stock + addQty),
            ...(newHpp && newHpp > 0 ? { hpp: newHpp } : {}),
          };
        }
        return p;
      })
    );
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
  const importProductsFromExcel = (newProds: Omit<Product, 'id'>[]): number => {
    if (newProds.length === 0) return 0;

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

    const generated = newProds.map((p, idx) => ({
      ...p,
      id: `prod-${Date.now()}-${idx}-${Math.floor(100 + Math.random() * 900)}`,
    }));

    setProducts((prev) => [...generated, ...prev]);
    return generated.length;
  };

  const exportProductsToExcel = () => {
    const data = products.map((p) => ({
      'Kode SKU': p.sku,
      'Nama Produk': p.name,
      'Kategori': p.category,
      'HPP (Modal)': p.hpp,
      'Harga Jual': p.price,
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
        'Kode SKU': 'ACC-CHG-33W',
        'Nama Produk': 'Charger 33W Fast Charging Quick Adapter',
        'Kategori': 'Kabel & Charger',
        'HPP (Modal)': 35000,
        'Harga Jual': 55000,
        'Stok': 20,
        'Batas Minimum Stok': 5,
        'Satuan': 'pcs',
        'Barcode': '89910012399',
      },
      {
        'Kode SKU': 'ACC-TWS-MINI',
        'Nama Produk': 'TWS Wireless Bluetooth Earbuds Stereo',
        'Kategori': 'Audio & TWS',
        'HPP (Modal)': 65000,
        'Harga Jual': 110000,
        'Stok': 12,
        'Batas Minimum Stok': 4,
        'Satuan': 'pcs',
        'Barcode': '89910012398',
      },
      {
        'Kode SKU': 'ACC-CASE-CLR',
        'Nama Produk': 'Case Silikon Bening Anti Crack All Tipe',
        'Kategori': 'Case & Pelindung',
        'HPP (Modal)': 7000,
        'Harga Jual': 15000,
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

  // Toggle role between Owner and Staff
  const toggleRole = () => {
    setShift((prev) => ({
      ...prev,
      role: prev.role === 'owner' ? 'kasir' : 'owner',
      cashierName: prev.role === 'owner' ? 'Siti (Kasir Shift 1)' : 'Miftah (Owner)',
      cashierEmail: prev.role === 'owner' ? 'kasir.shift1@jufat.com' : 'miftah2020new@gmail.com',
    }));
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

  // Shift Drawer Closing & Reconciliation
  const closeShiftDrawer = (actualCash: number, note?: string) => {
    const diff = actualCash - drawerCashBalance;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // Record closing mutation
    const mutation: CashMutation = {
      id: `mut-${Date.now()}`,
      timestamp: nowTime,
      type: diff >= 0 ? 'masuk' : 'keluar',
      category: 'modal_shift',
      description: `Tutup Shift ${shift.shiftName} - Kas Terhitung Rp ${actualCash.toLocaleString(
        'id-ID'
      )} (Selisih: Rp ${diff.toLocaleString('id-ID')}) ${note ? `[${note}]` : ''}`,
      amount: Math.abs(diff),
      paymentMethod: 'tunai',
      runningCashBalance: actualCash,
      recordedBy: shift.cashierName,
    };

    if (diff !== 0) {
      setMutations((prev) => [mutation, ...prev]);
    }

    setShift((prev) => ({
      ...prev,
      isOpen: false,
    }));

    return {
      systemCash: drawerCashBalance,
      actualCash,
      difference: diff,
    };
  };

  const openNewShift = (startingCash: number, cashierName: string) => {
    const nextShiftNum = shift.shiftNumber + 1;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newShiftState: ShiftState = {
      shiftNumber: nextShiftNum,
      shiftName: `Shift ${nextShiftNum} (${nextShiftNum % 2 === 1 ? 'Pagi' : 'Sore'})`,
      cashierName,
      cashierEmail: shift.cashierEmail,
      role: shift.role,
      startTime: `${nowTime} WIB`,
      startingCash,
      isOpen: true,
    };

    setShift(newShiftState);

    // Record starting cash mutation
    const mutation: CashMutation = {
      id: `mut-${Date.now()}`,
      timestamp: nowTime,
      type: 'masuk',
      category: 'modal_shift',
      description: `Buka Kas Awal Laci ${newShiftState.shiftName}`,
      amount: startingCash,
      paymentMethod: 'tunai',
      runningCashBalance: startingCash,
      recordedBy: cashierName,
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
      if (data.products) setProducts(data.products);
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
      if (data.products) {
        setProducts(data.products);
        localStorage.setItem('jufat_products', JSON.stringify(data.products));
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

  return (
    <POSContext.Provider
      value={{
        activeTab,
        setActiveTab,
        shift,
        setShift,
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
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartTotalCount,
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
