import React from 'react';
import { Printer, X, CheckCircle, Store } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import {
  POSTransaction,
  AgencyTransaction,
  ServiceTicket,
  AtmMiniTransaction,
  PPOBTransaction,
} from '../../types/pos';

export const ThermalReceiptModal: React.FC = () => {
  const { isReceiptModalOpen, closeReceipt, receiptData, storeProfile } = usePOS();

  if (!isReceiptModalOpen || !receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPOS = 'items' in receiptData;
  const isAgency = 'nominal' in receiptData && 'counterFee' in receiptData && 'provider' in receiptData;
  const isService = 'deviceModel' in receiptData && 'problemDescription' in receiptData;
  const isAtmMini = 'terminalId' in receiptData && 'traceNo' in receiptData;
  const isPPOB = 'packageName' in receiptData && 'targetNumber' in receiptData;

  const posTx = isPOS ? (receiptData as POSTransaction) : null;
  const agTx = isAgency ? (receiptData as AgencyTransaction) : null;
  const srvTx = isService ? (receiptData as ServiceTicket) : null;
  const atmTx = isAtmMini ? (receiptData as AtmMiniTransaction) : null;
  const ppobTx = isPPOB ? (receiptData as unknown as PPOBTransaction) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Preview Struk Kasir</h3>
          </div>
          <button
            onClick={closeReceipt}
            className="text-slate-400 hover:text-slate-600 p-1 font-bold text-base cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Printable Thermal Receipt Paper (58mm/80mm style) */}
        <div
          id="printable-receipt"
          className="flex-1 overflow-y-auto bg-white p-4 border border-dashed border-slate-300 rounded-lg text-slate-900 font-mono text-[11px] leading-tight space-y-2 select-text"
        >
          {/* Header */}
          <div className="text-center space-y-0.5">
            {storeProfile.logo ? (
              <div className="flex justify-center mb-1.5">
                <img
                  src={storeProfile.logo}
                  alt={storeProfile.name}
                  className="max-h-12 max-w-[130px] object-contain mx-auto"
                />
              </div>
            ) : null}
            <h2 className="font-extrabold text-sm tracking-wider uppercase">
              {storeProfile.name || 'JU-FAT CELL'}
            </h2>
            <p className="text-[10px] text-slate-600">{storeProfile.subtitle}</p>
            <p className="text-[9px] text-slate-500">{storeProfile.address}</p>
            <p className="text-[9px] text-slate-500">WhatsApp: {storeProfile.phone}</p>
          </div>

          <div className="border-b border-dashed border-slate-400 my-1" />

          {/* Meta Info */}
          <div className="space-y-0.5 text-[10px]">
            {posTx && (
              <>
                <div className="flex justify-between">
                  <span>No Faktur :</span>
                  <span className="font-bold">{posTx.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal   :</span>
                  <span>{posTx.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir     :</span>
                  <span>{posTx.cashier}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan :</span>
                  <span>{posTx.customerName}</span>
                </div>
              </>
            )}

            {agTx && (
              <>
                <div className="flex justify-between">
                  <span>No Ref    :</span>
                  <span className="font-bold">{agTx.refNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal   :</span>
                  <span>{agTx.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Layanan   :</span>
                  <span className="uppercase font-bold">{agTx.type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Provider  :</span>
                  <span className="font-bold">{agTx.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tujuan    :</span>
                  <span className="font-bold">{agTx.targetNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nama      :</span>
                  <span>{agTx.customerName}</span>
                </div>
              </>
            )}

            {srvTx && (
              <>
                <div className="flex justify-between">
                  <span>No Servis :</span>
                  <span className="font-bold text-emerald-800">{srvTx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tgl Masuk :</span>
                  <span>{srvTx.dateIn}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan :</span>
                  <span>{srvTx.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>No Telp   :</span>
                  <span>{srvTx.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tipe HP   :</span>
                  <span className="font-bold">{srvTx.deviceModel}</span>
                </div>
              </>
            )}

            {atmTx && (
              <>
                <div className="text-center font-bold text-slate-800 pb-0.5 border-b border-dashed border-slate-300">
                  {atmTx.type === 'qris_atm'
                    ? '*** STRUK TRANSAKSI QRIS ***'
                    : atmTx.type === 'mbanking_atm'
                    ? '*** STRUK MOBILE BANKING ***'
                    : '*** STRUK EDC MINI ATM ***'}
                </div>
                <div className="flex justify-between pt-0.5">
                  <span>Terminal  :</span>
                  <span className="font-bold">{atmTx.terminalId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trace No  :</span>
                  <span className="font-bold">{atmTx.traceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Appr Code :</span>
                  <span className="font-bold">{atmTx.approvalCode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu     :</span>
                  <span>{atmTx.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>{atmTx.type === 'qris_atm' ? 'Penyedia  :' : atmTx.type === 'mbanking_atm' ? 'Aplikasi  :' : 'Bank/Kartu:'}</span>
                  <span className="font-bold">{atmTx.bankName} ({atmTx.cardType})</span>
                </div>
                <div className="flex justify-between">
                  <span>{atmTx.type === 'qris_atm' ? 'NMID/Ref  :' : atmTx.type === 'mbanking_atm' ? 'Ref/Kode  :' : 'No Kartu  :'}</span>
                  <span className="font-mono font-bold">{atmTx.cardNumberMasked}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nasabah   :</span>
                  <span>{atmTx.customerName}</span>
                </div>
                {atmTx.targetAccountOrPhone && (
                  <div className="flex justify-between">
                    <span>Tujuan    :</span>
                    <span className="font-bold">{atmTx.targetAccountOrPhone}</span>
                  </div>
                )}
              </>
            )}

            {ppobTx && (
              <>
                <div className="text-center font-bold text-slate-800 pb-0.5 border-b border-dashed border-slate-300">
                  {ppobTx.category === 'game'
                    ? '*** STRUK TOP UP & VOUCHER GAME ***'
                    : '*** STRUK PEMBELIAN PPOB & PULSA ***'}
                </div>
                <div className="flex justify-between pt-0.5">
                  <span>No Ref   :</span>
                  <span className="font-bold">{ppobTx.refNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu    :</span>
                  <span>{ppobTx.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Layanan  :</span>
                  <span className="font-bold uppercase">{ppobTx.category === 'game' ? 'TOP UP GAME' : ppobTx.category}</span>
                </div>
                <div className="flex justify-between">
                  <span>{ppobTx.category === 'game' ? 'Game/App :' : 'Provider :'}</span>
                  <span className="font-bold">{ppobTx.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span>{ppobTx.category === 'game' ? 'ID Akun  :' : 'No Tujuan:'}</span>
                  <span className="font-mono font-bold text-slate-900">{ppobTx.targetNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>{ppobTx.customerName}</span>
                </div>
              </>
            )}
          </div>

          <div className="border-b border-dashed border-slate-400 my-1" />

          {/* Items / Breakdown */}
          {ppobTx && (
            <div className="space-y-1 py-1">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Paket / Item:</span>
                <span>{ppobTx.packageName}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span>Status Transaksi:</span>
                <span className="text-emerald-700 font-bold uppercase">{ppobTx.status}</span>
              </div>
            </div>
          )}
          {posTx && (
            <div className="space-y-1.5 py-1">
              {posTx.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-semibold text-slate-800">{item.product.name}</div>
                  <div className="flex justify-between text-slate-600 text-[10px]">
                    <span>
                      {item.quantity} x Rp {item.product.price.toLocaleString('id-ID')}
                    </span>
                    <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {agTx && (
            <div className="space-y-1 py-1">
              <div className="flex justify-between">
                <span>Nominal Pokok:</span>
                <span>Rp {agTx.nominal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Admin Bank:</span>
                <span>Rp {agTx.bankAdminFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Jasa Loket:</span>
                <span>Rp {agTx.counterFee.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}

          {srvTx && (
            <div className="space-y-1 py-1">
              <div className="text-[10px] text-slate-600">
                <span className="font-bold">Keluhan:</span> {srvTx.problemDescription}
              </div>
              <div className="flex justify-between">
                <span>Sparepart:</span>
                <span>Rp {srvTx.sparepartCost.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Jasa Teknisi:</span>
                <span>Rp {srvTx.laborFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>DP Diterima:</span>
                <span>Rp {srvTx.downPayment.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}

          {atmTx && (
            <div className="space-y-1 py-1">
              <div className="flex justify-between">
                <span>Layanan:</span>
                <span className="font-bold uppercase">
                  {atmTx.type === 'tarik_tunai_atm'
                    ? 'TARIK TUNAI EDC'
                    : atmTx.type === 'transfer_atm'
                    ? 'TRANSFER EDC'
                    : atmTx.type === 'topup_ewallet_atm'
                    ? 'TOP UP E-WALLET'
                    : atmTx.type === 'mbanking_atm'
                    ? 'MOBILE BANKING'
                    : atmTx.type === 'qris_atm'
                    ? 'SISTEM QRIS'
                    : atmTx.type.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Nominal Pokok:</span>
                <span>Rp {atmTx.nominal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Admin EDC:</span>
                <span>Rp {atmTx.adminEdcFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Jasa Konter Ju-Fat:</span>
                <span>Rp {atmTx.counterFee.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}

          <div className="border-b border-dashed border-slate-400 my-1" />

          {/* Totals */}
          <div className="space-y-1 pt-1 text-xs">
            {posTx && (
              <>
                {posTx.discount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Diskon:</span>
                    <span>-Rp {posTx.discount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 text-sm">
                  <span>TOTAL:</span>
                  <span>Rp {posTx.total.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-700 text-[10px] pt-1">
                  <span>Metode: {posTx.paymentMethod.toUpperCase()}</span>
                  <span>Bayar: Rp {posTx.cashTendered.toLocaleString('id-ID')}</span>
                </div>
                {posTx.paymentMethod === 'tunai' && (
                  <div className="flex justify-between font-bold text-slate-900 text-[11px]">
                    <span>Kembalian:</span>
                    <span>Rp {posTx.changeAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </>
            )}

            {agTx && (
              <>
                <div className="flex justify-between font-bold text-slate-900 text-sm">
                  <span>TOTAL DIBAYAR:</span>
                  <span>Rp {agTx.totalCustomerPaid.toLocaleString('id-ID')}</span>
                </div>
                <div className="text-center text-[10px] text-emerald-800 font-bold bg-emerald-50 py-0.5 rounded mt-1">
                  STATUS: TRANSAKSI BERHASIL
                </div>
              </>
            )}

            {srvTx && (
              <>
                <div className="flex justify-between font-bold text-slate-900 text-sm">
                  <span>TOTAL BIAYA:</span>
                  <span>Rp {srvTx.totalCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-red-600 font-bold text-[11px]">
                  <span>Sisa Pelunasan:</span>
                  <span>Rp {Math.max(0, srvTx.totalCost - srvTx.downPayment).toLocaleString('id-ID')}</span>
                </div>
              </>
            )}

            {atmTx && (
              <>
                <div className="flex justify-between font-bold text-slate-900 text-sm">
                  <span>TOTAL DIDEBET:</span>
                  <span>Rp {atmTx.totalDebited.toLocaleString('id-ID')}</span>
                </div>
                {atmTx.type === 'tarik_tunai_atm' ? (
                  <div className="flex justify-between text-emerald-700 font-bold text-[11px]">
                    <span>Uang Tunai Diterima Nasabah:</span>
                    <span>Rp {atmTx.nominal.toLocaleString('id-ID')}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-slate-700 text-[10px]">
                    <span>Uang Tunai Masuk:</span>
                    <span>Rp {atmTx.totalDebited.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="text-center text-[10px] text-emerald-800 font-bold bg-emerald-50 py-0.5 rounded mt-1">
                  STATUS: TRANSAKSI BERHASIL (APPROVED)
                </div>
              </>
            )}

            {ppobTx && (
              <>
                <div className="flex justify-between font-bold text-slate-900 text-sm">
                  <span>TOTAL BAYAR:</span>
                  <span>Rp {ppobTx.sellingPrice.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-700 text-[10px] pt-1">
                  <span>Metode: {ppobTx.paymentMethod.toUpperCase()}</span>
                  <span>Produk: {ppobTx.packageName}</span>
                </div>
                <div className="text-center text-[10px] text-emerald-800 font-bold bg-emerald-50 py-0.5 rounded mt-1">
                  STATUS: PENGISIAN SUKSES
                </div>
              </>
            )}
          </div>

          <div className="border-b border-dashed border-slate-400 my-2" />

          {/* Barcode Graphic Representation */}
          <div className="text-center space-y-1 py-1">
            <div className="font-mono text-xs tracking-widest font-extrabold text-slate-800">
              ||| | |||| | ||| |||| | || | |||| ||
            </div>
            <p className="text-[9px] text-slate-500">
              {srvTx
                ? `GARANSI SERVIS ${srvTx.warrantyDays} HARI`
                : storeProfile.receiptFooter || 'TERIMA KASIH ATAS KUNJUNGAN ANDA!'}
            </p>
            <p className="text-[8px] text-slate-400">
              Barang yang sudah dibeli tidak dapat ditukar/dikembalikan
            </p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center gap-2 pt-3 mt-2 border-t border-slate-100">
          <button
            onClick={closeReceipt}
            className="flex-1 py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-teal-900/20 cursor-pointer active:scale-95"
          >
            <Printer className="w-3.5 h-3.5 text-amber-300" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
