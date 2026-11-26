import { polemica } from '../utils/ceu';
import { useLingua } from '../contexts/LinguaContext';

export default function MedidorPolemica({ post }) {
  const { t, formatar } = useLingua();
  const { likes = 0, dislikes = 0 } = post.reactions || {};
  const pct = Math.round(polemica(post) * 100);
  const total = likes + dislikes;
  const pctLikes = total ? (likes / total) * 100 : 50;
  const veredito = !total
    ? t('medidor.semReacoes')
    : pct >= 85
      ? t('medidor.polemica')
      : pct >= 50
        ? t('medidor.dividida')
        : t('medidor.consenso');

  return (
    <section className="painel medidor" aria-labelledby="titulo-medidor">
      <h2 id="titulo-medidor" className="painel-titulo">{t('medidor.titulo')}</h2>
      <p className={`medidor-valor${pct >= 50 ? ' medidor-quente' : ''}`}>
        <strong>{pct}%</strong>
        <span>{veredito}</span>
      </p>
      <div className="medidor-barra" aria-hidden="true">
        <span className="medidor-likes" style={{ width: `${pctLikes}%` }} />
        <span className="medidor-dislikes" />
      </div>
      <dl className="medidor-numeros">
        <div><dt>{t('medidor.curtidas')}</dt><dd>{formatar(likes)}</dd></div>
        <div><dt>{t('medidor.descurtidas')}</dt><dd>{formatar(dislikes)}</dd></div>
        <div><dt>{t('medidor.views')}</dt><dd>{formatar(post.views)}</dd></div>
      </dl>
      <p className="medidor-formula">{t('medidor.formula')}</p>
    </section>
  );
}
