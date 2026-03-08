import { useEffect, useMemo, useState } from 'react'
import { getSpeciesDetails } from '../services/claudeAPI'
import { fetchTaxonData } from '../services/inatAPI'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

const STATUS_COLORS = {
  'Least Concern': '#34d399',
  'Near Threatened': '#fbbf24',
  'Vulnerable': '#fb923c',
  'Endangered': '#f87171',
  'Critically Endangered': '#dc2626',
  'Unknown': '#60a5fa'
}

const TREND_ICONS = {
  Increasing: '↑',
  Stable: '→',
  Decreasing: '↓'
}

const TREND_COLORS = {
  Increasing: '#34d399',
  Stable: '#fbbf24',
  Decreasing: '#f87171'
}

function getPopulationData(status, trend) {
  const base = {
    'Least Concern': 100,
    'Near Threatened': 70,
    'Vulnerable': 50,
    'Endangered': 30,
    'Critically Endangered': 15
  }[status] || 60

  const delta = trend === 'Increasing' ? 8 : trend === 'Decreasing' ? -12 : 1

  return ['2000', '2005', '2010', '2015', '2018', '2021', '2024'].map((year, i) => ({
    year,
    population: Math.max(5, Math.round(base + delta * i + (Math.random() * 6 - 3)))
  }))
}

function getThreatData(threats) {
  const severities = [85, 70, 55, 45, 35, 25]
  return (threats || []).slice(0, 5).map((t, i) => ({
    name: t.length > 20 ? `${t.slice(0, 20)}…` : t,
    severity: severities[i] || 30
  }))
}

function getRarityMeta(status) {
  return {
    'Critically Endangered': { label: 'ULTRA RARE', color: '#dc2626' },
    'Endangered': { label: 'RARE', color: '#ef4444' },
    'Vulnerable': { label: 'UNCOMMON', color: '#fb923c' },
    'Near Threatened': { label: 'UNCOMMON', color: '#fbbf24' },
    'Least Concern': { label: 'COMMON', color: '#34d399' },
    'Unknown': { label: 'UNKNOWN', color: '#60a5fa' }
  }[status] || { label: 'UNKNOWN', color: '#60a5fa' }
}

function getSignalScore(species) {
  const base = {
    'Critically Endangered': 98,
    'Endangered': 90,
    'Vulnerable': 76,
    'Near Threatened': 61,
    'Least Concern': 42,
    'Unknown': 55
  }[species?.status] || 50

  const confidenceBoost = Math.round((species?.confidence || 0) * 0.08)
  return Math.min(100, base + confidenceBoost)
}

function getEcoImpact(details) {
  if (!details) return 'Supports local ecosystem balance.'
  const text = `${details.habitat || ''} ${details.diet || ''}`.toLowerCase()

  if (text.includes('pollinat')) return 'Pollinator support species'
  if (text.includes('seed')) return 'Seed dispersal contributor'
  if (text.includes('predator')) return 'Helps regulate populations'
  if (text.includes('fung')) return 'Decomposer ecosystem role'
  if (text.includes('wetland')) return 'Wetland health indicator'

  return 'Important biodiversity network member'
}

export default function DetailPanel({
  species,
  onClose,
  topOffset = 90,
  panelWidth = 634,
  inlineMode = false
}) {
  const [details, setDetails] = useState(null)
  const [taxonData, setTaxonData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1400
  )

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!species || species.name === 'Test Species' || species.name === 'Species unclear') return

    setDetails(null)
    setTaxonData(null)
    setError(null)
    setLoading(true)
    setPhotoIdx(0)

    Promise.all([
      getSpeciesDetails(species.name, species.latin, species.status),
      fetchTaxonData(species.taxonId)
    ])
      .then(([det, taxon]) => {
        setDetails(det)
        setTaxonData(taxon)
      })
      .catch(() => setError('Could not load details'))
      .finally(() => setLoading(false))
  }, [species?.name, species?.latin, species?.status, species?.taxonId])

  const isMobile = windowWidth < 900
  const color = STATUS_COLORS[species?.status] || '#34d399'
  const rarity = getRarityMeta(species?.status)
  const signalScore = getSignalScore(species)
  const ecoImpact = getEcoImpact(details)

  const popData = useMemo(
    () => (details ? getPopulationData(species.status, details.populationTrend) : []),
    [details, species?.status]
  )

  const threatData = useMemo(
    () => (details ? getThreatData(details.threats) : []),
    [details]
  )

  const downloadPDF = async () => {
    if (!details) return
    setDownloading(true)

    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      let y = 20

      const addSection = (title) => {
        if (y > 260) {
          doc.addPage()
          y = 20
        }
        doc.setFontSize(12)
        doc.setTextColor(26, 107, 74)
        doc.setFont(undefined, 'bold')
        doc.text(title, 20, y)
        doc.setFont(undefined, 'normal')
        doc.setTextColor(50, 50, 50)
        y += 8
      }

      const addText = (text, indent = 20) => {
        if (!text) return
        if (y > 270) {
          doc.addPage()
          y = 20
        }
        doc.setFontSize(10)
        const lines = doc.splitTextToSize(text, 170 - (indent - 20))
        doc.text(lines, indent, y)
        y += lines.length * 5 + 2
      }

      doc.setFontSize(22)
      doc.setTextColor(26, 107, 74)
      doc.setFont(undefined, 'bold')
      doc.text(`${species.emoji || ''} ${species.name}`, 20, y)
      y += 10

      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.setFont(undefined, 'italic')
      doc.text(species.latin || '', 20, y)
      y += 8

      doc.setFont(undefined, 'normal')
      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.setFillColor(...hexToRgb(color))
      doc.roundedRect(20, y, 68, 7, 2, 2, 'F')
      doc.text(`${species.status}  ·  ${species.confidence}% confidence`, 23, y + 5)
      y += 14

      doc.setDrawColor(200, 230, 210)
      doc.line(20, y, 190, y)
      y += 8

      addSection('About')
      addText(details.description)

      addSection('Quick Facts')
      addText(`Habitat: ${details.habitat}`)
      addText(`Diet: ${details.diet}`)
      addText(`Lifespan: ${details.lifespan}`)
      addText(`Size: ${details.size}`)
      addText(`Native Regions: ${details.nativeRegions}`)

      if (details.scientificClassification) {
        addSection('Scientific Classification')
        const sc = details.scientificClassification
        addText(`Kingdom: ${sc.kingdom}`)
        addText(`Phylum: ${sc.phylum}`)
        addText(`Class: ${sc.class}`)
        addText(`Order: ${sc.order}`)
        addText(`Family: ${sc.family}`)
      }

      addSection('Conservation Actions')
      details.conservationActions?.forEach(a => addText(`• ${a}`, 24))

      addSection('How You Can Help')
      details.howYouCanHelp?.forEach(h => addText(`• ${h}`, 24))

      if (details.careGuide && details.careGuide !== 'N/A') {
        addSection('Care Guide')
        addText(details.careGuide)
      }

      addSection('Population')
      addText(`Trend: ${TREND_ICONS[details.populationTrend] || ''} ${details.populationTrend}`)
      addText(details.population)

      addSection('Threats')
      details.threats?.forEach(t => addText(`• ${t}`, 24))

      addSection('Interesting Facts')
      details.interestingFacts?.forEach(f => addText(`• ${f}`, 24))

      const pages = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `SpeciesSignal · ${species.name} · ${new Date().toLocaleDateString()}  |  Page ${i}/${pages}`,
          20,
          290
        )
      }

      doc.save(`${species.name.replace(/\s+/g, '_')}_SpeciesSignal.pdf`)
    } catch (e) {
      console.error('PDF error:', e)
    } finally {
      setDownloading(false)
    }
  }

  if (!species) return null

  return (
    <div
      style={{
        position: inlineMode ? 'relative' : 'fixed',
        top: inlineMode ? 0 : (isMobile ? 0 : topOffset),
        right: inlineMode ? 'auto' : 0,
        bottom: inlineMode ? 'auto' : 0,
        width: inlineMode ? '100%' : (isMobile ? '100vw' : `min(${panelWidth}px, 92vw)`),
        height: inlineMode ? '100%' : (isMobile ? '100vh' : `calc(100vh - ${topOffset}px)`),
        background: 'linear-gradient(180deg, rgba(7,20,15,0.99) 0%, rgba(5,13,10,0.99) 100%)',
        borderLeft: inlineMode ? 'none' : (isMobile ? 'none' : `1px solid ${color}33`),
        zIndex: 2000,
        overflowY: 'auto',
        boxShadow: inlineMode ? 'none' : (isMobile ? 'none' : '-12px 0 36px rgba(0,0,0,0.55)')
      }}
    >
      <style>{`
        @keyframes panelGlow {
          0% { box-shadow: 0 0 0 rgba(52,211,153,0.0); }
          50% { box-shadow: 0 0 30px rgba(52,211,153,0.10); }
          100% { box-shadow: 0 0 0 rgba(52,211,153,0.0); }
        }

        @keyframes scanLine {
          0% { transform: translateY(-100%); opacity: 0; }
          20% { opacity: 0.22; }
          100% { transform: translateY(220%); opacity: 0; }
        }

        @keyframes softFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0px); }
        }

        @keyframes shimmerMove {
          0% { transform: translateX(-130%); }
          100% { transform: translateX(130%); }
        }

        @media (max-width: 768px) {
          .detail-btn { width: 44px !important; height: 44px !important; font-size: 16px !important; }
        }
      `}</style>

      <div
        style={{
          position: inlineMode ? 'absolute' : 'fixed',
          top: inlineMode ? 0 : (isMobile ? 0 : topOffset),
          right: 0,
          width: inlineMode ? '100%' : (isMobile ? '100vw' : `min(${panelWidth}px, 92vw)`),
          height: inlineMode ? '100%' : (isMobile ? '100vh' : `calc(100vh - ${topOffset}px)`),
          pointerEvents: 'none',
          background:
            'linear-gradient(rgba(52,211,153,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.025) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.18,
          zIndex: 0
        }}
      />

      <div
        style={{
          padding: isMobile ? '16px 16px 14px' : '20px 20px 16px',
          borderBottom: `1px solid ${color}22`,
          background: 'linear-gradient(180deg, rgba(11,30,24,0.94) 0%, rgba(8,22,17,0.88) 100%)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(14px)'
        }}
      >
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            border: `1px solid ${color}33`,
            borderRadius: 18,
            padding: isMobile ? 14 : 16,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
            animation: 'panelGlow 4s ease-in-out infinite'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
              backgroundSize: '26px 26px',
              opacity: 0.14
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-20%',
              width: '40%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
              transform: 'skewX(-18deg)',
              animation: 'shimmerMove 3.8s linear infinite'
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
              position: 'relative',
              zIndex: 1
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                <div
                  style={{
                    fontSize: isMobile ? 34 : 40,
                    filter: `drop-shadow(0 0 12px ${color}88)`,
                    animation: 'softFloat 3.2s ease-in-out infinite'
                  }}
                >
                  {species.emoji || '🌱'}
                </div>

                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: 1.4,
                    color: rarity.color,
                    background: `${rarity.color}18`,
                    border: `1px solid ${rarity.color}55`,
                    borderRadius: 999,
                    padding: '5px 10px',
                    textTransform: 'uppercase'
                  }}
                >
                  {rarity.label}
                </div>

                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1.4,
                    color: '#7dd3fc',
                    background: 'rgba(96,165,250,0.12)',
                    border: '1px solid rgba(96,165,250,0.35)',
                    borderRadius: 999,
                    padding: '5px 10px',
                    textTransform: 'uppercase'
                  }}
                >
                  Signal {signalScore}
                </div>
              </div>

              <div
                style={{
                  fontWeight: 900,
                  fontSize: isMobile ? 18 : 21,
                  color: '#ecfff7',
                  lineHeight: 1.15
                }}
              >
                {species.name}
              </div>

              <div
                style={{
                  fontStyle: 'italic',
                  fontSize: 12,
                  color: '#89bca8',
                  marginTop: 4,
                  marginBottom: 10
                }}
              >
                {species.latin}
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                <Badge text={species.status} color={color} />
                <Badge text={`${species.confidence}% confidence`} color="#34d399" />
                <Badge text={ecoImpact} color="#60a5fa" />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, minmax(0, 1fr))',
                  gap: 8
                }}
              >
                <HeroMiniStat label="Type" value={species.statusCode || 'BIO'} color={color} />
                <HeroMiniStat label="Rarity" value={rarity.label} color={rarity.color} />
                <HeroMiniStat label="Signal" value={`${signalScore}/100`} color="#7dd3fc" />
                <HeroMiniStat label="Class" value={species.emoji || '🌱'} color="#c084fc" />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
              <Btn onClick={onClose} label="✕" color="#8ab49e" />
              <Btn
                onClick={downloadPDF}
                label={downloading ? '⟳' : '⬇'}
                color={details ? color : '#5a8a76'}
                disabled={!details || downloading}
                title="Download PDF report"
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: isMobile ? 16 : 20, position: 'relative', zIndex: 1 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🌿</div>
            <div style={{ color: '#34d399', fontSize: 12, letterSpacing: 3 }}>
              ANALYZING SPECIES...
            </div>
            <div style={{ color: '#5a8a76', fontSize: 11, marginTop: 6 }}>
              Fetching conservation data
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 14,
              background: '#1a0808',
              border: '1px solid #f87171',
              borderRadius: 8,
              color: '#f87171',
              fontSize: 12,
              lineHeight: 1.6
            }}
          >
            {error}
          </div>
        )}

        {taxonData?.photos?.length > 0 && (
          <Section title="Photos from iNaturalist" color={color}>
            <div
              style={{
                position: 'relative',
                marginBottom: 8,
                borderRadius: 16,
                overflow: 'hidden',
                border: `1px solid ${color}22`,
                background: 'rgba(255,255,255,0.02)'
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
                  opacity: 0.15,
                  zIndex: 2
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: 80,
                  background: `linear-gradient(180deg, transparent 0%, ${color}22 45%, transparent 100%)`,
                  zIndex: 3,
                  pointerEvents: 'none',
                  animation: 'scanLine 3.2s linear infinite'
                }}
              />

              <img
                src={taxonData.photos[photoIdx]}
                alt={species.name}
                style={{
                  width: '100%',
                  borderRadius: 10,
                  objectFit: 'cover',
                  maxHeight: 240,
                  display: 'block',
                  border: `1px solid ${color}22`
                }}
                onError={e => {
                  e.target.style.display = 'none'
                }}
              />
            </div>

            {taxonData.photos.length > 1 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {taxonData.photos.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => setPhotoIdx(i)}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: `2px solid ${i === photoIdx ? color : 'transparent'}`,
                      opacity: i === photoIdx ? 1 : 0.5,
                      transition: 'all 0.15s',
                      flexShrink: 0
                    }}
                  >
                    <img
                      src={url}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      alt=""
                    />
                  </div>
                ))}
              </div>
            )}

            {taxonData.observations_count > 0 && (
              <div style={{ fontSize: 10, color: '#5a8a76', marginTop: 8, letterSpacing: 1 }}>
                {taxonData.observations_count.toLocaleString()} observations on iNaturalist
              </div>
            )}
          </Section>
        )}

        {details && (
          <>
            <Section title="About" color={color}>
              <p style={{ fontSize: 13, color: '#b0d4c4', lineHeight: 1.75 }}>
                {details.description}
              </p>

              {taxonData?.wikipedia_url && (
                <a
                  href={taxonData.wikipedia_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 10,
                    padding: '8px 12px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    color: '#b8ffe1',
                    background: 'rgba(52,211,153,0.10)',
                    border: '1px solid rgba(52,211,153,0.22)',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 0.6
                  }}
                >
                  🔗 Open Wikipedia Page
                </a>
              )}
            </Section>

            <Section title="Quick Facts" color={color}>
              {[
                ['Habitat', details.habitat],
                ['Diet', details.diet],
                ['Lifespan', details.lifespan],
                ['Size', details.size],
                ['Native Regions', details.nativeRegions],
              ].map(([label, val]) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(52,211,153,0.06)',
                    fontSize: 12
                  }}
                >
                  <span style={{ color: '#6ea58e', flexShrink: 0 }}>{label}</span>
                  <span style={{ color: '#e2f5ee', textAlign: 'right' }}>{val}</span>
                </div>
              ))}
            </Section>

            {details.scientificClassification && (
              <Section title="Scientific Classification" color={color}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: 8
                  }}
                >
                  {Object.entries(details.scientificClassification).map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        background: 'rgba(52,211,153,0.05)',
                        border: '1px solid rgba(52,211,153,0.10)',
                        borderRadius: 10,
                        padding: '8px 10px'
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          color: '#7bb79f',
                          textTransform: 'uppercase',
                          letterSpacing: 1
                        }}
                      >
                        {k}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#e2f5ee',
                          fontStyle: 'italic',
                          marginTop: 2
                        }}
                      >
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section title="🌍 Conservation Actions" color="#34d399">
              {details.conservationActions?.map((a, i) => (
                <ListItem key={i} text={a} color="#34d399" />
              ))}
            </Section>

            <Section title="💚 How You Can Help" color="#6ee7b7">
              {details.howYouCanHelp?.map((h, i) => (
                <ListItem key={i} text={h} color="#6ee7b7" />
              ))}
            </Section>

            {details.careGuide && details.careGuide !== 'N/A' && (
              <Section title="🪴 Care Guide" color="#fbbf24">
                <p style={{ fontSize: 13, color: '#b0d4c4', lineHeight: 1.75 }}>
                  {details.careGuide}
                </p>
              </Section>
            )}

            <Section title="📈 Population Trend (2000–2024)" color={color}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: 10,
                  marginBottom: 12
                }}
              >
                <StatBox
                  label="Trend"
                  value={`${TREND_ICONS[details.populationTrend] || ''} ${details.populationTrend}`}
                  color={TREND_COLORS[details.populationTrend] || '#fbbf24'}
                />
                <StatBox label="IUCN" value={details.iucnCategory} color={color} />
              </div>

              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={popData}>
                  <XAxis dataKey="year" stroke="#2a4a3a" tick={{ fill: '#5a8a76', fontSize: 10 }} />
                  <YAxis stroke="#2a4a3a" tick={{ fill: '#5a8a76', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#0d1f19',
                      border: `1px solid ${color}44`,
                      color: '#e2f5ee',
                      fontSize: 11
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="population"
                    stroke={color}
                    strokeWidth={2}
                    dot={{ fill: color, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              <p style={{ fontSize: 11, color: '#5a8a76', marginTop: 8, lineHeight: 1.6 }}>
                {details.population}
              </p>
            </Section>

            <Section title="⚠ Threat Severity" color="#f87171">
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={threatData} layout="vertical">
                  <XAxis
                    type="number"
                    stroke="#2a4a3a"
                    tick={{ fill: '#5a8a76', fontSize: 9 }}
                    domain={[0, 100]}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={isMobile ? 80 : 110}
                    tick={{ fill: '#5a8a76', fontSize: 9 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0d1f19',
                      border: '1px solid #f8717144',
                      color: '#e2f5ee',
                      fontSize: 11
                    }}
                  />
                  <Bar dataKey="severity" radius={[0, 6, 6, 0]}>
                    {threatData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i === 0 ? '#dc2626' : i === 1 ? '#f87171' : '#fb923c'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div style={{ marginTop: 10 }}>
                {details.threats?.map((t, i) => (
                  <ListItem key={i} text={t} color="#f87171" />
                ))}
              </div>
            </Section>

            <Section title="✨ Interesting Facts" color="#60a5fa">
              {details.interestingFacts?.map((f, i) => (
                <ListItem key={i} text={f} color="#60a5fa" />
              ))}
            </Section>

            <button
              onClick={downloadPDF}
              disabled={downloading}
              style={{
                width: '100%',
                padding: 14,
                background: `${color}22`,
                border: `1px solid ${color}`,
                color,
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: 2,
                textTransform: 'uppercase',
                cursor: 'pointer',
                marginTop: 8,
                borderRadius: 10
              }}
            >
              {downloading ? '⟳ Generating PDF...' : '⬇ Download Species Report'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 2,
          color,
          textTransform: 'uppercase',
          marginBottom: 12,
          paddingBottom: 7,
          borderBottom: `1px solid ${color}33`
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function HeroMiniStat({ label, value, color }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: `1px solid ${color}22`,
        borderRadius: 12,
        padding: '8px 10px'
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: '#78a996',
          textTransform: 'uppercase',
          letterSpacing: 1.1,
          marginBottom: 3
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color
        }}
      >
        {value}
      </div>
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div
      style={{
        flex: 1,
        background: `${color}11`,
        border: `1px solid ${color}33`,
        borderRadius: 10,
        padding: '9px 12px'
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: '#7bb79f',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 4
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

function ListItem({ text, color }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
      <span style={{ color, flexShrink: 0, marginTop: 1 }}>▸</span>
      <span style={{ fontSize: 12, color: '#b0d4c4', lineHeight: 1.6 }}>{text}</span>
    </div>
  )
}

function Badge({ text, color }) {
  return (
    <span
      style={{
        fontSize: 11,
        padding: '4px 10px',
        background: `${color}22`,
        color,
        border: `1px solid ${color}44`,
        borderRadius: 999
      }}
    >
      {text}
    </span>
  )
}

function Btn({ onClick, label, color, disabled, title }) {
  return (
    <button
      className="detail-btn"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${color}44`,
        color,
        width: 34,
        height: 34,
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: 8,
        fontSize: 14
      }}
    >
      {label}
    </button>
  )
}

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r
    ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)]
    : [52, 211, 153]
}