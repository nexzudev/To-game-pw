import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'

export type Priority = 'S' | 'A' | 'B' | 'C'

export type Task = {
  id: string
  title: string
  skillId: string
  difficulty: 1 | 2 | 3 | 4 | 5
  priority: Priority
  dueDate?: string
  xpReward: number
  completed: boolean
}

export type Skill = {
  id: string
  name: string
  icon: string
  level: number
  xp: number
  xpToNext: number
}

export type Profile = {
  name: string
  totalXP: number
  skills: Record<string, Skill>
  tasks: Task[]
  createdAt: number
  settings?: {
    musicEnabled: boolean
    musicVolume: number
    musicTrackUrl?: string
  }
}

type State = {
  profiles: Record<string, Profile>
  current?: string
  setCurrentProfile: (name: string) => void
  renameCurrent: (newName: string) => void
  addTask: (input: { title: string; skillId: string; difficulty: 1|2|3|4|5; priority: Priority; dueDate?: string }) => void
  completeTask: (id: string) => void
  deleteTask: (id: string) => void
  exportProfile: (name: string) => string
  importProfile: (json: string) => void
  setMusicEnabled: (enabled: boolean) => void
  setMusicVolume: (volume: number) => void
  setMusicTrackUrl: (url: string) => void
  setSkillsForCurrent: (skills: Array<{ id?: string; name: string; icon: string }>) => void
  getPlayerLevel: (totalXP: number) => number
  getXPForNextLevel: (currentLevel: number) => number
  getPlayerLevelProgress: (totalXP: number) => { level: number; xpInLevel: number; xpNeeded: number; percentage: number }
}

const defaultSkills = (): Record<string, Skill> => {
  const defs: Array<Pick<Skill, 'id' | 'name' | 'icon'>> = [
    { id: 'combat', name: 'Fuerza', icon: '⚔️' },
    { id: 'craft', name: 'Trabajo', icon: '🛠️' },
    { id: 'knowledge', name: 'Conocimiento', icon: '📚' },
    { id: 'fitness', name: 'Resistencia', icon: '🏃' },
    { id: 'charisma', name: 'Carisma', icon: '🗣️' }
  ]
  const map: Record<string, Skill> = {}
  for (const d of defs) {
    map[d.id] = { ...d, level: 1, xp: 0, xpToNext: 100 }
  }
  return map
}

export const shortXP = (n: number): string => {
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (abs >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}

const baseForDifficulty = (d: 1|2|3|4|5): number => {
  switch (d) {
    case 1: return 20
    case 2: return 50
    case 3: return 100
    case 4: return 200
    case 5: return 400
  }
}

const multiplierForPriority = (p: Priority): number => {
  switch (p) {
    case 'S': return 2
    case 'A': return 1.5
    case 'B': return 1
    case 'C': return 0.8
  }
}

const computeReward = (d: 1|2|3|4|5, p: Priority): number => {
  const base = baseForDifficulty(d)
  const mult = multiplierForPriority(p)
  return Math.round(base * mult)
}

const levelUpSkill = (s: Skill, gained: number): Skill => {
  let xp = s.xp + gained
  let level = s.level
  let next = s.xpToNext
  while (xp >= next) {
    xp -= next
    level += 1
    next = Math.floor(next * 1.4)
  }
  return { ...s, xp, level, xpToNext: next }
}

// Constantes para nivel general del jugador
const XP_BASE_THRESHOLD = 1000
const XP_GROWTH_FACTOR = 1.5 // cada nivel requiere 50% más que el anterior

export const getPlayerLevel = (totalXP: number): number => {
  let level = 1
  let threshold = XP_BASE_THRESHOLD
  let remaining = totalXP
  while (remaining >= threshold) {
    remaining -= threshold
    level++
    threshold = Math.round(threshold * XP_GROWTH_FACTOR)
  }
  return level
}

export const getXPForNextLevel = (currentLevel: number): number => {
  let threshold = XP_BASE_THRESHOLD
  for (let i = 1; i < currentLevel; i++) {
    threshold = Math.round(threshold * XP_GROWTH_FACTOR)
  }
  return threshold
}

export const getPlayerLevelProgress = (totalXP: number) => {
  const currentLevel = getPlayerLevel(totalXP)
  let accumulated = 0
  let threshold = XP_BASE_THRESHOLD
  for (let i = 1; i < currentLevel; i++) {
    accumulated += threshold
    threshold = Math.round(threshold * XP_GROWTH_FACTOR)
  }
  const xpInLevel = totalXP - accumulated
  const xpNeeded = threshold
  const percentage = Math.min(100, Math.floor((xpInLevel / xpNeeded) * 100))
  return { level: currentLevel, xpInLevel, xpNeeded, percentage }
}

export const useGameStore = create<State>()(
  persist(
    (set, get) => ({
      profiles: {},
      current: undefined,

      setCurrentProfile: (name) => {
        const p = get().profiles[name]
        if (p) {
          set({ current: name })
          return
        }
        const newProfile: Profile = {
          name,
          totalXP: 0,
          skills: defaultSkills(),
          tasks: [],
          createdAt: Date.now(),
          settings: {
            musicEnabled: false,
            musicVolume: 0.5,
            musicTrackUrl: undefined
          }
        }
        set(state => ({ profiles: { ...state.profiles, [name]: newProfile }, current: name }))
      },

      renameCurrent: (newName) => {
        const cur = get().current
        if (!cur) return
        if (cur === newName) return
        const profiles = { ...get().profiles }
        const profile = profiles[cur]
        if (!profile) return
        delete profiles[cur]
        profiles[newName] = { ...profile, name: newName }
        set({ profiles, current: newName })
      },

      addTask: (input) => {
        const curName = get().current
        if (!curName) return
        const reward = computeReward(input.difficulty, input.priority)
        const task: Task = {
          id: uuid(),
          title: input.title,
          skillId: input.skillId,
          difficulty: input.difficulty,
          priority: input.priority,
          dueDate: input.dueDate,
          xpReward: reward,
          completed: false
        }
        set(state => {
          const profile = state.profiles[curName]
          if (!profile) return state
          const updated: Profile = { ...profile, tasks: [task, ...profile.tasks] }
          return { profiles: { ...state.profiles, [curName]: updated } }
        })
      },

      completeTask: (id) => {
        const curName = get().current
        if (!curName) return
        const state = get()
        const profile = state.profiles[curName]
        if (!profile) return

        const taskIndex = profile.tasks.findIndex(t => t.id === id)
        if (taskIndex === -1) return
        const task = profile.tasks[taskIndex]
        if (task.completed) return

        // XP total ganada por la tarea
        const xpEarned = task.xpReward

        // 70% a la skill
        const skillXP = Math.round(xpEarned * 0.7)
        // 30% al jugador general
        const playerXP = Math.round(xpEarned * 0.3)

        // Actualizar skill
        const skills = { ...profile.skills }
        const skill = skills[task.skillId]
        let skillLevelUp = false
        if (skill) {
          const beforeLevel = skill.level
          const updatedSkill = levelUpSkill(skill, skillXP)
          if (updatedSkill.level > beforeLevel) skillLevelUp = true
          skills[task.skillId] = updatedSkill
        }

        // Actualizar totalXP del jugador
        const oldTotalXP = profile.totalXP
        const newTotalXP = oldTotalXP + playerXP

        // Actualizar tarea a completada
        const updatedTasks = profile.tasks.map((t, i) =>
          i === taskIndex ? { ...t, completed: true } : t
        )

        // Actualizar perfil
        const updatedProfile: Profile = {
          ...profile,
          totalXP: newTotalXP,
          skills,
          tasks: updatedTasks,
        }

        set(state => ({
          profiles: { ...state.profiles, [curName]: updatedProfile }
        }))

        // Disparar eventos
        window.dispatchEvent(new CustomEvent('taskCompleted'))

        // Detectar subida de nivel general o de skill
        const oldPlayerLevel = getPlayerLevel(oldTotalXP)
        const newPlayerLevel = getPlayerLevel(newTotalXP)
        if (newPlayerLevel > oldPlayerLevel || skillLevelUp) {
          window.dispatchEvent(new Event('playerLevelUp'))
        }
      },

      deleteTask: (id) => {
        const curName = get().current
        if (!curName) return
        set(state => {
          const p = state.profiles[curName]
          if (!p) return state
          const tasks = p.tasks.filter(t => t.id !== id)
          return { profiles: { ...state.profiles, [curName]: { ...p, tasks } } }
        })
      },

      exportProfile: (name) => {
        const p = get().profiles[name]
        return JSON.stringify(p, null, 2)
      },

      importProfile: (json) => {
        try {
          const parsed: Profile = JSON.parse(json)
          if (!parsed || !parsed.name) return
          if (!parsed.settings) {
            parsed.settings = { musicEnabled: false, musicVolume: 0.5, musicTrackUrl: undefined }
          }
          set(state => ({
            profiles: { ...state.profiles, [parsed.name]: parsed },
            current: parsed.name
          }))
        } catch {}
      },

      setMusicEnabled: (enabled) => {
        const cur = get().current
        if (!cur) return
        set(state => {
          const p = state.profiles[cur]
          if (!p) return state
          const settings = { ...(p.settings ?? { musicEnabled: false, musicVolume: 0.5 }), musicEnabled: enabled }
          return { profiles: { ...state.profiles, [cur]: { ...p, settings } } }
        })
      },

      setMusicVolume: (volume) => {
        const cur = get().current
        if (!cur) return
        set(state => {
          const p = state.profiles[cur]
          if (!p) return state
          const settings = { ...(p.settings ?? { musicEnabled: false, musicVolume: 0.5 }), musicVolume: Math.max(0, Math.min(1, volume)) }
          return { profiles: { ...state.profiles, [cur]: { ...p, settings } } }
        })
      },

      setMusicTrackUrl: (url) => {
        const cur = get().current
        if (!cur) return
        set(state => {
          const p = state.profiles[cur]
          if (!p) return state
          const settings = { ...(p.settings ?? { musicEnabled: false, musicVolume: 0.5 }), musicTrackUrl: url }
          return { profiles: { ...state.profiles, [cur]: { ...p, settings } } }
        })
      },

      setSkillsForCurrent: (skillsList) => {
        const cur = get().current
        if (!cur) return
        set(state => {
          const p = state.profiles[cur]
          if (!p) return state
          const rec: Record<string, Skill> = {}
          for (const it of skillsList) {
            const id = (it.id && it.id.trim()) ? it.id : (it.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || uuid())
            rec[id] = {
              id,
              name: it.name,
              icon: it.icon,
              level: p.skills[id]?.level ?? 1,
              xp: p.skills[id]?.xp ?? 0,
              xpToNext: p.skills[id]?.xpToNext ?? 100
            }
          }
          const updated: Profile = { ...p, skills: rec }
          return { profiles: { ...state.profiles, [cur]: updated } }
        })
      },

      // Funciones de nivel general
      getPlayerLevel: (totalXP: number) => getPlayerLevel(totalXP),
      getXPForNextLevel: (currentLevel: number) => getXPForNextLevel(currentLevel),
      getPlayerLevelProgress: (totalXP: number) => getPlayerLevelProgress(totalXP),
    }),
    {
      name: 'to-game',
      version: 1
    }
  )
)

export const useCurrentProfile = () => {
  const current = useGameStore(s => s.current)
  const profile = useGameStore(s => (current ? s.profiles[current] : undefined))
  return profile
}

export const playerLevel = (totalXP: number): number => 1 + Math.floor(totalXP / 1000)