import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

// Tema claro (carta celeste) e escuro (céu noturno).
// O tema fica num atributo próprio do <html> (data-modo) e as cores
// de cada tema são variáveis CSS em global.css.
const TemaContext = createContext(null);

function temaInicial() {
  try {
    const salvo = localStorage.getItem('orbita-tema');
    if (salvo === 'light' || salvo === 'dark') return salvo;
  } catch {
    /* navegador sem localStorage: segue com o padrão */
  }
  return 'dark';
}

const reduzirMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function TemaProvider({ children }) {
  const [modo, setModo] = useState(temaInicial);

  useEffect(() => {
    const raiz = document.documentElement;
    raiz.dataset.modo = modo;
    raiz.style.colorScheme = modo;
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', modo === 'dark' ? '#060913' : '#efe4c8');
    try {
      localStorage.setItem('orbita-tema', modo);
    } catch {
      /* sem problema */
    }
  }, [modo]);

  // origem: ponto da tela de onde o novo tema "se espalha" (o botão clicado)
  const alternarTema = useCallback((origem) => {
    const novo = modo === 'dark' ? 'light' : 'dark';

    if (!document.startViewTransition || reduzirMovimento()) {
      setModo(novo);
      return;
    }

    const x = origem?.x ?? window.innerWidth - 80;
    const y = origem?.y ?? 40;
    const raioFinal = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const raiz = document.documentElement;
    raiz.classList.add('trocando-tema');
    const transicao = document.startViewTransition(() => {
      flushSync(() => setModo(novo));
    });
    transicao.finished.finally(() => raiz.classList.remove('trocando-tema'));

    transicao.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${raioFinal}px at ${x}px ${y}px)`] },
        { duration: 850, easing: 'cubic-bezier(.6,0,.2,1)', pseudoElement: '::view-transition-new(root)' },
      );
    });
  }, [modo]);

  return <TemaContext.Provider value={{ modo, alternarTema }}>{children}</TemaContext.Provider>;
}

export function useTema() {
  return useContext(TemaContext);
}
