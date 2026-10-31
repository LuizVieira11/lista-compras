import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ignore harmless Vite HMR WebSocket disconnects in AI Studio preview
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason &&
      (String(event.reason).includes('WebSocket') ||
       String(event.reason?.message).includes('WebSocket') ||
       String(event.reason).includes('vite'))
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
