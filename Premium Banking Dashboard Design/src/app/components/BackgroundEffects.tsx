export function BackgroundEffects() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Dot Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      ></div>

      {/* Floating Orbs */}
      <div
        className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full animate-float-slow"
        style={{
          background: 'radial-gradient(circle, rgba(226,0,26,0.08) 0%, transparent 70%)',
          filter: 'blur(120px)',
          animation: 'float 12s infinite ease-in-out'
        }}
      ></div>
      <div
        className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(74,158,255,0.06) 0%, transparent 70%)',
          filter: 'blur(120px)',
          animation: 'float 14s infinite ease-in-out 2s'
        }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)',
          filter: 'blur(120px)',
          animation: 'float 16s infinite ease-in-out 4s'
        }}
      ></div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-30px);
          }
        }
      `}</style>
    </div>
  );
}
