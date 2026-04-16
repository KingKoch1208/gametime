export default function UpgradeModal({ onClose, triggerReason }) {
  const features = [
    { icon: '🔔', label: 'Unlimited reminders', pro: true,  basic: '3 max' },
    { icon: '🏆', label: 'Follow unlimited teams', pro: true,  basic: '1 team' },
    { icon: '⏰', label: 'Snooze notifications', pro: true,  basic: false },
    { icon: '📺', label: 'Exclusive widgets',     pro: true,  basic: false },
    { icon: '🕶️', label: 'Spoiler-free widgets', pro: true,  basic: false },
    { icon: '🚫', label: 'No ads',                pro: true,  basic: false },
    { icon: '🎨', label: 'Custom app icons',       pro: true,  basic: false },
    { icon: '⚡', label: 'Priority alerts',        pro: true,  basic: false },
    { icon: '📊', label: 'Advanced personalization',pro: true, basic: false },
  ]

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="scale-in"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid rgba(212,146,10,0.4)',
          borderTop: '3px solid var(--gold)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px', width: '100%', maxWidth: 480,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 40px var(--gold-dim)',
          position: 'relative', maxHeight: '90vh', overflowY: 'auto'
        }}
      >
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 14,
          width: 28, height: 28, borderRadius: 6, background: 'var(--surface-2)',
          border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
        }}>✕</button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🏆</div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 38, letterSpacing: '0.06em',
            background: 'linear-gradient(135deg, var(--gold), #ffcc44)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6
          }}>UPGRADE TO PRO</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-2)' }}>
            {triggerReason || 'Unlock the full GameTime experience'}
          </p>
        </div>

        {/* Price */}
        <div style={{
          textAlign: 'center', marginBottom: 24,
          padding: '16px', background: 'var(--gold-dim)',
          border: '1px solid rgba(212,146,10,0.25)', borderRadius: 10
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: 'var(--gold)', lineHeight: 1 }}>$3.99</div>
          <div style={{ fontFamily: 'var(--font-cond)', fontSize: 13, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            every 3 months · 30-day free trial
          </div>
        </div>

        {/* Feature comparison */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0 20px', marginBottom: 8 }}>
            <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Feature</div>
            <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)', textAlign: 'center' }}>Basic</div>
            <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', textAlign: 'center' }}>Pro</div>
          </div>
          {features.map((f, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0 20px',
              padding: '8px 0', borderBottom: i < features.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>{f.icon}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-2)' }}>{f.label}</span>
              </div>
              <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                {f.basic === false ? <span style={{ color: 'var(--text-3)' }}>✕</span> : <span style={{ color: 'var(--text-3)' }}>{f.basic}</span>}
              </div>
              <div style={{ textAlign: 'center', color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                {f.pro ? '✓' : '✕'}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button style={{
          width: '100%', padding: '14px', borderRadius: 10, border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 16, letterSpacing: '0.1em', textTransform: 'uppercase',
          background: 'linear-gradient(135deg, var(--gold), #e8b800)',
          color: '#000', transition: 'filter 0.15s', marginBottom: 10
        }}
        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
        onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
        >
          Start 30-Day Free Trial
        </button>
        <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-3)' }}>
          No payment needed today · Cancel anytime
        </p>
      </div>
    </div>
  )
}
