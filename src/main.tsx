import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { BrowserGate } from './components/BrowserGate';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserGate>
      <App />
    </BrowserGate>
  </StrictMode>
);
