import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  Zap, ArrowRight, BarChart3, Target, GitBranch, DollarSign,
  TrendingUp, Users, Layers, Activity, ChevronDown, ExternalLink,
  Shield, Gauge, Clock, PieChart, Heart
} from 'lucide-react';
import { colors as C, fonts, shadows, LOGO_URL } from './tokens';

// ─── ANIMATION HELPERS ───
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  })
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } }
};

function Section({ children, className = '', id }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
      style={{ position: 'relative' }}
    >
      {children}
    </motion.section>
  );
}

// ─── GRID BACKGROUND ───
function GridBg() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      backgroundImage: `
        linear-gradient(${C.border}33 1px, transparent 1px),
        linear-gradient(90deg, ${C.border}33 1px, transparent 1px)
      `,
      backgroundSize: '60px 60px',
      maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 20%, transparent 70%)',
      WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 20%, transparent 70%)',
    }} />
  );
}

// ─── NAVBAR ───
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? `${C.bg}ee` : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={LOGO_URL} alt="Heretic Engine" style={{ height: 26, filter: 'brightness(1.1)' }}
            onError={e => { e.target.style.display = 'none' }} />
          <span style={{
            fontFamily: fonts.display, fontSize: 11, fontWeight: 600,
            color: C.dim, letterSpacing: '0.1em', textTransform: 'uppercase'
          }}>
            Heretic Engine
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {[
            { label: 'Modules', href: '#modules' },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Metrics', href: '#metrics' },
          ].map(l => (
            <a key={l.label} href={l.href} style={{
              color: C.muted, fontSize: 12, fontWeight: 500, textDecoration: 'none',
              fontFamily: fonts.body, transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.target.style.color = C.text}
              onMouseLeave={e => e.target.style.color = C.muted}
            >{l.label}</a>
          ))}
          <a href="#launch" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: C.accent, color: '#000', fontSize: 12, fontWeight: 700,
            fontFamily: fonts.body, textDecoration: 'none', cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = shadows.glow; }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
          >
            Launch Engine <ArrowRight size={13} />
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─── HERO ───
function Hero() {
  return (
    <Section id="hero">
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '120px 24px 80px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow orb */}
        <div style={{
          position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.accentDim} 0%, transparent 70%)`,
          filter: 'blur(80px)', pointerEvents: 'none', animation: 'glowPulse 4s ease-in-out infinite',
        }} />

        <motion.div variants={fadeUp} custom={0} style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 999, border: `1px solid ${C.border}`,
            background: C.bgAlt, marginBottom: 32,
          }}>
            <Zap size={12} style={{ color: C.accent }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, fontFamily: fonts.body, letterSpacing: '0.04em' }}>
              Revenue Physics Engine
            </span>
          </div>
        </motion.div>

        <motion.h1 variants={fadeUp} custom={1} style={{
          fontFamily: fonts.display, fontSize: 'clamp(36px, 6vw, 72px)',
          fontWeight: 700, lineHeight: 1.05, color: C.text, maxWidth: 900,
          margin: '0 auto 24px', position: 'relative', zIndex: 1,
        }}>
          Stop guessing.<br />
          <span style={{ color: C.accent }}>Start engineering</span> revenue.
        </motion.h1>

        <motion.p variants={fadeUp} custom={2} style={{
          fontFamily: fonts.body, fontSize: 'clamp(15px, 2vw, 19px)',
          lineHeight: 1.7, color: C.muted, maxWidth: 640,
          margin: '0 auto 40px', position: 'relative', zIndex: 1,
        }}>
          The Heretic Engine transforms static spreadsheet revenue models into a
          real-time, interactive GTM operating system. Set your ARR target — the
          engine calculates everything backwards through conversion physics.
        </motion.p>

        <motion.div variants={fadeUp} custom={3} style={{
          display: 'flex', gap: 14, position: 'relative', zIndex: 1,
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          <a href="#launch" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 32px', borderRadius: 10, border: 'none',
            background: C.accent, color: '#000', fontSize: 15, fontWeight: 700,
            fontFamily: fonts.display, textDecoration: 'none', cursor: 'pointer',
            boxShadow: shadows.glow, transition: 'transform 0.15s',
          }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          >
            Launch the Engine <ArrowRight size={16} />
          </a>
          <a href="#modules" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', borderRadius: 10,
            border: `1px solid ${C.borderL}`, background: 'transparent',
            color: C.text, fontSize: 14, fontWeight: 600,
            fontFamily: fonts.body, textDecoration: 'none', cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => e.target.style.borderColor = C.accent}
            onMouseLeave={e => e.target.style.borderColor = C.borderL}
          >
            Explore Modules
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          variants={fadeUp} custom={5}
          style={{
            position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}
        >
          <span style={{ fontSize: 9, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: fonts.body }}>
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={16} style={{ color: C.dim }} />
          </motion.div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── VALUE PROPS ───
const VALUE_PROPS = [
  {
    icon: Target,
    title: 'Inverse-Driven',
    desc: 'Set your ARR target. The engine calculates backwards through conversion rates to tell you exactly how many leads, MQAs, SQLs, and deals you need.',
    color: C.accent,
  },
  {
    icon: Activity,
    title: 'Real-Time Physics',
    desc: 'Change any input — every chart, table, and metric recalculates instantly. No more stale spreadsheets or broken formulas.',
    color: C.green,
  },
  {
    icon: Shield,
    title: 'Zero Data Collection',
    desc: 'No data is transmitted, stored, or tracked. Your financial model stays entirely client-side. Enterprise-grade privacy by design.',
    color: C.violet,
  },
];

function ValueProps() {
  return (
    <Section id="value-props">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 100px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {VALUE_PROPS.map((p, i) => (
            <motion.div key={p.title} variants={fadeUp} custom={i} style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
              padding: 28, position: 'relative', overflow: 'hidden',
              transition: 'border-color 0.3s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = p.color + '66'}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${p.color}, ${p.color}44)`,
              }} />
              <div style={{
                width: 40, height: 40, borderRadius: 10, display: 'flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                background: p.color + '15',
              }}>
                <p.icon size={20} style={{ color: p.color }} />
              </div>
              <h3 style={{
                fontFamily: fonts.display, fontSize: 18, fontWeight: 700,
                color: C.text, marginBottom: 10,
              }}>{p.title}</h3>
              <p style={{
                fontFamily: fonts.body, fontSize: 13, lineHeight: 1.7, color: C.muted,
              }}>{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── MODULES GRID ───
const MODULES = [
  { icon: Gauge, title: 'Command Center', desc: 'Executive dashboard with all KPIs at a glance', color: C.accent },
  { icon: Target, title: 'Target Tracker', desc: 'Quarterly and monthly ARR targets with pipeline tracking', color: C.green },
  { icon: Heart, title: 'Funnel Health', desc: 'Stage conversion benchmarks and compression metrics', color: C.rose },
  { icon: Users, title: 'Sales Model', desc: 'AE capacity, quota, ramp-adjusted projections', color: C.blue },
  { icon: Layers, title: 'Revenue Motions', desc: 'Channel mix, budget allocation, and motion ROI', color: C.violet },
  { icon: GitBranch, title: 'Pipeline', desc: 'Stage-by-stage conversion waterfall', color: C.amber },
  { icon: Clock, title: 'Velocity', desc: 'Stage-level time analysis and cycle optimization', color: C.accent },
  { icon: TrendingUp, title: 'Seller Ramp', desc: 'Productivity curve and ramp capacity loss', color: C.green },
  { icon: DollarSign, title: 'S&M Budget', desc: 'Combined Sales & Marketing — the CFO view', color: C.amber },
  { icon: PieChart, title: 'CAC Breakdown', desc: 'Acquisition cost decomposed by spend category', color: C.rose },
  { icon: DollarSign, title: 'P&L', desc: 'Full income statement, Rule of 40, burn multiple', color: C.violet },
  { icon: BarChart3, title: 'Glideslope', desc: 'Projected vs target ARR with gap analysis', color: C.blue },
];

function Modules() {
  return (
    <Section id="modules">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 100px' }}>
        <motion.div variants={fadeUp} custom={0} style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700, color: C.accent,
            textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: fonts.body, marginBottom: 12,
          }}>12 Modules</span>
          <h2 style={{
            fontFamily: fonts.display, fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 700, color: C.text, marginBottom: 14,
          }}>Every angle of your GTM engine</h2>
          <p style={{
            fontFamily: fonts.body, fontSize: 15, color: C.muted, maxWidth: 560, margin: '0 auto',
          }}>
            From pipeline physics to P&L economics — each module maps to the
            spreadsheet tab you already use, but alive.
          </p>
        </motion.div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 12,
        }}>
          {MODULES.map((m, i) => (
            <motion.div key={m.title} variants={fadeUp} custom={i} style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: '20px 22px', display: 'flex', alignItems: 'flex-start', gap: 14,
              transition: 'border-color 0.3s, background 0.3s', cursor: 'default',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = m.color + '55';
                e.currentTarget.style.background = C.surfaceHover;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.background = C.surface;
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: m.color + '12',
              }}>
                <m.icon size={16} style={{ color: m.color }} />
              </div>
              <div>
                <div style={{
                  fontFamily: fonts.display, fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4,
                }}>{m.title}</div>
                <div style={{
                  fontFamily: fonts.body, fontSize: 12, color: C.muted, lineHeight: 1.5,
                }}>{m.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── HOW IT WORKS ───
const STEPS = [
  {
    num: '01',
    title: 'Set your target',
    desc: 'Enter your starting ARR and target ARR. The wizard calibrates 80% of your model in 6 questions.',
  },
  {
    num: '02',
    title: 'Watch it calculate backwards',
    desc: 'The inverse model works from revenue target → deals needed → pipeline → SQLs → MQAs → leads.',
  },
  {
    num: '03',
    title: 'Tune the physics',
    desc: 'Adjust conversion rates, AE capacity, deal sizes, ramp curves. Every metric recalculates live.',
  },
  {
    num: '04',
    title: 'Operate with precision',
    desc: 'Weekly targets, quarterly scorecards, pipeline coverage — the engine tells you exactly where you stand.',
  },
];

function HowItWorks() {
  return (
    <Section id="how-it-works">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 100px' }}>
        <motion.div variants={fadeUp} custom={0} style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700, color: C.accent,
            textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: fonts.body, marginBottom: 12,
          }}>How It Works</span>
          <h2 style={{
            fontFamily: fonts.display, fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 700, color: C.text,
          }}>From target to operating plan</h2>
        </motion.div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 24,
        }}>
          {STEPS.map((s, i) => (
            <motion.div key={s.num} variants={fadeUp} custom={i} style={{
              position: 'relative', padding: '0 0 0 0',
            }}>
              <div style={{
                fontFamily: fonts.mono, fontSize: 48, fontWeight: 700,
                color: C.accent + '15', lineHeight: 1, marginBottom: 12,
              }}>{s.num}</div>
              <h3 style={{
                fontFamily: fonts.display, fontSize: 18, fontWeight: 700,
                color: C.text, marginBottom: 10,
              }}>{s.title}</h3>
              <p style={{
                fontFamily: fonts.body, fontSize: 13, lineHeight: 1.7, color: C.muted,
              }}>{s.desc}</p>
              {i < STEPS.length - 1 && (
                <div style={{
                  display: 'none',
                  position: 'absolute', right: -12, top: '50%',
                  transform: 'translateY(-50%)', color: C.border,
                }}>
                  <ArrowRight size={20} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── KEY METRICS ───
const KEY_METRICS = [
  { label: 'LTV:CAC', desc: 'Customer lifetime value vs acquisition cost', benchmark: '> 3:1', color: C.accent },
  { label: 'CAC Payback', desc: 'Months to recover acquisition cost', benchmark: '< 18 mo', color: C.green },
  { label: 'Magic Number', desc: 'Net new ARR / S&M spend (efficiency)', benchmark: '> 0.75', color: C.amber },
  { label: 'Rule of 40', desc: 'Growth rate + profit margin (SaaS health)', benchmark: '> 40%', color: C.violet },
  { label: 'Burn Multiple', desc: 'Cash burn / net new ARR', benchmark: '< 1.5x', color: C.rose },
  { label: 'Pipeline Coverage', desc: 'SQO pipeline / remaining ARR gap', benchmark: '3-4x', color: C.blue },
];

function Metrics() {
  return (
    <Section id="metrics">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 100px' }}>
        <motion.div variants={fadeUp} custom={0} style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700, color: C.accent,
            textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: fonts.body, marginBottom: 12,
          }}>Metrics That Matter</span>
          <h2 style={{
            fontFamily: fonts.display, fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 700, color: C.text, marginBottom: 14,
          }}>Board-safe numbers, live</h2>
          <p style={{
            fontFamily: fonts.body, fontSize: 15, color: C.muted, maxWidth: 520, margin: '0 auto',
          }}>
            Every SaaS health metric calculated in real time from your model inputs.
          </p>
        </motion.div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12,
        }}>
          {KEY_METRICS.map((m, i) => (
            <motion.div key={m.label} variants={fadeUp} custom={i} style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: 20, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${m.color}, ${m.color}44)`,
              }} />
              <div style={{
                fontFamily: fonts.display, fontSize: 20, fontWeight: 700,
                color: m.color, marginBottom: 6,
              }}>{m.label}</div>
              <div style={{
                fontFamily: fonts.body, fontSize: 11, color: C.muted, lineHeight: 1.5, marginBottom: 10,
              }}>{m.desc}</div>
              <div style={{
                fontFamily: fonts.mono, fontSize: 11, color: C.dim,
                padding: '4px 8px', background: C.bg, borderRadius: 6, display: 'inline-block',
              }}>Benchmark: {m.benchmark}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── CTA ───
function CTA() {
  return (
    <Section id="launch">
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '80px 24px 100px', textAlign: 'center',
      }}>
        <motion.div variants={fadeUp} custom={0} style={{ position: 'relative' }}>
          {/* Background glow */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 500, height: 500, borderRadius: '50%',
            background: `radial-gradient(circle, ${C.accentDim} 0%, transparent 70%)`,
            filter: 'blur(60px)', pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{
              fontFamily: fonts.display, fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: 700, color: C.text, marginBottom: 16,
            }}>Ready to see the physics?</h2>
            <p style={{
              fontFamily: fonts.body, fontSize: 16, color: C.muted, maxWidth: 500,
              margin: '0 auto 36px', lineHeight: 1.7,
            }}>
              Launch the Revenue Physics Engine and build your GTM model in
              under six questions. Everything recalculates live.
            </p>

            <div style={{
              display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap',
            }}>
              <a href="../index.html" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '16px 36px', borderRadius: 12, border: 'none',
                background: C.accent, color: '#000', fontSize: 16, fontWeight: 700,
                fontFamily: fonts.display, textDecoration: 'none', cursor: 'pointer',
                boxShadow: shadows.glowStrong, transition: 'transform 0.15s',
              }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.target.style.transform = 'scale(1)'}
              >
                <Zap size={18} />
                Launch Engine
                <ExternalLink size={14} />
              </a>
            </div>

            <div style={{
              marginTop: 32, display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap',
            }}>
              {[
                'No sign-up required',
                'No data collected',
                'Runs entirely in your browser',
              ].map(t => (
                <div key={t} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Shield size={12} style={{ color: C.green }} />
                  <span style={{ fontFamily: fonts.body, fontSize: 12, color: C.muted }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── FOOTER ───
function Footer() {
  return (
    <footer style={{
      borderTop: `1px solid ${C.border}`, padding: '32px 24px',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <img src={LOGO_URL} alt="Heretic Engine" style={{ height: 20, filter: 'brightness(1.1)' }}
            onError={e => { e.target.style.display = 'none' }} />
          <span style={{
            fontFamily: fonts.display, fontSize: 10, fontWeight: 600,
            color: C.dim, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>Heretic Engine</span>
        </div>
        <p style={{
          fontFamily: fonts.body, fontSize: 11, color: C.dim, maxWidth: 480, margin: '0 auto 16px',
        }}>
          All content, design, modeling logic, calculations, and visual frameworks
          are proprietary intellectual property of Heretic Engine.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 12 }}>
          {['Privacy', 'Terms', 'Security', 'Disclaimer'].map(l => (
            <span key={l} style={{
              fontFamily: fonts.body, fontSize: 10, color: C.dim,
              cursor: 'pointer', textDecoration: 'underline',
            }}>{l}</span>
          ))}
        </div>
        <p style={{
          fontFamily: fonts.body, fontSize: 9, color: C.dim,
        }}>
          &copy; 2026 Heretic Engine. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// ─── MAIN APP ───
export default function App() {
  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      fontFamily: fonts.body, color: C.text, overflowX: 'hidden',
    }}>
      <GridBg />
      <Nav />
      <Hero />
      <ValueProps />
      <Modules />
      <HowItWorks />
      <Metrics />
      <CTA />
      <Footer />

      {/* Global keyframe for glow pulse */}
      <style>{`
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
