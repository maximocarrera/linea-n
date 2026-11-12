import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// ?preview=… muestra pantallas con datos de ejemplo. Solo existe en `npm run dev`
// (en el build de producción esta rama se elimina).
const previewName = import.meta.env.DEV ? new URLSearchParams(location.search).get('preview') : null;
const Preview = import.meta.env.DEV ? lazy(() => import('./dev/Preview.jsx')) : null;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {previewName !== null && Preview ? (
      <Suspense fallback={null}>
        <Preview name={previewName} />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
