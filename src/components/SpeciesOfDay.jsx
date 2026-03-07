import guineaPigImg from '../assets/guineapig.jpg'

const SOTD_SPECIES = {
  name: 'Cavia porcellus',
  latin: 'Cavia porcellus',
  commonName: 'Domestic Guinea Pig',
  emoji: '🐹',
  status: 'Least Concern',
  hint: 'Look for a small rounded pet rodent with short legs, tiny ears, and a gentle face.',
  image: guineaPigImg
}

const BONUS_POINTS = {
  'Least Concern': 20,
  'Near Threatened': 40,
  'Vulnerable': 80,
  'Endangered': 150,
  'Critically Endangered': 300
}

const DIFFICULTY = {
  'Least Concern': 'EASY',
  'Near Threatened': 'MEDIUM',
  'Vulnerable': 'HARD',
  'Endangered': 'EXPERT',
  'Critically Endangered': 'LEGENDARY'
}

const DIFFICULTY_COLORS = {
  'EASY': '#22c55e',
  'MEDIUM': '#eab308',
  'HARD': '#f97316',
  'EXPERT': '#ef4444',
  'LEGENDARY': '#dc2626'
}

const STATUS_COLORS = {
  'Least Concern': '#22c55e',
  'Near Threatened': '#eab308',
  'Vulnerable': '#f97316',
  'Endangered': '#ef4444',
  'Critically Endangered': '#dc2626'
}

function getTodayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export function getTodaySpecies() {
  return SOTD_SPECIES
}

export function checkSOTDMatch(resultName, resultLatin) {
  const sotd = getTodaySpecies()

  const nameLower = (resultName || '').toLowerCase().trim()
  const latinLower = (resultLatin || '').toLowerCase().trim()
  const sotdName = sotd.name.toLowerCase()
  const sotdLatin = sotd.latin.toLowerCase()
  const sotdCommon = (sotd.commonName || '').toLowerCase()

  return (
    nameLower === sotdName ||
    nameLower === sotdLatin ||
    nameLower === sotdCommon ||
    latinLower === sotdLatin ||
    nameLower.includes(sotdCommon) ||
    nameLower.includes(sotdLatin) ||
    latinLower.includes(sotdLatin) ||
    sotdCommon.includes(nameLower)
  )
}

export function markSOTDFound() {
  const key = getTodayKey()
  const data = getSOTDData()

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`

  const streak = data.lastFoundDate === yKey ? (data.streak || 0) + 1 : 1

  const updated = {
    ...data,
    found: { ...data.found, [key]: true },
    lastFoundDate: key,
    streak
  }

  try {
    localStorage.setItem('species_sotd', JSON.stringify(updated))
  } catch {}

  return streak
}

export function getSOTDData() {
  try {
    return JSON.parse(localStorage.getItem('species_sotd') || '{}')
  } catch {
    return {}
  }
}

export default function SpeciesOfDay({ foundToday }) {
  const sotd = getTodaySpecies()
  const data = getSOTDData()
  const streak = data.streak || 0
  const color = STATUS_COLORS[sotd.status] || '#22c55e'
  const difficulty = DIFFICULTY[sotd.status] || 'EASY'
  const diffColor = DIFFICULTY_COLORS[difficulty]
  const bonusPts = BONUS_POINTS[sotd.status] || 20

  return (
    <div
      style={{
        borderBottom: '1px solid rgba(52,211,153,0.15)',
        flexShrink: 0,
        padding: '10px 16px 14px'
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: 3,
          color: foundToday ? '#34d399' : '#fbbf24',
          fontWeight: 700,
          textTransform: 'uppercase',
          marginBottom: 10
        }}
      >
        {foundToday ? '✓ Species of the Day' : '◎ Species of the Day'}
      </div>

      <div
        style={{
          background: foundToday ? 'rgba(52,211,153,0.08)' : '#080f0c',
          border: `1px solid ${foundToday ? '#34d399' : color + '44'}`,
          borderRadius: 10,
          padding: 12,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {foundToday && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              left: 0,
              textAlign: 'center',
              padding: '4px 0',
              background: 'rgba(52,211,153,0.15)',
              fontSize: 10,
              color: '#34d399',
              fontWeight: 700,
              letterSpacing: 2
            }}
          >
            ✓ FOUND TODAY — +{bonusPts} BONUS PTS
          </div>
        )}

        {sotd.image && (
          <div
            style={{
              marginTop: foundToday ? 20 : 0,
              marginBottom: 12
            }}
          >
            <img
              src={sotd.image}
              alt={sotd.commonName}
              style={{
                width: '100%',
                height: 170,
                objectFit: 'cover',
                borderRadius: 8,
                border: `1px solid ${color}33`,
                display: 'block'
              }}
            />
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start'
          }}
        >
          {!sotd.image && (
            <div
              style={{
                width: 52,
                height: 52,
                flexShrink: 0,
                borderRadius: 4,
                background: `${color}15`,
                border: `1px solid ${color}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 30,
                filter: `drop-shadow(0 0 6px ${color}66)`
              }}
            >
              {sotd.emoji}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                gap: 6,
                marginBottom: 4,
                alignItems: 'center',
                flexWrap: 'wrap'
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  padding: '2px 6px',
                  background: `${diffColor}25`,
                  color: diffColor,
                  border: `1px solid ${diffColor}44`,
                  borderRadius: 2,
                  fontWeight: 700
                }}
              >
                {difficulty}
              </span>

              <span style={{ fontSize: 9, color: '#fbbf24' }}>
                +{bonusPts} pts
              </span>

              {streak > 0 && (
                <span style={{ fontSize: 9, color: '#fbbf24' }}>
                  🔥 {streak}d streak
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#e2f5ee',
                marginBottom: 2
              }}
            >
              {sotd.name}
            </div>

            <div
              style={{
                fontSize: 10,
                color: '#8ab49e',
                marginBottom: 4,
                fontWeight: 600,
                letterSpacing: 0.4
              }}
            >
              AKA {sotd.commonName}
            </div>

            <div
              style={{
                fontSize: 10,
                color: '#5a8a76',
                fontStyle: 'italic',
                marginBottom: 6
              }}
            >
              {sotd.latin}
            </div>

            <div style={{ fontSize: 11, color: '#8ab49e', lineHeight: 1.5 }}>
              💡 {sotd.hint}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}