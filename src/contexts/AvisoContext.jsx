import { createContext, useCallback, useContext, useRef, useState } from 'react';

// Mensagens rápidas de sucesso ou erro que aparecem na parte de baixo da tela.
// A região tem role="status" para leitores de tela anunciarem o texto.
const AvisoContext = createContext(null);

export function AvisoProvider({ children }) {
  const [aviso, setAviso] = useState(null);
  const temporizador = useRef(0);

  const avisar = useCallback((texto, tipo = 'sucesso') => {
    clearTimeout(temporizador.current);
    setAviso({ texto, tipo, chave: Date.now() });
    temporizador.current = setTimeout(() => setAviso(null), 5200);
  }, []);

  return (
    <AvisoContext.Provider value={avisar}>
      {children}
      <div className="aviso-regiao" role="status" aria-live="polite">
        {aviso && (
          <p key={aviso.chave} className={`aviso aviso-${aviso.tipo}`}>
            {aviso.texto}
          </p>
        )}
      </div>
    </AvisoContext.Provider>
  );
}

export function useAviso() {
  return useContext(AvisoContext);
}
