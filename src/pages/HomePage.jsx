import { useEffect, useMemo, useState } from 'react'
import Scanner from '../components/Scanner'
import SightingMap from '../components/SightingMap'
import DetailPanel from '../components/DetailPanel'
import UserStats, { ImpactFlash, updateStats, updateSOTDStats, getStats } from '../components/UserStats'
import SpeciesOfDay, { checkSOTDMatch, markSOTDFound, getSOTDData, BONUS_POINTS } from '../components/SpeciesOfDay'
import { saveSighting, updateLeaderboard, addBonusPoints, uploadSightingPhoto } from '../services/firebase'
import { addToBioDex } from '../components/BioDex'
import { checkExpeditionProgress, getExpeditionProgress } from '../components/Expeditions'
import RadarPulse from '../components/RadarPulse'
import RadarSweep from '../components/RadarSweep'
import SpeciesRevealOverlay from '../components/SpeciesRevealOverlay'

const STATUS_COLORS = {
  'Least Concern': '#22c55e',
  'Near Threatened': '#eab308',
  'Vulnerable': '#f97316',
  'Endangered': '#ef4444',
  'Critically Endangered': '#dc2626',
  'Unknown': '#60a5fa'
}

const STATUS_WEIGHTS = {
  'Least Concern': 100,
  'Near Threatened': 70,
  'Vulnerable': 40,
  'Endangered': 15,
  'Critically Endangered': 0
}

function calcBioScore(sightings) {
  if (!sightings.length) return 75
  const scores = sightings.map(s => STATUS_WEIGHTS[s.status] ?? 75)
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

export default function HomePage({
  coords,
  cityName,
  username,
  userId,
  sightings,
  myLeaderboardEntry
}) {
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null)
  const [alertBanner, setAlertBanner] = useState(null)
  const [focusSpecies, setFocusSpecies] = useState(null)
  const [userStats, setUserStats] = useState(getStats())

  useEffect(() => {
    if (!myLeaderboardEntry) return
    setUserStats(prev => ({
      ...prev,
      totalScans: Math.max(prev.totalScans, myLeaderboardEntry.totalScans || 0),
      endangeredFound: Math.max(prev.endangeredFound, myLeaderboardEntry.endangeredFound || 0),
    }))
  }, [myLeaderboardEntry])
  const [impactFlash, setImpactFlash] = useState(null)
  const [newBadgeFlash, setNewBadgeFlash] = useState(null)
  const [showRadarPulse, setShowRadarPulse] = useState(false)
  const [revealSpecies, setRevealSpecies] = useState(null)
  const [revealIsNew, setRevealIsNew] = useState(false)

  const [speciesSearch, setSpeciesSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confidenceOnly, setConfidenceOnly] = useState(false)

  const [sotdFoundToday, setSotdFoundToday] = useState(() => {
    const d = getSOTDData()
    const todayKey = (() => {
      const t = new Date()
      return `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`
    })()
    return !!(d.found?.[todayKey])
  })

  const bioScore = calcBioScore(sightings)

  const triggerRadarPulse = () => {
    setShowRadarPulse(true)
    setTimeout(() => setShowRadarPulse(false), 3800)
  }

  const filteredSightings = useMemo(() => {
    return sightings.filter((s) => {
      const matchesSearch =
        !speciesSearch.trim() ||
        (s.name || '').toLowerCase().includes(speciesSearch.toLowerCase()) ||
        (s.latin || '').toLowerCase().includes(speciesSearch.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || s.status === statusFilter

      const matchesConfidence =
        !confidenceOnly || (s.confidence || 0) >= 90

      return matchesSearch && matchesStatus && matchesConfidence
    })
  }, [sightings, speciesSearch, statusFilter, confidenceOnly])

  const handleScan = async (result, capturedImage) => {
    const savedCoords = coords || { lat: 37.77, lng: -122.41 }

    // Upload user's photo to Firebase Storage
    let userPhoto = null
    if (capturedImage) {
      try {
        userPhoto = await uploadSightingPhoto(capturedImage)
      } catch (err) {
        console.error('Photo upload failed:', err)
      }
    }

    await saveSighting({ ...result, userPhoto }, savedCoords, username)
    if (username) updateLeaderboard(userId, username, result, savedCoords)

    const { isNew } = addToBioDex(result, savedCoords, userPhoto)

    if (!sotdFoundToday && checkSOTDMatch(result.name, result.latin)) {
      const streak = markSOTDFound()
      setSotdFoundToday(true)
      const bonusPts = BONUS_POINTS[result.status] || 20
      if (username) addBonusPoints(username, bonusPts, savedCoords)
      const { stats: sotdStats, newBadges: sotdBadges } = updateSOTDStats(streak)
      setUserStats(sotdStats)
      setTimeout(() => {
        setNewBadgeFlash({
          emoji: '🌟',
          label: 'Species of the Day!',
          desc: `Found it! ${streak > 1 ? `${streak}-day streak!` : `+${bonusPts} bonus pts earned!`}`
        })
      }, 500)
      if (sotdBadges.length > 0) {
        setTimeout(() => setNewBadgeFlash(sotdBadges[0]), 4000)
      }
    }

    const expNotifs = checkExpeditionProgress(result)
    getExpeditionProgress()

    const expComplete = expNotifs.find(n => n.type === 'expedition')
    if (expComplete) {
      setTimeout(() => {
        setNewBadgeFlash({
          emoji: expComplete.badge.emoji,
          label: 'Expedition Complete!',
          desc: `${expComplete.expeditionName} · +${expComplete.bonusPoints} bonus pts`
        })
      }, 2000)
    }

    triggerRadarPulse()

    const newScore = calcBioScore([...sightings, result])
    const scoreDelta = newScore - bioScore
    const { stats, newBadges } = updateStats(result, newScore)

    setUserStats(stats)
    setImpactFlash({ result, scoreDelta })

    if (newBadges.length > 0) {
      setTimeout(() => setNewBadgeFlash(newBadges[0]), 3400)
    }

    setToast(result)
    setTimeout(() => setToast(null), 4000)

    if (['Endangered', 'Critically Endangered', 'Vulnerable'].includes(result.status)) {
      setAlertBanner(`🚨 ${result.status} species detected: ${result.name} in ${cityName}`)
      setTimeout(() => setAlertBanner(null), 6000)
      setFocusSpecies(result.name)
    }

    setRevealSpecies(result)
    setRevealIsNew(isNew)

    if (isNew) {
      setTimeout(() => {
        setNewBadgeFlash({
          emoji: result.emoji || '🧬',
          label: 'New Species Collected!',
          desc: `${result.name} added to your BioDex archive`
        })
      }, 850)
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '432px 1fr',
        height: '100%',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at top left, rgba(52,211,153,0.07), transparent 28%), radial-gradient(circle at bottom right, rgba(96,165,250,0.06), transparent 24%), #050d0a'
      }}
    >
      <style>{`
        @keyframes ambientPulse {
          0% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.08); }
          100% { opacity: 0.35; transform: scale(1); }
        }

        @keyframes hudSweep {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
      `}</style>

      {/* Sidebar */}
      <div
        style={{
          position: 'relative',
          borderRight: '1px solid rgba(52,211,153,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          background:
            'linear-gradient(180deg, rgba(4,10,8,0.98) 0%, rgba(8,18,14,0.98) 45%, rgba(6,14,11,0.99) 100%)',
          boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.03), 0 0 40px rgba(0,0,0,0.25)',
          scrollbarWidth: 'thin',
          scrollbarColor: '#34d399 rgba(0,0,0,0.2)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'linear-gradient(rgba(52,211,153,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.03) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.22
          }}
        />

        {alertBanner && (
          <div
            style={{
              position: 'relative',
              padding: '10px 16px',
              background: 'rgba(220,38,38,0.15)',
              borderBottom: '1px solid rgba(239,68,68,0.4)',
              color: '#ef4444',
              fontSize: 12,
              fontWeight: 600,
              flexShrink: 0,
              zIndex: 1
            }}
          >
            {alertBanner}
          </div>
        )}

        <div
          style={{
            position: 'relative',
            padding: 18,
            borderBottom: '1px solid rgba(52,211,153,0.15)',
            flexShrink: 0,
            zIndex: 1
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: 3,
              color: '#7bb79f',
              textTransform: 'uppercase',
              marginBottom: 10,
              fontWeight: 700
            }}
          >
            📷 Scanner
          </div>

          <div
            style={{
              border: '1px solid rgba(52,211,153,0.16)',
              borderRadius: 12,
              background: 'rgba(7,20,15,0.72)',
              backdropFilter: 'blur(8px)',
              boxShadow: 'inset 0 0 20px rgba(52,211,153,0.04), 0 0 24px rgba(0,0,0,0.18)',
              padding: 12
            }}
          >
            <Scanner onResult={handleScan} />
          </div>
        </div>

        <SpeciesOfDay foundToday={sotdFoundToday} />

        <div
          style={{
            padding: '12px 16px 8px',
            borderBottom: '1px solid rgba(52,211,153,0.12)',
            position: 'relative',
            zIndex: 1
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: 3,
              color: '#8bc7ae',
              textTransform: 'uppercase',
              fontWeight: 800
            }}
          >
            Scores
          </div>
        </div>

        <div style={{ paddingBottom: 20, position: 'relative', zIndex: 1 }}>
          <UserStats stats={userStats} cityName={cityName} />
        </div>
      </div>

      {/* Map / main home visual */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(52,211,153,0.12), transparent 70%)',
            filter: 'blur(18px)',
            animation: 'ambientPulse 6s ease-in-out infinite',
            pointerEvents: 'none'
          }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(96,165,250,0.10), transparent 70%)',
            filter: 'blur(18px)',
            animation: 'ambientPulse 7s ease-in-out infinite',
            pointerEvents: 'none'
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-20%',
            width: '32%',
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.75), transparent)',
            animation: 'hudSweep 4s linear infinite',
            zIndex: 1001,
            pointerEvents: 'none'
          }}
        />

        {/* Search / filter controls */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            zIndex: 1100,
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            alignItems: 'center',
            pointerEvents: 'none'
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              pointerEvents: 'auto'
            }}
          >
            <input
              value={speciesSearch}
              onChange={(e) => setSpeciesSearch(e.target.value)}
              placeholder="Search species..."
              style={{
                width: 220,
                padding: '10px 12px',
                background: 'rgba(5,13,10,0.88)',
                border: '1px solid rgba(52,211,153,0.2)',
                borderRadius: 10,
                color: '#e2f5ee',
                fontSize: 12,
                outline: 'none',
                backdropFilter: 'blur(10px)'
              }}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '10px 12px',
                background: 'rgba(5,13,10,0.88)',
                border: '1px solid rgba(52,211,153,0.2)',
                borderRadius: 10,
                color: '#e2f5ee',
                fontSize: 12,
                outline: 'none',
                backdropFilter: 'blur(10px)'
              }}
            >
              <option value="all">All Status</option>
              <option value="Least Concern">Least Concern</option>
              <option value="Near Threatened">Near Threatened</option>
              <option value="Vulnerable">Vulnerable</option>
              <option value="Endangered">Endangered</option>
              <option value="Critically Endangered">Critically Endangered</option>
            </select>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                background: 'rgba(5,13,10,0.88)',
                border: '1px solid rgba(52,211,153,0.2)',
                borderRadius: 10,
                color: '#c7f5df',
                fontSize: 12,
                backdropFilter: 'blur(10px)'
              }}
            >
              <input
                type="checkbox"
                checked={confidenceOnly}
                onChange={(e) => setConfidenceOnly(e.target.checked)}
              />
              90%+ confidence
            </label>
          </div>
        </div>

        <SightingMap
          sightings={filteredSightings}
          allSightings={sightings}
          onSelect={setSelected}
          userCoords={coords}
          focusSpecies={focusSpecies}
          onClearFocus={() => setFocusSpecies(null)}
        />

        <RadarSweep />
        {showRadarPulse && <RadarPulse />}

        <div
          style={{
            position: 'absolute',
            top: 72,
            left: 16,
            zIndex: 1000,
            background: 'rgba(5,13,10,0.82)',
            border: '1px solid rgba(52,211,153,0.22)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 11,
            color: '#97cdb6',
            letterSpacing: 2,
            textTransform: 'uppercase',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 20px rgba(52,211,153,0.08)'
          }}
        >
          📍 {cityName} · {filteredSightings.length} sightings
        </div>

        <div
          style={{
            position: 'absolute',
            top: 72,
            right: 16,
            zIndex: 1000,
            background: 'rgba(5,13,10,0.82)',
            border: '1px solid rgba(96,165,250,0.28)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 11,
            color: '#93c5fd',
            letterSpacing: 2,
            textTransform: 'uppercase',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 20px rgba(96,165,250,0.08)'
          }}
        >
          System Online · BioScan Active
        </div>

        <div
          style={{
            position: 'absolute',
            left: 16,
            bottom: 16,
            zIndex: 1000,
            background: 'rgba(5,13,10,0.72)',
            border: '1px solid rgba(52,211,153,0.14)',
            borderRadius: 10,
            padding: '10px 12px',
            color: '#72b597',
            fontSize: 11,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 20px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', fontSize: 10, marginBottom: 4 }}>
            Ecosystem Pulse
          </div>
          <div style={{ color: '#9ed8bd' }}>
            {filteredSightings.length === 0 ? 'No matching scans' : `${filteredSightings.length} matching records detected`}
          </div>
        </div>

        {toast && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1000,
              background: 'rgba(8,24,18,0.94)',
              border: `1px solid ${STATUS_COLORS[toast.status] || '#22c55e'}`,
              borderRadius: 10,
              padding: '12px 16px',
              maxWidth: 300,
              boxShadow: `0 0 28px ${STATUS_COLORS[toast.status] || '#22c55e'}33`,
              backdropFilter: 'blur(10px)'
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: STATUS_COLORS[toast.status] || '#22c55e',
                marginBottom: 4
              }}
            >
              {toast.emoji} {toast.name} identified!
            </div>
            <div style={{ fontSize: 11, color: '#7bb79f', marginBottom: 6 }}>
              {toast.confidence}% confidence · {toast.status}
            </div>
            <div
              style={{ fontSize: 11, color: '#34d399', cursor: 'pointer' }}
              onClick={() => setSelected(toast)}
            >
              View full details + download →
            </div>
          </div>
        )}
      </div>

      {selected && (
        <DetailPanel
          species={selected}
          onClose={() => setSelected(null)}
          onFocusSpecies={(name) => {
            setFocusSpecies(name)
            setSelected(null)
          }}
        />
      )}

      {impactFlash && (
        <ImpactFlash
          result={impactFlash.result}
          scoreDelta={impactFlash.scoreDelta}
          cityName={cityName}
          onDone={() => setImpactFlash(null)}
        />
      )}

      {newBadgeFlash && (
        <div
          style={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9001,
            background: 'rgba(8,20,16,0.96)',
            border: '2px solid #c94db8',
            borderRadius: 10,
            padding: '14px 24px',
            textAlign: 'center',
            boxShadow: '0 0 40px rgba(251,191,36,0.3), inset 0 0 20px rgba(251,191,36,0.06)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 4 }}>{newBadgeFlash.emoji}</div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#fbbf24' }}>
            Badge Unlocked!
          </div>
          <div style={{ fontSize: 13, color: '#e2f5ee', fontWeight: 600 }}>
            {newBadgeFlash.label}
          </div>
          <div style={{ fontSize: 11, color: '#7bb79f', marginTop: 3 }}>
            {newBadgeFlash.desc}
          </div>
          <button
            onClick={() => setNewBadgeFlash(null)}
            style={{
              marginTop: 10,
              padding: '5px 14px',
              fontSize: 11,
              background: 'rgba(251,191,36,0.15)',
              border: '1px solid rgba(251,191,36,0.4)',
              color: '#e059e0',
              cursor: 'pointer',
              borderRadius: 4
            }}
          >
            Awesome!
          </button>
        </div>
      )}

      {revealSpecies && (
        <SpeciesRevealOverlay
          species={revealSpecies}
          isNew={revealIsNew}
          onClose={() => setRevealSpecies(null)}
          onOpenDetails={() => {
            setSelected(revealSpecies)
            setRevealSpecies(null)
          }}
        />
      )}
    </div>
  )
}