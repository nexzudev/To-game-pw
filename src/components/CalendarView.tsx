import React, { useCallback, useMemo, useState } from 'react'
import { Calendar } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { Task } from '@/stores/gameStore'
import { shortXP, useGameStore } from '@/stores/gameStore'

type Props = {
  isOpen: boolean
  tasks: Task[]
  onClose: () => void
  skillsById: Record<string, { icon: string; name: string }>
}

export default function CalendarView({ isOpen, tasks, onClose, skillsById }: Props) {
  if (!isOpen) return null
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [skillFilter, setSkillFilter] = useState<string>('all')
  const completeTask = useGameStore(s => s.completeTask)

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

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const tasksForSelected = useMemo(() => {
    if (!selectedDate) return []
    const all = pendingByDate.get(selectedDate) ?? []
    return all.filter(t => skillFilter === 'all' ? true : t.skillId === skillFilter)
  }, [pendingByDate, selectedDate, skillFilter])

  const dateFullCellRender = useCallback((value: Dayjs) => {
    const key = value.toDate().toISOString().slice(0, 10)
    const dayTasks = pendingByDate.get(key) ?? []
    const overdue = key < todayKey && dayTasks.some(t => !t.completed)
    const counts: Record<'S'|'A'|'B'|'C', number> = { S:0,A:0,B:0,C:0 }
    dayTasks.forEach(t => { counts[t.priority]++ })
    const dots = (Object.entries(counts) as Array<[keyof typeof counts, number]>).filter(([,c]) => c>0)
    const colorFor = (p: 'S'|'A'|'B'|'C') => p==='S' ? 'bg-[#ef4444]' : p==='A' ? 'bg-[#f59e0b]' : p==='B' ? 'bg-[#3b82f6]' : 'bg-[#6b7280]'
    return (
      <div className={`rounded-md px-1 py-0.5 ${overdue ? 'bg-red-500/20' : ''}`} title={dayTasks.length ? `${dayTasks.length} misiones pendientes` : undefined}>
        <div className="text-center">{value.date()}</div>
        {dayTasks.length > 0 && (
          <div className="mt-0.5 flex items-center justify-center gap-0.5">
            {dots.slice(0,3).map(([p]) => (
              <span key={p} className={`h-1.5 w-1.5 rounded-full ${colorFor(p)}`} />
            ))}
          </div>
        )}
      </div>
    )
  }, [pendingByDate, todayKey])

  const tileContent = useCallback(({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null
    const key = date.toISOString().slice(0, 10)
    const dayTasks = pendingByDate.get(key) ?? []
    if (!dayTasks.length) return null
    const count = dayTasks.length
    const counts: Record<'S'|'A'|'B'|'C', number> = { S:0,A:0,B:0,C:0 }
    dayTasks.forEach(t => { counts[t.priority]++ })
    const dots = (Object.entries(counts) as Array<[keyof typeof counts, number]>).filter(([,c]) => c>0)
    const colorFor = (p: 'S'|'A'|'B'|'C') => p==='S' ? 'bg-[#ef4444]' : p==='A' ? 'bg-[#f59e0b]' : p==='B' ? 'bg-[#3b82f6]' : 'bg-[#6b7280]'
    return (
      <div className="mt-1 flex items-center justify-center gap-0.5" title={`${count} misiones pendientes`}>
        {dots.slice(0,3).map(([p]) => (
          <span key={p} className={`h-1.5 w-1.5 rounded-full ${colorFor(p)} shadow-[0_0_6px_rgba(124,58,237,0.6)]`} />
        ))}
      </div>
    )
  }, [pendingByDate])

  return (
    <div className="modal-backdrop">
      <div className="glass w-full max-w-5xl p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-2xl font-bold">Calendario</h2>
          <div className="flex items-center gap-2">
            <select
              className="rounded-md bg-white/10 border border-white/10 px-3 py-2 text-slate-200"
              value={skillFilter}
              onChange={e => setSkillFilter(e.target.value)}
              title="Filtrar por skill"
            >
              <option value="all">Todas las skills</option>
              {Object.entries(skillsById).map(([id, s]) => (
                <option key={id} value={id}>{s.icon} {s.name}</option>
              ))}
            </select>
            <button onClick={onClose} className="btn bg-white/10 hover:bg-white/20 text-slate-200">Cerrar</button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Calendar
              fullscreen={false}
              onSelect={(d: Dayjs) => setSelectedDate(d.toDate().toISOString().slice(0,10))}
              dateFullCellRender={dateFullCellRender}
              headerRender={({ value, onChange }) => {
                const year = value.year()
                const month = value.month()
                const prev = () => onChange(dayjs(value).month(month - 1))
                const next = () => onChange(dayjs(value).month(month + 1))
                return (
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-slate-300">{value.format('MMMM YYYY')}</div>
                    <div className="flex items-center gap-2">
                      <button className="btn bg-white/10 hover:bg-white/20" onClick={prev}>Mes -</button>
                      <button className="btn bg-white/10 hover:bg-white/20" onClick={next}>Mes +</button>
                    </div>
                  </div>
                )
              }}
            />
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ef4444]" /> Prioridad S</div>
              <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Prioridad A</div>
              <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#3b82f6]" /> Prioridad B</div>
              <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#6b7280]" /> Prioridad C</div>
            </div>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Misiones del día {selectedDate ?? '—'}</h3>
            </div>
            {(!selectedDate || tasksForSelected.length === 0) ? (
              <div className="text-sm text-slate-400">Selecciona un día con misiones pendientes</div>
            ) : (
              <ul className="space-y-2 max-h-80 overflow-auto pr-2">
                {tasksForSelected.map(t => {
                  const s = skillsById[t.skillId]
                  const badge = t.priority === 'S' ? 'bg-[#ef4444]/20 text-red-200' :
                                t.priority === 'A' ? 'bg-[#f59e0b]/20 text-orange-200' :
                                t.priority === 'B' ? 'bg-[#3b82f6]/20 text-blue-200' :
                                'bg-[#6b7280]/20 text-slate-200'
                  const borderCol = t.priority === 'S' ? 'border-[#ef4444]' :
                                    t.priority === 'A' ? 'border-[#f59e0b]' :
                                    t.priority === 'B' ? 'border-[#3b82f6]' :
                                    'border-[#6b7280]'
                  return (
                    <li key={t.id} className={`flex items-center justify-between rounded-lg bg-white/5 border p-3 ${borderCol}`}>
                      <div className="flex items-center gap-3">
                        <div className="text-xl">{s?.icon}</div>
                        <div>
                          <div className="font-medium">{t.title}</div>
                          <div className="text-xs text-slate-400">
                            Dif {t.difficulty} • <span className={`px-1.5 py-0.5 rounded ${badge}`}>P{t.priority}</span> • XP {shortXP(t.xpReward)}
                          </div>
                        </div>
                      </div>
                      <button className="btn-primary" onClick={() => completeTask(t.id)}>Completar</button>
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
