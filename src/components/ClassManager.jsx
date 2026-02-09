import { useState } from 'react';
import { DAY_NAMES, DAY_SHORT, formatTime, getClassColor } from '../utils/helpers';

function ClassForm({ onSubmit, onCancel, initial }) {
  const [form, setForm] = useState(
    initial || {
      name: '',
      description: '',
      instructor: '',
      location: '',
      startTime: '09:00',
      endTime: '10:00',
      scheduleDays: [],
      maxCapacity: 30,
      color: 0,
    }
  );

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      scheduleDays: prev.scheduleDays.includes(day)
        ? prev.scheduleDays.filter((d) => d !== day)
        : [...prev.scheduleDays, day],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Morning Yoga, Math 101"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description of the class"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
          <input
            type="text"
            value={form.instructor}
            onChange={(e) => setForm({ ...form, instructor: e.target.value })}
            placeholder="Instructor name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location / Room</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Room or location"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
          <input
            type="number"
            min="1"
            value={form.maxCapacity}
            onChange={(e) => setForm({ ...form, maxCapacity: parseInt(e.target.value, 10) || 1 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 8 }, (_, i) => {
              const c = getClassColor(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setForm({ ...form, color: i })}
                  className={`w-8 h-8 rounded-full ${c.dot} ${form.color === i ? 'ring-2 ring-offset-2 ring-gray-400' : ''} transition-all`}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Days *</label>
        <div className="flex flex-wrap gap-2">
          {DAY_NAMES.map((day, i) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                form.scheduleDays.includes(day)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {DAY_SHORT[i]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {initial ? 'Update Class' : 'Create Class'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default function ClassManager({ classes, students, onAddClass, onUpdateClass, onDeleteClass, onEnroll, onUnenroll }) {
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [expandedClass, setExpandedClass] = useState(null);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [enrollingClassId, setEnrollingClassId] = useState(null);

  const handleCreate = (data) => {
    onAddClass(data);
    setShowForm(false);
  };

  const handleUpdate = (data) => {
    onUpdateClass(editingClass.id, data);
    setEditingClass(null);
  };

  const handleDelete = (cls) => {
    if (window.confirm(`Delete "${cls.name}"? This will remove all attendance records for this class.`)) {
      onDeleteClass(cls.id);
    }
  };

  const filteredStudentsForEnroll = (classId) => {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return [];
    return students.filter(
      (s) =>
        !cls.enrolledStudents.includes(s.id) &&
        (s.name.toLowerCase().includes(enrollSearch.toLowerCase()) ||
          s.email.toLowerCase().includes(enrollSearch.toLowerCase()))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Classes</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditingClass(null); }}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Class
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Create New Class</h3>
          <ClassForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {editingClass && (
        <div className="bg-white rounded-xl border border-blue-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Edit: {editingClass.name}</h3>
          <ClassForm initial={editingClass} onSubmit={handleUpdate} onCancel={() => setEditingClass(null)} />
        </div>
      )}

      {classes.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No classes created yet. Click "New Class" to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((cls, idx) => {
            const color = getClassColor(cls.color ?? idx);
            const isExpanded = expandedClass === cls.id;
            const enrolledStudentsList = students.filter((s) => cls.enrolledStudents.includes(s.id));

            return (
              <div key={cls.id} className={`bg-white rounded-xl border ${color.border} overflow-hidden`}>
                {/* Class Header */}
                <div
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors`}
                  onClick={() => setExpandedClass(isExpanded ? null : cls.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 mt-1.5 rounded-full ${color.dot} flex-shrink-0`} />
                      <div>
                        <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                        {cls.description && <p className="text-sm text-gray-500 mt-0.5">{cls.description}</p>}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                          {cls.instructor && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              {cls.instructor}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {cls.enrolledStudents.length}/{cls.maxCapacity}
                          </span>
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          {cls.scheduleDays?.map((day) => (
                            <span key={day} className={`px-2 py-0.5 rounded text-xs font-medium ${color.bg} ${color.text}`}>
                              {DAY_SHORT[DAY_NAMES.indexOf(day)]}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingClass(cls); setShowForm(false); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(cls); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded: Enrolled Students */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">Enrolled Students ({enrolledStudentsList.length})</h4>
                      <button
                        onClick={() => setEnrollingClassId(enrollingClassId === cls.id ? null : cls.id)}
                        className="text-xs px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                      >
                        + Add Student
                      </button>
                    </div>

                    {enrollingClassId === cls.id && (
                      <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
                        <input
                          type="text"
                          value={enrollSearch}
                          onChange={(e) => setEnrollSearch(e.target.value)}
                          placeholder="Search students to enroll..."
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {filteredStudentsForEnroll(cls.id).length === 0 ? (
                            <p className="text-xs text-gray-400 p-2">No available students found. Add students first.</p>
                          ) : (
                            filteredStudentsForEnroll(cls.id).map((student) => (
                              <button
                                key={student.id}
                                onClick={() => { onEnroll(cls.id, student.id); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded transition-colors flex items-center justify-between"
                              >
                                <span>
                                  <span className="font-medium text-gray-800">{student.name}</span>
                                  {student.email && <span className="text-gray-400 ml-2">{student.email}</span>}
                                </span>
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {enrolledStudentsList.length === 0 ? (
                      <p className="text-sm text-gray-400">No students enrolled yet.</p>
                    ) : (
                      <div className="space-y-1">
                        {enrolledStudentsList.map((student) => (
                          <div key={student.id} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg">
                            <div>
                              <span className="text-sm font-medium text-gray-800">{student.name}</span>
                              {student.email && <span className="text-xs text-gray-400 ml-2">{student.email}</span>}
                              {student.ghlContactId && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">GHL</span>
                              )}
                            </div>
                            <button
                              onClick={() => onUnenroll(cls.id, student.id)}
                              className="text-xs text-red-500 hover:text-red-700 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
