/*
  ThemeToggle.jsx

  Last modified by: Maaz Haque
  Last modified on: 11/14/2026
*/
import { useTheme } from '../../theme/ThemeContext';

// aria-pressed exposes the current theme to assistive technology.
function ThemeToggle({ collapsed = false, showLabel = false, ...accessibilityProps }) {
  const { dark, toggleTheme } = useTheme();

  return (
    <button
      {...accessibilityProps}
      type="button"
      onClick={toggleTheme}
      aria-label="Dark mode"
      aria-pressed={dark}
      className={`flex min-h-12 cursor-pointer items-center rounded-lg text-muted transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none ${showLabel ? 'w-full justify-start px-3 py-3 font-medium' : 'w-12 justify-center'}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-6 shrink-0">
        <path d={dark ? 'M12 3v1m0 16v1M3 12h1m16 0h1M5.6 5.6l.7.7m11.4 11.4.7.7M5.6 18.4l.7-.7M17.7 6.3l.7-.7M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z' : 'M20.9 13.3A9 9 0 0 1 10.7 3.1a9 9 0 1 0 10.2 10.2Z'} />
      </svg>
      {showLabel && (
        <span aria-hidden="true" className={`ml-3 min-w-0 truncate transition-opacity duration-200 motion-reduce:transition-none ${collapsed ? 'invisible opacity-0' : 'visible opacity-100'}`}>
          Dark mode
        </span>
      )}
    </button>
  );
}

export default ThemeToggle;
