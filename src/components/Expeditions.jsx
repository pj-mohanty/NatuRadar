import { useState } from 'react'

const DIFFICULTY_COLORS = {
  'EASY': '#22c55e', 'MEDIUM': '#eab308', 'HARD': '#f97316', 'EXPERT': '#ef4444', 'LEGENDARY': '#dc2626'
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export const EXPEDITIONS = [
  {
    id: 'urban-pollinator',
    name: 'Urban Pollinator Expedition',
    emoji: '🌸',
    description: 'Document the vital pollinators keeping urban ecosystems alive.',
    difficulty: 'EASY',
    badge: { emoji: '🐝', label: 'Pollinator Guardian' },
    bonusPoints: 150,
    tasks: [
      {
        id: 'bee', label: 'Discover a bee species', count: 1,
        match: { keywords: ['bee', 'bombus', 'apis', 'bumblebee', 'honeybee', 'mellifera'] }
      },
      {
        id: 'butterfly', label: 'Discover a butterfly or moth', count: 1,
        match: { emojis: ['🦋'], keywords: ['butterfly', 'moth', 'lepidoptera', 'danaus', 'aglais', 'polyommatus'] }
      },
      {
        id: 'flower', label: 'Discover a flowering plant', count: 1,
        match: { emojis: ['🌸', '🌺', '🌻'], keywords: ['flower', 'clover', 'dandelion', 'hawthorn', 'rosemary', 'taraxacum', 'trifolium', 'crataegus', 'salvia'] }
      },
    ]
  },
  {
    id: 'forest-explorer',
    name: 'Forest Explorer',
    emoji: '🌲',
    description: 'Venture into woodlands and catalog its rich biodiversity.',
    difficulty: 'MEDIUM',
    badge: { emoji: '🌲', label: 'Forest Explorer' },
    bonusPoints: 250,
    tasks: [
      {
        id: 'trees', label: 'Identify 2 different tree species', count: 2,
        match: { emojis: ['🌲'], keywords: ['oak', 'pine', 'cedar', 'maple', 'ivy', 'quercus', 'cedrus', 'acer', 'hedera', 'hawthorn', 'crataegus'] }
      },
      {
        id: 'fungi', label: 'Find a mushroom or fungus', count: 1,
        match: { emojis: ['🍄'], keywords: ['mushroom', 'fungus', 'armillaria', 'amanita', 'honey fungus'] }
      },
      {
        id: 'insect', label: 'Spot a woodland insect', count: 1,
        match: { emojis: ['🦋'], keywords: ['butterfly', 'moth', 'beetle', 'peacock', 'aglais', 'pipistrelle'] }
      },
    ]
  },
  {
    id: 'bird-watcher',
    name: 'Bird Watcher Challenge',
    emoji: '🐦',
    description: 'Track and identify diverse bird species in your local area.',
    difficulty: 'EASY',
    badge: { emoji: '🦅', label: 'Bird Watcher' },
    bonusPoints: 200,
    tasks: [
      {
        id: 'birds', label: 'Identify 3 different bird species', count: 3,
        match: { emojis: ['🐦'], keywords: ['bird', 'robin', 'sparrow', 'pigeon', 'hawk', 'falcon', 'tit', 'kestrel', 'mallard', 'blackbird', 'kite', 'turdus', 'passer', 'columba', 'buteo', 'falco', 'parus', 'anas', 'milvus'] }
      },
    ]
  },
  {
    id: 'mammal-tracker',
    name: 'Mammal Tracker',
    emoji: '🐾',
    description: 'Search for signs of mammals in your local environment.',
    difficulty: 'MEDIUM',
    badge: { emoji: '🦊', label: 'Mammal Tracker' },
    bonusPoints: 220,
    tasks: [
      {
        id: 'mammals', label: 'Spot 2 different mammal species', count: 2,
        match: { emojis: ['🐾', '🦌'], keywords: ['fox', 'squirrel', 'bat', 'rabbit', 'deer', 'hedgehog', 'vole', 'pipistrelle', 'vulpes', 'sciurus', 'pipistrellus'] }
      },
    ]
  },
  {
    id: 'rare-species-hunter',
    name: 'Rare Species Hunter',
    emoji: '🔴',
    description: 'Seek out threatened species that need our urgent protection.',
    difficulty: 'HARD',
    badge: { emoji: '🚨', label: 'Rare Species Hunter' },
    bonusPoints: 500,
    tasks: [
      {
        id: 'vulnerable', label: 'Find a Vulnerable species', count: 1,
        match: { statusIn: ['Vulnerable'] }
      },
      {
        id: 'endangered', label: 'Find an Endangered or Critically Endangered species', count: 1,
        match: { statusIn: ['Endangered', 'Critically Endangered'] }
      },
    ]
  },
  {
    id: 'spring-wildflower',
    name: 'Spring Wildflower Survey',
    emoji: '🌼',
    description: 'Document spring blooms across meadows and hedgerows.',
    difficulty: 'EASY',
    season: [3, 4, 5],
    badge: { emoji: '🌼', label: 'Wildflower Surveyor' },
    bonusPoints: 180,
    tasks: [
      {
        id: 'flowers', label: 'Document 3 flowering plant species', count: 3,
        match: { emojis: ['🌸', '🌺', '🌻'], keywords: ['flower', 'clover', 'dandelion', 'hawthorn', 'rosemary', 'nettle', 'trifolium', 'crataegus', 'taraxacum', 'hedera'] }
      },
      {
        id: 'pollinator', label: 'Find a spring pollinator', count: 1,
        match: { emojis: ['🦋'], keywords: ['bee', 'butterfly', 'moth', 'bombus', 'apis', 'aglais'] }
      },
    ]
  },
  {
    id: 'autumn-fungi',
    name: 'Autumn Fungi Foray',
    emoji: '🍄',
    description: 'Hunt for mushrooms and fungi in the autumn landscape.',
    difficulty: 'MEDIUM',
    season: [9, 10, 11],
    badge: { emoji: '🍄', label: 'Fungi Forager' },
    bonusPoints: 220,
    tasks: [
      {
        id: 'fungi', label: 'Identify 2 different fungi species', count: 2,
        match: { emojis: ['🍄'], keywords: ['mushroom', 'fungus', 'armillaria', 'amanita'] }
      },
      {
        id: 'tree', label: 'Identify an autumn tree', count: 1,
        match: { emojis: ['🌲'], keywords: ['oak', 'maple', 'beech', 'ash', 'quercus', 'acer', 'japanese maple', 'atlas cedar'] }
      },
    ]
  },
  {
    id: 'amphibian-watch',
    name: 'Wetlands & Amphibian Watch',
    emoji: '🐸',
    description: 'Explore wetland habitats and spot amphibians and water birds.',
    difficulty: 'EXPERT',
    badge: { emoji: '🐸', label: 'Wetlands Warden' },
    bonusPoints: 400,
    tasks: [
      {
        id: 'amphibian', label: 'Find an amphibian species', count: 1,
        match: { emojis: ['🐸'], keywords: ['frog', 'toad', 'newt', 'salamander', 'rana', 'bufo', 'triturus'] }
      },
      {
        id: 'waterbird', label: 'Spot a water bird', count: 1,
        match: { emojis: ['🐦'], keywords: ['duck', 'heron', 'mallard', 'moorhen', 'coot', 'kingfisher', 'anas', 'ardea'] }
      },
      {
        id: 'wetplant', label: 'Find a wetland plant', count: 1,
        match: { emojis: ['🌿', '🌱'], keywords: ['reed', 'bulrush', 'watercress', 'iris', 'rush', 'sedge', 'nettle', 'urtica'] }
      },
    ]
  },
]

function taskMatches(matchCriteria, result) {
  const nameLower = (result.name || '').toLowerCase()
  const latinLower = (result.latin || '').toLowerCase()
  if (matchCriteria.emojis && matchCriteria.emojis.includes(result.emoji)) return true
  if (matchCriteria.keywords && matchCriteria.keywords.some(kw => nameLower.includes(kw) || latinLower.includes(kw))) return true
  if (matchCriteria.statusIn && matchCriteria.statusIn.includes(result.status)) return true
  return false
}

export function getExpeditionProgress() {
  try { return JSON.parse(localStorage.getItem('species_expeditions') || '{}') } catch { return {} }
}

function saveExpeditionProgress(data) {
  try { localStorage.setItem('species_expeditions', JSON.stringify(data)) } catch {}
}

export function checkExpeditionProgress(result) {
  const progress = getExpeditionProgress()
  const notifications = []

  for (const exp of EXPEDITIONS) {
    if (!progress[exp.id]) {
      progress[exp.id] = {
        tasks: Object.fromEntries(
          exp.tasks.map(t => [t.id, { found: [], needed: t.count, completed: false }])
        ),
        completedAt: null
      }
    }

    const expP = progress[exp.id]
    if (expP.completedAt) continue

    for (const task of exp.tasks) {
      if (!expP.tasks[task.id]) {
        expP.tasks[task.id] = { found: [], needed: task.count, completed: false }
      }
      const taskP = expP.tasks[task.id]
      if (taskP.completed) continue

      if (taskMatches(task.match, result) && !taskP.found.includes(result.name)) {
        taskP.found.push(result.name)
        if (taskP.found.length >= task.count) {
          taskP.completed = true
          notifications.push({ type: 'task', expeditionId: exp.id, expeditionName: exp.name, taskLabel: task.label })
        }
      }
    }

    const allDone = exp.tasks.every(t => expP.tasks[t.id]?.completed)
    if (allDone && !expP.completedAt) {
      expP.completedAt = new Date().toISOString()
      notifications.push({ type: 'expedition', expeditionId: exp.id, expeditionName: exp.name, badge: exp.badge, bonusPoints: exp.bonusPoints })
    }
  }

  saveExpeditionProgress(progress)
  return notifications
}

export default function Expeditions({ progress }) {
  const [expandedId, setExpandedId] = useState(null)
  const month = new Date().getMonth() + 1

  const processed = EXPEDITIONS.map(exp => {
    const p = progress?.[exp.id] || { tasks: {}, completedAt: null }
    const isCompleted = !!p.completedAt
    const inSeason = !exp.season || exp.season.includes(month)

    const taskStats = exp.tasks.map(t => {
      const tp = p.tasks?.[t.id] || { found: [], needed: t.count, completed: false }
      return {
        ...t,
        foundCount: tp.found?.length || 0,
        foundSpecies: tp.found || [],
        completed: tp.completed || false,
      }
    })

    const doneTasks = taskStats.filter(t => t.completed).length
    const totalTasks = exp.tasks.length
    const pct = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0

    return { ...exp, isCompleted, inSeason, taskStats, doneTasks, totalTasks, pct }
  })

  const sorted = [...processed].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1
    const aScore = (a.inSeason ? 1000 : 0) + a.pct
    const bScore = (b.inSeason ? 1000 : 0) + b.pct
    return bScore - aScore
  })

  const completedCount = processed.filter(e => e.isCompleted).length
  const inProgressCount = processed.filter(e => !e.isCompleted && e.pct > 0).length

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid rgba(52,211,153,0.15)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#34d399' }}>{completedCount}</span>
            <span style={{ fontSize: 11, color: '#5a8a76', marginLeft: 6 }}>/ {EXPEDITIONS.length} expeditions complete</span>
          </div>
          {inProgressCount > 0 && (
            <span style={{ fontSize: 10, color: '#fbbf24' }}>⚡ {inProgressCount} active</span>
          )}
        </div>

        {/* Earned badges */}
        {completedCount > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
            {processed.filter(e => e.isCompleted).map(e => (
              <span
                key={e.id}
                title={e.badge.label}
                style={{ fontSize: 18, filter: 'drop-shadow(0 0 5px rgba(251,191,36,0.6))' }}
              >
                {e.badge.emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expedition list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        {sorted.map(exp => {
          const isExpanded = expandedId === exp.id
          const diffColor = DIFFICULTY_COLORS[exp.difficulty] || '#22c55e'
          const borderColor = exp.isCompleted
            ? 'rgba(251,191,36,0.5)'
            : exp.pct > 0
              ? 'rgba(52,211,153,0.4)'
              : 'rgba(52,211,153,0.15)'

          return (
            <div
              key={exp.id}
              style={{
                marginBottom: 8, borderRadius: 4, overflow: 'hidden',
                border: `1px solid ${borderColor}`,
                borderTop: `2px solid ${exp.isCompleted ? '#fbbf24' : exp.pct > 0 ? '#34d399' : borderColor}`,
                background: exp.isCompleted ? 'rgba(251,191,36,0.04)' : exp.pct > 0 ? 'rgba(52,211,153,0.03)' : '#0a1a14',
                opacity: !exp.inSeason && !exp.isCompleted ? 0.5 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              {/* Card header */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                style={{ padding: '10px 12px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1 }}>{exp.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, lineHeight: 1.3,
                        color: exp.isCompleted ? '#fbbf24' : '#e2f5ee',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {exp.name}
                      </span>
                      <span style={{ fontSize: 10, color: '#5a8a76', flexShrink: 0 }}>
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{
                        fontSize: 8, padding: '1px 5px', fontWeight: 700, letterSpacing: 0.5,
                        background: `${diffColor}20`, color: diffColor,
                        border: `1px solid ${diffColor}40`, borderRadius: 2
                      }}>
                        {exp.difficulty}
                      </span>
                      <span style={{ fontSize: 9, color: '#fbbf24' }}>+{exp.bonusPoints}pts</span>
                      {exp.season && (
                        <span style={{
                          fontSize: 8, padding: '1px 5px', borderRadius: 2, letterSpacing: 0.5,
                          background: exp.inSeason ? 'rgba(52,211,153,0.1)' : 'rgba(90,138,118,0.06)',
                          color: exp.inSeason ? '#34d399' : '#5a8a76',
                          border: `1px solid ${exp.inSeason ? 'rgba(52,211,153,0.3)' : 'rgba(90,138,118,0.15)'}`
                        }}>
                          {exp.inSeason ? '🌿 IN SEASON' : '❄ SEASONAL'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: '#5a8a76', letterSpacing: 0.5 }}>
                      {exp.isCompleted ? '✓ COMPLETED' : `${exp.doneTasks} / ${exp.totalTasks} TASKS`}
                    </span>
                    {exp.isCompleted && <span style={{ fontSize: 11 }}>{exp.badge.emoji}</span>}
                  </div>
                  <div style={{ height: 3, background: 'rgba(52,211,153,0.08)', borderRadius: 2 }}>
                    <div style={{
                      height: 3, borderRadius: 2, transition: 'width 0.5s ease',
                      width: `${exp.pct}%`,
                      background: exp.isCompleted
                        ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                        : 'linear-gradient(90deg, #22c55e, #6ee7b7)'
                    }} />
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid rgba(52,211,153,0.08)', padding: '8px 12px 12px' }}>
                  <p style={{ fontSize: 10, color: '#5a8a76', margin: '0 0 10px', lineHeight: 1.6 }}>
                    {exp.description}
                  </p>

                  {/* Task list */}
                  {exp.taskStats.map((task, i) => (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex', gap: 8, padding: '7px 0',
                        borderBottom: i < exp.taskStats.length - 1 ? '1px solid rgba(52,211,153,0.06)' : 'none',
                        alignItems: 'flex-start'
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: 15, height: 15, flexShrink: 0, marginTop: 1, borderRadius: 2,
                        background: task.completed ? 'rgba(34,197,94,0.2)' : 'rgba(52,211,153,0.06)',
                        border: `1px solid ${task.completed ? '#22c55e' : 'rgba(52,211,153,0.2)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, color: '#22c55e', fontWeight: 800
                      }}>
                        {task.completed ? '✓' : ''}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 11, lineHeight: 1.4,
                          color: task.completed ? '#e2f5ee' : '#5a8a76'
                        }}>
                          {task.label}
                        </div>
                        {task.count > 1 && (
                          <div style={{ fontSize: 9, color: '#5a8a76', marginTop: 2 }}>
                            {task.foundCount} / {task.count} found
                            {task.foundSpecies.length > 0 && (
                              <span style={{ color: '#34d399', marginLeft: 4 }}>
                                ({task.foundSpecies.slice(0, 2).join(', ')}{task.foundSpecies.length > 2 ? '…' : ''})
                              </span>
                            )}
                          </div>
                        )}
                        {task.count === 1 && task.foundSpecies.length > 0 && (
                          <div style={{ fontSize: 9, color: '#34d399', marginTop: 1 }}>
                            {task.foundSpecies[0]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Completed badge */}
                  {exp.isCompleted && (
                    <div style={{
                      marginTop: 10, padding: '10px 8px', textAlign: 'center',
                      background: 'rgba(251,191,36,0.08)',
                      border: '1px solid rgba(251,191,36,0.25)', borderRadius: 3
                    }}>
                      <div style={{ fontSize: 24 }}>{exp.badge.emoji}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', marginTop: 3 }}>
                        {exp.badge.label}
                      </div>
                      <div style={{ fontSize: 9, color: '#5a8a76', marginTop: 1, letterSpacing: 1 }}>
                        BADGE EARNED
                      </div>
                    </div>
                  )}

                  {/* Out-of-season notice */}
                  {!exp.inSeason && !exp.isCompleted && exp.season && (
                    <div style={{
                      marginTop: 8, padding: '5px 8px', fontSize: 9, color: '#5a8a76',
                      background: 'rgba(90,138,118,0.06)', border: '1px solid rgba(90,138,118,0.12)',
                      borderRadius: 2, textAlign: 'center', letterSpacing: 0.5
                    }}>
                      ACTIVE IN {exp.season.map(m => MONTH_NAMES[m - 1].toUpperCase()).join(' · ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
