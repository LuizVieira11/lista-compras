import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ignore harmless Vite HMR WebSocket disconnects in AI Studio preview
if (typeof window !== 'undefined') {
  const isViteWs = (err: any) => {
    if (!err) return false;
    const str = typeof err === 'string' ? err : (err.message || err.reason || String(err));
    return str.includes('WebSocket') || str.includes('vite');
  };

  window.addEventListener('error', (event) => {
    if (isViteWs(event.message) || isViteWs(event.error)) {
      event.preventDefault();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (isViteWs(event.reason)) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
