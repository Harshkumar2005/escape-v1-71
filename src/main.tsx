
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Toaster 
      position="bottom-center" 
      richColors 
      closeButton 
      theme="dark" 
      toastOptions={{
        className: 'bg-[#1A1F2C] text-white border-border',
        style: {
          background: 'rgb(26, 30, 38)',
          border: '1px solid rgba(39, 43, 51, 0.5)',
          color: 'rgb(214, 221, 235)'
        }
      }}
    />
    <App />
  </React.StrictMode>,
);
