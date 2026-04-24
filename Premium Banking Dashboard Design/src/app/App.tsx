import { useState } from 'react';
import { TopNav } from './components/TopNav';
import { HeroSection } from './components/HeroSection';
import { KPICards } from './components/KPICards';
import { ProductsList } from './components/ProductsList';
import { ShareholdersList } from './components/ShareholdersList';
import { ProductsDonutChart } from './components/ProductsDonutChart';
import { IncidentsTable } from './components/IncidentsTable';
import { CATrendChart } from './components/CATrendChart';
import { ClientsList } from './components/ClientsList';
import { BackgroundEffects } from './components/BackgroundEffects';
import { FooterBar } from './components/FooterBar';
import { clientsData } from './data/clientsData';

export default function App() {
  const [selectedClient, setSelectedClient] = useState(clientsData[0]);

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#F0F4FF] overflow-x-hidden" style={{ fontFamily: 'Sora, sans-serif' }}>
      {/* Background Effects */}
      <BackgroundEffects />

      {/* Main Content */}
      <div className="relative" style={{ zIndex: 1 }}>
        {/* Top Navigation */}
        <TopNav client={selectedClient} />

        {/* Hero Section */}
        <HeroSection client={selectedClient} />

        {/* KPI Cards Row */}
        <KPICards client={selectedClient} />

        {/* Main Grid - 3 Columns */}
        <div className="px-10 pb-20">
          <div className="grid grid-cols-3 gap-6">
            {/* Column 1: Products + Shareholders */}
            <div className="space-y-6">
              <ProductsList client={selectedClient} />
              <ShareholdersList client={selectedClient} />
            </div>

            {/* Column 2: Donut Chart + Incidents */}
            <div className="space-y-6">
              <ProductsDonutChart client={selectedClient} />
              <IncidentsTable client={selectedClient} />
            </div>

            {/* Column 3: CA Trend + Clients List */}
            <div className="space-y-6">
              <CATrendChart client={selectedClient} />
              <ClientsList clients={clientsData} selectedClient={selectedClient} onSelectClient={setSelectedClient} />
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <FooterBar />
      </div>

      {/* Custom Scrollbar */}
      <style>{`
        * {
          font-family: 'Sora', sans-serif;
        }

        ::-webkit-scrollbar {
          width: 5px;
        }

        ::-webkit-scrollbar-track {
          background: #0A0F1E;
        }

        ::-webkit-scrollbar-thumb {
          background: #141C2E;
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #1C2640;
        }
      `}</style>
    </div>
  );
}
