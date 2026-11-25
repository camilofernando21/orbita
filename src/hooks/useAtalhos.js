import { useEffect, useRef } from 'react';

// Atalhos globais de teclado. Recebe um objeto { tecla: função }.
// Os atalhos não disparam enquanto a pessoa digita num campo, quando há
// um modal aberto ou quando Ctrl, Alt ou Cmd estão pressionados.
export function useAtalhos(mapa) {
  const ref = useRef(mapa);
  ref.current = mapa;

  useEffect(() => {
    function aoTeclar(e) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      if (document.querySelector('dialog[open]')) return;
      const alvo = e.target;
      if (alvo.closest?.('input, textarea, select, [contenteditable="true"]')) return;

      const acao = ref.current[e.key] || ref.current[e.key.toLowerCase()];
      if (acao) {
        e.preventDefault();
        acao(e);
      }
    }
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, []);
}
