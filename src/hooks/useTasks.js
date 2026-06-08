import { useCallback, useEffect, useMemo, useState } from 'react'
import { load, save } from '../state/storage'

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

function isSameDay(a, b) {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

// Active tasks + the "Doghouse" archive of completed ones. Ticking a task off
// removes it from the visible list entirely (the brief) but tucks it safely
// into the archive so it can be retrieved later.
export function useTasks() {
  const [tasks, setTasks] = useState(() => load('tasks', []))
  const [archive, setArchive] = useState(() => load('archive', []))

  useEffect(() => save('tasks', tasks), [tasks])
  useEffect(() => save('archive', archive), [archive])

  const add = useCallback((text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setTasks((prev) => [
      { id: uid(), text: trimmed, createdAt: Date.now() },
      ...prev,
    ])
  }, [])

  // Delete an active task outright (the "remove" action — never archived).
  const remove = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Tick off → vanish from the list, land in the archive.
  const complete = useCallback((id) => {
    setTasks((prev) => {
      const done = prev.find((t) => t.id === id)
      if (done) {
        setArchive((a) => [{ ...done, completedAt: Date.now() }, ...a])
      }
      return prev.filter((t) => t.id !== id)
    })
  }, [])

  // Bring an archived task back to the top of the active list.
  const retrieve = useCallback((id) => {
    setArchive((prev) => {
      const found = prev.find((t) => t.id === id)
      if (found) {
        // eslint-disable-next-line no-unused-vars
        const { completedAt, ...rest } = found
        setTasks((t) => [{ ...rest }, ...t])
      }
      return prev.filter((t) => t.id !== id)
    })
  }, [])

  const removeArchived = useCallback((id) => {
    setArchive((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearArchive = useCallback(() => setArchive([]), [])

  const reorder = useCallback((from, to) => {
    setTasks((prev) => {
      if (from === to || from < 0 || to < 0) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }, [])

  const stats = useMemo(() => {
    const now = Date.now()
    const completedToday = archive.filter((t) =>
      isSameDay(t.completedAt, now)
    ).length
    return {
      active: tasks.length,
      archived: archive.length,
      completedToday,
      completedTotal: archive.length,
    }
  }, [tasks, archive])

  return {
    tasks,
    archive,
    add,
    remove,
    complete,
    retrieve,
    removeArchived,
    clearArchive,
    reorder,
    stats,
  }
}
