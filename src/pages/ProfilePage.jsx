import { useMemo } from 'react'

function getProfileStats(sightings = [], userId, username) {
  const userSightings = sightings.filter(
    (s) =>
      s.userId === userId ||
      s.username === username ||
      s.observer === username
  )

  const rareFinds = userSightings.filter((s) =>
    ['Vulnerable', 'Endangered', 'Critically Endangered'].includes(s.status)
  ).length

  const criticalFinds = userSightings.filter(
    (s) => s.status === 'Critically Endangered'
  ).length

  const speciesSet = new Set(userSightings.map((s) => s.name || s.latin || 'Unknown'))

  const avgConfidence = userSightings.length
    ? Math.round(
        userSightings.reduce((sum, s) => sum + (s.confidence || 0), 0) / userSightings.length
      )
    : 0

  const latestSeenAt = userSightings.reduce((latest, s) => {
    const ts = s.createdAt || s.observedAt
    const seenAt = ts ? new Date(ts).getTime() : 0
    return seenAt > latest ? seenAt : latest
  }, 0)

  return {
    totalSightings: userSightings.length,
    rareFinds,
    criticalFinds,
    uniqueSpecies: speciesSet.size,
    avgConfidence,
    latestSeenAt
  }
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'NR'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

function formatLastSeen(ts) {
  if (!ts) return 'No recent activity'
  return new Date(ts).toLocaleDateString([], {
    month: 'short',
    day: 'numeric'
  })
}

export default function ProfilePage({
  sightings = [],
  username,
  userId,
  cityName = 'Unknown Area',
  isScientist = false,
  onLogout
}) {
  const stats = useMemo(
    () => getProfileStats(sightings, userId, username),
    [sightings, userId, username]
  )

  const initials = getInitials(username)

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        background:
          'radial-gradient(circle at top left, rgba(52,211,153,0.06), transparent 26%), radial-gradient(circle at bottom right, rgba(139,92,246,0.08), transparent 24%), #050d0a',
        padding: '24px'
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* HEADER */}
        <div
          style={{
            borderRadius: 18,
            padding: '26px',
            border: '1px solid rgba(52,211,153,0.16)',
            background:
              'linear-gradient(180deg, rgba(8,20,16,0.96) 0%, rgba(5,13,10,0.94) 100%)',
            marginBottom: 20,
            boxShadow: '0 0 24px rgba(0,0,0,0.22)'
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: '#8cd0b2',
              marginBottom: 14,
              fontWeight: 700
            }}
          >
            Explorer Profile
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              gap: 18,
              alignItems: 'center'
            }}
          >
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(180deg, rgba(52,211,153,0.22), rgba(96,165,250,0.18))',
                border: '1px solid rgba(52,211,153,0.28)',
                color: '#ecfff6',
                fontSize: 28,
                fontWeight: 900,
                boxShadow: '0 0 20px rgba(52,211,153,0.10)'
              }}
            >
              {initials}
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap'
                }}
              >
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: '#ecfff6'
                  }}
                >
                  {username}
                </div>

                <span
                  style={{
                    fontSize: 10,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: isScientist
                      ? 'rgba(96,165,250,0.18)'
                      : 'rgba(255,255,255,0.06)',
                    border: isScientist
                      ? '1px solid rgba(96,165,250,0.34)'
                      : '1px solid rgba(255,255,255,0.10)',
                    color: isScientist ? '#93c5fd' : '#9eb6ab',
                    fontWeight: 800,
                    letterSpacing: 1,
                    textTransform: 'uppercase'
                  }}
                >
                  {isScientist ? 'Scientist' : 'Explorer'}
                </span>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: '#6fa38c',
                  marginTop: 6
                }}
              >
                ID: {userId}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  flexWrap: 'wrap',
                  marginTop: 12,
                  fontSize: 12,
                  color: '#9ad0bb'
                }}
              >
                <span>📍 {cityName}</span>
                <span>🕐 Last active: {formatLastSeen(stats.latestSeenAt)}</span>
                <span>🧬 {stats.uniqueSpecies} species recorded</span>
              </div>
            </div>

            {!!onLogout && (
              <button
                onClick={onLogout}
                style={{
                  padding: '10px 16px',
                  borderRadius: 12,
                  border: '1px solid rgba(239,68,68,0.34)',
                  background:
                    'linear-gradient(180deg, rgba(239,68,68,0.14) 0%, rgba(239,68,68,0.06) 100%)',
                  color: '#f87171',
                  fontWeight: 800,
                  fontSize: 12,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '0 0 18px rgba(239,68,68,0.08)'
                }}
              >
                Logout
              </button>
            )}
          </div>
        </div>

        {/* STATS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
            gap: 16
          }}
        >
          <StatCard
            label="Total Scans"
            value={stats.totalSightings}
            color="#34d399"
          />

          <StatCard
            label="Rare Finds"
            value={stats.rareFinds}
            color="#f97316"
          />

          <StatCard
            label="Critical Finds"
            value={stats.criticalFinds}
            color="#ef4444"
          />

          <StatCard
            label="Species Discovered"
            value={stats.uniqueSpecies}
            color="#60a5fa"
          />

          <StatCard
            label="Avg Confidence"
            value={`${stats.avgConfidence}%`}
            color="#8b5cf6"
          />

          <StatCard
            label="Role"
            value={isScientist ? 'Scientist' : 'Explorer'}
            color={isScientist ? '#60a5fa' : '#22c55e'}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${color}33`,
        padding: '18px',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
        boxShadow: `0 0 14px ${color}10`
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: '#7fb19c',
          textTransform: 'uppercase',
          letterSpacing: 2,
          marginBottom: 6
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 26,
          fontWeight: 900,
          color
        }}
      >
        {value}
      </div>
    </div>
  )
}