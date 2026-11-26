import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import PostForm from '../components/PostForm';
import { Carregando, EstadoVazio } from '../components/Estados';
import { usePosts } from '../contexts/PostsContext';
import { useTema } from '../contexts/TemaContext';
import { useAviso } from '../contexts/AvisoContext';
import { atualizarPost } from '../services/postsApi';
import { contarConstelacoes } from '../utils/ceu';
import { useLingua } from '../contexts/LinguaContext';

export default function EditarEstrela() {
  const { id } = useParams();
  const { posts, status, buscarPorId, atualizar } = usePosts();
  const { modo } = useTema();
  const { t } = useLingua();
  const avisar = useAviso();
  const navigate = useNavigate();
  const post = buscarPorId(id);
  const constelacoes = useMemo(() => contarConstelacoes(posts), [posts]);

  if (status === 'carregando') return <Carregando />;
  if (!post) {
    return (
      <EstadoVazio titulo={t('detalhe.naoEncontrada')} texto={t('editar.naoExiste')}>
        <Link to="/" className="botao botao-primario">{t('estado.voltar')}</Link>
      </EstadoVazio>
    );
  }

  // PUT /posts/{id}
  async function enviar(dados) {
    let mensagem;
    try {
      const resposta = await atualizarPost(post.id, dados);
      mensagem = t('editar.aviso', { id: post.id });
      atualizar({ ...post, ...resposta, ...dados, views: post.views, reactions: post.reactions, local: post.local, editado: true });
    } catch (falha) {
      // Posts criados aqui não existem na API: ela responde 404.
      if (falha.status === 404 && post.local) {
        mensagem = t('editar.avisoLocal');
        atualizar({ ...post, ...dados, editado: true });
      } else {
        throw falha;
      }
    }
    avisar(mensagem);
    navigate(`/estrela/${post.id}`, { viewTransition: true });
  }

  return (
    <div className="pagina pagina-formulario">
      <header className="pagina-cabeca">
        <p className="sobretitulo">{t('editar.sobre')}</p>
        <h1>{t('editar.titulo', { titulo: post.titulo })}</h1>
        <p className="pagina-intro">{t('editar.intro')}</p>
      </header>
      <PostForm
        inicial={post}
        constelacoes={constelacoes}
        modo={modo}
        aoEnviar={enviar}
        textoEnviar={t('editar.enviar')}
        textoEnviando={t('editar.enviando')}
        aoCancelar={() => navigate(`/estrela/${post.id}`)}
      />
    </div>
  );
}
