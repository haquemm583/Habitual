import { useEffect, useRef } from 'react';

const directions = [
  [0, -1], [0.66, -0.75], [1, -0.15], [0.76, 0.65],
  [0, 1], [-0.72, 0.66], [-1, -0.12], [-0.66, -0.75],
];

function CompletionBurst({ trigger, milestone = false, position = 'top-1/2 left-1/2' }) {
  const spark = useRef(null);
  const previousTrigger = useRef(trigger);

  useEffect(() => {
    const play = trigger && trigger !== previousTrigger.current;
    previousTrigger.current = trigger;
    if (!play || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const distance = milestone ? 29 : 19;
    const trail = (radius, spread) => directions.map(([x, y]) =>
      `${x * radius}px ${y * radius}px 0 ${spread}px currentColor`).join(', ');
    const animation = spark.current?.animate?.([
      { opacity: 0, boxShadow: trail(0, -1) },
      { opacity: 1, boxShadow: trail(10, milestone ? 1 : 0), offset: 0.25 },
      { opacity: 0, boxShadow: trail(distance, -1) },
    ], { duration: milestone ? 590 : 420, easing: 'cubic-bezier(0.2, 0.7, 0.35, 1)' });

    return () => animation?.cancel();
  }, [trigger, milestone]);

  return (
    <span ref={spark} aria-hidden="true"
      className={`pointer-events-none absolute z-10 size-1.5 -translate-1/2 rounded-full opacity-0 motion-reduce:hidden ${position} ${milestone ? 'text-progress-goal' : 'text-progress-habit'}`} />
  );
}

export default CompletionBurst;
