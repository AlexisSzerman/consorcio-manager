export default function LoadingBuilding({ text = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl">
      <svg className="w-36 h-36" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
        {/* Cimientos */}
        <rect className="part base" x="15" y="110" width="70" height="6" rx="2" />

        {/* Piso 1 */}
        <g className="part floor floor-1">
          <rect x="25" y="80" width="50" height="25" rx="2" fill="none" />
          <rect x="30" y="85" width="8" height="10" rx="1" className="window" />
          <rect x="42" y="85" width="8" height="10" rx="1" className="window" />
          <rect x="54" y="85" width="8" height="10" rx="1" className="window" />
          <rect x="66" y="85" width="8" height="10" rx="1" className="window" />
        </g>

        {/* Piso 2 */}
        <g className="part floor floor-2">
          <rect x="25" y="50" width="50" height="25" rx="2" fill="none" />
          <rect x="30" y="55" width="8" height="10" rx="1" className="window" />
          <rect x="42" y="55" width="8" height="10" rx="1" className="window" />
          <rect x="54" y="55" width="8" height="10" rx="1" className="window" />
          <rect x="66" y="55" width="8" height="10" rx="1" className="window" />
        </g>

        {/* Piso 3 */}
        <g className="part floor floor-3">
          <rect x="25" y="20" width="50" height="25" rx="2" fill="none" />
          <rect x="30" y="25" width="8" height="10" rx="1" className="window" />
          <rect x="42" y="25" width="8" height="10" rx="1" className="window" />
          <rect x="54" y="25" width="8" height="10" rx="1" className="window" />
          <rect x="66" y="25" width="8" height="10" rx="1" className="window" />
        </g>

        {/* Techo */}
        <path className="part roof" d="M 45 20 L 50 8 L 55 20 Z" />
      </svg>

      <p className="mt-4 text-slate-600 font-medium text-sm tracking-wide">{text}</p>

      <style>{`
        .part {
          fill: none;
          stroke: #1e293b;
          stroke-width: 2.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          opacity: 0;
          animation: buildUp 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .window {
          stroke: none;
          fill: #cbd5e1;
          animation: lightUp 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .part.base    { animation-delay: 0s; }
        .part.floor-1 { animation-delay: 0.25s; }
        .part.floor-2 { animation-delay: 0.5s; }
        .part.floor-3 { animation-delay: 0.75s; }
        .part.roof    { animation-delay: 1s; }
        .floor-1 .window { animation-delay: 0.5s; }
        .floor-2 .window { animation-delay: 0.75s; }
        .floor-3 .window { animation-delay: 1s; }

        @keyframes buildUp {
          0% { opacity: 0; transform: translateY(12px); }
          15%, 85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-6px); }
        }
        @keyframes lightUp {
          0%, 35% { fill: #cbd5e1; opacity: 0.4; }
          50%, 80% { fill: #fbbf24; opacity: 1; }
          100% { fill: #cbd5e1; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
