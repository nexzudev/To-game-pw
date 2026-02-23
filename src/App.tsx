import React, { useMemo, useRef, useState } from 'react'
import SplashScreen from './components/SplashScreen'
import PlayerNameModal from './components/PlayerNameModal'
import AddTaskForm from './components/AddTaskForm'
import CalendarView from './components/CalendarView'
import AudioManager from './components/AudioManager'
import MusicPlayer from './components/MusicPlayer'
import { shortXP, useCurrentProfile, useGameStore, playerLevel } from './stores/gameStore'

export default function App() {
  const profile = useCurrentProfile()
  const setCurrentProfile = useGameStore(s => s.setCurrentProfile)
  const renameCurrent = useGameStore(s => s.renameCurrent)
  const addTask = useGameStore(s => s.addTask)
  const completeTask = useGameStore(s => s.completeTask)
  const deleteTask = useGameStore(s => s.deleteTask)
  const exportProfile = useGameStore(s => s.exportProfile)
  const importProfile = useGameStore(s => s.importProfile)
  const currentName = useGameStore(s => s.current)

  const [showNameModal, setShowNameModal] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const skills = useMemo(() => {
    if (!profile) return []
    return Object.values(profile.skills)
  }, [profile])

  const pending = useMemo(() => profile?.tasks.filter(t => !t.completed) ?? [], [profile])

  if (!profile) {
    return (
      <>
        <SplashScreen
          onStart={() => setShowNameModal(true)}
          onImport={(json) => {
            importProfile(json)
          }}
        />
        <PlayerNameModal
          isOpen={showNameModal}
          title="Crea tu perfil"
          onClose={() => setShowNameModal(false)}
          onSubmit={(name) => {
            setCurrentProfile(name)
            setShowNameModal(false)
          }}
        />
      </>
    )
  }

  return (
    <div
      className="min-h-screen"
      onClickCapture={(e) => {
        const el = e.target as HTMLElement
        const isButton = el.closest('button, [role=\"button\"]')
        if (isButton) {
          window.dispatchEvent(new CustomEvent('buttonClick'))
        }
      }}
    >
      <AudioManager />
      <header className="sticky top-0 z-40 bg-bgDark/70 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              className="text-2xl font-extrabold hover:text-indigo-300 transition-colors"
              onClick={() => setShowNameModal(true)}
              title="Cambiar nombre"
            >
              {profile.name}
            </button>
            <div className="text-slate-400">Nivel {playerLevel(profile.totalXP)}</div>
            <div className="text-slate-500">XP {shortXP(profile.totalXP)}</div>
          </div>
          <div className="flex items-center gap-2">
            <MusicPlayer />
            <button
              className="btn bg-white/10 hover:bg-white/20"
              onClick={() => {
                if (!currentName) return
                const data = exportProfile(currentName)
                const blob = new Blob([data], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `to-game-${currentName}.json`
                document.body.appendChild(a)
                a.click()
                a.remove()
                URL.revokeObjectURL(url)
              }}
            >
              Exportar
            </button>
            <button
              className="btn bg-white/10 hover:bg-white/20"
              onClick={() => fileRef.current?.click()}
            >
              Importar
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                const text = await f.text()
                importProfile(text)
                e.currentTarget.value = ''
              }}
            />
            <button className="btn-secondary" onClick={() => setShowCalendar(true)}>Ver Calendario</button>
            <button className="btn-primary" onClick={() => setShowAddTask(true)}>+ Nueva Misión</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-glow">
            <div className="text-sm text-slate-400">Misiones pendientes</div>
            <div className="text-3xl font-bold">{pending.length}</div>
          </div>
          <div className="glass p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-glow">
            <div className="text-sm text-slate-400">Nivel actual</div>
            <div className="text-3xl font-bold">{playerLevel(profile.totalXP)}</div>
          </div>
          <div className="glass p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-glow">
            <div className="text-sm text-slate-400">XP total</div>
            <div className="text-3xl font-bold">{shortXP(profile.totalXP)}</div>
          </div>
        </section>

        <section className="glass p-4">
          <h2 className="text-xl font-bold mb-3">Skills</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {skills.map(s => {
              const pct = Math.max(0, Math.min(100, Math.floor((s.xp / s.xpToNext) * 100)))
              return (
                <div key={s.id} className="rounded-lg bg-white/5 border border-white/10 p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-glow">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl">{s.icon}</div>
                    <div className="text-sm text-slate-400">Lv. {s.level}</div>
                  </div>
                  <div className="mt-2 font-semibold">{s.name}</div>
                  <div className="mt-2 progress"><span style={{ width: `${pct}%` }} /></div>
                  <div className="mt-1 text-xs text-slate-400">{shortXP(s.xp)} / {shortXP(s.xpToNext)}</div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="glass p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Misiones</h2>
            <button className="btn-primary" onClick={() => setShowAddTask(true)}>+ Nueva Misión</button>
          </div>
          {pending.length === 0 ? (
            <div className="text-slate-400 text-sm">No hay misiones pendientes</div>
          ) : (
            <ul className="space-y-3">
              {pending.map(t => {
                const skill = profile.skills[t.skillId]
                return (
                  <li key={t.id} className="rounded-lg bg-white/5 border border-white/10 p-4 flex items-center justify-between transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-glow">
                    <div className="flex items-center gap-3">
                      <div className="text-xl">{skill?.icon}</div>
                      <div>
                        <div className="font-semibold">{t.title}</div>
                        <div className="text-xs text-slate-400">
                          XP {shortXP(t.xpReward)} • Dif {t.difficulty} • P{t.priority}{t.dueDate ? ` • vence ${t.dueDate}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="btn bg-white/10 hover:bg-white/20" onClick={() => {
                        if (confirm('¿Seguro que deseas eliminar esta misión?')) {
                          deleteTask(t.id)
                        }
                      }}>Eliminar</button>
                      <button className="btn-primary" onClick={() => completeTask(t.id)}>Completar</button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </main>

      <PlayerNameModal
        isOpen={showNameModal}
        initialName={profile.name}
        title="Cambiar nombre"
        onClose={() => setShowNameModal(false)}
        onSubmit={(name) => {
          renameCurrent(name)
          setShowNameModal(false)
        }}
      />

      <AddTaskForm
        isOpen={showAddTask}
        skills={skills.map(s => ({ id: s.id, name: s.name, icon: s.icon }))}
        onClose={() => setShowAddTask(false)}
        onSubmit={(data) => {
          addTask(data)
          setShowAddTask(false)
        }}
      />

      <CalendarView
        isOpen={showCalendar}
        tasks={profile.tasks}
        skillsById={Object.fromEntries(skills.map(s => [s.id, { icon: s.icon, name: s.name }]))}
        onClose={() => setShowCalendar(false)}
      />
    </div>
  )
}
