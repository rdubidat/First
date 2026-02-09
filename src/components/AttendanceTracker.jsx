import { useState, useMemo } from 'react';
import { today, formatDisplayDate, formatTime, getClassesForDate, sortByTime, getClassColor, DAY_NAMES } from '../utils/helpers';

const STATUS_CONFIG = {
  present: { label: 'Present', color: 'bg-green-500', ring: 'ring-green-300', icon: '✓' },
  absent: { label: 'Absent', color: 'bg-red-500', ring: 'ring-red-300', icon: '✕' },
  late: { label: 'Late', color: 'bg-amber-500', ring: 'ring-amber-300', icon: '!' },
  excused: { label: 'Excused', color: 'bg-blue-500', ring: 'ring-blue-300', icon: '—' },
};

export default function AttendanceTracker({
  classes,
  students,
  attendanceRecords,
  onMarkAttendance,
  getAttendanceForClass,
  getStudentStats,
}) {
  const [selectedDate, setSelectedDate] = useState(today());
  const [selectedClass, setSelectedClass] = useState(null);
  const [quickMode, setQuickMode] = useState(false);

  const todaysClasses = useMemo(
    () => sortByTime(getClassesForDate(classes, selectedDate)),
    [classes, selectedDate]
  );

  const activeClass = selectedClass
    ? classes.find((c) => c.id === selectedClass)
    : todaysClasses[0] || null;

  const classAttendance = useMemo(() => {
    if (!activeClass) return {};
    const records = getAttendanceForClass(activeClass.id, selectedDate);
    const map = {};
    records.forEach((r) => { map[r.studentId] = r.status; });
    return map;
  }, [activeClass, selectedDate, getAttendanceForClass]);

  const enrolledStudents = useMemo(() => {
    if (!activeClass) return [];
    return students.filter((s) => activeClass.enrolledStudents.includes(s.id));
  }, [activeClass, students]);

  const attendanceSummary = useMemo(() => {
    const summary = { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 };
    enrolledStudents.forEach((s) => {
      const status = classAttendance[s.id];
      if (status) summary[status]++;
      else summary.unmarked++;
    });
    return summary;
  }, [enrolledStudents, classAttendance]);

  const handleMarkAll = (status) => {
    enrolledStudents.forEach((student) => {
      if (!classAttendance[student.id]) {
        onMarkAttendance(activeClass.id, student.id, selectedDate, status);
      }
    });
  };

  const navigateDate = (offset) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    const iso = d.toISOString().split('T')[0];
    setSelectedDate(iso);
  };

  return (
    <div className="space-y-4">
      {/* Date Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigateDate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="text-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-lg font-semibold text-gray-900 bg-transparent border-none text-center cursor-pointer focus:ring-0"
            />
            <p className="text-xs text-gray-500">{formatDisplayDate(selectedDate)} {selectedDate === today() && '(Today)'}</p>
          </div>
          <button onClick={() => navigateDate(1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        {selectedDate !== today() && (
          <button
            onClick={() => setSelectedDate(today())}
            className="mt-2 w-full text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            Jump to Today
          </button>
        )}
      </div>

      {/* Class Tabs */}
      {todaysClasses.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {todaysClasses.map((cls, idx) => {
            const color = getClassColor(cls.color ?? idx);
            const isActive = activeClass?.id === cls.id;
            return (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  isActive
                    ? `${color.bg} ${color.text} ${color.border}`
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full ${color.dot} mr-2`} />
                {cls.name}
                <span className="ml-2 text-xs opacity-70">{formatTime(cls.startTime)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* No classes message */}
      {todaysClasses.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-sm">No classes scheduled for {formatDisplayDate(selectedDate)}.</p>
          <p className="text-gray-400 text-xs mt-1">
            {DAY_NAMES[new Date(selectedDate).getDay()]} - Create classes with this day in the schedule.
          </p>
        </div>
      )}

      {/* Attendance Panel */}
      {activeClass && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Class Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{activeClass.name}</h3>
                <p className="text-sm text-gray-500">
                  {formatTime(activeClass.startTime)} - {formatTime(activeClass.endTime)}
                  {activeClass.instructor && ` | ${activeClass.instructor}`}
                  {activeClass.location && ` | ${activeClass.location}`}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={quickMode}
                  onChange={(e) => setQuickMode(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Quick Mark
              </label>
            </div>

            {/* Summary Bar */}
            <div className="flex gap-4 mt-3">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                  <span className="text-gray-600">{cfg.label}: {attendanceSummary[key]}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                <span className="text-gray-600">Unmarked: {attendanceSummary.unmarked}</span>
              </div>
            </div>

            {/* Bulk Actions */}
            {attendanceSummary.unmarked > 0 && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleMarkAll('present')}
                  className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => handleMarkAll('absent')}
                  className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                >
                  Mark All Absent
                </button>
              </div>
            )}
          </div>

          {/* Student List */}
          <div className="divide-y divide-gray-50">
            {enrolledStudents.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-400 text-sm">No students enrolled in this class.</p>
                <p className="text-gray-400 text-xs mt-1">Go to Classes tab to enroll students.</p>
              </div>
            ) : (
              enrolledStudents.map((student) => {
                const currentStatus = classAttendance[student.id] || null;
                const studentStats = getStudentStats(student.id);

                return (
                  <div key={student.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${
                        currentStatus ? STATUS_CONFIG[currentStatus].color : 'bg-gray-300'
                      }`}>
                        {currentStatus ? STATUS_CONFIG[currentStatus].icon : student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                          {studentStats.isAlert && (
                            <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700 font-medium">
                              {studentStats.daysSinceSeen === Infinity ? 'Never seen' : `${studentStats.daysSinceSeen}d absent`}
                            </span>
                          )}
                          {student.ghlContactId && (
                            <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">
                              GHL
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          Rate: {studentStats.rate}%
                          {studentStats.lastPresent && ` | Last seen: ${formatDisplayDate(studentStats.lastPresent)}`}
                        </p>
                      </div>
                    </div>

                    {/* Status Buttons */}
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
                        <button
                          key={status}
                          onClick={() => onMarkAttendance(activeClass.id, student.id, selectedDate, status)}
                          title={cfg.label}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                            currentStatus === status
                              ? `${cfg.color} text-white ring-2 ${cfg.ring}`
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {quickMode ? cfg.icon : cfg.label.charAt(0)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
