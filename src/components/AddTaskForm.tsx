import React, { useEffect, useMemo, useState } from 'react'
import { Priority } from '@/stores/gameStore'

type SkillOption = { id: string; name: string; icon: string }

type Props = {
  isOpen: boolean
  skills: SkillOption[]
  onClose: () => void
  onSubmit: (data: { title: string; skillId: string; difficulty: 1|2|3|4|5; priority: Priority; dueDate?: string }) => void
}

export default function AddTaskForm({ isOpen, skills, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState('')
  const [skillId, setSkillId] = useState(skills[0]?.id ?? '')
  const [difficulty, setDifficulty] = useState<1|2|3|4|5>(3)
  const [priority, setPriority] = useState<Priority>('B')
  const [dueDate, setDueDate] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setSkillId(skills[0]?.id ?? '')
      setDifficulty(3)
      setPriority('B')
      setDueDate(undefined)
    }
  }, [isOpen, skills])

  const canSubmit = useMemo(() => title.trim().length > 0 && skillId, [title, skillId])

  if (!isOpen) return null
  return (
    <div className="modal-backdrop">
      <div className="glass w-full max-w-lg p-6 space-y-4">
        <h2 className="text-2xl font-bold">Nueva Misión</h2>
        <div className="space-y-2">
          <label className="block text-sm text-slate-300">Título</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej. Estudiar algoritmos"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Skill</label>
            <div className="relative">
              <select
                value={skillId}
                onChange={e => setSkillId(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {skills.map(s => (
                  <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Dificultad</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(Number(e.target.value) as 1|2|3|4|5)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Prioridad</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="S">S</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Fecha límite</label>
            <input
              type="date"
              value={dueDate ?? ''}
              onChange={e => setDueDate(e.target.value || undefined)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn bg-white/10 hover:bg-white/20">Cancelar</button>
          <button
            disabled={!canSubmit}
            className="btn-primary"
            onClick={() => onSubmit({ title: title.trim(), skillId, difficulty, priority, dueDate })}
          >
            Crear Misión
          </button>
        </div>
      </div>
    </div>
  )
}

