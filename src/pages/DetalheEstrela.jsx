import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import Nebulosa from '../components/Nebulosa';
import MedidorPolemica from '../components/MedidorPolemica';
import ModalConfirmacao from '../components/ModalConfirmacao';
import PostCard from '../components/PostCard';
import Icone from '../components/Icone';
import { Carregando, EstadoErro, EstadoVazio } from '../components/Estados';
import { usePosts } from '../contexts/PostsContext';
import { useTema } from '../contexts/TemaContext';
import { useAviso } from '../contexts/AvisoContext';
import { useAtalhos } from '../hooks/useAtalhos';
import { useVoz } from '../hooks/useVoz';
import { excluirPost, listarComentarios } from '../services/postsApi';
import { corTag, minutosLeitura } from '../utils/ceu';
import { useLingua } from '../contexts/LinguaContext';

const reduzirMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function DetalheEstrela() {
  const { id } = useParams();
  const { posts, status, erro, recarregar, buscarPorId, remover } = usePosts();
  const { modo } = useTema();
  const { t, nomeTag, formatar, comentario, lingua } = useLingua();
  const avisar = useAviso();
  const navigate = useNavigate();
  const voz = useVoz();
  const post = buscarPorId(id);

  const [comentarios, setComentarios] = useState({ estado: 'carregando', lista: [], tentativa: 0 });
  const [apagando, setApagando] = useState(false);
  const [colapsando, setColapsando] = useState(false);
  const [erroApagar, setErroApagar] = useState(null);
  const modal = useRef(null);

  // GET /posts/{id}/comments
  useEffect(() => {
    if (!post) return;
    if (post.local) {
      setComentarios((c) => ({ ...c, estado: 'ok', lista: [] }));
      return;
    }
    const controle = new AbortController();
    setComentarios((c) => ({ ...c, estado: 'carregando' }));
    listarComentarios(post.id, controle.signal)
      .then((lista) => setComentarios((c) => ({ ...c, estado: 'ok', lista })))
      .catch((e) => {
        if (e.name !== 'AbortError') setComentarios((c) => ({ ...c, estado: 'erro', lista: [], erro: e }));
      });
    return () => controle.abort();
  }, [post?.id, post?.local, comentarios.tentativa]); // eslint-disable-line react-hooks/exhaustive-deps

  const vizinhas = useMemo(() => {
    if (!post) return [];
    return posts
      .filter((p) => p.id !== post.id && p.constelacao === post.constelacao)
      .sort((a, b) => b.views - a.views)
      .slice(0, 3);
  }, [posts, post]);

  const voltar = () => navigate('/', { state: { focar: post?.id }, viewTransition: true });

  useAtalhos({
    Escape: voltar,
    e: () => post && navigate(`/estrela/${post.id}/editar`, { viewTransition: true }),
  });

  if (status === 'carregando') return <Carregando texto={t('detalhe.carregando')} />;
  if (status === 'erro') return <EstadoErro detalhe={erro?.message} aoTentar={recarregar} />;
  if (!post) {
    return (
      <EstadoVazio titulo={t('detalhe.naoEncontrada')} texto={t('detalhe.naoEncontradaTexto')}>
        <Link to="/" className="botao botao-primario">{t('estado.voltar')}</Link>
      </EstadoVazio>
    );
  }

  const tag = post.constelacao || 'diversas';

  function finalizarExclusao(mensagem) {
    modal.current?.close();
    voz.parar();
    const semAnimacao = reduzirMovimento();
    // Sobe até a nebulosa para a supernova acontecer na frente da pessoa.
    window.scrollTo({ top: 0, behavior: semAnimacao ? 'auto' : 'smooth' });
    setTimeout(() => setColapsando(true), semAnimacao ? 0 : 450);
    setTimeout(() => {
      navigate('/', { viewTransition: true });
      setTimeout(() => remover(post.id), 60); // remove depois que a página trocar
      avisar(mensagem);
    }, semAnimacao ? 0 : 1600);
  }

  // DELETE /posts/{id}
  async function confirmarExclusao() {
    setApagando(true);
    setErroApagar(null);
    try {
      const resposta = await excluirPost(post.id);
      finalizarExclusao(t('detalhe.avisoApagou', { id: post.id, ok: String(resposta.isDeleted) }));
    } catch (falha) {
      if (falha.status === 404 && post.local) {
        finalizarExclusao(t('detalhe.avisoApagouLocal'));
      } else {
        setErroApagar(t('detalhe.erroApagar', { msg: falha.message }));
        setApagando(false);
      }
    }
  }

  return (
    <article className={`pagina detalhe${colapsando ? ' colapsando' : ''}`} style={{ '--cor': corTag(tag, modo) }}>
      <nav className="trilha" aria-label={t('detalhe.trilha')}>
        <button type="button" className="botao-link" onClick={voltar}>
          <Icone nome="voltar" tamanho={18} /> {t('detalhe.voltar')}
        </button>
        <span aria-hidden="true">/</span>
        <Link to={`/?constelacao=${tag}`}>{t('detalhe.constelacao', { nome: nomeTag(tag) })}</Link>
      </nav>

      <div className="detalhe-arte">
        <Nebulosa post={post} modo={modo} variante="hero" satelites={comentarios.lista.length} />
        <span className="detalhe-arte-legenda">
          {t('detalhe.nebulosa', { id: post.id })}<span className="so-desktop">{t('detalhe.nebulosaExtra')}</span>
        </span>
      </div>

      <header className="detalhe-cabeca">
        <ul className="detalhe-tags" aria-label={t('detalhe.tags')}>
          {post.tags.map((t) => (
            <li key={t} style={{ '--cor': corTag(t, modo) }}><span className="ponto" aria-hidden="true" />{nomeTag(t)}</li>
          ))}
        </ul>
        <h1 lang={post.idioma}>{post.titulo}</h1>
        <p className="detalhe-meta">
          {t('detalhe.meta', { views: formatar(post.views), min: minutosLeitura(post), autor: post.userId })}
          {post.local && <span className="selo">{t('detalhe.criada')}</span>}
          {post.editado && <span className="selo">{t('detalhe.editada')}</span>}
        </p>
      </header>

      <div className="detalhe-grade">
        <div className="detalhe-principal">
          <p className="detalhe-corpo" lang={post.idioma}>{post.texto}</p>
          {post.semTraducao && <p className="aviso-traducao">{t('detalhe.semTraducao')}</p>}

          <div className="detalhe-acoes">
            {voz.suportado && (
              <button type="button" className="botao" onClick={() => (voz.falando ? voz.parar() : voz.falar(`${post.titulo}. ${post.texto}`, post.idioma || (lingua === 'pt' ? 'pt-BR' : 'en-US')))} aria-pressed={voz.falando}>
                <Icone nome={voz.falando ? 'parar' : 'ouvir'} tamanho={18} />
                {voz.falando ? t('detalhe.parar') : t('detalhe.ouvir')}
              </button>
            )}
            <Link to={`/estrela/${post.id}/editar`} className="botao" viewTransition>
              <Icone nome="editar" tamanho={18} /> {t('detalhe.editar')} <kbd>E</kbd>
            </Link>
            <button
              type="button"
              className="botao botao-perigo-contorno"
              onClick={() => {
                setErroApagar(null);
                modal.current?.showModal();
              }}
            >
              <Icone nome="apagar" tamanho={18} /> {t('detalhe.apagar')}
            </button>
          </div>

          <section className="comentarios" aria-labelledby="titulo-comentarios">
            <h2 id="titulo-comentarios">
              {t('detalhe.satelites')} <span className="contagem">{comentarios.estado === 'ok' ? comentarios.lista.length : ''}</span>
            </h2>
            <p className="secao-explica">{t('detalhe.satelitesExplica')}</p>

            {comentarios.estado === 'carregando' && (
              <ul className="lista-comentarios" aria-busy="true" aria-label={t('detalhe.carregandoComentarios')}>
                {[0, 1].map((i) => <li key={i} className="esqueleto" />)}
              </ul>
            )}
            {comentarios.estado === 'erro' && (
              <div className="alerta-erro" role="alert">
                {t('detalhe.erroComentarios')}{' '}
                <button type="button" className="botao-link" onClick={() => setComentarios((c) => ({ ...c, tentativa: c.tentativa + 1 }))}>
                  {t('estado.tentar')}
                </button>
              </div>
            )}
            {comentarios.estado === 'ok' && comentarios.lista.length === 0 && (
              <p className="sem-itens">{post.local ? t('detalhe.semComentariosLocal') : t('detalhe.semComentarios')}</p>
            )}
            {comentarios.estado === 'ok' && comentarios.lista.length > 0 && (
              <ul className="lista-comentarios">
                {comentarios.lista.map((c) => (
                  <li key={c.id}>
                    <span className="avatar" aria-hidden="true">{(c.user?.fullName || c.user?.username || '?').slice(0, 1)}</span>
                    <div>
                      <p className="comentario-autor">
                        <strong>{c.user?.fullName || c.user?.username}</strong> <span>@{c.user?.username}</span>
                      </p>
                      <p lang={lingua === 'pt' && comentario(c.body) !== c.body ? 'pt-BR' : 'en'}>{comentario(c.body)}</p>
                      <p className="comentario-likes">{t('detalhe.curtidas', { n: formatar(c.likes) })}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="detalhe-lateral">
          <MedidorPolemica post={post} />
        </aside>
      </div>

      {vizinhas.length > 0 && (
        <section className="vizinhas" aria-labelledby="titulo-vizinhas">
          <h2 id="titulo-vizinhas">{t('detalhe.vizinhas')}</h2>
          <ul className="grade-cartoes grade-tres">
            {vizinhas.map((p) => (
              <li key={p.id}><PostCard post={p} modo={modo} nivel={3} /></li>
            ))}
          </ul>
        </section>
      )}

      <ModalConfirmacao
        ref={modal}
        titulo={t('detalhe.modalTitulo')}
        textoConfirmar={t('detalhe.modalConfirmar')}
        textoOcupado={t('detalhe.modalOcupado')}
        aoConfirmar={confirmarExclusao}
        ocupado={apagando}
        erro={erroApagar}
      >
        <p className="modal-texto">{t('detalhe.modalTexto', { titulo: post.titulo })}</p>
      </ModalConfirmacao>
    </article>
  );
}
