import { useState, useMemo } from 'react';
import { isConfigured, searchContacts } from '../utils/ghlApi';
import { formatDisplayDate } from '../utils/helpers';

export default function StudentManager({ students, classes, onAddStudent, onUpdateStudent, onRemoveStudent, onImportGHL, getStudentStats }) {
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ghlImporting, setGhlImporting] = useState(false);
  const [ghlContacts, setGhlContacts] = useState([]);
  const [ghlSearching, setGhlSearching] = useState(false);
  const [ghlError, setGhlError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [filterAlert, setFilterAlert] = useState(false);

  const filteredStudents = useMemo(() => {
    let result = students;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.phone.includes(q)
      );
    }
    if (filterAlert) {
      result = result.filter((s) => {
        const stats = getStudentStats(s.id);
        return stats.isAlert;
      });
    }
    return result;
  }, [students, searchQuery, filterAlert, getStudentStats]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingStudent) {
      onUpdateStudent(editingStudent.id, form);
      setEditingStudent(null);
    } else {
      onAddStudent(form);
    }
    setForm({ name: '', email: '', phone: '', notes: '' });
    setShowForm(false);
  };

  const handleEdit = (student) => {
    setForm({ name: student.name, email: student.email, phone: student.phone, notes: student.notes || '' });
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleRemove = (student) => {
    if (window.confirm(`Remove "${student.name}"? This won't delete their GHL contact.`)) {
      onRemoveStudent(student.id);
    }
  };

  const handleGHLSearch = async () => {
    if (!isConfigured()) {
      setGhlError('GoHighLevel not connected. Go to Settings to connect.');
      return;
    }
    setGhlSearching(true);
    setGhlError('');
    try {
      const data = await searchContacts(searchQuery);
      setGhlContacts(data.contacts || []);
      setGhlImporting(true);
    } catch (err) {
      setGhlError(err.message);
    } finally {
      setGhlSearching(false);
    }
  };

  const handleImportSelected = (contacts) => {
    const count = onImportGHL(contacts);
    setGhlImporting(false);
    setGhlContacts([]);
    if (count > 0) {
      alert(`Imported ${count} new contact(s) from GoHighLevel.`);
    } else {
      alert('No new contacts to import (all already exist).');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Students / Contacts</h2>
        <div className="flex gap-2">
          {isConfigured() && (
            <button
              onClick={handleGHLSearch}
              disabled={ghlSearching}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              {ghlSearching ? 'Searching...' : 'Import from GHL'}
            </button>
          )}
          <button
            onClick={() => { setShowForm(!showForm); setEditingStudent(null); setForm({ name: '', email: '', phone: '', notes: '' }); }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Student
          </button>
        </div>
      </div>

      {ghlError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{ghlError}</div>
      )}

      {/* GHL Import Modal */}
      {ghlImporting && ghlContacts.length > 0 && (
        <div className="bg-white rounded-xl border border-green-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">GoHighLevel Contacts ({ghlContacts.length})</h3>
          <div className="max-h-60 overflow-y-auto space-y-1 mb-3">
            {ghlContacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-800">{contact.firstName} {contact.lastName}</p>
                  <p className="text-xs text-gray-400">{contact.email} {contact.phone && `| ${contact.phone}`}</p>
                </div>
                {students.some((s) => s.ghlContactId === contact.id) && (
                  <span className="text-xs text-green-600">Already imported</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleImportSelected(ghlContacts)}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Import All New
            </button>
            <button
              onClick={() => { setGhlImporting(false); setGhlContacts([]); }}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                {editingStudent ? 'Update' : 'Add Student'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingStudent(null); }} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => setFilterAlert(!filterAlert)}
          className={`px-4 py-2 text-sm rounded-lg border transition-colors flex items-center gap-2 ${
            filterAlert
              ? 'bg-red-50 border-red-300 text-red-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          No-Shows Only
        </button>
      </div>

      {/* Student List */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <p className="text-gray-500 text-sm">
            {students.length === 0 ? 'No students added yet.' : 'No students match your search.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-50">
          {filteredStudents.map((student) => {
            const stats = getStudentStats(student.id);
            const enrolledClassNames = student.enrolledClasses
              .map((cid) => classes.find((c) => c.id === cid)?.name)
              .filter(Boolean);

            return (
              <div key={student.id} className={`px-4 py-3 hover:bg-gray-50 transition-colors ${stats.isAlert ? 'bg-red-50/50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
                      stats.isAlert ? 'bg-red-500' : 'bg-gray-400'
                    }`}>
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">{student.name}</p>
                        {student.ghlContactId && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700 font-medium">GHL Linked</span>
                        )}
                        {stats.isAlert && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700 font-medium animate-pulse">
                            {stats.daysSinceSeen === Infinity ? 'Never Attended' : `${stats.daysSinceSeen} Days Absent`}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {student.email && <span>{student.email}</span>}
                        {student.email && student.phone && <span> | </span>}
                        {student.phone && <span>{student.phone}</span>}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                        <span>Attendance: <span className="font-medium text-gray-700">{stats.rate}%</span> ({stats.present}/{stats.total})</span>
                        {stats.lastPresent && <span>Last Seen: {formatDisplayDate(stats.lastPresent)}</span>}
                        {enrolledClassNames.length > 0 && (
                          <span>Classes: {enrolledClassNames.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                      onClick={() => handleEdit(student)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button
                      onClick={() => handleRemove(student)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
