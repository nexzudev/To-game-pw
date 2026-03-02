import React, { useEffect, useState } from 'react'

type Props = {
  isOpen: boolean
  initialName?: string
  title?: string
  onClose: () => void
  onSubmit: (name: string) => void
  onConfirmed?: () => void
}

export default function PlayerNameModal({ isOpen, initialName, title = 'Tu nombre', onClose, onSubmit, onConfirmed }: Props) {
  const [name, setName] = useState(initialName ?? '')
  const [closing, setClosing] = useState(false)
  useEffect(() => {
    setName(initialName ?? '')
    setClosing(false)
  }, [initialName, isOpen])
  if (!isOpen) return null
  return (
    <div className="modal-backdrop">
      <div className={`glass w-full max-w-md p-6 space-y-4 transition-all duration-300 ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}>
        <h2 className="text-2xl font-bold">{title}</h2>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Escribe tu nombre"
          className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn bg-white/10 hover:bg-white/20">Cancelar</button>
          <button
            className="btn-primary"
            onClick={() => {
              if (!name.trim()) return
              setClosing(true)
              setTimeout(() => {
                onSubmit(name.trim())
                onConfirmed?.()
              }, 350)
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
