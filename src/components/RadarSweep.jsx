import { useEffect } from 'react'

export default function RadarSweep() {
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      @keyframes radarRotate {
        from { transform: translate(-50%, -50%) rotate(0deg); }
        to   { transform: translate(-50%, -50%) rotate(360deg); }
      }

      @keyframes radarPulseRing {
        0%   { transform: translate(-50%, -50%) scale(0.92); opacity: 0.18; }
        50%  { opacity: 0.08; }
        100% { transform: translate(-50%, -50%) scale(1.06); opacity: 0.18; }
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  return (
    <>
      {/* rotating sweep */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 520,
          height: 520,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          background:
            'conic-gradient(from 0deg, rgba(52,211,153,0.00) 0deg, rgba(52,211,153,0.00) 300deg, rgba(52,211,153,0.18) 332deg, rgba(110,231,183,0.28) 346deg, rgba(52,211,153,0.00) 360deg)',
          animation: 'radarRotate 9s linear infinite',
          pointerEvents: 'none',
          zIndex: 450,
          mixBlendMode: 'screen'
        }}
      />

      {/* main ring */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 520,
          height: 520,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          border: '1px solid rgba(52,211,153,0.18)',
          boxShadow: '0 0 18px rgba(52,211,153,0.08)',
          pointerEvents: 'none',
          zIndex: 440
        }}
      />

      {/* inner rings */}
      {[380, 240, 100].map((size) => (
        <div
          key={size}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: size,
            height: size,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            border: '1px solid rgba(52,211,153,0.10)',
            pointerEvents: 'none',
            zIndex: 440
          }}
        />
      ))}

      {/* soft breathing ring */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 520,
          height: 520,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          border: '1px solid rgba(110,231,183,0.14)',
          animation: 'radarPulseRing 3.6s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 430
        }}
      />

      {/* center dot */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 12,
          height: 12,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#6ee7b7',
          boxShadow: '0 0 16px rgba(110,231,183,0.7)',
          pointerEvents: 'none',
          zIndex: 460
        }}
      />
    </>
  )
}