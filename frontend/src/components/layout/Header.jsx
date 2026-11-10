/*
  Header.jsx

  Creates the header component

  Created by: CJ Quintero
  Created on: 10/24/2026
*/
import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

const navLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 font-medium no-underline transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338ca] ${
    isActive
      ? 'bg-[#e0e7ff] text-[#4338ca]'
      : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]'
  }`;

function Header() {
  const { user, loading, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');

  async function handleLogout() {
    setLoggingOut(true);
    setError('');
    try {
      await logout();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="flex items-center justify-between border-b-2 border-black bg-white p-4 max-[480px]:flex-col max-[480px]:items-start">
      {/* clicking the app title links back to the home page */}
      <h1 className="m-0 text-2xl leading-[1.2] font-bold">
        <Link className="text-black no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338ca]" to="/">Habitual</Link>
      </h1>

      <nav aria-label="Main navigation" className="flex flex-wrap gap-4">
        <NavLink className={navLinkClass} to="/" end>Home</NavLink>  {/* end is needed otherwise the slash will match all links */}
        {!loading && !user && <NavLink className={navLinkClass} to="/login">Login</NavLink>}
        <NavLink className={navLinkClass} to="/dashboard">Dashboard</NavLink>
        <NavLink className={navLinkClass} to="/about">About</NavLink>
        {user && (
          <button type="button" onClick={handleLogout} disabled={loggingOut} className="cursor-pointer rounded-lg px-3 py-2 font-medium text-[#6b7280] hover:bg-[#f3f4f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338ca] disabled:cursor-wait disabled:opacity-60">
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        )}
        {error && <p role="alert" className="basis-full text-red-700">{error}</p>}
      </nav>
    </header>
  )
}

export default Header;
