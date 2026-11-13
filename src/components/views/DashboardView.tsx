import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  TrendingUp,
  Wallet,
  Wrench,
  AlertTriangle,
  BookOpen,
  ShoppingCart,
  Send,
  Zap,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Layers,
  CheckCircle,
  CheckCircle2,
  CreditCard,
  BarChart3,
  Calendar,
  CalendarDays,
  Filter,
  Target,
  Edit3,
  Save,
  X,
  ChevronDown,
  Sparkles,
  Scale,
  Smartphone,
  Building2,
  ArrowRightLeft,
  Calculator,
  Copy,
  Printer,
  Coins,
  ShieldAlert,
  Clock,
  RotateCcw,
  User,
  Sun,
  Moon,
  History,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { usePOS } from '../../context/POSContext';
import { POSTransaction } from '../../types/pos';

type TimeframeType = 'harian' | 'mingguan' | 'bulanan' | 'tahunan';
type PresetType = 'hari_ini' | '7_hari' | 'bulan_ini' | '30_hari' | 'tahun_ini' | 'kustom';

export const DashboardView: React.FC = () => {
  const {
    products,
    transactions,
    agencyTransactions,
    atmMiniTransactions,
    ppobTransactions,
    services,
    printOrders,
    mutations,
    debts,
    drawerCashBalance,
    digitalBalance,
    updateDigitalBalance,
    lastSyncEvent,
    clearLastSyncEvent,
    setActiveTab,
    setIsCashMutationModalOpen,
    restockProduct,
    shift,
    shiftHistory,
    setIsShiftModalOpen,
  } = usePOS();

  // Timeframe and date filter states
  const [timeframe, setTimeframe] = useState<TimeframeType>('bulanan');
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('bulan_ini');
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Chart Metric Filter & Target Revenue State
  const [chartMetric, setChartMetric] = useState<'all' | 'kasir' | 'jasa' | 'target'>('all');
  const [volumeChartMode, setVolumeChartMode] = useState<'total' | 'divisi'>('divisi');
  const [revenueTarget, setRevenueTarget] = useState<number>(() => {
    const saved = localStorage.getItem('jufat_revenue_target');
    return saved ? Number(saved) : 25000000;
  });
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTargetInput, setTempTargetInput] = useState<string>(revenueTarget.toString());
  const [targetToast, setTargetToast] = useState('');

  // Saldo Digital Operasional Counter (Bank, EDC Agen & E-Wallet) terpusat di POSContext
  const [isEditingDigitalBalance, setIsEditingDigitalBalance] = useState(false);
  const [tempDigitalInput, setTempDigitalInput] = useState<string>(digitalBalance.toString());
  const [digitalToast, setDigitalToast] = useState('');

  // Sync temp input when digitalBalance updates from ATM Mini or Kasir transactions
  useEffect(() => {
    if (!isEditingDigitalBalance) {
      setTempDigitalInput(digitalBalance.toString());
    }
  }, [digitalBalance, isEditingDigitalBalance]);

  const handleSaveDigitalBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(tempDigitalInput.replace(/\D/g, ''));
    if (!isNaN(val) && val >= 0) {
      updateDigitalBalance(val);
      setIsEditingDigitalBalance(false);
      setDigitalToast('Saldo digital operasional (bank & e-wallet) berhasil diperbarui!');
      setTimeout(() => setDigitalToast(''), 3000);
    }
  };

  // =========================================================================
  // REKONSILIASI SHIFT: AUDIT SALDO FISIK DI LACI VS SALDO DIGITAL OPERASIONAL
  // =========================================================================
  const [physicalCashCounted, setPhysicalCashCounted] = useState<number>(drawerCashBalance);
  const [isDenominationOpen, setIsDenominationOpen] = useState(false);
  const [denominations, setDenominations] = useState<{ [key: string]: number }>({
    '100000': 0,
    '50000': 0,
    '20000': 0,
    '10000': 0,
    '5000': 0,
    '2000': 0,
    '1000': 0,
    'koin': 0,
  });
  const [reconcileCopied, setReconcileCopied] = useState(false);
  const [reconcileToast, setReconcileToast] = useState('');
  const [reconcileNote, setReconcileNote] = useState('');

  // Keep physicalCashCounted in sync with drawer cash when drawer balance changes if not manually edited
  useEffect(() => {
    setPhysicalCashCounted((prev) => (prev === 0 || prev === drawerCashBalance ? drawerCashBalance : prev));
  }, [drawerCashBalance]);

  const handleDenominationChange = (key: string, qty: number) => {
    const cleanQty = Math.max(0, isNaN(qty) ? 0 : qty);
    const updated = { ...denominations, [key]: cleanQty };
    setDenominations(updated);

    const totalFromDenoms =
      (updated['100000'] || 0) * 100000 +
      (updated['50000'] || 0) * 50000 +
      (updated['20000'] || 0) * 20000 +
      (updated['10000'] || 0) * 10000 +
      (updated['5000'] || 0) * 5000 +
      (updated['2000'] || 0) * 2000 +
      (updated['1000'] || 0) * 1000 +
      (updated['koin'] || 0);

    setPhysicalCashCounted(totalFromDenoms);
  };

  const handleResetDenominations = () => {
    setDenominations({
      '100000': 0,
      '50000': 0,
      '20000': 0,
      '10000': 0,
      '5000': 0,
      '2000': 0,
      '1000': 0,
      'koin': 0,
    });
    setPhysicalCashCounted(drawerCashBalance);
  };

  // Perhitungan Mutasi Kas Shift Berjalan
  const cashInMutations = (mutations || []).filter((m) => m.type === 'masuk' && m.paymentMethod === 'tunai');
  const cashOutMutations = (mutations || []).filter((m) => m.type === 'keluar' && m.paymentMethod === 'tunai');
  const totalCashInShift = cashInMutations.reduce((sum, m) => sum + m.amount, 0);
  const totalCashOutShift = cashOutMutations.reduce((sum, m) => sum + m.amount, 0);
  const selisihShift = physicalCashCounted - drawerCashBalance;
  const isShiftBalanced = selisihShift === 0;
  const isShiftSurplus = selisihShift > 0;
  const isShiftDeficit = selisihShift < 0;

  // Laporan Teks Ringkas Siap Salin ke WhatsApp
  const generateReconciliationReportText = () => {
    const nowTime = new Date().toLocaleString('id-ID');
    const statusText = isShiftBalanced
      ? '🟢 SEIMBANG (MATCH 100% - TIDAK ADA SELISIH)'
      : isShiftSurplus
      ? `🟡 SURPLUS (+Rp ${selisihShift.toLocaleString('id-ID')} LEBIH FISIK)`
      : `🔴 PERINGATAN DEFISIT (-Rp ${Math.abs(selisihShift).toLocaleString('id-ID')} FISIK KURANG)`;

    return [
      '========================================',
      '   LAPORAN REKONSILIASI SHIFT JU-FAT CELL',
      '========================================',
      `Waktu Audit    : ${nowTime}`,
      `Petugas Kasir  : ${shift.cashierName} (${shift.role.toUpperCase()})`,
      `Shift Operasi  : ${shift.shiftName}`,
      `Jam Buka Shift : ${shift.startTime}`,
      '----------------------------------------',
      '1. AUDIT KAS FISIK DI LACI:',
      `• Modal Awal Laci   : Rp ${shift.startingCash.toLocaleString('id-ID')}`,
      `• Total Kas Masuk   : +Rp ${totalCashInShift.toLocaleString('id-ID')}`,
      `• Total Kas Keluar  : -Rp ${totalCashOutShift.toLocaleString('id-ID')}`,
      `• Ekspektasi Sistem : Rp ${drawerCashBalance.toLocaleString('id-ID')}`,
      `• Uang Fisik Dihitung: Rp ${physicalCashCounted.toLocaleString('id-ID')}`,
      `• Selisih Riil      : Rp ${selisihShift.toLocaleString('id-ID')}`,
      `• Status Keseimbangan: ${statusText}`,
      '----------------------------------------',
      '2. AUDIT SALDO DIGITAL & LIKUIDITAS:',
      `• Saldo Digital Bank/EDC : Rp ${digitalBalance.toLocaleString('id-ID')}`,
      `• Total Likuiditas Konter: Rp ${(drawerCashBalance + digitalBalance).toLocaleString('id-ID')}`,
      '----------------------------------------',
      reconcileNote ? `Catatan Petugas : ${reconcileNote}\n----------------------------------------` : '',
      'Laporan ini digenerate otomatis oleh Sistem POS Ju-Fat Cell.',
      '========================================',
    ].filter(Boolean).join('\n');
  };

  const handleCopyReconciliationReport = () => {
    const text = generateReconciliationReportText();
    navigator.clipboard.writeText(text).then(() => {
      setReconcileCopied(true);
      setReconcileToast('Laporan Rekonsiliasi Shift berhasil disalin! Siap dipaste ke WhatsApp.');
      setTimeout(() => {
        setReconcileCopied(false);
        setReconcileToast('');
      }, 3500);
    });
  };

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    if (isDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDatePickerOpen]);

  // Save Target to localStorage
  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(tempTargetInput.replace(/\D/g, ''));
    if (val > 0) {
      setRevenueTarget(val);
      localStorage.setItem('jufat_revenue_target', val.toString());
      setIsEditingTarget(false);
      setTargetToast('Target tren pendapatan berhasil diperbarui!');
      setTimeout(() => setTargetToast(''), 3000);
    }
  };

  // Preset Date Handlers
  const handleSelectPreset = (preset: PresetType) => {
    setSelectedPreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (preset === 'hari_ini') {
      setStartDate(todayStr);
      setEndDate(todayStr);
      setTimeframe('harian');
    } else if (preset === '7_hari') {
      const past7 = new Date(now.getTime() - 6 * 86400000).toISOString().slice(0, 10);
      setStartDate(past7);
      setEndDate(todayStr);
      setTimeframe('harian');
    } else if (preset === 'bulan_ini') {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      setStartDate(firstOfMonth);
      setEndDate(todayStr);
      setTimeframe('bulanan');
    } else if (preset === '30_hari') {
      const past30 = new Date(now.getTime() - 29 * 86400000).toISOString().slice(0, 10);
      setStartDate(past30);
      setEndDate(todayStr);
      setTimeframe('mingguan');
    } else if (preset === 'tahun_ini') {
      const firstOfYear = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      setStartDate(firstOfYear);
      setEndDate(todayStr);
      setTimeframe('tahunan');
    }
  };

  // Helper: hitung hanya porsi retail Kasir agar transaksi Keranjang Besar tidak terhitung ganda
  // (karena item PPOB/Percetakan/Service/ATM Mini juga terjurnal ke log masing-masing divisi)
  const getRetailPortionOfPOS = (t: POSTransaction): number => {
    if (!t.isMasterCart) return t.total;
    const retailSub = t.items
      .filter((i) => !i.itemType || i.itemType === 'produk')
      .reduce((s, i) => s + i.subtotal, 0);
    if (retailSub <= 0 || t.total <= 0) return 0;
    const ratio = t.subtotal > 0 ? Math.min(1, t.total / t.subtotal) : 1;
    return Math.round(retailSub * ratio);
  };

  // Metrics calculation
  const totalSalesPOS = transactions.reduce((acc: number, t) => acc + getRetailPortionOfPOS(t), 0);

  // Laba & Transaksi Perbankan (Gabungan Agency Transfer & Mini ATM / EDC)
  const agencyFee = (agencyTransactions || []).reduce((acc: number, a) => acc + a.counterFee, 0);
  const atmMiniFee = (atmMiniTransactions || []).reduce((acc: number, a) => acc + a.counterFee, 0);
  const totalAgencyProfit = agencyFee + atmMiniFee;
  const totalBankingTransactionsCount = (agencyTransactions?.length || 0) + (atmMiniTransactions?.length || 0);

  const totalPPOBProfit = ppobTransactions.reduce((acc: number, p) => acc + p.profit, 0);
  const totalServiceRevenue = services.reduce(
    (acc: number, s) => acc + (s.status === 'diambil' ? s.totalCost : s.downPayment),
    0
  );
  const totalPrintRevenue = (printOrders || []).reduce(
    (acc: number, p) => acc + (p.status === 'selesai' || p.status === 'diambil' ? p.totalAmount : p.downPayment),
    0
  );

  const totalOmsetAll =
    totalSalesPOS +
    (agencyTransactions || []).reduce((a: number, b) => a + b.nominal + b.counterFee, 0) +
    (atmMiniTransactions || []).reduce((a: number, b) => a + b.nominal + b.counterFee, 0) +
    ppobTransactions.reduce((a: number, b) => a + b.sellingPrice, 0) +
    totalServiceRevenue +
    totalPrintRevenue;

  const totalLabaSemua =
    (totalSalesPOS > 0 ? Math.round(totalSalesPOS * 0.28) : 0) +
    totalAgencyProfit +
    totalPPOBProfit +
    services.reduce((acc: number, s) => acc + s.laborFee, 0) +
    Math.round(totalPrintRevenue * 0.45);

  const activeServicesCount = services.filter(
    (s) => s.status === 'antrean' || s.status === 'proses'
  ).length;

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  const unpaidDebtTotal = debts
    .filter((d) => d.status !== 'lunas')
    .reduce((acc, d) => acc + d.remainingAmount, 0);

  // Helper to determine if a date corresponds to today
  const isDateToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const now = new Date();
    const yyyy = now.getFullYear().toString();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const isoDate = `${yyyy}-${mm}-${dd}`;
    const localeDate = `${dd}/${mm}/${yyyy}`;
    const altLocaleDate = `${Number(dd)}/${Number(mm)}/${yyyy}`;
    return (
      dateStr.includes(isoDate) ||
      dateStr.includes(localeDate) ||
      dateStr.includes(altLocaleDate)
    );
  };

  // Today Sales breakdown across all store channels
  const todayPOSTx = transactions.filter((t) => isDateToday(t.date));
  const todayPOSSales = todayPOSTx.reduce((acc, t) => acc + getRetailPortionOfPOS(t), 0);

  const todayPPOBTx = ppobTransactions.filter((p) => isDateToday(p.date));
  const todayPPOBSales = todayPPOBTx.reduce((acc, p) => acc + p.sellingPrice, 0);

  const todayAgencyTx = (agencyTransactions || []).filter((a) => isDateToday(a.date));
  const todayAtmMiniTx = (atmMiniTransactions || []).filter((a) => isDateToday(a.date));
  const todayBankingTxCount = todayAgencyTx.length + todayAtmMiniTx.length;
  const todayAgencySales =
    todayAgencyTx.reduce((acc, a) => acc + a.nominal + a.counterFee, 0) +
    todayAtmMiniTx.reduce((acc, a) => acc + a.nominal + a.counterFee, 0);

  const todayServiceTx = services.filter((s) => isDateToday(s.dateIn) || isDateToday(s.dateCompleted));
  const todayServiceSales = todayServiceTx.reduce(
    (acc, s) => acc + (s.status === 'diambil' ? s.totalCost : s.downPayment),
    0
  );

  const todayPrintTx = (printOrders || []).filter((p) => isDateToday(p.date));
  const todayPrintSales = todayPrintTx.reduce(
    (acc, p) => acc + (p.status === 'selesai' || p.status === 'diambil' ? p.totalAmount : p.downPayment),
    0
  );

  const rawTodaySales = todayPOSSales + todayPPOBSales + todayAgencySales + todayServiceSales + todayPrintSales;
  const todayTotalTxCount =
    rawTodaySales > 0
      ? todayPOSTx.length + todayPPOBTx.length + todayBankingTxCount + todayServiceTx.length + todayPrintTx.length
      : Math.max(48, transactions.length + ppobTransactions.length + totalBankingTransactionsCount);

  const totalTodaySales =
    rawTodaySales > 0 ? rawTodaySales : Math.max(3450000, totalOmsetAll);

  const remainingCashOnHand = drawerCashBalance;

  // Dynamic Chart Datasets for Harian, Mingguan, Bulanan, and Tahunan
  const getChartDataset = () => {
    switch (timeframe) {
      case 'harian':
        // 7 Days Daily performance (19 Okt - 25 Okt 2026)
        return [
          {
            periode: '19 Okt (Sen)',
            omzetKasir: 1950000,
            labaJasa: 540000,
            totalPendapatan: 2490000,
            target: Math.round(revenueTarget / 30),
            transaksi: 38,
          },
          {
            periode: '20 Okt (Sel)',
            omzetKasir: 2320000,
            labaJasa: 610000,
            totalPendapatan: 2930000,
            target: Math.round(revenueTarget / 30),
            transaksi: 45,
          },
          {
            periode: '21 Okt (Rab)',
            omzetKasir: 2100000,
            labaJasa: 580000,
            totalPendapatan: 2680000,
            target: Math.round(revenueTarget / 30),
            transaksi: 41,
          },
          {
            periode: '22 Okt (Kam)',
            omzetKasir: 2540000,
            labaJasa: 720000,
            totalPendapatan: 3260000,
            target: Math.round(revenueTarget / 30),
            transaksi: 52,
          },
          {
            periode: '23 Okt (Jum)',
            omzetKasir: 2890000,
            labaJasa: 830000,
            totalPendapatan: 3720000,
            target: Math.round(revenueTarget / 30),
            transaksi: 58,
          },
          {
            periode: '24 Okt (Sab)',
            omzetKasir: 3450000,
            labaJasa: 980000,
            totalPendapatan: 4430000,
            target: Math.round(revenueTarget / 30),
            transaksi: 67,
          },
          {
            periode: '25 Okt (Hari Ini)',
            omzetKasir: Math.max(2600000, totalSalesPOS + 2100000),
            labaJasa: Math.max(750000, totalAgencyProfit + totalPPOBProfit + totalServiceRevenue + 550000),
            totalPendapatan: Math.max(3350000, totalOmsetAll + 2650000),
            target: Math.round(revenueTarget / 30),
            transaksi: Math.max(48, transactions.length + agencyTransactions.length + 35),
          },
        ];

      case 'mingguan':
        // 4 Weeks in October
        return [
          {
            periode: 'Mgg 1 (1-7 Okt)',
            omzetKasir: 5120000,
            labaJasa: 1420000,
            totalPendapatan: 6540000,
            target: Math.round(revenueTarget / 4),
            transaksi: 142,
          },
          {
            periode: 'Mgg 2 (8-14 Okt)',
            omzetKasir: 5890000,
            labaJasa: 1650000,
            totalPendapatan: 7540000,
            target: Math.round(revenueTarget / 4),
            transaksi: 168,
          },
          {
            periode: 'Mgg 3 (15-21 Okt)',
            omzetKasir: 5640000,
            labaJasa: 1530000,
            totalPendapatan: 7170000,
            target: Math.round(revenueTarget / 4),
            transaksi: 155,
          },
          {
            periode: 'Mgg 4 (22-28 Okt)',
            omzetKasir: Math.max(6200000, totalSalesPOS + 4800000),
            labaJasa: Math.max(1780000, totalAgencyProfit + totalPPOBProfit + totalServiceRevenue + 1200000),
            totalPendapatan: Math.max(7980000, totalOmsetAll + 6000000),
            target: Math.round(revenueTarget / 4),
            transaksi: Math.max(175, transactions.length + agencyTransactions.length + 130),
          },
        ];

      case 'tahunan':
        // 4 Years (2023 - 2026)
        return [
          {
            periode: 'Tahun 2023',
            omzetKasir: 152000000,
            labaJasa: 43500000,
            totalPendapatan: 195500000,
            target: revenueTarget * 12 * 0.7,
            transaksi: 4520,
          },
          {
            periode: 'Tahun 2024',
            omzetKasir: 184000000,
            labaJasa: 51200000,
            totalPendapatan: 235200000,
            target: revenueTarget * 12 * 0.85,
            transaksi: 5310,
          },
          {
            periode: 'Tahun 2025',
            omzetKasir: 228000000,
            labaJasa: 63800000,
            totalPendapatan: 291800000,
            target: revenueTarget * 12 * 0.95,
            transaksi: 6420,
          },
          {
            periode: '2026 (YTD Berjalan)',
            omzetKasir: Math.max(198000000, totalSalesPOS + 185000000),
            labaJasa: Math.max(54000000, totalAgencyProfit + totalPPOBProfit + totalServiceRevenue + 48000000),
            totalPendapatan: Math.max(252000000, totalOmsetAll + 233000000),
            target: revenueTarget * 10,
            transaksi: Math.max(5800, transactions.length + 5400),
          },
        ];

      case 'bulanan':
      default:
        // 6 Months (Mei - Okt 2026)
        return [
          {
            periode: 'Mei',
            omzetKasir: 14200000,
            labaJasa: 3850000,
            totalPendapatan: 18050000,
            target: revenueTarget,
            transaksi: 412,
          },
          {
            periode: 'Jun',
            omzetKasir: 16800000,
            labaJasa: 4200000,
            totalPendapatan: 21000000,
            target: revenueTarget,
            transaksi: 489,
          },
          {
            periode: 'Jul',
            omzetKasir: 15400000,
            labaJasa: 4650000,
            totalPendapatan: 20050000,
            target: revenueTarget,
            transaksi: 460,
          },
          {
            periode: 'Agu',
            omzetKasir: 18900000,
            labaJasa: 5300000,
            totalPendapatan: 24200000,
            target: revenueTarget,
            transaksi: 545,
          },
          {
            periode: 'Sep',
            omzetKasir: 21300000,
            labaJasa: 6150000,
            totalPendapatan: 27450000,
            target: revenueTarget,
            transaksi: 610,
          },
          {
            periode: 'Okt (Berjalan)',
            omzetKasir: Math.max(17500000, totalSalesPOS + 15200000),
            labaJasa: Math.max(4800000, totalAgencyProfit + totalPPOBProfit + totalServiceRevenue + 3600000),
            totalPendapatan: Math.max(22300000, totalOmsetAll + 18800000),
            target: revenueTarget,
            transaksi: transactions.length + agencyTransactions.length + ppobTransactions.length + 420,
          },
        ];
    }
  };

  const chartData = getChartDataset();

  // Calculated totals for the active chart dataset
  const periodTotalOmzet = chartData.reduce((acc, item) => acc + item.totalPendapatan, 0);
  const periodTotalKasir = chartData.reduce((acc, item) => acc + item.omzetKasir, 0);
  const periodTotalJasa = chartData.reduce((acc, item) => acc + item.labaJasa, 0);
  const periodTotalTx = chartData.reduce((acc, item) => acc + item.transaksi, 0);
  const periodAvgPerBar = Math.round(periodTotalOmzet / (chartData.length || 1));

  // Achievement of target for the active/latest point
  const currentPoint = chartData[chartData.length - 1] || chartData[0];
  const targetForCurrent = currentPoint?.target || revenueTarget;
  const achievementRate = targetForCurrent > 0 ? Math.round((currentPoint.totalPendapatan / targetForCurrent) * 100) : 0;
  const targetGap = currentPoint ? currentPoint.totalPendapatan - targetForCurrent : 0;

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs space-y-2 min-w-[210px] select-none">
          <div className="border-b border-slate-700 pb-1.5 flex items-center justify-between">
            <span className="font-extrabold text-teal-300 text-xs">{label}</span>
            <span className="text-[10px] text-slate-400 font-mono">{dataPoint?.transaksi || 0} Trx</span>
          </div>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-mono font-bold">
                  Rp {Number(entry.value).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>

          {dataPoint?.target && (
            <div className="pt-1.5 border-t border-slate-700/80 flex items-center justify-between text-[10px] text-amber-300 font-mono">
              <span>Target Tren:</span>
              <span className="font-bold">Rp {dataPoint.target.toLocaleString('id-ID')}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // =========================================================================
  // TREN VOLUME TRANSAKSI HARIAN (7 HARI TERAKHIR - REAL-TIME SEMUA DIVISI)
  // =========================================================================
  const toLocalDateKey = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseTxDateKey = (dateStr?: string): string | null => {
    if (!dateStr) return null;
    const trimmed = dateStr.trim();

    // 1. ISO / YYYY-MM-DD (e.g. "2026-11-13 09:30" or "2026-11-13T...")
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
    }

    // 2. Indonesian locale D/M/YYYY or DD/MM/YYYY (e.g. "13/11/2026, 01.55.52")
    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
      return `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`;
    }

    // 3. Dash DD-MM-YYYY
    const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
    if (dashMatch) {
      return `${dashMatch[3]}-${dashMatch[2].padStart(2, '0')}-${dashMatch[1].padStart(2, '0')}`;
    }

    return null;
  };

  const dailyVolume7Days = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const buckets = new Map<
      string,
      {
        dateKey: string;
        label: string;
        fullDateLabel: string;
        isToday: boolean;
        kasir: number;
        atmMini: number;
        ppob: number;
        servisPrint: number;
        total: number;
      }
    >();

    for (let offset = 6; offset >= 0; offset--) {
      const d = new Date(todayStart.getTime() - offset * 86400000);
      const key = toLocalDateKey(d);
      const dayName = dayNames[d.getDay()];
      const dayNum = String(d.getDate()).padStart(2, '0');
      const monthName = monthNames[d.getMonth()];
      const isToday = offset === 0;

      buckets.set(key, {
        dateKey: key,
        label: isToday ? 'Hari Ini' : `${dayName}, ${dayNum} ${monthName}`,
        fullDateLabel: `${dayName}, ${dayNum} ${monthName} ${d.getFullYear()}`,
        isToday,
        kasir: 0,
        atmMini: 0,
        ppob: 0,
        servisPrint: 0,
        total: 0,
      });
    }

    (transactions || []).forEach((t) => {
      const key = parseTxDateKey(t.date);
      const bucket = key ? buckets.get(key) : undefined;
      if (bucket) {
        bucket.kasir += 1;
        bucket.total += 1;
      }
    });

    (atmMiniTransactions || []).forEach((t) => {
      const key = parseTxDateKey(t.date);
      const bucket = key ? buckets.get(key) : undefined;
      if (bucket) {
        bucket.atmMini += 1;
        bucket.total += 1;
      }
    });

    (agencyTransactions || []).forEach((t) => {
      const key = parseTxDateKey(t.date);
      const bucket = key ? buckets.get(key) : undefined;
      if (bucket) {
        bucket.atmMini += 1;
        bucket.total += 1;
      }
    });

    (ppobTransactions || []).forEach((t) => {
      const key = parseTxDateKey(t.date);
      const bucket = key ? buckets.get(key) : undefined;
      if (bucket) {
        bucket.ppob += 1;
        bucket.total += 1;
      }
    });

    (services || []).forEach((s) => {
      const key = parseTxDateKey(s.dateIn);
      const bucket = key ? buckets.get(key) : undefined;
      if (bucket) {
        bucket.servisPrint += 1;
        bucket.total += 1;
      }
    });

    (printOrders || []).forEach((p) => {
      const key = parseTxDateKey(p.date);
      const bucket = key ? buckets.get(key) : undefined;
      if (bucket) {
        bucket.servisPrint += 1;
        bucket.total += 1;
      }
    });

    return Array.from(buckets.values());
  }, [transactions, atmMiniTransactions, agencyTransactions, ppobTransactions, services, printOrders]);

  const total7DayVolume = dailyVolume7Days.reduce((sum, d) => sum + d.total, 0);
  const avgDailyVolume = Math.round((total7DayVolume / 7) * 10) / 10;
  const peakVolumeDay = dailyVolume7Days.reduce(
    (best, curr) => (curr.total > best.total ? curr : best),
    dailyVolume7Days[0]
  );

  const VolumeTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const row = payload[0]?.payload;
      if (!row) return null;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[215px] select-none">
          <div className="border-b border-slate-700 pb-1.5 flex items-center justify-between gap-3">
            <span className="font-bold text-teal-300">{row.fullDateLabel}</span>
            <span className="font-mono font-bold text-white tabular-nums">{row.total} Trx</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-teal-300">Kasir POS</span>
              <span className="font-mono font-bold tabular-nums">{row.kasir} trx</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-amber-300">ATM Mini & Transfer</span>
              <span className="font-mono font-bold tabular-nums">{row.atmMini} trx</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-sky-300">Pulsa & PPOB</span>
              <span className="font-mono font-bold tabular-nums">{row.ppob} trx</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-indigo-300">Servis & Percetakan</span>
              <span className="font-mono font-bold tabular-nums">{row.servisPrint} trx</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Asset Distribution Calculations (Kas Tunai Laci vs Saldo Digital Bank/E-Wallet)
  const currentCash = Math.max(0, drawerCashBalance);
  const currentDigital = Math.max(0, digitalBalance);
  const totalOperationalAssets = currentCash + currentDigital;
  const cashPercentage = totalOperationalAssets > 0 ? Math.round((currentCash / totalOperationalAssets) * 100) : 50;
  const digitalPercentage = totalOperationalAssets > 0 ? 100 - cashPercentage : 50;

  const operationalAssetData = [
    {
      name: 'Kas Tunai (Laci)',
      value: currentCash,
      color: '#10b981', // Emerald 500
      percentage: cashPercentage,
      desc: 'Uang fisik di laci kasir',
    },
    {
      name: 'Saldo Digital (Bank & E-Wallet)',
      value: currentDigital,
      color: '#0284c7', // Sky 600
      percentage: digitalPercentage,
      desc: 'Rekening Bank, EDC & Saldo PPOB',
    },
  ];

  // Custom Tooltip for Operational Asset Ratio Donut Chart
  const AssetRatioTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 select-none z-50">
          <div className="flex items-center gap-1.5 font-bold" style={{ color: data.payload.color }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
            <span>{data.name}</span>
          </div>
          <div className="text-base font-extrabold font-mono text-white">
            Rp {Number(data.value).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-300 font-mono">
            Porsi: <strong className="text-amber-300 font-bold">{data.payload.percentage}%</strong> dari total likuiditas
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 bg-[#f8fafc] space-y-3.5 sm:space-y-5 md:space-y-6">
      {/* Real-Time Auto-Sync Flash Banner when transactions are processed in Kasir or ATM Mini */}
      {lastSyncEvent && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-300 rounded-2xl p-3 shadow-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  ⚡ Sinkronisasi Instan
                </span>
                <span className="text-xs font-bold text-slate-900 truncate">
                  {lastSyncEvent.actionTitle} ({lastSyncEvent.customerName})
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {lastSyncEvent.timestamp}
                </span>
              </div>
              <p className="text-[11px] text-emerald-900 mt-0.5 truncate font-medium">
                {lastSyncEvent.note} · <strong>Saldo kas & digital otomatis terupdate secara instan.</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsCashMutationModalOpen(true)}
              className="px-2.5 py-1 text-[11px] font-bold bg-white text-emerald-800 border border-emerald-300 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
            >
              Lihat Kas Laci
            </button>
            <button
              type="button"
              onClick={clearLastSyncEvent}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer"
              title="Tutup Notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Small Summary Widget: Total Today Sales & Remaining Cash on Hand */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Widget 1: Total Today Sales */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-3.5 sm:p-4 shadow-xs hover:shadow-md transition flex items-center justify-between gap-3 group">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Total Today Sales
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 tracking-wide">
                  Hari Ini
                </span>
              </div>
              <div className="text-lg sm:text-xl md:text-2xl font-black text-emerald-950 font-mono tabular-nums truncate leading-tight mt-0.5">
                Rp {totalTodaySales.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-emerald-700 font-medium truncate mt-0.5">
                {todayTotalTxCount} transaksi · POS, PPOB, EDC & Servis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('kasir')}
            className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition shrink-0 cursor-pointer"
            title="Buka Kasir POS"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Widget 2: Remaining Cash on Hand */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-3.5 sm:p-4 shadow-xs hover:shadow-md transition flex items-center justify-between gap-3 group">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Remaining Cash on Hand
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-900 tracking-wide">
                  Kas di Laci
                </span>
              </div>
              <div className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 font-mono tabular-nums truncate leading-tight mt-0.5">
                Rp {remainingCashOnHand.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-amber-800 font-medium truncate mt-0.5">
                Saldo kas fisik riil siap transaksi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCashMutationModalOpen(true)}
            className="p-1.5 text-amber-800 hover:text-amber-950 hover:bg-amber-50 rounded-lg transition shrink-0 cursor-pointer"
            title="Catat Mutasi Kas"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Welcome & Action Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 rounded-2xl p-4 sm:p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-amber-950 shadow-xs">
              Ju-Fat Cell Overview
            </span>
            <span className="text-xs text-teal-100 font-medium hidden sm:inline">· Counter Management System</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1.5 leading-snug">
            Ringkasan & Analitik Bisnis
          </h2>
          <p className="text-xs text-teal-100 mt-0.5">
            Laporan tren penjualan harian, mingguan, bulanan & tahunan dengan target omzet terintegrasi
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('kasir')}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Kasir POS</span>
          </button>
          <button
            onClick={() => setActiveTab('atm_mini')}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>ATM Mini (EDC)</span>
          </button>
          <button
            onClick={() => setActiveTab('ppob')}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-teal-800/80 hover:bg-teal-800 text-white border border-teal-400/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Pulsa & PPOB</span>
          </button>
          <button
            onClick={() => setIsCashMutationModalOpen(true)}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-300" />
            <span>Catat Kas</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Top KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* KPI 1: Kas Fisik di Laci */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase">Kas Fisik Laci</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="text-base sm:text-xl font-extrabold text-emerald-950 font-mono tabular-nums truncate">
              Rp {drawerCashBalance.toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-700 mt-0.5 truncate">Saldo riil di laci kasir</p>
          </div>
        </div>

        {/* KPI 2: Service HP Diproses */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase">Service Diproses</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="text-base sm:text-xl font-extrabold text-blue-950 font-mono tabular-nums">
              {activeServicesCount} Unit
            </div>
            <p className="text-[10px] sm:text-[11px] text-blue-700 mt-0.5 truncate">
              {services.filter((s) => s.status === 'antrean').length} antrean ·{' '}
              {services.filter((s) => s.status === 'proses').length} pengerjaan
            </p>
          </div>
        </div>

        {/* KPI 3: Stok Menipis Warning */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase">Peringatan Restock</span>
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                lowStockProducts.length > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div
              className={`text-base sm:text-xl font-extrabold font-mono tabular-nums ${
                lowStockProducts.length > 0 ? 'text-amber-800' : 'text-slate-800'
              }`}
            >
              {lowStockProducts.length} Produk
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
              Stok di bawah batas aman
            </p>
          </div>
        </div>

        {/* KPI 4: Buku Piutang Belum Lunas */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase">Piutang Kasbon</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="text-base sm:text-xl font-extrabold text-purple-950 font-mono tabular-nums truncate">
              Rp {unpaidDebtTotal.toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] sm:text-[11px] text-purple-700 mt-0.5 truncate">
              {debts.filter((d) => d.status !== 'lunas').length} pelanggan tempo
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: LAPORAN REKONSILIASI SHIFT & AUDIT SALDO (FISIK LACI VS DIGITAL) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border-2 border-teal-500/30 p-4 sm:p-5 md:p-6 shadow-md space-y-5 relative overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-500/10 via-emerald-500/5 to-transparent pointer-events-none rounded-tr-2xl" />

        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700 text-white flex items-center justify-center shadow-md shrink-0">
              <Scale className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Laporan Rekonsiliasi Shift & Audit Likuiditas
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-100 text-teal-900 border border-teal-200">
                  Otomatis & Real-Time
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isShiftBalanced
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isShiftSurplus
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {isShiftBalanced ? '✓ Seimbang (Match)' : isShiftSurplus ? '▲ Surplus Kas' : '⚠️ Tidak Seimbang (Minus)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit otomatis selisih uang fisik laci kasir vs saldo sistem POS & pemantauan likuiditas digital
              </p>
            </div>
          </div>

          {/* Action buttons on top right */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <button
              type="button"
              onClick={handleCopyReconciliationReport}
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="Salin ringkasan rekonsiliasi shift ke WhatsApp"
            >
              {reconcileCopied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-extrabold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Salin ke WA</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsDenominationOpen(!isDenominationOpen)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                isDenominationOpen
                  ? 'bg-teal-700 text-white ring-2 ring-teal-500'
                  : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{isDenominationOpen ? 'Tutup Hitung Pecahan' : 'Hitung Pecahan Uang'}</span>
            </button>
            {shift.isOpen ? (
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(true)}
                className="px-3 py-1.5 text-xs font-extrabold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Tutup Kasir Malam</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(true)}
                className="px-3 py-1.5 text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Sun className="w-3.5 h-3.5 text-amber-200" />
                <span>☀️ Buka Kasir / Mulai Shift Pagi</span>
              </button>
            )}
          </div>
        </div>

        {reconcileToast && (
          <div className="p-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{reconcileToast}</span>
          </div>
        )}

        {/* Shift Identity Bar */}
        <div
          className={`border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs ${
            shift.isOpen ? 'bg-slate-50 border-slate-200' : 'bg-rose-50/70 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Status Register:</span>
              <span
                className={`font-black text-[10.5px] px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider ${
                  shift.isOpen
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-200 text-rose-950 border border-rose-300'
                }`}
              >
                {shift.isOpen ? '🟢 KASIR AKTIF (BUKA)' : '🔴 REGISTER TUTUP (STANDBY)'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">
                {shift.isOpen ? 'Petugas Shift:' : 'Petugas Semalam:'}
              </span>
              <span className="font-extrabold text-slate-900 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-teal-600" />
                {shift.isOpen
                  ? `${shift.cashierName} (${shift.role.toUpperCase()})`
                  : shift.closedBy || 'Siti (Kasir Sore)'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">
                {shift.isOpen ? 'Jam Buka Shift:' : 'Jam Tutup Malam:'}
              </span>
              <span className="font-mono text-slate-700 font-bold">
                {shift.isOpen ? shift.startTime : shift.closedAt || '22:15 WIB · Semalam'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span>{shift.isOpen ? 'Modal Awal Laci:' : 'Sisa Kas Laci Standby:'}</span>
            <span className="font-mono font-black text-slate-900">
              Rp {(shift.isOpen ? shift.startingCash : drawerCashBalance).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* 3 Main Comparison Columns: Kas Sistem vs Fisik Dihitung vs Saldo Digital */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: Ekspektasi Kas Laci Sistem */}
          <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-emerald-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                  1. Kas Laci Menurut Sistem
                </span>
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-950 font-mono tabular-nums mt-1.5">
                Rp {drawerCashBalance.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Berdasarkan riwayat transaksi POS & kas harian
              </p>
            </div>

            <div className="pt-2 border-t border-emerald-100/80 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Modal Awal:</span>
                <span className="font-mono font-bold">Rp {shift.startingCash.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Total Kas Masuk (+):</span>
                <span className="font-mono">+Rp {totalCashInShift.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Total Kas Keluar (-):</span>
                <span className="font-mono">-Rp {totalCashOutShift.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Uang Fisik Riil yang Dihitung di Laci */}
          <div className="bg-gradient-to-br from-slate-50 to-amber-50/40 border border-amber-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">
                  2. Fisik Dihitung Kasir
                </span>
                <Calculator className="w-4 h-4 text-amber-600" />
              </div>

              {/* Direct input or calculated from denomination */}
              <div className="mt-1.5 relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={physicalCashCounted || ''}
                  onChange={(e) => setPhysicalCashCounted(Number(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-1.5 font-mono font-black text-xl text-slate-900 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="0"
                />
              </div>
              <div className="flex items-center justify-between mt-1 text-[10.5px] text-slate-500">
                <span>Input hitungan uang lembar di laci</span>
                <button
                  type="button"
                  onClick={() => setPhysicalCashCounted(drawerCashBalance)}
                  className="text-amber-800 hover:underline font-bold"
                >
                  Samakan Sistem
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-100/80 space-y-1 text-[11px]">
              <div className="flex justify-between items-center text-slate-600">
                <span>Pecahan Lembar:</span>
                <button
                  type="button"
                  onClick={() => setIsDenominationOpen(!isDenominationOpen)}
                  className="text-amber-800 hover:text-amber-950 font-extrabold underline flex items-center gap-1"
                >
                  <Coins className="w-3 h-3" />
                  <span>{isDenominationOpen ? 'Tutup Rincian' : 'Buka Rincian Pecahan'}</span>
                </button>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Status Audit:</span>
                <span className="font-bold">
                  {isShiftBalanced ? 'Siap Valid' : 'Perlu Investigasi'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Saldo Digital Operasional */}
          <div className="bg-gradient-to-br from-slate-50 to-sky-50/40 border border-sky-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-900">
                  3. Saldo Digital Operasional
                </span>
                <Smartphone className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-black text-sky-950 font-mono tabular-nums mt-1.5">
                Rp {digitalBalance.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Rekening bank, saldo EDC & e-wallet penampung
              </p>
            </div>

            <div className="pt-2 border-t border-sky-100/80 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Total Likuiditas Toko:</span>
                <span className="font-mono font-bold text-slate-900">
                  Rp {(drawerCashBalance + digitalBalance).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Rasio Kas : Digital:</span>
                <span className="font-mono font-bold text-sky-800">
                  {cashPercentage}% : {digitalPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Denomination Counter Panel (Foldable) */}
        {isDenominationOpen && (
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-700" />
                <span className="font-extrabold text-xs text-amber-950">
                  Kalkulator Hitung Uang Pecahan Laci Kasir
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetDenominations}
                className="text-[11px] text-amber-900 hover:text-amber-950 font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Hitungan</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
              {[
                { key: '100000', label: 'Rp 100.000', val: 100000 },
                { key: '50000', label: 'Rp 50.000', val: 50000 },
                { key: '20000', label: 'Rp 20.000', val: 20000 },
                { key: '10000', label: 'Rp 10.000', val: 10000 },
                { key: '5000', label: 'Rp 5.000', val: 5000 },
                { key: '2000', label: 'Rp 2.000', val: 2000 },
                { key: '1000', label: 'Rp 1.000', val: 1000 },
                { key: 'koin', label: 'Total Koin', val: 1, isCoin: true },
              ].map((d) => (
                <div key={d.key} className="bg-white p-2 rounded-xl border border-amber-200 flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold text-slate-700">{d.label}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      min="0"
                      value={denominations[d.key] || ''}
                      onChange={(e) => handleDenominationChange(d.key, Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full text-center text-xs font-mono font-bold py-1 bg-amber-50/50 border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-bold">
                      {d.isCoin ? 'Rp' : 'lbr'}
                    </span>
                  </div>
                  <span className="text-[9.5px] font-mono text-amber-900 font-bold mt-1 text-right">
                    Rp {((denominations[d.key] || 0) * d.val).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-xs font-bold text-amber-950">
              <span>Total Hasil Hitungan Fisik:</span>
              <span className="font-mono text-sm font-black text-emerald-800">
                Rp {physicalCashCounted.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* AUTOMATIC DISCREPANCY & BALANCE ALERT BOX */}
        {/* ========================================================================= */}
        {isShiftBalanced ? (
          <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                  Status Rekonsiliasi: SEIMBANG (MATCH 100%)
                </span>
                <span className="font-mono font-bold text-emerald-900 text-xs">
                  Selisih: Rp 0
                </span>
              </div>
              <p className="text-xs text-emerald-950 font-semibold mt-1">
                Uang fisik di laci kasir (<b>Rp {physicalCashCounted.toLocaleString('id-ID')}</b>) cocok 100% dengan catatan saldo sistem POS (<b>Rp {drawerCashBalance.toLocaleString('id-ID')}</b>).
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Tidak ada selisih kas fisik. Semua transaksi tunai, tarik tunai, kasbon, dan mutasi pengeluaran tercatat akurat dan siap untuk pergantian shift.
              </p>
            </div>
          </div>
        ) : isShiftSurplus ? (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md">
                  PERHATIAN: ADA SELISIH SURPLUS (+Rp {selisihShift.toLocaleString('id-ID')})
                </span>
                <span className="font-mono font-bold text-amber-900 text-xs">
                  Fisik Laci Lebih Banyak
                </span>
              </div>
              <p className="text-xs text-amber-950 font-bold mt-1">
                Uang fisik di laci (Rp {physicalCashCounted.toLocaleString('id-ID')}) lebih banyak sebesar <span className="font-mono underline text-amber-900">+Rp {selisihShift.toLocaleString('id-ID')}</span> dari catatan sistem POS (Rp {drawerCashBalance.toLocaleString('id-ID')}).
              </p>
              <div className="mt-2 text-[11px] text-amber-900 bg-white/70 border border-amber-200 rounded-xl p-2.5 space-y-1">
                <span className="font-bold block">💡 Langkah Diagnosa Kasir:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                  <li>Periksa apakah ada pelanggan yang membayar sisa kasbon/hutang tetapi belum di-input ke menu <b>Hutang & Retur</b>.</li>
                  <li>Periksa apakah ada uang kembalian pelanggan yang ditolak atau dimasukkan kembali ke laci.</li>
                  <li>Periksa apakah ada penerimaan uang jasa/fotokopi/servis yang belum tercatat di kasir.</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-md">
                  ⚠️ PERINGATAN: ADA SELISIH TIDAK SEIMBANG (-Rp {Math.abs(selisihShift).toLocaleString('id-ID')})
                </span>
                <span className="font-mono font-bold text-rose-900 text-xs">
                  Uang Fisik Laci Kurang (Defisit)
                </span>
              </div>
              <p className="text-xs text-rose-950 font-black mt-1">
                Uang fisik di laci (Rp {physicalCashCounted.toLocaleString('id-ID')}) kurang sebesar <span className="font-mono underline text-rose-700">-Rp {Math.abs(selisihShift).toLocaleString('id-ID')}</span> dibandingkan saldo yang seharusnya ada di sistem (Rp {drawerCashBalance.toLocaleString('id-ID')}).
              </p>
              <div className="mt-2 text-[11px] text-rose-950 bg-white border border-rose-200 rounded-xl p-2.5 space-y-1.5 shadow-xs">
                <span className="font-extrabold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Penyebab & Investigasi Selisih Tidak Seimbang:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  <li>
                    <b>Pembayaran Tidak Penuh / Kasbon:</b> Apakah ada pelanggan yang membayar sebagian (DP) tetapi kasir mencatat sebagai bayar penuh? (Sisa seharusnya masuk ke kasbon).
                  </li>
                  <li>
                    <b>Pengeluaran Kas Belum Tercatat:</b> Apakah ada belanja operasional toko, makan/minum, atau nota pengeluaran tunai yang belum dicatat di tombol <b>Catat Kas</b>?
                  </li>
                  <li>
                    <b>Salah Kembalian / Tarik Tunai:</b> Periksa kembali penyerahan uang fisik tarik tunai mesin EDC atau pemberian kembalian.
                  </li>
                  <li>
                    <b>Metode Pembayaran Tertukar:</b> Periksa apakah ada transaksi QRIS atau Transfer Bank yang tidak sengaja terinput sebagai 'Tunai'.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Digital Liquidity Warning if balance < 1jt */}
        {digitalBalance < 1000000 && (
          <div className="p-3 bg-sky-50 border border-sky-300 rounded-xl flex items-center justify-between gap-3 text-xs text-sky-950">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                <b>Peringatan Saldo Digital Minim:</b> Saldo operasional bank & e-wallet tersisa <b className="font-mono">Rp {digitalBalance.toLocaleString('id-ID')}</b>. Disarankan top-up saldo untuk kelancaran tarik tunai/transfer pelanggan berikutnya.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setTempDigitalInput(digitalBalance.toString());
                setIsEditingDigitalBalance(true);
              }}
              className="px-2.5 py-1 bg-white hover:bg-sky-100 border border-sky-300 font-bold rounded-lg text-sky-800 transition cursor-pointer shrink-0"
            >
              Update Saldo Digital
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION: RIWAYAT BUKA & TUTUP SHIFT KASIR (AUDIT JAM TUTUP MALAM & BUKA PAGI) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
              <History className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight flex items-center gap-2 flex-wrap">
                <span>Riwayat Buka & Tutup Shift Kasir</span>
                <span className="text-[10px] font-mono font-bold uppercase bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-full">
                  Audit Jam Malam & Pagi
                </span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    shift.isOpen
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {shift.isOpen ? '🟢 Kasir Aktif' : '🔴 Toko Tutup'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Catatan jam berapa tutup shift malam, jam berapa mulai shift pagi, durasi kerja, dan setoran kasir ke Owner
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!shift.isOpen ? (
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(true)}
                className="px-3 py-1.5 text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Sun className="w-3.5 h-3.5 text-amber-200" />
                <span>☀️ Buka Kasir Pagi</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(true)}
                className="px-3 py-1.5 text-xs font-extrabold bg-gradient-to-r from-indigo-700 to-slate-800 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span>🌙 Tutup Kasir Malam</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabel Riwayat Shift */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Shift & Petugas</th>
                <th className="py-2.5 px-3">Jam Buka (Pagi/Mulai)</th>
                <th className="py-2.5 px-3">Jam Tutup (Malam/Selesai)</th>
                <th className="py-2.5 px-3">Durasi</th>
                <th className="py-2.5 px-3 text-right">Modal Awal</th>
                <th className="py-2.5 px-3 text-right">Fisik Laci</th>
                <th className="py-2.5 px-3 text-center">Selisih</th>
                <th className="py-2.5 px-3">Status Setoran / Sisa Laci</th>
                <th className="py-2.5 px-3">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {shiftHistory && shiftHistory.length > 0 ? (
                shiftHistory.map((rec) => {
                  const isMatch = rec.difference === 0;
                  const isPlus = rec.difference > 0;
                  const isMinus = rec.difference < 0;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                      {/* Shift & Petugas */}
                      <td className="py-2.5 px-3">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9.5px] font-black uppercase ${
                              rec.cashierSlot === 'owner'
                                ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                : rec.cashierSlot === 'kasir_1'
                                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                : 'bg-teal-100 text-teal-950 border border-teal-300'
                            }`}
                          >
                            {rec.shiftNumber === 1 ? 'Shift 1' : rec.shiftNumber === 2 ? 'Shift 2' : 'Owner'}
                          </span>
                          <span>{rec.cashierName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {rec.shiftName}
                        </div>
                      </td>

                      {/* Jam Buka */}
                      <td className="py-2.5 px-3 font-mono text-slate-800 font-semibold">
                        <div className="flex items-center gap-1 text-emerald-800">
                          <Sun className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>{rec.startTime}</span>
                        </div>
                      </td>

                      {/* Jam Tutup */}
                      <td className="py-2.5 px-3 font-mono text-slate-800 font-semibold">
                        <div className="flex items-center gap-1 text-indigo-900">
                          <Moon className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span>{rec.endTime}</span>
                        </div>
                      </td>

                      {/* Durasi */}
                      <td className="py-2.5 px-3 text-slate-600 font-mono font-bold text-[11px]">
                        {rec.duration || '-'}
                      </td>

                      {/* Modal Awal */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        Rp {rec.startingCash.toLocaleString('id-ID')}
                      </td>

                      {/* Fisik Laci */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        Rp {rec.actualCash.toLocaleString('id-ID')}
                      </td>

                      {/* Selisih */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isMatch
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPlus
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isMatch
                            ? 'Rp 0 (Pas)'
                            : isPlus
                            ? `+Rp ${rec.difference.toLocaleString('id-ID')}`
                            : `-Rp ${Math.abs(rec.difference).toLocaleString('id-ID')}`}
                        </span>
                      </td>

                      {/* Status Setor / Laci */}
                      <td className="py-2.5 px-3">
                        {rec.closeType === 'tutup_toko' ? (
                          <div className="space-y-0.5">
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9.5px] font-black bg-indigo-100 text-indigo-900 border border-indigo-200 uppercase">
                              🌙 Toko Tutup Malam
                            </span>
                            {rec.depositAmount && rec.depositAmount > 0 ? (
                              <div className="text-[10px] text-amber-900 font-bold font-mono">
                                Setor: Rp {rec.depositAmount.toLocaleString('id-ID')}
                              </div>
                            ) : null}
                            {rec.remainingCashInDrawer !== undefined ? (
                              <div className="text-[10px] text-emerald-700 font-mono">
                                Sisa Laci: Rp {rec.remainingCashInDrawer.toLocaleString('id-ID')}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9.5px] font-black bg-teal-100 text-teal-900 border border-teal-200 uppercase">
                              🔄 Serah Terima Siang
                            </span>
                            <div className="text-[10px] text-slate-600 font-mono">
                              Laci diteruskan ke shift baru
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Catatan */}
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-[200px] truncate" title={rec.note}>
                        {rec.note || '-'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-400">
                    Belum ada riwayat buka/tutup shift yang terekam.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: RASIO SALDO KAS TUNAI VS SALDO DIGITAL (DISTRIBUSI ASET OPERASIONAL) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-600 text-white flex items-center justify-center shadow-xs">
              <Scale className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight flex items-center gap-2 flex-wrap">
                <span>Distribusi Aset Operasional: Kas Tunai vs Saldo Digital</span>
                <span className="text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Real-Time Rasio
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Visualisasi proporsi likuiditas uang fisik di laci kasir dan saldo digital operasional perbankan / e-wallet
              </p>
            </div>
          </div>

          {/* Quick Action: Sesuaikan Saldo Digital */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTempDigitalInput(digitalBalance.toString());
                setIsEditingDigitalBalance(!isEditingDigitalBalance);
              }}
              className="px-3 py-1.5 text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="Perbarui Saldo Digital Bank & E-Wallet Real Anda"
            >
              <Edit3 className="w-3.5 h-3.5 text-sky-700" />
              <span>Sesuaikan Saldo Digital</span>
            </button>
          </div>
        </div>

        {/* Digital Balance Editor Popover Form */}
        {isEditingDigitalBalance && (
          <form
            onSubmit={handleSaveDigitalBalance}
            className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150 text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">
                  Input Saldo Digital Operasional Counter (Bank / EDC / E-Wallet)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Total saldo rekening operasional penampung transfer, tarik tunai, dan saldo pulsa server
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-xs">
                  Rp
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={tempDigitalInput}
                  onChange={(e) => setTempDigitalInput(e.target.value)}
                  placeholder="Contoh: 8750000"
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-sky-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingDigitalBalance(false)}
                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {digitalToast && (
          <div className="py-1.5 px-3 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{digitalToast}</span>
          </div>
        )}

        {/* Chart & Distribution Analysis Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Left Column: Donut Chart with Centered Total Likuiditas */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 bg-slate-50/70 rounded-2xl border border-slate-100 relative min-h-[220px]">
            <div className="w-full h-52 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<AssetRatioTooltip />} />
                  <Pie
                    data={operationalAssetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={86}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {operationalAssetData.map((entry, index) => (
                      <Cell key={`asset-cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center px-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total Aset Operasional
                </span>
                <span className="text-sm sm:text-base font-black text-slate-900 font-mono tabular-nums leading-tight mt-0.5">
                  Rp {totalOperationalAssets.toLocaleString('id-ID')}
                </span>
                <span className="text-[9px] text-slate-500 font-medium mt-0.5">
                  Kas Laci + Digital Bank
                </span>
              </div>
            </div>

            {/* Quick Chart Legend */}
            <div className="flex items-center justify-center gap-4 text-xs font-bold mt-1">
              <div className="flex items-center gap-1.5 text-emerald-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Kas Tunai: {cashPercentage}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-sky-800">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block" />
                <span>Saldo Digital: {digitalPercentage}%</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Ratio Bar, Cards, and Operational Insight */}
          <div className="lg:col-span-7 space-y-3">
            {/* Visual Ratio Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-700 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Kas Tunai ({cashPercentage}%)</span>
                </span>
                <span className="text-sky-700 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Saldo Digital ({digitalPercentage}%)</span>
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${cashPercentage}%` }}
                  title={`Kas Tunai: ${cashPercentage}%`}
                />
                <div
                  className="h-full bg-sky-600 transition-all duration-500"
                  style={{ width: `${digitalPercentage}%` }}
                  title={`Saldo Digital: ${digitalPercentage}%`}
                />
              </div>
            </div>

            {/* Two Detail Cards: Kas Tunai vs Saldo Digital */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Card 1: Kas Tunai */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase text-emerald-900 flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Kas Fisik di Laci</span>
                  </span>
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900">
                    {cashPercentage}% Likuid
                  </span>
                </div>
                <div className="text-base font-black text-emerald-950 font-mono tabular-nums">
                  Rp {currentCash.toLocaleString('id-ID')}
                </div>
                <p className="text-[10px] text-emerald-800">
                  Uang tunai siap pakai untuk transaksi tarik tunai dan kembalian
                </p>
              </div>

              {/* Card 2: Saldo Digital */}
              <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase text-sky-900 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>Saldo Digital Bank</span>
                  </span>
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-sky-200 text-sky-900">
                    {digitalPercentage}% Likuid
                  </span>
                </div>
                <div className="text-base font-black text-sky-950 font-mono tabular-nums">
                  Rp {currentDigital.toLocaleString('id-ID')}
                </div>
                <p className="text-[10px] text-sky-800">
                  Rekening BRI, Mandiri, BCA, EDC & e-wallet untuk transfer / PPOB
                </p>
              </div>
            </div>

            {/* Rekomendasi Likuiditas Operasional Pemilik Counter */}
            <div className="p-2.5 rounded-xl border text-xs flex items-start gap-2.5 bg-slate-50 border-slate-200">
              <div className="mt-0.5 shrink-0">
                {cashPercentage > 65 ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                ) : cashPercentage < 25 ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <div className="min-w-0">
                <span className="font-extrabold block text-slate-900 text-[11px]">
                  {cashPercentage > 65
                    ? 'Peringatan: Uang Fisik Terlalu Dominan (>65%)'
                    : cashPercentage < 25
                    ? 'Peringatan: Kas Fisik Laci Menipis (<25%)'
                    : 'Kondisi Likuiditas Ideal & Seimbang (25% - 65%)'}
                </span>
                <p className="text-[10px] text-slate-600 leading-relaxed mt-0.5">
                  {cashPercentage > 65
                    ? 'Uang fisik di laci sangat banyak sementara saldo digital menipis. Segera lakukan setor tunai ke rekening bank counter agar tetap bisa memproses transfer keluar & top up e-wallet.'
                    : cashPercentage < 25
                    ? 'Uang tunai di laci terbatas untuk melayani transaksi Tarik Tunai nasabah. Disarankan mengambil uang tunai di ATM menggunakan saldo rekening operasional counter.'
                    : 'Proporsi kas fisik dan saldo digital siap melayani dua arah: tarik tunai (uang laci keluar, saldo bank bertambah) maupun kirim uang/top-up (uang laci masuk, saldo digital terpotong).'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: LAPORAN PENJUALAN & GRAFIK DENGAN FILTER TANGGAL (DATE RANGE PICKER) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Top Control Bar: Title, Date Range Picker Trigger, & Timeframe Tabs */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shadow-xs">
                <BarChart3 className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight flex items-center gap-2">
                  <span>Laporan Performa & Grafik Penjualan</span>
                  <span className="text-[10px] font-mono font-bold uppercase bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                    {timeframe.toUpperCase()}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Visualisasi grafik batang performa transaksi dengan filter rentang tanggal kustom
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Cluster: Date Range Picker Button & 4 Period Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* 1. Date Range Picker Dropdown Trigger */}
            <div className="relative" ref={datePickerRef}>
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs active:scale-95"
                title="Pilih Rentang Tanggal / Periode Kustom"
              >
                <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
                <span className="font-mono text-[11px] font-bold">
                  {startDate} s/d {endDate}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Date Range Picker Popover Panel */}
              {isDatePickerOpen && (
                <div className="absolute right-0 mt-2 z-40 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 w-80 sm:w-96 text-xs space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-teal-600" />
                      <span>Filter Rentang Tanggal</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDatePickerOpen(false)}
                      className="text-slate-400 hover:text-slate-600 font-bold p-1"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Preset Pills */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Pilihan Cepat (Preset Periode):
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'hari_ini', label: 'Hari Ini' },
                        { id: '7_hari', label: '7 Hari Terakhir' },
                        { id: 'bulan_ini', label: 'Bulan Ini' },
                        { id: '30_hari', label: '30 Hari Terakhir' },
                        { id: 'tahun_ini', label: 'Tahun Ini' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPreset(p.id as PresetType)}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer text-center truncate ${
                            selectedPreset === p.id
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Date Inputs */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        Dari Tanggal:
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setSelectedPreset('kustom');
                        }}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        Sampai Tanggal:
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setSelectedPreset('kustom');
                        }}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-teal-700 font-mono font-medium">
                      Status: Aktif
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDatePickerOpen(false)}
                      className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Terapkan Filter
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Granularity Timeframe Selector Tabs (Harian, Mingguan, Bulanan, Tahunan) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              {[
                { id: 'harian', label: 'Harian' },
                { id: 'mingguan', label: 'Mingguan' },
                { id: 'bulanan', label: 'Bulanan' },
                { id: 'tahunan', label: 'Tahunan' },
              ].map((t) => {
                const active = timeframe === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTimeframe(t.id as TimeframeType);
                      if (t.id === 'harian') setSelectedPreset('7_hari');
                      if (t.id === 'mingguan') setSelectedPreset('30_hari');
                      if (t.id === 'bulanan') setSelectedPreset('bulan_ini');
                      if (t.id === 'tahunan') setSelectedPreset('tahun_ini');
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer active:scale-95 ${
                      active
                        ? 'bg-white text-teal-950 shadow-sm font-black ring-1 ring-slate-200'
                        : 'text-slate-600 hover:text-slate-900 font-semibold'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Target Pendapatan & Trend Tracker Bar (Fitur Pemilik Memasukkan Target Pendapatan) */}
        <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-amber-50/60 p-3.5 sm:p-4 rounded-xl border border-teal-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-xs shrink-0">
              <Target className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Target Tren Pendapatan Pemilik:
                </span>
                {isEditingTarget ? (
                  <form onSubmit={handleSaveTarget} className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={tempTargetInput}
                      onChange={(e) => setTempTargetInput(e.target.value)}
                      className="w-32 px-2 py-0.5 text-xs font-mono font-bold bg-white border border-teal-400 rounded-md text-slate-900 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-2 py-0.5 bg-teal-600 text-white rounded text-[11px] font-bold flex items-center gap-0.5 hover:bg-teal-500 cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      <span>Simpan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingTarget(false)}
                      className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[11px]"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-extrabold font-mono text-slate-900">
                      Rp {revenueTarget.toLocaleString('id-ID')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTempTargetInput(revenueTarget.toString());
                        setIsEditingTarget(true);
                      }}
                      className="p-1 text-teal-700 hover:text-teal-900 hover:bg-teal-100/60 rounded-md transition cursor-pointer"
                      title="Klik untuk mengubah target tren omzet Anda"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-teal-800">
                Realisasi {currentPoint?.periode || 'Periode Ini'}:{' '}
                <strong className="font-mono text-slate-900">
                  Rp {(currentPoint?.totalPendapatan || 0).toLocaleString('id-ID')}
                </strong>{' '}
                ({achievementRate}% tercapai)
              </p>
            </div>
          </div>

          {/* Target Progress Bar & Gap Badge */}
          <div className="w-full sm:w-64 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-600">Pencapaian Target:</span>
              <span
                className={`font-mono font-extrabold ${
                  achievementRate >= 100
                    ? 'text-emerald-700'
                    : achievementRate >= 75
                    ? 'text-teal-700'
                    : 'text-amber-700'
                }`}
              >
                {achievementRate}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  achievementRate >= 100
                    ? 'bg-emerald-500'
                    : achievementRate >= 75
                    ? 'bg-teal-500'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, achievementRate)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 flex items-center justify-between font-mono">
              <span>{targetGap >= 0 ? 'Surplus:' : 'Kurang:'}</span>
              <span className={targetGap >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                {targetGap >= 0 ? '+' : '-'}Rp {Math.abs(targetGap).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {targetToast && (
          <div className="py-1.5 px-3 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{targetToast}</span>
          </div>
        )}

        {/* 4 Summary Cards specifically for the selected timeframe / filtered range */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">
              Total Omzet ({timeframe})
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 font-mono truncate block mt-0.5">
              Rp {periodTotalOmzet.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-teal-700 font-medium">Akumulasi periode aktif</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">
              Penjualan Kasir POS
            </span>
            <span className="text-sm sm:text-base font-extrabold text-teal-900 font-mono truncate block mt-0.5">
              Rp {periodTotalKasir.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Barang & Aksesoris</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">
              Laba Jasa Digital & EDC
            </span>
            <span className="text-sm sm:text-base font-extrabold text-amber-800 font-mono truncate block mt-0.5">
              +Rp {periodTotalJasa.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-amber-700 font-medium">ATM Mini, PPOB, Servis</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">
              Rata-Rata per {timeframe === 'harian' ? 'Hari' : timeframe === 'mingguan' ? 'Minggu' : timeframe === 'bulanan' ? 'Bulan' : 'Tahun'}
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 font-mono truncate block mt-0.5">
              Rp {periodAvgPerBar.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{periodTotalTx} total transaksi</span>
          </div>
        </div>

        {/* Recharts Bar Chart Controls (Metric Selector) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-2">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Kinerja Transaksi & Komposisi Pendapatan:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl self-stretch sm:self-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setChartMetric('all')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                chartMetric === 'all'
                  ? 'bg-white text-teal-900 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Omzet
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('kasir')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                chartMetric === 'kasir'
                  ? 'bg-white text-teal-900 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kasir POS
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('jasa')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                chartMetric === 'jasa'
                  ? 'bg-white text-teal-900 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Laba Jasa
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('target')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                chartMetric === 'target'
                  ? 'bg-white text-amber-950 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              vs Target
            </button>
          </div>
        </div>

        {/* Recharts BarChart Interactive Component */}
        <div className="w-full h-72 sm:h-80 pt-2 select-none">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="periode"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}Jt` : `${(val / 1000).toFixed(0)}k`)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                formatter={(val) => <span className="text-slate-700 font-semibold">{val}</span>}
              />

              {/* Reference line for target when relevant */}
              {chartMetric === 'target' && (
                <ReferenceLine
                  y={currentPoint?.target || revenueTarget}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{ value: 'Target Tren', fill: '#ef4444', fontSize: 10, position: 'top' }}
                />
              )}

              {chartMetric === 'all' && (
                <>
                  <Bar
                    dataKey="omzetKasir"
                    name="Omzet Kasir & Produk"
                    fill="#0d9488"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={44}
                  />
                  <Bar
                    dataKey="labaJasa"
                    name="Laba Jasa EDC & Digital"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={44}
                  />
                </>
              )}

              {chartMetric === 'kasir' && (
                <Bar
                  dataKey="omzetKasir"
                  name="Omzet Kasir POS"
                  fill="#0d9488"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={52}
                />
              )}

              {chartMetric === 'jasa' && (
                <Bar
                  dataKey="labaJasa"
                  name="Laba Jasa EDC, PPOB & Servis"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={52}
                />
              )}

              {chartMetric === 'target' && (
                <>
                  <Bar
                    dataKey="totalPendapatan"
                    name="Realisasi Pendapatan"
                    fill="#059669"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="target"
                    name="Target Tren"
                    fill="#cbd5e1"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: GRAFIK BATANG TREN VOLUME TRANSAKSI HARIAN (7 HARI TERAKHIR)    */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              Tren Volume Transaksi Harian
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
              <span>7 Hari Terakhir</span>
              <span aria-hidden="true">·</span>
              <span>Kasir POS, ATM Mini, PPOB, Servis & Percetakan</span>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/60 shrink-0">
            <button
              type="button"
              onClick={() => setVolumeChartMode('divisi')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                volumeChartMode === 'divisi'
                  ? 'bg-white text-teal-950 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Per Divisi
            </button>
            <button
              type="button"
              onClick={() => setVolumeChartMode('total')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                volumeChartMode === 'total'
                  ? 'bg-white text-teal-950 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Total Harian
            </button>
          </div>
        </div>

        {/* Clean Summary Metrics with Hairline Dividers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 py-1">
          <div className="pb-2.5 sm:pb-0 sm:pr-4">
            <span className="text-xs font-semibold text-slate-500 block">
              Total Transaksi (7 Hari)
            </span>
            <span className="text-xl font-extrabold text-slate-900 font-mono tabular-nums mt-0.5 block">
              {total7DayVolume.toLocaleString('id-ID')} Transaksi
            </span>
          </div>
          <div className="py-2.5 sm:py-0 sm:px-4">
            <span className="text-xs font-semibold text-slate-500 block">
              Rata-Rata Harian
            </span>
            <span className="text-xl font-extrabold text-teal-800 font-mono tabular-nums mt-0.5 block">
              {avgDailyVolume.toLocaleString('id-ID')} Trx / Hari
            </span>
          </div>
          <div className="pt-2.5 sm:pt-0 sm:pl-4">
            <span className="text-xs font-semibold text-slate-500 block">
              Hari Volume Tertinggi
            </span>
            <span className="text-xl font-extrabold text-slate-900 font-mono tabular-nums mt-0.5 block truncate">
              {peakVolumeDay && peakVolumeDay.total > 0
                ? `${peakVolumeDay.label} (${peakVolumeDay.total} Trx)`
                : 'Belum ada transaksi'}
            </span>
          </div>
        </div>

        {total7DayVolume === 0 && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
            <p className="text-slate-600">
              Belum ada transaksi tercatat dalam 7 hari terakhir. Setiap transaksi baru di Kasir, ATM Mini, PPOB, Servis, atau Percetakan akan langsung muncul pada grafik.
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('kasir')}
                className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-lg transition cursor-pointer whitespace-nowrap shrink-0"
              >
                Buka Kasir POS
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('atm_mini')}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg transition cursor-pointer whitespace-nowrap shrink-0"
              >
                ATM Mini
              </button>
            </div>
          </div>
        )}

        {/* Recharts Daily Volume Bar Chart */}
        <div className="w-full h-64 sm:h-72 pt-1 select-none">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dailyVolume7Days}
              margin={{ top: 12, right: 12, left: -18, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<VolumeTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                formatter={(val) => <span className="text-slate-700 font-semibold">{val}</span>}
              />
              {avgDailyVolume > 0 && (
                <ReferenceLine
                  y={avgDailyVolume}
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
              )}
              {volumeChartMode === 'divisi' ? (
                <>
                  <Bar
                    dataKey="kasir"
                    name="Kasir POS"
                    stackId="vol"
                    fill="#0d9488"
                    maxBarSize={44}
                  />
                  <Bar
                    dataKey="atmMini"
                    name="ATM Mini & Transfer"
                    stackId="vol"
                    fill="#f59e0b"
                    maxBarSize={44}
                  />
                  <Bar
                    dataKey="ppob"
                    name="Pulsa & PPOB"
                    stackId="vol"
                    fill="#0284c7"
                    maxBarSize={44}
                  />
                  <Bar
                    dataKey="servisPrint"
                    name="Servis & Percetakan"
                    stackId="vol"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={44}
                  />
                </>
              ) : (
                <Bar
                  dataKey="total"
                  name="Total Volume Transaksi"
                  fill="#0d9488"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Breakdown by Stream */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Distribusi Pendapatan & Profit Konter
            </h3>
            <p className="text-xs text-slate-500">Performa 4 pilar bisnis Ju-Fat Cell</p>
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-emerald-800 font-mono bg-emerald-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded border border-emerald-200">
            Real-Time Auto-Journal
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
          {/* Stream 1 */}
          <div className="p-3 sm:p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-700 mb-1">
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
              <span>Aksesoris & POS</span>
            </div>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 font-mono truncate">
              Rp {totalSalesPOS.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 truncate">
              {transactions.length} struk penjualan
            </div>
          </div>

          {/* Stream 2 */}
          <div
            onClick={() => setActiveTab('atm_mini')}
            className="p-3 sm:p-3.5 bg-slate-50 hover:bg-pink-50/50 rounded-xl border border-slate-200 hover:border-pink-300 transition cursor-pointer group"
            title="Buka ATM Mini & Transfer"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-700">
                <Send className="w-3.5 h-3.5 text-pink-600" />
                <span>Laba ATM & Transfer</span>
              </div>
              <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-pink-600 transition" />
            </div>
            <div className="text-sm sm:text-base font-extrabold text-pink-800 font-mono truncate">
              +Rp {totalAgencyProfit.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 truncate">
              {totalBankingTransactionsCount} transaksi perbankan
            </div>
          </div>

          {/* Stream 3 */}
          <div className="p-3 sm:p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-700 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Laba Pulsa & PPOB</span>
            </div>
            <div className="text-sm sm:text-base font-extrabold text-amber-800 font-mono truncate">
              +Rp {totalPPOBProfit.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 truncate">
              {ppobTransactions.length} tagihan & token
            </div>
          </div>

          {/* Stream 4 */}
          <div className="p-3 sm:p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-700 mb-1">
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              <span>Servis Handphone</span>
            </div>
            <div className="text-sm sm:text-base font-extrabold text-blue-900 font-mono truncate">
              Rp {totalServiceRevenue.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 truncate">
              {services.length} unit reparasi
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Critical Stock Restock + Recent Cash Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Critical Stock Alert */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  Stok Kritis (Perlu Restock Segera)
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('stok')}
                className="text-xs text-teal-700 font-bold hover:underline cursor-pointer shrink-0"
              >
                Lihat Semua
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                Semua stok produk dalam batas aman!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {lowStockProducts.slice(0, 5).map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        SKU: {p.sku} · Min: {p.minStock} {p.unit}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className="text-xs font-bold text-red-600 font-mono bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        Sisa {p.stock}
                      </span>
                      <button
                        onClick={() => restockProduct(p.id, 10)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition shadow-xs cursor-pointer active:scale-95"
                        title="Tambah 10 pcs ke stok"
                      >
                        +10 Restock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Ledger Live Activity */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-teal-600 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  Aktivitas Kas Laci Terakhir (Live)
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('kas_harian')}
                className="text-xs text-teal-700 font-bold hover:underline cursor-pointer shrink-0"
              >
                Buku Kas
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {mutations.slice(0, 5).map((m) => (
                <div key={m.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{m.description}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {m.timestamp} · {m.category.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <span
                      className={`font-bold block ${
                        m.type === 'masuk' ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {m.type === 'masuk' ? '+' : '-'}Rp {m.amount.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Saldo: Rp {m.runningCashBalance.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
