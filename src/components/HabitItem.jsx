const HabitItem = ({ task, onToggle, onRemove }) => {
  const categoryColors = {
    content: 'bg-blue-100 text-blue-700',
    engagement: 'bg-green-100 text-green-700',
    outreach: 'bg-orange-100 text-orange-700',
    custom: 'bg-purple-100 text-purple-700'
  };

  return (
    <div
      className={`flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border-2 transition-all duration-200 ${
        task.completed
          ? 'border-green-400 bg-green-50'
          : 'border-transparent hover:border-indigo-200'
      }`}
    >
      <button
        onClick={() => onToggle(task.id)}
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          task.completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-indigo-400'
        }`}
      >
        {task.completed && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <span className="text-2xl">{task.icon}</span>

      <div className="flex-1">
        <span className={`font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
          {task.name}
        </span>
        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${categoryColors[task.category] || categoryColors.custom}`}>
          {task.category}
        </span>
      </div>

      {task.completed && task.completedAt && (
        <span className="text-xs text-gray-400">
          {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}

      <button
        onClick={() => onRemove(task.id)}
        className="text-gray-300 hover:text-red-500 transition-colors p-1"
        title="Remove habit"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default HabitItem;
