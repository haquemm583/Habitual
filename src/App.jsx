/*
  App.jsx

  This holds the App component which embeds the
  header component, the main section which contains
  the routes, and the footer.

  To add a new route, simply add it with
  the existing routes.

  Created by: CJ Quintero
  Created on: 10/24/2026
*/
import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import About from './pages/About';

import './App.css';

function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="about" element={<About />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
