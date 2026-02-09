import { useState, useEffect } from 'react';
import useAttendanceStore from './hooks/useAttendanceStore';
import Dashboard from './components/Dashboard';
import ClassManager from './components/ClassManager';
import AttendanceTracker from './components/AttendanceTracker';
import StudentManager from './components/StudentManager';
import CalendarView from './components/CalendarView';
import GHLSetup from './components/GHLSetup';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'attendance', label: 'Attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { id: 'classes', label: 'Classes', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { id: 'students', label: 'Students', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

function App() {
  const store = useAttendanceStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check if embedded in iframe (GHL dashboard)
  const [isEmbedded, setIsEmbedded] = useState(false);
  useEffect(() => {
    try {
      setIsEmbedded(window.self !== window.top);
    } catch {
      setIsEmbedded(true);
    }
  }, []);

  // Handle URL hash for deep linking from GHL
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && TABS.some((t) => t.id === hash)) {
      setActiveTab(hash);
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            classes={store.classes}
            students={store.students}
            stats={store.stats}
            noShowAlerts={store.noShowAlerts}
            attendanceRecords={store.attendanceRecords}
            getStudentStats={store.getStudentStats}
          />
        );
      case 'attendance':
        return (
          <AttendanceTracker
            classes={store.classes}
            students={store.students}
            attendanceRecords={store.attendanceRecords}
            onMarkAttendance={store.markAttendance}
            getAttendanceForClass={store.getAttendanceForClass}
            getStudentStats={store.getStudentStats}
          />
        );
      case 'classes':
        return (
          <ClassManager
            classes={store.classes}
            students={store.students}
            onAddClass={store.addClass}
            onUpdateClass={store.updateClass}
            onDeleteClass={store.deleteClass}
            onEnroll={store.enrollStudent}
            onUnenroll={store.unenrollStudent}
          />
        );
      case 'students':
        return (
          <StudentManager
            students={store.students}
            classes={store.classes}
            onAddStudent={store.addStudent}
            onUpdateStudent={store.updateStudent}
            onRemoveStudent={store.removeStudent}
            onImportGHL={store.importGHLContacts}
            getStudentStats={store.getStudentStats}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            classes={store.classes}
            attendanceRecords={store.attendanceRecords}
          />
        );
      case 'settings':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">GoHighLevel Integration</h2>
            <GHLSetup />
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Embedding Instructions</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>To embed this attendance tracker in your GoHighLevel dashboard:</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>
                    <strong>Deploy the app</strong> to Netlify, Vercel, or any hosting provider.
                  </li>
                  <li>
                    <strong>In GoHighLevel</strong>, navigate to <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Settings &gt; Custom Menu Links</code>.
                  </li>
                  <li>
                    <strong>Add a new link</strong> with:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-gray-500">
                      <li>Name: "Attendance Tracker"</li>
                      <li>URL: Your deployed app URL</li>
                      <li>Icon: Calendar or Clipboard icon</li>
                      <li>Open in: iframe (embedded)</li>
                    </ul>
                  </li>
                  <li>
                    The app will appear in your <strong>GHL sidebar</strong> and load embedded in the dashboard.
                  </li>
                </ol>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-700">
                    <strong>Tip:</strong> When embedded in GHL, the app automatically detects the iframe context
                    and adjusts its layout for a seamless dashboard experience.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Data Management</h3>
              <p className="text-sm text-gray-500 mb-3">
                Data is stored locally in your browser. Connect to GoHighLevel to sync contacts and calendar events.
              </p>
              <button
                onClick={() => {
                  if (window.confirm('Export all attendance data as JSON?')) {
                    const data = {
                      classes: store.classes,
                      students: store.students,
                      attendanceRecords: store.attendanceRecords,
                      exportedAt: new Date().toISOString(),
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `attendance-export-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                }}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Export Data (JSON)
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex ${isEmbedded ? 'ghl-embedded' : ''}`}>
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-56'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200 flex-shrink-0 ${isEmbedded ? 'sticky top-0 h-screen' : 'fixed h-screen'} z-20`}>
        {/* Logo */}
        <div className={`p-4 border-b border-gray-100 flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 truncate">Attendance</h1>
              <p className="text-xs text-gray-400 truncate">GHL Tracker</p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const showBadge = tab.id === 'dashboard' && store.stats.noShowCount > 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? tab.label : undefined}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {!sidebarCollapsed && <span>{tab.label}</span>}
                {showBadge && (
                  <span className={`${sidebarCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full`}>
                    {store.stats.noShowCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-2 border-t border-gray-100">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${isEmbedded ? '' : (sidebarCollapsed ? 'ml-16' : 'ml-56')} transition-all duration-200`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {store.stats.noShowCount > 0 && (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 hover:bg-red-100 transition-colors"
                >
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  {store.stats.noShowCount} No-Show Alert{store.stats.noShowCount !== 1 ? 's' : ''}
                </button>
              )}
              <span className="text-xs text-gray-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 max-w-6xl">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
