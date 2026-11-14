/*
  Brand.jsx

  Last modified by: Maaz Haque
  Last modified on: 11/14/2026
*/
// Share the wordmark across layouts.
function Brand({ className = '' }) {
  return (
    <img
      src="/branding/habitual-wordmark.png"
      alt="Habitual"
      width="2172"
      height="724"
      className={`block h-auto max-w-full dark:invert dark:hue-rotate-180 ${className}`}
    />
  );
}

export default Brand;
