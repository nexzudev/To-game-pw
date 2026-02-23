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
        const st = get()
        const profile = st.profiles[curName]
        if (!profile) return
        const idx = profile.tasks.findIndex(t => t.id === id)
        if (idx === -1) return
        const t = profile.tasks[idx]
        if (t.completed) return
        const skillGain = Math.round(t.xpReward * 0.7)
        const playerGain = Math.round(t.xpReward * 0.3)
        const skills = { ...profile.skills }
        const s = skills[t.skillId]
        const prevPlayerLevel = playerLevel(profile.totalXP)
        let skillLevelUp = false
        if (s) {
          const beforeLevel = s.level
          const after = levelUpSkill(s, skillGain)
          if (after.level > beforeLevel) {
            skillLevelUp = true
          }
          skills[t.skillId] = after
        }
        const tasks = profile.tasks.map(tt => tt.id === id ? { ...tt, completed: true } : tt)
        const newTotalXP = profile.totalXP + playerGain
        const updated: Profile = { ...profile, skills, tasks, totalXP: newTotalXP }
        set(state => ({ profiles: { ...state.profiles, [curName]: updated } }))
        try {
          window.dispatchEvent(new CustomEvent('taskCompleted'))
          const newPlayerLevel = playerLevel(newTotalXP)
          if (newPlayerLevel > prevPlayerLevel || skillLevelUp) {
            window.dispatchEvent(new Event('playerLevelUp'))
          }
        } catch {
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
        } catch {
        }
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
      }
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

