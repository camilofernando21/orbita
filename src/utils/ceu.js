// Funções puras que transformam os dados da API em astronomia:
// cores das constelações, índice de polêmica, posição de cada estrela.

// Gerador de números pseudoaleatórios com semente. Com a mesma semente
// ele devolve sempre a mesma sequência, por isso o céu é sempre igual.
export function aleatorio(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashTexto(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}



// Matiz (0 a 360) e saturação de cada constelação.
const MATIZES = {
  history: [38, 95], love: [340, 90], crime: [262, 85], mystery: [172, 75],
  fiction: [212, 90], french: [95, 65], american: [18, 95], classic: [45, 30],
  english: [195, 80], magical: [290, 80], memories: [60, 85], nostalgia: [12, 70],
  nature: [135, 55], city: [225, 35], village: [28, 60], diversas: [210, 10],
};


export function matizTag(tag) {
  return MATIZES[tag] || [hashTexto(tag) % 360, 75];
}

// Cor da constelação para cada tema. No escuro, tons claros que brilham;
// no claro, tons escuros de tinta, com contraste alto sobre o papel.
export function corTag(tag, modo) {
  const [h, s] = matizTag(tag);
  return modo === 'light' ? `hsl(${h} ${Math.min(s, 80)}% 30%)` : `hsl(${h} ${s}% 72%)`;
}

// Na API existem 170 tags diferentes. Se cada primeira tag virasse uma
// constelação, o céu teria dezenas de constelações com uma ou duas estrelas.
// Regra usada:
// 1. Tags principais: as que aparecem em pelo menos 20 posts.
// 2. Para os posts sem tag principal, olhamos a tag mais comum deles.
//    Se essa tag reúne pelo menos 5 desses posts, ela também vira constelação.
// 3. Cada post entra na primeira das suas tags que for constelação.
//    Quem não se encaixa em nenhuma vai para "Diversas".
export function atribuirConstelacoes(posts) {
  const freq = {};
  for (const p of posts) for (const t of p.tags || []) freq[t] = (freq[t] || 0) + 1;

  const constelacoes = new Set(Object.keys(freq).filter((t) => freq[t] >= 20));
  const candidatas = {};
  for (const p of posts) {
    const tags = p.tags || [];
    if (tags.some((t) => constelacoes.has(t)) || !tags.length) continue;
    const maisComum = [...tags].sort((a, b) => freq[b] - freq[a] || a.localeCompare(b))[0];
    candidatas[maisComum] = (candidatas[maisComum] || 0) + 1;
  }
  for (const [t, n] of Object.entries(candidatas)) if (n >= 5) constelacoes.add(t);

  return posts.map((p) => ({
    ...p,
    constelacao: (p.tags || []).find((t) => constelacoes.has(t)) || 'diversas',
  }));
}

// Quanto mais empatados likes e dislikes, mais polêmico (de 0 a 1).
export function polemica(post) {
  const { likes = 0, dislikes = 0 } = post.reactions || {};
  const total = likes + dislikes;
  return total ? 1 - Math.abs(likes - dislikes) / total : 0;
}

export const ehPolemica = (post) => polemica(post) >= 0.85;

export function minutosLeitura(post) {
  const palavras = (post.texto || post.body).trim().split(/\s+/).length;
  return Math.max(1, Math.round(palavras / 200));
}


// Árvore geradora mínima: liga as estrelas de uma constelação usando
// as linhas mais curtas possíveis, sem formar ciclos.
function arvoreMinima(pontos) {
  if (pontos.length < 2) return [];
  const dentro = [pontos[0]];
  const fora = pontos.slice(1);
  const linhas = [];
  while (fora.length) {
    let melhor = null;
    for (const a of dentro) {
      for (const b of fora) {
        const d = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        if (!melhor || d < melhor.d) melhor = { a, b, d };
      }
    }
    linhas.push([melhor.a, melhor.b]);
    dentro.push(melhor.b);
    fora.splice(fora.indexOf(melhor.b), 1);
  }
  return linhas;
}

const ANGULO_DOURADO = Math.PI * (3 - Math.sqrt(5));

// Calcula a posição de todas as estrelas num mundo de largura W e altura H.
export function montarCeu(posts, W, H) {
  const S = Math.min(W, H);
  const grupos = new Map();
  for (const post of posts) {
    const tag = post.constelacao || 'diversas';
    if (!grupos.has(tag)) grupos.set(tag, []);
    grupos.get(tag).push(post);
  }

  // 1. Cada constelação recebe um círculo proporcional ao número de estrelas,
  //    distribuído em espiral (como as sementes de um girassol).
  //    A ordem é alfabética para o céu não "pular" quando uma estrela nasce.
  const unidade = S * 0.024;
  const constelacoes = [...grupos.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([tag, lista], i, todas) => {
      const raio = unidade * Math.sqrt(lista.length) + S * 0.02;
      const ang = i * ANGULO_DOURADO;
      const dist = Math.sqrt((i + 0.5) / todas.length);
      return { tag, lista, raio, x: W / 2 + Math.cos(ang) * dist * W * 0.36, y: H / 2 + Math.sin(ang) * dist * H * 0.34 };
    });

  // 2. Empurra os círculos que se sobrepõem até todos caberem sem encostar.
  for (let passo = 0; passo < 120; passo++) {
    for (let i = 0; i < constelacoes.length; i++) {
      for (let j = i + 1; j < constelacoes.length; j++) {
        const a = constelacoes[i];
        const b = constelacoes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const minimo = a.raio + b.raio + S * 0.05;
        if (d < minimo) {
          const ajuste = (minimo - d) / 2;
          a.x -= (dx / d) * ajuste; a.y -= (dy / d) * ajuste;
          b.x += (dx / d) * ajuste; b.y += (dy / d) * ajuste;
        }
      }
    }
    for (const c of constelacoes) {
      c.x += (W / 2 - c.x) * 0.01;
      c.y += (H / 2 - c.y) * 0.01;
    }
  }

  // 3. Dentro de cada constelação, as estrelas mais vistas ficam no centro.
  const estrelas = [];
  for (const c of constelacoes) {
    const ordenadas = [...c.lista].sort((a, b) => b.views - a.views);
    c.estrelas = ordenadas.map((post, j) => {
      const r = aleatorio(post.id * 7919 + 1);
      const ang = j * ANGULO_DOURADO + r() * 0.4;
      const dist = unidade * Math.sqrt(j + 0.6) * (0.85 + r() * 0.2);
      const estrela = {
        post,
        id: post.id,
        tag: c.tag,
        x: c.x + Math.cos(ang) * dist,
        y: c.y + Math.sin(ang) * dist,
        r: post.local ? 6 : Math.max(3, 2 + Math.sqrt(post.views || 0) / 11),
      };
      estrelas.push(estrela);
      return estrela;
    });
    c.linhas = arvoreMinima(c.estrelas);
    c.topo = Math.min(...c.estrelas.map((e) => e.y - e.r));
  }

  return { estrelas, constelacoes, W, H };
}

// Lista de constelações com a quantidade de estrelas, da maior para a menor.
export function contarConstelacoes(posts) {
  const contagem = new Map();
  for (const p of posts) {
    const tag = p.constelacao || 'diversas';
    contagem.set(tag, (contagem.get(tag) || 0) + 1);
  }
  return [...contagem.entries()]
    .map(([tag, n]) => ({ tag, n }))
    .sort((a, b) => b.n - a.n || a.tag.localeCompare(b.tag));
}

// Caixa que envolve uma lista de estrelas: [x0, y0, x1, y1]
export function caixa(estrelas) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const e of estrelas) {
    x0 = Math.min(x0, e.x - e.r); y0 = Math.min(y0, e.y - e.r);
    x1 = Math.max(x1, e.x + e.r); y1 = Math.max(y1, e.y + e.r);
  }
  return [x0, y0, x1, y1];
}

// Navegação espacial: a partir da estrela atual, encontra a mais próxima
// na direção da seta (dentro de um cone de uns 60 graus).
export function proximaNaDirecao(atual, candidatas, dx, dy) {
  let melhor = null;
  let melhorNota = Infinity;
  for (const e of candidatas) {
    if (e === atual) continue;
    const vx = e.x - atual.x;
    const vy = e.y - atual.y;
    const d = Math.hypot(vx, vy);
    const cos = (vx * dx + vy * dy) / d;
    if (cos < 0.45) continue;
    const nota = d * (1 + (1 - cos) * 2.5);
    if (nota < melhorNota) { melhorNota = nota; melhor = e; }
  }
  return melhor;
}
