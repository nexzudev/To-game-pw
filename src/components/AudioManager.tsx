import React, { useEffect, useRef } from 'react'

type Props = {
  backgroundSrc?: string
}

export default function AudioManager({ backgroundSrc = '/assets/audio/background.mp3' }: Props) {
  const bgRef = useRef<HTMLAudioElement | null>(null)
  const hasTriedPlayRef = useRef(false)

  useEffect(() => {
    const enabledStored = localStorage.getItem('to-game-music-enabled')
    if (enabledStored === null) {
      localStorage.setItem('to-game-music-enabled', 'true')
    }
    const backgroundCandidates: string[] = [
      '/assets/audio/background.mp4',
      backgroundSrc
    ]
    const audio = new Audio(backgroundCandidates[0])
    audio.loop = true
    const volStored = localStorage.getItem('to-game-music-volume')
    const vol = volStored ? Math.max(0, Math.min(1, parseFloat(volStored))) : 0.35
    audio.volume = Number.isFinite(vol) ? vol : 0.35
    bgRef.current = audio

    const tryAutoplay = () => {
      if (hasTriedPlayRef.current) return
      hasTriedPlayRef.current = true
      const enabled = localStorage.getItem('to-game-music-enabled') !== 'false'
      if (!enabled) return
      let idx = 0
      const tryNext = () => {
        if (idx >= backgroundCandidates.length) return
        audio.src = backgroundCandidates[idx++]
        audio.load()
        audio.play().catch(() => {
          tryNext()
        })
      }
      audio.play().catch(() => tryNext())
      window.removeEventListener('pointerdown', tryAutoplay, true)
      window.removeEventListener('click', tryAutoplay, true)
    }
    window.addEventListener('pointerdown', tryAutoplay, true)
    window.addEventListener('click', tryAutoplay, true)

    const handleEnabledChange = (e: Event) => {
      const ev = e as CustomEvent<{ enabled: boolean }>
      const enabled = !!ev.detail?.enabled
      localStorage.setItem('to-game-music-enabled', enabled ? 'true' : 'false')
      if (enabled) {
        audio.play().catch(() => {})
      } else {
        audio.pause()
      }
    }
    const handleVolumeChange = (e: Event) => {
      const ev = e as CustomEvent<{ volume: number }>
      const v = Math.max(0, Math.min(1, Number(ev.detail?.volume ?? audio.volume)))
      audio.volume = v
      localStorage.setItem('to-game-music-volume', String(v))
    }
    window.addEventListener('musicEnabledChange', handleEnabledChange as EventListener)
    window.addEventListener('musicVolumeChange', handleVolumeChange as EventListener)

    const playFirstAvailable = (candidates: string[], volume: number) => {
      let i = 0
      const tryPlay = () => {
        if (i >= candidates.length) return
        const a = new Audio(candidates[i++])
        a.volume = volume
        a.play().catch(() => tryPlay())
      }
      tryPlay()
    }
    const onTaskCompleted = () => {
      playFirstAvailable(['/assets/audio/task-complete.wav'], 0.8)
    }
    const onPlayerLevelUp = () => {
      playFirstAvailable(['/assets/audio/level-up.wav'], 0.9)
    }
    const onButtonClick = () => {
      playFirstAvailable(['/assets/audio/button-click.wav'], 0.6)
    }

    const taskHandler = () => onTaskCompleted()
    const levelHandler = () => onPlayerLevelUp()
    const buttonHandler = () => onButtonClick()

    window.addEventListener('taskCompleted', taskHandler as EventListener)
    window.addEventListener('playerLevelUp', levelHandler as EventListener)
    window.addEventListener('buttonClick', buttonHandler as EventListener)

    return () => {
      window.removeEventListener('pointerdown', tryAutoplay, true)
      window.removeEventListener('click', tryAutoplay, true)
      window.removeEventListener('musicEnabledChange', handleEnabledChange as EventListener)
      window.removeEventListener('musicVolumeChange', handleVolumeChange as EventListener)
      window.removeEventListener('taskCompleted', taskHandler as EventListener)
      window.removeEventListener('playerLevelUp', levelHandler as EventListener)
      window.removeEventListener('buttonClick', buttonHandler as EventListener)
      bgRef.current?.pause()
      bgRef.current = null
    }
  }, [backgroundSrc])

  return null
}
