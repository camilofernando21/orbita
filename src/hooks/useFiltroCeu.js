import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { usePosts } from '../contexts/PostsContext';
import { pesquisarPosts } from '../services/postsApi';
import { useLingua } from '../contexts/LinguaContext';

// Filtro compartilhado pelo céu e pelo catálogo. O estado fica na URL
// (?q=amor&constelacao=crime), então dá para recarregar ou mandar o link.
export function useFiltroCeu() {
  const [params, setParams] = useSearchParams();
  const { posts } = usePosts();
  const { nomeTag } = useLingua();
  const q = (params.get('q') || '').trim();
  const constelacao = params.get('constelacao');
  const [busca, setBusca] = useState({ estado: 'ocioso', ids: null, erro: null });

  // Busca na API (GET /posts/search) sempre que o termo muda.
  useEffect(() => {
    if (!q) {
      setBusca({ estado: 'ocioso', ids: null, erro: null });
      return;
    }
    const controle = new AbortController();
    setBusca((atual) => ({ ...atual, estado: 'buscando' }));
    pesquisarPosts(q, controle.signal)
      .then((ids) => setBusca({ estado: 'ok', ids: new Set(ids), erro: null }))
      .catch((e) => {
        if (e.name !== 'AbortError') setBusca({ estado: 'erro', ids: null, erro: e });
      });
    return () => controle.abort();
  }, [q]);

  const visiveis = useMemo(() => {
    if (!q && !constelacao) return null; // null = sem filtro, tudo aceso
    const termo = q.toLowerCase();
    // Busca local: no texto traduzido, no original e no nome das tags.
    const contem = (p) =>
      [p.titulo, p.texto, p.title, p.body, ...(p.tags || []), ...(p.tags || []).map(nomeTag)]
        .join(' ')
        .toLowerCase()
        .includes(termo);

    return new Set(
      posts
        .filter((p) => {
          if (constelacao && p.constelacao !== constelacao) return false;
          if (!q) return true;
          // Resultado = o que a API encontrou (GET /posts/search, em inglês)
          // + o que a busca local encontrou (inclui o texto em português e
          // os posts criados ou editados aqui, que a API não conhece).
          return contem(p) || Boolean(busca.ids?.has(p.id));
        })
        .map((p) => p.id),
    );
  }, [posts, q, constelacao, busca.ids, nomeTag]);

  function definirConstelacao(tag) {
    const novos = new URLSearchParams(params);
    if (!tag || tag === constelacao) novos.delete('constelacao');
    else novos.set('constelacao', tag);
    setParams(novos, { replace: true });
  }

  function limpar() {
    setParams({}, { replace: true });
  }

  return {
    q,
    constelacao,
    visiveis,
    buscando: busca.estado === 'buscando',
    erroBusca: busca.erro,
    definirConstelacao,
    limpar,
  };
}
