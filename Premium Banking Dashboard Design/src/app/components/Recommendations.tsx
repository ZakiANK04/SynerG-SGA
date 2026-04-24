const recommendations = [
  {
    priority: 'high',
    title: 'Proposer CREDOC Import',
    description: 'Client à fort potentiel import. Volume mensuel estimé: 5M DZD',
    color: '#FF5670',
    border: '#FF5670'
  },
  {
    priority: 'medium',
    title: 'Couverture Forex EUR/DZD',
    description: 'Exposition au risque de change détectée. Proposer contrat de couverture',
    color: '#FF7B2E',
    border: '#FF7B2E'
  },
  {
    priority: 'low',
    title: 'Cross-sell Assurance',
    description: 'Opportunité assurance crédit et multirisque professionnelle',
    color: '#00C27A',
    border: '#00C27A'
  }
];

export function Recommendations() {
  return (
    <div className="space-y-4">
      <h3 className="text-[#F0F4FF] text-[16px] font-[600] mb-6" style={{ fontFamily: 'Sora, sans-serif' }}>
        Recommandations
      </h3>
      {recommendations.map((rec, index) => (
        <div
          key={index}
          className="bg-[#141C2E] rounded-[20px] border border-white/[0.07] p-5 transition-all duration-300 hover:translate-x-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative overflow-hidden"
          style={{
            borderLeft: `3px solid ${rec.border}`,
            backgroundColor: `${rec.color}0F`
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-[#F0F4FF] text-[13px] font-[600]" style={{ fontFamily: 'Sora, sans-serif' }}>
              {rec.title}
            </h4>
            <div
              className="px-2.5 py-1 rounded-full text-[9px] font-[600] uppercase tracking-[1px]"
              style={{
                backgroundColor: `${rec.color}30`,
                color: rec.color,
                fontFamily: 'Sora, sans-serif'
              }}
            >
              {rec.priority === 'high' ? 'HAUTE' : rec.priority === 'medium' ? 'MOYENNE' : 'FAIBLE'}
            </div>
          </div>
          <p className="text-[#8B97B8] text-[11px]" style={{ fontFamily: 'Sora, sans-serif' }}>
            {rec.description}
          </p>
        </div>
      ))}
    </div>
  );
}
