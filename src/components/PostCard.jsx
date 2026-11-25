import { Link } from 'react-router';
import { corTag, ehPolemica, formatar, nomeTag } from '../utils/ceu';
import Nebulosa from './Nebulosa';

// Cartão reutilizado no catálogo, no observatório e em "na mesma constelação".
// O cartão inteiro é clicável, mas o link de verdade é só o título
// (melhor para leitores de tela e para navegar com Tab).
export default function PostCard({ post, modo, nivel = 3 }) {
  const Titulo = `h${nivel}`;
  const tag = post.constelacao || 'diversas';

  return (
    <article className="cartao" style={{ '--cor': corTag(tag, modo) }}>
      <div className="cartao-arte">
        <Nebulosa post={post} modo={modo} variante="cartao" />
      </div>
      <div className="cartao-corpo">
        <p className="cartao-tag">
          <span className="ponto" aria-hidden="true" />
          {nomeTag(tag)}
        </p>
        <Titulo className="cartao-titulo">
          <Link to={`/estrela/${post.id}`} className="link-esticado" viewTransition>
            {post.title}
          </Link>
        </Titulo>
        <p className="cartao-resumo">{post.body}</p>
        <p className="cartao-meta">
          <span>{formatar(post.views)} visualizações</span>
          <span>{formatar(post.reactions?.likes)} curtidas</span>
          {ehPolemica(post) && <span className="selo-polemica">Polêmica</span>}
        </p>
      </div>
    </article>
  );
}
