import { useMemo } from 'react'

function isToday(dateValue) {
  if (!dateValue) return false
  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return false

  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function isThisWeek(dateValue) {
  if (!dateValue) return false
  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return false

  const now = new Date()

  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(now.getDate() - now.getDay())

  const end = new Date(start)
  end.setDate(start.getDate() + 7)

  return d >= start && d < end
}

function getTimeValue(s) {
  if (s.observedAt) return s.observedAt
  if (s.createdAt) return s.createdAt
  if (s.timestamp?.toDate) return s.timestamp.toDate().toISOString()
  return null
}

function getMissionStats(sightings = []) {
  const todaySightings = sightings.filter((s) => isToday(getTimeValue(s)))
  const weekSightings = sightings.filter((s) => isThisWeek(getTimeValue(s)))

  const todayRare = todaySightings.filter((s) =>
    ['Vulnerable', 'Endangered', 'Critically Endangered'].includes(s.status)
  ).length

  const weekRare = weekSightings.filter((s) =>
    ['Vulnerable', 'Endangered', 'Critically Endangered'].includes(s.status)
  ).length

  const weekSpecies = new Set(
    weekSightings.map((s) => s.name || s.latin || 'Unknown species')
  ).size

  const todaySpecies = new Set(
    todaySightings.map((s) => s.name || s.latin || 'Unknown species')
  ).size

  const endangeredWeek = weekSightings.filter((s) =>
    ['Endangered', 'Critically Endangered'].includes(s.status)
  ).length

  return {
    todaySightings: todaySightings.length,
    weekSightings: weekSightings.length,
    todayRare,
    weekRare,
    weekSpecies,
    todaySpecies,
    endangeredWeek
  }
}

function buildDailyMissions(stats) {
  return [
    {
      id: 'daily-scan-3',
      title: 'Field Warmup',
      subtitle: 'Log 3 sightings today',
      current: stats.todaySightings,
      goal: 3,
      reward: '+60 XP',
      accent: '#34d399',
      tag: 'Daily'
    },
    {
      id: 'daily-rare-1',
      title: 'Rare Signal',
      subtitle: 'Find 1 at-risk species today',
      current: stats.todayRare,
      goal: 1,
      reward: '+120 XP',
      accent: '#f97316',
      tag: 'Daily'
    },
    {
      id: 'daily-species-2',
      title: 'Diversity Ping',
      subtitle: 'Record 2 unique species today',
      current: stats.todaySpecies,
      goal: 2,
      reward: '+80 XP',
      accent: '#60a5fa',
      tag: 'Daily'
    }
  ]
}

function buildWeeklyMissions(stats) {
  return [
    {
      id: 'weekly-scan-12',
      title: 'Explorer Circuit',
      subtitle: 'Log 12 sightings this week',
      current: stats.weekSightings,
      goal: 12,
      reward: '+300 XP',
      accent: '#34d399',
      tag: 'Weekly'
    },
    {
      id: 'weekly-species-8',
      title: 'BioDex Builder',
      subtitle: 'Find 8 unique species this week',
      current: stats.weekSpecies,
      goal: 8,
      reward: '+350 XP',
      accent: '#8b5cf6',
      tag: 'Weekly'
    },
    {
      id: 'weekly-endangered-2',
      title: 'Guardian Watch',
      subtitle: 'Detect 2 endangered signals this week',
      current: stats.endangeredWeek,
      goal: 2,
      reward: '+500 XP',
      accent: '#ef4444',
      tag: 'Weekly'
    }
  ]
}

function buildSocialEvents(cityName = 'Your Area') {
  return [
    {
      id: 'event-1',
      title: `${cityName} BioBlitz Night`,
      time: 'Tonight · 7:00 PM',
      type: 'Community Event',
      accent: '#60a5fa',
      desc: 'A city-wide challenge to log as many species as possible in two hours.',
      reward: 'Top 10 earn event badge'
    },
    {
      id: 'event-2',
      title: 'Rare Species Weekend Hunt',
      time: 'Saturday · 10:00 AM',
      type: 'Guild Mission',
      accent: '#f97316',
      desc: 'Collaborative search for vulnerable and endangered species sightings.',
      reward: 'Bonus score multiplier'
    },
    {
      id: 'event-3',
      title: 'Campus / Park Scan Party',
      time: 'Sunday · 3:00 PM',
      type: 'Social Meetup',
      accent: '#34d399',
      desc: 'Meet other explorers, scan together, and compare local biodiversity patterns.',
      reward: 'Social explorer badge'
    }
  ]
}

function getCompletion(current, goal) {
  return Math.min(100, Math.round((current / goal) * 100))
}

function isComplete(current, goal) {
  return current >= goal
}

export default function MissionPage({ sightings = [], cityName = 'Your Area' }) {
  const stats = useMemo(() => getMissionStats(sightings), [sightings])
  const dailyMissions = useMemo(() => buildDailyMissions(stats), [stats])
  const weeklyMissions = useMemo(() => buildWeeklyMissions(stats), [stats])
  const socialEvents = useMemo(() => buildSocialEvents(cityName), [cityName])

  const completedDaily = dailyMissions.filter((m) => isComplete(m.current, m.goal)).length
  const completedWeekly = weeklyMissions.filter((m) => isComplete(m.current, m.goal)).length

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        background:
          'radial-gradient(circle at top left, rgba(52,211,153,0.07), transparent 24%), radial-gradient(circle at top right, rgba(96,165,250,0.06), transparent 20%), radial-gradient(circle at bottom right, rgba(139,92,246,0.07), transparent 24%), #050d0a',
        padding: '22px 24px 30px'
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            position: 'relative',
            borderRadius: 22,
            border: '1px solid rgba(52,211,153,0.14)',
            background: 'linear-gradient(180deg, rgba(8,20,16,0.96) 0%, rgba(5,13,10,0.94) 100%)',
            padding: '22px 22px 18px',
            overflow: 'hidden',
            marginBottom: 20,
            boxShadow: '0 0 28px rgba(0,0,0,0.22)'
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
              opacity: 0.18
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                fontSize: 11,
                color: '#8cd0b2',
                letterSpacing: 2.6,
                textTransform: 'uppercase',
                fontWeight: 800,
                marginBottom: 8
              }}
            >
              Mission Command
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: 20,
                flexWrap: 'wrap'
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 'clamp(28px, 4vw, 44px)',
                    fontWeight: 900,
                    color: '#eafff4',
                    lineHeight: 1
                  }}
                >
                  Daily & Weekly Missions
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 13,
                    color: '#8fbda9',
                    maxWidth: 760,
                    lineHeight: 1.7
                  }}
                >
                  Complete scan goals, discover rare species, and join community events to level up your explorer profile.
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 16,
                  background: 'rgba(96,165,250,0.12)',
                  border: '1px solid rgba(96,165,250,0.24)',
                  minWidth: 220
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: '#93c5fd',
                    letterSpacing: 1.6,
                    textTransform: 'uppercase',
                    fontWeight: 800,
                    marginBottom: 6
                  }}
                >
                  Mission Status
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#dbeafe' }}>
                  {completedDaily + completedWeekly}
                </div>
                <div style={{ fontSize: 12, color: '#9fc5f8', marginTop: 4 }}>
                  objectives completed
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap'
              }}
            >
              <TopChip label="Today" value={stats.todaySightings} color="#34d399" />
              <TopChip label="This Week" value={stats.weekSightings} color="#60a5fa" />
              <TopChip label="Rare Today" value={stats.todayRare} color="#f97316" />
              <TopChip label="Unique This Week" value={stats.weekSpecies} color="#8b5cf6" />
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: 18
          }}
        >
          <div style={{ display: 'grid', gap: 16 }}>
            <SectionCard title="Daily Goals" subtitle="Refresh every day">
              {dailyMissions.map((mission) => (
                <MissionCard key={mission.id} mission={mission} />
              ))}
            </SectionCard>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <SectionCard title="Weekly Goals" subtitle="Long-range objectives">
              {weeklyMissions.map((mission) => (
                <MissionCard key={mission.id} mission={mission} />
              ))}
            </SectionCard>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <SectionCard title="Social Events" subtitle="Join the community">
              {socialEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </SectionCard>

            <SectionCard title="Mission Intel" subtitle="Live tactical summary">
              <IntelRow label="Daily Completed" value={`${completedDaily}/${dailyMissions.length}`} color="#34d399" />
              <IntelRow label="Weekly Completed" value={`${completedWeekly}/${weeklyMissions.length}`} color="#60a5fa" />
              <IntelRow label="At-Risk This Week" value={stats.weekRare} color="#f97316" />
              <IntelRow label="Endangered This Week" value={stats.endangeredWeek} color="#ef4444" />
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div
      style={{
        borderRadius: 20,
        border: '1px solid rgba(52,211,153,0.12)',
        background: 'linear-gradient(180deg, rgba(8,20,16,0.94), rgba(5,13,10,0.94))',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid rgba(52,211,153,0.10)'
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: '#9ad8ba',
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: 'uppercase'
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, color: '#6fa38c', marginTop: 6 }}>
          {subtitle}
        </div>
      </div>

      <div style={{ padding: 16, display: 'grid', gap: 12 }}>
        {children}
      </div>
    </div>
  )
}

function MissionCard({ mission }) {
  const completion = getCompletion(mission.current, mission.goal)
  const done = isComplete(mission.current, mission.goal)

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${done ? `${mission.accent}44` : 'rgba(52,211,153,0.10)'}`,
        background: done
          ? `linear-gradient(180deg, ${mission.accent}16, rgba(255,255,255,0.02))`
          : 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))',
        padding: '14px 14px 12px'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
          alignItems: 'flex-start',
          marginBottom: 8
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: '#edfff7',
              marginBottom: 4
            }}
          >
            {mission.title}
          </div>
          <div style={{ fontSize: 12, color: '#7fb19c', lineHeight: 1.5 }}>
            {mission.subtitle}
          </div>
        </div>

        <div
          style={{
            flexShrink: 0,
            padding: '4px 8px',
            borderRadius: 999,
            background: `${mission.accent}18`,
            border: `1px solid ${mission.accent}30`,
            color: mission.accent,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1,
            textTransform: 'uppercase'
          }}
        >
          {done ? 'Complete' : mission.tag}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8
        }}
      >
        <div style={{ fontSize: 12, color: '#a7d7c1' }}>
          Progress
        </div>
        <div style={{ fontSize: 12, color: '#ecfff6', fontWeight: 800 }}>
          {mission.current}/{mission.goal}
        </div>
      </div>

      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
          marginBottom: 10
        }}
      >
        <div
          style={{
            width: `${completion}%`,
            height: '100%',
            borderRadius: 999,
            background: `linear-gradient(90deg, ${mission.accent}, ${mission.accent}aa)`
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10
        }}
      >
        <div style={{ fontSize: 11, color: '#7fb19c' }}>
          Reward
        </div>
        <div
          style={{
            fontSize: 12,
            color: mission.accent,
            fontWeight: 900
          }}
        >
          {mission.reward}
        </div>
      </div>
    </div>
  )
}

function EventCard({ event }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${event.accent}22`,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))',
        padding: '14px 14px 12px'
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 8px',
          borderRadius: 999,
          background: `${event.accent}16`,
          border: `1px solid ${event.accent}28`,
          color: event.accent,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 10
        }}
      >
        {event.type}
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: '#edfff7',
          marginBottom: 6
        }}
      >
        {event.title}
      </div>

      <div
        style={{
          fontSize: 12,
          color: '#9fd3bd',
          marginBottom: 8,
          fontWeight: 700
        }}
      >
        {event.time}
      </div>

      <div style={{ fontSize: 12, color: '#7fb19c', lineHeight: 1.6, marginBottom: 10 }}>
        {event.desc}
      </div>

      <div
        style={{
          fontSize: 11,
          color: event.accent,
          fontWeight: 800
        }}
      >
        Reward: {event.reward}
      </div>
    </div>
  )
}

function IntelRow({ label, value, color }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}
    >
      <span style={{ fontSize: 12, color: '#8ebca8' }}>{label}</span>
      <span style={{ fontSize: 13, color, fontWeight: 900 }}>{value}</span>
    </div>
  )
}

function TopChip({ label, value, color }) {
  return (
    <div
      style={{
        background: `${color}12`,
        border: `1px solid ${color}24`,
        borderRadius: 999,
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}
    >
      <span style={{ fontSize: 11, color, fontWeight: 900 }}>{value}</span>
      <span
        style={{
          fontSize: 10,
          color: '#b9ead4',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1
        }}
      >
        {label}
      </span>
    </div>
  )
}