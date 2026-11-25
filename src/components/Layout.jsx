import { useEffect, useRef } from 'react';
import { Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router';
import Cabecalho from './Cabecalho';
import AjudaAtalhos from './AjudaAtalhos';
import { useTema } from '../contexts/TemaContext';
import { useAtalhos } from '../hooks/useAtalhos';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { alternarTema } = useTema();
  const buscaRef = useRef(null);
  const ajudaRef = useRef(null);
  const primeiraVez = useRef(true);
  const noCeu = location.pathname === '/';

  const ir = (caminho) => navigate(caminho, { viewTransition: true });

  useAtalhos({
    '/': () => buscaRef.current?.focus(),
    t: () => {
      const r = document.getElementById('botao-tema')?.getBoundingClientRect();
      alternarTema(r && { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    },
    n: () => ir('/nova'),
    c: () => ir('/catalogo'),
    o: () => ir('/observatorio'),
    '?': () => ajudaRef.current?.showModal(),
  });

  // Ao trocar de página, o foco vai para o conteúdo novo: quem navega
  // pelo teclado ou por leitor de tela não fica "perdido" no topo.
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false;
      return;
    }
    if (document.activeElement === buscaRef.current) return;
    if (location.state?.nasceu || location.state?.focar) return; // o céu cuida do foco
    const alvo = document.querySelector('#conteudo h1') || document.getElementById('conteudo');
    alvo?.setAttribute('tabindex', '-1');
    alvo?.focus({ preventScroll: true });
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={noCeu ? 'app app-ceu' : 'app'}>
      <a className="pular" href="#conteudo">Pular para o conteúdo</a>
      <Cabecalho buscaRef={buscaRef} aoAbrirAjuda={() => ajudaRef.current?.showModal()} />
      <main id="conteudo" tabIndex={-1}>
        <Outlet />
      </main>
      <AjudaAtalhos ref={ajudaRef} />
      <ScrollRestoration />
    </div>
  );
}
