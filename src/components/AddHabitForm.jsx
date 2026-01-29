import { useState } from 'react';

const ICONS = ['📝', '💬', '📧', '💡', '📰', '🎯', '📱', '🎥', '🎙️', '✍️', '🤝', '📊'];
const CATEGORIES = [
  { value: 'content', label: 'Content', color: 'bg-blue-100 text-blue-700' },
  { value: 'engagement', label: 'Engagement', color: 'bg-green-100 text-green-700' },
  { value: 'outreach', label: 'Outreach', color: 'bg-orange-100 text-orange-700' },
  { value: 'custom', label: 'Other', color: 'bg-purple-100 text-purple-700' },
];

const AddHabitForm = ({ onAdd, onReset }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📝');
  const [category, setCategory] = useState('content');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), icon, category);
      setName('');
      setIcon('📝');
      setCategory('content');
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="flex gap-3">
        <button
          onClick={() => setIsOpen(true)}
          className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Habit
        </button>
        <button
          onClick={onReset}
          className="bg-gray-200 text-gray-600 py-3 px-4 rounded-xl hover:bg-gray-300 transition-colors"
          title="Reset to defaults"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-4">
      <h3 className="font-semibold text-gray-800">Add New Marketing Habit</h3>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Habit Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Record a quick video tip"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-2">Icon</label>
        <div className="flex flex-wrap gap-2">
          {ICONS.map(i => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all ${
                icon === i ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-2">Category</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                category === cat.value
                  ? `${cat.color} ring-2 ring-offset-1 ring-indigo-500`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={!name.trim()}
          className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Habit
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddHabitForm;
