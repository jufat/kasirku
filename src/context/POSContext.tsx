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
    note?: string
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
    note?: string
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
    customerName: string
  ) => PPOBTransaction;
  updatePPOBTransaction: (tx: PPOBTransaction) => void;
  deletePPOBTransaction: (id: string) => void;

  // Service HP
  services: ServiceTicket[];
  addServiceTicket: (
    ticket: Omit<ServiceTicket, 'id' | 'dateIn'>
  ) => ServiceTicket;
  updateServiceStatus: (id: string, newStatus: ServiceTicket['status']) => void;
  deleteServiceTicket: (id: string) => void;

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
    | null;
  isReceiptModalOpen: boolean;
  openReceipt: (
    data:
      | POSTransaction
      | AgencyTransaction
      | ServiceTicket
      | AtmMiniTransaction
      | PPOBTransaction
  ) => void;
  closeReceipt: () => void;
  isShiftModalOpen: boolean;
  setIsShiftModalOpen: (open: boolean) => void;
  isCashMutationModalOpen: boolean;
  setIsCashMutationModalOpen: (open: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;

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
    POSTransaction | AgencyTransaction | ServiceTicket | AtmMiniTransaction | PPOBTransaction | null
  >(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isCashMutationModalOpen, setIsCashMutationModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
    note?: string
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
    }

    // 3. If Hutang/Kasbon, record into Debt Ledger
    if (paymentMethod === 'hutang') {
      const newDebt: DebtRecord = {
        id: `dbt-${Date.now()}`,
        invoiceOrRef: invoiceNo,
        date: new Date().toISOString().slice(0, 10),
        customerName: customerName.trim() || 'Pelanggan Kasbon',
        customerPhone: '-',
        totalAmount: finalTotal,
        paidAmount: 0,
        remainingAmount: finalTotal,
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), // default 7 days
        status: 'belum_lunas',
        note: `Penjualan POS tempo ${invoiceNo}`,
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
    note?: string
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
      status: 'sukses',
      note,
    };

    setAtmMiniTransactions((prev) => [newTx, ...prev]);

    // Auto-Journaling Kas Laci:
    if (type === 'tarik_tunai_atm') {
      // Kas Keluar: uang tunai diserahkan ke nasabah
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

      // Kas Masuk: Jasa Konter Tarik Tunai
      const mutationMasuk: CashMutation = {
        id: `mut-${Date.now()}-in`,
        timestamp: nowTime,
        type: 'masuk',
        category: 'jasa_transfer',
        description: `Laba Jasa Tarik Tunai EDC ${bankName} [${traceNo}] (${customerName})`,
        amount: counterFee,
        paymentMethod: 'tunai',
        runningCashBalance: drawerCashBalance - nominal + counterFee,
        recordedBy: shift.cashierName,
      };

      setMutations((prev) => [mutationMasuk, mutationKeluar, ...prev]);
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
    customerName: string
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
      paymentMethod: 'tunai',
      status: 'sukses',
    };

    setPpobTransactions((prev) => [newTx, ...prev]);

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
    ticketData: Omit<ServiceTicket, 'id' | 'dateIn'>
  ): ServiceTicket => {
    const id = `SRV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newTicket: ServiceTicket = {
      ...ticketData,
      id,
      dateIn: new Date().toLocaleString('id-ID'),
    };

    setServices((prev) => [newTicket, ...prev]);

    // If down payment is given, auto journal to Cash
    if (newTicket.downPayment > 0) {
      const mutation: CashMutation = {
        id: `mut-${Date.now()}`,
        timestamp: nowTime,
        type: 'masuk',
        category: 'service_hp',
        description: `DP Service ${id} (${newTicket.deviceModel} - ${newTicket.customerName})`,
        amount: newTicket.downPayment,
        paymentMethod: 'tunai',
        runningCashBalance: drawerCashBalance + newTicket.downPayment,
        recordedBy: shift.cashierName,
      };
      setMutations((prev) => [mutation, ...prev]);
    }

    setReceiptData(newTicket);
    setIsReceiptModalOpen(true);

    return newTicket;
  };

  const updateServiceStatus = (id: string, newStatus: ServiceTicket['status']) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const wasNotDiambil = s.status !== 'diambil';
          const isNowDiambil = newStatus === 'diambil';

          // If transitioning to diambil, auto-journal the remaining unpaid amount into cash drawer!
          if (wasNotDiambil && isNowDiambil) {
            const remaining = Math.max(0, s.totalCost - s.downPayment);
            if (remaining > 0) {
              const nowTime = new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              });
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
      localStorage.setItem('jufat_debts', JSON.stringify([]));
      localStorage.setItem('jufat_returns', JSON.stringify([]));
      localStorage.setItem('jufat_mutations', JSON.stringify([cleanMutation]));
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
    setMutations(INITIAL_MUTATIONS);
    setDebts(INITIAL_DEBTS);
    setReturns(INITIAL_RETURNS);
    setShift(INITIAL_SHIFT);
    setStoreProfile(INITIAL_STORE_PROFILE);
  };

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
        mutations,
        addCashMutation,
        drawerCashBalance,
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
        closeShiftDrawer,
        openNewShift,
        exportBackupJSON,
        importBackupJSON,
        resetAllDemoData,
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
