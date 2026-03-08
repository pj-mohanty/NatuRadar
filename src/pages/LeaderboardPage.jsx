import { useMemo, useState } from 'react'

const STATUS_POINTS = {
  'Least Concern': 5,
  'Near Threatened': 20,
  'Vulnerable': 30,
  'Endangered': 50,
  'Critically Endangered': 100,
  'Unknown': 5
}

const CATEGORY_MAP = {
  '🐦': 'Birds',
  '🦅': 'Birds',
  '🌿': 'Plants',
  '🌱': 'Plants',
  '🌲': 'Plants',
  '🌸': 'Plants',
  '🌺': 'Plants',
  '🌻': 'Plants',
  '🌾': 'Plants',
  '🍄': 'Plants',
  '🦌': 'Mammals',
  '🐾': 'Mammals',
  '🐸': 'Amphibians',
  '🐟': 'Aquatic',
  '🐠': 'Aquatic',
  '🐬': 'Aquatic',
  '🐋': 'Aquatic',
  '🐚': 'Aquatic',
  '🦋': 'Insects',
  '🕷️': 'Insects',
  '🦎': 'Reptiles'
}

const CATEGORY_COLORS = {
  Birds: '#34d399',
  Plants: '#86efac',
  Mammals: '#f472b6',
  Insects: '#fbbf24',
  Amphibians: '#60a5fa',
  Aquatic: '#38bdf8',
  Reptiles: '#a78bfa',
  Other: '#94a3b8'
}

function normalizeName(name = '') {
  return String(name).trim().toLowerCase()
}

function getLastSeenValue(s) {
  if (s.timestamp?.toDate) return s.timestamp.toDate().getTime()
  const v = s.observedAt || s.createdAt
  return v ? new Date(v).getTime() : 0
}

function formatRelativeTime(ts) {
  if (!ts) return 'recently'
  const diffMin = Math.max(1, Math.floor((Date.now() - ts) / 60000))
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} d ago`
}

function getCategoryFromEmoji(emoji) {
  return CATEGORY_MAP[emoji] || 'Other'
}

function pseudoDistrictFromCoords(lat, lng) {
  lat = Number(lat)
  lng = Number(lng)
  if (Number.isNaN(lat) || Number.isNaN(lng)) return 'San Francisco'
  if (lng < -122.50) return 'Sunset'
  if (lng < -122.48) return 'Richmond'
  if (lng < -122.46) return 'Marina'
  if (lat > 37.79) return 'Castro'
  if (lat > 37.78) return 'SOMA'
  if (lat > 37.775) return 'Haight'
  if (lat > 37.77) return 'Noe Valley'
  if (lat > 37.765) return 'Excelsior'
  return 'Mission'
}

function buildFallbackLeaderboardFromSightings(sightings = []) {
  const byUser = {}

  sightings.forEach((s) => {
    const username = s.username || s.observer || 'Explorer'
    const usernameKey = s.usernameKey || normalizeName(username)

    if (!byUser[usernameKey]) {
      byUser[usernameKey] = {
        id: usernameKey,
        username,
        usernameKey,
        totalPoints: 0,
        totalScans: 0,
        rareFound: 0,
        endangeredFound: 0,
        lastScan: null,
        uniqueSpeciesSet: new Set()
      }
    }

    const row = byUser[usernameKey]
    row.username = username
    row.totalScans += 1
    row.totalPoints += STATUS_POINTS[s.status] || 5
    row.uniqueSpeciesSet.add(s.name || s.latin || 'Unknown species')

    if (['Near Threatened', 'Vulnerable'].includes(s.status)) {
      row.rareFound += 1
    }

    if (['Endangered', 'Critically Endangered'].includes(s.status)) {
      row.endangeredFound += 1
    }

    const seen = getLastSeenValue(s)
    const current = row.lastScan ? new Date(row.lastScan).getTime() : 0
    if (seen > current) {
      row.lastScan = s.observedAt || s.createdAt || new Date(seen).toISOString()
    }
  })

  return Object.values(byUser)
    .map((row) => ({
      ...row,
      uniqueSpecies: row.uniqueSpeciesSet.size
    }))
    .sort((a, b) => {
      if ((b.totalPoints || 0) !== (a.totalPoints || 0)) return (b.totalPoints || 0) - (a.totalPoints || 0)
      if ((b.endangeredFound || 0) !== (a.endangeredFound || 0)) return (b.endangeredFound || 0) - (a.endangeredFound || 0)
      return (b.totalScans || 0) - (a.totalScans || 0)
    })
}

function enrichLeaderboardFromSightings(leaderboardEntries = [], sightings = []) {
  if (!leaderboardEntries?.length) {
    return buildFallbackLeaderboardFromSightings(sightings)
  }

  const fallback = buildFallbackLeaderboardFromSightings(sightings)
  const fallbackMap = Object.fromEntries(
    fallback.map((row) => [row.usernameKey || row.id || normalizeName(row.username), row])
  )

  return [...leaderboardEntries]
    .map((entry) => {
      const key = entry.usernameKey || entry.id || normalizeName(entry.username)
      const extra = fallbackMap[key]

      return {
        ...entry,
        id: entry.id || key,
        usernameKey: key,
        username: entry.username || extra?.username || 'Explorer',
        totalPoints: entry.totalPoints ?? extra?.totalPoints ?? 0,
        totalScans: entry.totalScans ?? extra?.totalScans ?? 0,
        rareFound: entry.rareFound ?? extra?.rareFound ?? 0,
        endangeredFound: entry.endangeredFound ?? extra?.endangeredFound ?? 0,
        uniqueSpecies: extra?.uniqueSpecies ?? 0,
        lastScan: entry.lastScan || extra?.lastScan || null
      }
    })
    .sort((a, b) => {
      if ((b.totalPoints || 0) !== (a.totalPoints || 0)) return (b.totalPoints || 0) - (a.totalPoints || 0)
      if ((b.endangeredFound || 0) !== (a.endangeredFound || 0)) return (b.endangeredFound || 0) - (a.endangeredFound || 0)
      return (b.totalScans || 0) - (a.totalScans || 0)
    })
}

function buildDistrictActivity(sightings = []) {
  const districtMap = {}

  sightings.forEach((s) => {
    const key = pseudoDistrictFromCoords(s.lat, s.lng)
    districtMap[key] = (districtMap[key] || 0) + 1
  })

  return Object.entries(districtMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

function buildDistrictLeaderboard(sightings = []) {
  const byDistrict = {}

  sightings.forEach((s) => {
    const district = pseudoDistrictFromCoords(s.lat, s.lng)

    if (!byDistrict[district]) {
      byDistrict[district] = {
        id: district,
        name: district,
        totalPoints: 0,
        totalSightings: 0,
        rareSightings: 0,
        endangeredSightings: 0,
        speciesSet: new Set(),
        lastSeenAt: 0
      }
    }

    const row = byDistrict[district]
    row.totalPoints += STATUS_POINTS[s.status] || 5
    row.totalSightings += 1
    row.speciesSet.add(s.name || s.latin || 'Unknown species')

    if (['Near Threatened', 'Vulnerable'].includes(s.status)) {
      row.rareSightings += 1
    }

    if (['Endangered', 'Critically Endangered'].includes(s.status)) {
      row.endangeredSightings += 1
    }

    const ts = getLastSeenValue(s)
    if (ts > row.lastSeenAt) row.lastSeenAt = ts
  })

  return Object.values(byDistrict)
    .map((row) => ({
      ...row,
      uniqueSpecies: row.speciesSet.size
    }))
    .sort((a, b) => {
      if ((b.totalSightings || 0) !== (a.totalSightings || 0)) {
        return (b.totalSightings || 0) - (a.totalSightings || 0)
      }
      if ((b.totalPoints || 0) !== (a.totalPoints || 0)) {
        return (b.totalPoints || 0) - (a.totalPoints || 0)
      }
      if ((b.endangeredSightings || 0) !== (a.endangeredSightings || 0)) {
        return (b.endangeredSightings || 0) - (a.endangeredSightings || 0)
      }
      return (b.uniqueSpecies || 0) - (a.uniqueSpecies || 0)
    })
    .map((row, idx) => ({
      ...row,
      rank: idx + 1
    }))
}

function buildSpeciesBreakdown(sightings = []) {
  const counts = {}

  sightings.forEach((s) => {
    const label = getCategoryFromEmoji(s.emoji)
    counts[label] = (counts[label] || 0) + 1
  })

  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1

  return Object.entries(counts)
    .map(([label, value]) => ({
      label,
      value,
      pct: Math.round((value / total) * 100),
      color: CATEGORY_COLORS[label] || CATEGORY_COLORS.Other
    }))
    .sort((a, b) => b.value - a.value)
}

function buildRecentSightings(sightings = []) {
  return [...sightings]
    .sort((a, b) => getLastSeenValue(b) - getLastSeenValue(a))
    .slice(0, 4)
    .map((s) => ({
      id: s.id,
      name: s.name || 'Unknown species',
      latin: s.latin || '',
      username: s.username || s.observer || 'Explorer',
      district: pseudoDistrictFromCoords(s.lat, s.lng),
      pts: STATUS_POINTS[s.status] || 5,
      status: s.status || 'Unknown',
      emoji: s.emoji || '🌿',
      time: formatRelativeTime(getLastSeenValue(s))
    }))
}

function getUserRank(list, userId) {
  return list.findIndex((x) => (x.usernameKey || x.id) === userId) + 1
}

function getUserEntry(list, userId) {
  return list.find((x) => (x.usernameKey || x.id) === userId) || null
}

function formatDateLine() {
  const d = new Date()
  return d.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })
}

function donutSegments(data) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1
  let acc = 0
  return data.map((item) => {
    const start = (acc / total) * 100
    acc += item.value
    const end = (acc / total) * 100
    return { ...item, start, end }
  })
}

function DonutChart({ data, centerLabel }) {
  const segments = donutSegments(data)
  const gradient = segments
    .map((s) => `${s.color} ${s.start}% ${s.end}%`)
    .join(', ')

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div
        style={{
          width: 132,
          height: 132,
          borderRadius: '50%',
          background: `conic-gradient(${gradient})`,
          position: 'relative',
          flexShrink: 0,
          boxShadow: '0 0 32px rgba(52,211,153,0.08)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 20,
            borderRadius: '50%',
            background: 'rgba(5,13,10,0.96)',
            border: '1px solid rgba(52,211,153,0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#e2f5ee',
            textAlign: 'center',
            boxShadow: 'inset 0 0 22px rgba(255,255,255,0.02)'
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{centerLabel}</div>
          <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: '#6ea58e' }}>
            species
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 180, display: 'grid', gap: 10 }}>
        {data.map((item) => (
          <div
            key={item.label}
            style={{
              display: 'grid',
              gridTemplateColumns: '14px 1fr auto',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              color: '#b9ead4'
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: item.color,
                boxShadow: `0 0 10px ${item.color}88`
              }}
            />
            <div>{item.label}</div>
            <div style={{ fontWeight: 700 }}>{item.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GlassCard({ title, children, minHeight }) {
  return (
    <div
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, rgba(8,20,16,0.94) 0%, rgba(5,13,10,0.92) 100%)',
        border: '1px solid rgba(52,211,153,0.12)',
        borderRadius: 24,
        padding: 22,
        minHeight: minHeight || 'auto',
        overflow: 'hidden',
        boxShadow: '0 0 28px rgba(0,0,0,0.18), inset 0 0 22px rgba(255,255,255,0.015)',
        backdropFilter: 'blur(12px)'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(rgba(52,211,153,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.022) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          opacity: 0.16
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-18%',
          width: '34%',
          height: '100%',
          transform: 'skewX(-18deg)',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
          pointerEvents: 'none'
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: 2.4,
            textTransform: 'uppercase',
            color: '#7fbca0',
            fontWeight: 800,
            marginBottom: 18
          }}
        >
          {title}
        </div>
        {children}
      </div>
    </div>
  )
}

function DistrictChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {data.map((item) => (
        <div
          key={item.name}
          style={{
            display: 'grid',
            gridTemplateColumns: '84px 1fr 36px',
            alignItems: 'center',
            gap: 10
          }}
        >
          <div style={{ fontSize: 12, color: '#9ed8bd' }}>{item.name}</div>

          <div
            style={{
              height: 10,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 999,
              overflow: 'hidden',
              boxShadow: 'inset 0 0 12px rgba(0,0,0,0.18)'
            }}
          >
            <div
              style={{
                width: `${(item.value / max) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0b5d47, #22c55e)',
                borderRadius: 999,
                boxShadow: '0 0 16px rgba(52,211,153,0.18)'
              }}
            />
          </div>

          <div style={{ fontSize: 11, color: '#8bc7ae', textAlign: 'right' }}>{item.value}</div>
        </div>
      ))}
    </div>
  )
}

function MetricTile({ value, label }) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))',
        borderRadius: 16,
        padding: '14px 12px',
        textAlign: 'center',
        border: '1px solid rgba(52,211,153,0.08)',
        boxShadow: 'inset 0 0 18px rgba(255,255,255,0.015)'
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 900, color: '#eafbf2', marginBottom: 4 }}>
        {value}
      </div>
      <div
        style={{
          fontSize: 9,
          letterSpacing: 1.6,
          textTransform: 'uppercase',
          color: '#6fa38c'
        }}
      >
        {label}
      </div>
    </div>
  )
}

function TopToggle({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 14px',
        background: active
          ? 'linear-gradient(180deg, rgba(52,211,153,0.18) 0%, rgba(52,211,153,0.08) 100%)'
          : 'rgba(255,255,255,0.02)',
        border: `1px solid ${active ? 'rgba(52,211,153,0.36)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        cursor: 'pointer',
        color: active ? '#d8fff0' : '#7bb79f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontWeight: 800,
        letterSpacing: 1,
        textTransform: 'uppercase',
        fontSize: 11,
        boxShadow: active ? '0 0 18px rgba(52,211,153,0.12)' : 'none',
        transition: 'all 0.18s ease'
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function PodiumMini({ player, rank, active, districtMode = false }) {
  if (!player) return null

  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div
        style={{
          width: 74,
          height: 74,
          borderRadius: '50%',
          margin: '0 auto 10px',
          border: `3px solid ${active ? '#fbbf24' : 'rgba(52,211,153,0.24)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.04)',
          boxShadow: active ? '0 0 24px rgba(251,191,36,0.24)' : '0 0 16px rgba(52,211,153,0.08)',
          fontSize: 30
        }}
      >
        {districtMode ? '🗺️' : rank === 1 ? '🌿' : rank === 2 ? '🦅' : '🐦'}
      </div>

      <div style={{ color: '#f4f8ef', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>
        {districtMode ? player.name : player.username}
      </div>
      <div style={{ color: '#9ed8bd', fontSize: 13 }}>
        {(player.totalPoints || 0).toLocaleString()} pts
      </div>

      <div
        style={{
          marginTop: 10,
          background: active ? 'rgba(134, 239, 172, 0.14)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${active ? 'rgba(134,239,172,0.22)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 14,
          padding: '10px 0',
          color: active ? '#d9ffd4' : '#a9c8bb',
          fontWeight: 800
        }}
      >
        #{rank}
      </div>
    </div>
  )
}

function SidebarRankRow({ player, isCurrent, districtMode = false }) {
  const title = districtMode ? player.name : player.username
  const sub = districtMode
    ? `${player.totalSightings || 0} sightings`
    : `${player.totalScans || 0} sightings`

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '52px minmax(0, 1fr) auto',
        gap: 12,
        alignItems: 'center',
        background: isCurrent ? 'rgba(134,239,172,0.12)' : 'rgba(0,0,0,0.18)',
        border: isCurrent ? '1px solid rgba(134,239,172,0.22)' : '1px solid rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: '10px 12px'
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          color: '#d6f6e7',
          fontWeight: 900
        }}
      >
        #{player.rank}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, color: '#eefcf5', marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#88b8a2' }}>{sub}</div>
      </div>

      <div style={{ color: '#d7efb8', fontWeight: 900 }}>
        {(player.totalPoints || 0).toLocaleString()} pts
      </div>
    </div>
  )
}

function SpotStat({ value, label }) {
  return (
    <div>
      <div style={{ color: '#f4fff9', fontWeight: 900, fontSize: 18, lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ color: '#8ebba9', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  )
}

function RecentSightingRow({ item }) {
  const statusBg = {
    'Least Concern': 'rgba(52,211,153,0.12)',
    'Near Threatened': 'rgba(251,191,36,0.14)',
    'Vulnerable': 'rgba(249,115,22,0.14)',
    'Endangered': 'rgba(239,68,68,0.14)',
    'Critically Endangered': 'rgba(220,38,38,0.14)',
    'Unknown': 'rgba(148,163,184,0.14)'
  }[item.status] || 'rgba(148,163,184,0.14)'

  const statusColor = {
    'Least Concern': '#34d399',
    'Near Threatened': '#fbbf24',
    'Vulnerable': '#fb923c',
    'Endangered': '#f87171',
    'Critically Endangered': '#dc2626',
    'Unknown': '#94a3b8'
  }[item.status] || '#94a3b8'

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '52px minmax(0, 1fr) auto',
        gap: 16,
        alignItems: 'center',
        padding: '14px 16px',
        border: '1px solid rgba(52,211,153,0.08)',
        borderRadius: 18,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))'
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24
        }}
      >
        {item.emoji}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ color: '#7fb39e', fontSize: 11, fontStyle: 'italic', marginBottom: 3 }}>
          {item.latin}
        </div>
        <div style={{ color: '#e6fff5', fontSize: 14, fontWeight: 900, marginBottom: 2 }}>
          {item.name}
        </div>
        <div style={{ color: '#7aa994', fontSize: 13 }}>
          {item.username} · {item.district}
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ color: '#34d399', fontWeight: 900, fontSize: 18, marginBottom: 6 }}>
          +{item.pts} pts
        </div>
        <div
          style={{
            display: 'inline-block',
            fontSize: 10,
            padding: '4px 8px',
            borderRadius: 999,
            background: statusBg,
            color: statusColor,
            marginBottom: 6,
            border: `1px solid ${statusColor}22`
          }}
        >
          {item.status}
        </div>
        <div style={{ color: '#6f8a7f', fontSize: 11 }}>{item.time}</div>
      </div>
    </div>
  )
}

export default function LeaderboardPage({
  sightings = [],
  leaderboardEntries = [],
  userId
}) {
  const [viewMode, setViewMode] = useState('citywide')

  const rankedUsers = useMemo(() => {
    const effective = enrichLeaderboardFromSightings(leaderboardEntries, sightings)
    return effective.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      usernameKey: item.usernameKey || item.id || normalizeName(item.username)
    }))
  }, [leaderboardEntries, sightings])

  const districtLeaderboard = useMemo(() => buildDistrictLeaderboard(sightings), [sightings])
  const districtActivity = useMemo(() => buildDistrictActivity(sightings), [sightings])
  const speciesBreakdown = useMemo(() => buildSpeciesBreakdown(sightings), [sightings])
  const recentSightings = useMemo(() => buildRecentSightings(sightings), [sightings])

  const currentUser = getUserEntry(rankedUsers, userId)
  const currentRank = getUserRank(rankedUsers, userId)
  const totalParticipants = rankedUsers.length
  const totalSightings = sightings.length
  const totalSpecies = new Set(sightings.map((s) => s.name || s.latin || 'Unknown')).size

  const leftList = viewMode === 'citywide' ? rankedUsers : districtLeaderboard
  const topThree = leftList.slice(0, 3)

  const currentUserDistrict = useMemo(() => {
    const mine = sightings.filter((s) => (s.usernameKey || normalizeName(s.username || s.observer)) === userId)
    if (!mine.length) return null

    const counts = {}
    mine.forEach((s) => {
      const d = pseudoDistrictFromCoords(s.lat, s.lng)
      counts[d] = (counts[d] || 0) + 1
    })

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  }, [sightings, userId])

  const myDistrictEntry =
    currentUserDistrict
      ? districtLeaderboard.find((d) => d.name === currentUserDistrict) || null
      : null

  const displayRank = viewMode === 'citywide' ? currentRank : myDistrictEntry?.rank || null
  const displayName = viewMode === 'citywide'
    ? (currentUser?.username || 'Explorer')
    : (myDistrictEntry?.name || 'Unknown district')
  const displayPoints = viewMode === 'citywide'
    ? (currentUser?.totalPoints || 0)
    : (myDistrictEntry?.totalPoints || 0)

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        background:
          'radial-gradient(circle at top left, rgba(52,211,153,0.07), transparent 24%), radial-gradient(circle at top right, rgba(96,165,250,0.05), transparent 18%), radial-gradient(circle at bottom right, rgba(139,92,246,0.06), transparent 22%), #050d0a',
        padding: 0
      }}
    >
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid rgba(52,211,153,0.10)',
          background: 'rgba(11,30,24,0.72)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ color: '#7fbca0', fontSize: 14 }}>{formatDateLine()} · All time</div>
          <div
            style={{
              background: 'rgba(5,13,10,0.9)',
              color: '#f3fff9',
              borderRadius: 999,
              padding: '8px 16px',
              fontWeight: 900,
              letterSpacing: 1,
              border: '1px solid rgba(52,211,153,0.18)',
              boxShadow: '0 0 18px rgba(52,211,153,0.08)'
            }}
          >
            {displayPoints.toLocaleString()} <span style={{ fontSize: 12, opacity: 0.78 }}>PTS</span>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(52,211,153,0.10)',
            borderRadius: 999,
            padding: '8px 14px',
            color: '#d79bb6',
            fontSize: 13
          }}
        >
          {viewMode === 'citywide' ? '🌸' : '🗺️'} {displayName} · #{displayRank || '--'} {viewMode}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '340px minmax(0, 1fr)',
          gap: 24,
          padding: 24
        }}
      >
        <div
          style={{
            position: 'relative',
            background: 'linear-gradient(180deg, rgba(8,20,16,0.96) 0%, rgba(5,13,10,0.94) 100%)',
            color: '#f3fff9',
            borderRadius: 28,
            padding: 22,
            minHeight: 900,
            overflow: 'hidden',
            border: '1px solid rgba(52,211,153,0.12)',
            boxShadow: '0 0 28px rgba(0,0,0,0.22)'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'linear-gradient(rgba(52,211,153,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.022) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              opacity: 0.18
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Leaderboard</div>
            <div style={{ color: 'rgba(232,255,244,0.55)', fontSize: 13, marginBottom: 16 }}>
              {viewMode === 'citywide'
                ? `${totalParticipants} naturalists · San Francisco`
                : `${districtLeaderboard.length} active districts · San Francisco`}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: 18
              }}
            >
              <TopToggle
                active={viewMode === 'citywide'}
                onClick={() => setViewMode('citywide')}
                icon="🗺️"
                label="Citywide"
              />
              <TopToggle
                active={viewMode === 'district'}
                onClick={() => setViewMode('district')}
                icon="🛰"
                label="By District"
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                marginBottom: 24
              }}
            >
              <MetricTile value={totalParticipants} label="Participants" />
              <MetricTile value={totalSightings.toLocaleString()} label="Sightings" />
              <MetricTile value={totalSpecies} label="Species" />
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'end', marginBottom: 22 }}>
              <PodiumMini player={topThree[1]} rank={2} districtMode={viewMode === 'district'} />
              <PodiumMini player={topThree[0]} rank={1} active districtMode={viewMode === 'district'} />
              <PodiumMini player={topThree[2]} rank={3} districtMode={viewMode === 'district'} />
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(52,211,153,0.10)',
                borderRadius: 18,
                padding: 14,
                marginBottom: 20
              }}
            >
              <div style={{ fontSize: 10, color: '#9bcab6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
                {viewMode === 'citywide' ? 'Your rank' : 'Your district'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', alignItems: 'center', gap: 10 }}>
                <div style={{ color: '#e7f8ef', fontWeight: 900, fontSize: 22 }}>
                  #{displayRank || '--'}
                </div>

                <div>
                  <div style={{ fontWeight: 800 }}>{displayName}</div>
                  <div style={{ fontSize: 12, color: '#9bcab6' }}>
                    {viewMode === 'citywide'
                      ? `${currentUser?.totalScans || 0} sightings`
                      : `${myDistrictEntry?.totalSightings || 0} sightings`}
                  </div>
                </div>

                <div style={{ fontWeight: 900, color: '#d5efb8' }}>
                  {displayPoints.toLocaleString()} pts
                </div>
              </div>
            </div>

            <div style={{ fontSize: 10, color: '#8ebba9', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
              {viewMode === 'citywide' ? 'Ranks 4–13 · San Francisco' : 'District ranks'}
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {(viewMode === 'citywide' ? rankedUsers.slice(3, 13) : districtLeaderboard).map((player) => (
                <SidebarRankRow
                  key={player.usernameKey || player.id}
                  player={player}
                  isCurrent={viewMode === 'citywide' ? player.usernameKey === userId : player.name === currentUserDistrict}
                  districtMode={viewMode === 'district'}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ minWidth: 0, display: 'grid', gap: 20 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.1fr 0.9fr',
              gap: 18
            }}
          >
            <GlassCard title={viewMode === 'citywide' ? 'District Activity · Citywide' : 'District Activity · By District'} minHeight={250}>
              <DistrictChart data={districtActivity} />
            </GlassCard>

            <GlassCard title="Species Breakdown" minHeight={250}>
              <DonutChart data={speciesBreakdown} centerLabel={totalSpecies} />
            </GlassCard>
          </div>

          <GlassCard title={viewMode === 'citywide' ? 'Top Scorer Spotlight · Citywide' : 'Top District Spotlight'}>
            {topThree[0] ? (
              <div
                style={{
                  position: 'relative',
                  background: 'linear-gradient(180deg, rgba(7,24,18,0.96) 0%, rgba(5,18,14,0.96) 100%)',
                  color: '#f3fff9',
                  borderRadius: 22,
                  padding: '18px 22px',
                  display: 'grid',
                  gridTemplateColumns: '88px minmax(0, 1fr) auto',
                  gap: 18,
                  alignItems: 'center',
                  border: '1px solid rgba(52,211,153,0.14)',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
                    transform: 'skewX(-18deg)'
                  }}
                />

                <div
                  style={{
                    width: 74,
                    height: 74,
                    borderRadius: '50%',
                    border: '3px solid #fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 34,
                    boxShadow: '0 0 24px rgba(251,191,36,0.24)',
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  {viewMode === 'citywide' ? '🌿' : '🗺️'}
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ color: '#f8d96c', fontSize: 28, fontWeight: 900, marginBottom: 4 }}>
                    {viewMode === 'citywide' ? topThree[0].username : topThree[0].name}
                  </div>
                  <div style={{ color: '#9bcab6', fontSize: 13, marginBottom: 14 }}>
                    {viewMode === 'citywide'
                      ? 'Citywide leader · top ecological signal'
                      : 'Highest scoring district right now'}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 26,
                      flexWrap: 'wrap'
                    }}
                  >
                    {viewMode === 'citywide' ? (
                      <>
                        <SpotStat value={topThree[0].totalScans || 0} label="Sightings" />
                        <SpotStat value={topThree[0].uniqueSpecies || 0} label="Species" />
                        <SpotStat value={topThree[0].rareFound || 0} label="Rare Finds" />
                        <SpotStat value={topThree[0].endangeredFound || 0} label="Critical" />
                      </>
                    ) : (
                      <>
                        <SpotStat value={topThree[0].totalSightings || 0} label="Sightings" />
                        <SpotStat value={topThree[0].uniqueSpecies || 0} label="Species" />
                        <SpotStat value={topThree[0].rareSightings || 0} label="Rare" />
                        <SpotStat value={topThree[0].endangeredSightings || 0} label="Critical" />
                      </>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>
                  <div style={{ color: '#f8d96c', fontSize: 36, fontWeight: 900, lineHeight: 1 }}>
                    {(topThree[0].totalPoints || 0).toLocaleString()}
                  </div>
                  <div style={{ color: '#8ebba9', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>
                    Points
                  </div>
                </div>
              </div>
            ) : null}
          </GlassCard>

          <GlassCard title="Recent Sightings · Citywide" minHeight={520}>
            <div style={{ display: 'grid', gap: 12 }}>
              {recentSightings.map((item) => (
                <RecentSightingRow key={item.id} item={item} />
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}