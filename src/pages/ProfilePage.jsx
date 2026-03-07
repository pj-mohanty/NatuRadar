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

  return {
    totalSightings: userSightings.length,
    rareFinds,
    criticalFinds,
    uniqueSpecies: speciesSet.size,
    avgConfidence
  }
}

export default function ProfilePage({
  sightings = [],
  username,
  userId,
  onLogout
}) {
  const stats = useMemo(
    () => getProfileStats(sightings, userId, username),
    [sightings, userId, username]
  )

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
              marginBottom: 10,
              fontWeight: 700
            }}
          >
            Explorer Profile
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 18,
              alignItems: 'flex-start',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: '#ecfff6'
                }}
              >
                {username}
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
            </div>

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
            label="Explorer Rank"
            value="Field Scout"
            color="#22c55e"
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