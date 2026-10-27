import React from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { KasirView } from './components/views/KasirView';
import { AtmMiniView } from './components/views/AtmMiniView';
import { TransferAgencyView } from './components/views/TransferAgencyView';
import { PPOBView } from './components/views/PPOBView';
import { ServiceHPView } from './components/views/ServiceHPView';
import { PercetakanView } from './components/views/PercetakanView';
import { DashboardView } from './components/views/DashboardView';
import { KasHarianView } from './components/views/KasHarianView';
import { StokKategoriView } from './components/views/StokKategoriView';
import { HutangReturView } from './components/views/HutangReturView';
import { PengaturanShiftView } from './components/views/PengaturanShiftView';
import { ThermalReceiptModal } from './components/modals/ThermalReceiptModal';
import { ShiftClosingModal } from './components/modals/ShiftClosingModal';
import { CashMutationModal } from './components/modals/CashMutationModal';
import { DataSyncModal } from './components/modals/DataSyncModal';
import { MobileBottomNav } from './components/MobileBottomNav';

const AppContent: React.FC = () => {
  const { activeTab } = usePOS();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'kasir':
        return <KasirView />;
      case 'atm_mini':
        return <AtmMiniView />;
      case 'transfer':
        return <AtmMiniView />;
      case 'ppob':
        return <PPOBView />;
      case 'service':
        return <ServiceHPView />;
      case 'percetakan':
        return <PercetakanView />;
      case 'dashboard':
        return <DashboardView />;
      case 'kas_harian':
        return <KasHarianView />;
      case 'stok':
        return <StokKategoriView />;
      case 'hutang_retur':
        return <HutangReturView />;
      case 'pengaturan':
        return <PengaturanShiftView />;
      default:
        return <KasirView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] text-slate-800 antialiased font-sans">
      {/* Fresh Vibrant Mint & Teal POS Sidebar (Desktop & Mobile Drawer) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header Navigation */}
        <TopHeader />

        {/* Dynamic Viewport with mobile bottom bar clearance (pb-0 on ATM Mini / Mobile banking for full visibility) */}
        <main
          className={`flex-1 flex flex-col overflow-hidden relative ${
            activeTab === 'atm_mini' || activeTab === 'transfer' ? 'pb-0' : 'pb-14 md:pb-0'
          }`}
        >
          {renderActiveView()}
        </main>
      </div>

      {/* Smartphone Bottom Navigation Bar: Hidden on ATM Mini / Mobile Banking as requested */}
      {!(activeTab === 'atm_mini' || activeTab === 'transfer') && <MobileBottomNav />}

      {/* Global Interactive Modals */}
      <ThermalReceiptModal />
      <ShiftClosingModal />
      <CashMutationModal />
      <DataSyncModal />
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <AppContent />
    </POSProvider>
  );
}
