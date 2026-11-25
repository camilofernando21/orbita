import { useEffect, useState } from 'react';

export function useTamanhoJanela() {
  const ler = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [tamanho, setTamanho] = useState(ler);

  useEffect(() => {
    let espera = 0;
    function aoRedimensionar() {
      clearTimeout(espera);
      espera = setTimeout(() => setTamanho(ler()), 200);
    }
    window.addEventListener('resize', aoRedimensionar);
    return () => {
      clearTimeout(espera);
      window.removeEventListener('resize', aoRedimensionar);
    };
  }, []);

  return tamanho;
}
