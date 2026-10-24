/*
  Header.jsx

  Creates the header component

  Created by: CJ Quintero
  Created on: 10/24/2026
*/
import { Link, NavLink } from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      {/* clicking the app title links back to the home page */}
      <h1 className="app-title">
        <Link to="/">Habitual</Link>
      </h1>

      <nav className="nav-links">
        <NavLink to="/" end>Home</NavLink>  {/* end is needed otherwise the slash will match all links */}
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>
    </header>
  )
}

export default Header;
