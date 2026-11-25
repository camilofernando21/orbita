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
import { contarConstelacoes, montarCeu, nomeTag } from '../utils/ceu';

export default function Inicio() {
  const { posts, status, erro, recarregar } = usePosts();
  const { modo } = useTema();
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
    if (filtro.buscando && total === undefined) resumo = 'Apontando o telescópio…';
    else if (!total) resumo = `Céu limpo: nenhuma estrela com “${filtro.q}”${filtro.constelacao ? ` em ${nomeTag(filtro.constelacao)}` : ''}.`;
    else resumo = `${total} ${total === 1 ? 'estrela encontrada' : 'estrelas encontradas'} para “${filtro.q}”.`;
  } else if (status === 'ok' && filtro.constelacao) {
    resumo = `Constelação ${nomeTag(filtro.constelacao)}: ${total} ${total === 1 ? 'estrela' : 'estrelas'}.`;
  }

  return (
    <section className="pagina-ceu" aria-labelledby="titulo-ceu">
      <h1 id="titulo-ceu" className="vh">Céu de publicações</h1>

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
          mensagem="O céu não carregou: não conseguimos falar com a API do DummyJSON."
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
                {filtro.erroBusca && <span className="resumo-aviso"> A busca na API falhou, resultado calculado aqui mesmo.</span>}
                <button type="button" className="botao botao-pequeno" onClick={filtro.limpar}>
                  Limpar <kbd>Esc</kbd>
                </button>
              </p>
            )}
          </div>

          <div className="legenda-ceu">
            <Legenda constelacoes={constelacoes} ativa={filtro.constelacao} aoEscolher={filtro.definirConstelacao} modo={modo} />
            <p className="legenda-explica" aria-hidden="true">
              Tamanho: visualizações · Brilho: curtidas · <span className="cor-polemica">Anel pulsando: polêmica</span>
            </p>
          </div>
        </>
      )}
    </section>
  );
}
