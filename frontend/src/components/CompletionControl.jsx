import CompletionBurst from './CompletionBurst';

function CompletionControl({ id, label, checked, disabled, onChange }) {
  return (
    <label className={`relative grid size-11 shrink-0 place-items-center ${disabled ? 'cursor-default' : 'cursor-pointer'}`}>
      <input id={id} type="checkbox" aria-label={label} checked={checked} aria-disabled={disabled}
        onChange={() => { if (!disabled) onChange(); }} className="peer absolute inset-0 size-full cursor-inherit opacity-0" />
      <span aria-hidden="true" className="pointer-events-none grid size-6 place-items-center rounded-full border border-field-border bg-surface text-sm font-semibold text-transparent motion-safe:transition-[background-color,color,scale] motion-safe:duration-150 peer-checked:scale-105 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-focus peer-aria-disabled:opacity-60">
        ✓
      </span>
      <CompletionBurst trigger={checked} />
    </label>
  );
}

export default CompletionControl;
