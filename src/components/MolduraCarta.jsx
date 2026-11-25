// Moldura e rosa dos ventos que aparecem só no tema claro (carta celeste).
// São decorativas: aria-hidden para leitores de tela ignorarem.
export default function MolduraCarta() {
  const pontas = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <div className="moldura-carta" aria-hidden="true">
      <span className="canto canto-1" /><span className="canto canto-2" />
      <span className="canto canto-3" /><span className="canto canto-4" />
      <svg className="rosa-ventos" viewBox="-60 -60 120 120">
        <circle r="44" fill="none" stroke="currentColor" strokeOpacity=".5" />
        <circle r="38" fill="none" stroke="currentColor" strokeOpacity=".3" strokeDasharray="1.5 3" />
        {pontas.map((a) => {
          const longa = a % 90 === 0;
          const L = longa ? 52 : 30;
          return (
            <g key={a} transform={`rotate(${a})`}>
              <path d={`M0 ${-L} L${longa ? 6 : 4} 0 L0 ${longa ? 8 : 5} Z`} fill="currentColor" fillOpacity={longa ? 0.85 : 0.5} />
              <path d={`M0 ${-L} L${longa ? -6 : -4} 0 L0 ${longa ? 8 : 5} Z`} fill="currentColor" fillOpacity={longa ? 0.35 : 0.2} />
            </g>
          );
        })}
        <text y="-56" textAnchor="middle" fontSize="11" fill="currentColor">N</text>
      </svg>
    </div>
  );
}
