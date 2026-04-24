import { TrendingUp, TrendingDown, DollarSign, AlertCircle, CreditCard, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Client } from '../data/clientsData';

interface KPICardsProps {
  client: Client;
}

export function KPICards({ client }: KPICardsProps) {
  return (
    <div className="px-10 pb-8">
      <div className="grid grid-cols-4 gap-6">
        <KPICard
          icon={<DollarSign className="w-6 h-6" />}
          label="Chiffre d'Affaires"
          value={client.ca.toFixed(2)}
          unit="Mds DZD"
          subtitle="Exercice 2025"
          trend={{ direction: client.caVariation > 0 ? 'up' : 'down', value: `${client.caVariation > 0 ? '+' : ''}${client.caVariation.toFixed(1)}%` }}
          featured={true}
        />
        <KPICard
          icon={<Activity className="w-6 h-6" />}
          label="PNB NET"
          value={client.pnb.toFixed(1)}
          unit="M DZD"
          subtitle="YTD 2026"
          trend={{ direction: client.pnbVariation > 0 ? 'up' : 'down', value: `${client.pnbVariation > 0 ? '+' : ''}${client.pnbVariation.toFixed(1)}%` }}
        />
        <KPICard
          icon={<AlertCircle className="w-6 h-6" />}
          label="Encours Impayés"
          value={client.impayes.toFixed(1)}
          unit="M DZD"
          subtitle="Total actif"
          trend={{ direction: 'warn', value: `${client.nbIncidents} incident${client.nbIncidents > 1 ? 's' : ''}` }}
        />
        <KPICard
          icon={<CreditCard className="w-6 h-6" />}
          label="Produits Actifs"
          value={client.nbProduits.toString()}
          unit="contrats"
          subtitle="En cours"
          trend={{ direction: 'up', value: 'Actifs' }}
        />
      </div>
    </div>
  );
}

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  subtitle: string;
  trend: { direction: 'up' | 'down' | 'warn'; value: string };
  featured?: boolean;
}

function KPICard({ icon, label, value, unit, subtitle, trend, featured }: KPICardProps) {
  const [count, setCount] = useState(0);
  const targetValue = parseFloat(value);

  useEffect(() => {
    const duration = 1200;
    const steps = 60;
    const increment = targetValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetValue) {
        setCount(targetValue);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [targetValue]);

  const trendColors = {
    up: '#00C27A',
    down: '#FF5670',
    warn: '#FF7B2E'
  };

  const trendIcons = {
    up: <TrendingUp className="w-3 h-3" />,
    down: <TrendingDown className="w-3 h-3" />,
    warn: <div className="w-2 h-2 rounded-full bg-[#FF7B2E]"></div>
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`relative bg-[#141C2E] rounded-[20px] border border-white/[0.07] p-6 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] ${
        featured ? 'border-t-[2px] border-t-[#E2001A] shadow-[0_0_30px_rgba(226,0,26,0.15)]' : ''
      }`}
    >
      {/* Trend Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-[600]"
           style={{
             backgroundColor: `${trendColors[trend.direction]}20`,
             color: trendColors[trend.direction],
             fontFamily: 'Sora, sans-serif'
           }}>
        {trendIcons[trend.direction]}
        <span>{trend.value}</span>
      </div>

      {/* Icon */}
      <div className="w-12 h-12 rounded-[12px] bg-[#1C2640] flex items-center justify-center mb-4" style={{ color: featured ? '#E2001A' : '#8B97B8' }}>
        {icon}
      </div>

      {/* Label */}
      <div className="text-[#8B97B8] text-[13px] font-[600] mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
        {label}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[#F0F4FF] text-[32px] font-[700]" style={{ fontFamily: 'Space Mono, monospace' }}>
          {count.toFixed(count < 100 ? 1 : 0)}
        </span>
        <span className="text-[#8B97B8] text-[14px]" style={{ fontFamily: 'Space Mono, monospace' }}>
          {unit}
        </span>
      </div>

      {/* Subtitle */}
      <div className="text-[#4E5D7A] text-[11px]" style={{ fontFamily: 'Sora, sans-serif' }}>
        {subtitle}
      </div>
    </motion.div>
  );
}
