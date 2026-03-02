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

  // Estilos para dificultad (colores coherentes con calendario)
  const difficultyStyle = (d: number, isActive: boolean) => {
    const base = 'flex-1 py-3 text-sm font-medium rounded-lg border transition-all duration-200 min-w-[50px] flex items-center justify-center'
    const active = 'ring-2 ring-offset-2 ring-offset-slate-950 ring-opacity-70 shadow-glow'
    switch (d) {
      case 1: return `${base} ${isActive ? 'bg-gray-700/70 border-gray-500 text-white ' + active : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'}`
      case 2: return `${base} ${isActive ? 'bg-blue-700/60 border-blue-500 text-blue-100 ' + active : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'}`
      case 3: return `${base} ${isActive ? 'bg-violet-700/60 border-violet-500 text-violet-100 ' + active : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'}`
      case 4: return `${base} ${isActive ? 'bg-orange-700/60 border-orange-500 text-orange-100 ' + active : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'}`
      case 5: return `${base} ${isActive ? 'bg-red-700/60 border-red-500 text-red-100 ' + active : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'}`
      default: return base
    }
  }

  // Estilos para prioridad (igual que calendario)
  const priorityStyle = (p: Priority, isActive: boolean) => {
    const base = 'flex-1 py-3 text-sm font-medium rounded-lg border transition-all duration-200 min-w-[60px] flex items-center justify-center'
    const active = 'ring-2 ring-offset-2 ring-offset-slate-950 ring-opacity-70 shadow-glow'
    switch (p) {
      case 'S': return `${base} ${isActive ? 'bg-red-700/60 border-red-500 text-red-100 ' + active : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'}`
      case 'A': return `${base} ${isActive ? 'bg-orange-700/60 border-orange-500 text-orange-100 ' + active : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'}`
      case 'B': return `${base} ${isActive ? 'bg-blue-700/60 border-blue-500 text-blue-100 ' + active : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'}`
      case 'C': return `${base} ${isActive ? 'bg-gray-700/60 border-gray-500 text-slate-200 ' + active : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'}`
      default: return base
    }
  }

  return (
    <div className="modal-backdrop animate-fade-in">
      <div className="p-6 space-y-6 w-full max-w-lg rounded-2xl transition-all duration-300 transform scale-100 glass sm:max-w-xl sm:p-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 sm:text-3xl">
            Nueva Misión
          </h2>
          <button
            onClick={onClose}
            className="text-2xl transition text-slate-400 hover:text-slate-200"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (canSubmit) {
              onSubmit({
                title: title.trim(),
                skillId,
                difficulty,
                priority,
                dueDate: dueDate || undefined,
              })
              onClose()
            }
          }}
          className="space-y-6"
        >
          {/* Título */}
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-slate-300">
              Título de la misión
            </label>
            <input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Estudiar algoritmos 1 hora"
              className="px-4 py-3 w-full transition outline-none glass text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              required
              autoFocus
            />
          </div>

          {/* Grid responsive */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Skill principal */}
            <div className="space-y-2">
              <label htmlFor="skill" className="block text-sm font-medium text-slate-300">
                Skill principal
              </label>
              <select
                id="skill"
                value={skillId}
                onChange={e => setSkillId(e.target.value)}
                className="px-4 py-3 w-full transition outline-none glass text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                required
              >
                <option value="" disabled>Selecciona una skill</option>
                {skills.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dificultad */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Dificultad
              </label>
              <div className="flex flex-wrap gap-2">
                {[1,2,3,4,5].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d as 1|2|3|4|5)}
                    className={difficultyStyle(d, difficulty === d)}
                    title={`Dificultad ${d}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Prioridad */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Prioridad
              </label>
              <div className="flex flex-wrap gap-2">
                {(['S','A','B','C'] as Priority[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={priorityStyle(p, priority === p)}
                    title={`Prioridad ${p}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Fecha límite */}
            <div className="space-y-2">
              <label htmlFor="dueDate" className="block text-sm font-medium text-slate-300">
                Fecha límite (opcional)
              </label>
              <input
                id="dueDate"
                type="date"
                value={dueDate ?? ''}
                onChange={e => setDueDate(e.target.value || undefined)}
                className="w-full glass px-4 py-3 text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="order-2 px-8 py-3 btn bg-slate-700 hover:bg-slate-600 text-slate-300 sm:order-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`btn-primary px-10 py-3 order-1 sm:order-2 ${!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Crear Misión
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}