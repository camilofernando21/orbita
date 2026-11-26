import Icone from './Icone';
import { useLingua } from '../contexts/LinguaContext';

// Estados da interface: carregando, erro e vazio. Reutilizados em todas as páginas.

export function Carregando({ texto, telaCheia = false }) {
  const { t } = useLingua();
  return (
    <div className={`estado estado-carregando${telaCheia ? ' estado-tela-cheia' : ''}`} role="status" aria-live="polite">
      <svg className="orbitador" viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r="28" className="orbitador-trilha" />
        <circle cx="40" cy="40" r="7" className="orbitador-astro" />
        <g className="orbitador-giro"><circle cx="68" cy="40" r="4" className="orbitador-lua" /></g>
      </svg>
      <p>{texto || t('estado.carregando')}</p>
    </div>
  );
}

export function EstadoErro({ titulo, mensagem, detalhe, aoTentar, telaCheia = false }) {
  const { t } = useLingua();
  return (
    <div className={`estado estado-erro${telaCheia ? ' estado-tela-cheia' : ''}`} role="alert">
      <h2>{titulo || t('estado.erroTitulo')}</h2>
      <p>{mensagem || t('estado.erroTexto')}</p>
      {detalhe && <p className="estado-detalhe">{detalhe}</p>}
      {aoTentar && (
        <button type="button" className="botao botao-primario" onClick={aoTentar}>
          <Icone nome="recarregar" tamanho={18} />
          {t('estado.tentar')}
        </button>
      )}
    </div>
  );
}

export function EstadoVazio({ titulo, texto, children }) {
  return (
    <div className="estado estado-vazio">
      <h2>{titulo}</h2>
      {texto && <p>{texto}</p>}
      {children}
    </div>
  );
}
