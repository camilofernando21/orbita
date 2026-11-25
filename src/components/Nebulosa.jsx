import { useId } from 'react';
import { aleatorio, matizTag } from '../utils/ceu';

// Arte gerada por código para cada publicação. A semente vem do id do post,
// então cada post tem a sua nebulosa e ela é sempre a mesma.
// - cor: vem da constelação (primeira tag)
// - tamanho da estrela central: visualizações
// - satélites: um para cada comentário (só na versão grande)

function hslParaRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

const TAMANHOS = { hero: [1200, 520], cartao: [400, 225], previa: [400, 300] };

export default function Nebulosa({ post, modo, variante = 'hero', satelites = 0, semente }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const r = aleatorio(semente ?? post.id * 131 + 7);
  const [W, H] = TAMANHOS[variante] || TAMANHOS.hero;
  const grande = variante === 'hero';
  const escuro = modo !== 'light';
  const [matiz, sat] = matizTag(post.constelacao || post.tags?.[0] || 'diversas');

  const nuvens = Array.from({ length: grande ? 7 : 4 }, (_, i) => {
    const h = i === 2 ? (matiz + 170) % 360 : (matiz + (r() - 0.5) * 60 + 360) % 360;
    return {
      cx: W * (0.15 + r() * 0.7),
      cy: H * (0.15 + r() * 0.7),
      rx: W * (0.18 + r() * 0.28),
      ry: H * (0.25 + r() * 0.38),
      rot: r() * 180,
      cor: escuro ? `hsl(${h} ${Math.max(sat, 55)}% ${55 + r() * 15}%)` : `hsl(${h} ${Math.min(sat, 55)}% 42%)`,
      opacidade: escuro ? 0.3 + r() * 0.4 : 0.14 + r() * 0.16,
    };
  });

  const poeira = Array.from({ length: grande ? 170 : 45 }, () => ({
    x: r() * W, y: r() * H, r: r() < 0.93 ? 0.4 + r() * 1.1 : 1.4 + r() * 1.4, o: 0.25 + r() * 0.75,
  }));

  const sx = W * (0.5 + (r() - 0.5) * 0.18);
  const sy = H * (0.5 + (r() - 0.5) * 0.12);
  const fator = grande ? 1 : 0.45;
  const raio = (5 + Math.sqrt(post.views || 0) / 6) * fator;
  const raioRaio = raio * (grande ? 9 : 7);
  const tinta = escuro ? '#ffffff' : '#231d14';
  const fundo = escuro ? '#04060d' : '#efe4c8';
  const [cr, cg, cb] = hslParaRgb(matiz, Math.max(sat, 50), escuro ? 60 : 35);
  const luas = Math.min(satelites, 7);

  return (
    <svg
      className={`nebulosa nebulosa-${variante}`}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`Nebulosa gerada a partir da publicação "${post.title}"`}
    >
      <defs>
        {nuvens.map((n, i) => (
          <radialGradient key={i} id={`${uid}n${i}`}>
            <stop offset="0" stopColor={n.cor} stopOpacity={n.opacidade} />
            <stop offset="0.55" stopColor={n.cor} stopOpacity={n.opacidade * 0.35} />
            <stop offset="1" stopColor={n.cor} stopOpacity="0" />
          </radialGradient>
        ))}
        <radialGradient id={`${uid}brilho`}>
          <stop offset="0" stopColor={escuro ? '#fff' : '#3b2f1c'} stopOpacity={escuro ? 1 : 0.55} />
          <stop offset="0.18" stopColor={`hsl(${matiz} 90% ${escuro ? 80 : 35}%)`} stopOpacity={escuro ? 0.7 : 0.35} />
          <stop offset="1" stopColor={`hsl(${matiz} 90% 60%)`} stopOpacity="0" />
        </radialGradient>
        {grande && (
          <filter id={`${uid}gas`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.006 0.011" numOctaves="4" seed={post.id % 97} />
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${cr.toFixed(3)}  0 0 0 0 ${cg.toFixed(3)}  0 0 0 0 ${cb.toFixed(3)}  ${escuro ? 1.3 : 0.9} 0 0 0 -0.45`}
            />
          </filter>
        )}
      </defs>

      <rect width={W} height={H} fill={fundo} />
      {grande && <rect width={W} height={H} filter={`url(#${uid}gas)`} opacity={escuro ? 0.55 : 0.35} />}
      {nuvens.map((n, i) => (
        <ellipse key={i} cx={n.cx} cy={n.cy} rx={n.rx} ry={n.ry} fill={`url(#${uid}n${i})`} transform={`rotate(${n.rot.toFixed(1)} ${n.cx.toFixed(1)} ${n.cy.toFixed(1)})`} />
      ))}

      {!escuro && (
        <g stroke="#3b2f1c" strokeOpacity="0.18" strokeWidth="1" fill="none">
          {Array.from({ length: 6 }, (_, i) => <line key={`v${i}`} x1={(W / 6) * i} y1="0" x2={(W / 6) * i} y2={H} />)}
          {Array.from({ length: 4 }, (_, i) => <line key={`h${i}`} x1="0" y1={(H / 4) * i} x2={W} y2={(H / 4) * i} />)}
          <circle cx={sx} cy={sy} r={Math.min(W, H) * 0.36} strokeDasharray="4 6" />
        </g>
      )}

      <g fill={tinta}>
        {poeira.map((p, i) => <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={p.r.toFixed(2)} opacity={p.o.toFixed(2)} />)}
      </g>

      {luas > 0 && (
        <g transform={`translate(${sx.toFixed(1)} ${sy.toFixed(1)})`} className="nebulosa-satelites">
          {Array.from({ length: luas }, (_, i) => {
            const R = raio * 3 + 34 + i * 26;
            return (
              <g key={i} className="orbita" style={{ animationDuration: `${14 + i * 7}s`, animationDelay: `-${i * 4}s` }}>
                <circle r={R} fill="none" stroke={tinta} strokeOpacity="0.35" strokeWidth="1.2" strokeDasharray="3 7" />
                <circle cx={R} r={6} fill={tinta} />
                <circle cx={-R} r={6} fill="none" />
              </g>
            );
          })}
        </g>
      )}

      <g transform={`translate(${sx.toFixed(1)} ${sy.toFixed(1)})`}>
        <circle r={raio * 7} fill={`url(#${uid}brilho)`} />
        <g stroke={tinta} strokeLinecap="round">
          <line x1={-raioRaio} x2={raioRaio} strokeWidth={grande ? 1.4 : 0.9} strokeOpacity="0.75" />
          <line y1={-raioRaio} y2={raioRaio} strokeWidth={grande ? 1.4 : 0.9} strokeOpacity="0.75" />
          <line x1={-raioRaio * 0.4} y1={-raioRaio * 0.4} x2={raioRaio * 0.4} y2={raioRaio * 0.4} strokeWidth="0.8" strokeOpacity="0.35" />
          <line x1={-raioRaio * 0.4} y1={raioRaio * 0.4} x2={raioRaio * 0.4} y2={-raioRaio * 0.4} strokeWidth="0.8" strokeOpacity="0.35" />
        </g>
        <circle r={raio} fill={escuro ? '#fff' : '#231d14'} />
      </g>
    </svg>
  );
}
