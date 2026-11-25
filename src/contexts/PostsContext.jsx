import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { listarPosts } from '../services/postsApi';
import { atribuirConstelacoes } from '../utils/ceu';

// Guarda a lista de posts para todas as páginas. Como a API não salva
// nada de verdade (POST, PUT e DELETE são simulados), é aqui que as
// alterações ficam enquanto a página estiver aberta.
const PostsContext = createContext(null);

export function PostsProvider({ children }) {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('carregando'); // carregando | ok | erro
  const [erro, setErro] = useState(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    const controle = new AbortController();
    setStatus('carregando');
    setErro(null);

    listarPosts(controle.signal)
      .then((lista) => {
        setPosts(lista);
        setStatus('ok');
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        setErro(e);
        setStatus('erro');
      });

    return () => controle.abort();
  }, [tentativa]);

  // Cada post ganha o campo "constelacao", calculado a partir das tags.
  const postsComConstelacao = useMemo(() => atribuirConstelacoes(posts), [posts]);

  const valor = useMemo(
    () => ({
      posts: postsComConstelacao,
      status,
      erro,
      recarregar: () => setTentativa((t) => t + 1),
      buscarPorId: (id) => postsComConstelacao.find((p) => p.id === Number(id)),
      adicionar: (post) => setPosts((lista) => [...lista, post]),
      atualizar: (post) => setPosts((lista) => lista.map((p) => (p.id === post.id ? post : p))),
      remover: (id) => setPosts((lista) => lista.filter((p) => p.id !== id)),
    }),
    [postsComConstelacao, status, erro],
  );

  return <PostsContext.Provider value={valor}>{children}</PostsContext.Provider>;
}

export function usePosts() {
  return useContext(PostsContext);
}
