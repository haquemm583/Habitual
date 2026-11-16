/*
  Main.jsx

  This is the start of the project. Here, BrowserRouter
  wraps the App component so that links can change
  the URL without reloading the page, and <Routes>
  in App.jsx renders the page that matches the correct URL

  Created by: CJ Quintero
  Created on: 10/24/2026

  Last modified by: Maaz Haque
  Last modified on: 11/14/2026
*/
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import AuthProvider from './components/auth/AuthProvider';
import ThemeProvider from './components/theme/ThemeProvider';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {/* Share the selected theme across all routes. */}
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
