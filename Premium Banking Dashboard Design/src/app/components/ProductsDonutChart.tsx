import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Client } from '../data/clientsData';

interface ProductsDonutChartProps {
  client: Client;
}

export function ProductsDonutChart({ client }: ProductsDonutChartProps) {
  const data = client.productsDistribution;
  return (
    <div className="bg-[#141C2E] rounded-[20px] border border-white/[0.07] p-6 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
      <h3 className="text-[#F0F4FF] text-[16px] font-[600] mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
        Répartition Produits
      </h3>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={0}
            dataKey="value"
            animationDuration={1000}
            animationBegin={600}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2.5 mt-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-[#8B97B8] text-[11px]" style={{ fontFamily: 'Sora, sans-serif' }}>
                {item.name}
              </span>
            </div>
            <span className="text-[#F0F4FF] text-[12px] font-[700]" style={{ fontFamily: 'Space Mono, monospace' }}>
              {item.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
