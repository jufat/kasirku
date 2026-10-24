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
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { ServiceTicket, ServiceStatus } from '../../types/pos';

export const ServiceHPView: React.FC = () => {
  const { services, addServiceTicket, updateServiceStatus, deleteServiceTicket, openReceipt } =
    usePOS();

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
  const [downPayment, setDownPayment] = useState(50000);
  const [technicianName, setTechnicianName] = useState('Kang Ju-Fat');
  const [warrantyDays, setWarrantyDays] = useState(14);
  const [technicianNote, setTechnicianNote] = useState('');

  const totalCost = sparepartCost + laborFee;
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

    addServiceTicket({
      customerName,
      customerPhone,
      deviceModel,
      imeiOrSn,
      problemDescription,
      status: 'antrean',
      sparepartCost,
      laborFee,
      downPayment,
      totalCost,
      technicianName,
      warrantyDays,
      technicianNote,
    });

    // Reset form
    setCustomerName('');
    setCustomerPhone('');
    setDeviceModel('');
    setImeiOrSn('');
    setProblemDescription('');
    setDownPayment(0);
    setTechnicianNote('');
    setIsModalOpen(false);
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
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'all', label: 'Semua Status' },
            { id: 'antrean', label: 'Antrean Masuk' },
            { id: 'proses', label: 'Proses Pengerjaan' },
            { id: 'selesai', label: 'Selesai' },
            { id: 'diambil', label: 'Sudah Diambil' },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer shrink-0 ${
                  active
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-900'
                }`}
              >
                {tab.label}
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
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
                        title="Cetak Nota Servis"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Nota</span>
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

                      {ticket.status === 'selesai' && (
                        <button
                          onClick={() => updateServiceStatus(ticket.id, 'diambil')}
                          className="px-3 py-1.5 text-xs font-bold bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition shadow-xs cursor-pointer"
                          title="Lunasi sisa biaya & serahkan ke pelanggan"
                        >
                          Pelunasan & Diambil
                        </button>
                      )}

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
                      step="5000"
                      value={sparepartCost}
                      onChange={(e) => setSparepartCost(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-right font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Ongkos Jasa Teknisi (Rp)</label>
                    <input
                      type="number"
                      step="5000"
                      value={laborFee}
                      onChange={(e) => setLaborFee(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-right font-semibold text-emerald-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Uang Muka / DP Diterima (Rp)
                    </label>
                    <input
                      type="number"
                      step="5000"
                      value={downPayment}
                      onChange={(e) => setDownPayment(Number(e.target.value) || 0)}
                      placeholder="0 jika belum bayar"
                      className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg font-mono text-right font-bold text-emerald-800"
                    />
                    <span className="text-[10px] text-emerald-600 block mt-0.5">
                      *DP otomatis tercatat ke kas laci
                    </span>
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

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-bold text-slate-800">Total Biaya Servis:</span>
                  <span className="text-base font-extrabold text-emerald-900 font-mono">
                    Rp {totalCost.toLocaleString('id-ID')}
                  </span>
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
    </div>
  );
};
