import { useState, useEffect, useMemo } from 'react'
import { listenSightings, listenLeaderboard, normalizeUsername } from './services/firebase'
import HomePage from './pages/HomePage'
import MyLogPage from './pages/MyLogPage'
import MissionPage from './pages/Mission'
import LeaderboardPage from './pages/LeaderboardPage'
import Navbar from './components/Navbar'
import 'leaflet/dist/leaflet.css'
import ProfilePage from './pages/ProfilePage'

function getStatusCode(status) {
  return (
    {
      'Least Concern': 'LC',
      'Near Threatened': 'NT',
      'Vulnerable': 'VU',
      'Endangered': 'EN',
      'Critically Endangered': 'CR',
      'Unknown': 'UN'
    }[status] || 'UN'
  )
}

function normalizeSighting(s) {
  const observedAt =
    s.observedAt ||
    s.createdAt ||
    (s.timestamp?.toDate ? s.timestamp.toDate().toISOString() : null) ||
    null

  const numericConfidence =
    typeof s.confidence === 'number'
      ? s.confidence
      : Number(s.confidence)

  return {
    ...s,
    id: s.id || `${s.name || 'species'}-${s.lat}-${s.lng}-${observedAt || 'time'}`,
    name: s.name || 'Unknown species',
    latin: s.latin || '',
    emoji: s.emoji || '🌿',
    status: s.status || 'Unknown',
    statusCode: s.statusCode || getStatusCode(s.status),
    confidence: Number.isFinite(numericConfidence) ? numericConfidence : 0,
    observer: s.observer || s.username || 'Explorer',
    username: s.username || s.observer || 'Explorer',
    usernameKey: s.usernameKey || normalizeUsername(s.username || s.observer || 'Explorer'),
    photo: s.photo || null,
    lat: Number(s.lat),
    lng: Number(s.lng),
    observedAt,
    createdAt: s.createdAt || observedAt,
    timestamp: s.timestamp || null
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [rawSightings, setRawSightings] = useState([])
  const [leaderboardEntries, setLeaderboardEntries] = useState([])
  const [coords, setCoords] = useState(null)
  const [cityName, setCityName] = useState('Locating...')
  const [username, setUsername] = useState(
    () => localStorage.getItem('species_signal_username') || ''
  )
  const [usernameInput, setUsernameInput] = useState('')
  const [isScientist] = useState(
    () => localStorage.getItem('species_signal_is_scientist') === 'true'
  )

  const showUsernameModal = !username
  const userId = useMemo(() => normalizeUsername(username), [username])

  const sightings = useMemo(
    () =>
      rawSightings
        .map(normalizeSighting)
        .filter((s) => !Number.isNaN(s.lat) && !Number.isNaN(s.lng)),
    [rawSightings]
  )

  const mySightings = useMemo(() => {
    if (!userId) return []
    return sightings.filter((s) => s.usernameKey === userId)
  }, [sightings, userId])

  const myLeaderboardEntry = useMemo(
    () => leaderboardEntries.find(e => e.usernameKey === userId) || null,
    [leaderboardEntries, userId]
  )

  const saveUsername = () => {
    const name = usernameInput.trim()
    if (!name) return

    const usernameKey = normalizeUsername(name)

    localStorage.setItem('species_signal_username', name)
    localStorage.setItem('species_signal_username_key', usernameKey)

    setUsername(name)
    setUsernameInput('')
    setCurrentPage('home')
  }

  const logout = () => {
    localStorage.removeItem('species_signal_username')
    localStorage.removeItem('species_signal_username_key')
    setUsername('')
    setUsernameInput('')
    setCurrentPage('home')
  }

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const lat = p.coords.latitude
        const lng = p.coords.longitude
        setCoords({ lat, lng })

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          )
          const data = await res.json()
          setCityName(
            data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              'Your Area'
          )
        } catch {
          setCityName('Your Area')
        }
      },
      () => {
        setCoords({ lat: 37.77, lng: -122.41 })
        setCityName('San Francisco')
      }
    )
  }, [])

  useEffect(() => {
    return listenSightings((data) => setRawSightings(data))
  }, [])

  useEffect(() => {
    return listenLeaderboard((data) => setLeaderboardEntries(data))
  }, [])

  const navigate = (page) => {
    setCurrentPage(page)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#050d0a',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#e2f5ee'
      }}
    >
      {showUsernameModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              background: '#081410',
              border: '1px solid rgba(52,211,153,0.3)',
              borderRadius: 10,
              padding: '32px 28px',
              width: 300,
              textAlign: 'center',
              boxShadow: '0 0 40px rgba(52,211,153,0.15)'
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>🌿</div>

            <div
              style={{
                fontWeight: 800,
                fontSize: 18,
                color: '#6ee7b7',
                marginBottom: 4
              }}
            >
              Welcome to <span style={{ color: '#7ad08f' }}>Natu</span><span style={{ color: '#ffc2e8' }}>Radar</span>

            </div>

            <div
              style={{
                fontSize: 12,
                color: '#5a8a76',
                marginBottom: 20,
                lineHeight: 1.6
              }}
            >
              Enter a username to join the leaderboard and track your discoveries
            </div>

            <input
              autoFocus
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveUsername()}
              placeholder="Explorer name..."
              style={{
                width: '100%',
                padding: '10px 12px',
                marginBottom: 12,
                background: '#0d1f19',
                border: '1px solid rgba(52,211,153,0.3)',
                color: '#e2f5ee',
                fontSize: 13,
                borderRadius: 6,
                outline: 'none',
                boxSizing: 'border-box',
                letterSpacing: 0.5
              }}
            />

            <button
              onClick={saveUsername}
              style={{
                width: '100%',
                padding: '10px 0',
                background: 'rgba(52,211,153,0.12)',
                border: '1px solid #34d399',
                color: '#34d399',
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: 2,
                textTransform: 'uppercase',
                cursor: 'pointer',
                borderRadius: 6
              }}
            >
              Start Exploring
            </button>
          </div>
        </div>
      )}

      <Navbar
        currentPage={currentPage}
        navigate={navigate}
        cityName={cityName}
        username={username}
        sightingsCount={sightings.length}
      />

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {currentPage === 'home' && (
          <HomePage
            coords={coords}
            cityName={cityName}
            username={username}
            userId={userId}
            sightings={sightings}
          />
        )}

        {currentPage === 'mylog' && (
          <MyLogPage
            userId={userId}
            userCoords={coords}
            sightings={mySightings}
          />
        )}

        {currentPage === 'missions' && (
          <MissionPage
            sightings={mySightings}
            cityName={cityName}
          />
        )}

        {currentPage === 'leaderboard' && (
          <LeaderboardPage
            sightings={sightings}
            leaderboardEntries={leaderboardEntries}
            userId={userId}
          />
        )}

        {currentPage === 'profile' && (
          <ProfilePage
            sightings={mySightings}
            username={username}
            userId={userId}
            cityName={cityName}
            isScientist={isScientist}
            onLogout={logout}
          />
        )}
      </div>
    </div>
  )
}