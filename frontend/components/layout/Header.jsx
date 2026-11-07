/*
  Header.jsx

  Creates the header component

  Created by: CJ Quintero
  Created on: 10/24/2026
*/
import { Link, NavLink } from 'react-router-dom';

const navLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 font-medium no-underline transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338ca] ${
    isActive
      ? 'bg-[#e0e7ff] text-[#4338ca]'
      : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]'
  }`;

function Header() {
  return (
    <header className="flex items-center justify-between border-b-2 border-black bg-white p-4 max-[480px]:flex-col max-[480px]:items-start">
      {/* clicking the app title links back to the home page */}
      <h1 className="m-0 text-2xl leading-[1.2] font-bold">
        <Link className="text-black no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338ca]" to="/">Habitual</Link>
      </h1>

      <nav className="flex gap-4">
        <NavLink className={navLinkClass} to="/" end>Home</NavLink>  {/* end is needed otherwise the slash will match all links */}
        <NavLink className={navLinkClass} to="/login">Login</NavLink>
        <NavLink className={navLinkClass} to="/dashboard">Dashboard</NavLink>
        <NavLink className={navLinkClass} to="/about">About</NavLink>
      </nav>
    </header>
  )
}

export default Header;
