import { useMemo } from 'react';
import { Link } from 'react-router';
import Nebulosa from '../components/Nebulosa';
import { Carregando, EstadoErro } from '../components/Estados';
import { usePosts } from '../contexts/PostsContext';
import { useTema } from '../contexts/TemaContext';
import { contarConstelacoes, corTag, ehPolemica, formatar, nomeTag, polemica } from '../utils/ceu';

function Ranking({ id, titulo, itens, valor, modo }) {
  return (
    <section className="painel ranking" aria-labelledby={id}>
      <h2 id={id} className="painel-titulo">{titulo}</h2>
      <ol>
        {itens.map((post, i) => (
          <li key={post.id} style={{ '--cor': corTag(post.constelacao, modo) }}>
            <span className="ranking-pos" aria-hidden="true">{i + 1}</span>
            <span className="ranking-arte"><Nebulosa post={post} modo={modo} variante="cartao" /></span>
            <span className="ranking-texto">
              <Link to={`/estrela/${post.id}`} className="link-esticado" viewTransition>{post.title}</Link>
              <span>{nomeTag(post.constelacao)}</span>
            </span>
            <span className="ranking-valor">{valor(post)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function Observatorio() {
  const { posts, status, erro, recarregar } = usePosts();
  const { modo } = useTema();

  const dados = useMemo(() => {
    const constelacoes = contarConstelacoes(posts);
    const views = posts.reduce((s, p) => s + (p.views || 0), 0);
    const likes = posts.reduce((s, p) => s + (p.reactions?.likes || 0), 0);
    return {
      constelacoes,
      views,
      likes,
      polemicas: posts.filter(ehPolemica).length,
      maisVistas: [...posts].sort((a, b) => b.views - a.views).slice(0, 5),
      maisPolemicas: [...posts].filter((p) => (p.reactions?.likes || 0) + (p.reactions?.dislikes || 0) > 0).sort((a, b) => polemica(b) - polemica(a)).slice(0, 5),
      maisCurtidas: [...posts].sort((a, b) => (b.reactions?.likes || 0) - (a.reactions?.likes || 0)).slice(0, 5),
    };
  }, [posts]);

  if (status === 'carregando') return <Carregando texto="Calibrando o observatório…" />;
  if (status === 'erro') return <EstadoErro detalhe={erro?.message} aoTentar={recarregar} />;

  const maior = dados.constelacoes[0]?.n || 1;

  return (
    <div className="pagina pagina-observatorio">
      <header className="pagina-cabeca">
        <p className="sobretitulo">Observatório</p>
        <h1>O céu em números</h1>
        <p className="pagina-intro">
          {formatar(posts.length)} estrelas em {dados.constelacoes.length} constelações. Os números abaixo são calculados a partir dos dados da API, na hora.
        </p>
      </header>

      <dl className="numeros">
        <div><dt>Estrelas</dt><dd>{formatar(posts.length)}</dd></div>
        <div><dt>Visualizações somadas</dt><dd>{formatar(dados.views)}</dd></div>
        <div><dt>Curtidas somadas</dt><dd>{formatar(dados.likes)}</dd></div>
        <div><dt>Estrelas polêmicas</dt><dd className="cor-polemica">{formatar(dados.polemicas)}</dd></div>
      </dl>

      <div className="grade-observatorio">
        <Ranking id="r-vistas" titulo="As mais vistas" itens={dados.maisVistas} valor={(p) => formatar(p.views)} modo={modo} />
        <Ranking id="r-polemicas" titulo="As mais polêmicas" itens={dados.maisPolemicas} valor={(p) => `${Math.round(polemica(p) * 100)}%`} modo={modo} />
        <Ranking id="r-curtidas" titulo="As mais curtidas" itens={dados.maisCurtidas} valor={(p) => formatar(p.reactions?.likes)} modo={modo} />

        <section className="painel constelacoes-barras" aria-labelledby="r-constelacoes">
          <h2 id="r-constelacoes" className="painel-titulo">Tamanho das constelações</h2>
          <ul>
            {dados.constelacoes.map((c) => (
              <li key={c.tag} style={{ '--cor': corTag(c.tag, modo) }}>
                <Link to={`/?constelacao=${c.tag}`}>{nomeTag(c.tag)}</Link>
                <span className="barra" aria-hidden="true"><span style={{ width: `${(c.n / maior) * 100}%` }} /></span>
                <span className="barra-valor">{c.n}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
