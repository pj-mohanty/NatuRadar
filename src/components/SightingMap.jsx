import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import { useMemo, useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet.heat'

const STATUS_COLORS = {
  'Least Concern': '#22c55e',
  'Near Threatened': '#eab308',
  'Vulnerable': '#f97316',
  'Endangered': '#ef4444',
  'Critically Endangered': '#dc2626',
  'Unknown': '#60a5fa'
}

const STATUS_RADIUS = {
  'Least Concern': 50000,
  'Near Threatened': 80000,
  'Vulnerable': 120000,
  'Endangered': 200000,
  'Critically Endangered': 300000,
  'Unknown': 60000
}

const PLANT_TAXA = ['Plantae', 'Fungi', 'Chromista']

function isPlant(s) {
  return PLANT_TAXA.some(t => s.kingdom === t) ||
    ['🌿', '🌱', '🍄', '🌲', '🌸', '🌺'].includes(s.emoji)
}

function createMarkerIcon(emoji, color, plant, pulsing = true) {
  const shape = plant
    ? 'border-radius:4px;transform:rotate(45deg);'
    : 'border-radius:50%;'

  const inner = plant
    ? 'transform:rotate(-45deg);font-size:13px;'
    : 'font-size:14px;'

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:28px;height:28px;">
        ${pulsing ? `<div class="bio-marker-pulse" style="background:${color};"></div>` : ''}
        <div style="
          position:relative;
          width:28px;height:28px;
          ${shape}
          background:${color}25;
          border:2px solid ${color};
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 0 8px ${color}55, 0 0 2px rgba(0,0,0,0.8);
          cursor:pointer;
        ">
          <span style="${inner}line-height:1;">${emoji}</span>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

function MapController({ center }) {
  const map = useMap()

  useEffect(() => {
    if (center) map.flyTo([center.lat, center.lng], 12, { duration: 1.5 })
  }, [center?.lat, center?.lng, map])

  return null
}

function FocusController({ sightings, focusSpecies }) {
  const map = useMap()

  useEffect(() => {
    if (!focusSpecies || !sightings.length) return
    const matching = sightings.filter(s => s.name === focusSpecies)
    if (!matching.length) return

    if (matching.length === 1) {
      map.flyTo([matching[0].lat, matching[0].lng], 8, { duration: 1.5 })
    } else {
      const lats = matching.map(s => s.lat)
      const lngs = matching.map(s => s.lng)
      map.flyToBounds(
        [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
        { padding: [60, 60], duration: 1.5 }
      )
    }
  }, [focusSpecies, sightings, map])

  return null
}

function HeatmapLayer({ sightings }) {
  const map = useMap()

  useEffect(() => {
    if (!map || sightings.length === 0) return

    const heatPoints = sightings.map(s => [
      s.lat,
      s.lng,
      s.status === 'Critically Endangered'
        ? 1
        : s.status === 'Endangered'
        ? 0.9
        : s.status === 'Vulnerable'
        ? 0.7
        : 0.4
    ])

    const heat = L.heatLayer(heatPoints, {
      radius: 40,
      blur: 28,
      maxZoom: 10,
      gradient: {
        0.2: '#22c55e',
        0.4: '#eab308',
        0.7: '#f97316',
        1.0: '#dc2626'
      }
    }).addTo(map)

    return () => {
      map.removeLayer(heat)
    }
  }, [sightings, map])

  return null
}

export default function SightingMap({
  sightings,
  allSightings = [],
  onSelect,
  userCoords,
  focusSpecies,
  onClearFocus
}) {
  const [selectedPin, setSelectedPin] = useState(null)
  const [useSatellite, setUseSatellite] = useState(true)
  const [heatmapOn, setHeatmapOn] = useState(false)

  const sourceSightings = allSightings.length ? allSightings : sightings

  const filtered = useMemo(() => {
    let base = sightings
    if (focusSpecies) base = base.filter(s => s.name === focusSpecies)
    return base
  }, [sightings, focusSpecies])

  const handlePinClick = (s) => {
    setSelectedPin(selectedPin?.id === s.id ? null : s)
    onSelect(s)
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Map controls */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          justifyContent: 'center',
          padding: '0 8px'
        }}
      >
        <button
          onClick={() => setUseSatellite(s => !s)}
          style={controlBtnStyle(useSatellite, '#60a5fa')}
        >
          🛰 Satellite
        </button>

        <button
          onClick={() => setHeatmapOn(h => !h)}
          style={controlBtnStyle(heatmapOn, '#22c55e')}
        >
          🔥 Heatmap
        </button>
      </div>

      {focusSpecies && (
        <div
          style={{
            position: 'absolute',
            top: 52,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(8,20,16,0.92)',
            border: '1px solid rgba(34,197,94,0.4)',
            padding: '6px 16px',
            fontSize: 11,
            color: '#22c55e',
            borderRadius: 2,
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <span>
            🗺 <strong>{sourceSightings.filter(s => s.name === focusSpecies).length}</strong> global sighting(s) of <strong>{focusSpecies}</strong>
          </span>
          <span
            style={{
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)',
              borderLeft: '1px solid rgba(34,197,94,0.2)',
              paddingLeft: 12
            }}
            onClick={onClearFocus}
          >
            ✕ Clear
          </span>
        </div>
      )}

      <MapContainer
        center={[userCoords?.lat || 20, userCoords?.lng || 0]}
        zoom={userCoords ? 12 : 2}
        style={{ width: '100%', height: '100%' }}
      >
        {useSatellite ? (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Esri"
          />
        ) : (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="CartoDB"
          />
        )}

        {heatmapOn && <HeatmapLayer sightings={filtered} />}

        {userCoords && <MapController center={userCoords} />}
        {focusSpecies && <FocusController sightings={sourceSightings} focusSpecies={focusSpecies} />}

        {userCoords && (
          <Marker
            position={[userCoords.lat, userCoords.lng]}
            icon={L.divIcon({
              className: '',
              html: `
                <div style="position:relative;width:18px;height:18px;">
                  <div class="bio-marker-pulse" style="background:#60a5fa;"></div>
                  <div style="
                    width:16px;height:16px;border-radius:50%;
                    background:#60a5fa;border:3px solid #fff;
                    box-shadow:0 0 10px #60a5fa88;
                    position:relative;
                  "></div>
                </div>
              `,
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            })}
          >
            <Popup>
              <div style={{ background: '#0d1f19', color: '#e2f5ee', padding: 8, borderRadius: 4, fontSize: 12 }}>
                📍 Your location
              </div>
            </Popup>
          </Marker>
        )}

        {selectedPin && (
          <Circle
            center={[selectedPin.lat, selectedPin.lng]}
            radius={STATUS_RADIUS[selectedPin.status] || 80000}
            pathOptions={{
              color: STATUS_COLORS[selectedPin.status] || '#22c55e',
              fillColor: STATUS_COLORS[selectedPin.status] || '#22c55e',
              fillOpacity: 0.06,
              weight: 1.5,
              dashArray: '8,5'
            }}
          />
        )}

        {filtered.map(s => {
          const color = STATUS_COLORS[s.status] || '#22c55e'
          const plant = isPlant(s)
          const icon = createMarkerIcon(s.emoji || (plant ? '🌿' : '🐾'), color, plant, true)

          return (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              icon={icon}
              eventHandlers={{ click: () => handlePinClick(s) }}
            >
              <Popup>
                <div
                  style={{
                    background: '#0a1a14',
                    color: '#e2f5ee',
                    padding: 0,
                    minWidth: 220,
                    borderRadius: 4,
                    border: `1px solid ${color}44`,
                    fontFamily: 'sans-serif',
                    overflow: 'hidden'
                  }}
                >
                  {s.photo && (
                    <div style={{ height: 90, overflow: 'hidden', position: 'relative' }}>
                      <img
                        src={s.photo}
                        alt={s.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => { e.target.parentNode.style.display = 'none' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                          padding: '16px 8px 4px',
                          fontSize: 10,
                          color: 'rgba(255,255,255,0.7)'
                        }}
                      >
                        © iNaturalist
                      </div>
                    </div>
                  )}

                  <div style={{ padding: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                      {s.emoji} {s.name}
                    </div>

                    <div style={{ fontSize: 10, fontStyle: 'italic', color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
                      {s.latin}
                    </div>

                    <div style={{ display: 'flex', gap: 5, marginBottom: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 7px',
                          background: `${color}25`,
                          color,
                          border: `1px solid ${color}44`,
                          borderRadius: 2
                        }}
                      >
                        {s.status}
                      </span>

                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                        {plant ? '🌿 Plant' : '🐾 Animal'}
                      </span>
                    </div>

                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>
                      Confidence: {s.confidence || 0}%
                    </div>

                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>
                      Found by: {s.observer || 'Anonymous'}
                    </div>

                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 7 }}>
                      {s.observedAt
                        ? `🕐 ${new Date(s.observedAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}`
                        : '🕐 Time unknown'}
                    </div>

                    <div
                      style={{ fontSize: 11, color: '#22c55e', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => onSelect(s)}
                    >
                      View species report →
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '12px 16px',
          backdropFilter: 'blur(8px)',
          borderRadius: 3
        }}
      >
        <div style={{ fontSize: 9, letterSpacing: 2, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 8 }}>
          Conservation Status
        </div>

        {[
          ['Critically Endangered', '#dc2626'],
          ['Endangered', '#ef4444'],
          ['Vulnerable', '#f97316'],
          ['Near Threatened', '#eab308'],
          ['Least Concern', '#22c55e'],
        ].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, padding: '2px 0' }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 4px ${color}` }} />
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
          </div>
        ))}

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 8, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Animal (circle)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10 }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, background: '#22c55e', transform: 'rotate(45deg)', flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Plant (diamond)</span>
          </div>
        </div>
      </div>

      {/* At-risk counter */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '8px 14px',
          backdropFilter: 'blur(8px)',
          borderRadius: 3
        }}
      >
        {[['Critically Endangered', '#dc2626'], ['Endangered', '#ef4444'], ['Vulnerable', '#f97316']].map(([status, color]) => {
          const count = sourceSightings.filter(s => s.status === status).length
          if (!count) return null

          return (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{status}</span>
              <span style={{ color, fontWeight: 700, marginLeft: 'auto', paddingLeft: 12, fontSize: 11 }}>{count}</span>
            </div>
          )
        })}

        {!sourceSightings.filter(s => ['Critically Endangered', 'Endangered', 'Vulnerable'].includes(s.status)).length && (
          <div style={{ color: '#22c55e', fontSize: 10 }}>✅ No high-risk sightings</div>
        )}
      </div>

      <EcoIntel sightings={sourceSightings} userCoords={userCoords} />
    </div>
  )
}

function EcoIntel({ sightings, userCoords }) {
  const [collapsed, setCollapsed] = useState(false)
  const [now] = useState(() => Date.now())

  const alerts = useMemo(() => {
    if (!sightings.length) return []

    const items = []

    const last24h = sightings.filter(s => {
      const t =
        s.timestamp?.toDate
          ? s.timestamp.toDate().getTime()
          : new Date(s.observedAt || 0).getTime()
      return now - t < 86400000
    })

    const critRecent = last24h.filter(s => s.status === 'Critically Endangered')
    if (critRecent.length > 0) {
      items.push({ msg: `${critRecent[0].name} — critically endangered detected`, color: '#dc2626' })
    }

    if (userCoords) {
      const nearby = sightings.filter(s => {
        const d = Math.sqrt(
          Math.pow((s.lat - userCoords.lat) * 111, 2) +
          Math.pow((s.lng - userCoords.lng) * 111, 2)
        )
        return d < 50
      })

      const nearbySpecies = new Set(nearby.map(s => s.name)).size
      if (nearbySpecies >= 5) {
        items.push({ msg: `Hotspot: ${nearbySpecies} species within 50km of you`, color: '#22c55e' })
      }
    }

    const atRisk = sightings.filter(s => ['Endangered', 'Critically Endangered'].includes(s.status)).length
    if (sightings.length > 0 && atRisk / sightings.length > 0.2 && atRisk >= 3) {
      items.push({ msg: `${Math.round((atRisk / sightings.length) * 100)}% of observed species are at risk`, color: '#f97316' })
    }

    const lastHour = last24h.filter(s => {
      const t =
        s.timestamp?.toDate
          ? s.timestamp.toDate().getTime()
          : new Date(s.observedAt || 0).getTime()
      return now - t < 3600000
    })

    if (lastHour.length >= 3) {
      items.push({ msg: `${lastHour.length} observations in the last hour — high activity`, color: '#60a5fa' })
    }

    return items.slice(0, 3)
  }, [sightings, userCoords, now])

  if (!alerts.length) return null

  if (collapsed) {
    return (
      <div style={{ position: 'absolute', bottom: 68, left: 20, zIndex: 1000 }}>
        <button
          onClick={() => setCollapsed(false)}
          style={{
            padding: '5px 12px',
            background: 'rgba(0,0,0,0.8)',
            border: '1px solid rgba(96,165,250,0.4)',
            color: '#60a5fa',
            fontSize: 10,
            letterSpacing: 1,
            cursor: 'pointer',
            borderRadius: 2,
            backdropFilter: 'blur(8px)'
          }}
        >
          📡 ECO INTEL ({alerts.length})
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 56,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        maxWidth: 440,
        width: '90%'
      }}
    >
      <div
        style={{
          background: 'rgba(0,0,0,0.82)',
          border: '1px solid rgba(96,165,250,0.25)',
          borderRadius: 4,
          padding: '8px 12px',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: '#60a5fa', textTransform: 'uppercase', fontWeight: 700 }}>
            📡 Ecosystem Intelligence
          </div>
          <button
            onClick={() => setCollapsed(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#5a8a76',
              fontSize: 11,
              cursor: 'pointer',
              padding: 0
            }}
          >
            ▼
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {alerts.map((a, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
                background: `${a.color}12`,
                border: `1px solid ${a.color}33`,
                borderRadius: 3,
                padding: '5px 8px',
                flex: '1 1 160px'
              }}
            >
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: a.color, marginTop: 4, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{a.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function controlBtnStyle(active, color) {
  return {
    padding: '4px 10px',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 0.5,
    cursor: 'pointer',
    borderRadius: 2,
    border: `1px solid ${active ? color : 'rgba(255,255,255,0.15)'}`,
    background: active ? `${color}22` : 'rgba(0,0,0,0.65)',
    color: active ? color : 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(8px)'
  }
}