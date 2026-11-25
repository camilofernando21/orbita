import { formatar, polemica } from '../utils/ceu';

export default function MedidorPolemica({ post }) {
  const { likes = 0, dislikes = 0 } = post.reactions || {};
  const pct = Math.round(polemica(post) * 100);
  const total = likes + dislikes;
  const pctLikes = total ? (likes / total) * 100 : 50;
  const veredito = !total ? 'Sem reações ainda' : pct >= 85 ? 'Polêmica' : pct >= 50 ? 'Opiniões divididas' : 'Quase consenso';

  return (
    <section className="painel medidor" aria-labelledby="titulo-medidor">
      <h2 id="titulo-medidor" className="painel-titulo">Índice de polêmica</h2>
      <p className={`medidor-valor${pct >= 50 ? ' medidor-quente' : ''}`}>
        <strong>{pct}%</strong>
        <span>{veredito}</span>
      </p>
      <div className="medidor-barra" aria-hidden="true">
        <span className="medidor-likes" style={{ width: `${pctLikes}%` }} />
        <span className="medidor-dislikes" />
      </div>
      <dl className="medidor-numeros">
        <div><dt>Curtidas</dt><dd>{formatar(likes)}</dd></div>
        <div><dt>Descurtidas</dt><dd>{formatar(dislikes)}</dd></div>
        <div><dt>Visualizações</dt><dd>{formatar(post.views)}</dd></div>
      </dl>
      <p className="medidor-formula">
        Calculado como 1 − |curtidas − descurtidas| ÷ total de reações. Quanto mais empatado o placar, mais polêmica a publicação.
      </p>
    </section>
  );
}
