import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'growthpilot-attendance-suite-v1';

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
      tags: ['member:active', 'tag:high-frequency'],
      arts: [{ art: 'Karate', grade: 'Orange Belt', promotedOn: '2025-01-05' }]
    },
    {
      id: 'm-3',
      name: 'Sofia Chen',
      status: 'lead',
      joinedAt: '2026-01-09',
      tags: ['pipeline:trial'],
      arts: [{ art: 'Taekwondo', grade: 'White Belt', promotedOn: '2026-01-09' }]
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

const buildTagsFromAttendance = ({ member, classTemplate, isPresent }) => {
  const base = [
    'member:attendance-tracked',
    `class:${classTemplate.title.toLowerCase().replace(/\s+/g, '-')}`,
    `art:${classTemplate.art.toLowerCase().replace(/\s+/g, '-')}`,
    `attendance:${isPresent ? 'present' : 'absent'}`
  ];

  const gradeTags = member.arts.map((entry) => `grade:${entry.art.toLowerCase().replace(/\s+/g, '-')}:${entry.grade.toLowerCase().replace(/\s+/g, '-')}`);

  return [...base, ...gradeTags];
};

function App() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultData;
  });
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [selectedClassId, setSelectedClassId] = useState(defaultData.classTemplates[0].id);
  const [newMemberName, setNewMemberName] = useState('');
  const [newArt, setNewArt] = useState('');
  const [newClass, setNewClass] = useState({ title: '', art: '', startTime: '' });


  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const selectedClass = useMemo(
    () => data.classTemplates.find((template) => template.id === selectedClassId) ?? data.classTemplates[0],
    [data.classTemplates, selectedClassId]
  );

  const attendanceForSlot = data.attendance[selectedDate]?.[selectedClass?.id] ?? {};

  const eligibleMembers = useMemo(() => {
    if (!selectedClass) return [];
    return data.members.filter((member) => member.status === 'active' && member.arts.some((entry) => entry.art === selectedClass.art));
  }, [data.members, selectedClass]);

  const markAttendance = (memberId, isPresent) => {
    const member = data.members.find((entry) => entry.id === memberId);
    if (!member || !selectedClass) return;

    const tagsToApply = buildTagsFromAttendance({ member, classTemplate: selectedClass, isPresent });

    setData((prev) => {
      const existingTags = new Set(member.tags);
      tagsToApply.forEach((tag) => existingTags.add(tag));

      return {
        ...prev,
        members: prev.members.map((entry) =>
          entry.id === memberId ? { ...entry, tags: Array.from(existingTags) } : entry
        ),
        attendance: {
          ...prev.attendance,
          [selectedDate]: {
            ...(prev.attendance[selectedDate] ?? {}),
            [selectedClass.id]: {
              ...(prev.attendance[selectedDate]?.[selectedClass.id] ?? {}),
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
            id: `a-${Date.now()}`,
            createdAt: new Date().toISOString(),
            memberId,
            memberName: member.name,
            trigger: isPresent ? 'attendance_marked_present' : 'attendance_marked_absent',
            payload: {
              date: selectedDate,
              classTitle: selectedClass.title,
              art: selectedClass.art,
              tags: tagsToApply
            }
          },
          ...prev.automations
        ].slice(0, 25)
      };
    });
  };

  const addMember = () => {
    if (!newMemberName.trim()) return;

    setData((prev) => ({
      ...prev,
      members: [
        ...prev.members,
        {
          id: `m-${Date.now()}`,
          name: newMemberName.trim(),
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
    if (!newArt.trim()) return;
    const [artName, gradeName] = newArt.split('|').map((value) => value.trim());
    if (!artName || !gradeName) return;

    setData((prev) => ({
      ...prev,
      members: prev.members.map((member) =>
        member.id !== memberId
          ? member
          : {
              ...member,
              arts: [...member.arts, { art: artName, grade: gradeName, promotedOn: todayKey() }],
              tags: [...new Set([...member.tags, `grade:${artName.toLowerCase().replace(/\s+/g, '-')}:${gradeName.toLowerCase().replace(/\s+/g, '-')}`])]
            }
      )
    }));

    setNewArt('');
  };

  const addClassTemplate = () => {
    if (!newClass.title.trim() || !newClass.art.trim() || !newClass.startTime) return;

    setData((prev) => ({
      ...prev,
      classTemplates: [...prev.classTemplates, { ...newClass, id: `c-${Date.now()}` }]
    }));

    setNewClass({ title: '', art: '', startTime: '' });
  };

  const todaysCheckIns = Object.values(data.attendance[selectedDate] ?? {}).reduce(
    (count, session) => count + Object.values(session).filter((record) => record.present).length,
    0
  );

  const totalTrackedMembers = data.members.filter((m) => m.status === 'active').length;
  const attendanceRate = totalTrackedMembers === 0 ? 0 : Math.round((todaysCheckIns / totalTrackedMembers) * 100);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-700 to-violet-600 p-6 text-white shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-100">GrowthPilot</p>
          <h1 className="mt-2 text-3xl font-bold">Martial Arts Member Operations Hub</h1>
          <p className="mt-2 max-w-3xl text-sm text-indigo-100">
            Plug-and-play attendance + grade tracking designed for GoHighLevel white-label users. Every attendance action stamps tags and creates an automation event payload.
          </p>
        </header>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <StatCard label="Active Members" value={totalTrackedMembers} accent="text-indigo-600" />
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
                activeTab === tab ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'attendance' && (
          <section className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm lg:col-span-1">
              <h2 className="text-lg font-bold">Class Session Selector</h2>
              <label className="block text-sm font-medium text-slate-600">Date</label>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />

              <label className="mt-3 block text-sm font-medium text-slate-600">Class</label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                {data.classTemplates.map((template) => (
                  <option key={template.id} value={template.id}>{`${template.startTime} · ${template.title}`}</option>
                ))}
              </select>

              <p className="rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
                Admin workflow: pick date + class and quickly tick present/absent. Data writes to local storage and is shaped for easy forwarding to GoHighLevel workflows/webhooks.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-bold">Attendance Register</h2>
              <p className="mb-4 text-sm text-slate-500">Eligible members for {selectedClass?.art}. Each toggle updates tags and queues an automation event.</p>
              <div className="space-y-2">
                {eligibleMembers.length === 0 && <p className="text-sm text-slate-500">No active members currently assigned to this art.</p>}
                {eligibleMembers.map((member) => {
                  const marked = attendanceForSlot[member.id];
                  return (
                    <div key={member.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.arts.map((entry) => `${entry.art}: ${entry.grade}`).join(' • ')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className={`rounded-md px-3 py-1 text-sm font-semibold ${marked?.present ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                          onClick={() => markAttendance(member.id, true)}
                        >
                          Present
                        </button>
                        <button
                          className={`rounded-md px-3 py-1 text-sm font-semibold ${marked && !marked.present ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}
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
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">Add Member</h2>
              <input
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Student full name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
              />
              <button className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={addMember}>Create Member</button>

              <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Add Class Template</h3>
              <div className="mt-2 space-y-2">
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Class title" value={newClass.title} onChange={(e) => setNewClass((prev) => ({ ...prev, title: e.target.value }))} />
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Art (e.g., Muay Thai)" value={newClass.art} onChange={(e) => setNewClass((prev) => ({ ...prev, art: e.target.value }))} />
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2" type="time" value={newClass.startTime} onChange={(e) => setNewClass((prev) => ({ ...prev, startTime: e.target.value }))} />
                <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" onClick={addClassTemplate}>Save Template</button>
              </div>
            </div>

            <div className="space-y-4 lg:col-span-2">
              {data.members.map((member) => (
                <article key={member.id} className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-bold">{member.name}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${member.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{member.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Joined: {member.joinedAt}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {member.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{tag}</span>
                    ))}
                  </div>
                  <div className="mt-4 rounded-lg border border-slate-200 p-3">
                    <p className="mb-2 text-sm font-semibold">Art + Grade Profile</p>
                    {member.arts.length === 0 ? <p className="text-xs text-slate-500">No art assignments yet.</p> : member.arts.map((entry) => (
                      <p key={`${member.id}-${entry.art}-${entry.grade}`} className="text-sm text-slate-600">{entry.art} — {entry.grade} <span className="text-xs text-slate-400">(updated {entry.promotedOn})</span></p>
                    ))}
                    <div className="mt-2 flex gap-2">
                      <input
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Art | Grade (e.g. Judo | Yellow Belt)"
                        value={newArt}
                        onChange={(e) => setNewArt(e.target.value)}
                      />
                      <button className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white" onClick={() => addArtToMember(member.id)}>Add</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'automations' && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Automation Queue Preview (GoHighLevel-ready)</h2>
            <p className="mt-1 text-sm text-slate-500">Use this payload shape in a webhook action, Zapier step, or Make scenario to update contact tags and trigger nurture/re-engagement workflows.</p>
            <div className="mt-4 space-y-3">
              {data.automations.length === 0 && <p className="text-sm text-slate-500">No automation events yet. Mark attendance first.</p>}
              {data.automations.map((event) => (
                <div key={event.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{event.memberName}</p>
                    <p className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="text-sm text-slate-600">Trigger: <span className="font-medium">{event.trigger}</span></p>
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(event.payload, null, 2)}</pre>
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
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export default App;
