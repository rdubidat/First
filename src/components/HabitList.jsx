import HabitItem from './HabitItem';

const HabitList = ({ tasks, onToggle, onRemove }) => {
  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Today's Progress</span>
          <span className="font-semibold text-indigo-600">
            {completedTasks.length} / {tasks.length} tasks
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Incomplete Tasks */}
      {incompleteTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            To Do ({incompleteTasks.length})
          </h3>
          <div className="space-y-3">
            {incompleteTasks.map(task => (
              <HabitItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Completed ({completedTasks.length})
          </h3>
          <div className="space-y-3">
            {completedTasks.map(task => (
              <HabitItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No habits yet!</p>
          <p className="text-sm">Add your first marketing habit below.</p>
        </div>
      )}
    </div>
  );
};

export default HabitList;
