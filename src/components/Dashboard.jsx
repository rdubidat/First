import { useMemo } from 'react';
import { today, formatDisplayDate, daysSinceAttendance, getClassesForDate, formatTime, sortByTime, getClassColor } from '../utils/helpers';

export default function Dashboard({ classes, students, stats, noShowAlerts, attendanceRecords, getStudentStats }) {
  const todaysClasses = useMemo(
    () => sortByTime(getClassesForDate(classes, today())),
    [classes]
  );

  // Recent attendance activity (last 7 days)
  const recentActivity = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    return attendanceRecords
      .filter((r) => r.date >= weekAgoStr)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt?.localeCompare(a.createdAt || ''));
  }, [attendanceRecords]);

  // Per-day stats for last 7 days
  const weeklyStats = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayRecords = attendanceRecords.filter((r) => r.date === dateStr);
      const present = dayRecords.filter((r) => r.status === 'present').length;
      days.push({
        date: dateStr,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        total: dayRecords.length,
        present,
        rate: dayRecords.length > 0 ? Math.round((present / dayRecords.length) * 100) : 0,
      });
    }
    return days;
  }, [attendanceRecords]);

  const maxTotal = Math.max(...weeklyStats.map((d) => d.total), 1);

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Classes"
          value={stats.totalClasses}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
          color="blue"
        />
        <StatCard
          label="Total Students"
          value={stats.totalStudents}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          color="emerald"
        />
        <StatCard
          label="Present Today"
          value={stats.presentToday}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="violet"
        />
        <StatCard
          label="No-Show Alerts"
          value={stats.noShowCount}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          color="red"
          highlight={stats.noShowCount > 0}
        />
      </div>

      {/* Overall Attendance Rate */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Overall Attendance Rate</h3>
          <span className="text-2xl font-bold text-gray-900">{stats.overallRate}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              stats.overallRate >= 80 ? 'bg-green-500' : stats.overallRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${stats.overallRate}%` }}
          />
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Last 7 Days</h3>
        <div className="flex items-end gap-2 h-32">
          {weeklyStats.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500 font-medium">{day.rate}%</span>
              <div className="w-full bg-gray-100 rounded-t-md relative" style={{ height: '80px' }}>
                <div
                  className={`absolute bottom-0 w-full rounded-t-md transition-all duration-500 ${
                    day.rate >= 80 ? 'bg-green-400' : day.rate >= 60 ? 'bg-amber-400' : day.total > 0 ? 'bg-red-400' : 'bg-gray-200'
                  }`}
                  style={{ height: `${day.total > 0 ? Math.max((day.total / maxTotal) * 100, 10) : 0}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Schedule */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Today's Schedule</h3>
          {todaysClasses.length === 0 ? (
            <p className="text-sm text-gray-400">No classes scheduled today.</p>
          ) : (
            <div className="space-y-2">
              {todaysClasses.map((cls, idx) => {
                const color = getClassColor(cls.color ?? idx);
                return (
                  <div key={cls.id} className={`flex items-center gap-3 p-3 rounded-lg ${color.bg}`}>
                    <div className={`w-2 h-8 rounded-full ${color.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${color.text}`}>{cls.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatTime(cls.startTime)} - {formatTime(cls.endTime)} | {cls.enrolledStudents.length} students
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* No-Show Alerts */}
        <div className={`bg-white rounded-xl border p-5 ${noShowAlerts.length > 0 ? 'border-red-200' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            {noShowAlerts.length > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
            <h3 className="font-semibold text-gray-900">5-Day No-Show Alerts</h3>
          </div>

          {noShowAlerts.length === 0 ? (
            <div className="text-center py-4">
              <svg className="w-8 h-8 mx-auto text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-400">All students are attending regularly.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {noShowAlerts.map((alert) => (
                <div key={alert.student.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-red-800 truncate">{alert.student.name}</p>
                    <p className="text-xs text-red-600">
                      {alert.lastSeen
                        ? `Last seen ${formatDisplayDate(alert.lastSeen)} (${alert.daysMissing} days ago)`
                        : 'Never attended'}
                    </p>
                    {alert.student.email && (
                      <p className="text-xs text-red-500 mt-0.5">{alert.student.email}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-700 font-bold text-sm">
                      {alert.daysMissing === Infinity ? '!' : `${alert.daysMissing}d`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, highlight }) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'text-violet-500' },
    red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-500' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-red-300 bg-red-50 animate-pulse-slow' : `border-gray-200 bg-white`}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`${highlight ? 'text-red-500' : c.icon}`}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${highlight ? 'text-red-700' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
