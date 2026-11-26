import { useId } from 'react';
import { useLingua } from '../contexts/LinguaContext';

// Usa o <dialog> nativo: ele já prende o foco dentro do modal,
// fecha com Esc e devolve o foco ao botão que o abriu.
export default function ModalConfirmacao({ ref, titulo, children, textoConfirmar, textoOcupado, aoConfirmar, ocupado, erro }) {
  const id = useId();
  const { t } = useLingua();
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={id}
      onCancel={(e) => {
        if (ocupado) e.preventDefault();
      }}
    >
      <h2 id={id}>{titulo}</h2>
      {children}
      {erro && (
        <p className="texto-erro" role="alert">
          {erro}
        </p>
      )}
      <div className="modal-acoes">
        <button type="button" className="botao" onClick={() => ref.current?.close()} disabled={ocupado} autoFocus>
          {t('modal.cancelar')}
        </button>
        <button type="button" className="botao botao-perigo" onClick={aoConfirmar} disabled={ocupado} aria-busy={ocupado}>
          {ocupado ? textoOcupado : textoConfirmar}
        </button>
      </div>
    </dialog>
  );
}
