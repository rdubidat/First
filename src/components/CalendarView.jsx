import { useState, useMemo } from 'react';
import { formatDate, getCalendarDays, getClassesForDate, sortByTime, formatTime, getClassColor, DAY_SHORT, today } from '../utils/helpers';

export default function CalendarView({ classes, attendanceRecords }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const calendarDays = useMemo(() => getCalendarDays(year, month), [year, month]);

  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Build a map of date -> { classCount, attendanceCount, presentCount }
  const dateData = useMemo(() => {
    const data = {};
    calendarDays.forEach((day) => {
      if (!day) return;
      const dateStr = formatDate(day);
      const dayClasses = getClassesForDate(classes, dateStr);
      const dayRecords = attendanceRecords.filter((r) => r.date === dateStr);
      const presentCount = dayRecords.filter((r) => r.status === 'present').length;
      data[dateStr] = {
        classCount: dayClasses.length,
        totalRecords: dayRecords.length,
        presentCount,
        classes: dayClasses,
      };
    });
    return data;
  }, [calendarDays, classes, attendanceRecords]);

  const navigateMonth = (offset) => {
    let newMonth = month + offset;
    let newYear = year;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setMonth(newMonth);
    setYear(newYear);
  };

  const selectedDateData = selectedDate ? dateData[selectedDate] : null;
  const selectedClasses = selectedDateData ? sortByTime(selectedDateData.classes) : [];

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{monthName}</h2>
          <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_SHORT.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (!day) {
              return <div key={`empty-${i}`} className="h-16" />;
            }
            const dateStr = formatDate(day);
            const data = dateData[dateStr];
            const isToday = dateStr === today();
            const isSelected = dateStr === selectedDate;
            const hasClasses = data && data.classCount > 0;
            const hasAttendance = data && data.totalRecords > 0;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`h-16 rounded-lg p-1 text-left transition-all relative ${
                  isSelected
                    ? 'bg-blue-50 border-2 border-blue-400'
                    : isToday
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <span className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                  {day.getDate()}
                </span>
                {hasClasses && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap">
                    {data.classes.slice(0, 3).map((cls, idx) => {
                      const color = getClassColor(cls.color ?? idx);
                      return <div key={cls.id} className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />;
                    })}
                    {data.classCount > 3 && (
                      <span className="text-xs text-gray-400">+{data.classCount - 3}</span>
                    )}
                  </div>
                )}
                {hasAttendance && (
                  <div className="absolute bottom-1 right-1">
                    <span className={`text-xs font-medium ${
                      data.presentCount === data.totalRecords ? 'text-green-600' :
                      data.presentCount > 0 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {data.presentCount}/{data.totalRecords}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Detail */}
      {selectedDate && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>

          {selectedClasses.length === 0 ? (
            <p className="text-sm text-gray-400">No classes scheduled for this day.</p>
          ) : (
            <div className="space-y-3">
              {selectedClasses.map((cls, idx) => {
                const color = getClassColor(cls.color ?? idx);
                const dayRecords = attendanceRecords.filter((r) => r.classId === cls.id && r.date === selectedDate);
                const present = dayRecords.filter((r) => r.status === 'present').length;
                const absent = dayRecords.filter((r) => r.status === 'absent').length;
                const late = dayRecords.filter((r) => r.status === 'late').length;

                return (
                  <div key={cls.id} className={`p-3 rounded-lg border ${color.border} ${color.bg}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium ${color.text}`}>{cls.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                          {cls.instructor && ` | ${cls.instructor}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">{cls.enrolledStudents.length} enrolled</p>
                        {dayRecords.length > 0 && (
                          <p className="text-xs text-gray-500">
                            {present} present, {absent} absent{late > 0 ? `, ${late} late` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Legend</h4>
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-50 border border-blue-200" /> Today
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Class dot
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-green-600 font-medium">3/3</span> All present
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-amber-600 font-medium">2/3</span> Partial
          </span>
        </div>
      </div>
    </div>
  );
}
