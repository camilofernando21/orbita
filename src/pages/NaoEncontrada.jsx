import { Link } from 'react-router';
import { EstadoVazio } from '../components/Estados';

export default function NaoEncontrada() {
  return (
    <div className="pagina">
      <EstadoVazio titulo="Fora do mapa" texto="Esta página não existe. Talvez o endereço esteja errado.">
        <Link to="/" className="botao botao-primario">Voltar ao céu</Link>
      </EstadoVazio>
    </div>
  );
}
