/*
  Sidebar.jsx

  Creates the sidebar navigation component

  Created by: CJ Quintero
  Created on: 10/24/2026

  Last modified by: Maaz Haque
  Last modified on: 11/14/2026
*/
import { Link, NavLink } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import Brand from '../Brand';
import ThemeToggle from '../theme/ThemeToggle';

const navLinkClass = ({ isActive }) =>
  `flex min-h-12 items-center justify-start rounded-lg px-3 py-3 font-medium no-underline transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
    isActive
      ? 'bg-accent text-on-accent'
      : 'text-muted hover:bg-hover hover:text-foreground'
  }`;

const iconPaths = {
  home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  login: 'M14 3h6v18h-6M3 12h12m-4-4 4 4-4 4',
  dashboard: 'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z',
  logout: 'M10 3H4v18h6m3-13 4 4-4 4m-5-4h13',
  collapse: 'm14 6-6 6 6 6',
  expand: 'm10 6 6 6-6 6',
};

function SidebarIcon({ name }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-6 shrink-0">
      <path d={iconPaths[name]} />
    </svg>
  );
}

function SidebarLabel({ collapsed, children }) {
  return (
    <span aria-hidden="true" className={`ml-3 min-w-0 truncate transition-opacity duration-200 motion-reduce:transition-none ${collapsed ? 'invisible opacity-0' : 'visible opacity-100'}`}>
      {children}
    </span>
  );
}

function Sidebar({ onNavigate, collapsed = false, pinned = false, onToggle }) {
  const { user, loading, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const [tooltip, setTooltip] = useState(null);
  const tooltipTimer = useRef(null);

  useEffect(() => () => clearTimeout(tooltipTimer.current), []);

  function hideTooltip() {
    clearTimeout(tooltipTimer.current);
    setTooltip(null);
  }

  function keepTooltip() {
    clearTimeout(tooltipTimer.current);
  }

  // Keep tooltips visible while a sidebar control has focus.
  function delayHideTooltip() {
    clearTimeout(tooltipTimer.current);
    tooltipTimer.current = setTimeout(() => {
      if (!document.activeElement?.hasAttribute('data-sidebar-control')) setTooltip(null);
    }, 150);
  }

  function iconAccessibility(label) {
    function showTooltip(event) {
      keepTooltip();
      const bounds = event.currentTarget.getBoundingClientRect();
      const sidebar = event.currentTarget.closest('aside');
      const sidebarBounds = sidebar?.getBoundingClientRect();
      // Place tooltips outside the expanded sidebar and inside the viewport.
      const sidebarRight = sidebarBounds ? sidebarBounds.left + Number(sidebar.dataset.expandedWidth) : bounds.right;
      setTooltip({
        label,
        left: Math.max(8, Math.min(sidebarRight + 8, window.innerWidth - 176)),
        top: Math.max(8, Math.min(bounds.top, window.innerHeight - 56)),
      });
    }

    return {
      'aria-label': label,
      'data-sidebar-control': true,
      onMouseEnter: showTooltip,
      onMouseLeave: delayHideTooltip,
      onFocus: showTooltip,
      onBlur: hideTooltip,
    };
  }

  function navigate() {
    hideTooltip();
    onNavigate?.();
  }

  async function handleLogout() {
    hideTooltip();
    setLoggingOut(true);
    setError('');
    try {
      await logout();
      onNavigate?.();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div onKeyDown={(event) => { if (event.key === 'Escape') hideTooltip(); }} className={`flex min-h-full flex-1 flex-col bg-surface ${onToggle ? 'p-2' : 'p-4'}`}>
      {/* clicking the app title links back to the home page */}
      <h1 className="m-0 h-12 text-2xl leading-[1.2] font-bold">
        <Link aria-label="Habitual" onClick={onNavigate} className="relative flex h-12 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" to="/">
          <span aria-hidden="true" className={`pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center transition-opacity duration-200 motion-reduce:transition-none ${collapsed ? 'opacity-100' : 'opacity-0'}`}>
            <img src="/favicon.png" alt="" width="1254" height="1254" className="size-10 dark:invert dark:hue-rotate-180" />
          </span>
          <span aria-hidden="true" className={`pointer-events-none absolute inset-y-0 left-0 flex w-36 items-center justify-center overflow-hidden transition-opacity duration-200 motion-reduce:transition-none ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
            <Brand className="w-36 shrink-0" />
          </span>
        </Link>
      </h1>

      {onToggle && (
        <button
          type="button"
          onClick={() => { hideTooltip(); onToggle(); }}
          aria-expanded={!collapsed}
          aria-pressed={pinned}
          aria-controls="desktop-navigation"
          {...iconAccessibility(pinned ? 'Unpin sidebar' : 'Pin sidebar open')}
          className="mt-4 flex min-h-12 cursor-pointer items-center justify-start rounded-lg transition-colors duration-150 motion-reduce:transition-none px-3 py-2 text-sm font-medium text-muted hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <SidebarIcon name={pinned ? 'collapse' : 'expand'} />
          <SidebarLabel collapsed={collapsed}>{pinned ? 'Unpin sidebar' : 'Pin sidebar'}</SidebarLabel>
        </button>
      )}

      <nav id={onToggle ? 'desktop-navigation' : undefined} aria-label="Main navigation" className="mt-4 flex flex-1 flex-col gap-1">
        <NavLink onClick={navigate} {...iconAccessibility('Home')} className={navLinkClass} to="/" end><SidebarIcon name="home" /><SidebarLabel collapsed={collapsed}>Home</SidebarLabel></NavLink>  {/* end is needed otherwise the slash will match all links */}
        {!loading && !user && <NavLink onClick={navigate} {...iconAccessibility('Login')} className={navLinkClass} to="/login"><SidebarIcon name="login" /><SidebarLabel collapsed={collapsed}>Login</SidebarLabel></NavLink>}
        <NavLink onClick={navigate} {...iconAccessibility('Dashboard')} className={navLinkClass} to="/dashboard"><SidebarIcon name="dashboard" /><SidebarLabel collapsed={collapsed}>Dashboard</SidebarLabel></NavLink>
        <div className="mt-auto pt-4">
          <ThemeToggle showLabel collapsed={collapsed} {...iconAccessibility('Dark mode')} />
        </div>
        {user && (
          <button type="button" onClick={handleLogout} disabled={loggingOut} aria-busy={loggingOut} {...iconAccessibility(loggingOut ? 'Logging out...' : 'Logout')} className="flex min-h-12 cursor-pointer items-center justify-start rounded-lg transition-colors duration-150 motion-reduce:transition-none px-3 py-3 font-medium text-muted hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-wait disabled:opacity-60">
            <SidebarIcon name="logout" />
            <SidebarLabel collapsed={collapsed}>{loggingOut ? 'Logging out...' : 'Logout'}</SidebarLabel>
          </button>
        )}
        {error && <p role="alert" title={error} className="break-words text-sm text-danger">{collapsed ? <><span aria-hidden="true">Failed</span><span className="sr-only">{error}</span></> : error}</p>}
      </nav>
      {tooltip && (
        <div
          role="tooltip"
          onMouseEnter={keepTooltip}
          onMouseLeave={delayHideTooltip}
          style={{ left: tooltip.left, top: tooltip.top }}
          className="fixed z-50 max-w-40 rounded-md bg-tooltip px-3 py-2 text-sm font-medium text-on-tooltip shadow-md motion-safe:animate-tooltip-enter"
        >
          {tooltip.label}
        </div>
      )}
    </div>
  )
}

export default Sidebar;
