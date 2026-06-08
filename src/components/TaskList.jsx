import TaskItem from './TaskItem'
import Leon from './Leon'

export default function TaskList({ tasks, onComplete, onRemove, onCelebrate }) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <Leon mood="happy" size={84} className="animate-float-bob" />
        <p className="font-display text-base font-bold text-bark-700 dark:text-leon-100">
          All caught up!
        </p>
        <p className="max-w-[220px] text-sm font-medium text-bark-400 dark:text-bark-300">
          Leon's tail is wagging. Add a task above whenever you're ready to
          fetch something new.
        </p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2 px-3 py-1">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onComplete={onComplete}
          onRemove={onRemove}
          onCelebrate={onCelebrate}
        />
      ))}
    </ul>
  )
}
