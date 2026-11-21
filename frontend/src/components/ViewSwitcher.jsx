export default function ViewSwitcher({ label, value, onChange, views }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {views.map(([id, name]) => (
        <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}
          className="secondary-control cursor-pointer aria-pressed:border-primary aria-pressed:bg-hover">
          {name}
        </button>
      ))}
    </div>
  );
}
