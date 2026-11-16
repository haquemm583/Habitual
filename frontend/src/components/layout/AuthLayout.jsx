/*
  AuthLayout.jsx

  Last modified by: Maaz Haque
  Last modified on: 11/14/2026
*/
import { Outlet, useLocation } from 'react-router-dom';
import { useLayoutEffect, useRef, useState } from 'react';
import Brand from '../Brand';
import ThemeToggle from '../theme/ThemeToggle';

function AuthLayout() {
  const { pathname } = useLocation();
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(null);

  // Animate the card height when the form or its messages change.
  useLayoutEffect(() => {
    const content = contentRef.current;
    const observer = new ResizeObserver(() => setContentHeight(content.offsetHeight));
    observer.observe(content);
    setContentHeight(content.offsetHeight);
    return () => observer.disconnect();
  }, []);
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center overflow-hidden bg-canvas px-4 pt-[max(4rem,calc((100dvh-45rem)/2))] pb-8 text-foreground sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden text-muted">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,color-mix(in_srgb,var(--color-accent)_20%,transparent),transparent_45%),radial-gradient(ellipse_at_80%_75%,color-mix(in_srgb,var(--color-olive)_18%,transparent),transparent_45%)]" />
        <div className="absolute top-[18%] left-[5%] flex -rotate-6 items-center gap-3 rounded-xl border border-stroke/50 bg-surface/50 px-5 py-4 text-sm shadow-sm motion-safe:animate-habit-float sm:left-[10%]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/30 text-foreground">✓</span> Drink water
        </div>
        <div className="absolute top-[29%] right-[4%] flex rotate-6 items-center gap-3 rounded-xl border border-stroke/50 bg-surface/50 px-5 py-4 text-sm shadow-sm motion-safe:animate-habit-float motion-safe:[animation-delay:-3s] sm:right-[10%]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/30 text-foreground">✓</span> Take a walk
        </div>
        <div className="absolute bottom-[17%] left-[8%] flex rotate-3 items-center gap-3 rounded-xl border border-stroke/50 bg-surface/50 px-5 py-4 text-sm shadow-sm motion-safe:animate-habit-float motion-safe:[animation-delay:-5s] sm:left-[15%]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-stroke"> </span> {pathname === '/register' ? 'Sign Up' : 'Log In'}
        </div>
        <div className="absolute right-[7%] bottom-[12%] flex -rotate-6 items-center gap-3 rounded-xl border border-stroke/50 bg-surface/50 px-5 py-4 text-sm shadow-sm motion-safe:animate-habit-float motion-safe:[animation-delay:-7s] sm:right-[14%]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/30 text-foreground">✓</span> Plan tomorrow
        </div>
      </div>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="mb-4">
        <Brand className="w-48 sm:w-56" />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-stroke bg-surface p-6 shadow-sm sm:p-8">
        <div className="motion-safe:transition-[height] motion-safe:duration-300 motion-safe:ease-in-out" style={{ height: contentHeight ?? 'auto' }}>
          <div ref={contentRef}>
            <div key={pathname} className="motion-safe:animate-tooltip-enter">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AuthLayout;
