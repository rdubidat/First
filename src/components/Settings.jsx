import { useState } from 'react';

export default function Settings({ settings, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...settings });

  const handleChange = (key, value) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0 && num <= 120) {
      setDraft((prev) => ({ ...prev, [key]: num }));
    }
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  const fields = [
    { key: 'focus', label: 'Focus Duration', unit: 'minutes', min: 1, max: 120 },
    { key: 'shortBreak', label: 'Short Break', unit: 'minutes', min: 1, max: 30 },
    { key: 'longBreak', label: 'Long Break', unit: 'minutes', min: 1, max: 60 },
    { key: 'dailyGoal', label: 'Daily Session Goal', unit: 'sessions', min: 1, max: 20 },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Timer Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {fields.map(({ key, label, unit, min, max }) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                {label}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={draft[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="flex-1 accent-red-500"
                />
                <div className="w-20 text-right">
                  <span className="text-lg font-bold text-gray-800">{draft[key]}</span>
                  <span className="text-xs text-gray-400 ml-1">{unit === 'sessions' ? '' : 'min'}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Presets */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Presets</label>
            <div className="flex gap-2">
              <button
                onClick={() => setDraft({ focus: 25, shortBreak: 5, longBreak: 15, dailyGoal: draft.dailyGoal })}
                className="flex-1 px-3 py-2 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Classic (25/5)
              </button>
              <button
                onClick={() => setDraft({ focus: 50, shortBreak: 10, longBreak: 30, dailyGoal: draft.dailyGoal })}
                className="flex-1 px-3 py-2 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Deep Work (50/10)
              </button>
              <button
                onClick={() => setDraft({ focus: 90, shortBreak: 15, longBreak: 30, dailyGoal: draft.dailyGoal })}
                className="flex-1 px-3 py-2 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Flow (90/15)
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-orange-500 rounded-lg hover:shadow-lg transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
