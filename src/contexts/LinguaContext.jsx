import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TEXTOS } from '../i18n/textos';
import TRADUCOES from '../data/traducoes-pt.json';

// Idioma da aplicação: 'pt' (português do Brasil) ou 'en' (inglês).
// - A interface usa t('chave') para pegar o texto no idioma atual.
// - O conteúdo da API vem em inglês. Em português, os textos dos posts,
//   comentários e tags vêm do arquivo src/data/traducoes-pt.json.
const LinguaContext = createContext(null);

function linguaInicial() {
  try {
    const salva = localStorage.getItem('orbita-lingua');
    if (salva === 'pt' || salva === 'en') return salva;
  } catch {
    /* sem localStorage: segue o padrão */
  }
  return 'pt';
}

const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

export function LinguaProvider({ children }) {
  const [lingua, setLingua] = useState(linguaInicial);

  useEffect(() => {
    document.documentElement.lang = lingua === 'pt' ? 'pt-BR' : 'en';
    try {
      localStorage.setItem('orbita-lingua', lingua);
    } catch {
      /* sem problema */
    }
  }, [lingua]);

  const t = useCallback(
    (chave, variaveis = {}) => {
      const texto = TEXTOS[lingua][chave] ?? TEXTOS.pt[chave] ?? chave;
      return typeof texto === 'function' ? texto(variaveis) : texto;
    },
    [lingua],
  );

  const nomeTag = useCallback(
    (tag) => {
      if (tag === 'diversas') return lingua === 'pt' ? 'Diversas' : 'Miscellaneous';
      return lingua === 'pt' ? TRADUCOES.tags[tag] || capitalizar(tag) : capitalizar(tag);
    },
    [lingua],
  );

  const formatar = useCallback((n) => Number(n || 0).toLocaleString(lingua === 'pt' ? 'pt-BR' : 'en-US'), [lingua]);

  // Texto de um post no idioma atual. Posts criados ou editados aqui
  // aparecem como a pessoa escreveu.
  const conteudo = useCallback(
    (post) => {
      const traducao = TRADUCOES.posts[post.id];
      const original = post.local || post.editado;
      if (lingua === 'pt' && !original && traducao) {
        return { titulo: traducao[0], texto: traducao[1], idioma: 'pt-BR', semTraducao: false };
      }
      return {
        titulo: post.title,
        texto: post.body,
        idioma: original ? undefined : 'en',
        semTraducao: lingua === 'pt' && !original,
      };
    },
    [lingua],
  );

  const comentario = useCallback(
    (texto) => (lingua === 'pt' && TRADUCOES.comentarios[texto]) || texto,
    [lingua],
  );

  const valor = useMemo(
    () => ({
      lingua,
      definirLingua: setLingua,
      alternarLingua: () => setLingua((l) => (l === 'pt' ? 'en' : 'pt')),
      t,
      nomeTag,
      formatar,
      conteudo,
      comentario,
    }),
    [lingua, t, nomeTag, formatar, conteudo, comentario],
  );

  return <LinguaContext.Provider value={valor}>{children}</LinguaContext.Provider>;
}

export function useLingua() {
  return useContext(LinguaContext);
}
