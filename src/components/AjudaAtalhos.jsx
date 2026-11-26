import { useLingua } from '../contexts/LinguaContext';

const ATALHOS = [
  [['←', '↑', '→', '↓'], 'ajuda.setas'],
  [['Enter'], 'ajuda.enter'],
  [['+', '−'], 'ajuda.zoom'],
  [['0'], 'ajuda.zero'],
  [['/'], 'ajuda.barra'],
  [['N'], 'ajuda.n'],
  [['C'], 'ajuda.c'],
  [['O'], 'ajuda.o'],
  [['T'], 'ajuda.t'],
  [['L'], 'ajuda.l'],
  [['E'], 'ajuda.e'],
  [['Esc'], 'ajuda.esc'],
  [['?'], 'ajuda.interrogacao'],
];

export default function AjudaAtalhos({ ref }) {
  const { t } = useLingua();
  return (
    <dialog ref={ref} className="modal modal-largo" aria-labelledby="titulo-atalhos">
      <h2 id="titulo-atalhos">{t('ajuda.titulo')}</h2>
      <p className="modal-texto">{t('ajuda.texto')}</p>
      <table className="tabela-atalhos">
        <caption className="vh">{t('ajuda.legenda')}</caption>
        <thead>
          <tr><th scope="col">{t('ajuda.tecla')}</th><th scope="col">{t('ajuda.faz')}</th></tr>
        </thead>
        <tbody>
          {ATALHOS.map(([teclas, chave]) => (
            <tr key={chave}>
              <td>{teclas.map((tecla) => <kbd key={tecla}>{tecla}</kbd>)}</td>
              <td>{t(chave)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="modal-acoes">
        <button type="button" className="botao botao-primario" onClick={() => ref.current?.close()} autoFocus>
          {t('ajuda.entendi')}
        </button>
      </div>
    </dialog>
  );
}
