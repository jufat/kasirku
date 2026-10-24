import React, { useState } from 'react';
import {
  Zap,
  Phone,
  Wifi,
  CheckCircle,
  Droplets,
  HeartPulse,
  Plus,
  Edit2,
  Trash2,
  Tag,
  AlertCircle,
  X,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { PPOBCategory, PPOBPackage, PPOBTransaction } from '../../types/pos';

export const PPOBView: React.FC = () => {
  const {
    ppobPackages,
    addPPOBPackage,
    updatePPOBPackage,
    deletePPOBPackage,
    ppobTransactions,
    recordPPOBTransaction,
    updatePPOBTransaction,
    deletePPOBTransaction,
  } = usePOS();

  const [category, setCategory] = useState<PPOBCategory>('pulsa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('Telkomsel');
  const [successMessage, setSuccessMessage] = useState('');

  // Modals for Packages
  const [packageModalMode, setPackageModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingPackage, setEditingPackage] = useState<PPOBPackage | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<PPOBPackage | null>(null);

  // Form states for Package Modal
  const [pkgName, setPkgName] = useState('');
  const [pkgCategory, setPkgCategory] = useState<PPOBCategory>('pulsa');
  const [pkgProvider, setPkgProvider] = useState('Telkomsel');
  const [pkgHpp, setPkgHpp] = useState(5000);
  const [pkgPrice, setPkgPrice] = useState(7000);
  const [pkgDesc, setPkgDesc] = useState('');

  // Modals for Transaction edit/delete
  const [editingTransaction, setEditingTransaction] = useState<PPOBTransaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<PPOBTransaction | null>(null);

  // Form states for Transaction Edit Modal
  const [txTargetNumber, setTxTargetNumber] = useState('');
  const [txCustomerName, setTxCustomerName] = useState('');
  const [txSellingPrice, setTxSellingPrice] = useState(0);

  // Auto detect provider based on Indonesian phone prefixes
  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    const cleaned = val.replace(/\D/g, '');
    if (
      cleaned.startsWith('0811') ||
      cleaned.startsWith('0812') ||
      cleaned.startsWith('0813') ||
      cleaned.startsWith('0821') ||
      cleaned.startsWith('0822') ||
      cleaned.startsWith('0852') ||
      cleaned.startsWith('0853')
    ) {
      setSelectedProvider('Telkomsel');
    } else if (
      cleaned.startsWith('0814') ||
      cleaned.startsWith('0815') ||
      cleaned.startsWith('0816') ||
      cleaned.startsWith('0855') ||
      cleaned.startsWith('0856') ||
      cleaned.startsWith('0857') ||
      cleaned.startsWith('0858')
    ) {
      setSelectedProvider('Indosat');
    } else if (
      cleaned.startsWith('0817') ||
      cleaned.startsWith('0818') ||
      cleaned.startsWith('0819') ||
      cleaned.startsWith('0859') ||
      cleaned.startsWith('0877') ||
      cleaned.startsWith('0878')
    ) {
      setSelectedProvider('XL');
    } else if (
      cleaned.startsWith('0838') ||
      cleaned.startsWith('0831') ||
      cleaned.startsWith('0832') ||
      cleaned.startsWith('0833')
    ) {
      setSelectedProvider('Axis');
    } else if (
      cleaned.startsWith('0895') ||
      cleaned.startsWith('0896') ||
      cleaned.startsWith('0897') ||
      cleaned.startsWith('0898') ||
      cleaned.startsWith('0899')
    ) {
      setSelectedProvider('Tri');
    } else if (
      cleaned.startsWith('0881') ||
      cleaned.startsWith('0882') ||
      cleaned.startsWith('0888')
    ) {
      setSelectedProvider('Smartfren');
    }
  };

  const handlePurchase = (pkg: PPOBPackage) => {
    if (!phoneNumber.trim()) {
      alert('Nomor HP / Nomor Meteran wajib diisi!');
      return;
    }

    recordPPOBTransaction(
      category,
      category === 'pln' ? 'PLN Prepaid' : pkg.provider,
      phoneNumber,
      pkg.name,
      pkg.hpp,
      pkg.price,
      customerName || 'Pelanggan PPOB'
    );

    setSuccessMessage(`Transaksi ${pkg.name} untuk ${phoneNumber} berhasil dicatat ke Kas!`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Open Add Package Modal
  const openAddPackageModal = () => {
    setPackageModalMode('add');
    setEditingPackage(null);
    setPkgName('');
    setPkgCategory(category);
    setPkgProvider(category === 'pln' ? 'PLN' : selectedProvider);
    setPkgHpp(10000);
    setPkgPrice(12000);
    setPkgDesc('');
  };

  // Open Edit Package Modal
  const openEditPackageModal = (pkg: PPOBPackage, e: React.MouseEvent) => {
    e.stopPropagation();
    setPackageModalMode('edit');
    setEditingPackage(pkg);
    setPkgName(pkg.name);
    setPkgCategory(pkg.category);
    setPkgProvider(pkg.provider);
    setPkgHpp(pkg.hpp);
    setPkgPrice(pkg.price);
    setPkgDesc(pkg.desc || '');
  };

  // Save Package (Add or Edit)
  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) {
      alert('Nama paket wajib diisi!');
      return;
    }

    if (packageModalMode === 'edit' && editingPackage) {
      updatePPOBPackage({
        ...editingPackage,
        name: pkgName.trim(),
        category: pkgCategory,
        provider: pkgProvider,
        hpp: Number(pkgHpp) || 0,
        price: Number(pkgPrice) || 0,
        desc: pkgDesc.trim() || undefined,
      });
    } else if (packageModalMode === 'add') {
      addPPOBPackage({
        name: pkgName.trim(),
        category: pkgCategory,
        provider: pkgProvider,
        hpp: Number(pkgHpp) || 0,
        price: Number(pkgPrice) || 0,
        desc: pkgDesc.trim() || undefined,
      });
    }

    setPackageModalMode(null);
    setEditingPackage(null);
  };

  // Open Edit Transaction Modal
  const openEditTransactionModal = (tx: PPOBTransaction) => {
    setEditingTransaction(tx);
    setTxTargetNumber(tx.targetNumber);
    setTxCustomerName(tx.customerName);
    setTxSellingPrice(tx.sellingPrice);
  };

  // Save Transaction Edit
  const handleSaveTransactionEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    const newPrice = Number(txSellingPrice) || 0;
    const newProfit = newPrice - editingTransaction.hpp;

    updatePPOBTransaction({
      ...editingTransaction,
      targetNumber: txTargetNumber.trim(),
      customerName: txCustomerName.trim() || 'Pelanggan PPOB',
      sellingPrice: newPrice,
      profit: newProfit,
    });

    setEditingTransaction(null);
  };

  // Filter packages for currently active category and provider
  const filteredPackages = ppobPackages.filter((pkg) => {
    if (category === 'pulsa' || category === 'data') {
      return (
        pkg.category === category &&
        (pkg.provider.toLowerCase() === selectedProvider.toLowerCase() ||
          pkg.provider.toLowerCase() === 'semua')
      );
    }
    if (category === 'pln') {
      return pkg.category === 'pln';
    }
    if (category === 'bpjs') {
      return pkg.category === 'bpjs' || pkg.category === 'tagihan';
    }
    if (category === 'pdam') {
      return pkg.category === 'pdam' || pkg.category === 'tagihan';
    }
    return pkg.category === category;
  });

  return (
    <div className="flex-1 flex overflow-hidden bg-[#f8f9fa]">
      {/* Left Column: Selection & Package Grid */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-200 bg-white overflow-hidden">
        {/* Category & Input Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'pulsa', label: 'Pulsa Reguler', icon: Phone },
              { id: 'data', label: 'Paket Data / Kuota', icon: Wifi },
              { id: 'pln', label: 'Token Listrik PLN', icon: Zap },
              { id: 'bpjs', label: 'BPJS & Tagihan', icon: HeartPulse },
              { id: 'pdam', label: 'PDAM & Utilitas', icon: Droplets },
            ].map((c) => {
              const Icon = c.icon;
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id as PPOBCategory)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs font-bold'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Number & Provider Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                {category === 'pln' ? 'Nomor Meteran / ID Pelanggan PLN' : 'Nomor HP Pelanggan'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder={category === 'pln' ? 'Contoh: 14028918230' : 'Contoh: 081234567890'}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                {category !== 'pln' && phoneNumber.length >= 4 && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {selectedProvider}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Operator / Jaringan
              </label>
              <select
                disabled={category === 'pln'}
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-100"
              >
                {category === 'pln' ? (
                  <option value="PLN">PLN Prepaid Listrik</option>
                ) : (
                  ['Telkomsel', 'Indosat', 'XL', 'Axis', 'Tri', 'Smartfren'].map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Action Header for Packages */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-800">
              Katalog Paket {category === 'pln' ? 'PLN' : selectedProvider}
            </span>
            <span className="text-[11px] font-mono font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
              {filteredPackages.length} Paket
            </span>
          </div>

          <button
            onClick={openAddPackageModal}
            className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Paket</span>
          </button>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Denom Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredPackages.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Zap className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-medium">Belum ada paket untuk kategori atau operator ini</p>
              <button
                onClick={openAddPackageModal}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
              >
                + Tambah Paket Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPackages.map((pkg) => {
                const profit = pkg.price - pkg.hpp;
                return (
                  <div
                    key={pkg.id}
                    className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-emerald-500 hover:shadow-md transition flex flex-col justify-between group relative"
                  >
                    <div>
                      {/* Top Header of Card: Provider & Action Buttons */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                          {pkg.provider}
                        </span>

                        {/* Edit & Hapus Buttons for Package */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => openEditPackageModal(pkg, e)}
                            className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
                            title="Edit Paket Pulsa/PPOB"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPackageToDelete(pkg);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                            title="Hapus Paket Pulsa/PPOB"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{pkg.name}</h4>
                      {pkg.desc && <p className="text-xs text-slate-500 mt-1">{pkg.desc}</p>}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
                      <div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Modal: Rp {pkg.hpp.toLocaleString('id-ID')}
                        </div>
                        <div className="text-sm font-extrabold text-emerald-800 font-mono tabular-nums">
                          Rp {pkg.price.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-bold font-mono">
                          Laba +Rp {profit.toLocaleString('id-ID')}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePurchase(pkg)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <span>Beli</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: PPOB Live Transaction Log */}
      <div className="w-84 bg-slate-50 flex flex-col h-full border-l border-slate-200 overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Riwayat Transaksi PPOB</span>
          </h4>
          <p className="text-[11px] text-slate-500">Penjualan pulsa & token hari ini</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {ppobTransactions.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-1.5">
              <Zap className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-medium">Belum ada transaksi PPOB</p>
              <p className="text-[10px] text-slate-400 text-center">
                Pilih paket di kiri untuk memproses pembelian
              </p>
            </div>
          ) : (
            ppobTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs space-y-1.5 text-xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{tx.packageName}</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-bold">
                    +Rp {tx.profit.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-700 font-semibold">{tx.targetNumber}</span>
                  <span className="text-slate-500 text-[10px] truncate max-w-[100px]">
                    {tx.customerName}
                  </span>
                </div>

                {/* Bottom line: Ref, Price, and Action Buttons (Edit & Hapus) */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100 font-mono">
                  <span>{tx.refNo}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      Rp {tx.sellingPrice.toLocaleString('id-ID')}
                    </span>
                    {/* Edit & Hapus Buttons for Transaction */}
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => openEditTransactionModal(tx)}
                        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
                        title="Edit Data Transaksi"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setTxToDelete(tx)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                        title="Hapus Transaksi dari Riwayat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL: Tambah / Edit Paket Pulsa & PPOB */}
      {packageModalMode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {packageModalMode === 'edit'
                      ? 'Edit Paket Pulsa / PPOB'
                      : 'Tambah Paket Pulsa / PPOB Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Katalog Konter Ju-Fat Cell</p>
                </div>
              </div>
              <button
                onClick={() => setPackageModalMode(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Paket *</label>
                <input
                  type="text"
                  required
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  placeholder="Contoh: Pulsa 15.000 atau Internet SAKTI 10GB"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={pkgCategory}
                    onChange={(e) => setPkgCategory(e.target.value as PPOBCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  >
                    <option value="pulsa">Pulsa Reguler</option>
                    <option value="data">Paket Data</option>
                    <option value="pln">Token Listrik PLN</option>
                    <option value="bpjs">BPJS Kesehatan</option>
                    <option value="pdam">PDAM</option>
                    <option value="tagihan">Tagihan Bulanan</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operator / Provider</label>
                  <input
                    type="text"
                    required
                    value={pkgProvider}
                    onChange={(e) => setPkgProvider(e.target.value)}
                    placeholder="Telkomsel, Indosat, PLN, dll."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Harga Beli / HPP (Rp) *</label>
                  <input
                    type="number"
                    required
                    step="100"
                    value={pkgHpp}
                    onChange={(e) => setPkgHpp(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-right font-semibold focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    required
                    step="100"
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-emerald-300 rounded-lg font-mono text-right font-bold text-emerald-800 focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Profit Preview */}
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                <span className="text-emerald-900 font-medium">Estimasi Laba per Transaksi:</span>
                <span className="font-mono font-extrabold text-emerald-800 text-sm">
                  +Rp {(pkgPrice - pkgHpp).toLocaleString('id-ID')}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Keterangan / Deskripsi (Opsional)</label>
                <input
                  type="text"
                  value={pkgDesc}
                  onChange={(e) => setPkgDesc(e.target.value)}
                  placeholder="Contoh: 24 Jam Semua Jaringan / Kuota Utama"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPackageModalMode(null)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {packageModalMode === 'edit' ? 'Simpan Perubahan' : 'Tambahkan Paket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Paket */}
      {packageToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hapus Paket Pulsa/PPOB?</h3>
                <p className="text-xs text-slate-500">Paket akan dihapus dari katalog pilihan</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">{packageToDelete.name}</div>
              <div className="text-slate-500">
                Operator: <span className="font-semibold">{packageToDelete.provider}</span>
              </div>
              <div className="text-slate-500 font-mono">
                Harga Jual: Rp {packageToDelete.price.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPackageToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePPOBPackage(packageToDelete.id);
                  setPackageToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition cursor-pointer"
              >
                Ya, Hapus Paket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Transaksi PPOB */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Edit Data Transaksi PPOB</h3>
                <p className="text-[11px] text-slate-500 font-mono">{editingTransaction.refNo}</p>
              </div>
              <button
                onClick={() => setEditingTransaction(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransactionEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Paket</label>
                <input
                  type="text"
                  disabled
                  value={editingTransaction.packageName}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nomor Tujuan / No HP *</label>
                <input
                  type="text"
                  required
                  value={txTargetNumber}
                  onChange={(e) => setTxTargetNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Pelanggan</label>
                <input
                  type="text"
                  value={txCustomerName}
                  onChange={(e) => setTxCustomerName(e.target.value)}
                  placeholder="Pelanggan PPOB"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Harga Jual (Rp) *</label>
                <input
                  type="number"
                  required
                  value={txSellingPrice}
                  onChange={(e) => setTxSellingPrice(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg font-mono text-right font-bold text-emerald-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                  Modal: Rp {editingTransaction.hpp.toLocaleString('id-ID')} | Laba baru: +Rp{' '}
                  {(txSellingPrice - editingTransaction.hpp).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Transaksi */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hapus Riwayat Transaksi?</h3>
                <p className="text-xs text-slate-500">Data transaksi akan dihapus dari daftar riwayat</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-mono font-bold text-emerald-800">{txToDelete.refNo}</div>
              <div className="font-semibold text-slate-800">{txToDelete.packageName}</div>
              <div className="font-mono text-slate-600">{txToDelete.targetNumber}</div>
              <div className="text-slate-500">
                Pelanggan: <span className="font-medium text-slate-700">{txToDelete.customerName}</span>
              </div>
              <div className="text-slate-500 font-mono">
                Total: Rp {txToDelete.sellingPrice.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePPOBTransaction(txToDelete.id);
                  setTxToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition cursor-pointer"
              >
                Ya, Hapus Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
