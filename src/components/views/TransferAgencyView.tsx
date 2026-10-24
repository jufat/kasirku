import React, { useState } from 'react';
import {
  Send,
  Building,
  Smartphone,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  CheckCircle,
  Clock,
  Printer,
  History,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { AgencyType } from '../../types/pos';

const BANK_PROVIDERS = [
  'BRI',
  'BCA',
  'Bank Mandiri',
  'BNI',
  'BSI (Syariah)',
  'CIMB Niaga',
  'Bank Danamon',
  'SeaBank',
  'Bank Jago',
];

const EWALLET_PROVIDERS = [
  'DANA',
  'GoPay Customer',
  'GoPay Driver',
  'OVO',
  'ShopeePay',
  'LinkAja',
  'Maxim Driver',
  'DANA Bisnis',
];

const VA_PROVIDERS = [
  'BRIVA (BRI Virtual Account)',
  'BCA Virtual Account',
  'Mandiri VA (Livin)',
  'BNI Virtual Account',
  'Shopee Indonesia VA',
  'Tokopedia VA',
];

export const TransferAgencyView: React.FC = () => {
  const { agencyTransactions, recordAgencyTransaction, openReceipt } = usePOS();

  const [agencyType, setAgencyType] = useState<AgencyType>('transfer_bank');
  const [provider, setProvider] = useState<string>('BRI');
  const [targetNumber, setTargetNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [nominal, setNominal] = useState<number>(500000);
  const [bankAdminFee, setBankAdminFee] = useState<number>(2500);
  const [counterFee, setCounterFee] = useState<number>(5000);
  const [notes, setNotes] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  // Default fees when switching type
  const handleTypeChange = (type: AgencyType) => {
    setAgencyType(type);
    if (type === 'transfer_bank') {
      setProvider('BRI');
      setBankAdminFee(2500);
      setCounterFee(5000);
    } else if (type === 'tarik_tunai') {
      setProvider('BRI');
      setBankAdminFee(0);
      setCounterFee(5000);
    } else if (type === 'setor_tunai') {
      setProvider('BRI');
      setBankAdminFee(0);
      setCounterFee(5000);
    } else if (type === 'ewallet') {
      setProvider('DANA');
      setBankAdminFee(1000);
      setCounterFee(3000);
    } else if (type === 'briva_va') {
      setProvider('BRIVA (BRI Virtual Account)');
      setBankAdminFee(0);
      setCounterFee(4000);
    }
  };

  const totalPaidByCustomer = nominal + bankAdminFee + counterFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetNumber.trim()) {
      alert('Nomor rekening / nomor e-wallet tujuan wajib diisi!');
      return;
    }
    if (nominal <= 0) {
      alert('Nominal transaksi minimal Rp 10.000');
      return;
    }

    const tx = recordAgencyTransaction(
      agencyType,
      provider,
      targetNumber,
      customerName || 'Pelanggan Agen',
      nominal,
      bankAdminFee,
      counterFee,
      notes
    );

    setSuccessToast(`Transaksi ${tx.refNo} Berhasil Disimpan & Dicatat ke Kas Harian!`);
    setTimeout(() => setSuccessToast(''), 4000);

    // Reset fields
    setTargetNumber('');
    setNotes('');
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#f8f9fa]">
      {/* Left Form: Agency Terminal */}
      <div className="w-[460px] bg-white border-r border-slate-200 flex flex-col h-full shadow-xs shrink-0 overflow-y-auto">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-600 text-white flex items-center justify-center shadow-md">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Loket Agen & Transfer
              </h3>
              <p className="text-xs text-slate-500">
                Layanan Perbankan Konter Ju-Fat Cell
              </p>
            </div>
          </div>

          {/* Agency Type Pills */}
          <div className="grid grid-cols-3 gap-1.5 mt-4">
            {[
              { id: 'transfer_bank', label: 'Transfer Bank', icon: Building },
              { id: 'ewallet', label: 'Top Up E-Wallet', icon: Smartphone },
              { id: 'briva_va', label: 'BRIVA / VA', icon: CreditCard },
              { id: 'tarik_tunai', label: 'Tarik Tunai', icon: ArrowDownLeft },
              { id: 'setor_tunai', label: 'Setor Tunai', icon: ArrowUpRight },
            ].map((t) => {
              const Icon = t.icon;
              const active = agencyType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTypeChange(t.id as AgencyType)}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition cursor-pointer ${
                    active
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate w-full px-1">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1">
          {successToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 animate-fade-in font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Provider Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Pilihan Bank / Dompet Digital
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:bg-white focus:outline-none font-medium"
            >
              {agencyType === 'ewallet'
                ? EWALLET_PROVIDERS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))
                : agencyType === 'briva_va'
                ? VA_PROVIDERS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))
                : BANK_PROVIDERS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
            </select>
          </div>

          {/* Target Number */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              {agencyType === 'ewallet'
                ? 'Nomor Handphone E-Wallet'
                : agencyType === 'briva_va'
                ? 'Nomor Virtual Account (VA)'
                : 'Nomor Rekening Tujuan'}
            </label>
            <input
              type="text"
              required
              value={targetNumber}
              onChange={(e) => setTargetNumber(e.target.value)}
              placeholder={
                agencyType === 'ewallet'
                  ? 'Contoh: 085811223344'
                  : 'Contoh: 012901048821503'
              }
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-pink-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Customer Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Nama Pengirim / Pemilik
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama Pelanggan"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Keterangan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Cth: Bayar belanjaan"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Nominal Transfer with Quick Chips */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700">Nominal Transaksi</label>
              <span className="text-[11px] text-slate-500 font-mono">
                Rp {nominal.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                step="5000"
                min="5000"
                value={nominal || ''}
                onChange={(e) => setNominal(Number(e.target.value) || 0)}
                className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-pink-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Nominal Presets */}
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[50000, 100000, 250000, 500000, 1000000, 1500000, 2000000, 3000000].map(
                (amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setNominal(amt)}
                    className="py-1 px-1 text-[11px] font-mono font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  >
                    {amt >= 1000000 ? `${amt / 1000000} Jt` : `${amt / 1000}k`}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Admin Bank & Jasa Konter / Laba Calculation */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/90 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Biaya Admin Bank:</span>
              <div className="flex items-center gap-1 font-mono">
                <span className="text-slate-400">Rp</span>
                <input
                  type="number"
                  step="500"
                  value={bankAdminFee}
                  onChange={(e) => setBankAdminFee(Number(e.target.value) || 0)}
                  className="w-20 text-right px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-pink-700 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                <span>Jasa Konter (Laba Toko):</span>
              </span>
              <div className="flex items-center gap-1 font-mono">
                <span className="text-slate-400">Rp</span>
                <input
                  type="number"
                  step="500"
                  value={counterFee}
                  onChange={(e) => setCounterFee(Number(e.target.value) || 0)}
                  className="w-20 text-right px-2 py-0.5 bg-white border border-pink-300 rounded text-xs font-bold text-pink-700"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
              <span className="text-xs font-bold text-slate-800">Total Bayar Pelanggan:</span>
              <span className="text-lg font-extrabold text-pink-700 font-mono tabular-nums">
                Rp {totalPaidByCustomer.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200/60 flex items-center justify-between">
              <span>Laba Bersih Masuk Kas:</span>
              <span className="font-bold font-mono">+Rp {counterFee.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl shadow-md shadow-pink-900/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Proses Transaksi & Cetak Struk Agen</span>
          </button>
        </form>
      </div>

      {/* Right Column: History Mutations of Agency */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Table Header */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Riwayat Mutasi Transaksi Agen
              </h4>
              <p className="text-xs text-slate-500">
                Semua transaksi transfer bank, tarik tunai, dan e-wallet konter
              </p>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Total {agencyTransactions.length} Transaksi Agen
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">No Ref / Tanggal</th>
                  <th className="py-2.5 px-3">Tipe & Provider</th>
                  <th className="py-2.5 px-3">Nomor Tujuan / Pelanggan</th>
                  <th className="py-2.5 px-3 text-right">Nominal</th>
                  <th className="py-2.5 px-3 text-right">Jasa / Laba</th>
                  <th className="py-2.5 px-3 text-right">Total Bayar</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agencyTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Belum ada transaksi agen tercatat
                    </td>
                  </tr>
                ) : (
                  agencyTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono">
                        <div className="font-bold text-slate-800">{tx.refNo}</div>
                        <div className="text-[10px] text-slate-400">{tx.date}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800 block">
                          {tx.provider}
                        </span>
                        <span className="text-[10px] text-pink-600 font-medium uppercase">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <div className="font-semibold text-slate-900">{tx.targetNumber}</div>
                        <div className="text-[10px] text-slate-500 font-sans">
                          {tx.customerName}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700">
                        Rp {tx.nominal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        +Rp {tx.counterFee.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        Rp {tx.totalCustomerPaid.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => openReceipt(tx)}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1 mx-auto transition cursor-pointer"
                          title="Cetak Struk Transaksi"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Struk</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
