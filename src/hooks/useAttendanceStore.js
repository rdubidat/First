import { useState, useEffect, useCallback, useMemo } from 'react';
import { generateId, today, isNoShowAlert, daysSinceAttendance, attendanceRate } from '../utils/helpers';

const STORAGE_KEYS = {
  CLASSES: 'ghl_att_classes',
  STUDENTS: 'ghl_att_students',
  ATTENDANCE: 'ghl_att_records',
};

function loadFromStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export default function useAttendanceStore() {
  // ===== STATE =====
  const [classes, setClasses] = useState(() => loadFromStorage(STORAGE_KEYS.CLASSES, []));
  const [students, setStudents] = useState(() => loadFromStorage(STORAGE_KEYS.STUDENTS, []));
  const [attendanceRecords, setAttendanceRecords] = useState(() => loadFromStorage(STORAGE_KEYS.ATTENDANCE, []));

  // Persist on change
  useEffect(() => { saveToStorage(STORAGE_KEYS.CLASSES, classes); }, [classes]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.STUDENTS, students); }, [students]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.ATTENDANCE, attendanceRecords); }, [attendanceRecords]);

  // ===== CLASS MANAGEMENT =====
  const addClass = useCallback((classData) => {
    const newClass = {
      id: generateId(),
      name: classData.name,
      description: classData.description || '',
      instructor: classData.instructor || '',
      location: classData.location || '',
      startTime: classData.startTime || '09:00',
      endTime: classData.endTime || '10:00',
      scheduleDays: classData.scheduleDays || [],
      maxCapacity: classData.maxCapacity || 30,
      color: classData.color || 0,
      enrolledStudents: [],
      ghlCalendarId: classData.ghlCalendarId || null,
      createdAt: new Date().toISOString(),
    };
    setClasses((prev) => [...prev, newClass]);
    return newClass;
  }, []);

  const updateClass = useCallback((classId, updates) => {
    setClasses((prev) =>
      prev.map((cls) => (cls.id === classId ? { ...cls, ...updates } : cls))
    );
  }, []);

  const deleteClass = useCallback((classId) => {
    setClasses((prev) => prev.filter((cls) => cls.id !== classId));
    setAttendanceRecords((prev) => prev.filter((r) => r.classId !== classId));
  }, []);

  // ===== STUDENT / CONTACT MANAGEMENT =====
  const addStudent = useCallback((studentData) => {
    const newStudent = {
      id: generateId(),
      name: studentData.name,
      email: studentData.email || '',
      phone: studentData.phone || '',
      ghlContactId: studentData.ghlContactId || null,
      tags: studentData.tags || [],
      enrolledClasses: [],
      notes: studentData.notes || '',
      createdAt: new Date().toISOString(),
    };
    setStudents((prev) => [...prev, newStudent]);
    return newStudent;
  }, []);

  const updateStudent = useCallback((studentId, updates) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, ...updates } : s))
    );
  }, []);

  const removeStudent = useCallback((studentId) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setClasses((prev) =>
      prev.map((cls) => ({
        ...cls,
        enrolledStudents: cls.enrolledStudents.filter((id) => id !== studentId),
      }))
    );
  }, []);

  // Import contacts from GHL data
  const importGHLContacts = useCallback((contacts) => {
    const newStudents = contacts
      .filter((c) => !students.some((s) => s.ghlContactId === c.id))
      .map((contact) => ({
        id: generateId(),
        name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email || 'Unknown',
        email: contact.email || '',
        phone: contact.phone || '',
        ghlContactId: contact.id,
        tags: contact.tags || [],
        enrolledClasses: [],
        notes: '',
        createdAt: new Date().toISOString(),
      }));
    if (newStudents.length > 0) {
      setStudents((prev) => [...prev, ...newStudents]);
    }
    return newStudents.length;
  }, [students]);

  // ===== ENROLLMENT =====
  const enrollStudent = useCallback((classId, studentId) => {
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id === classId && !cls.enrolledStudents.includes(studentId)) {
          return { ...cls, enrolledStudents: [...cls.enrolledStudents, studentId] };
        }
        return cls;
      })
    );
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId && !s.enrolledClasses.includes(classId)) {
          return { ...s, enrolledClasses: [...s.enrolledClasses, classId] };
        }
        return s;
      })
    );
  }, []);

  const unenrollStudent = useCallback((classId, studentId) => {
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id === classId) {
          return { ...cls, enrolledStudents: cls.enrolledStudents.filter((id) => id !== studentId) };
        }
        return cls;
      })
    );
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return { ...s, enrolledClasses: s.enrolledClasses.filter((id) => id !== classId) };
        }
        return s;
      })
    );
  }, []);

  // ===== ATTENDANCE RECORDS =====
  const markAttendance = useCallback((classId, studentId, date, status = 'present') => {
    setAttendanceRecords((prev) => {
      const existing = prev.findIndex(
        (r) => r.classId === classId && r.studentId === studentId && r.date === date
      );
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], status, updatedAt: new Date().toISOString() };
        return updated;
      }
      return [
        ...prev,
        {
          id: generateId(),
          classId,
          studentId,
          date,
          status, // 'present', 'absent', 'late', 'excused'
          createdAt: new Date().toISOString(),
        },
      ];
    });
  }, []);

  const getAttendanceForClass = useCallback(
    (classId, date) => {
      return attendanceRecords.filter((r) => r.classId === classId && r.date === date);
    },
    [attendanceRecords]
  );

  const getAttendanceForStudent = useCallback(
    (studentId) => {
      return attendanceRecords.filter((r) => r.studentId === studentId);
    },
    [attendanceRecords]
  );

  // ===== COMPUTED: NO-SHOW ALERTS (5-day rule) =====
  const noShowAlerts = useMemo(() => {
    const alerts = [];
    students.forEach((student) => {
      if (student.enrolledClasses.length === 0) return;

      const studentRecords = attendanceRecords.filter(
        (r) => r.studentId === student.id && r.status === 'present'
      );
      const lastPresent = studentRecords.length > 0
        ? studentRecords.sort((a, b) => b.date.localeCompare(a.date))[0].date
        : null;

      if (isNoShowAlert(lastPresent)) {
        alerts.push({
          student,
          lastSeen: lastPresent,
          daysMissing: daysSinceAttendance(lastPresent),
          enrolledClasses: student.enrolledClasses
            .map((cid) => classes.find((c) => c.id === cid))
            .filter(Boolean),
        });
      }
    });
    return alerts.sort((a, b) => b.daysMissing - a.daysMissing);
  }, [students, attendanceRecords, classes]);

  // ===== COMPUTED: STATS =====
  const stats = useMemo(() => {
    const todayStr = today();
    const todayRecords = attendanceRecords.filter((r) => r.date === todayStr);
    const presentToday = todayRecords.filter((r) => r.status === 'present').length;
    const totalEnrolled = classes.reduce((sum, cls) => sum + cls.enrolledStudents.length, 0);
    const totalRecords = attendanceRecords.length;
    const totalPresent = attendanceRecords.filter((r) => r.status === 'present').length;

    return {
      totalClasses: classes.length,
      totalStudents: students.length,
      presentToday,
      todayRecords: todayRecords.length,
      overallRate: attendanceRate(totalPresent, totalRecords),
      totalEnrolled,
      noShowCount: noShowAlerts.length,
    };
  }, [classes, students, attendanceRecords, noShowAlerts]);

  // ===== STUDENT ATTENDANCE STATS =====
  const getStudentStats = useCallback(
    (studentId) => {
      const records = attendanceRecords.filter((r) => r.studentId === studentId);
      const present = records.filter((r) => r.status === 'present').length;
      const absent = records.filter((r) => r.status === 'absent').length;
      const late = records.filter((r) => r.status === 'late').length;
      const excused = records.filter((r) => r.status === 'excused').length;
      const lastPresent = records
        .filter((r) => r.status === 'present')
        .sort((a, b) => b.date.localeCompare(a.date))[0]?.date || null;

      return {
        total: records.length,
        present,
        absent,
        late,
        excused,
        rate: attendanceRate(present, records.length),
        lastPresent,
        daysSinceSeen: daysSinceAttendance(lastPresent),
        isAlert: isNoShowAlert(lastPresent),
      };
    },
    [attendanceRecords]
  );

  return {
    // Data
    classes,
    students,
    attendanceRecords,
    noShowAlerts,
    stats,
    // Class actions
    addClass,
    updateClass,
    deleteClass,
    // Student actions
    addStudent,
    updateStudent,
    removeStudent,
    importGHLContacts,
    // Enrollment
    enrollStudent,
    unenrollStudent,
    // Attendance
    markAttendance,
    getAttendanceForClass,
    getAttendanceForStudent,
    getStudentStats,
  };
}
