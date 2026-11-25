import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import PostForm from '../components/PostForm';
import { Carregando } from '../components/Estados';
import { usePosts } from '../contexts/PostsContext';
import { useTema } from '../contexts/TemaContext';
import { useAviso } from '../contexts/AvisoContext';
import { criarPost } from '../services/postsApi';
import { contarConstelacoes, nomeTag } from '../utils/ceu';

export default function NovaEstrela() {
  const { posts, status, adicionar } = usePosts();
  const { modo } = useTema();
  const avisar = useAviso();
  const navigate = useNavigate();
  const constelacoes = useMemo(() => contarConstelacoes(posts), [posts]);

  // POST /posts/add
  async function enviar(dados) {
    const resposta = await criarPost({ ...dados, userId: 1 });

    // A API sempre devolve o mesmo id para posts novos (o próximo da lista).
    // Se esse id já estiver em uso aqui, geramos outro para não haver duas estrelas iguais.
    const ocupado = posts.some((p) => p.id === resposta.id);
    const id = ocupado ? Math.max(...posts.map((p) => p.id)) + 1 : resposta.id;

    adicionar({
      ...resposta,
      ...dados,
      id,
      userId: resposta.userId ?? 1,
      views: 0,
      reactions: { likes: 0, dislikes: 0 },
      local: true,
    });
    avisar(`Uma estrela nasceu em ${nomeTag(dados.tags[0])}. POST /posts/add respondeu com id ${resposta.id}.`);
    navigate('/', { state: { nasceu: id }, viewTransition: true });
  }

  if (status === 'carregando') return <Carregando />;

  return (
    <div className="pagina pagina-formulario">
      <header className="pagina-cabeca">
        <p className="sobretitulo">Nova estrela</p>
        <h1>Escreva uma publicação e veja ela nascer no céu</h1>
        <p className="pagina-intro">
          O envio vai para a API com POST. Ela confirma e devolve um id, mas não guarda o post: a estrela existe enquanto esta página estiver aberta.
        </p>
      </header>
      <PostForm
        constelacoes={constelacoes}
        modo={modo}
        aoEnviar={enviar}
        textoEnviar="Fazer a estrela nascer"
        textoEnviando="Enviando para a API…"
        aoCancelar={() => navigate(-1)}
      />
    </div>
  );
}
