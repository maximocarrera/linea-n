import { io } from 'socket.io-client';

// En dev, Vite hace proxy de /socket.io al servidor (puerto 3001).
// En producción, si el server vive en otro dominio, definí VITE_SERVER_URL.
export const socket = io(import.meta.env.VITE_SERVER_URL || undefined, {
  autoConnect: false,
  reconnectionDelay: 500,
  reconnectionDelayMax: 3000,
});
