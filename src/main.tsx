
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';
import './file-icons.css'; // We'll create a custom CSS file for icon styles

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Toaster position="top-center" richColors closeButton />
    <App />
  </React.StrictMode>,
);
