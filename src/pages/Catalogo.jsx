import { useMemo, useState } from 'react';
import Legenda from '../components/Legenda';
import PostCard from '../components/PostCard';
import { Carregando, EstadoErro, EstadoVazio } from '../components/Estados';
import { usePosts } from '../contexts/PostsContext';
import { useTema } from '../contexts/TemaContext';
import { useFiltroCeu } from '../hooks/useFiltroCeu';
import { contarConstelacoes, nomeTag, polemica } from '../utils/ceu';

const ORDENS = {
  vistas: { rotulo: 'Mais vistas', fn: (a, b) => b.views - a.views },
  curtidas: { rotulo: 'Mais curtidas', fn: (a, b) => (b.reactions?.likes || 0) - (a.reactions?.likes || 0) },
  polemicas: { rotulo: 'Mais polêmicas', fn: (a, b) => polemica(b) - polemica(a) },
  titulo: { rotulo: 'Título (A a Z)', fn: (a, b) => a.title.localeCompare(b.title) },
};
const POR_PAGINA = 24;

// Versão em lista (cartões) do céu: mesma busca, mesmos filtros.
// Também é a forma mais confortável para quem usa leitor de tela.
export default function Catalogo() {
  const { posts, status, erro, recarregar } = usePosts();
  const { modo } = useTema();
  const filtro = useFiltroCeu();
  const [ordem, setOrdem] = useState('vistas');
  const [quantidade, setQuantidade] = useState(POR_PAGINA);

  const constelacoes = useMemo(() => contarConstelacoes(posts), [posts]);
  const lista = useMemo(() => {
    const base = filtro.visiveis ? posts.filter((p) => filtro.visiveis.has(p.id)) : posts;
    return [...base].sort(ORDENS[ordem].fn);
  }, [posts, filtro.visiveis, ordem]);

  if (status === 'carregando') return <Carregando texto="Montando o catálogo…" />;
  if (status === 'erro') return <EstadoErro detalhe={erro?.message} aoTentar={recarregar} />;

  return (
    <div className="pagina pagina-catalogo">
      <header className="pagina-cabeca">
        <p className="sobretitulo">Catálogo de estrelas</p>
        <h1>Todas as publicações, uma a uma</h1>
        <p className="pagina-intro">
          O mesmo céu em forma de lista. A busca do telescópio e o filtro de constelação valem aqui também.
        </p>
      </header>

      <div className="barra-filtros">
        <Legenda constelacoes={constelacoes} ativa={filtro.constelacao} aoEscolher={filtro.definirConstelacao} modo={modo} className="legenda-quebra" />
        <div className="ordenar">
          <label htmlFor="ordem">Ordenar por</label>
          <select id="ordem" value={ordem} onChange={(e) => setOrdem(e.target.value)}>
            {Object.entries(ORDENS).map(([chave, o]) => (
              <option key={chave} value={chave}>{o.rotulo}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="contagem-resultados" role="status" aria-live="polite">
        {filtro.buscando ? 'Buscando…' : `${lista.length} ${lista.length === 1 ? 'publicação' : 'publicações'}`}
        {filtro.q && ` para “${filtro.q}”`}
        {filtro.constelacao && ` em ${nomeTag(filtro.constelacao)}`}
      </p>

      {lista.length === 0 ? (
        <EstadoVazio titulo="Céu limpo" texto="Nenhuma estrela combina com a busca ou com o filtro escolhido.">
          <button type="button" className="botao botao-primario" onClick={filtro.limpar}>Limpar filtros</button>
        </EstadoVazio>
      ) : (
        <>
          <ul className="grade-cartoes">
            {lista.slice(0, quantidade).map((post) => (
              <li key={post.id}>
                <PostCard post={post} modo={modo} nivel={2} />
              </li>
            ))}
          </ul>
          {quantidade < lista.length && (
            <div className="mais">
              <button type="button" className="botao botao-grande" onClick={() => setQuantidade((q) => q + POR_PAGINA)}>
                Mostrar mais {Math.min(POR_PAGINA, lista.length - quantidade)} de {lista.length - quantidade}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
