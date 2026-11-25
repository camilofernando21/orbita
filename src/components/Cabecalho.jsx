import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useTema } from '../contexts/TemaContext';
import Icone from './Icone';

export default function Cabecalho({ buscaRef, aoAbrirAjuda }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { modo, alternarTema } = useTema();

  // A busca vale para o céu e para o catálogo. Em outras páginas, buscar leva ao céu.
  const paginaComBusca = location.pathname === '/' || location.pathname === '/catalogo';
  const termoNaUrl = paginaComBusca ? params.get('q') || '' : '';
  const [texto, setTexto] = useState(termoNaUrl);
  const espera = useRef(0);

  useEffect(() => {
    setTexto((atual) => (atual.trim() === termoNaUrl ? atual : termoNaUrl));
  }, [termoNaUrl]);

  function aplicarBusca(valor) {
    const novos = new URLSearchParams(paginaComBusca ? params : undefined);
    if (valor.trim()) novos.set('q', valor.trim());
    else novos.delete('q');
    const busca = novos.toString();
    navigate(
      { pathname: paginaComBusca ? location.pathname : '/', search: busca ? `?${busca}` : '' },
      { replace: paginaComBusca },
    );
  }

  function aoDigitar(e) {
    const valor = e.target.value;
    setTexto(valor);
    clearTimeout(espera.current);
    espera.current = setTimeout(() => aplicarBusca(valor), 350); // espera a pessoa parar de digitar
  }

  function aoEnviar(e) {
    e.preventDefault();
    clearTimeout(espera.current);
    aplicarBusca(texto);
    if (location.pathname === '/' || !paginaComBusca) {
      setTimeout(() => window.dispatchEvent(new Event('orbita:focar-resultado')), 650);
    }
  }

  function aoTeclar(e) {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    if (texto) {
      setTexto('');
      clearTimeout(espera.current);
      aplicarBusca('');
    } else {
      e.currentTarget.blur();
    }
  }

  function trocarTema(e) {
    const r = e.currentTarget.getBoundingClientRect();
    alternarTema({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  }

  const proximoTema = modo === 'dark' ? 'carta celeste (tema claro)' : 'céu noturno (tema escuro)';

  return (
    <header className="cabecalho">
      <Link to="/" className="marca" aria-label="Órbita, página inicial">
        <svg viewBox="0 0 40 40" aria-hidden="true" className="marca-simbolo">
          <circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" strokeOpacity=".45" strokeDasharray="2.5 3.5" />
          <circle cx="20" cy="20" r="5" fill="currentColor" />
          <circle cx="33" cy="20" r="2.4" fill="currentColor" className="marca-lua" />
        </svg>
        <span>Órbita</span>
      </Link>

      <nav className="nav-principal" aria-label="Principal">
        <NavLink to="/" end>Céu</NavLink>
        <NavLink to="/catalogo">Catálogo</NavLink>
        <NavLink to="/observatorio">Observatório</NavLink>
      </nav>

      <form role="search" className="busca" onSubmit={aoEnviar}>
        <label htmlFor="campo-busca" className="vh">Telescópio: buscar publicações</label>
        <Icone nome="lupa" tamanho={18} />
        <input
          id="campo-busca"
          ref={buscaRef}
          type="search"
          value={texto}
          onChange={aoDigitar}
          onKeyDown={aoTeclar}
          placeholder="Telescópio"
          autoComplete="off"
          spellCheck="false"
          enterKeyHint="search"
        />
        <kbd aria-hidden="true">/</kbd>
      </form>

      <div className="acoes-topo">
        <Link to="/nova" className="botao botao-primario" viewTransition>
          <Icone nome="mais" tamanho={18} />
          <span>Nova estrela</span>
        </Link>
        <button
          type="button"
          id="botao-tema"
          className="botao-icone"
          onClick={trocarTema}
          aria-label={`Mudar para ${proximoTema}. Atalho: T`}
          title={`Mudar para ${proximoTema} (T)`}
        >
          <Icone nome={modo === 'dark' ? 'sol' : 'lua'} />
        </button>
        <button type="button" className="botao-icone" onClick={aoAbrirAjuda} aria-label="Atalhos de teclado" title="Atalhos de teclado (?)">
          <Icone nome="teclado" />
        </button>
      </div>
    </header>
  );
}
