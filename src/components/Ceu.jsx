import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { aleatorio, caixa, corTag, ehPolemica, proximaNaDirecao } from '../utils/ceu';
import { useLingua } from '../contexts/LinguaContext';

const reduzirMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Três camadas de poeira estelar ao fundo. Quanto maior o k, mais distante
// a camada parece: ela se move menos quando a câmera anda (efeito parallax).
const CAMADAS = [
  { k: 0.92, n: 190, raio: [0.45, 1] },
  { k: 0.72, n: 120, raio: [0.6, 1.4] },
  { k: 0.45, n: 55, raio: [0.9, 1.9] },
];

const DIRECOES = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

let introJaTocou = false; // a animação de abertura toca uma vez por visita

export default function Ceu({ ceu, visiveis, modo, nasceu, focar, aoAbrir }) {
  const { estrelas, constelacoes, W, H } = ceu;
  const { t, nomeTag, formatar } = useLingua();

  const svgRef = useRef(null);
  const camadasRef = useRef([]);
  const dicaRef = useRef(null);
  const vbRef = useRef({ x: 0, y: 0, w: W, h: H });
  const animRef = useRef(0);
  const gesto = useRef({ ponteiros: new Map(), percorrido: 0, moveu: false });
  const aoAbrirRef = useRef(aoAbrir);
  aoAbrirRef.current = aoAbrir;

  const [dicaId, setDicaId] = useState(null);
  const [nascendo, setNascendo] = useState(null);
  const [intro] = useState(() => !introJaTocou && !reduzirMovimento());

  const porId = useMemo(() => new Map(estrelas.map((e) => [e.id, e])), [estrelas]);
  const candidatas = useMemo(
    () => (visiveis ? estrelas.filter((e) => visiveis.has(e.id)) : estrelas),
    [estrelas, visiveis],
  );

  const poeira = useMemo(
    () =>
      CAMADAS.map((camada, i) => {
        const r = aleatorio(31 + i * 17);
        return Array.from({ length: camada.n }, (_, j) => ({
          x: (r() * 2 - 0.5) * W,
          y: (r() * 2 - 0.5) * H,
          r: camada.raio[0] + r() * (camada.raio[1] - camada.raio[0]),
          pisca: j % 5 === 0,
          atraso: (r() * 6).toFixed(2),
        }));
      }),
    [W, H],
  );

  /* ---------- câmera ---------- */

  const posicionarDica = useCallback(() => {
    const el = dicaRef.current;
    const alvo = el?.dataset.alvo && document.querySelector(`#estrela-${el.dataset.alvo} .nucleo`);
    if (!alvo) return;
    const b = alvo.getBoundingClientRect();
    const x = Math.min(window.innerWidth - el.offsetWidth - 8, Math.max(8, b.left + b.width / 2 - el.offsetWidth / 2));
    const acima = b.top - el.offsetHeight - 14;
    el.style.transform = `translate(${x}px, ${acima < 8 ? b.bottom + 14 : acima}px)`;
  }, []);

  // Aplica uma "visão" da câmera: muda o viewBox do SVG e move as camadas de fundo.
  const aplicar = useCallback(
    (v) => {
      vbRef.current = v;
      const svg = svgRef.current;
      if (!svg) return;
      svg.setAttribute('viewBox', `${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.w.toFixed(2)} ${v.h.toFixed(2)}`);
      // Os nomes das constelações mantêm um tamanho confortável em qualquer zoom.
      svg.style.setProperty('--zoom', Math.min(1.6, Math.max(0.42, v.w / W)).toFixed(3));
      const cx = v.x + v.w / 2;
      const cy = v.y + v.h / 2;
      CAMADAS.forEach((camada, i) => {
        const g = camadasRef.current[i];
        if (!g) return;
        const f = Math.pow(v.w / W, camada.k);
        const ax = W / 2 + (cx - W / 2) * (1 - camada.k);
        const ay = H / 2 + (cy - H / 2) * (1 - camada.k);
        g.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)}) scale(${f.toFixed(4)}) translate(${(-ax).toFixed(2)} ${(-ay).toFixed(2)})`);
      });
      posicionarDica();
    },
    [W, H, posicionarDica],
  );

  // Anima a câmera até a visão "alvo" com aceleração suave.
  const voar = useCallback(
    (alvo, duracao = 900) => {
      cancelAnimationFrame(animRef.current);
      const de = { ...vbRef.current };
      const D = reduzirMovimento() ? 0 : duracao;
      const inicio = performance.now();
      const passo = (agora) => {
        const k = D ? Math.min(1, (agora - inicio) / D) : 1;
        const e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
        aplicar({
          x: de.x + (alvo.x - de.x) * e,
          y: de.y + (alvo.y - de.y) * e,
          w: de.w + (alvo.w - de.w) * e,
          h: de.h + (alvo.h - de.h) * e,
        });
        if (k < 1) animRef.current = requestAnimationFrame(passo);
      };
      animRef.current = requestAnimationFrame(passo);
    },
    [aplicar],
  );

  // Enquadra uma caixa na área livre da tela (entre o cabeçalho e a legenda).
  const enquadrar = useCallback(
    ([x0, y0, x1, y1], folga = 60, duracao) => {
      const svg = svgRef.current;
      if (!svg || !Number.isFinite(x0)) return;
      const alturaTela = window.innerHeight;
      const topo = document.querySelector('.cabecalho')?.getBoundingClientRect().bottom ?? 0;
      const rodape = document.querySelector('.legenda-ceu')?.getBoundingClientRect().top ?? alturaTela;
      const oy = (topo + 12) / alturaTela;
      const rh = Math.max(0.3, (rodape - 12) / alturaTela - oy);
      const A = svg.clientWidth / svg.clientHeight;
      const minimo = Math.min(W, H) * 0.12;
      const bw = Math.max(x1 - x0, minimo) + folga * 2;
      const bh = Math.max(y1 - y0, minimo) + folga * 2;
      const w = Math.max(bw, (bh * A) / rh);
      const h = w / A;
      voar({ x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - (oy + rh / 2) * h, w, h }, duracao);
    },
    [W, H, voar],
  );

  const visaoGeral = useCallback(
    (duracao) => {
      if (!estrelas.length) return;
      const [x0, y0, x1, y1] = caixa(estrelas);
      enquadrar([x0, y0 - 40, x1, y1], 40, duracao);
    },
    [estrelas, enquadrar],
  );

  const zoom = useCallback(
    (fator, animado = true, ponto) => {
      const v = vbRef.current;
      const w = Math.min(W * 2.4, Math.max(W * 0.07, v.w * fator));
      const h = (w * v.h) / v.w;
      const p = ponto || { x: v.x + v.w / 2, y: v.y + v.h / 2, fx: 0.5, fy: 0.5 };
      const nova = { x: p.x - p.fx * w, y: p.y - p.fy * h, w, h };
      if (animado) voar(nova, 450);
      else aplicar(nova);
    },
    [W, aplicar, voar],
  );

  const garantirVisivel = useCallback(
    (e) => {
      const v = vbRef.current;
      const fora = e.x < v.x + v.w * 0.08 || e.x > v.x + v.w * 0.92 || e.y < v.y + v.h * 0.22 || e.y > v.y + v.h * 0.82;
      if (fora) voar({ ...v, x: e.x - v.w / 2, y: e.y - v.h * 0.55 }, 600);
    },
    [voar],
  );

  const focarEstrela = useCallback((id) => {
    document.getElementById(`estrela-${id}`)?.focus({ preventScroll: true });
  }, []);

  const maisCentral = useCallback(() => {
    const v = vbRef.current;
    const cx = v.x + v.w / 2;
    const cy = v.y + v.h / 2;
    let melhor = null;
    for (const e of candidatas) {
      if (!melhor || Math.hypot(e.x - cx, e.y - cy) < Math.hypot(melhor.x - cx, melhor.y - cy)) melhor = e;
    }
    return melhor;
  }, [candidatas]);

  /* ---------- efeitos ---------- */

  // Antes da primeira pintura, a câmera mostra o mundo inteiro.
  useLayoutEffect(() => {
    aplicar({ x: 0, y: 0, w: W, h: H });
  }, [W, H, aplicar]);

  // Decide para onde a câmera vai: estrela recém-criada, estrela de onde
  // a pessoa voltou, resultado de busca/filtro ou visão geral.
  useEffect(() => {
    if (!estrelas.length) return;
    const alvoNasceu = nasceu && porId.get(nasceu);
    const alvoFocar = focar && porId.get(focar);
    const alvo = alvoNasceu || alvoFocar;

    if (alvo) {
      const R = Math.min(W, H) * 0.2;
      enquadrar([alvo.x - R, alvo.y - R, alvo.x + R, alvo.y + R], 20, 1100);
      if (alvoNasceu) setNascendo(alvo.id);
      const t = setTimeout(() => focarEstrela(alvo.id), alvoNasceu ? 350 : 50);
      const t2 = setTimeout(() => setNascendo(null), 2200);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
    if (visiveis && candidatas.length) enquadrar(caixa(candidatas), 90);
    else if (!visiveis) visaoGeral(intro ? 1800 : 900);
    // A câmera só deve se mover quando o filtro, o tamanho ou o destino mudam.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W, H, visiveis, nasceu, focar]);

  useEffect(() => {
    if (!intro) return;
    const t = setTimeout(() => { introJaTocou = true; }, 2500);
    return () => clearTimeout(t);
  }, [intro]);

  // Roda do mouse: zoom em direção ao ponteiro.
  useEffect(() => {
    const svg = svgRef.current;
    function aoRolar(e) {
      e.preventDefault();
      cancelAnimationFrame(animRef.current);
      const r = svg.getBoundingClientRect();
      const v = vbRef.current;
      const fx = (e.clientX - r.left) / r.width;
      const fy = (e.clientY - r.top) / r.height;
      zoom(Math.exp(e.deltaY * 0.0016), false, { x: v.x + fx * v.w, y: v.y + fy * v.h, fx, fy });
    }
    svg.addEventListener('wheel', aoRolar, { passive: false });
    return () => svg.removeEventListener('wheel', aoRolar);
  }, [zoom]);

  // Arrastar com um dedo/mouse move o céu; pinça com dois dedos dá zoom.
  useEffect(() => {
    function aoMover(e) {
      const g = gesto.current;
      const anterior = g.ponteiros.get(e.pointerId);
      if (!anterior) return;
      const svg = svgRef.current;
      const r = svg.getBoundingClientRect();
      const v = { ...vbRef.current };
      const escala = v.w / r.width;

      if (g.ponteiros.size === 1) {
        const dx = e.clientX - anterior.x;
        const dy = e.clientY - anterior.y;
        g.percorrido += Math.abs(dx) + Math.abs(dy);
        if (g.percorrido > 6) {
          g.moveu = true;
          svg.classList.add('arrastando');
        }
        if (g.moveu) aplicar({ ...v, x: v.x - dx * escala, y: v.y - dy * escala });
      } else if (g.ponteiros.size === 2) {
        const outro = [...g.ponteiros.entries()].find(([id]) => id !== e.pointerId)[1];
        const d0 = Math.hypot(anterior.x - outro.x, anterior.y - outro.y);
        const d1 = Math.hypot(e.clientX - outro.x, e.clientY - outro.y);
        if (d0 > 0 && d1 > 0) {
          g.moveu = true;
          const mx = (outro.x + e.clientX) / 2 - r.left;
          const my = (outro.y + e.clientY) / 2 - r.top;
          zoom(d0 / d1, false, { x: v.x + mx * escala, y: v.y + my * escala, fx: mx / r.width, fy: my / r.height });
        }
      }
      g.ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    function aoSoltar(e) {
      gesto.current.ponteiros.delete(e.pointerId);
      if (!gesto.current.ponteiros.size) svgRef.current?.classList.remove('arrastando');
    }
    window.addEventListener('pointermove', aoMover);
    window.addEventListener('pointerup', aoSoltar);
    window.addEventListener('pointercancel', aoSoltar);
    return () => {
      window.removeEventListener('pointermove', aoMover);
      window.removeEventListener('pointerup', aoSoltar);
      window.removeEventListener('pointercancel', aoSoltar);
    };
  }, [aplicar, zoom]);

  function aoPressionar(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const g = gesto.current;
    if (!g.ponteiros.size) {
      g.percorrido = 0;
      g.moveu = false;
    }
    g.ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    cancelAnimationFrame(animRef.current);
  }

  // Setas com o foco "solto" na página entram no céu pela estrela central.
  useEffect(() => {
    function aoTeclar(e) {
      if (!DIRECOES[e.key] || e.defaultPrevented) return;
      const ativo = document.activeElement;
      if (ativo && ativo !== document.body && ativo.id !== 'conteudo') return;
      if (document.querySelector('dialog[open]')) return;
      e.preventDefault();
      const e0 = maisCentral();
      if (e0) focarEstrela(e0.id);
    }
    function aoPedirResultado() {
      const maior = [...candidatas].sort((a, b) => b.r - a.r)[0];
      if (maior) focarEstrela(maior.id);
    }
    window.addEventListener('keydown', aoTeclar);
    window.addEventListener('orbita:focar-resultado', aoPedirResultado);
    return () => {
      window.removeEventListener('keydown', aoTeclar);
      window.removeEventListener('orbita:focar-resultado', aoPedirResultado);
    };
  }, [candidatas, maisCentral, focarEstrela]);

  useLayoutEffect(() => {
    posicionarDica();
  }, [dicaId, posicionarDica]);

  function aoTeclarNoCeu(e) {
    const g = e.target.closest?.('.estrela');
    const atual = g ? porId.get(Number(g.dataset.id)) : null;

    if (DIRECOES[e.key]) {
      e.preventDefault();
      const proxima = atual ? proximaNaDirecao(atual, candidatas, ...DIRECOES[e.key]) : maisCentral();
      if (proxima) focarEstrela(proxima.id);
      return;
    }
    if (atual && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      aoAbrirRef.current(atual.id);
      return;
    }
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoom(0.6); }
    if (e.key === '-' || e.key === '_') { e.preventDefault(); zoom(1 / 0.6); }
    if (e.key === '0') { e.preventDefault(); visaoGeral(); }
  }

  /* ---------- desenho ---------- */

  const grade = useMemo(() => {
    const cx = W / 2;
    const cy = H / 2;
    const S = Math.min(W, H);
    const aneis = Array.from({ length: 7 }, (_, i) => <circle key={`a${i}`} cx={cx} cy={cy} r={(i + 1) * S * 0.1} />);
    const raios = Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      return <line key={`r${i}`} x1={cx} y1={cy} x2={cx + Math.cos(a) * S * 0.75} y2={cy + Math.sin(a) * S * 0.75} />;
    });
    return [...aneis, ...raios];
  }, [W, H]);

  const maxLikes = useMemo(() => Math.max(1, ...estrelas.map((e) => e.post.reactions?.likes || 0)), [estrelas]);

  // As estrelas só são redesenhadas quando dados, filtro ou tema mudam
  // (não a cada movimento do mouse).
  const desenhoEstrelas = useMemo(
    () =>
      estrelas.map((e, i) => {
        const p = e.post;
        const pol = ehPolemica(p);
        const apagada = visiveis && !visiveis.has(e.id);
        const brilho = Math.min(1, (p.reactions?.likes || 0) / maxLikes);
        const a = (e.r * 2).toFixed(1);
        const classes = ['estrela', pol && 'polemica', apagada && 'apagada', nascendo === e.id && 'nasce'].filter(Boolean).join(' ');
        const rotulo = t('ceu.estrelaRotulo', { titulo: p.titulo, constelacao: nomeTag(e.tag), views: formatar(p.views), likes: formatar(p.reactions?.likes), polemica: pol });
        return (
          <g
            key={e.id}
            id={`estrela-${e.id}`}
            data-id={e.id}
            className={classes}
            transform={`translate(${e.x.toFixed(1)} ${e.y.toFixed(1)})`}
            tabIndex={apagada ? -1 : 0}
            role="button"
            aria-roledescription={t('ceu.estrela')}
            aria-label={rotulo}
            style={{ color: corTag(e.tag, modo), '--d': `${i * 5}ms` }}
            onClick={() => {
              if (gesto.current.moveu) return;
              aoAbrirRef.current(e.id);
            }}
            onFocus={() => {
              setDicaId(e.id);
              garantirVisivel(e);
            }}
            onBlur={() => setDicaId(null)}
            onPointerEnter={() => setDicaId(e.id)}
            onPointerLeave={() => {
              if (document.activeElement?.id !== `estrela-${e.id}`) setDicaId(null);
            }}
          >
            <g className="corpo">
              <circle className="halo" r={(e.r * 3.4).toFixed(1)} opacity={(0.04 + brilho * 0.1).toFixed(2)} />
              <circle className="halo" r={(e.r * 1.9).toFixed(1)} opacity={(0.1 + brilho * 0.25).toFixed(2)} />
              {pol && <circle className="pulso" r={(e.r + 5).toFixed(1)} />}
              <path className="raios" d={`M${-a} 0H${a}M0 ${-a}V${a}`} />
              <circle className="nucleo" r={e.r.toFixed(1)} opacity={(0.65 + brilho * 0.35).toFixed(2)} />
              <circle className="anel" r={(e.r + 8).toFixed(1)} />
              <circle className="alvo" r={Math.max(e.r + 9, 16).toFixed(1)} />
            </g>
          </g>
        );
      }),
    [estrelas, visiveis, modo, nascendo, maxLikes, garantirVisivel, t, nomeTag, formatar],
  );

  const dica = dicaId && porId.get(dicaId);

  return (
    <div className="ceu" onKeyDown={aoTeclarNoCeu}>
      <svg
        ref={svgRef}
        className={`ceu-svg${intro ? ' intro' : ''}`}
        role="group"
        aria-label={t('ceu.rotulo')}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={aoPressionar}
      >
        <g className="ceu-grade" aria-hidden="true">{grade}</g>
        {CAMADAS.map((_, i) => (
          <g key={i} ref={(el) => { camadasRef.current[i] = el; }} className={`poeira poeira-${i}`} aria-hidden="true">
            {poeira[i].map((p, j) => (
              <circle
                key={j}
                cx={p.x.toFixed(1)}
                cy={p.y.toFixed(1)}
                r={p.r.toFixed(2)}
                className={p.pisca ? 'pisca' : undefined}
                style={p.pisca ? { animationDelay: `-${p.atraso}s` } : undefined}
              />
            ))}
          </g>
        ))}
        <g className="ceu-linhas" aria-hidden="true">
          {constelacoes.map((c) =>
            c.linhas.map(([a, b], k) => (
              <line
                key={`${c.tag}-${k}`}
                className={visiveis && !(visiveis.has(a.id) && visiveis.has(b.id)) ? 'apagada' : undefined}
                x1={a.x.toFixed(1)} y1={a.y.toFixed(1)} x2={b.x.toFixed(1)} y2={b.y.toFixed(1)}
              />
            )),
          )}
        </g>
        <g className="ceu-rotulos" aria-hidden="true">
          {constelacoes.map((c) => (
            <text
              key={c.tag}
              x={c.x.toFixed(1)}
              y={(c.topo - 18).toFixed(1)}
              textAnchor="middle"
              className={visiveis && !c.estrelas.some((e) => visiveis.has(e.id)) ? 'apagada' : undefined}
            >
              {nomeTag(c.tag)}
            </text>
          ))}
        </g>
        <g className="ceu-estrelas">{desenhoEstrelas}</g>
      </svg>

      <div className="ceu-zoom" role="group" aria-label={t('ceu.zoom')}>
        <button type="button" className="botao-icone" onClick={() => zoom(0.6)} aria-label={t('ceu.aproximar')} title={t('ceu.aproximar')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
        <button type="button" className="botao-icone" onClick={() => zoom(1 / 0.6)} aria-label={t('ceu.afastar')} title={t('ceu.afastar')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /></svg>
        </button>
        <button type="button" className="botao-icone" onClick={() => visaoGeral()} aria-label={t('ceu.inteiro')} title={t('ceu.inteiro')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="1.5" /></svg>
        </button>
      </div>

      <div ref={dicaRef} className="dica" hidden={!dica} data-alvo={dica ? dica.id : ''} aria-hidden="true">
        {dica && (
          <>
            <strong lang={dica.post.idioma}>{dica.post.titulo}</strong>
            <span>
              {nomeTag(dica.tag)} · {formatar(dica.post.views)} {t('ceu.visualizacoes')}
            </span>
            <span className="dica-tecla">{t('ceu.dicaAbrir')}</span>
          </>
        )}
      </div>
    </div>
  );
}
