import { useId } from 'react';
import { createPortal } from 'react-dom';

export default function AppDialog({ dialogRef, title, onClose, children }) {
  const titleId = useId();

  return createPortal(
    <dialog ref={dialogRef} aria-labelledby={titleId}
      onClose={(event) => { if (event.target === event.currentTarget) onClose?.(); }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        dialogRef.current.close();
      }}
      className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-stroke bg-surface p-4 text-foreground shadow-xl backdrop:bg-black/45 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={titleId} className="min-w-0 break-words text-lg font-semibold">{title}</h2>
        <button type="button" className="secondary-control cursor-pointer" onClick={() => dialogRef.current.close()}>Close</button>
      </div>
      {children}
    </dialog>,
    document.body,
  );
}
