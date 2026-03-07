import { useEffect } from 'react'

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        minWidth: 118,
        height: 64,
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        cursor: 'pointer',
        position: 'relative',
        color: active ? '#eafff6' : 'rgba(214,245,232,0.72)',
        transition: 'all 0.25s ease',
        background: active
          ? 'linear-gradient(180deg, rgba(52,211,153,0.20), rgba(52,211,153,0.06))'
          : 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))',
        border: active
          ? '1px solid rgba(52,211,153,0.45)'
          : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        backdropFilter: 'blur(10px)',
        boxShadow: active
          ? '0 0 20px rgba(52,211,153,0.25)'
          : 'inset 0 0 14px rgba(255,255,255,0.02)',
        transform: active ? 'translateY(-1px)' : 'none'
      }}
    >
      <div
        style={{
          fontSize: 20,
          filter: active ? 'drop-shadow(0 0 8px rgba(110,231,183,0.45))' : 'none'
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 1.8,
          textTransform: 'uppercase'
        }}
      >
        {label}
      </div>

      {active && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 16,
            right: 16,
            height: 2,
            borderRadius: 999,
            background: 'linear-gradient(90deg, transparent, #34d399, transparent)',
            boxShadow: '0 0 12px #34d399'
          }}
        />
      )}
    </button>
  )
}

export default function Navbar({
  currentPage,
  navigate,
  cityName,
  username,
  sightingsCount
}) {
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      @keyframes scanLine {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100%); }
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        minHeight: 90,
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '10px 18px',
        background:
          'linear-gradient(180deg, rgba(6,20,16,0.98), rgba(4,12,10,0.96))',
        borderBottom: '1px solid rgba(52,211,153,0.16)',
        overflow: 'hidden'
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
          opacity: 0.3
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(180deg, transparent, rgba(52,211,153,0.08), transparent)',
          animation: 'scanLine 7s linear infinite'
        }}
      />

      {/* LEFT */}
      <div
        onClick={() => navigate('home')}
        style={{
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: '#f3fff9',
            letterSpacing: -1
          }}
        >
          Natu<span style={{ color: '#8bffcf' }}>Radar</span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            fontSize: 11,
            color: 'rgba(214,245,232,0.7)',
            marginTop: 4
          }}
        >
          <span>📍 {cityName}</span>
          {username && <span>👤 {username}</span>}
          <span>🌍 {sightingsCount.toLocaleString()} discoveries</span>
        </div>
      </div>

      {/* CENTER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          zIndex: 1
        }}
      >
        <NavItem
          icon="🌿"
          label="My Log"
          active={currentPage === 'mylog'}
          onClick={() => navigate('mylog')}
        />

        <NavItem
          icon="📋"
          label="Missions"
          active={currentPage === 'missions'}
          onClick={() => navigate('missions')}
        />

        <NavItem
          icon="🏆"
          label="Leaderboard"
          active={currentPage === 'leaderboard'}
          onClick={() => navigate('leaderboard')}
        />
      </div>

      {/* RIGHT */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 1
        }}
      >
        <NavItem
          icon="👤"
          label="Profile"
          active={currentPage === 'profile'}
          onClick={() => navigate('profile')}
        />
      </div>
    </div>
  )
}