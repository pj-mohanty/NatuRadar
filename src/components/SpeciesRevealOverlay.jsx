import { useEffect } from 'react'

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
  'Unknown': { label: 'UNKNOWN', color: '#60a5fa' },
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

export default function SpeciesRevealOverlay({
  species,
  isNew = false,
  onClose,
  onOpenDetails
}) {
  useEffect(() => {
    const t = setTimeout(() => {
      onClose?.()
    }, 4200)

    return () => clearTimeout(t)
  }, [onClose])

  if (!species) return null

  const color = STATUS_COLORS[species.status] || '#34d399'
  const rarity = RARITY[species.status] || RARITY.Unknown
  const signalScore = getSignalScore(species)

  return (
    <>
      <style>{`
        @keyframes revealBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes revealCardIn {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.88);
            filter: blur(10px);
          }
          65% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.03);
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
            filter: blur(0px);
          }
        }

        @keyframes scanSweep {
          0% {
            transform: translateY(-130%);
            opacity: 0;
          }
          20% {
            opacity: 0.35;
          }
          100% {
            transform: translateY(240%);
            opacity: 0;
          }
        }

        @keyframes pulseRing {
          0% {
            transform: scale(0.92);
            opacity: 0.7;
          }
          100% {
            transform: scale(1.22);
            opacity: 0;
          }
        }

        @keyframes shimmerPass {
          0% { transform: translateX(-140%) skewX(-18deg); }
          100% { transform: translateX(180%) skewX(-18deg); }
        }

        @keyframes softFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0px); }
        }
      `}</style>

      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9500,
          background: 'rgba(2,8,6,0.74)',
          backdropFilter: 'blur(12px)',
          animation: 'revealBackdropIn 0.25s ease'
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(560px, calc(100vw - 28px))',
            maxHeight: 'min(86vh, 720px)',
            borderRadius: 24,
            overflow: 'hidden',
            border: `1px solid ${color}55`,
            background:
                'linear-gradient(180deg, rgba(10,25,20,0.98) 0%, rgba(6,15,12,0.98) 100%)',
            boxShadow: `0 0 60px ${color}22, inset 0 0 40px rgba(255,255,255,0.02)`,
            animation: 'revealCardIn 0.45s cubic-bezier(.2,.8,.2,1)'
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
              opacity: 0.12
            }}
          />

          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: `radial-gradient(circle at top, ${color}22, transparent 55%)`
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: '-25%',
              top: 0,
              width: '38%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)',
              animation: 'shimmerPass 3.4s linear infinite',
              pointerEvents: 'none'
            }}
          />

          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: `linear-gradient(180deg, transparent 0%, ${color}22 48%, transparent 100%)`,
              height: 110,
              animation: 'scanSweep 2.6s linear infinite'
            }}
          />

          <div
            style={{
              position: 'relative',
              padding: '18px 18px 12px',
              borderBottom: `1px solid ${color}22`
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 2.4,
                  textTransform: 'uppercase',
                  fontWeight: 900,
                  color: '#89cbb1'
                }}
              >
                Species Signal Detected
              </div>

              <button
                onClick={onClose}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#9fd4be',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                ✕
              </button>
            </div>
          </div>

          <div style={{ padding: '24px 22px 20px', position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: 112,
                  height: 112,
                  marginBottom: 16,
                  display: 'grid',
                  placeItems: 'center'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: `1px solid ${color}44`,
                    animation: 'pulseRing 1.8s ease-out infinite'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 12,
                    borderRadius: '50%',
                    border: `1px solid ${color}33`,
                    animation: 'pulseRing 1.8s ease-out infinite 0.35s'
                  }}
                />
                <div
                  style={{
                    width: 86,
                    height: 86,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    background: `${color}15`,
                    border: `1px solid ${color}44`,
                    boxShadow: `0 0 30px ${color}22`,
                    fontSize: 46,
                    filter: `drop-shadow(0 0 10px ${color}99)`,
                    animation: 'softFloat 3s ease-in-out infinite'
                  }}
                >
                  {species.emoji || '🌱'}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  marginBottom: 12
                }}
              >
                <Chip text={rarity.label} color={rarity.color} />
                <Chip text={species.status} color={color} />
                <Chip text={`Signal ${signalScore}`} color="#60a5fa" />
              </div>

              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: '#ecfff7',
                  lineHeight: 1.1,
                  marginBottom: 6
                }}
              >
                {species.name}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: '#84bca5',
                  fontStyle: 'italic',
                  marginBottom: 14
                }}
              >
                {species.latin}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: '#d9fff1',
                  marginBottom: 8,
                  fontWeight: 700
                }}
              >
                {isNew ? 'New species added to BioDex archive' : 'Species identified successfully'}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: '#8dbca9',
                  marginBottom: 18
                }}
              >
                Confidence {species.confidence || 0}% · conservation level detected
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 10,
                  width: '100%',
                  marginBottom: 18
                }}
              >
                <MiniStat label="Status" value={species.statusCode || 'BIO'} color={color} />
                <MiniStat label="Confidence" value={`${species.confidence || 0}%`} color="#34d399" />
                <MiniStat label="Rarity" value={rarity.label} color={rarity.color} />
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}
              >
                <button
                  onClick={onOpenDetails}
                  style={{
                    padding: '11px 16px',
                    borderRadius: 12,
                    border: `1px solid ${color}`,
                    background: `${color}18`,
                    color,
                    fontWeight: 800,
                    letterSpacing: 0.6,
                    cursor: 'pointer'
                  }}
                >
                  Open Full Dossier
                </button>

                <button
                  onClick={onClose}
                  style={{
                    padding: '11px 16px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#ccefe1',
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    cursor: 'pointer'
                  }}
                >
                  Continue Scanning
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function Chip({ text, color }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color,
        background: `${color}18`,
        border: `1px solid ${color}44`,
        borderRadius: 999,
        padding: '6px 10px'
      }}
    >
      {text}
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${color}22`,
        borderRadius: 14,
        padding: '10px 12px'
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: '#79a996',
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          marginBottom: 4
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color
        }}
      >
        {value}
      </div>
    </div>
  )
}