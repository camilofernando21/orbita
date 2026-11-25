const ATALHOS = [
  [['←', '↑', '→', '↓'], 'Pular para a estrela mais próxima naquela direção'],
  [['Enter'], 'Abrir a estrela selecionada'],
  [['+', '−'], 'Aproximar e afastar o céu'],
  [['0'], 'Ver o céu inteiro'],
  [['/'], 'Abrir o telescópio (busca)'],
  [['N'], 'Criar uma nova estrela'],
  [['C'], 'Ir para o catálogo'],
  [['O'], 'Ir para o observatório'],
  [['T'], 'Alternar céu noturno e carta celeste'],
  [['E'], 'Editar a estrela aberta'],
  [['Esc'], 'Fechar, limpar o filtro ou voltar ao céu'],
  [['?'], 'Mostrar esta lista'],
];

export default function AjudaAtalhos({ ref }) {
  return (
    <dialog ref={ref} className="modal modal-largo" aria-labelledby="titulo-atalhos">
      <h2 id="titulo-atalhos">Navegue sem mouse</h2>
      <p className="modal-texto">
        Tudo na Órbita funciona pelo teclado. A tecla Tab percorre botões, links e estrelas, e o foco fica sempre visível.
      </p>
      <table className="tabela-atalhos">
        <caption className="vh">Atalhos de teclado</caption>
        <thead>
          <tr><th scope="col">Tecla</th><th scope="col">O que faz</th></tr>
        </thead>
        <tbody>
          {ATALHOS.map(([teclas, acao]) => (
            <tr key={acao}>
              <td>{teclas.map((t) => <kbd key={t}>{t}</kbd>)}</td>
              <td>{acao}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="modal-acoes">
        <button type="button" className="botao botao-primario" onClick={() => ref.current?.close()} autoFocus>
          Entendi
        </button>
      </div>
    </dialog>
  );
}
