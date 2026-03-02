import React, { useMemo, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'

type SkillInput = { id: string; name: string; icon: string }

type Props = {
  isOpen: boolean
  onClose: () => void
}

export default function SkillsSetupModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null

  const setSkillsForCurrent = useGameStore(s => s.setSkillsForCurrent)

  // Skills predefinidas (las mismas de defaultSkills)
  const PREDEFINED = useMemo(() => [
    { id: 'combat', name: 'Fuerza', icon: '⚔️' },
    { id: 'craft', name: 'Trabajo', icon: '🛠️' },
    { id: 'knowledge', name: 'Conocimiento', icon: '📚' },
    { id: 'fitness', name: 'Resistencia', icon: '🏃' },
    { id: 'charisma', name: 'Carisma', icon: '🗣️' }
  ] as const, [])

  // Inicializamos selected con todas las predefinidas seleccionadas
  const [selected, setSelected] = useState<Set<string>>(
    new Set(PREDEFINED.map(s => s.id))
  )

  const [customName, setCustomName] = useState('')
  const [customSkills, setCustomSkills] = useState<SkillInput[]>([])

  // Asignación automática de emoji según nombre
  const emojiForName = (name: string): string => {
    const n = name.toLowerCase()
    if (/(programa|c[oó]digo|dev|code|programación)/.test(n)) return '💻'
    if (/(cocina|comer|comida|chef|cook)/.test(n)) return '🍳'
    if (/(idioma|hablar|ingl[eé]s|lengua|language)/.test(n)) return '🗣️'
    if (/(deporte|gimnasio|correr|entrena|gym|run)/.test(n)) return '🏃‍♂️'
    if (/(lectura|libro|estudio|leer|book|study)/.test(n)) return '📚'
    if (/(social|amigos|familia|relaci[oó]n|friends)/.test(n)) return '👥'
    if (/(arte|dibujo|m[uú]sica|draw|music)/.test(n)) return '🎨'
    // Default aleatorio
    const defaults = ['🎯', '⭐', '⚡', '🌟', '🔮', '🏆', '🧠', '🚀']
    return defaults[Math.floor(Math.random() * defaults.length)]
  }

  const allSkills = useMemo(() => [...PREDEFINED, ...customSkills], [customSkills])

  const canConfirm = selected.size > 0

  const handleAddCustom = () => {
    const name = customName.trim()
    if (!name) return

    // Generar ID único y seguro
    let id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    if (!id) id = `custom-${Date.now()}`
    // Evitar duplicados
    if (allSkills.some(s => s.id === id)) {
      alert('Ya existe una skill con nombre o ID similar')
      return
    }

    const icon = emojiForName(name)
    const newSkill: SkillInput = { id, name, icon }

    setCustomSkills(prev => [...prev, newSkill])
    setSelected(prev => new Set([...prev, id]))
    setCustomName('')
  }

  const handleConfirm = () => {
    const finalSkills = allSkills.filter(s => selected.has(s.id))
    setSkillsForCurrent(finalSkills)
    onClose()
  }

  return (
    <div className="modal-backdrop">
      <div className="p-6 space-y-6 w-full max-w-3xl rounded-2xl glass sm:p-8 animate-fade-in">
        {/* Título */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            Elige o crea tus habilidades iniciales
          </h2>
          <p className="mt-2 text-slate-400">Selecciona las predefinidas y/o añade las tuyas. Mínimo una.</p>
        </div>

        {/* Skills predefinidas */}
        <div>
          <h3 className="mb-3 text-xl font-semibold text-slate-200">Predefinidas</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PREDEFINED.map(skill => {
              const isSelected = selected.has(skill.id)
              return (
                <label
                  key={skill.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/50 shadow-glow'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-indigo-500"
                    checked={isSelected}
                    onChange={e => {
                      const newSet = new Set(selected)
                      if (e.target.checked) newSet.add(skill.id)
                      else newSet.delete(skill.id)
                      setSelected(newSet)
                    }}
                  />
                  <span className="text-2xl">{skill.icon}</span>
                  <span className="font-medium">{skill.name}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Crear personalizada */}
        <div className="mt-8">
          <h3 className="mb-3 text-xl font-semibold text-slate-200">Crear skill personalizada</h3>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Ej: Programación, Cocina, Idiomas..."
              className="flex-1 px-4 py-3 rounded-lg transition outline-none glass focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
            <button
              onClick={handleAddCustom}
              disabled={!customName.trim()}
              className={`btn-primary px-6 py-3 ${!customName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Añadir
            </button>
          </div>

          {/* Lista de personalizadas añadidas */}
          {customSkills.length > 0 && (
            <div className="mt-4 space-y-2">
              {customSkills.map(skill => {
                const isSelected = selected.has(skill.id)
                return (
                  <div
                    key={skill.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isSelected ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex gap-3 items-center">
                      <span className="text-2xl">{skill.icon}</span>
                      <span className="font-medium">{skill.name}</span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <label className="flex gap-2 items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-indigo-500"
                          checked={isSelected}
                          onChange={e => {
                            const newSet = new Set(selected)
                            if (e.target.checked) newSet.add(skill.id)
                            else newSet.delete(skill.id)
                            setSelected(newSet)
                          }}
                        />
                        <span className="text-sm">Seleccionar</span>
                      </label>
                      <button
                        onClick={() => {
                          setCustomSkills(prev => prev.filter(s => s.id !== skill.id))
                          setSelected(prev => {
                            const newSet = new Set(prev)
                            newSet.delete(skill.id)
                            return newSet
                          })
                        }}
                        className="text-xl font-bold text-red-400 hover:text-red-300"
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Botones finales */}
        <div className="flex flex-col gap-4 justify-end pt-6 sm:flex-row">
          <button
            onClick={onClose}
            className="px-8 py-3 btn bg-slate-700 hover:bg-slate-600 text-slate-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`btn-primary px-10 py-3 ${!canConfirm ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}