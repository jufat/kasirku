import React, { useState } from 'react';
import {
  X,
  Zap,
  ClipboardCheck,
  Webhook,
  Copy,
  Check,
  Printer,
  RotateCcw,
  Trash2,
  Play,
  AlertCircle,
  CheckCircle2,
  Clock,
  Smartphone,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { normalizeWebhookStoreKey } from '../utils/autoCaptureEngine';

interface AutoCapturePanelModalProps {
  defaultFocusDomain?: 'atm_mini' | 'ppob';
}

export const AutoCapturePanelModal: React.FC<AutoCapturePanelModalProps> = ({
  defaultFocusDomain = 'atm_mini',
}) => {
  const {
    isAutoCaptureModalOpen,
    setIsAutoCaptureModalOpen,
    autoCaptureSettings,
    updateAutoCaptureSettings,
    pendingAutoCaptures,
    autoRecordedLogs,
    clipboardStatus,
    checkClipboardNow,
    commitPendingAutoCapture,
    dismissPendingAutoCapture,
    undoAutoRecordedLog,
    clearAutoRecordedLogs,
    testWebhookAutoCapture,
    syncCode,
    atmMiniTransactions,
    ppobTransactions,
    openReceipt,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'settings' | 'webhook' | 'logs'>('settings');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  if (!isAutoCaptureModalOpen) return null;

  const effectiveStoreKey = normalizeWebhookStoreKey(
    autoCaptureSettings.webhookStoreKey || syncCode
  );
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://domain-kasir-anda';
  const webhookUrl = `${origin}/api/auto-capture/webhook?code=${effectiveStoreKey}`;
  const sampleJsonBody = JSON.stringify(
    {
      code: effectiveStoreKey,
      app: '{not_app_name}',
      title: '{not_title}',
      text: '{notification}',
    },
    null,
    2
  );

  const handleCopyText = async (text: string, kind: 'url' | 'json') => {
    try {
      await navigator.clipboard.writeText(text);
      if (kind === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedJson(true);
        setTimeout(() => setCopiedJson(false), 2000);
      }
    } catch {
      setFeedbackMsg({
        type: 'err',
        text: 'Tidak bisa menyalin otomatis. Silakan blok dan salin teks secara manual.',
      });
    }
  };

  const handleManualClipboardCheck = async () => {
    const res = await checkClipboardNow(defaultFocusDomain);
    setFeedbackMsg({
      type: res.status === 'recorded' || res.status === 'queued' ? 'ok' : 'err',
      text: res.message,
    });
  };

  const handleTestWebhook = async (sampleType: 'atm_mini' | 'ppob') => {
    setIsTestingWebhook(true);
    setFeedbackMsg(null);
    const res = await testWebhookAutoCapture(sampleType);
    setIsTestingWebhook(false);
    setFeedbackMsg({
      type: res.success ? 'ok' : 'err',
      text: res.message,
    });
  };

  const handleOpenReceiptFromLog = (domain: 'atm_mini' | 'ppob', txId: string) => {
    if (domain === 'atm_mini') {
      const tx = atmMiniTransactions.find((t) => t.id === txId);
      if (tx) openReceipt(tx);
    } else {
      const tx = ppobTransactions.find((t) => t.id === txId);
      if (tx) openReceipt(tx);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-4"
      onClick={() => setIsAutoCaptureModalOpen(false)}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                Otomatisasi Anti-Terlewat PPOB &amp; ATM Mini
              </h3>
              <p className="text-[11px] text-slate-300 truncate">
                Mode Kilat 1-Klik, Deteksi Clipboard Otomatis &amp; Webhook Notifikasi HP
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAutoCaptureModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
            aria-label="Tutup panel otomatisasi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-5 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'settings'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Mode Kilat &amp; Clipboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('webhook')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'webhook'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Webhook className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Webhook Notif HP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'logs'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>
              Antrean &amp; Log ({pendingAutoCaptures.length + autoRecordedLogs.length})
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/70">
          {feedbackMsg && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
                feedbackMsg.type === 'ok'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {feedbackMsg.type === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>{feedbackMsg.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackMsg(null)}
                className="p-1 hover:bg-black/5 rounded cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* 1. Mode Kilat 1-Klik */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    1. Mode Kilat Saat Antre Rame (Tanpa Pop-up Penahan)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Saat aktif, transaksi Tunai langsung masuk ke Kas Laci &amp; Riwayat dalam 1 klik
                    tanpa membuka modal konfirmasi dan tanpa memblokir layar dengan pop-up struk.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      updateAutoCaptureSettings({
                        rushModeAtmMini: !autoCaptureSettings.rushModeAtmMini,
                      })
                    }
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-3 ${
                      autoCaptureSettings.rushModeAtmMini
                        ? 'bg-teal-50 border-teal-500 text-teal-950'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold">Mode Kilat ATM Mini</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Proses Tarik/Transfer/E-Wallet 1-tap langsung catat
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-black shrink-0 ${
                        autoCaptureSettings.rushModeAtmMini
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {autoCaptureSettings.rushModeAtmMini ? 'AKTIF' : 'MATI'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateAutoCaptureSettings({
                        rushModePpob: !autoCaptureSettings.rushModePpob,
                      })
                    }
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-3 ${
                      autoCaptureSettings.rushModePpob
                        ? 'bg-teal-50 border-teal-500 text-teal-950'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold">Mode Kilat PPOB</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Ketuk paket Pulsa/PLN/Game langsung catat Tunai
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-black shrink-0 ${
                        autoCaptureSettings.rushModePpob
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {autoCaptureSettings.rushModePpob ? 'AKTIF' : 'MATI'}
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. Deteksi Clipboard & Ctrl+V Otomatis */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3.5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-extrabold text-slate-900">
                      2. Pantau Clipboard &amp; Paste Otomatis (BRImo, DANA, OrderKuota)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cukup salin (Copy) bukti transaksi dari aplikasi bank atau agen PPOB lalu
                      kembali ke layar kasir atau tekan Ctrl+V. Sistem otomatis mencegah pencatatan
                      ganda berdasarkan No. Ref / SN.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      updateAutoCaptureSettings({
                        autoClipboardEnabled: !autoCaptureSettings.autoClipboardEnabled,
                      })
                    }
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-black border transition cursor-pointer shrink-0 whitespace-nowrap ${
                      autoCaptureSettings.autoClipboardEnabled
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {autoCaptureSettings.autoClipboardEnabled ? 'Pantau: AKTIF' : 'Pantau: MATI'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => updateAutoCaptureSettings({ autoCommitMode: 'auto_save' })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      autoCaptureSettings.autoCommitMode === 'auto_save'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-extrabold">
                      Langsung Catat Otomatis ke Kas
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Jika nominal &amp; nomor tujuan terbaca lengkap, langsung masuk Kas &amp; Riwayat
                      tanpa tanya lagi.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateAutoCaptureSettings({ autoCommitMode: 'queue_confirm' })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      autoCaptureSettings.autoCommitMode === 'queue_confirm'
                        ? 'bg-amber-50 border-amber-500 text-amber-950'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-extrabold">
                      Masuk Antrean Konfirmasi 1-Ketuk
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Muncul di bar atas agar bisa diperiksa sekilas sebelum klik Catat ke Kas.
                    </div>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-600">
                    Status Izin Clipboard Browser:{' '}
                    <strong className="font-mono text-slate-900">
                      {clipboardStatus === 'ready'
                        ? 'Diizinkan (Otomatis)'
                        : clipboardStatus === 'denied'
                        ? 'Gunakan Ctrl+V / Tombol Cek'
                        : clipboardStatus === 'unsupported'
                        ? 'Ctrl+V Langsung'
                        : 'Siap Dicek'}
                    </strong>
                  </span>

                  <button
                    type="button"
                    onClick={handleManualClipboardCheck}
                    className="min-h-[38px] px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Baca &amp; Catat Clipboard Sekarang</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'webhook' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-teal-700 shrink-0" />
                      <span>Terima Notifikasi HP Konter Secara Otomatis</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hubungkan HP kasir (via aplikasi MacroDroid / Tasker / Notification Forwarder)
                      sehingga setiap notif transaksi sukses BRImo, DANA, GoPay, OrderKuota, atau
                      Digipos otomatis masuk ke sistem kasir meski Anda sedang melayani pelanggan lain.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      updateAutoCaptureSettings({
                        webhookEnabled: !autoCaptureSettings.webhookEnabled,
                      })
                    }
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-black border transition cursor-pointer shrink-0 whitespace-nowrap ${
                      autoCaptureSettings.webhookEnabled
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {autoCaptureSettings.webhookEnabled ? 'Listener: AKTIF' : 'Listener: MATI'}
                  </button>
                </div>

                {/* Store Key */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Kode Konter Webhook
                    </label>
                    <input
                      type="text"
                      value={autoCaptureSettings.webhookStoreKey}
                      onChange={(e) =>
                        updateAutoCaptureSettings({
                          webhookStoreKey: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder={syncCode || 'JUFAT-AUTO'}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full">
                      Kode aktif saat ini:{' '}
                      <strong className="font-mono text-teal-800">{effectiveStoreKey}</strong>
                    </div>
                  </div>
                </div>

                {/* Webhook URL */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    URL Webhook (Method POST JSON atau GET)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      className="flex-1 min-w-0 px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg font-mono text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyText(webhookUrl, 'url')}
                      className="min-h-[38px] px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {copiedUrl ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedUrl ? 'Disalin' : 'Salin URL'}</span>
                    </button>
                  </div>
                </div>

                {/* Sample JSON */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700">
                      Contoh Body JSON untuk MacroDroid / Forwarder
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopyText(sampleJsonBody, 'json')}
                      className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedJson ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedJson ? 'JSON Disalin' : 'Salin JSON'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto">
                    {sampleJsonBody}
                  </pre>
                </div>

                {/* Live Webhook Tests */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-600">
                    Uji langsung alur webhook ke kasir:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={isTestingWebhook}
                      onClick={() => handleTestWebhook('atm_mini')}
                      className="min-h-[38px] px-3 py-1.5 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Tes Notif BRImo (ATM Mini)</span>
                    </button>
                    <button
                      type="button"
                      disabled={isTestingWebhook}
                      onClick={() => handleTestWebhook('ppob')}
                      className="min-h-[38px] px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Tes Notif OrderKuota (PPOB)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3-Step Guide */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 text-xs text-slate-700">
                <h5 className="font-extrabold text-slate-900">
                  Cara Pasang Otomatis di HP Konter (3 Langkah):
                </h5>
                <ol className="list-decimal pl-4 space-y-1 text-[11.5px]">
                  <li>
                    Buka aplikasi otomatisasi di HP (misal <strong>MacroDroid</strong> atau{' '}
                    <strong>Tasker</strong>).
                  </li>
                  <li>
                    Buat Trigger <strong>Notifikasi Diterima</strong> dari aplikasi konter Anda
                    (BRImo, DANA, GoPay, OrderKuota, Digipos, Payfazz).
                  </li>
                  <li>
                    Tambahkan Action <strong>HTTP Request (POST JSON)</strong> ke URL Webhook di atas.
                    Setiap transaksi sukses akan otomatis masuk ke kasir dalam hitungan detik.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              {/* Pending Queue */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900">
                    Antrean Menunggu Konfirmasi ({pendingAutoCaptures.length})
                  </h4>
                </div>

                {pendingAutoCaptures.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">
                    Tidak ada antrean tertunda. Semua struk yang terbaca lengkap langsung tercatat
                    otomatis jika mode Langsung Catat aktif.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pendingAutoCaptures.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span>{item.domain === 'atm_mini' ? 'ATM Mini' : 'PPOB'}</span>
                            <span aria-hidden="true">·</span>
                            <span>{item.sourceApp}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-[11px] text-slate-500">
                              {item.receivedAt}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 font-mono truncate">
                            {item.rawText.replace(/\s+/g, ' ').slice(0, 120)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => commitPendingAutoCapture(item.id, false)}
                            className="min-h-[36px] px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap"
                          >
                            Catat ke Kas
                          </button>
                          <button
                            type="button"
                            onClick={() => dismissPendingAutoCapture(item.id)}
                            className="min-h-[36px] px-2.5 py-1.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
                            title="Abaikan"
                          >
                            Abaikan
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Auto-Recorded Audit Log */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold text-slate-900">
                    Riwayat Tercatat Otomatis &amp; Mode Kilat ({autoRecordedLogs.length})
                  </h4>
                  {autoRecordedLogs.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAutoRecordedLogs}
                      className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Bersihkan Log</span>
                    </button>
                  )}
                </div>

                {autoRecordedLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">
                    Belum ada transaksi tercatat melalui Mode Kilat, Clipboard Otomatis, atau Webhook.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {autoRecordedLogs.map((log) => (
                      <div
                        key={log.id}
                        className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 flex-wrap">
                            <span className={log.reverted ? 'line-through text-slate-400' : ''}>
                              {log.summary}
                            </span>
                            {log.reverted && (
                              <span className="text-[10px] font-bold text-rose-600">
                                (Dibatalkan)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                            <span>{log.customerName}</span>
                            <span aria-hidden="true">·</span>
                            <span>{log.sourceApp}</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {log.source === 'webhook'
                                ? 'Webhook HP'
                                : log.source === 'rush_tap'
                                ? 'Mode Kilat'
                                : 'Clipboard/Paste'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{log.recordedAt}</span>
                          </div>
                        </div>

                        {!log.reverted && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenReceiptFromLog(log.domain, log.txId)}
                              className="min-h-[34px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Struk</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => undoAutoRecordedLog(log.id)}
                              className="min-h-[34px] px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold rounded-lg flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                              title="Batalkan transaksi ini dan kembalikan saldo kas & digital"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Batalkan</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-slate-500">
            Tips: Di layar PPOB atau ATM Mini, Anda juga bisa langsung menekan{' '}
            <strong className="font-mono text-slate-700">Ctrl+V</strong> di luar kolom ketik untuk
            mencatat struk otomatis.
          </span>
          <button
            type="button"
            onClick={() => setIsAutoCaptureModalOpen(false)}
            className="min-h-[38px] px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap shrink-0"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
