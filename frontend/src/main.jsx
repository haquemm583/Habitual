/*
  Main.jsx

  This is the start of the project. Here, BrowserRouter
  wraps the App component so that links can change
  the URL without reloading the page, and <Routes>
  in App.jsx renders the page that matches the correct URL

  Created by: CJ Quintero
  Created on: 10/24/2026
*/
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
