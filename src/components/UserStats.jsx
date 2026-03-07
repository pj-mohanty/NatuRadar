import { useState, useEffect } from 'react'

const BADGES = [
  { id: 'first_scan', emoji: '🌱', label: 'First Scan', desc: 'Identified your first species', category: 'Starter', condition: (stats) => stats.totalScans >= 1 },
  { id: 'endangered_found', emoji: '🚨', label: 'Guardian', desc: 'Found an endangered species', category: 'Rare', condition: (stats) => stats.endangeredFound >= 1 },
  { id: 'five_species', emoji: '🔥', label: 'On Fire', desc: '5 species this week', category: 'Momentum', condition: (stats) => stats.weekScans >= 5 },
  { id: 'three_today', emoji: '⚡', label: 'Active Scout', desc: '3 species today', category: 'Daily', condition: (stats) => stats.todayScans >= 3 },
  { id: 'critical_found', emoji: '💀', label: 'Rare Finder', desc: 'Found a critically endangered species', category: 'Elite', condition: (stats) => stats.criticalFound >= 1 },
  { id: 'hotspot', emoji: '🌍', label: 'Hotspot Hero', desc: 'Contributed to a biodiversity hotspot', category: 'Impact', condition: (stats) => stats.totalScans >= 3 },
  { id: 'ten_scans', emoji: '🏆', label: 'Conservation Hero', desc: '10 total species identified', category: 'Milestone', condition: (stats) => stats.totalScans >= 10 },
]

function getWeekKey(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function loadStats() {
  try {
    const raw = sessionStorage.getItem('species_signal_stats')
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        totalScans: 0,
        todayScans: 0,
        weekScans: 0,
        endangeredFound: 0,
        criticalFound: 0,
        earnedBadges: [],
        lastScanDate: null,
        lastWeekKey: null,
        bioScoreHistory: [],
        ...parsed
      }
    }
  } catch {}

  return {
    totalScans: 0,
    todayScans: 0,
    weekScans: 0,
    endangeredFound: 0,
    criticalFound: 0,
    earnedBadges: [],
    lastScanDate: null,
    lastWeekKey: null,
    bioScoreHistory: []
  }
}

function saveStats(stats) {
  try {
    sessionStorage.setItem('species_signal_stats', JSON.stringify(stats))
  } catch {}
}

export function updateStats(result, currentBioScore) {
  const stats = loadStats()
  const today = new Date().toDateString()
  const weekKey = getWeekKey()

  if (stats.lastScanDate !== today) {
    stats.todayScans = 0
  }

  if (stats.lastWeekKey !== weekKey) {
    stats.weekScans = 0
  }

  stats.totalScans += 1
  stats.todayScans += 1
  stats.weekScans += 1
  stats.lastScanDate = today
  stats.lastWeekKey = weekKey

  if (['Endangered', 'Critically Endangered'].includes(result.status)) {
    stats.endangeredFound += 1
  }

  if (result.status === 'Critically Endangered') {
    stats.criticalFound += 1
  }

  const now = new Date()
  stats.bioScoreHistory = [
    ...stats.bioScoreHistory.slice(-13),
    {
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      score: currentBioScore
    }
  ]

  const newBadges = []
  BADGES.forEach((b) => {
    if (!stats.earnedBadges.includes(b.id) && b.condition(stats)) {
      stats.earnedBadges.push(b.id)
      newBadges.push(b)
    }
  })

  saveStats(stats)
  return { stats, newBadges }
}

export function getStats() {
  const stats = loadStats()
  const today = new Date().toDateString()
  const weekKey = getWeekKey()

  if (stats.lastScanDate !== today) {
    stats.todayScans = 0
  }

  if (stats.lastWeekKey !== weekKey) {
    stats.weekScans = 0
    stats.lastWeekKey = weekKey
  }

  saveStats(stats)
  return stats
}

export function ImpactFlash({ result, scoreDelta, cityName, onDone }) {
  const [phase, setPhase] = useState('in')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 300)
    const t2 = setTimeout(() => setPhase('out'), 2800)
    const t3 = setTimeout(() => onDone(), 3200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onDone])

  const STATUS_COLORS = {
    'Least Concern': '#22c55e',
    'Near Threatened': '#eab308',
    'Vulnerable': '#f97316',
    'Endangered': '#ef4444',
    'Critically Endangered': '#dc2626',
    'Unknown': '#60a5fa'
  }

  const color = STATUS_COLORS[result?.status] || '#22c55e'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        background: phase === 'out' ? 'transparent' : 'rgba(0,0,0,0.45)',
        transition: 'background 0.4s'
      }}
    >
      <div
        style={{
          background: 'rgba(8,20,16,0.96)',
          border: `2px solid ${color}`,
          borderRadius: 12,
          padding: '28px 36px',
          textAlign: 'center',
          maxWidth: 340,
          boxShadow: `0 0 60px ${color}44`,
          backdropFilter: 'blur(12px)',
          transform:
            phase === 'in'
              ? 'scale(0.7)'
              : phase === 'out'
                ? 'scale(0.85)'
                : 'scale(1)',
          opacity: phase === 'out' ? 0 : 1,
          transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s'
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 8 }}>{result?.emoji || '🌿'}</div>

        <div style={{ fontWeight: 800, fontSize: 18, color: '#e2f5ee', marginBottom: 4 }}>
          {result?.name}
        </div>

        <div style={{ fontStyle: 'italic', fontSize: 12, color: '#7bb79f', marginBottom: 16 }}>
          {result?.latin}
        </div>

        <div
          style={{
            background: `${color}15`,
            border: `1px solid ${color}44`,
            borderRadius: 8,
            padding: '10px 16px',
            marginBottom: 12
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: '#7bb79f',
              marginBottom: 4,
              letterSpacing: 1
            }}
          >
            YOUR IMPACT ON {cityName?.toUpperCase()}
          </div>

          <div style={{ fontSize: 26, fontWeight: 800, color }}>
            {scoreDelta >= 0 ? '+' : ''}
            {scoreDelta} pts
          </div>

          <div style={{ fontSize: 11, color: '#7bb79f', marginTop: 2 }}>
            to BioScore™
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#7bb79f' }}>
          Your scan is now live on the global map 🌍
        </div>
      </div>
    </div>
  )
}

export default function UserStats({ stats, cityName }) {
  const earned = BADGES.filter(b => stats.earnedBadges?.includes(b.id))
  const locked = BADGES.filter(b => !stats.earnedBadges?.includes(b.id))

  return (
    <div
      style={{
        padding: '12px 16px 14px',
        borderBottom: '1px solid rgba(52,211,153,0.15)'
      }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Today', value: stats.todayScans || 0, color: '#34d399' },
          { label: 'This Week', value: stats.weekScans || 0, color: '#fbbf24' },
          { label: 'Total', value: stats.totalScans || 0, color: '#60a5fa' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              flex: 1,
              textAlign: 'center',
              background: `linear-gradient(180deg, ${color}14 0%, rgba(255,255,255,0.02) 100%)`,
              border: `1px solid ${color}2f`,
              borderRadius: 10,
              padding: '8px 6px',
              boxShadow: `inset 0 0 18px ${color}10`
            }}
          >
            <div style={{ fontSize: 19, fontWeight: 900, color, lineHeight: 1.1 }}>
              {value}
            </div>
            <div
              style={{
                fontSize: 9,
                color: '#86bba4',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginTop: 4,
                fontWeight: 700
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {stats.todayScans > 0 && (
        <div
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: '#fbbf24',
            marginBottom: 12,
            background: 'linear-gradient(180deg, rgba(251,191,36,0.10) 0%, rgba(251,191,36,0.05) 100%)',
            border: '1px solid rgba(251,191,36,0.24)',
            borderRadius: 8,
            padding: '6px 10px',
            fontWeight: 600
          }}
        >
          🔥 {stats.todayScans} scan{stats.todayScans !== 1 ? 's' : ''} today — keep going!
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 2.2,
            color: '#d8fff0',
            textTransform: 'uppercase',
            fontWeight: 800
          }}
        >
          Badges
        </div>

        <div
          style={{
            fontSize: 10,
            color: '#8fd8b8',
            fontWeight: 700,
            background: 'rgba(52,211,153,0.10)',
            border: '1px solid rgba(52,211,153,0.20)',
            borderRadius: 999,
            padding: '2px 8px'
          }}
        >
          {earned.length}/{BADGES.length}
        </div>
      </div>

      {earned.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 10,
              color: '#9ce6c6',
              fontWeight: 800,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
              marginBottom: 7
            }}
          >
            Unlocked
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {earned.map((b) => (
              <div
                key={b.id}
                title={b.desc}
                style={{
                  minWidth: 'calc(50% - 4px)',
                  flex: 1,
                  background: 'linear-gradient(180deg, rgba(52,211,153,0.14) 0%, rgba(52,211,153,0.08) 100%)',
                  border: '1px solid rgba(52,211,153,0.26)',
                  borderRadius: 10,
                  padding: '8px 9px',
                  boxShadow: 'inset 0 0 18px rgba(52,211,153,0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontSize: 18, lineHeight: 1 }}>{b.emoji}</div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#e6fff5',
                        fontWeight: 800,
                        marginBottom: 4
                      }}
                    >
                      {b.label}
                    </div>

                    <div
                      style={{
                        display: 'inline-block',
                        fontSize: 9,
                        color: '#b8ffe1',
                        background: 'rgba(52,211,153,0.16)',
                        border: '1px solid rgba(52,211,153,0.30)',
                        padding: '2px 6px',
                        borderRadius: 999,
                        fontWeight: 800,
                        letterSpacing: 0.6,
                        marginBottom: 5
                      }}
                    >
                      {b.category}
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        color: '#9bcdb8',
                        lineHeight: 1.4
                      }}
                    >
                      {b.desc}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div
          style={{
            fontSize: 10,
            color: '#86bba4',
            fontWeight: 800,
            letterSpacing: 1.6,
            textTransform: 'uppercase',
            marginBottom: 7
          }}
        >
          Locked
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {locked.map((b) => (
            <div
              key={b.id}
              title={`Locked: ${b.desc}`}
              style={{
                minWidth: 'calc(50% - 4px)',
                flex: 1,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                padding: '8px 9px',
                opacity: 0.62
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ fontSize: 18, lineHeight: 1, filter: 'grayscale(0.2)' }}>
                  {b.emoji}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#bfd8cd',
                      fontWeight: 800,
                      marginBottom: 4
                    }}
                  >
                    {b.label}
                  </div>

                  <div
                    style={{
                      display: 'inline-block',
                      fontSize: 9,
                      color: '#d5f7e8',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      padding: '2px 6px',
                      borderRadius: 999,
                      fontWeight: 800,
                      letterSpacing: 0.6,
                      marginBottom: 5
                    }}
                  >
                    {b.category}
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      color: '#84a99a',
                      lineHeight: 1.4
                    }}
                  >
                    {b.desc}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {earned.length === 0 && (
        <div
          style={{
            fontSize: 11,
            color: '#7aa994',
            marginTop: 10,
            textAlign: 'center'
          }}
        >
          Scan a species to earn your first badge 🌱
        </div>
      )}
    </div>
  )
}