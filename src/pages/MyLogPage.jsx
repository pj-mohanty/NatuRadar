import { useState, useEffect, useMemo } from 'react'
import DetailPanel from '../components/DetailPanel'

const STATUS_COLORS = {
  'Least Concern': '#22c55e',
  'Near Threatened': '#eab308',
  'Vulnerable': '#f97316',
  'Endangered': '#ef4444',
  'Critically Endangered': '#dc2626',
  'Unknown': '#60a5fa'
}

const RARITY = {
  'Critically Endangered': { label: 'ULTRA RARE', color: '#dc2626' },
  'Endangered': { label: 'RARE', color: '#ef4444' },
  'Vulnerable': { label: 'UNCOMMON', color: '#f97316' },
  'Near Threatened': { label: 'UNCOMMON', color: '#eab308' },
  'Least Concern': { label: 'COMMON', color: '#22c55e' },
  'Unknown': { label: 'UNKNOWN', color: '#60a5fa' }
}

const FLORA_EMOJIS = ['🌿', '🌱', '🌲', '🌸', '🌺', '🌻', '🌾']

function isFlora(entry) {
  return FLORA_EMOJIS.includes(entry.emoji)
}

function getFilteredEntries(entries, filter) {
  if (filter === 'flora') return entries.filter(isFlora)
  if (filter === 'fauna') return entries.filter((e) => !isFlora(e))
  return entries
}

function getSafeTime(value) {
  const t = new Date(value).getTime()
  return Number.isNaN(t) ? 0 : t
}

function buildPlaceholders(filter, countNeeded = 4) {
  const floraPlaceholders = [
    { id: 'ph-f-1', emoji: '🌿', title: 'Unknown Flora', subtitle: 'Future plant discovery' },
    { id: 'ph-f-2', emoji: '🌸', title: 'Unknown Bloom', subtitle: 'Scan to reveal species' },
    { id: 'ph-f-3', emoji: '🌲', title: 'Unknown Tree', subtitle: 'Awaiting identification' },
    { id: 'ph-f-4', emoji: '🍄', title: 'Unknown Fungi', subtitle: 'New specimen slot' }
  ]

  const faunaPlaceholders = [
    { id: 'ph-a-1', emoji: '🐦', title: 'Unknown Avian', subtitle: 'Future fauna discovery' },
    { id: 'ph-a-2', emoji: '🦋', title: 'Unknown Insect', subtitle: 'Scan to reveal species' },
    { id: 'ph-a-3', emoji: '🐾', title: 'Unknown Mammal', subtitle: 'Awaiting identification' },
    { id: 'ph-a-4', emoji: '🐸', title: 'Unknown Creature', subtitle: 'New specimen slot' }
  ]

  const mixed = [
    { id: 'ph-m-1', emoji: '🌿', title: 'Unknown Flora', subtitle: 'Future plant discovery' },
    { id: 'ph-m-2', emoji: '🐦', title: 'Unknown Fauna', subtitle: 'Future animal discovery' },
    { id: 'ph-m-3', emoji: '🦋', title: 'Unknown Insect', subtitle: 'Scan to reveal species' },
    { id: 'ph-m-4', emoji: '🌸', title: 'Unknown Bloom', subtitle: 'New specimen slot' }
  ]

  const source =
    filter === 'flora' ? floraPlaceholders :
    filter === 'fauna' ? faunaPlaceholders :
    mixed

  return source.slice(0, countNeeded)
}

export default function MyLogPage({ sightings = [] }) {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1400
  )

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const detailPanelWidth = 634
  const navbarHeight = 90
  const isMobile = windowWidth < 900
  const isPanelOpen = !!selected

  const entries = useMemo(() => {
    return sightings.map((s) => ({
      id: s.id,
      name: s.name,
      latin: s.latin || '',
      emoji: s.emoji || '🌿',
      status: s.status || 'Unknown',
      statusCode: s.statusCode || 'UN',
      taxonId: s.taxonId || null,
      photo: s.photo || null,
      confidence: s.confidence ?? 0,
      discoveredAt: s.observedAt || s.createdAt || null,
      lat: s.lat,
      lng: s.lng,
      scanCount: 1
    }))
  }, [sightings])

  const floraCount = entries.filter(isFlora).length
  const faunaCount = entries.filter((e) => !isFlora(e)).length

  const filtered = useMemo(() => getFilteredEntries(entries, filter), [entries, filter])

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => getSafeTime(b.discoveredAt) - getSafeTime(a.discoveredAt)),
    [filtered]
  )

  const atRiskCount = entries.filter((e) =>
    ['Vulnerable', 'Endangered', 'Critically Endangered'].includes(e.status)
  ).length

  const repeatedScans = entries.filter((e) => (e.scanCount || 0) > 1).length

  const placeholderCount = Math.max(0, 6 - sorted.length)
  const placeholders = buildPlaceholders(filter, Math.min(placeholderCount, 4))

  const handleCardClick = (entry) => {
    const isSame = selected?.id === entry.id
    setSelected(isSame ? null : entry)
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'grid',
        gridTemplateColumns: !isMobile && isPanelOpen ? `minmax(0, 1fr) ${detailPanelWidth}px` : 'minmax(0, 1fr) 0px',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at top left, rgba(52,211,153,0.06), transparent 24%), radial-gradient(circle at bottom right, rgba(96,165,250,0.05), transparent 22%), #050d0a'
      }}
    >
      <style>{`
        @keyframes detailsSlideOnly {
          from {
            opacity: 0;
            transform: translateX(28px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      <div
        style={{
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'relative',
            padding: isMobile ? '16px 16px 14px' : '18px 24px 16px',
            borderBottom: '1px solid rgba(52,211,153,0.14)',
            background: 'linear-gradient(180deg, rgba(8,20,16,0.96) 0%, rgba(5,13,10,0.92) 100%)',
            overflow: 'hidden',
            flexShrink: 0
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
              opacity: 0.22
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                fontSize: 11,
                color: '#8ccab0',
                letterSpacing: 2.4,
                textTransform: 'uppercase',
                fontWeight: 800,
                marginBottom: 6
              }}
            >
              Personal Archive
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: 16,
                flexWrap: 'wrap'
              }}
            >
              <div>
                <div style={{ fontSize: isMobile ? 26 : 30, fontWeight: 900, color: '#34d399', lineHeight: 1 }}>
                  {entries.length}
                </div>
                <div style={{ fontSize: 13, color: '#7bb79f', marginTop: 6 }}>
                  species in your log
                </div>
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: '#7bb79f',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase'
                }}
              >
                Synced from live sightings
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                background: 'rgba(52,211,153,0.08)',
                borderRadius: 999,
                height: 6,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: 6,
                  borderRadius: 999,
                  width: `${Math.min((entries.length / 300) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #22c55e, #6ee7b7)',
                  transition: 'width 0.6s ease'
                }}
              />
            </div>

            <div
              style={{
                marginTop: 12,
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap'
              }}
            >
              <StatChip label="Flora" value={floraCount} color="#22c55e" />
              <StatChip label="Fauna" value={faunaCount} color="#60a5fa" />
              <StatChip label="At Risk" value={atRiskCount} color="#ef4444" />
              <StatChip label="Repeat Finds" value={repeatedScans} color="#fbbf24" />
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: isMobile ? '12px 16px 10px' : '14px 24px 12px',
            borderBottom: '1px solid rgba(52,211,153,0.08)',
            background: 'rgba(6,16,13,0.94)',
            flexShrink: 0,
            flexWrap: 'wrap'
          }}
        >
          <FilterTab
            label="All"
            icon="🧬"
            count={entries.length}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <FilterTab
            label="Flora"
            icon="🌿"
            count={floraCount}
            active={filter === 'flora'}
            onClick={() => setFilter('flora')}
          />
          <FilterTab
            label="Fauna"
            icon="🐾"
            count={faunaCount}
            active={filter === 'fauna'}
            onClick={() => setFilter('fauna')}
          />
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'scroll',
            padding: isMobile ? '16px 16px 22px' : '22px 24px 28px'
          }}
        >
          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 90 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📖</div>
              <div style={{ fontSize: 18, color: '#d8fff0', fontWeight: 800 }}>
                Your log is empty
              </div>
              <div style={{ fontSize: 13, color: '#7bb79f', marginTop: 8, lineHeight: 1.7 }}>
                No sightings found for this user yet.
              </div>

              <div
                style={{
                  marginTop: 28,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                  gap: 14,
                  maxWidth: 900,
                  marginInline: 'auto'
                }}
              >
                {buildPlaceholders('all', 4).map((ph) => (
                  <PlaceholderCard key={ph.id} item={ph} />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                  gap: 12,
                  flexWrap: 'wrap'
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: '#8bc7ae',
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    fontWeight: 800
                  }}
                >
                  {filter === 'all' ? 'All Discoveries' : filter === 'flora' ? 'Flora Discoveries' : 'Fauna Discoveries'}
                </div>

                <div style={{ fontSize: 12, color: '#6ea58e' }}>
                  {sorted.length} visible · {entries.length} total
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 16
                }}
              >
                {sorted.map((entry) => (
                  <SpeciesCard
                    key={entry.id}
                    entry={entry}
                    selected={selected?.id === entry.id}
                    onClick={() => handleCardClick(entry)}
                  />
                ))}

                {placeholders.map((ph) => (
                  <PlaceholderCard key={ph.id} item={ph} />
                ))}
              </div>

              {sorted.length === 0 && (
                <div style={{ textAlign: 'center', paddingTop: 48 }}>
                  <div style={{ fontSize: 12, color: '#8ab49e' }}>
                    No {filter} discoveries yet.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {!isMobile && (
        <div
          style={{
            width: detailPanelWidth,
            minWidth: 0,
            overflow: 'hidden',
            position: 'relative',
            borderLeft: isPanelOpen ? '1px solid rgba(52,211,153,0.14)' : 'none',
            background: isPanelOpen ? 'rgba(4,10,8,0.55)' : 'transparent'
          }}
        >
          <div
            style={{
              width: detailPanelWidth,
              height: '100%',
              transform: isPanelOpen ? 'translateX(0)' : `translateX(${detailPanelWidth}px)`,
              opacity: isPanelOpen ? 1 : 0,
              transition: 'transform 0.28s ease, opacity 0.2s ease',
              pointerEvents: isPanelOpen ? 'auto' : 'none'
            }}
          >
            {selected && (
              <div style={{ height: '100%', animation: 'detailsSlideOnly 0.22s ease-out' }}>
                <DetailPanel
                  species={selected}
                  onClose={() => setSelected(null)}
                  topOffset={navbarHeight}
                  panelWidth={detailPanelWidth}
                  inlineMode
                />
              </div>
            )}
          </div>
        </div>
      )}

      {isMobile && selected && (
        <DetailPanel
          species={selected}
          onClose={() => setSelected(null)}
          topOffset={navbarHeight}
          panelWidth={detailPanelWidth}
        />
      )}
    </div>
  )
}

function StatChip({ label, value, color }) {
  return (
    <div
      style={{
        background: `${color}12`,
        border: `1px solid ${color}26`,
        borderRadius: 999,
        padding: '5px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}
    >
      <span style={{ fontSize: 11, color, fontWeight: 800 }}>{value}</span>
      <span
        style={{
          fontSize: 10,
          color: '#b7e8d2',
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: 700
        }}
      >
        {label}
      </span>
    </div>
  )
}

function FilterTab({ label, icon, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '9px 16px',
        background: active
          ? 'linear-gradient(180deg, rgba(52,211,153,0.16) 0%, rgba(52,211,153,0.07) 100%)'
          : 'rgba(255,255,255,0.02)',
        border: `1px solid ${active ? 'rgba(52,211,153,0.45)' : 'rgba(52,211,153,0.12)'}`,
        borderRadius: 12,
        cursor: 'pointer',
        color: active ? '#d8fff0' : '#7bb79f',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: active ? '0 0 18px rgba(52,211,153,0.10)' : 'none',
        transition: 'all 0.18s ease'
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 0.8,
          textTransform: 'uppercase'
        }}
      >
        {label}
      </span>
      <span
        style={{
          minWidth: 20,
          height: 20,
          borderRadius: 999,
          background: active ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${active ? 'rgba(52,211,153,0.24)' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 800,
          color: active ? '#34d399' : '#9acdb7'
        }}
      >
        {count}
      </span>
    </button>
  )
}

function SpeciesCard({ entry, selected, onClick }) {
  const [imgFailed, setImgFailed] = useState(false)

  const color = STATUS_COLORS[entry.status] || '#22c55e'
  const rarity = RARITY[entry.status] || RARITY.Unknown
  const date = entry.discoveredAt
    ? new Date(entry.discoveredAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
    : 'Unknown'

  const showImage = !!entry.photo && !imgFailed

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        background: selected
          ? 'linear-gradient(180deg, rgba(15,38,30,1) 0%, rgba(9,21,17,1) 100%)'
          : 'linear-gradient(180deg, rgba(11,25,20,1) 0%, rgba(7,16,13,1) 100%)',
        border: `1px solid ${selected ? color : color + '25'}`,
        borderRadius: 18,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        boxShadow: selected
          ? `0 0 26px ${color}33, inset 0 0 30px rgba(255,255,255,0.02)`
          : '0 0 0 transparent',
        transform: selected ? 'translateY(-2px)' : 'translateY(0)'
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
          opacity: 0.1
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: 0.95
        }}
      />

      <div
        style={{
          height: 132,
          background: `radial-gradient(circle at top, ${color}15, transparent 60%), ${color}08`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.05), transparent 35%, transparent 65%, rgba(255,255,255,0.02))'
          }}
        />

        {showImage ? (
          <img
            src={entry.photo}
            alt={entry.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span style={{ fontSize: 50, filter: `drop-shadow(0 0 12px ${color}99)` }}>
            {entry.emoji}
          </span>
        )}

        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            fontSize: 8,
            padding: '4px 8px',
            borderRadius: 999,
            background: 'rgba(0,0,0,0.58)',
            border: `1px solid ${color}55`,
            color: '#dffff1',
            fontWeight: 800,
            letterSpacing: 0.7,
            textTransform: 'uppercase'
          }}
        >
          Collected
        </div>

        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontSize: 8,
            padding: '4px 8px',
            borderRadius: 999,
            background: `${rarity.color}dd`,
            color: '#fff',
            fontWeight: 900,
            letterSpacing: 0.7
          }}
        >
          {rarity.label}
        </div>

        {(entry.scanCount || 0) > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              fontSize: 9,
              padding: '3px 8px',
              borderRadius: 999,
              background: 'rgba(0,0,0,0.7)',
              color: '#34d399',
              fontWeight: 800
            }}
          >
            ×{entry.scanCount} scans
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            fontSize: 9,
            padding: '3px 8px',
            borderRadius: 999,
            background: `${color}22`,
            border: `1px solid ${color}44`,
            color,
            fontWeight: 800
          }}
        >
          {entry.statusCode || 'LC'}
        </div>
      </div>

      <div style={{ padding: '12px 12px 13px', position: 'relative' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 900,
            color: '#ecfff7',
            lineHeight: 1.3,
            marginBottom: 4
          }}
        >
          {entry.emoji} {entry.name}
        </div>

        <div
          style={{
            fontSize: 10,
            color: '#7bb79f',
            fontStyle: 'italic',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: 10
          }}
        >
          {entry.latin}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span
            style={{
              fontSize: 10,
              color,
              fontWeight: 800,
              letterSpacing: 0.5,
              textTransform: 'uppercase'
            }}
          >
            {entry.status}
          </span>

          <span style={{ fontSize: 10, color: '#6ea58e' }}>
            {date}
          </span>
        </div>
      </div>
    </div>
  )
}








function PlaceholderCard({ item }) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px dashed rgba(140,199,174,0.18)',
        borderRadius: 14,
        overflow: 'hidden',
        minHeight: 214,
        opacity: 0.85
      }}
    >
      <div
        style={{
          height: 118,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.015)'
        }}
      >
        <span
          style={{
            fontSize: 42,
            filter: 'grayscale(0.2)',
            opacity: 0.7
          }}
        >
          {item.emoji}
        </span>
      </div>

      <div style={{ padding: '10px 11px 11px' }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#96bbaa',
            lineHeight: 1.35,
            marginBottom: 4
          }}
        >
          {item.title}
        </div>

        <div
          style={{
            fontSize: 10,
            color: '#5f8778',
            lineHeight: 1.5
          }}
        >
          {item.subtitle}
        </div>

        <div
          style={{
            marginTop: 10,
            display: 'inline-block',
            fontSize: 9,
            color: '#8ccab0',
            background: 'rgba(52,211,153,0.08)',
            border: '1px solid rgba(52,211,153,0.14)',
            borderRadius: 999,
            padding: '3px 7px',
            fontWeight: 700,
            letterSpacing: 0.5
          }}
        >
          Empty slot
        </div>
      </div>
    </div>
  )
}