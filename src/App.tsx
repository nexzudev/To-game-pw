import React, { useMemo, useRef, useState } from 'react'
import SplashScreen from './components/SplashScreen'
import PlayerNameModal from './components/PlayerNameModal'
import AddTaskForm from './components/AddTaskForm'
import CalendarView from './components/CalendarView'
import AudioManager from './components/AudioManager'
import MusicPlayer from './components/MusicPlayer'
import SkillsSetupModal from './components/SkillsSetupModal'
import { shortXP, useCurrentProfile, useGameStore, playerLevel, getPlayerLevel, getPlayerLevelProgress } from './stores/gameStore'

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
  const [showSkillsIntro, setShowSkillsIntro] = useState(false)
  const [showSkillsSetup, setShowSkillsSetup] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const skills = useMemo(() => {
    if (!profile) return []
    return Object.values(profile.skills)
  }, [profile])

  const pending = useMemo(() => {
    if (!profile) return []
    return profile.tasks.filter(t => !t.completed)
  }, [profile])

  // Nivel general y progreso
  const playerLevelInfo = useMemo(() => {
    if (!profile) return { level: 1, percentage: 0, xpInLevel: 0, xpNeeded: 1000 }
    return getPlayerLevelProgress(profile.totalXP)
  }, [profile?.totalXP])

  if (!profile) {
    return (
      <>
        <SplashScreen
          onSubmitName={(name) => {
            setCurrentProfile(name)
            setShowSkillsIntro(true)
            setTimeout(() => {
              setShowSkillsIntro(false)
              setShowSkillsSetup(true)
            }, 1800)
          }}
          onImport={(json) => importProfile(json)}
        />
        {showSkillsIntro && (
          <div className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm pointer-events-none bg-black/40">
            <div className="text-4xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 drop-shadow-[0_0_20px_rgba(124,58,237,0.6)] animate-epic-text">
              ¡Define tu poder inicial!
            </div>
          </div>
        )}
        <SkillsSetupModal
          isOpen={showSkillsSetup}
          onClose={() => setShowSkillsSetup(false)}
        />
      </>
    )
  }

  return (
    <div
      className="min-h-screen antialiased bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-slate-200"
      onClickCapture={(e) => {
        const el = e.target as HTMLElement
        if (el.closest('button, [role="button"]')) {
          window.dispatchEvent(new Event('buttonClick'))
        }
      }}
    >
      <AudioManager />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b shadow-lg backdrop-blur-lg bg-slate-950/70 border-indigo-500/20">
        <div className="flex justify-between items-center px-4 py-3 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <button
            className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 transition hover:opacity-80"
            onClick={() => setShowNameModal(true)}
            title="Cambiar nombre"
          >
            {profile.name}
          </button>

          <div className="flex gap-4 items-center">
            <div className="text-right">
              <p className="font-bold">Nivel {playerLevelInfo.level}</p>
              <p className="text-sm text-slate-400">XP {shortXP(profile.totalXP)}</p>
            </div>

            {/* Barra de progreso general */}
            <div className="hidden w-32 sm:block">
              <div className="progress h-1.5 bg-white/10 rounded-full overflow-hidden">
                <span
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500 progress-fill"
                  style={{ width: `${playerLevelInfo.percentage}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-right text-slate-500">
                {shortXP(playerLevelInfo.xpInLevel)} / {shortXP(playerLevelInfo.xpNeeded)}
              </p>
            </div>

            <MusicPlayer />

            <button
              className="btn bg-white/5 hover:bg-white/10 text-sm px-3 py-1.5 rounded-md transition"
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
              className="btn bg-white/5 hover:bg-white/10 text-sm px-3 py-1.5 rounded-md transition"
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

            <button
              className="px-4 py-2 text-sm btn-primary"
              onClick={() => setShowCalendar(true)}
            >
              Calendario
            </button>

            <button
              className="px-4 py-2 text-sm btn-primary"
              onClick={() => setShowAddTask(true)}
            >
              + Misión
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="px-4 py-6 mx-auto space-y-8 max-w-7xl sm:px-6 lg:px-8">
        {/* Resumen */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="p-5 text-center transition glass hover:-translate-y-1 hover:shadow-glow">
            <div className="text-sm text-slate-400">Pendientes</div>
            <div className="text-4xl font-bold text-cyan-400">{pending.length}</div>
          </div>
          <div className="p-5 text-center transition glass hover:-translate-y-1 hover:shadow-glow">
            <div className="text-sm text-slate-400">Nivel Global</div>
            <div className="text-4xl font-bold text-purple-400">{playerLevelInfo.level}</div>
          </div>
          <div className="p-5 text-center transition glass hover:-translate-y-1 hover:shadow-glow">
            <div className="text-sm text-slate-400">XP Total</div>
            <div className="text-4xl font-bold text-indigo-400">{shortXP(profile.totalXP)}</div>
          </div>
        </section>

        {/* Skills */}
        <section className="p-6 glass">
          <h2 className="mb-5 text-2xl font-bold">Habilidades</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {skills.map(s => {
              const pct = Math.min(100, Math.max(0, Math.floor((s.xp / s.xpToNext) * 100)))
              return (
                <div key={s.id} className="p-4 text-center transition glass hover:-translate-y-1 hover:shadow-glow">
                  <div className="mb-2 text-4xl">{s.icon}</div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm text-slate-400">Lv. {s.level}</div>
                  <div className="mt-3 progress"><span className="progress-fill" style={{ width: `${pct}%` }} /></div>
                  <div className="mt-1 text-xs text-slate-500">{shortXP(s.xp)} / {shortXP(s.xpToNext)}</div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Misiones pendientes */}
        <section className="p-6 glass">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bold">Misiones Pendientes</h2>
            <button className="px-5 py-2 text-sm btn-primary" onClick={() => setShowAddTask(true)}>
              + Nueva
            </button>
          </div>

          {pending.length === 0 ? (
            <p className="py-10 text-center text-slate-400">No hay misiones pendientes. ¡Crea una!</p>
          ) : (
            <ul className="space-y-4">
              {pending.map(t => {
                const skill = profile.skills[t.skillId]
                return (
                  <li key={t.id} className="flex flex-col gap-4 justify-between p-5 transition glass sm:flex-row sm:items-center hover:-translate-y-1 hover:shadow-glow">
                    <div className="flex-1">
                      <div className="text-lg font-semibold">{t.title}</div>
                      <div className="mt-1 text-sm text-slate-400">
                        {skill?.icon} {skill?.name} • {shortXP(t.xpReward)} XP • Dif. {t.difficulty} • P{t.priority}
                        {t.dueDate && ` • Vence ${t.dueDate}`}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        className="px-4 py-2 text-sm text-red-300 btn bg-red-600/20 hover:bg-red-600/40"
                        onClick={() => {
                          if (confirm('¿Eliminar esta misión?')) deleteTask(t.id)
                        }}
                      >
                        Eliminar
                      </button>
                      <button
                        className="px-6 py-2 text-sm btn-primary"
                        onClick={() => completeTask(t.id)}
                      >
                        Completar
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </main>

      {/* Modals */}
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

      {showCalendar && (
        <div className="modal-backdrop">
          <div className="p-6 w-full max-w-5xl glass">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Calendario de Misiones</h2>
              <button className="px-4 py-2 btn bg-white/10 hover:bg-white/20" onClick={() => setShowCalendar(false)}>
                Cerrar
              </button>
            </div>
            <CalendarView
              isOpen={showCalendar}
              tasks={profile.tasks}
              skillsById={Object.fromEntries(skills.map(s => [s.id, { icon: s.icon, name: s.name }]))}
              onClose={() => setShowCalendar(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
