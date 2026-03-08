import { useState } from 'react'

const STATUS_COLORS = {
  'Least Concern': '#22c55e', 'Near Threatened': '#eab308',
  'Vulnerable': '#f97316', 'Endangered': '#ef4444',
  'Critically Endangered': '#dc2626', 'Unknown': '#60a5fa'
}

const RARITY = {
  'Critically Endangered': { label: 'ULTRA RARE', color: '#dc2626' },
  'Endangered':            { label: 'RARE',       color: '#ef4444' },
  'Vulnerable':            { label: 'UNCOMMON',   color: '#f97316' },
  'Near Threatened':       { label: 'UNCOMMON',   color: '#eab308' },
  'Least Concern':         { label: 'COMMON',     color: '#22c55e' },
  'Unknown':               { label: 'UNKNOWN',    color: '#60a5fa' },
}

const EMOJI_CATEGORY = {
  '🌿': 'plants', '🌱': 'plants', '🌲': 'plants', '🌸': 'plants',
  '🌺': 'plants', '🌻': 'plants', '🌾': 'plants', '🌼': 'plants',
  '🐦': 'birds', '🦅': 'birds',
  '🦌': 'mammals', '🐾': 'mammals',
  '🦋': 'insects', '🕷️': 'insects',
  '🦎': 'reptiles',
  '🐸': 'amphibians',
  '🐟': 'fish', '🐠': 'fish',
  '🍄': 'fungi',
  '🐚': 'marine', '🐬': 'marine', '🐋': 'marine',
}

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'plants', label: '🌿 Plants' },
  { key: 'birds', label: '🐦 Birds' },
  { key: 'mammals', label: '🐾 Mammals' },
  { key: 'insects', label: '🦋 Insects' },
  { key: 'reptiles', label: '🦎 Reptiles' },
  { key: 'fish', label: '🐟 Fish' },
  { key: 'fungi', label: '🍄 Fungi' },
  { key: 'marine', label: '🐚 Marine' },
]

function getCategory(emoji) {
  return EMOJI_CATEGORY[emoji] || 'other'
}

export function addToBioDex(result, coords, userPhoto) {
  const key = (result.latin || result.name).toLowerCase()
  const dex = getBioDex()
  const isNew = !dex[key]
  const safeEmoji = result.emoji || '🌱'

  dex[key] = {
    name: result.name,
    latin: result.latin || '',
    emoji: safeEmoji,
    status: result.status || 'Unknown',
    statusCode: result.statusCode || '?',
    taxonId: result.taxonId || null,
    photo: result.photo || null,
    userPhoto: userPhoto || dex[key]?.userPhoto || null,
    category: getCategory(safeEmoji),
    discoveredAt: dex[key]?.discoveredAt || new Date().toISOString(),
    lat: dex[key]?.lat || coords?.lat || 0,
    lng: dex[key]?.lng || coords?.lng || 0,
    scanCount: (dex[key]?.scanCount || 0) + 1,
  }
  saveBioDex(dex)
  return { isNew }
}

export function getBioDex() {
  try { return JSON.parse(localStorage.getItem('species_biodex') || '{}') } catch { return {} }
}

function saveBioDex(dex) {
  try { localStorage.setItem('species_biodex', JSON.stringify(dex)) } catch {}
}

export default function BioDex({ biodex }) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedEntry, setSelectedEntry] = useState(null)

  const entries = Object.values(biodex)
  const filtered = activeCategory === 'all'
    ? entries
    : entries.filter(e => e.category === activeCategory)

  const sorted = [...filtered].sort((a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt))

  const catCounts = {}
  entries.forEach(e => { catCounts[e.category || 'other'] = (catCounts[e.category || 'other'] || 0) + 1 })

  const endangered = entries.filter(e => ['Endangered', 'Critically Endangered'].includes(e.status)).length

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid rgba(52,211,153,0.15)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#34d399' }}>{entries.length}</span>
            <span style={{ fontSize: 11, color: '#5a8a76', marginLeft: 6 }}>species in BioDex</span>
          </div>
          <div style={{ fontSize: 10, color: '#5a8a76', letterSpacing: 1 }}>/ 300 target</div>
        </div>

        <div style={{ background: 'rgba(52,211,153,0.08)', borderRadius: 2, height: 3, marginBottom: 8 }}>
          <div style={{
            background: 'linear-gradient(90deg, #22c55e, #6ee7b7)',
            height: 3, borderRadius: 2,
            width: `${Math.min((entries.length / 300) * 100, 100)}%`,
            transition: 'width 0.6s ease'
          }} />
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {[
            ['CE', '#dc2626', entries.filter(e => e.status === 'Critically Endangered').length],
            ['EN', '#ef4444', entries.filter(e => e.status === 'Endangered').length],
            ['VU', '#f97316', entries.filter(e => e.status === 'Vulnerable').length],
            ['NT', '#eab308', entries.filter(e => e.status === 'Near Threatened').length],
            ['LC', '#22c55e', entries.filter(e => e.status === 'Least Concern').length],
          ].filter(([,, c]) => c > 0).map(([code, color, count]) => (
            <span key={code} style={{
              fontSize: 9, padding: '2px 6px',
              background: `${color}15`, color,
              border: `1px solid ${color}33`, borderRadius: 2, letterSpacing: 0.5
            }}>
              {count} {code}
            </span>
          ))}
          {endangered > 0 && (
            <span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 2 }}>
              🚨 {endangered} at risk found
            </span>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex', overflowX: 'auto', padding: '6px 12px',
        gap: 4, flexShrink: 0, borderBottom: '1px solid rgba(52,211,153,0.08)',
        scrollbarWidth: 'none'
      }}>
        {CATEGORIES.map(cat => {
          const count = cat.key === 'all' ? entries.length : (catCounts[cat.key] || 0)
          return (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)} style={{
              padding: '3px 9px', fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
              cursor: 'pointer', borderRadius: 2, flexShrink: 0, whiteSpace: 'nowrap',
              background: activeCategory === cat.key ? 'rgba(52,211,153,0.12)' : 'transparent',
              border: `1px solid ${activeCategory === cat.key ? '#34d399' : 'rgba(52,211,153,0.15)'}`,
              color: activeCategory === cat.key ? '#34d399' : '#5a8a76',
              transition: 'all 0.15s'
            }}>
              {cat.label}{count > 0 ? ` ${count}` : ''}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 40, color: '#2a4a3a' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📖</div>
            <div style={{ fontSize: 12, lineHeight: 1.7 }}>
              {entries.length === 0
                ? 'Your BioDex is empty.\nScan a species to start collecting!'
                : 'No species in this category yet.'}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {sorted.map(entry => {
            const rarity = RARITY[entry.status] || RARITY['Unknown']
            const color = STATUS_COLORS[entry.status] || '#22c55e'
            const date = new Date(entry.discoveredAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
            const isSelected = selectedEntry === (entry.latin || entry.name)

            return (
              <div
                key={entry.latin || entry.name}
                onClick={() => setSelectedEntry(isSelected ? null : (entry.latin || entry.name))}
                style={{
                  background: isSelected ? '#0d2a1f' : '#0a1a14',
                  border: `1px solid ${isSelected ? color : color + '25'}`,
                  borderTop: `2px solid ${color}`,
                  borderRadius: 3, overflow: 'hidden',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
              >
                <div style={{
                  height: 64, background: `${color}08`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', overflow: 'hidden'
                }}>
                  {entry.photo ? (
                    <img src={entry.photo} alt={entry.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <span style={{ fontSize: 30, filter: `drop-shadow(0 0 6px ${color}88)` }}>{entry.emoji}</span>
                  )}
                  <div style={{
                    position: 'absolute', top: 3, right: 3,
                    fontSize: 7, padding: '1px 4px', borderRadius: 1,
                    background: `${rarity.color}dd`, color: '#fff',
                    fontWeight: 800, letterSpacing: 0.5
                  }}>
                    {rarity.label}
                  </div>
                  {entry.scanCount > 1 && (
                    <div style={{
                      position: 'absolute', bottom: 3, left: 3,
                      fontSize: 8, padding: '1px 4px', borderRadius: 1,
                      background: 'rgba(0,0,0,0.7)', color: '#34d399'
                    }}>
                      ×{entry.scanCount}
                    </div>
                  )}
                </div>

                <div style={{ padding: '6px 7px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#e2f5ee', lineHeight: 1.3, marginBottom: 1 }}>
                    {entry.emoji} {entry.name}
                  </div>
                  <div style={{
                    fontSize: 9, color: '#5a8a76', fontStyle: 'italic',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4
                  }}>
                    {entry.latin}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9, color, fontWeight: 700 }}>{entry.statusCode || 'LC'}</span>
                    <span style={{ fontSize: 9, color: '#5a8a76' }}>{date}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}