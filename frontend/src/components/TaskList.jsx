/*
  TaskList.jsx

  Last modified by: Maaz Haque
  Last modified on: 11/14/2026
*/
// Reuse the same rows for active and completed tasks.
function TaskList({ tasks, onToggle }) {
  return (
    <ul className="space-y-1">
      {tasks.map((task) => (
        <li key={task.id}>
          <label className="flex min-h-16 cursor-pointer items-center gap-4 rounded-md transition-colors duration-150 motion-reduce:transition-none border border-stroke bg-surface px-4 py-3 hover:bg-hover">
            <input
              type="checkbox"
              checked={Boolean(task.completed)}
              onChange={() => onToggle(task.id)}
              className="size-5 shrink-0 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
            />
            <span className={`min-w-0 break-words ${task.completed ? 'text-muted line-through' : 'text-foreground'}`}>
              {task.name}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}

export default TaskList;
