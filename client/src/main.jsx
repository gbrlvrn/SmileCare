import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// 1) Bootstrap's CSS first, 2) our theme overrides second (so ours win).
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';

import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AuthModalProvider } from './context/AuthModalContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

// Provider order: Theme → Router (AuthProvider uses useNavigate) → Toasts → Auth → AuthModal → App
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <AuthModalProvider>
              <App />
            </AuthModalProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
