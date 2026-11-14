/*
  AppLayout.jsx

  Last modified by: Maaz Haque
  Last modified on: 11/14/2026
*/
import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';

function AppLayout() {
  const menuRef = useRef(null);
  const hoverTimer = useRef(null);
  const { pathname } = useLocation();
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [sidebarFocused, setSidebarFocused] = useState(false);
  // Keep navigation open while pinned, hovered, or keyboard focused.
  const sidebarExpanded = sidebarPinned || sidebarHovered || sidebarFocused;

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  function openSidebar(event) {
    if (event.pointerType !== 'mouse') return;
    clearTimeout(hoverTimer.current);
    setSidebarHovered(true);
  }

  function leaveSidebar() {
    clearTimeout(hoverTimer.current);
    // Allow time to move between the sidebar and its tooltips.
    hoverTimer.current = setTimeout(() => setSidebarHovered(false), 150);
  }

  function closeMenu() {
    menuRef.current?.close();
  }

  return (
    <div className="flex min-h-dvh flex-1 bg-canvas text-foreground">
      <aside
        aria-label="Sidebar"
        data-expanded-width="176"
        onPointerEnter={openSidebar}
        onPointerLeave={leaveSidebar}
        onFocusCapture={(event) => { if (event.target.matches(':focus-visible')) setSidebarFocused(true); }}
        onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSidebarFocused(false); }}
        className={`sticky top-0 z-20 hidden h-dvh shrink-0 transition-[width] duration-200 ease-fluid motion-reduce:transition-none md:block ${sidebarPinned ? 'w-44' : 'w-16'}`}
      >
        <div className={`absolute inset-y-0 left-0 overflow-x-hidden overflow-y-auto border-r border-field-border bg-surface transition-[width,box-shadow] duration-200 ease-fluid motion-reduce:transition-none ${sidebarExpanded ? 'w-44 shadow-sm' : 'w-16'}`}>
          <Sidebar collapsed={!sidebarExpanded} pinned={sidebarPinned} onToggle={() => setSidebarPinned((pinned) => !pinned)} />
        </div>
      </aside>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-controls="mobile-navigation"
        onClick={() => menuRef.current.showModal()}
        className="fixed top-4 left-4 z-10 min-h-11 cursor-pointer rounded-lg border border-field-border bg-surface px-4 py-2 font-medium text-muted shadow-sm hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus md:hidden"
      >
        Menu
      </button>
      {/* The native dialog handles mobile focus and Escape. */}
      <dialog
        ref={menuRef}
        id="mobile-navigation"
        aria-label="Navigation menu"
        onClick={(event) => { if (event.target === event.currentTarget) closeMenu(); }}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-56 max-w-[calc(100%-3rem)] border-0 bg-surface p-0 text-foreground shadow-xl backdrop:bg-pine/40 motion-safe:open:animate-drawer-enter motion-safe:backdrop:animate-backdrop-enter"
      >
        <div className="flex min-h-full flex-col">
          <button type="button" onClick={closeMenu} className="mx-4 mt-4 min-h-11 cursor-pointer self-end rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
            Close menu
          </button>
          <div className="flex flex-1 flex-col">
            <Sidebar onNavigate={closeMenu} />
          </div>
        </div>
      </dialog>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-[720px] flex-1 px-6 pt-20 pb-12 md:py-12">
          <div key={pathname} className="w-full motion-safe:animate-page-enter">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default AppLayout;
