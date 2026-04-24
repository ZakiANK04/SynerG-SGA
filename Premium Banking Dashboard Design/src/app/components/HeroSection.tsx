import { Building2, Users, TrendingUp, Package, Target } from 'lucide-react';
import { Client } from '../data/clientsData';

interface HeroSectionProps {
  client: Client;
}

export function HeroSection({ client }: HeroSectionProps) {
  return (
    <div className="pt-[92px] pb-8 px-10">
      {/* Tag Line */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-[2px] bg-[#E2001A]"></div>
        <span className="text-[#E2001A] text-[11px] font-[600] uppercase tracking-[2px]" style={{ fontFamily: 'Sora, sans-serif' }}>CLIENT 360°</span>
      </div>

      {/* Client Name + ID */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-[48px] font-[800] leading-[1.1] mb-2 bg-gradient-to-br from-[#F0F4FF] to-[#8B97B8] bg-clip-text text-transparent" style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-1.5px' }}>
            {client.name}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-[#4E5D7A] text-[13px] font-[700]" style={{ fontFamily: 'Space Mono, monospace' }}>{client.id}</span>
            <span className="text-[#4E5D7A] text-[13px]" style={{ fontFamily: 'Space Mono, monospace' }}>· NIF: {client.nif}</span>
          </div>
        </div>

        {/* Meta Pills */}
        <div className="flex items-center gap-3 text-[11px]" style={{ fontFamily: 'Sora, sans-serif' }}>
          <span className="text-[#8B97B8]">Gestionnaire: <span className="text-[#F0F4FF]">{client.gestionnaire}</span></span>
          <span className="text-[#4E5D7A]">·</span>
          <span className="text-[#8B97B8]">Qualité: <span className="text-[#C9A84C]">{client.qualite}</span></span>
          <span className="text-[#4E5D7A]">·</span>
          <span className="text-[#8B97B8]">Scoring: <span className="text-[#00C27A]">{client.scoring}</span></span>
          <span className="text-[#4E5D7A]">·</span>
          <span className="text-[#8B97B8]">Ancienneté: <span className="text-[#F0F4FF]">{client.anciennete}</span></span>
        </div>
      </div>

      {/* Info Strip - 5 Cards */}
      <div className="grid grid-cols-5 gap-4">
        <InfoCard icon={<Building2 className="w-5 h-5" />} label="Création" value={client.creation} color="#E2001A" />
        <InfoCard icon={<TrendingUp className="w-5 h-5" />} label="Capital" value={client.capital} color="#C9A84C" />
        <InfoCard icon={<Target className="w-5 h-5" />} label="Secteur" value={client.sector} color="#00C27A" />
        <InfoCard icon={<Package className="w-5 h-5" />} label="Nb Produits" value={client.nbProduits.toString()} color="#4A9EFF" />
        <InfoCard icon={<Users className="w-5 h-5" />} label="Segment" value={client.segment} color="#A855F7" />
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-[#141C2E] rounded-[12px] border border-white/[0.07] p-4 flex items-center gap-3 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <div className="text-[9px] text-[#8B97B8] uppercase tracking-[1.5px] mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>{label}</div>
        <div className="text-[13px] text-[#F0F4FF] font-[600]" style={{ fontFamily: 'Sora, sans-serif' }}>{value}</div>
      </div>
    </div>
  );
}
