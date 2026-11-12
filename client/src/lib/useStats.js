import { useEffect, useState } from 'react';
import { fetchStats } from './api';

/** Estado de la base de preguntas para la portada: loading → ready | error. */
export function useStats() {
  const [state, setState] = useState({ status: 'loading', data: null });

  useEffect(() => {
    const ctrl = new AbortController();
    fetchStats({ signal: ctrl.signal })
      .then((data) => setState({ status: 'ready', data }))
      .catch(() => {
        if (!ctrl.signal.aborted) setState({ status: 'error', data: null });
      });
    return () => ctrl.abort();
  }, []);

  return state;
}
