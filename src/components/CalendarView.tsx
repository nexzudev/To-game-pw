import React, { useCallback, useMemo, useState } from 'react'
import { Calendar } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useGameStore, shortXP, type Priority } from '@/stores/gameStore'
import type { Task } from '@/stores/gameStore'

// Registra el plugin relativeTime (solo una vez en la app)
dayjs.extend(relativeTime)

type CalendarViewProps = {
  isOpen: boolean
  tasks: Task[]
  onClose: () => void
  skillsById: Record<string, { icon: string; name: string }>
}

export default function CalendarView({ isOpen, tasks, onClose, skillsById }: CalendarViewProps) {
  if (!isOpen) return null

  const completeTask = useGameStore(s => s.completeTask)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [skillFilter, setSkillFilter] = useState<string>('all')

  const pendingByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    tasks.filter(t => !t.completed && t.dueDate).forEach(t => {
      const key = t.dueDate as string
      const arr = map.get(key) ?? []
      arr.push(t)
      map.set(key, arr)
    })
    return map
  }, [tasks])

  const todayKey = useMemo(() => dayjs().format('YYYY-MM-DD'), [])

  const tasksForSelected = useMemo(() => {
    if (!selectedDate) return []
    const all = pendingByDate.get(selectedDate) ?? []
    return all.filter(t => skillFilter === 'all' || t.skillId === skillFilter)
  }, [pendingByDate, selectedDate, skillFilter])

  const dateFullCellRender = useCallback((value: Dayjs) => {
    const key = value.format('YYYY-MM-DD')
    const dayTasks = pendingByDate.get(key) ?? []
    const pendingCount = dayTasks.length
    const overdue = key < todayKey && pendingCount > 0
    const counts: Record<Priority, number> = { S: 0, A: 0, B: 0, C: 0 }
    dayTasks.forEach(t => counts[t.priority]++)

    const dots = Object.entries(counts).filter(([, c]) => c > 0)

    const colorFor = (p: Priority) => {
      switch (p) {
        case 'S': return 'bg-red-500 ring-1 ring-red-400/50'
        case 'A': return 'bg-orange-500 ring-1 ring-orange-400/50'
        case 'B': return 'bg-blue-500 ring-1 ring-blue-400/50'
        default: return 'bg-gray-500 ring-1 ring-gray-400/50'
      }
    }

    return (
      <div
        className={`relative h-10 w-10 flex flex-col items-center justify-center rounded-lg transition-all duration-200 ${
          overdue ? 'bg-red-900/30' : dayTasks.length > 0 ? 'bg-indigo-900/20 hover:bg-indigo-800/40' : 'hover:bg-slate-800/30'
        }`}
        title={pendingCount ? `${pendingCount} misiones pendientes` : undefined}
      >
        <div className="text-base font-medium">{value.date()}</div>

        {pendingCount > 0 && (
          <div className="flex absolute bottom-1 gap-1">
            {dots.slice(0, 3).map(([p]) => (
              <span
                key={p}
                className={`w-2 h-2 rounded-full ${colorFor(p as Priority)}`}
              />
            ))}
            {dots.length > 3 && <span className="text-[10px] text-slate-400">+{dots.length - 3}</span>}
          </div>
        )}
      </div>
    )
  }, [pendingByDate, todayKey])

  const priorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'S': return 'bg-red-600/30 text-red-200 border-red-500/50'
      case 'A': return 'bg-orange-600/30 text-orange-200 border-orange-500/50'
      case 'B': return 'bg-blue-600/30 text-blue-200 border-blue-500/50'
      default: return 'bg-gray-600/30 text-gray-200 border-gray-500/50'
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="p-6 space-y-6 w-full max-w-5xl rounded-2xl glass">
        <div className="flex flex-col gap-4 justify-between items-start sm:flex-row sm:items-center">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 md:text-3xl">
            Calendario de Misiones
          </h2>

          <div className="flex flex-wrap gap-3 items-center">
            <select
              className="px-4 py-2 text-sm rounded-lg border transition glass border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              value={skillFilter}
              onChange={e => setSkillFilter(e.target.value)}
              title="Filtrar por skill"
            >
              <option value="all">Todas las skills</option>
              {Object.entries(skillsById).map(([id, s]) => (
                <option key={id} value={id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>

            <button
              onClick={onClose}
              className="px-5 py-2 text-sm text-red-200 rounded-lg transition btn bg-red-600/30 hover:bg-red-600/50"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Calendario */}
          <div className="to-calendar-dark">
            <Calendar
              fullscreen={false}
              onSelect={(d: Dayjs) => setSelectedDate(d.format('YYYY-MM-DD'))}
              dateFullCellRender={dateFullCellRender}
              className="bg-transparent rounded-xl border shadow-glow border-white/10"
            />

            <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 ring-1 ring-red-400/50" />
                Prioridad S
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500 ring-1 ring-orange-400/50" />
                Prioridad A
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 ring-1 ring-blue-400/50" />
                Prioridad B
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-500 ring-1 ring-gray-400/50" />
                Prioridad C
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-900/30" />
                Vencidas
              </div>
            </div>
          </div>

          {/* Panel de misiones del día (corregido) */}
          <div className="glass p-5 rounded-xl border border-white/10 min-h-[300px] flex flex-col">
            <h3 className="mb-4 text-xl font-bold text-indigo-300">
              Misiones del día {selectedDate ? dayjs(selectedDate).format('DD [de] MMMM') : '—'}
            </h3>

            {(!selectedDate || tasksForSelected.length === 0) ? (
              <div className="flex flex-1 justify-center items-center text-center text-slate-400">
                {selectedDate ? 'No hay misiones para este día' : 'Selecciona un día en el calendario'}
              </div>
            ) : (
              <ul className="overflow-y-auto flex-1 pr-2 space-y-3">
                {tasksForSelected.map(t => {
                  const s = skillsById[t.skillId]
                  return (
                    <li
                      key={t.id}
                      className={`p-4 rounded-lg border bg-white/5 transition hover:bg-white/10 ${priorityBadge(t.priority)}`}
                    >
                      <div className="flex flex-col gap-3 justify-between sm:flex-row sm:items-center">
                        <div className="flex flex-1 gap-3 items-start">
                          <div className="text-2xl">{s?.icon}</div>
                          <div>
                            <div className="text-lg font-medium">{t.title}</div>
                            <div className="mt-1 text-sm text-slate-400">
                              {s?.name} • Dif. {t.difficulty} • XP {shortXP(t.xpReward)}
                              {t.dueDate && ` • ${dayjs(t.dueDate).fromNow()}`}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => completeTask(t.id)}
                          className="self-start px-5 py-2 text-sm btn-primary sm:self-center"
                        >
                          Completar
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}