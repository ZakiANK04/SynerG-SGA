import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Client } from '../data/clientsData';

interface CATrendChartProps {
  client: Client;
}

export function CATrendChart({ client }: CATrendChartProps) {
  const data = client.caHistory;
  return (
    <div className="bg-[#141C2E] rounded-[20px] border border-white/[0.07] p-6 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[#F0F4FF] text-[16px] font-[600]" style={{ fontFamily: 'Sora, sans-serif' }}>
          Évolution CA & PNB
        </h3>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#C9A84C]/20 to-[#C9A84C]/10 border border-[#C9A84C]/30">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse"></div>
          <span className="text-[#C9A84C] text-[10px] font-[600] uppercase tracking-[1px]" style={{ fontFamily: 'Sora, sans-serif' }}>
            Croissance
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="caGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E2001A" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#E2001A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="year"
            stroke="#4E5D7A"
            tick={{ fill: '#8B97B8', fontSize: 11, fontFamily: 'Sora, sans-serif' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.07)' }}
          />
          <YAxis
            stroke="#4E5D7A"
            tick={{ fill: '#8B97B8', fontSize: 11, fontFamily: 'Space Mono, monospace' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.07)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0A0F1E',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontFamily: 'Sora, sans-serif',
              fontSize: '11px'
            }}
            labelStyle={{ color: '#F0F4FF' }}
            itemStyle={{ color: '#8B97B8' }}
          />
          <Area
            type="monotone"
            dataKey="ca"
            stroke="#E2001A"
            strokeWidth={2}
            fill="url(#caGradient)"
            dot={{ fill: '#E2001A', stroke: '#F0F4FF', strokeWidth: 1, r: 5 }}
            animationDuration={1000}
            animationBegin={1200}
          />
          <Line
            type="monotone"
            dataKey="pnb"
            stroke="#C9A84C"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={{ fill: '#C9A84C', stroke: '#F0F4FF', strokeWidth: 1, r: 4 }}
            animationDuration={1000}
            animationBegin={1200}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-[#E2001A] rounded-full"></div>
          <span className="text-[#8B97B8] text-[10px]" style={{ fontFamily: 'Sora, sans-serif' }}>CA (Mds DZD)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-[#C9A84C] rounded-full"></div>
          <span className="text-[#8B97B8] text-[10px]" style={{ fontFamily: 'Sora, sans-serif' }}>PNB (M DZD)</span>
        </div>
      </div>
    </div>
  );
}
