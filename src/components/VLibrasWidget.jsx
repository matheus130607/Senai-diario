import { useEffect } from 'react';
import { destroyVLibrasRoot, initializeVLibras } from '../services/vlibrasService';

export default function VLibrasWidget() {
  useEffect(() => {
    let isCancelled = false;

    initializeVLibras()
      .then((root) => {
        if (isCancelled) root.remove?.();
      })
      .catch((error) => {
        if (isCancelled) return;
        console.error('Erro ao carregar o widget VLibras:', error);
        destroyVLibrasRoot();
      });

    return () => {
      isCancelled = true;
      destroyVLibrasRoot();
    };
  }, []);

  return null;
}
