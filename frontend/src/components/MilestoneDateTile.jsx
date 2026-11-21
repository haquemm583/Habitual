import { dateLabel, deviceToday } from '../habits/api';

function MilestoneDateTile({ date }) {
  const targetYear = date.slice(0, 4);

  return (
    <time dateTime={date} className="grid min-w-14 shrink-0 place-items-center rounded-xl border border-progress-goal/25 bg-progress-goal/10 px-2.5 py-2 text-progress-goal">
      <span className="sr-only">Target {dateLabel(date)}</span>
      <span aria-hidden="true" className="text-xs font-semibold">
        {dateLabel(date, { month: 'short', day: undefined, year: undefined })}
      </span>
      <span aria-hidden="true" className="text-xl leading-none font-bold tabular-nums">
        {dateLabel(date, { month: undefined, year: undefined })}
      </span>
      {targetYear !== deviceToday().slice(0, 4) && (
        <span aria-hidden="true" className="mt-0.5 text-xs tabular-nums">{targetYear}</span>
      )}
    </time>
  );
}

export default MilestoneDateTile;
