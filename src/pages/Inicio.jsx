import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import Ceu from '../components/Ceu';
import Legenda from '../components/Legenda';
import MolduraCarta from '../components/MolduraCarta';
import { Carregando, EstadoErro } from '../components/Estados';
import { usePosts } from '../contexts/PostsContext';
import { useTema } from '../contexts/TemaContext';
import { useFiltroCeu } from '../hooks/useFiltroCeu';
import { useTamanhoJanela } from '../hooks/useTamanhoJanela';
import { useAtalhos } from '../hooks/useAtalhos';
import { contarConstelacoes, montarCeu } from '../utils/ceu';
import { useLingua } from '../contexts/LinguaContext';

export default function Inicio() {
  const { posts, status, erro, recarregar } = usePosts();
  const { modo } = useTema();
  const { t, nomeTag } = useLingua();
  const navigate = useNavigate();
  const location = useLocation();
  const filtro = useFiltroCeu();
  const tela = useTamanhoJanela();

  // O mundo tem sempre 1000 de altura e a largura segue o formato da tela.
  const ceu = useMemo(() => {
    const H = 1000;
    const W = Math.max(450, Math.round((1000 * tela.w) / tela.h));
    return montarCeu(posts, W, H);
  }, [posts, tela]);

  const constelacoes = useMemo(() => contarConstelacoes(posts), [posts]);

  useAtalhos({
    Escape: () => {
      if (filtro.q || filtro.constelacao) filtro.limpar();
    },
  });

  const abrir = (id) => navigate(`/estrela/${id}`, { viewTransition: true });

  const total = filtro.visiveis?.size;
  let resumo = null;
  if (status === 'ok' && filtro.q) {
    if (filtro.buscando && total === undefined) resumo = t('ceu.apontando');
    else if (!total) resumo = t('ceu.nenhuma', { q: filtro.q, onde: filtro.constelacao && nomeTag(filtro.constelacao) });
    else resumo = t('ceu.encontradas', { n: total, q: filtro.q });
  } else if (status === 'ok' && filtro.constelacao) {
    resumo = t('ceu.constelacao', { nome: nomeTag(filtro.constelacao), n: total });
  }

  return (
    <section className="pagina-ceu" aria-labelledby="titulo-ceu">
      <h1 id="titulo-ceu" className="vh">{t('ceu.titulo')}</h1>

      {status === 'ok' && (
        <Ceu
          ceu={ceu}
          visiveis={filtro.visiveis}
          modo={modo}
          nasceu={location.state?.nasceu}
          focar={location.state?.focar}
          aoAbrir={abrir}
        />
      )}

      {modo === 'light' && <MolduraCarta />}

      {status === 'carregando' && <Carregando telaCheia />}
      {status === 'erro' && (
        <EstadoErro
          telaCheia
          mensagem={t('ceu.erro')}
          detalhe={erro?.message}
          aoTentar={recarregar}
        />
      )}

      {status === 'ok' && (
        <>
          <div className="resumo-filtro" role="status" aria-live="polite">
            {resumo && (
              <p>
                <span>{resumo}</span>
                {filtro.erroBusca && <span className="resumo-aviso">{t('ceu.buscaFalhou')}</span>}
                <button type="button" className="botao botao-pequeno" onClick={filtro.limpar}>
                  {t('ceu.limpar')} <kbd>Esc</kbd>
                </button>
              </p>
            )}
          </div>

          <div className="legenda-ceu">
            <Legenda constelacoes={constelacoes} ativa={filtro.constelacao} aoEscolher={filtro.definirConstelacao} modo={modo} />
            <p className="legenda-explica" aria-hidden="true">
              {t('ceu.legendaExplica')}<span className="cor-polemica">{t('ceu.legendaPolemica')}</span>
            </p>
          </div>
        </>
      )}
    </section>
  );
}
