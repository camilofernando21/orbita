import { corTag, nomeTag } from '../utils/ceu';

// Lista de constelações. Cada botão liga e desliga o filtro daquela constelação.
export default function Legenda({ constelacoes, ativa, aoEscolher, modo, className = '' }) {
  return (
    <nav className={`legenda ${className}`} aria-label="Filtrar por constelação">
      <ul>
        {constelacoes.map((c) => (
          <li key={c.tag}>
            <button
              type="button"
              className="chip"
              aria-pressed={ativa === c.tag}
              onClick={() => aoEscolher(c.tag)}
              style={{ '--cor': corTag(c.tag, modo) }}
            >
              <span className="ponto" aria-hidden="true" />
              {nomeTag(c.tag)}
              <span className="contagem">{c.n}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
