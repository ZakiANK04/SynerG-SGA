import { Client } from '../data/clientsData';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ClientsListProps {
  clients: Client[];
  selectedClient: Client;
  onSelectClient: (client: Client) => void;
}

export function ClientsList({ clients, selectedClient, onSelectClient }: ClientsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[#F0F4FF] text-[16px] font-[600]" style={{ fontFamily: 'Sora, sans-serif' }}>
          Top 20 Clients
        </h3>
        <div className="px-3 py-1.5 rounded-full bg-[#E2001A]/10 border border-[#E2001A]/30">
          <span className="text-[#E2001A] text-[10px] font-[600] uppercase tracking-[1px]" style={{ fontFamily: 'Sora, sans-serif' }}>
            {clients.length} clients
          </span>
        </div>
      </div>

      <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-2" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#1C2640 #0A0F1E'
      }}>
        {clients.map((client, index) => (
          <div
            key={client.id}
            onClick={() => onSelectClient(client)}
            className={`group cursor-pointer bg-[#141C2E] rounded-[16px] border p-4 transition-all duration-300 hover:translate-x-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] ${
              selectedClient.id === client.id
                ? 'border-[#E2001A] bg-[#E2001A]/5 shadow-[0_0_20px_rgba(226,0,26,0.15)]'
                : 'border-white/[0.07] hover:border-[#E2001A]/30'
            }`}
          >
            {/* Rank Badge */}
            <div className="flex items-start gap-3">
              <div
                className={`min-w-[28px] h-[28px] rounded-full flex items-center justify-center text-[11px] font-[700] ${
                  index === 0
                    ? 'bg-gradient-to-br from-[#C9A84C] to-[#E2001A] text-white'
                    : index === 1
                    ? 'bg-[#8B97B8]/20 text-[#8B97B8]'
                    : index === 2
                    ? 'bg-[#C9A84C]/20 text-[#C9A84C]'
                    : 'bg-[#1C2640] text-[#4E5D7A]'
                }`}
                style={{ fontFamily: 'Space Mono, monospace' }}
              >
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                {/* Client Name */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[#F0F4FF] text-[12px] font-[600] truncate mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {client.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[#4E5D7A] text-[9px] font-[700]" style={{ fontFamily: 'Space Mono, monospace' }}>
                        {client.id}
                      </span>
                      <div className={`px-2 py-0.5 rounded-full text-[8px] font-[600] uppercase tracking-[1px] ${
                        client.segment === 'GE'
                          ? 'bg-[#E2001A]/10 text-[#E2001A]'
                          : 'bg-[#4A9EFF]/10 text-[#4A9EFF]'
                      }`} style={{ fontFamily: 'Sora, sans-serif' }}>
                        {client.segment}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* CA */}
                    <div>
                      <div className="text-[#8B97B8] text-[8px] uppercase mb-0.5" style={{ fontFamily: 'Sora, sans-serif' }}>CA</div>
                      <div className="text-[#F0F4FF] text-[11px] font-[700]" style={{ fontFamily: 'Space Mono, monospace' }}>
                        {client.ca.toFixed(2)}
                      </div>
                    </div>

                    {/* PNB */}
                    <div>
                      <div className="text-[#8B97B8] text-[8px] uppercase mb-0.5" style={{ fontFamily: 'Sora, sans-serif' }}>PNB</div>
                      <div className="text-[#F0F4FF] text-[11px] font-[700]" style={{ fontFamily: 'Space Mono, monospace' }}>
                        {client.pnb.toFixed(1)}
                      </div>
                    </div>

                    {/* Scoring Badge */}
                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-[700] ${
                      client.scoring.startsWith('A')
                        ? 'bg-[#00C27A]/20 text-[#00C27A]'
                        : 'bg-[#FF7B2E]/20 text-[#FF7B2E]'
                    }`} style={{ fontFamily: 'Space Mono, monospace' }}>
                      {client.scoring}
                    </div>
                  </div>

                  {/* Trend */}
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-[600] ${
                    client.caVariation > 0
                      ? 'bg-[#00C27A]/20 text-[#00C27A]'
                      : 'bg-[#FF5670]/20 text-[#FF5670]'
                  }`} style={{ fontFamily: 'Sora, sans-serif' }}>
                    {client.caVariation > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    <span>{Math.abs(client.caVariation).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
