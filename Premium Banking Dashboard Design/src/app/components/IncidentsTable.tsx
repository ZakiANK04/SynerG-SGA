import { Client } from '../data/clientsData';

interface IncidentsTableProps {
  client: Client;
}

export function IncidentsTable({ client }: IncidentsTableProps) {
  const incidents = client.incidents;
  const statusColors = {
    resolved: '#00C27A',
    pending: '#FF7B2E',
    critical: '#FF5670'
  };

  return (
    <div className="bg-[#141C2E] rounded-[20px] border border-white/[0.07] p-6 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
      <h3 className="text-[#F0F4FF] text-[16px] font-[600] mb-6" style={{ fontFamily: 'Sora, sans-serif' }}>
        Incidents de Paiement
      </h3>
      {incidents.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-[#00C27A]/10 flex items-center justify-center mx-auto mb-3">
            <div className="w-6 h-6 rounded-full bg-[#00C27A]"></div>
          </div>
          <p className="text-[#00C27A] text-[12px] font-[600]" style={{ fontFamily: 'Sora, sans-serif' }}>
            Aucun incident
          </p>
          <p className="text-[#4E5D7A] text-[10px] mt-1" style={{ fontFamily: 'Sora, sans-serif' }}>
            Client sans incident de paiement
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident, index) => (
          <div key={index} className="flex items-start gap-3 pb-4 border-b border-white/[0.05] last:border-0 last:pb-0">
            <div className="relative flex items-center justify-center pt-1">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: statusColors[incident.status as keyof typeof statusColors],
                  boxShadow: incident.status === 'critical' ? `0 0 10px ${statusColors.critical}` : 'none'
                }}
              >
                {incident.status === 'critical' && (
                  <div className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: statusColors.critical }}></div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[#F0F4FF] text-[12px] font-[400] mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                {incident.label}
              </div>
              <div className="text-[#4E5D7A] text-[10px]" style={{ fontFamily: 'Sora, sans-serif' }}>
                {incident.date}
              </div>
            </div>
            <div className="text-[#FF5670] text-[11px] font-[700]" style={{ fontFamily: 'Space Mono, monospace' }}>
              {incident.amount}
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
}
