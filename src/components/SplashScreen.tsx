import React, { useState } from 'react'

type Props = {
  onSubmitName: (name: string) => void
  onImport: (json: string) => void
}

export default function SplashScreen({ onSubmitName, onImport }: Props) {
  const [started, setStarted] = useState(false)
  const [name, setName] = useState('')
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="space-y-6 text-center">
        <h1 className="text-6xl font-extrabold tracking-tight md:text-7xl">
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-indigo-400 to-purple-400 drop-shadow-[0_0_20px_rgba(124,58,237,0.45)]">
            Game On!
          </span>
        </h1>
        <p className="text-slate-400">Convierte tus tareas en XP y sube de nivel</p>
        {!started && (
          <div className={`flex items-center justify-center gap-3 transition-opacity duration-300 ${started ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <button onClick={() => setStarted(true)} className="px-8 py-3 text-lg btn-primary">
              Start
            </button>
            <label className="px-4 py-3 text-lg cursor-pointer btn bg-white/10 hover:bg-white/20">
              Importar
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const text = await f.text()
                  onImport(text)
                  e.currentTarget.value = ''
                }}
              />
            </label>
          </div>
        )}
        {started && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_12px_rgba(34,211,238,0.3)] animate-epic-text">
              ¡Nombra tu leyenda!
            </div>
            <div className="flex gap-2 items-center mx-auto max-w-md">
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ingresa tu nombre de aventurero"
                className="px-4 py-3 w-full rounded-lg border outline-none bg-white/5 border-white/10 focus:ring-2 focus:ring-indigo-500"
              />
              <button
                className={`btn-primary px-5 py-3 ${!name.trim() ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={!name.trim()}
                onClick={() => {
                  if (!name.trim()) return
                  onSubmitName(name.trim())
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
