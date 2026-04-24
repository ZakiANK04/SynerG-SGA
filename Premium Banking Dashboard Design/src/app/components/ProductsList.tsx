import { motion } from 'motion/react';
import { Client } from '../data/clientsData';

interface ProductsListProps {
  client: Client;
}

export function ProductsList({ client }: ProductsListProps) {
  const products = client.products;
  return (
    <div className="bg-[#141C2E] rounded-[20px] border border-white/[0.07] p-6 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
      <h3 className="text-[#F0F4FF] text-[16px] font-[600] mb-6" style={{ fontFamily: 'Sora, sans-serif' }}>
        Produits Bancaires
      </h3>
      <div className="space-y-4">
        {products.map((product, index) => (
          <motion.div
            key={product.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
            className="group transition-transform duration-300 hover:translate-x-1"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: product.color }}></div>
                <span className="text-[#F0F4FF] text-[12px] font-[400]" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {product.name}
                </span>
              </div>
              <span className="text-[#8B97B8] text-[11px] font-[700]" style={{ fontFamily: 'Space Mono, monospace' }}>
                {product.count} contrat{product.count > 1 ? 's' : ''}
              </span>
            </div>
            <div className="relative h-1.5 bg-[#0A0F1E] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${product.value}%` }}
                transition={{ delay: 0.8 + index * 0.1, duration: 1.5, ease: [0.65, 0, 0.35, 1] }}
                className="absolute top-0 left-0 h-full rounded-full"
                style={{ backgroundColor: product.color }}
              ></motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
