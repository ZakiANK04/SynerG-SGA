import { Download, FileText } from 'lucide-react';

export function FooterBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-[48px] bg-[#0A0F1E] border-t border-white/[0.07] z-50 px-10">
      <div className="flex items-center justify-between h-full">
        {/* Left: Version */}
        <div className="text-[#4E5D7A] text-[10px]" style={{ fontFamily: 'Space Mono, monospace' }}>
          Client 360° v2.4.1 · Société Générale Algérie © 2026
        </div>

        {/* Right: Export Actions */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141C2E] border border-white/[0.07] text-[#8B97B8] text-[10px] font-[600] transition-all duration-300 hover:bg-[#1C2640] hover:text-[#F0F4FF]" style={{ fontFamily: 'Sora, sans-serif' }}>
            <FileText className="w-3.5 h-3.5" />
            <span>Rapport PDF</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E2001A] text-white text-[10px] font-[600] transition-all duration-300 hover:bg-[#C90018]" style={{ fontFamily: 'Sora, sans-serif' }}>
            <Download className="w-3.5 h-3.5" />
            <span>Exporter Données</span>
          </button>
        </div>
      </div>
    </div>
  );
}
