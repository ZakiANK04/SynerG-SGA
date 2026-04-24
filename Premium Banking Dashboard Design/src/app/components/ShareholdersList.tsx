import { motion } from 'motion/react';
import { Client } from '../data/clientsData';

interface ShareholdersListProps {
  client: Client;
}

export function ShareholdersList({ client }: ShareholdersListProps) {
  const shareholders = client.shareholders;
  return (
    <div className="bg-[#141C2E] rounded-[20px] border border-white/[0.07] p-6 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
      <h3 className="text-[#F0F4FF] text-[16px] font-[600] mb-6" style={{ fontFamily: 'Sora, sans-serif' }}>
        Actionnariat Principal
      </h3>
      <div className="space-y-5">
        {shareholders.map((shareholder, index) => (
          <motion.div
            key={shareholder.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.6 + index * 0.1, duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#F0F4FF] text-[12px] font-[400]" style={{ fontFamily: 'Sora, sans-serif' }}>
                {shareholder.name}
              </span>
              <span className="text-[#C9A84C] text-[13px] font-[700]" style={{ fontFamily: 'Space Mono, monospace' }}>
                {shareholder.percentage}%
              </span>
            </div>
            <div className="relative h-[5px] bg-[#0A0F1E] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${shareholder.percentage}%` }}
                transition={{ delay: 1.6 + index * 0.1, duration: 1.8, ease: 'easeOut' }}
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E2001A]"
              ></motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
