import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Phone,
  ShieldCheck,
  Printer,
  Search,
  Filter,
  Calendar,
  Layers,
  Trash2,
  Banknote,
  QrCode,
  Receipt,
  X,
  Tag,
  Crown,
  Percent,
  Gift,
  ShoppingCart,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { ServiceTicket, ServiceStatus } from '../../types/pos';

export const ServiceHPView: React.FC = () => {
  const {
    shift,
    services,
    addServiceTicket,
    updateServiceStatus,
    deleteServiceTicket,
    openReceipt,
    cart,
    addServiceToCart,
    setIsMasterCartModalOpen,
    cartTotalCount,
  } = usePOS();

  const isOwner = shift.cashierSlot === 'owner' || shift.role === 'owner';

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<ServiceTicket | null>(null);

  // Form states for new service ticket
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [imeiOrSn, setImeiOrSn] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [sparepartCost, setSparepartCost] = useState(120000);
  const [laborFee, setLaborFee] = useState(80000);
  const [serviceDiscount, setServiceDiscount] = useState<number>(0);
  const [downPayment, setDownPayment] = useState(50000);
  const [dpPaymentMethod, setDpPaymentMethod] = useState<'tunai' | 'qris' | 'hutang'>('tunai');
  const [dpDueDate, setDpDueDate] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [technicianName, setTechnicianName] = useState('Kang Ju-Fat');
  const [warrantyDays, setWarrantyDays] = useState(14);
  const [technicianNote, setTechnicianNote] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Settlement / Pelunasan Modal States for Taking Repaired Device
  const [settlingTicket, setSettlingTicket] = useState<ServiceTicket | null>(null);
  const [settleMethod, setSettleMethod] = useState<'tunai' | 'qris' | 'hutang'>('tunai');
  const [settleCashReceived, setSettleCashReceived] = useState<number>(0);
  const [settleServiceDiscount, setSettleServiceDiscount] = useState<number>(0);
  const [settleDueDate, setSettleDueDate] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [settlePhone, setSettlePhone] = useState('');
  const [settleNote, setSettleNote] = useState('');

  const rawTotalCost = sparepartCost + laborFee;
  const totalCost = Math.max(0, rawTotalCost - serviceDiscount);
  const remainingCost = Math.max(0, totalCost - downPayment);

  const filteredServices = services.filter((s) => {
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesSearch =
      s.customerName.toLowerCase().includes(search.toLowerCase()) ||
      s.deviceModel.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.problemDescription.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !deviceModel || !problemDescription) {
      alert('Nama pelanggan, tipe HP, dan kerusakan wajib diisi!');
      return;
    }

    if (totalCost === 0 && !isOwner) {
      alert('Estimasi biaya servis Rp 0 (Diskon 100%) hanya diizinkan untuk OWNER yang sedang bertugas!');
      return;
    }

    const newTicket = addServiceTicket(
      {
        customerName,
        customerPhone,
        deviceModel,
        imeiOrSn,
        problemDescription,
        status: 'antrean',
        sparepartCost,
        laborFee,
        discount: serviceDiscount > 0 ? serviceDiscount : undefined,
        downPayment,
        totalCost,
        technicianName,
        warrantyDays,
        technicianNote,
      },
      dpPaymentMethod,
      dpPaymentMethod === 'hutang' ? dpDueDate : undefined
    );

    setToastMessage(`Tiket servis ${deviceModel} (${customerName}) berhasil dibuat! Struk termal siap dicetak.`);
    setTimeout(() => setToastMessage(''), 4500);

    // Auto open thermal receipt for customer (Tanda Terima Servis HP)
    openReceipt(newTicket);

    // Reset form
    setCustomerName('');
    setCustomerPhone('');
    setDeviceModel('');
    setImeiOrSn('');
    setProblemDescription('');
    setServiceDiscount(0);
    setDownPayment(0);
    setDpPaymentMethod('tunai');
    setTechnicianNote('');
    setIsModalOpen(false);
  };

  const handleOpenSettleModal = (ticket: ServiceTicket) => {
    const remaining = Math.max(0, ticket.totalCost - ticket.downPayment);
    if (remaining === 0) {
      updateServiceStatus(ticket.id, 'diambil', 'tunai');
      setToastMessage(
        `HP ${ticket.deviceModel} telah diserahkan ke ${ticket.customerName}. Garansi ${ticket.warrantyDays} hari aktif.`
      );
      setTimeout(() => setToastMessage(''), 4500);
      openReceipt({
        ...ticket,
        status: 'diambil',
        downPayment: ticket.totalCost,
      });
      return;
    }
    setSettlingTicket(ticket);
    setSettleServiceDiscount(0);
    setSettleMethod('tunai');
    setSettleCashReceived(remaining);
    setSettlePhone(ticket.customerPhone || '');
    setSettleNote('');
  };

  const handleConfirmSettle = () => {
    if (!settlingTicket) return;
    const baseRemaining = Math.max(0, settlingTicket.totalCost - settlingTicket.downPayment);
    const actualRemaining = Math.max(0, baseRemaining - settleServiceDiscount);

    if (actualRemaining === 0 && !isOwner) {
      alert('Pelunasan servis Rp 0 (Diskon 100%) hanya diizinkan untuk OWNER yang sedang bertugas!');
      return;
    }

    const isPartial = settleMethod === 'tunai' && settleCashReceived > 0 && settleCashReceived < actualRemaining;

    updateServiceStatus(
      settlingTicket.id,
      'diambil',
      isPartial ? 'hutang' : settleMethod,
      settleDueDate,
      settlePhone || settlingTicket.customerPhone,
      settleNote,
      isPartial ? settleCashReceived : (settleMethod === 'hutang' ? 0 : actualRemaining)
    );

    const ticketCopy: ServiceTicket = {
      ...settlingTicket,
      discount: (settlingTicket.discount || 0) + settleServiceDiscount,
      status: 'diambil',
      downPayment: isPartial
        ? settlingTicket.downPayment + settleCashReceived
        : (settleMethod === 'hutang' ? settlingTicket.downPayment : settlingTicket.totalCost),
      remainingDebt: isPartial ? Math.max(0, actualRemaining - settleCashReceived) : undefined,
      isPartialPayment: isPartial,
      dueDate: isPartial ? settleDueDate : undefined,
    };
    setSettlingTicket(null);

    const methodLabel = isPartial
      ? `Bayar Sebagian (DP Rp ${settleCashReceived.toLocaleString('id-ID')}, Sisa Kasbon Rp ${(actualRemaining - settleCashReceived).toLocaleString('id-ID')})`
      : settleMethod === 'tunai'
      ? 'Tunai Penuh'
      : settleMethod === 'qris'
      ? 'QRIS'
      : 'Kasbon (Masuk Data Hutang)';

    setToastMessage(
      `Pelunasan service ${ticketCopy.id} (${ticketCopy.deviceModel}) via ${methodLabel} sukses diproses!`
    );
    setTimeout(() => setToastMessage(''), 5000);

    // Auto open thermal receipt for customer (Struk Pelunasan Servis)
    openReceipt(ticketCopy);
  };

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'antrean':
        return {
          label: 'Antrean Masuk',
          classes: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 'proses':
        return {
          label: 'Dalam Pengerjaan',
          classes: 'bg-blue-100 text-blue-800 border-blue-300',
        };
      case 'selesai':
        return {
          label: 'Selesai (Siap Ambil)',
          classes: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      case 'diambil':
        return {
          label: 'Sudah Diambil (Garansi)',
          classes: 'bg-slate-100 text-slate-700 border-slate-300',
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-hidden">
      {/* Top Action & Stats Bar */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        {/* Search & Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nota servis, nama pelanggan, tipe HP..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'all', label: 'Semua', count: services.length },
            {
              id: 'antrean',
              label: 'Antrean Masuk',
              count: services.filter((s) => s.status === 'antrean').length,
              badgeColor: 'bg-amber-100 text-amber-800',
            },
            {
              id: 'proses',
              label: 'Pengerjaan',
              count: services.filter((s) => s.status === 'proses').length,
              badgeColor: 'bg-blue-100 text-blue-800',
            },
            {
              id: 'selesai',
              label: 'Siap Ambil',
              count: services.filter((s) => s.status === 'selesai').length,
              badgeColor: 'bg-emerald-100 text-emerald-800',
            },
            {
              id: 'diambil',
              label: 'Sudah Diambil',
              count: services.filter((s) => s.status === 'diambil').length,
              badgeColor: 'bg-slate-200 text-slate-700',
            },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95 ${
                  active
                    ? 'bg-gradient-to-r from-teal-700 to-emerald-700 text-white shadow-sm ring-1 ring-teal-600 font-extrabold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/60 font-semibold'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    active ? 'bg-white/20 text-white' : tab.badgeColor || 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Add Service Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Terima Service Baru</span>
        </button>
      </div>

      {/* Toast Feedback Banner + Master Cart Shortcut */}
      {toastMessage && (
        <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center justify-between gap-2 font-bold shadow-2xs flex-wrap">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {cartTotalCount > 0 && (
              <button
                type="button"
                onClick={() => setIsMasterCartModalOpen(true)}
                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg flex items-center gap-1 text-[11px] cursor-pointer shadow-xs whitespace-nowrap"
              >
                <ShoppingCart className="w-3 h-3 text-amber-300" />
                <span>Buka Keranjang Besar ({cartTotalCount})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setToastMessage('')}
              className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
              title="Tutup"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Service Tickets Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredServices.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Wrench className="w-12 h-12 stroke-[1.2] text-slate-300" />
            <p className="text-sm font-medium">Tidak ada unit servis dengan filter ini</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredServices.map((ticket) => {
              const badge = getStatusBadge(ticket.status);
              const remaining = Math.max(0, ticket.totalCost - ticket.downPayment);

              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 flex flex-col justify-between hover:shadow-md transition"
                >
                  {/* Top Bar: ID and Status */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold font-mono text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {ticket.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {ticket.deviceModel}
                    </h4>

                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-700 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {ticket.customerName}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-slate-600 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {ticket.customerPhone}
                      </span>
                    </div>

                    {/* Problem Description */}
                    <div className="mt-2.5 p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <span className="font-semibold text-slate-600 block text-[10px] uppercase">
                        Keluhan & Gejala:
                      </span>
                      <p className="text-slate-800 font-medium">{ticket.problemDescription}</p>
                      {ticket.technicianNote && (
                        <p className="text-slate-500 text-[11px] mt-1 italic border-t border-slate-200/60 pt-1">
                          Catatan: {ticket.technicianNote}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Estimasi Sparepart + Jasa:</span>
                      <span className="font-mono text-slate-700 font-semibold">
                        Rp {ticket.sparepartCost.toLocaleString('id-ID')} + Rp{' '}
                        {ticket.laborFee.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline font-bold">
                      <span className="text-slate-800">Total Biaya Service:</span>
                      <span className="text-sm font-extrabold text-emerald-900 font-mono">
                        Rp {ticket.totalCost.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] pt-1">
                      <span className="text-slate-500">
                        DP: Rp {ticket.downPayment.toLocaleString('id-ID')}
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          remaining === 0 || ticket.status === 'diambil'
                            ? 'text-emerald-700'
                            : 'text-red-600'
                        }`}
                      >
                        {ticket.status === 'diambil' || remaining === 0
                          ? 'Lunas'
                          : `Sisa Pelunasan: Rp ${remaining.toLocaleString('id-ID')}`}
                      </span>
                    </div>
                  </div>

                  {/* Workflow Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openReceipt(ticket)}
                        className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-teal-900 bg-slate-100 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                        title="Cetak Struk Termal Servis (58mm / 80mm)"
                      >
                        <Printer className="w-3.5 h-3.5 text-teal-600" />
                        <span>Struk Termal</span>
                      </button>

                      <button
                        onClick={() => setTicketToDelete(ticket)}
                        className="p-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
                        title="Hapus Tiket Servis"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Hapus</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {ticket.status === 'antrean' && (
                        <button
                          onClick={() => updateServiceStatus(ticket.id, 'proses')}
                          className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-xs cursor-pointer"
                        >
                          Mulai Servis
                        </button>
                      )}

                      {ticket.status === 'proses' && (
                        <button
                          onClick={() => updateServiceStatus(ticket.id, 'selesai')}
                          className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-xs cursor-pointer"
                        >
                          Tandai Selesai
                        </button>
                      )}

                      {ticket.status === 'selesai' && (() => {
                        const isInMasterCart = cart.some(
                          (c) => c.itemType === 'service' && c.metadata?.serviceTicketId === ticket.id
                        );
                        return (
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                if (isInMasterCart) {
                                  setIsMasterCartModalOpen(true);
                                  return;
                                }
                                const added = addServiceToCart(ticket);
                                if (added) {
                                  setToastMessage(
                                    `Pelunasan servis ${ticket.id} (${ticket.deviceModel}) ditambahkan ke Keranjang Besar!`
                                  );
                                  setTimeout(() => setToastMessage(''), 5000);
                                }
                              }}
                              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                                isInMasterCart
                                  ? 'bg-teal-50 border-teal-400 text-teal-800 hover:bg-teal-100'
                                  : 'bg-white border-teal-300 text-teal-800 hover:bg-teal-50'
                              }`}
                              title={
                                isInMasterCart
                                  ? 'Sudah ada di Keranjang Besar (klik untuk buka)'
                                  : 'Gabungkan pelunasan servis ini ke Keranjang Besar'
                              }
                            >
                              <ShoppingCart className="w-3.5 h-3.5 text-teal-600" />
                              <span>{isInMasterCart ? 'Di Keranjang' : '+ Keranjang'}</span>
                            </button>
                            <button
                              onClick={() => handleOpenSettleModal(ticket)}
                              className="px-3 py-1.5 text-xs font-bold bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                              title="Lunasi sisa biaya (Tunai/QRIS/Kasbon) & serahkan ke pelanggan"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-amber-300" />
                              <span>Pelunasan & Diambil</span>
                            </button>
                          </div>
                        );
                      })()}

                      {ticket.status === 'diambil' && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Garansi {ticket.warrantyDays} Hari</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Service Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Formulir Penerimaan Service HP
                  </h3>
                  <p className="text-xs text-slate-500">Konter Ju-Fat Cell</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Pelanggan *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Pak Budi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor WhatsApp / HP *</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipe & Merk HP *</label>
                  <input
                    type="text"
                    required
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                    placeholder="Contoh: Xiaomi Redmi Note 11"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No. IMEI / SN (Opsional)</label>
                  <input
                    type="text"
                    value={imeiOrSn}
                    onChange={(e) => setImeiOrSn(e.target.value)}
                    placeholder="869201948123019"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Keluhan / Kerusakan Perangkat *
                </label>
                <textarea
                  required
                  rows={2}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Contoh: Layar sentuh blank hitam, ada suara telepon masuk tapi tidak tampil..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Cost calculation */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Estimasi Sparepart (Rp)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={sparepartCost}
                      onChange={(e) => setSparepartCost(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-right font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Ongkos Jasa Teknisi (Rp)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={laborFee}
                      onChange={(e) => setLaborFee(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-right font-semibold text-emerald-800"
                    />
                  </div>
                </div>

                {/* DISKON BIAYA SERVIS */}
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 font-bold text-slate-700">
                      <Tag className="w-3.5 h-3.5 text-teal-600" />
                      <span>Diskon / Potongan Servis:</span>
                      {isOwner && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1 py-0.2 rounded font-black">
                          👑 Owner (Bisa Rp 0)
                        </span>
                      )}
                    </div>
                    {serviceDiscount > 0 && (
                      <button
                        type="button"
                        onClick={() => setServiceDiscount(0)}
                        className="text-[10px] text-rose-600 underline cursor-pointer"
                      >
                        Reset Diskon
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    {[
                      { label: '0%', val: 0 },
                      { label: '5%', val: Math.round(rawTotalCost * 0.05) },
                      { label: '10%', val: Math.round(rawTotalCost * 0.1) },
                      { label: '20%', val: Math.round(rawTotalCost * 0.2) },
                      { label: '50%', val: Math.round(rawTotalCost * 0.5) },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setServiceDiscount(p.val)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                          serviceDiscount === p.val
                            ? 'bg-teal-600 text-white border-teal-600 font-black'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        if (isOwner) {
                          setServiceDiscount(rawTotalCost);
                          setDownPayment(0);
                        } else {
                          alert('Biaya servis Rp 0 (Diskon 100%) hanya diizinkan bila yang bertugas adalah OWNER!');
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-black border transition cursor-pointer flex items-center gap-1 ${
                        serviceDiscount === rawTotalCost && rawTotalCost > 0
                          ? 'bg-amber-400 text-slate-950 border-amber-400'
                          : isOwner
                          ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                          : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                      }`}
                    >
                      <span>👑 100% (Rp 0)</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] text-slate-500">Nominal Diskon Manual:</span>
                    <div className="flex items-center gap-1 font-mono">
                      <span className="text-slate-400 font-bold">Rp</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={serviceDiscount || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          if (!isOwner && val >= rawTotalCost && rawTotalCost > 0) {
                            alert('Hanya OWNER yang dapat menetapkan biaya servis Rp 0!');
                            setServiceDiscount(Math.max(0, rawTotalCost - 1000));
                            return;
                          }
                          setServiceDiscount(val);
                        }}
                        placeholder="0"
                        className="w-28 text-right px-2 py-0.5 bg-white border border-slate-300 rounded font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Uang Muka / DP Diterima (Rp)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={downPayment}
                      onChange={(e) => setDownPayment(Number(e.target.value) || 0)}
                      placeholder="0 jika belum bayar"
                      className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg font-mono text-right font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Garansi Servis (Hari)</label>
                    <input
                      type="number"
                      value={warrantyDays}
                      onChange={(e) => setWarrantyDays(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-right font-semibold"
                    />
                  </div>
                </div>

                {/* DP Payment Method Selector */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <label className="text-xs font-bold text-slate-700 block">
                    Metode Pembayaran DP / Biaya Servis:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'tunai', label: 'Tunai', icon: Banknote },
                      { id: 'qris', label: 'QRIS', icon: QrCode },
                      { id: 'hutang', label: 'Kasbon', icon: Receipt },
                    ].map((m) => {
                      const Icon = m.icon;
                      const active = dpPaymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setDpPaymentMethod(m.id as any);
                            if (m.id === 'hutang') setDownPayment(0);
                          }}
                          className={`py-1.5 px-1 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition cursor-pointer border ${
                            active
                              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-600 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {dpPaymentMethod === 'hutang' && (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5 text-xs text-amber-950">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <Receipt className="w-4 h-4 text-amber-600" />
                      <span>Kasbon Servis (Langsung Masuk Buku Hutang)</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
                        Jatuh Tempo Pelunasan:
                      </label>
                      <input
                        type="date"
                        value={dpDueDate}
                        onChange={(e) => setDpDueDate(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <p className="text-[10px] text-amber-800">
                      ⚡ Sisa tagihan servis Rp {remainingCost.toLocaleString('id-ID')} akan otomatis masuk ke daftar Hutang atas nama <span className="font-bold underline">{customerName || 'Pelanggan'}</span>.
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-bold text-slate-800">Total Biaya Servis:</span>
                  <div className="text-right">
                    {serviceDiscount > 0 && (
                      <span className="text-[11px] text-slate-400 line-through font-mono block">
                        Rp {rawTotalCost.toLocaleString('id-ID')}
                      </span>
                    )}
                    <span className={`text-base font-black font-mono ${totalCost === 0 ? 'text-amber-600' : 'text-emerald-900'}`}>
                      {totalCost === 0 ? 'Rp 0 (GRATIS OWNER)' : `Rp ${totalCost.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-baseline text-red-600 font-semibold font-mono">
                  <span>Sisa Pelunasan Saat Diambil:</span>
                  <span>Rp {remainingCost.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-md shadow-emerald-950/20"
                >
                  Simpan & Cetak Nota Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Ticket Confirmation Modal */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hapus Tiket Service?</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-mono font-bold text-emerald-800">{ticketToDelete.id}</div>
              <div className="font-semibold text-slate-800">{ticketToDelete.deviceModel}</div>
              <div className="text-slate-500">Pelanggan: {ticketToDelete.customerName}</div>
              <div className="text-slate-500">Keluhan: {ticketToDelete.problemDescription}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTicketToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteServiceTicket(ticketToDelete.id);
                  setTicketToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition cursor-pointer"
              >
                Ya, Hapus Tiket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Pelunasan & Serahkan HP Servis (Tunai, QRIS, Kasbon / Hutang)      */}
      {/* ========================================================================= */}
      {settlingTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-purple-800 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="text-sm font-extrabold">Pelunasan & Pengambilan HP Servis</h3>
                  <p className="text-[10px] text-purple-200">Nota: #{settlingTicket.id} · Garansi {settlingTicket.warrantyDays} Hari</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettlingTicket(null)}
                className="text-purple-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
              {/* Device and Customer Summary */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">
                    {settlingTicket.deviceModel}
                  </span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                    Selesai Dikerjakan
                  </span>
                </div>
                <div className="text-slate-600 text-xs flex items-center gap-2">
                  <span className="font-medium">Pelanggan: <span className="font-bold text-slate-900">{settlingTicket.customerName}</span></span>
                  <span>·</span>
                  <span className="font-mono text-slate-700">{settlingTicket.customerPhone || '-'}</span>
                </div>
                <div className="text-[11px] text-slate-500 italic">
                  Kerusakan: {settlingTicket.problemDescription}
                </div>

                <div className="border-t border-slate-200 pt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Total Biaya:</span>
                    <span className="font-mono font-bold text-slate-800">
                      Rp {settlingTicket.totalCost.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">DP Masuk:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      Rp {settlingTicket.downPayment.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-red-200">
                    <span className="text-rose-600 font-bold block text-[10px]">Sisa Pelunasan:</span>
                    <span className="font-mono font-black text-rose-700">
                      Rp {(settlingTicket.totalCost - settlingTicket.downPayment).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* DISKON PELUNASAN SERVIS */}
                <div className="mt-2 p-2.5 bg-slate-100 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Tag className="w-3.5 h-3.5 text-purple-700" />
                      <span>Diskon / Potongan Pelunasan</span>
                      {isOwner && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1 py-0.2 rounded font-black">
                          👑 Owner (Bisa Rp 0)
                        </span>
                      )}
                    </div>
                    {settleServiceDiscount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSettleServiceDiscount(0);
                          const rem = Math.max(0, settlingTicket.totalCost - settlingTicket.downPayment);
                          setSettleCashReceived(rem);
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
                          (settlingTicket.totalCost - settlingTicket.downPayment) * 0.5
                        ),
                      },
                    ].map((p) => {
                      const baseRem = Math.max(0, settlingTicket.totalCost - settlingTicket.downPayment);
                      const safeVal = Math.min(baseRem, p.val);
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            setSettleServiceDiscount(safeVal);
                            setSettleCashReceived(Math.max(0, baseRem - safeVal));
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                            settleServiceDiscount === safeVal
                              ? 'bg-purple-700 text-white border-purple-700 font-black'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        const baseRem = Math.max(0, settlingTicket.totalCost - settlingTicket.downPayment);
                        if (isOwner) {
                          setSettleServiceDiscount(baseRem);
                          setSettleCashReceived(0);
                        } else {
                          alert('Pelunasan servis Rp 0 (Diskon 100%) hanya diizinkan untuk OWNER yang sedang bertugas!');
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-black border transition cursor-pointer flex items-center gap-1 ${
                        settleServiceDiscount === (settlingTicket.totalCost - settlingTicket.downPayment)
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
                        settlingTicket.totalCost - settlingTicket.downPayment - settleServiceDiscount
                      ) === 0 ? (
                        <span className="text-amber-700 font-black">Rp 0 (GRATIS OWNER)</span>
                      ) : (
                        `Rp ${Math.max(
                          0,
                          settlingTicket.totalCost - settlingTicket.downPayment - settleServiceDiscount
                        ).toLocaleString('id-ID')}`
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Metode Pembayaran Sisa Pelunasan:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'tunai', label: 'Tunai', icon: Banknote },
                    { id: 'qris', label: 'QRIS', icon: QrCode },
                    { id: 'hutang', label: 'Kasbon', icon: Receipt },
                  ].map((m) => {
                    const Icon = m.icon;
                    const active = settleMethod === m.id;
                    const rem = Math.max(0, settlingTicket.totalCost - settlingTicket.downPayment - settleServiceDiscount);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSettleMethod(m.id as any);
                          if (m.id === 'tunai' && settleCashReceived === 0) {
                            setSettleCashReceived(rem);
                          }
                        }}
                        className={`py-2 px-1 text-xs font-bold rounded-xl flex flex-col items-center gap-1 transition cursor-pointer border ${
                          active
                            ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white border-purple-700 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detail Tunai */}
              {settleMethod === 'tunai' && (
                <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl space-y-2 text-emerald-950">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-700" />
                      <span>Uang Fisik Diterima Kasir:</span>
                    </span>
                    <span className="text-[11px] font-mono font-bold text-emerald-900">
                      Wajib: Rp {Math.max(0, settlingTicket.totalCost - settlingTicket.downPayment - settleServiceDiscount).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={settleCashReceived || ''}
                      onChange={(e) => setSettleCashReceived(Number(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-1.5 text-sm font-mono font-black bg-white border border-emerald-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder={Math.max(0, settlingTicket.totalCost - settlingTicket.downPayment - settleServiceDiscount).toString()}
                    />
                  </div>

                  {/* Quick cash chips */}
                  <div className="flex items-center gap-1 overflow-x-auto pt-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSettleCashReceived(
                          Math.max(0, settlingTicket.totalCost - settlingTicket.downPayment - settleServiceDiscount)
                        )
                      }
                      className="px-2 py-0.5 text-[10px] font-bold bg-emerald-200 hover:bg-emerald-300 text-emerald-950 rounded transition cursor-pointer"
                    >
                      Uang Pas
                    </button>
                    {[50000, 100000, 150000, 200000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setSettleCashReceived(amt)}
                        className="px-2 py-0.5 text-[10px] font-mono font-bold bg-white border border-emerald-300 text-emerald-800 rounded hover:bg-emerald-100 transition cursor-pointer shrink-0"
                      >
                        Rp {amt.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>

                  {/* Kembalian & Sisa Kasbon */}
                  <div className="flex items-center justify-between pt-1 border-t border-emerald-200 text-xs">
                    <span className="font-bold text-slate-700">
                      {settleCashReceived >=
                      Math.max(0, settlingTicket.totalCost - settlingTicket.downPayment - settleServiceDiscount)
                        ? 'Kembalian Kasir:'
                        : settleCashReceived > 0
                        ? 'Sisa Kasbon (Masuk Buku Hutang):'
                        : 'Kurang Bayar:'}
                    </span>
                    <span
                      className={`font-mono font-black text-sm ${
                        settleCashReceived >=
                        Math.max(0, settlingTicket.totalCost - settlingTicket.downPayment - settleServiceDiscount)
                          ? 'text-emerald-800'
                          : settleCashReceived > 0
                          ? 'text-amber-800'
                          : 'text-rose-600'
                      }`}
                    >
                      {settleCashReceived >=
                      Math.max(0, settlingTicket.totalCost - settlingTicket.downPayment - settleServiceDiscount)
                        ? `Rp ${(settleCashReceived - Math.max(0, settlingTicket.totalCost - settlingTicket.downPayment - settleServiceDiscount)).toLocaleString('id-ID')}`
                        : `Rp ${(Math.max(0, settlingTicket.totalCost - settlingTicket.downPayment - settleServiceDiscount) - settleCashReceived).toLocaleString('id-ID')}`}
                    </span>
                  </div>

                  {settleCashReceived > 0 &&
                    settleCashReceived <
                      Math.max(0, settlingTicket.totalCost - settlingTicket.downPayment - settleServiceDiscount) && (
                      <div className="p-2 bg-amber-100 rounded-lg text-[10px] text-amber-950 border border-amber-300">
                        💡 <strong>Mode Bayar Sebagian:</strong> Uang Rp {settleCashReceived.toLocaleString('id-ID')} masuk kas laci, sisa <strong className="font-mono">Rp {(Math.max(0, settlingTicket.totalCost - settlingTicket.downPayment - settleServiceDiscount) - settleCashReceived).toLocaleString('id-ID')}</strong> otomatis dicatat ke Buku Kasbon atas nama {settlingTicket.customerName}.
                      </div>
                    )}
                </div>
              )}

              {/* Detail QRIS */}
              {settleMethod === 'qris' && (
                <div className="p-3 bg-sky-50 border-2 border-sky-300 rounded-xl space-y-1.5 text-sky-950">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-sky-600" />
                      <span>QRIS Kasir Servis Ju-Fat Cell</span>
                    </span>
                    <span className="text-[10px] bg-sky-200 text-sky-800 px-1.5 py-0.5 rounded font-mono">
                      ID10202688190
                    </span>
                  </div>
                  <p className="text-xs text-sky-900">
                    Minta pelanggan scan QRIS sebesar <span className="font-bold font-mono">Rp {Math.max(0, settlingTicket.totalCost - settlingTicket.downPayment - settleServiceDiscount).toLocaleString('id-ID')}</span>.
                  </p>
                  <p className="text-[10px] text-sky-700">
                    💡 Pembayaran non-tunai langsung tercatat ke laporan keuangan harian.
                  </p>
                </div>
              )}

              {/* Detail Kasbon (Hutang) */}
              {settleMethod === 'hutang' && (
                <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-2 text-amber-950">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                    <Receipt className="w-4 h-4 text-amber-600" />
                    <span>Pelunasan Kasbon (Masuk Buku Hutang Pelanggan)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
                        No. WA / HP:
                      </label>
                      <input
                        type="text"
                        value={settlePhone}
                        onChange={(e) => setSettlePhone(e.target.value)}
                        placeholder="08..."
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
                        Jatuh Tempo:
                      </label>
                      <input
                        type="date"
                        value={settleDueDate}
                        onChange={(e) => setSettleDueDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
                      Catatan Kasbon:
                    </label>
                    <input
                      type="text"
                      value={settleNote}
                      onChange={(e) => setSettleNote(e.target.value)}
                      placeholder="Cth: Janji bayar tgl gajian, HP dibawa dulu"
                      className="w-full px-2.5 py-1 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <p className="text-[11px] text-amber-800">
                    ⚡ Sisa tagihan servis <span className="font-bold font-mono">Rp {Math.max(0, settlingTicket.totalCost - settlingTicket.downPayment - settleServiceDiscount).toLocaleString('id-ID')}</span> akan otomatis masuk ke menu <span className="font-bold">Hutang & Retur</span> atas nama <span className="underline font-bold">{settlingTicket.customerName}</span>.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSettlingTicket(null)}
                className="py-2.5 px-3 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!settlingTicket) return;
                  const baseRemaining = Math.max(0, settlingTicket.totalCost - settlingTicket.downPayment);
                  const actualRemaining = Math.max(0, baseRemaining - settleServiceDiscount);
                  if (actualRemaining === 0 && !isOwner) {
                    alert('Pelunasan servis Rp 0 (Diskon 100%) hanya diizinkan untuk OWNER yang sedang bertugas!');
                    return;
                  }
                  const added = addServiceToCart(settlingTicket, actualRemaining);
                  setSettlingTicket(null);
                  if (added) {
                    setToastMessage(
                      `Pelunasan servis ${settlingTicket.id} (${settlingTicket.deviceModel}) ditambahkan ke Keranjang Besar!`
                    );
                  } else {
                    setIsMasterCartModalOpen(true);
                  }
                }}
                className="py-2.5 px-3 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-300 rounded-xl hover:bg-teal-100 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                title="Masukkan pelunasan servis ini ke Keranjang Besar"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-teal-600" />
                <span>+ Gabung Keranjang</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmSettle}
                className={`flex-1 py-2.5 px-4 font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                  Math.max(
                    0,
                    settlingTicket.totalCost - settlingTicket.downPayment - settleServiceDiscount
                  ) === 0 && isOwner
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 ring-2 ring-amber-400/50 hover:brightness-105'
                    : 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-600 hover:to-indigo-600 text-white'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-amber-300" />
                <span>
                  {Math.max(
                    0,
                    settlingTicket.totalCost - settlingTicket.downPayment - settleServiceDiscount
                  ) === 0 && isOwner
                    ? '🎁 Pelunasan Rp 0 & Serahkan HP (Owner Gratis)'
                    : settleMethod === 'tunai' &&
                      settleCashReceived > 0 &&
                      settleCashReceived <
                        Math.max(0, settlingTicket.totalCost - settlingTicket.downPayment - settleServiceDiscount)
                    ? `Bayar Sebagian (Rp ${settleCashReceived.toLocaleString('id-ID')}) & Sisa Kasbon`
                    : 'Konfirmasi Pelunasan & Serahkan HP'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
