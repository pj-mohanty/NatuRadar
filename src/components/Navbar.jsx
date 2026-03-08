import { useEffect } from 'react'

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      className="nav-item"
      onClick={onClick}
      style={{
        minWidth: 128,
        height: 70,
        padding: '10px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        cursor: 'pointer',
        position: 'relative',
        color: active ? '#f3fff9' : '#d7f7ea',
        transition: 'all 0.22s ease',
        background: active
          ? 'linear-gradient(180deg, rgba(52,211,153,0.26), rgba(52,211,153,0.10))'
          : 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
        border: active
          ? '1px solid rgba(52,211,153,0.55)'
          : '1px solid rgba(210,255,236,0.16)',
        borderRadius: 16,
        backdropFilter: 'blur(12px)',
        boxShadow: active
          ? '0 0 24px rgba(52,211,153,0.24), inset 0 1px 0 rgba(255,255,255,0.12)'
          : '0 0 0 transparent, inset 0 1px 0 rgba(255,255,255,0.08)',
        transform: active ? 'translateY(-1px)' : 'none'
      }}
    >
      <div
        style={{
          fontSize: 22,
          lineHeight: 1,
          filter: active
            ? 'drop-shadow(0 0 10px rgba(110,231,183,0.55))'
            : 'drop-shadow(0 0 6px rgba(255,255,255,0.08))'
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 1.3,
          textTransform: 'uppercase',
          textAlign: 'center',
          lineHeight: 1.1,
          textShadow: active ? '0 0 10px rgba(52,211,153,0.18)' : 'none'
        }}
      >
        {label}
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 16,
          pointerEvents: 'none',
          boxShadow: active
            ? 'inset 0 0 30px rgba(52,211,153,0.08)'
            : 'inset 0 0 18px rgba(255,255,255,0.015)'
        }}
      />

      {active && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 16,
              right: 16,
              height: 1,
              borderRadius: 999,
              background: 'linear-gradient(90deg, transparent, rgba(167,255,223,0.95), transparent)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 16,
              right: 16,
              height: 3,
              borderRadius: 999,
              background: 'linear-gradient(90deg, transparent, #34d399, transparent)',
              boxShadow: '0 0 14px #34d399'
            }}
          />
        </>
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

      @keyframes navGlow {
        0% { opacity: 0.35; }
        50% { opacity: 0.6; }
        100% { opacity: 0.35; }
      }

      @media (max-width: 768px) {
        .navbar-root {
          grid-template-columns: 1fr auto !important;
          grid-template-rows: auto auto !important;
          min-height: auto !important;
          gap: 8px 0 !important;
          padding: 10px 12px !important;
        }
        .navbar-left { grid-column: 1 !important; grid-row: 1 !important; }
        .navbar-right { grid-column: 2 !important; grid-row: 1 !important; }
        .navbar-center {
          grid-column: 1 / -1 !important;
          grid-row: 2 !important;
          justify-content: space-evenly !important;
          gap: 6px !important;
        }
        .navbar-center .nav-item {
          flex: 1 !important;
          min-width: 0 !important;
          height: 50px !important;
          min-height: 50px !important;
          padding: 6px 4px !important;
          font-size: 9px !important;
        }
        .navbar-title { font-size: 22px !important; }
        .navbar-meta { font-size: 10px !important; margin-top: 3px !important; }
        .navbar-right .nav-item {
          height: 48px !important;
          min-height: 48px !important;
          min-width: 64px !important;
          padding: 6px 10px !important;
        }
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  return (
    <div
      className="navbar-root"
      style={{
        position: 'relative',
        minHeight: 96,
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 16,
        padding: '12px 18px',
        background:
          'linear-gradient(180deg, rgba(6,20,16,0.98), rgba(4,12,10,0.96))',
        borderBottom: '1px solid rgba(52,211,153,0.18)',
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

      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52,211,153,0.10), transparent 70%)',
          filter: 'blur(16px)',
          pointerEvents: 'none',
          animation: 'navGlow 5s ease-in-out infinite'
        }}
      />

      {/* LEFT */}
      <div
        className="navbar-left"
        onClick={() => navigate('home')}
        style={{
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
          minWidth: 0
        }}
      >
        <div
          className="navbar-title"
          style={{
            fontSize: 34,
            fontWeight: 900,
            color: '#f3fff9',
            letterSpacing: -1,
            lineHeight: 1
          }}
        >
          <span style={{ color: '#7ad08f' }}>Natu</span><span style={{ color: '#ffc2e8' }}>Radar</span>
        </div>

        <div
          className="navbar-meta"
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            fontSize: 11,
            color: 'rgba(226,250,240,0.78)',
            marginTop: 6
          }}
        >
          <span>📍 {cityName}</span>
          {username && <span>👤 {username}</span>}
          <span>🌍 {sightingsCount.toLocaleString()} discoveries</span>
        </div>
      </div>

      {/* CENTER */}
      <div
        className="navbar-center"
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          zIndex: 1,
          flexWrap: 'wrap'
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
        className="navbar-right"
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