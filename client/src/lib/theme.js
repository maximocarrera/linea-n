import { useSyncExternalStore } from 'react';
import { TERMINAL_STATION } from '@linean/shared';
import { local } from './storage';

// Tema visual. 'subte' es el de siempre; 'vice' es el Modo Vice City (atardecer neón).
// index.html aplica el guardado antes de que cargue React (así no parpadea el tema viejo).
// Estado compartido: todos los componentes que usan useTheme se enteran al cambiarlo.
const KEY = 'linean:theme';
const THEME_COLOR = { subte: '#0b0d12', vice: '#140a24' };

let current = local.get(KEY, 'subte') === 'vice' ? 'vice' : 'subte';
const listeners = new Set();

function apply(theme) {
  const root = document.documentElement;
  if (theme === 'vice') root.dataset.theme = 'vice';
  else delete root.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme] ?? THEME_COLOR.subte);
}

export function setTheme(theme) {
  current = theme === 'vice' ? 'vice' : 'subte';
  apply(current);
  local.set(KEY, current);
  for (const fn of listeners) fn();
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useTheme() {
  return [useSyncExternalStore(subscribe, () => current), setTheme];
}

/** La cabecera (meta del recorrido): en Modo Vice City se llega a Vice City. */
export function useTerminal() {
  return useTheme()[0] === 'vice' ? 'Vice City' : TERMINAL_STATION;
}
