import { useCallback, useEffect, useState } from 'react';

// Leitura em voz alta com a Web Speech API, que já vem no navegador.
export function useVoz() {
  const suportado = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [falando, setFalando] = useState(false);

  useEffect(() => () => suportado && window.speechSynthesis.cancel(), [suportado]);

  const falar = useCallback(
    (texto, idioma = 'en-US') => {
      if (!suportado) return;
      window.speechSynthesis.cancel();
      const fala = new SpeechSynthesisUtterance(texto);
      fala.lang = idioma; // o conteúdo da API está em inglês
      fala.rate = 0.95;
      fala.onend = () => setFalando(false);
      fala.onerror = () => setFalando(false);
      setFalando(true);
      window.speechSynthesis.speak(fala);
    },
    [suportado],
  );

  const parar = useCallback(() => {
    if (suportado) window.speechSynthesis.cancel();
    setFalando(false);
  }, [suportado]);

  return { suportado, falando, falar, parar };
}
