import { Link } from 'react-router';
import { EstadoVazio } from '../components/Estados';
import { useLingua } from '../contexts/LinguaContext';

export default function NaoEncontrada() {
  const { t } = useLingua();
  return (
    <div className="pagina">
      <EstadoVazio titulo={t('404.titulo')} texto={t('404.texto')}>
        <Link to="/" className="botao botao-primario">{t('estado.voltar')}</Link>
      </EstadoVazio>
    </div>
  );
}
