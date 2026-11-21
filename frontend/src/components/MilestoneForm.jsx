/*
  MilestoneForm.jsx

  The form used both to create a milestone and to edit one.
  It keeps its own field values, saving state, and error message.
  onSubmit receives { name, description, targetDate } and should
  return a promise. If the promise rejects, the error is shown here.

  Created by: Joseph Duff
  Created on: 11/20/2026
*/
import { useState } from 'react';

const fieldClass =
  'w-full rounded-md border border-field-border bg-surface px-4 py-2 text-foreground transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60';

function MilestoneForm({
  idPrefix,
  initial,
  submitLabel,
  busyLabel,
  resetOnSuccess = false,
  onSubmit,
  onCancel,
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Enter a milestone name.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        name: trimmedName,
        description: description.trim() || null,
        targetDate: targetDate || null,
      });
      // the create form clears itself, the edit form is closed by its parent
      if (resetOnSuccess) {
        setName('');
        setDescription('');
        setTargetDate('');
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p role="alert" className="text-danger">{error}</p>}

      <div>
        <label htmlFor={`${idPrefix}-name`} className="mb-1 block font-medium text-foreground">
          Name
        </label>
        <input
          id={`${idPrefix}-name`}
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={200}
          disabled={submitting}
          autoFocus={Boolean(onCancel)}
          className={`min-h-12 ${fieldClass}`}
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-date`} className="mb-1 block font-medium text-foreground">
          Target date <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id={`${idPrefix}-date`}
          type="date"
          value={targetDate}
          onChange={(event) => setTargetDate(event.target.value)}
          disabled={submitting}
          className={`min-h-12 sm:w-56 ${fieldClass}`}
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-description`} className="mb-1 block font-medium text-foreground">
          Description <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id={`${idPrefix}-description`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={2000}
          rows={3}
          disabled={submitting}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="min-h-12 cursor-pointer rounded-md bg-primary px-5 py-2 font-medium text-on-primary transition-colors duration-150 motion-reduce:transition-none hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-wait disabled:opacity-60"
        >
          {submitting ? busyLabel : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="min-h-12 cursor-pointer rounded-md border border-stroke bg-surface px-5 py-2 font-medium text-foreground transition-colors duration-150 motion-reduce:transition-none hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default MilestoneForm;
