import { useMemo } from 'react'

const STATUS_COLORS = {
  'Least Concern': '#22c55e',
  'Near Threatened': '#eab308',
  'Vulnerable': '#f97316',
  'Endangered': '#ef4444',
  'Critically Endangered': '#dc2626',
  'Unknown': '#60a5fa'
}

function getPlayerStatsFromSightings(sightings = []) {
  const byUser = {}

  sightings.forEach((s) => {
    const username = s.username || s.observer || 'Anonymous'
    const userId = s.userId || username

    if (!byUser[userId]) {
      byUser[userId] = {
        userId,
        username,
        totalSightings: 0,
        rareFinds: 0,
        criticalFinds: 0,
        totalConfidence: 0,
        score: 0,
        latestSeenAt: 0,
        speciesSet: new Set()
      }
    }

    const p = byUser[userId]
    p.totalSightings += 1
    p.totalConfidence += s.confidence || 0
    p.speciesSet.add(s.name || s.latin || 'Unknown species')

    if (['Vulnerable', 'Endangered', 'Critically Endangered'].includes(s.status)) {
      p.rareFinds += 1
    }

    if (s.status === 'Critically Endangered') {
      p.criticalFinds += 1
    }

    const weight = {
      'Least Concern': 10,
      'Near Threatened': 20,
      'Vulnerable': 40,
      'Endangered': 70,
      'Critically Endangered': 120,
      'Unknown': 8
    }[s.status] || 8

    p.score += weight + Math.round((s.confidence || 0) / 10)

    const ts = s.createdAt || s.observedAt
    const seenAt = ts ? new Date(ts).getTime() : 0
    if (seenAt > p.latestSeenAt) p.latestSeenAt = seenAt
  })

  return Object.values(byUser)
    .map((p) => ({
      ...p,
      uniqueSpecies: p.speciesSet.size,
      avgConfidence: p.totalSightings
        ? Math.round(p.totalConfidence / p.totalSightings)
        : 0
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (b.rareFinds !== a.rareFinds) return b.rareFinds - a.rareFinds
      return b.totalSightings - a.totalSightings
    })
    .map((p, i) => ({
      ...p,
      rank: i + 1
    }))
}

function formatLastSeen(ts) {
  if (!ts) return 'No recent activity'
  const d = new Date(ts)
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function getRankAccent(rank) {
  if (rank === 1) return '#fbbf24'
  if (rank === 2) return '#cbd5e1'
  if (rank === 3) return '#f59e0b'
  return '#34d399'
}

function getRankGlow(rank) {
  if (rank === 1) return '0 0 28px rgba(251,191,36,0.28)'
  if (rank === 2) return '0 0 24px rgba(203,213,225,0.20)'
  if (rank === 3) return '0 0 24px rgba(245,158,11,0.18)'
  return '0 0 18px rgba(52,211,153,0.10)'
}

function PodiumCard({ player, height, currentUserId }) {
  if (!player) {
    return (
      <div
        style={{
          height,
          borderRadius: 18,
          border: '1px dashed rgba(140,199,174,0.18)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#648879',
          fontSize: 12,
          fontWeight: 700
        }}
      >
        Waiting for challenger
      </div>
    )
  }

  const accent = getRankAccent(player.rank)
  const isYou = player.userId === currentUserId

  return (
    <div
      style={{
        height,
        borderRadius: 18,
        border: `1px solid ${isYou ? '#8b5cf6' : `${accent}44`}`,
        background: isYou
          ? 'linear-gradient(180deg, rgba(139,92,246,0.14) 0%, rgba(8,18,14,0.96) 100%)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(8,18,14,0.96) 100%)',
        padding: '16px 14px',
        boxShadow: getRankGlow(player.rank),
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.12
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 10px',
            borderRadius: 999,
            background: `${accent}18`,
            border: `1px solid ${accent}38`,
            color: accent,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            marginBottom: 12
          }}
        >
          #{player.rank}
          {isYou && <span style={{ color: '#c4b5fd' }}>You</span>}
        </div>

        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: '#ecfff6',
            marginBottom: 6,
            lineHeight: 1.1
          }}
        >
          {player.username}
        </div>

        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: accent,
            lineHeight: 1,
            marginBottom: 12
          }}
        >
          {player.score}
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <MiniStat label="Scans" value={player.totalSightings} />
          <MiniStat label="Rare Finds" value={player.rareFinds} />
          <MiniStat label="Species" value={player.uniqueSpecies} />
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 11,
        color: '#9ccfb9',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        paddingBottom: 6
      }}
    >
      <span>{label}</span>
      <span style={{ color: '#e7fff4', fontWeight: 800 }}>{value}</span>
    </div>
  )
}

function LeaderRow({ player, currentUserId }) {
  const accent = getRankAccent(player.rank)
  const isYou = player.userId === currentUserId

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '72px minmax(140px, 1.4fr) 1fr 1fr 1fr 1fr',
        gap: 12,
        alignItems: 'center',
        padding: '14px 16px',
        borderRadius: 14,
        border: `1px solid ${isYou ? 'rgba(139,92,246,0.42)' : 'rgba(52,211,153,0.10)'}`,
        background: isYou
          ? 'linear-gradient(180deg, rgba(139,92,246,0.10), rgba(255,255,255,0.02))'
          : 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))',
        boxShadow: isYou ? '0 0 22px rgba(139,92,246,0.10)' : 'none'
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 46,
          height: 46,
          borderRadius: '50%',
          background: `${accent}16`,
          border: `1px solid ${accent}38`,
          color: accent,
          fontWeight: 900,
          fontSize: 15
        }}
      >
        #{player.rank}
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: '#ecfff6',
            marginBottom: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap'
          }}
        >
          {player.username}
          {isYou && (
            <span
              style={{
                fontSize: 10,
                padding: '3px 8px',
                borderRadius: 999,
                background: 'rgba(139,92,246,0.18)',
                border: '1px solid rgba(139,92,246,0.30)',
                color: '#c4b5fd',
                fontWeight: 800,
                letterSpacing: 0.8,
                textTransform: 'uppercase'
              }}
            >
              You
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#7db49c' }}>
          Last active: {formatLastSeen(player.latestSeenAt)}
        </div>
      </div>

      <DataCell label="Score" value={player.score} valueColor={accent} />
      <DataCell label="Scans" value={player.totalSightings} />
      <DataCell label="Rare" value={player.rareFinds} />
      <DataCell label="Confidence" value={`${player.avgConfidence}%`} />
    </div>
  )
}

function DataCell({ label, value, valueColor = '#ecfff6' }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: 10,
          color: '#6e9f8a',
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          marginBottom: 4,
          fontWeight: 700
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          color: valueColor,
          fontWeight: 900
        }}
      >
        {value}
      </div>
    </div>
  )
}

export default function LeaderboardPage({ sightings = [], userId }) {
  const leaderboard = useMemo(() => getPlayerStatsFromSightings(sightings), [sightings])

  const topThree = leaderboard.slice(0, 3)
  const currentUserEntry = leaderboard.find((p) => p.userId === userId)
  const totalRareSightings = sightings.filter((s) =>
    ['Vulnerable', 'Endangered', 'Critically Endangered'].includes(s.status)
  ).length

  const totalCriticalSightings = sightings.filter((s) => s.status === 'Critically Endangered').length
  const totalObservers = leaderboard.length

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        background:
          'radial-gradient(circle at top left, rgba(52,211,153,0.07), transparent 24%), radial-gradient(circle at top right, rgba(139,92,246,0.08), transparent 20%), radial-gradient(circle at bottom right, rgba(96,165,250,0.06), transparent 24%), #050d0a',
        padding: '22px 24px 30px'
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto'
        }}
      >
        {/* Hero / header */}
        <div
          style={{
            position: 'relative',
            borderRadius: 22,
            border: '1px solid rgba(52,211,153,0.14)',
            background: 'linear-gradient(180deg, rgba(8,20,16,0.96) 0%, rgba(5,13,10,0.94) 100%)',
            padding: '22px 22px 18px',
            overflow: 'hidden',
            marginBottom: 20,
            boxShadow: '0 0 28px rgba(0,0,0,0.22)'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'linear-gradient(rgba(52,211,153,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.025) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              opacity: 0.18
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                fontSize: 11,
                color: '#8cd0b2',
                letterSpacing: 2.6,
                textTransform: 'uppercase',
                fontWeight: 800,
                marginBottom: 8
              }}
            >
              Global Field Rankings
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: 20,
                flexWrap: 'wrap'
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 'clamp(28px, 4vw, 44px)',
                    fontWeight: 900,
                    color: '#eafff4',
                    lineHeight: 1
                  }}
                >
                  Biodiversity Leaderboard
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 13,
                    color: '#8fbda9',
                    maxWidth: 760,
                    lineHeight: 1.7
                  }}
                >
                  Track the top explorers, rare-species spotters, and ecosystem scouts across the network.
                </div>
              </div>

              {currentUserEntry && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 16,
                    background: 'rgba(139,92,246,0.12)',
                    border: '1px solid rgba(139,92,246,0.26)',
                    minWidth: 220
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: '#c4b5fd',
                      letterSpacing: 1.6,
                      textTransform: 'uppercase',
                      fontWeight: 800,
                      marginBottom: 6
                    }}
                  >
                    Your Standing
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#ede9fe' }}>
                    #{currentUserEntry.rank}
                  </div>
                  <div style={{ fontSize: 12, color: '#b9a8ff', marginTop: 4 }}>
                    {currentUserEntry.score} points · {currentUserEntry.rareFinds} rare finds
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: 16,
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap'
              }}
            >
              <TopStat label="Observers" value={totalObservers} color="#34d399" />
              <TopStat label="Total Sightings" value={sightings.length} color="#60a5fa" />
              <TopStat label="Rare Sightings" value={totalRareSightings} color="#f97316" />
              <TopStat label="Critical Sightings" value={totalCriticalSightings} color="#ef4444" />
            </div>
          </div>
        </div>

        {/* Podium */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            marginBottom: 22
          }}
        >
          <PodiumCard player={topThree[1]} height={220} currentUserId={userId} />
          <PodiumCard player={topThree[0]} height={260} currentUserId={userId} />
          <PodiumCard player={topThree[2]} height={220} currentUserId={userId} />
        </div>

        {/* Full table */}
        <div
          style={{
            borderRadius: 20,
            border: '1px solid rgba(52,211,153,0.12)',
            background: 'linear-gradient(180deg, rgba(8,20,16,0.94), rgba(5,13,10,0.94))',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '16px 18px',
              borderBottom: '1px solid rgba(52,211,153,0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap'
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#9ad8ba',
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: 'uppercase'
              }}
            >
              Operator Rankings
            </div>
            <div style={{ fontSize: 12, color: '#6fa38c' }}>
              Sorted by score, rare finds, and total sightings
            </div>
          </div>

          <div style={{ padding: 16, display: 'grid', gap: 12 }}>
            {leaderboard.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#6f9f8c'
                }}
              >
                <div style={{ fontSize: 54, marginBottom: 12 }}>🏆</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#d7fff0' }}>
                  No leaderboard data yet
                </div>
                <div style={{ fontSize: 13, marginTop: 8 }}>
                  Start scanning species to populate the rankings.
                </div>
              </div>
            ) : (
              leaderboard.map((player) => (
                <LeaderRow
                  key={player.userId}
                  player={player}
                  currentUserId={userId}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TopStat({ label, value, color }) {
  return (
    <div
      style={{
        background: `${color}12`,
        border: `1px solid ${color}24`,
        borderRadius: 999,
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}
    >
      <span style={{ fontSize: 11, color, fontWeight: 900 }}>{value}</span>
      <span
        style={{
          fontSize: 10,
          color: '#b9ead4',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1
        }}
      >
        {label}
      </span>
    </div>
  )
}