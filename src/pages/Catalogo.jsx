import { useMemo, useState } from 'react';
import Legenda from '../components/Legenda';
import PostCard from '../components/PostCard';
import { Carregando, EstadoErro, EstadoVazio } from '../components/Estados';
import { usePosts } from '../contexts/PostsContext';
import { useTema } from '../contexts/TemaContext';
import { useFiltroCeu } from '../hooks/useFiltroCeu';
import { contarConstelacoes, polemica } from '../utils/ceu';
import { useLingua } from '../contexts/LinguaContext';

const ORDENS = {
  vistas: { rotulo: 'catalogo.vistas', fn: (a, b) => b.views - a.views },
  curtidas: { rotulo: 'catalogo.curtidas', fn: (a, b) => (b.reactions?.likes || 0) - (a.reactions?.likes || 0) },
  polemicas: { rotulo: 'catalogo.polemicas', fn: (a, b) => polemica(b) - polemica(a) },
  titulo: { rotulo: 'catalogo.tituloAZ', fn: (a, b) => a.titulo.localeCompare(b.titulo) },
};
const POR_PAGINA = 24;

// Versão em lista (cartões) do céu: mesma busca, mesmos filtros.
// Também é a forma mais confortável para quem usa leitor de tela.
export default function Catalogo() {
  const { posts, status, erro, recarregar } = usePosts();
  const { modo } = useTema();
  const { t, nomeTag } = useLingua();
  const filtro = useFiltroCeu();
  const [ordem, setOrdem] = useState('vistas');
  const [quantidade, setQuantidade] = useState(POR_PAGINA);

  const constelacoes = useMemo(() => contarConstelacoes(posts), [posts]);
  const lista = useMemo(() => {
    const base = filtro.visiveis ? posts.filter((p) => filtro.visiveis.has(p.id)) : posts;
    return [...base].sort(ORDENS[ordem].fn);
  }, [posts, filtro.visiveis, ordem]);

  if (status === 'carregando') return <Carregando texto={t('catalogo.carregando')} />;
  if (status === 'erro') return <EstadoErro detalhe={erro?.message} aoTentar={recarregar} />;

  return (
    <div className="pagina pagina-catalogo">
      <header className="pagina-cabeca">
        <p className="sobretitulo">{t('catalogo.sobre')}</p>
        <h1>{t('catalogo.titulo')}</h1>
        <p className="pagina-intro">{t('catalogo.intro')}</p>
      </header>

      <div className="barra-filtros">
        <Legenda constelacoes={constelacoes} ativa={filtro.constelacao} aoEscolher={filtro.definirConstelacao} modo={modo} className="legenda-quebra" />
        <div className="ordenar">
          <label htmlFor="ordem">{t('catalogo.ordenar')}</label>
          <select id="ordem" value={ordem} onChange={(e) => setOrdem(e.target.value)}>
            {Object.entries(ORDENS).map(([chave, o]) => (
              <option key={chave} value={chave}>{t(o.rotulo)}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="contagem-resultados" role="status" aria-live="polite">
        {filtro.buscando ? t('catalogo.buscando') : t('catalogo.contagem', { n: lista.length })}
        {filtro.q && t('catalogo.para', { q: filtro.q })}
        {filtro.constelacao && t('catalogo.em', { nome: nomeTag(filtro.constelacao) })}
      </p>

      {lista.length === 0 ? (
        <EstadoVazio titulo={t('catalogo.vazioTitulo')} texto={t('catalogo.vazioTexto')}>
          <button type="button" className="botao botao-primario" onClick={filtro.limpar}>{t('catalogo.limpar')}</button>
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
                {t('catalogo.mais', { n: Math.min(POR_PAGINA, lista.length - quantidade), resto: lista.length - quantidade })}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
