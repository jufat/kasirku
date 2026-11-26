import React, { useState } from 'react';
import {
  Zap,
  ClipboardCheck,
  Webhook,
  CheckCircle2,
  Printer,
  RotateCcw,
  X,
  AlertTriangle,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { AutoCapturePanelModal } from './AutoCapturePanelModal';

interface AutoCaptureBannerProps {
  domain: 'atm_mini' | 'ppob';
  onOpenQuickPasteModal?: () => void;
}

export const AutoCaptureBanner: React.FC<AutoCaptureBannerProps> = ({ domain }) => {
  const {
    autoCaptureSettings,
    updateAutoCaptureSettings,
    pendingAutoCaptures,
    latestAutoCaptureToast,
    dismissLatestAutoCaptureToast,
    setIsAutoCaptureModalOpen,
    checkClipboardNow,
    commitPendingAutoCapture,
    dismissPendingAutoCapture,
    undoAutoRecordedLog,
    atmMiniTransactions,
    ppobTransactions,
    openReceipt,
  } = usePOS();

  const [clipNotice, setClipNotice] = useState<string | null>(null);

  const isRushOn =
    domain === 'atm_mini'
      ? autoCaptureSettings.rushModeAtmMini
      : autoCaptureSettings.rushModePpob;

  const toggleRush = () => {
    if (domain === 'atm_mini') {
      updateAutoCaptureSettings({ rushModeAtmMini: !autoCaptureSettings.rushModeAtmMini });
    } else {
      updateAutoCaptureSettings({ rushModePpob: !autoCaptureSettings.rushModePpob });
    }
  };

  const domainPending = pendingAutoCaptures.filter(
    (p) => p.domain === domain || pendingAutoCaptures.length > 0
  );

  const handleQuickClipRead = async () => {
    const res = await checkClipboardNow(domain);
    setClipNotice(res.message);
    setTimeout(() => {
      setClipNotice((prev) => (prev === res.message ? null : prev));
    }, 4500);
  };

  const handleOpenToastReceipt = () => {
    if (!latestAutoCaptureToast) return;
    if (latestAutoCaptureToast.domain === 'atm_mini') {
      const tx = atmMiniTransactions.find((t) => t.id === latestAutoCaptureToast.txId);
      if (tx) openReceipt(tx);
    } else {
      const tx = ppobTransactions.find((t) => t.id === latestAutoCaptureToast.txId);
      if (tx) openReceipt(tx);
    }
  };

  return (
    <>
      <div className="space-y-2">
        {/* Compact Automation Control Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl p-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={toggleRush}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-extrabold border transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95 ${
                isRushOn
                  ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Aktifkan Mode Kilat: 1 klik langsung catat Tunai tanpa pop-up konfirmasi & struk"
            >
              <Zap className={`w-3.5 h-3.5 shrink-0 ${isRushOn ? 'text-slate-950' : 'text-amber-600'}`} />
              <span>{isRushOn ? 'Mode Kilat: AKTIF (1-Klik)' : 'Mode Kilat (1-Klik)'}</span>
            </button>

            <button
              type="button"
              onClick={handleQuickClipRead}
              className="min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95"
              title="Baca teks struk dari clipboard dan langsung catat otomatis"
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span>Catat Clipboard</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAutoCaptureModalOpen(true)}
            className="min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95"
            title="Atur tangkap otomatis clipboard, Mode Kilat, dan Webhook notifikasi HP"
          >
            <Webhook className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Auto-Catat &amp; Webhook
              {pendingAutoCaptures.length > 0 ? ` (${pendingAutoCaptures.length})` : ''}
            </span>
          </button>
        </div>

        {/* Clipboard feedback notice */}
        {clipNotice && (
          <div className="px-3 py-2 bg-slate-800 text-white text-xs font-medium rounded-xl flex items-center justify-between gap-2">
            <span>{clipNotice}</span>
            <button
              type="button"
              onClick={() => setClipNotice(null)}
              className="p-0.5 text-slate-300 hover:text-white cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Latest Auto-Recorded Confirmation Strip with Undo & Print */}
        {latestAutoCaptureToast && !latestAutoCaptureToast.reverted && (
          <div className="px-3 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <div className="font-extrabold truncate">
                  Tercatat Otomatis: {latestAutoCaptureToast.summary}
                </div>
                <div className="text-[11px] text-emerald-800 flex items-center gap-1.5 flex-wrap">
                  <span>{latestAutoCaptureToast.customerName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{latestAutoCaptureToast.sourceApp}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {latestAutoCaptureToast.recordedAt}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleOpenToastReceipt}
                className="min-h-[34px] px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-3 h-3" />
                <span>Cetak Struk</span>
              </button>
              <button
                type="button"
                onClick={() => undoAutoRecordedLog(latestAutoCaptureToast.id)}
                className="min-h-[34px] px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold rounded-lg flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Batalkan</span>
              </button>
              <button
                type="button"
                onClick={dismissLatestAutoCaptureToast}
                className="p-1 text-emerald-700 hover:text-emerald-950 rounded cursor-pointer"
                aria-label="Tutup notifikasi tercatat otomatis"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Pending Auto-Capture Queue Strip */}
        {domainPending.length > 0 && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs font-extrabold text-amber-950">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{domainPending.length} Struk Otomatis Siap Dikonfirmasi</span>
              </span>
              <button
                type="button"
                onClick={() => setIsAutoCaptureModalOpen(true)}
                className="text-[11px] font-bold text-amber-900 underline cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-1.5">
              {domainPending.slice(0, 2).map((item) => {
                const summaryText =
                  item.domain === 'atm_mini' && item.atmItems?.[0]
                    ? `${item.atmItems[0].bankName} Rp ${item.atmItems[0].nominal.toLocaleString('id-ID')}${
                        item.atmItems[0].customerName ? ' · ' + item.atmItems[0].customerName : ''
                      }`
                    : item.ppobItems?.[0]
                    ? `${item.ppobItems[0].packageName} (${item.ppobItems[0].targetNumber || '-'})`
                    : item.rawText.slice(0, 60);

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-amber-200 rounded-lg px-2.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 truncate">{summaryText}</div>
                      <div className="text-[10.5px] text-slate-500">
                        {item.domain === 'atm_mini' ? 'ATM Mini' : 'PPOB'} · {item.sourceApp} ·{' '}
                        {item.receivedAt}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => commitPendingAutoCapture(item.id, false)}
                        className="min-h-[32px] px-2.5 py-1 bg-teal-700 hover:bg-teal-600 text-white text-[11px] font-bold rounded-md transition cursor-pointer whitespace-nowrap"
                      >
                        Catat Sekarang
                      </button>
                      <button
                        type="button"
                        onClick={() => dismissPendingAutoCapture(item.id)}
                        className="min-h-[32px] px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-[11px] font-semibold rounded-md transition cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AutoCapturePanelModal defaultFocusDomain={domain} />
    </>
  );
};
