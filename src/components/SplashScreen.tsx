import React from 'react'

type Props = {
  onStart: () => void
  onImport: (json: string) => void
}

export default function SplashScreen({ onStart, onImport }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-indigo-400 to-purple-400 drop-shadow-[0_0_20px_rgba(124,58,237,0.45)]">
            Game On!
          </span>
        </h1>
        <p className="text-slate-400">Convierte tus tareas en XP y sube de nivel</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={onStart} className="btn-primary px-8 py-3 text-lg">
            Start
          </button>
          <label className="btn bg-white/10 hover:bg-white/20 px-4 py-3 text-lg cursor-pointer">
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
      </div>
    </div>
  )
}
