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
import { corTag, formatar, minutosLeitura, nomeTag } from '../utils/ceu';

const reduzirMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function DetalheEstrela() {
  const { id } = useParams();
  const { posts, status, erro, recarregar, buscarPorId, remover } = usePosts();
  const { modo } = useTema();
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

  if (status === 'carregando') return <Carregando texto="Aproximando a estrela…" />;
  if (status === 'erro') return <EstadoErro detalhe={erro?.message} aoTentar={recarregar} />;
  if (!post) {
    return (
      <EstadoVazio titulo="Estrela não encontrada" texto="Ela pode ter sido apagada ou o endereço está errado.">
        <Link to="/" className="botao botao-primario">Voltar ao céu</Link>
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
      finalizarExclusao(
        `A estrela virou supernova. DELETE /posts/${post.id} respondeu isDeleted: ${String(resposta.isDeleted)} (simulado, ela some só nesta sessão).`,
      );
    } catch (falha) {
      if (falha.status === 404 && post.local) {
        finalizarExclusao('A estrela foi apagada. Ela tinha sido criada aqui, então a API não a conhecia e a exclusão aconteceu só no navegador.');
      } else {
        setErroApagar(`Não foi possível apagar: ${falha.message}`);
        setApagando(false);
      }
    }
  }

  return (
    <article className={`pagina detalhe${colapsando ? ' colapsando' : ''}`} style={{ '--cor': corTag(tag, modo) }}>
      <nav className="trilha" aria-label="Você está em">
        <button type="button" className="botao-link" onClick={voltar}>
          <Icone nome="voltar" tamanho={18} /> Voltar ao céu
        </button>
        <span aria-hidden="true">/</span>
        <Link to={`/?constelacao=${tag}`}>Constelação {nomeTag(tag)}</Link>
      </nav>

      <div className="detalhe-arte">
        <Nebulosa post={post} modo={modo} variante="hero" satelites={comentarios.lista.length} />
        <span className="detalhe-arte-legenda">
          Nebulosa nº {post.id}<span className="so-desktop"> · gerada a partir dos dados da publicação</span>
        </span>
      </div>

      <header className="detalhe-cabeca">
        <ul className="detalhe-tags" aria-label="Tags">
          {post.tags.map((t) => (
            <li key={t} style={{ '--cor': corTag(t, modo) }}><span className="ponto" aria-hidden="true" />{nomeTag(t)}</li>
          ))}
        </ul>
        <h1>{post.title}</h1>
        <p className="detalhe-meta">
          {formatar(post.views)} visualizações · Leitura de {minutosLeitura(post)} min · Autor nº {post.userId}
          {post.local && <span className="selo">Criada nesta sessão</span>}
          {post.editado && <span className="selo">Editada</span>}
        </p>
      </header>

      <div className="detalhe-grade">
        <div className="detalhe-principal">
          <p className="detalhe-corpo" lang="en">{post.body}</p>

          <div className="detalhe-acoes">
            {voz.suportado && (
              <button type="button" className="botao" onClick={() => (voz.falando ? voz.parar() : voz.falar(`${post.title}. ${post.body}`))} aria-pressed={voz.falando}>
                <Icone nome={voz.falando ? 'parar' : 'ouvir'} tamanho={18} />
                {voz.falando ? 'Parar leitura' : 'Ouvir'}
              </button>
            )}
            <Link to={`/estrela/${post.id}/editar`} className="botao" viewTransition>
              <Icone nome="editar" tamanho={18} /> Editar <kbd>E</kbd>
            </Link>
            <button
              type="button"
              className="botao botao-perigo-contorno"
              onClick={() => {
                setErroApagar(null);
                modal.current?.showModal();
              }}
            >
              <Icone nome="apagar" tamanho={18} /> Apagar
            </button>
          </div>

          <section className="comentarios" aria-labelledby="titulo-comentarios">
            <h2 id="titulo-comentarios">
              Satélites <span className="contagem">{comentarios.estado === 'ok' ? comentarios.lista.length : ''}</span>
            </h2>
            <p className="secao-explica">Cada comentário vira um satélite orbitando a nebulosa lá em cima.</p>

            {comentarios.estado === 'carregando' && (
              <ul className="lista-comentarios" aria-busy="true" aria-label="Carregando comentários">
                {[0, 1].map((i) => <li key={i} className="esqueleto" />)}
              </ul>
            )}
            {comentarios.estado === 'erro' && (
              <div className="alerta-erro" role="alert">
                Não foi possível carregar os comentários.{' '}
                <button type="button" className="botao-link" onClick={() => setComentarios((c) => ({ ...c, tentativa: c.tentativa + 1 }))}>
                  Tentar de novo
                </button>
              </div>
            )}
            {comentarios.estado === 'ok' && comentarios.lista.length === 0 && (
              <p className="sem-itens">{post.local ? 'Estrelas criadas aqui ainda não têm satélites: a API não guarda posts novos.' : 'Nenhum satélite por enquanto.'}</p>
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
                      <p lang="en">{c.body}</p>
                      <p className="comentario-likes">{formatar(c.likes)} curtidas</p>
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
          <h2 id="titulo-vizinhas">Na mesma constelação</h2>
          <ul className="grade-cartoes grade-tres">
            {vizinhas.map((p) => (
              <li key={p.id}><PostCard post={p} modo={modo} nivel={3} /></li>
            ))}
          </ul>
        </section>
      )}

      <ModalConfirmacao
        ref={modal}
        titulo="Apagar esta estrela?"
        textoConfirmar="Apagar estrela"
        textoOcupado="Apagando…"
        aoConfirmar={confirmarExclusao}
        ocupado={apagando}
        erro={erroApagar}
      >
        <p className="modal-texto">
          “{post.title}” vai colapsar numa supernova. A API do DummyJSON só simula a exclusão: ela responde como se tivesse apagado, mas nada sai do servidor.
        </p>
      </ModalConfirmacao>
    </article>
  );
}
