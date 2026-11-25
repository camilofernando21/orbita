import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import PostForm from '../components/PostForm';
import { Carregando, EstadoVazio } from '../components/Estados';
import { usePosts } from '../contexts/PostsContext';
import { useTema } from '../contexts/TemaContext';
import { useAviso } from '../contexts/AvisoContext';
import { atualizarPost } from '../services/postsApi';
import { contarConstelacoes } from '../utils/ceu';

export default function EditarEstrela() {
  const { id } = useParams();
  const { posts, status, buscarPorId, atualizar } = usePosts();
  const { modo } = useTema();
  const avisar = useAviso();
  const navigate = useNavigate();
  const post = buscarPorId(id);
  const constelacoes = useMemo(() => contarConstelacoes(posts), [posts]);

  if (status === 'carregando') return <Carregando />;
  if (!post) {
    return (
      <EstadoVazio titulo="Estrela não encontrada" texto="Não dá para editar uma estrela que não existe.">
        <Link to="/" className="botao botao-primario">Voltar ao céu</Link>
      </EstadoVazio>
    );
  }

  // PUT /posts/{id}
  async function enviar(dados) {
    let mensagem;
    try {
      const resposta = await atualizarPost(post.id, dados);
      mensagem = `Estrela recalibrada. PUT /posts/${post.id} respondeu com o post atualizado (simulado).`;
      atualizar({ ...post, ...resposta, ...dados, views: post.views, reactions: post.reactions, local: post.local, editado: true });
    } catch (falha) {
      // Posts criados aqui não existem na API: ela responde 404.
      if (falha.status === 404 && post.local) {
        mensagem = 'Estrela recalibrada só no navegador: ela foi criada aqui e a API não a conhece.';
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
        <p className="sobretitulo">Recalibrar estrela</p>
        <h1>Editar “{post.title}”</h1>
        <p className="pagina-intro">As alterações vão para a API com PUT e aparecem aqui assim que ela responder.</p>
      </header>
      <PostForm
        inicial={post}
        constelacoes={constelacoes}
        modo={modo}
        aoEnviar={enviar}
        textoEnviar="Salvar alterações"
        textoEnviando="Salvando…"
        aoCancelar={() => navigate(`/estrela/${post.id}`)}
      />
    </div>
  );
}
