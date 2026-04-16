import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useLive } from '../context/LiveContext'
import Logo from '../components/Logo'

/* ── Count-up hook ─────────────────────────────────────── */
function useCountUp(target, duration = 900) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true) },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const numeric = parseInt(target.replace(/\D/g, ''), 10)
    const suffix = target.replace(/[0-9]/g, '')
    if (!numeric) { setCount(target); return }
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * numeric) + suffix)
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [started, target, duration])

  return { ref, count: started ? count : 0 }
}

/* ── Scroll-reveal hook ────────────────────────────────── */
function useScrollReveal(delay = 0) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return { ref, style: {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(22px)',
    transition: `opacity 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms`
  }}
}

const FEATURES = [
  { icon: '⏰', title: 'Smart Reminders',   desc: 'Set it once. We adjust if the game changes — delays, postponements, and schedule shifts handled automatically.' },
  { icon: '📡', title: 'Live Score Alerts', desc: 'Real-time updates the moment something happens. Know the score before you even open the app.' },
  { icon: '▶️', title: 'Watch Now',         desc: 'Direct links to every streaming service. One tap to watch — no searching, no guessing which app has the game.' },
  { icon: '🏆', title: 'All Your Sports',   desc: 'NFL, NBA, MLB, NHL, UFC and more — every league, every game, all in one place.' },
]

const STEPS = [
  { num: '01', title: 'Pick your games',    desc: 'Browse upcoming games across every sport and league.' },
  { num: '02', title: 'Set a reminder',     desc: 'Choose how far before kickoff you want to be notified.' },
  { num: '03', title: 'Never miss a game',  desc: 'We alert you on time — even if the schedule changes.' },
]

const STATS = [
  { value: '12+',   label: 'Sports Covered' },
  { value: '9',     label: 'Major Leagues' },
  { value: '1000+', label: 'Games Tracked' },
  { value: '100%',  label: 'Free to Start' },
]

export default function Landing() {
  const { isDark } = useTheme()
  const { liveCount } = useLive()
  const [trending, setTrending] = useState([])

  useEffect(() => {
    fetch('/api/trending').then(r => r.json()).then(d => setTrending(d.slice(0, 3))).catch(() => {})
  }, [])

  return (
    <div style={{ paddingBottom: 0 }}>

      {/* ── Hero ──────────────────────────────────────── */}
      <section style={{
        minHeight: '90vh', display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
        background: 'var(--bg)'
      }}>
        {/* Animated grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(232,0,29,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,0,29,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          animation: 'grid-drift 18s linear infinite',
          pointerEvents: 'none', zIndex: 0
        }} />

        {/* Red glow blobs */}
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-10%',
          width: '60vw', height: '60vw',
          background: 'radial-gradient(circle, rgba(232,0,29,0.12) 0%, transparent 65%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', top: '10%', right: '-5%',
          width: '40vw', height: '40vw',
          background: 'radial-gradient(circle, rgba(232,0,29,0.06) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Large background logo watermark — right side */}
        <div style={{
          position: 'absolute', right: '-2%', top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none', zIndex: 0,
        }}>
          <Logo
            size={420}
            variant={isDark ? 'white' : 'light'}
            style={{ opacity: isDark ? 0.04 : 0.05 }}
          />
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: 60, paddingBottom: 80 }}>
          <div style={{ maxWidth: 760 }}>

            {/* Logo mark + wordmark above headline */}
            <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <Logo size={52} variant={isDark ? 'dark' : 'light'} />
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 28,
                letterSpacing: '0.08em', color: 'var(--text)'
              }}>
                GAME<span style={{ color: 'var(--red)' }}>TIME</span>
              </span>
            </div>

            {/* Live pill */}
            {liveCount > 0 && (
              <div className="fade-up" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24,
                background: 'var(--red-dim)', border: '1px solid rgba(232,0,29,0.3)',
                borderRadius: 20, padding: '6px 16px'
              }}>
                <div className="live-dot" />
                <span style={{ fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 13, letterSpacing: '0.12em', color: 'var(--red)' }}>
                  {liveCount} GAMES LIVE RIGHT NOW
                </span>
              </div>
            )}

            {/* Headline */}
            <h1 className="fade-up" style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(64px, 10vw, 112px)',
              lineHeight: 0.92, letterSpacing: '0.02em',
              color: 'var(--text)', marginBottom: 24,
              animationDelay: '0.05s'
            }}>
              NEVER<br />
              MISS A<br />
              <span style={{ color: 'var(--red)' }}>GAME.</span>
            </h1>

            <p className="fade-up" style={{
              fontFamily: 'var(--font-body)', fontSize: 18, lineHeight: 1.6,
              color: 'var(--text-2)', maxWidth: 520, marginBottom: 36,
              animationDelay: '0.12s'
            }}>
              Smart reminders for every sport. Know exactly when games start — and get alerted the moment anything changes.
            </p>

            {/* CTAs */}
            <div className="fade-up" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', animationDelay: '0.18s' }}>
              <Link to="/auth" className="btn btn-red" style={{ padding: '14px 28px', fontSize: 15 }}>
                Get Started — Free
              </Link>
              <Link to="/games" className="btn btn-dark" style={{ padding: '14px 28px', fontSize: 15 }}>
                Browse Games →
              </Link>
            </div>

            <p className="fade-up" style={{
              marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-3)', animationDelay: '0.22s'
            }}>
              Free to use · No credit card · Works on all devices
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────── */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ padding: '28px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20 }}>
            {STATS.map((s, i) => (
              <StatCounter key={i} stat={s} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────── */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            {/* Logo above section title */}
            <Logo size={40} variant={isDark ? 'dark' : 'light'} style={{ margin: '0 auto 16px' }} />
            <div className="section-title" style={{ marginBottom: 12 }}>Why GameTime</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: '0.04em' }}>
              BUILT FOR REAL FANS
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} feature={f} delay={i * 90} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────── */}
      <section style={{ padding: '80px 0', background: 'var(--surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>Simple Process</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: '0.04em' }}>
              HOW IT WORKS
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32, maxWidth: 800, margin: '0 auto' }}>
            {STEPS.map((s, i) => (
              <StepCard key={i} step={s} delay={i * 110} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Trending Preview ──────────────────────────── */}
      {trending.length > 0 && (
        <section style={{ padding: '80px 0' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div>
                <div className="section-title" style={{ marginBottom: 6 }}>Hottest Games</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: '0.04em' }}>TRENDING NOW</h2>
              </div>
              <Link to="/trending" className="btn btn-outline" style={{ fontSize: 13 }}>See All →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {trending.map((game, i) => (
                <TrendingPreviewCard key={game.id} game={game} rank={i + 1} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Bottom CTA ────────────────────────────────── */}
      <section style={{
        padding: '100px 0',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center bottom, var(--red-dim) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        {/* Large faded logo watermark */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none', zIndex: 0,
        }}>
          <Logo size={340} variant={isDark ? 'white' : 'light'} style={{ opacity: 0.04 }} />
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Large logo mark */}
          <Logo
            size={80}
            variant={isDark ? 'dark' : 'light'}
            style={{ margin: '0 auto 24px' }}
          />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 6vw, 64px)', letterSpacing: '0.04em', marginBottom: 16 }}>
            READY TO NEVER<br />MISS ANOTHER GAME?
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-2)', marginBottom: 32, maxWidth: 440, margin: '0 auto 32px' }}>
            Join GameTime for free. Set your first reminder in under 30 seconds.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth" className="btn btn-red" style={{ padding: '14px 32px', fontSize: 15 }}>Create Free Account</Link>
            <Link to="/games" className="btn btn-dark" style={{ padding: '14px 32px', fontSize: 15 }}>Browse Games</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer style={{
        background: 'var(--bg)', borderTop: '1px solid var(--border)',
        padding: '32px 0', textAlign: 'center'
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <Logo size={28} variant={isDark ? 'dark' : 'light'} style={{ opacity: 0.6 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.06em', color: 'var(--text-3)' }}>
              GAME<span style={{ color: 'var(--red)', opacity: 0.7 }}>TIME</span>
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
            © 2026 GameTime · Never Miss a Game · School Project MVP
          </p>
        </div>
      </footer>

    </div>
  )
}

/* ── StatCounter ──────────────────────────────────────── */
function StatCounter({ stat, delay }) {
  const { ref, count } = useCountUp(stat.value, 900)
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 44, color: 'var(--red)',
        letterSpacing: '0.04em', lineHeight: 1,
        transition: `opacity 0.4s ${delay}ms`,
      }}>{count || '0'}</div>
      <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 4 }}>{stat.label}</div>
    </div>
  )
}

/* ── FeatureCard ──────────────────────────────────────── */
function FeatureCard({ feature: f, delay }) {
  const reveal = useScrollReveal(delay)
  return (
    <div ref={reveal.ref} style={{
      ...reveal.style,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderLeft: '3px solid var(--red)', borderRadius: 'var(--radius)',
      padding: '24px', transition: reveal.style.transition + ', transform 0.18s, box-shadow 0.18s',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)' }}
    onMouseLeave={e => { e.currentTarget.style.transform = reveal.style.transform; e.currentTarget.style.boxShadow = '' }}
    >
      <div style={{ fontSize: 32, marginBottom: 14, display: 'inline-block', animation: 'icon-bob 3s ease-in-out infinite', animationDelay: `${delay}ms` }}>{f.icon}</div>
      <h3 style={{ fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 18, letterSpacing: '0.04em', marginBottom: 8, color: 'var(--text)' }}>{f.title}</h3>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{f.desc}</p>
    </div>
  )
}

/* ── StepCard ─────────────────────────────────────────── */
function StepCard({ step: s, delay }) {
  const reveal = useScrollReveal(delay)
  return (
    <div ref={reveal.ref} style={{ ...reveal.style, textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16, margin: '0 auto 18px',
        background: 'var(--red-dim)', border: '2px solid rgba(232,0,29,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--red)', letterSpacing: '0.04em'
      }}>{s.num}</div>
      <h3 style={{ fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 17, letterSpacing: '0.04em', marginBottom: 8 }}>{s.title}</h3>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{s.desc}</p>
    </div>
  )
}

function TrendingPreviewCard({ game, rank }) {
  const SPORT_COLOR = { NFL: 'var(--nfl)', NBA: 'var(--nba)', MLB: 'var(--mlb)', NHL: 'var(--nhl)', UFC: 'var(--ufc)' }
  const color = SPORT_COLOR[game.sport] || 'var(--red)'

  return (
    <Link to={`/games/${game.id}`}>
      <div style={{
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '16px',
        display: 'flex', gap: 14, alignItems: 'center',
        transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer'
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: rank === 1 ? 'var(--red)' : 'var(--surface-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: 20, color: rank === 1 ? '#fff' : 'var(--text-3)'
        }}>#{rank}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>
            {game.awayTeam.shortName} vs {game.homeTeam.shortName}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color }}>{game.sport}</span>
            {game.is_championship && <span style={{ fontSize: 10 }}>🏆</span>}
            {game.status === 'live' && <span className="badge badge-live" style={{ fontSize: 9, padding: '1px 6px' }}><span className="live-dot" style={{ width: 5, height: 5 }} />LIVE</span>}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--red)', letterSpacing: '0.02em', flexShrink: 0 }}>
          {game.trending_score}
        </div>
      </div>
    </Link>
  )
}
