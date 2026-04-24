import { Client } from '../data/clientsData';

interface TopNavProps {
  client: Client;
}

export function TopNav({ client }: TopNavProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-[72px] bg-[#0A0F1E] border-b border-white/[0.07] z-50 px-10">
      <div className="flex items-center justify-between h-full">
        {/* Left: Logo + Wordmark */}
        <div className="flex items-center gap-4">
          <div className="w-[42px] h-[42px] bg-[#E2001A] rounded-[10px] flex items-center justify-center">
            <span className="text-white font-[800] text-[16px]" style={{ fontFamily: 'Sora, sans-serif' }}>SG</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#F0F4FF] font-[600] text-[14px]" style={{ fontFamily: 'Sora, sans-serif' }}>Société Générale Algérie</span>
            <span className="text-[#4E5D7A] text-[10px] uppercase tracking-[1px]" style={{ fontFamily: 'Sora, sans-serif' }}>Client 360°</span>
          </div>
        </div>

        {/* Center: Live Update Indicator */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#141C2E] border border-white/[0.07]">
          <div className="relative flex items-center">
            <div className="w-2 h-2 rounded-full bg-[#00C27A]"></div>
            <div className="absolute w-2 h-2 rounded-full bg-[#00C27A] animate-ping"></div>
          </div>
          <span className="text-[#8B97B8] text-[11px]" style={{ fontFamily: 'Sora, sans-serif' }}>Dernière MAJ: 23/04/2026 14:32</span>
        </div>

        {/* Right: Segment + Sector + Avatar */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-[#E2001A]/10 border border-[#E2001A]/30">
            <span className="text-[#E2001A] text-[10px] font-[600] uppercase tracking-[1.5px]" style={{ fontFamily: 'Sora, sans-serif' }}>{client.segment}</span>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30">
            <span className="text-[#C9A84C] text-[10px] font-[600] uppercase tracking-[1.5px]" style={{ fontFamily: 'Sora, sans-serif' }}>{client.sector.toUpperCase()}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E2001A] to-[#C9A84C] flex items-center justify-center">
            <span className="text-white text-[12px] font-[600]" style={{ fontFamily: 'Sora, sans-serif' }}>{getInitials(client.gestionnaire)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
