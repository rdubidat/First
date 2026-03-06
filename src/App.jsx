import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'growthpilot-attendance-suite-v2';

const defaultData = {
  members: [
    {
      id: 'm-1',
      name: 'Ava Reynolds',
      status: 'active',
      joinedAt: '2025-01-15',
      tags: ['member:active', 'pipeline:converted'],
      arts: [
        { art: 'Brazilian Jiu-Jitsu', grade: 'Gray Belt', promotedOn: '2025-02-10' },
        { art: 'Kickboxing', grade: 'Level 2', promotedOn: '2025-02-02' }
      ]
    },
    {
      id: 'm-2',
      name: 'Leo Martinez',
      status: 'active',
      joinedAt: '2024-10-22',
      tags: ['member:active', 'pipeline:converted'],
      arts: [{ art: 'Karate', grade: 'Orange Belt', promotedOn: '2025-01-05' }]
    }
  ],
  classTemplates: [
    { id: 'c-1', title: 'Kids BJJ Fundamentals', art: 'Brazilian Jiu-Jitsu', startTime: '16:00' },
    { id: 'c-2', title: 'Teen Kickboxing Conditioning', art: 'Kickboxing', startTime: '17:15' },
    { id: 'c-3', title: 'Adult Karate Intermediate', art: 'Karate', startTime: '18:30' }
  ],
  attendance: {},
  automations: []
};

const todayKey = () => new Date().toISOString().split('T')[0];
const slug = (value) => value.toLowerCase().trim().replace(/\s+/g, '-');

const safeLoadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultData;
    const parsed = JSON.parse(saved);

    return {
      members: Array.isArray(parsed.members) ? parsed.members : defaultData.members,
      classTemplates: Array.isArray(parsed.classTemplates) && parsed.classTemplates.length > 0
        ? parsed.classTemplates
        : defaultData.classTemplates,
      attendance: parsed.attendance && typeof parsed.attendance === 'object' ? parsed.attendance : {},
      automations: Array.isArray(parsed.automations) ? parsed.automations : []
    };
  } catch {
    return defaultData;
  }
};

const buildAttendanceTags = (member, classTemplate, isPresent) => {
  const tags = [
    'member:attendance-tracked',
    `class:${slug(classTemplate.title)}`,
    `art:${slug(classTemplate.art)}`,
    `attendance:${isPresent ? 'present' : 'absent'}`
  ];

  member.arts.forEach((entry) => {
    tags.push(`grade:${slug(entry.art)}:${slug(entry.grade)}`);
  });

  return tags;
};

function App() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [data, setData] = useState(safeLoadState);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [selectedClassId, setSelectedClassId] = useState('');

  const [newMemberName, setNewMemberName] = useState('');
  const [newClass, setNewClass] = useState({ title: '', art: '', startTime: '' });
  const [artDrafts, setArtDrafts] = useState({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);


  const effectiveClassId = useMemo(() => {
    if (data.classTemplates.some((item) => item.id === selectedClassId)) return selectedClassId;
    return data.classTemplates[0]?.id ?? '';
  }, [data.classTemplates, selectedClassId]);

  const selectedClass = useMemo(
    () => data.classTemplates.find((template) => template.id === effectiveClassId),
    [data.classTemplates, effectiveClassId]
  );

  const attendanceForSlot = useMemo(
    () => data.attendance[selectedDate]?.[effectiveClassId] ?? {},
    [data.attendance, selectedDate, effectiveClassId]
  );

  const eligibleMembers = useMemo(() => {
    if (!selectedClass) return [];

    return data.members.filter(
      (member) =>
        member.status === 'active' &&
        member.arts.some((entry) => slug(entry.art) === slug(selectedClass.art))
    );
  }, [data.members, selectedClass]);

  const updateMemberTags = (member, tagsToAdd) => {
    const merged = new Set(member.tags ?? []);
    tagsToAdd.forEach((tag) => merged.add(tag));
    return Array.from(merged);
  };

  const markAttendance = (memberId, isPresent) => {
    setData((prev) => {
      const classTemplate = prev.classTemplates.find((entry) => entry.id === effectiveClassId);
      const member = prev.members.find((entry) => entry.id === memberId);
      if (!classTemplate || !member) return prev;

      const tagsToApply = buildAttendanceTags(member, classTemplate, isPresent);

      return {
        ...prev,
        members: prev.members.map((entry) =>
          entry.id === memberId ? { ...entry, tags: updateMemberTags(entry, tagsToApply) } : entry
        ),
        attendance: {
          ...prev.attendance,
          [selectedDate]: {
            ...(prev.attendance[selectedDate] ?? {}),
            [effectiveClassId]: {
              ...(prev.attendance[selectedDate]?.[effectiveClassId] ?? {}),
              [memberId]: {
                present: isPresent,
                markedAt: new Date().toISOString(),
                tagsApplied: tagsToApply
              }
            }
          }
        },
        automations: [
          {
            id: `a-${Date.now()}-${memberId}`,
            createdAt: new Date().toISOString(),
            memberId,
            memberName: member.name,
            trigger: isPresent ? 'attendance_marked_present' : 'attendance_marked_absent',
            payload: {
              date: selectedDate,
              classTitle: classTemplate.title,
              art: classTemplate.art,
              tags: tagsToApply
            }
          },
          ...prev.automations
        ].slice(0, 50)
      };
    });
  };

  const addMember = () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;

    setData((prev) => ({
      ...prev,
      members: [
        ...prev.members,
        {
          id: `m-${Date.now()}`,
          name: trimmed,
          status: 'active',
          joinedAt: todayKey(),
          tags: ['member:active', 'pipeline:converted'],
          arts: []
        }
      ]
    }));

    setNewMemberName('');
  };

  const addArtToMember = (memberId) => {
    const draft = artDrafts[memberId] ?? { art: '', grade: '' };
    const artName = draft.art.trim();
    const gradeName = draft.grade.trim();

    if (!artName || !gradeName) return;

    setData((prev) => ({
      ...prev,
      members: prev.members.map((member) => {
        if (member.id !== memberId) return member;

        const alreadyExists = member.arts.some(
          (entry) => slug(entry.art) === slug(artName) && slug(entry.grade) === slug(gradeName)
        );

        if (alreadyExists) return member;

        const gradeTag = `grade:${slug(artName)}:${slug(gradeName)}`;

        return {
          ...member,
          arts: [...member.arts, { art: artName, grade: gradeName, promotedOn: todayKey() }],
          tags: updateMemberTags(member, [gradeTag])
        };
      })
    }));

    setArtDrafts((prev) => ({ ...prev, [memberId]: { art: '', grade: '' } }));
  };

  const addClassTemplate = () => {
    const title = newClass.title.trim();
    const art = newClass.art.trim();

    if (!title || !art || !newClass.startTime) return;

    setData((prev) => ({
      ...prev,
      classTemplates: [...prev.classTemplates, { id: `c-${Date.now()}`, title, art, startTime: newClass.startTime }]
    }));

    setNewClass({ title: '', art: '', startTime: '' });
  };

  const clearAutomationQueue = () => {
    setData((prev) => ({ ...prev, automations: [] }));
  };

  const todaysCheckIns = Object.values(data.attendance[selectedDate] ?? {}).reduce(
    (count, session) => count + Object.values(session).filter((record) => record.present).length,
    0
  );

  const activeMembers = data.members.filter((member) => member.status === 'active');
  const attendanceRate = activeMembers.length === 0 ? 0 : Math.min(100, Math.round((todaysCheckIns / activeMembers.length) * 100));

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-cyan-500 to-lime-400 p-6 text-white shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-900/80">GrowthPilot</p>
          <h1 className="mt-2 text-3xl font-bold">Martial Arts Member Operations Hub</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-900/80">
            Attendance tracking, multi-art grade profiles, and GoHighLevel-ready automation events.
          </p>
        </header>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <StatCard label="Active Members" value={activeMembers.length} accent="text-indigo-600" />
          <StatCard label="Classes Configured" value={data.classTemplates.length} accent="text-violet-600" />
          <StatCard label="Check-ins Today" value={todaysCheckIns} accent="text-emerald-600" />
          <StatCard label="Attendance Coverage" value={`${attendanceRate}%`} accent="text-amber-600" />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {['attendance', 'members', 'automations'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                activeTab === tab ? 'bg-cyan-400 text-slate-900 shadow-[0_0_18px_rgba(34,211,238,0.55)]' : 'bg-[#0f172a] text-cyan-200 hover:bg-cyan-500/20 border border-cyan-500/30'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'attendance' && (
          <section className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-4 rounded-2xl bg-[#0f172a] border border-cyan-500/35 p-5 shadow-[0_0_24px_rgba(34,211,238,0.12)] lg:col-span-1">
              <h2 className="text-lg font-bold">Class Session Selector</h2>
              <label className="block text-sm font-medium text-slate-600">Date</label>
              <input
                className="w-full rounded-lg border border-cyan-500/40 bg-[#020617] text-cyan-100 px-3 py-2"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />

              <label className="mt-3 block text-sm font-medium text-slate-600">Class</label>
              <select
                className="w-full rounded-lg border border-cyan-500/40 bg-[#020617] text-cyan-100 px-3 py-2"
                value={effectiveClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                {data.classTemplates.map((template) => (
                  <option key={template.id} value={template.id}>{`${template.startTime} · ${template.title}`}</option>
                ))}
              </select>

              <p className="rounded-lg bg-cyan-500/10 border border-cyan-400/30 p-3 text-xs text-cyan-100">
                Pick a class, then mark members present or absent. Every mark updates tags and creates an automation payload.
              </p>
            </div>

            <div className="rounded-2xl bg-[#0f172a] border border-cyan-500/35 p-5 shadow-[0_0_24px_rgba(34,211,238,0.12)] lg:col-span-2">
              <h2 className="text-lg font-bold">Attendance Register</h2>
              <p className="mb-4 text-sm text-cyan-200/80">
                Eligible members for <strong>{selectedClass?.art ?? 'selected class'}</strong>.
              </p>

              <div className="space-y-2">
                {eligibleMembers.length === 0 && (
                  <p className="text-sm text-cyan-200/80">No active members currently assigned to this art.</p>
                )}

                {eligibleMembers.map((member) => {
                  const marked = attendanceForSlot[member.id];
                  return (
                    <div key={member.id} className="flex items-center justify-between rounded-xl border border-cyan-500/30 bg-[#020617] p-3">
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-xs text-cyan-200/80">
                          {member.arts.map((entry) => `${entry.art}: ${entry.grade}`).join(' • ') || 'No grade yet'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className={`rounded-md px-3 py-1 text-sm font-semibold ${
                            marked?.present ? 'bg-emerald-600 text-white' : 'bg-[#111827] text-cyan-200 border border-cyan-500/35'
                          }`}
                          onClick={() => markAttendance(member.id, true)}
                        >
                          Present
                        </button>
                        <button
                          className={`rounded-md px-3 py-1 text-sm font-semibold ${
                            marked && !marked.present ? 'bg-rose-600 text-white' : 'bg-[#111827] text-cyan-200 border border-cyan-500/35'
                          }`}
                          onClick={() => markAttendance(member.id, false)}
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'members' && (
          <section className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl bg-[#0f172a] border border-cyan-500/35 p-5 shadow-[0_0_24px_rgba(34,211,238,0.12)]">
              <h2 className="text-lg font-bold">Add Member</h2>
              <input
                className="mt-3 w-full rounded-lg border border-cyan-500/40 bg-[#020617] text-cyan-100 px-3 py-2"
                placeholder="Student full name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
              />
              <button className="mt-3 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-[0_0_18px_rgba(34,211,238,0.45)]" onClick={addMember}>
                Create Member
              </button>

              <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-cyan-200/80">Add Class Template</h3>
              <div className="mt-2 space-y-2">
                <input
                  className="w-full rounded-lg border border-cyan-500/40 bg-[#020617] text-cyan-100 px-3 py-2"
                  placeholder="Class title"
                  value={newClass.title}
                  onChange={(e) => setNewClass((prev) => ({ ...prev, title: e.target.value }))}
                />
                <input
                  className="w-full rounded-lg border border-cyan-500/40 bg-[#020617] text-cyan-100 px-3 py-2"
                  placeholder="Art (e.g., Muay Thai)"
                  value={newClass.art}
                  onChange={(e) => setNewClass((prev) => ({ ...prev, art: e.target.value }))}
                />
                <input
                  className="w-full rounded-lg border border-cyan-500/40 bg-[#020617] text-cyan-100 px-3 py-2"
                  type="time"
                  value={newClass.startTime}
                  onChange={(e) => setNewClass((prev) => ({ ...prev, startTime: e.target.value }))}
                />
                <button className="w-full rounded-lg bg-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_18px_rgba(217,70,239,0.45)]" onClick={addClassTemplate}>
                  Save Template
                </button>
              </div>
            </div>

            <div className="space-y-4 lg:col-span-2">
              {data.members.map((member) => {
                const draft = artDrafts[member.id] ?? { art: '', grade: '' };

                return (
                  <article key={member.id} className="rounded-2xl bg-[#0f172a] border border-cyan-500/35 p-5 shadow-[0_0_24px_rgba(34,211,238,0.12)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-lg font-bold">{member.name}</h2>
                      <span className="rounded-full bg-emerald-400/15 border border-emerald-400/40 px-3 py-1 text-xs font-semibold text-emerald-300">
                        {member.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-cyan-200/80">Joined: {member.joinedAt}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {member.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-cyan-500/10 border border-cyan-400/35 px-2 py-1 text-xs text-cyan-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 rounded-lg border border-slate-200 p-3">
                      <p className="mb-2 text-sm font-semibold">Art + Grade Profile</p>
                      {member.arts.length === 0 ? (
                        <p className="text-xs text-cyan-200/80">No art assignments yet.</p>
                      ) : (
                        member.arts.map((entry) => (
                          <p key={`${member.id}-${entry.art}-${entry.grade}`} className="text-sm text-slate-600">
                            {entry.art} — {entry.grade}{' '}
                            <span className="text-xs text-slate-400">(updated {entry.promotedOn})</span>
                          </p>
                        ))
                      )}

                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <input
                          className="rounded-lg border border-cyan-500/40 bg-[#020617] text-cyan-100 px-3 py-2 text-sm"
                          placeholder="Art"
                          value={draft.art}
                          onChange={(e) => setArtDrafts((prev) => ({ ...prev, [member.id]: { ...draft, art: e.target.value } }))}
                        />
                        <input
                          className="rounded-lg border border-cyan-500/40 bg-[#020617] text-cyan-100 px-3 py-2 text-sm"
                          placeholder="Grade"
                          value={draft.grade}
                          onChange={(e) => setArtDrafts((prev) => ({ ...prev, [member.id]: { ...draft, grade: e.target.value } }))}
                        />
                        <button
                          className="rounded-lg bg-lime-400 px-3 py-2 text-xs font-semibold text-slate-900 shadow-[0_0_16px_rgba(163,230,53,0.45)]"
                          onClick={() => addArtToMember(member.id)}
                        >
                          Add Grade
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'automations' && (
          <section className="rounded-2xl bg-[#0f172a] border border-cyan-500/35 p-5 shadow-[0_0_24px_rgba(34,211,238,0.12)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Automation Queue Preview</h2>
              <button className="rounded-lg bg-fuchsia-500/20 border border-fuchsia-400/40 px-3 py-1 text-xs font-semibold text-fuchsia-100" onClick={clearAutomationQueue}>
                Clear Queue
              </button>
            </div>
            <p className="mt-1 text-sm text-cyan-200/80">
              Use each payload in webhook-based automations to update contacts and trigger workflows in GoHighLevel.
            </p>
            <div className="mt-4 space-y-3">
              {data.automations.length === 0 && <p className="text-sm text-cyan-200/80">No automation events yet.</p>}
              {data.automations.map((event) => (
                <div key={event.id} className="rounded-xl border border-cyan-500/30 bg-[#020617] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{event.memberName}</p>
                    <p className="text-xs text-cyan-200/80">{new Date(event.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="text-sm text-slate-600">
                    Trigger: <span className="font-medium">{event.trigger}</span>
                  </p>
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-[#030712] border border-cyan-500/30 p-3 text-xs text-cyan-100">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl bg-[#0f172a] border border-cyan-500/40 p-4 shadow-[0_0_24px_rgba(34,211,238,0.15)]">
      <p className="text-sm text-cyan-200/80">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export default App;
