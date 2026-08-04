import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Atom, BarChart3, BookOpen, Bot, BrainCircuit, Check,
  ChevronRight, ClipboardCheck, FlaskConical, Gamepad2, Menu, School, ShieldCheck,
  Sparkles, Star, Target, TrendingUp, Trophy, Users, X, Zap
} from 'lucide-react';

const paths = [
  {
    range: '01—04', label: 'Young Explorers', color: '#ff6b35', soft: '#fff2ea',
    title: 'Learn through play.', desc: 'Stories, number games and joyful quests that turn strong foundations into a daily habit.',
    features: ['16 skill games', 'Story journeys', 'Stars & streaks'], icon: Gamepad2, href: '/batch1/home'
  },
  {
    range: '05—08', label: 'Curious Thinkers', color: '#6657e8', soft: '#f0eeff',
    title: 'Understand the why.', desc: 'NCERT-aligned lessons, smart practice and an AI tutor that explains without giving the answer away.',
    features: ['AI doubt coach', 'Chapter roadmaps', 'Practice analytics'], icon: BrainCircuit, href: '/batch2/home'
  },
  {
    range: '09—10', label: 'Board Achievers', color: '#078a9b', soft: '#e7f8f8',
    title: 'Prepare with purpose.', desc: 'Concept labs, PYQs and focus tools built around confident, measurable board preparation.',
    features: ['Virtual science labs', 'Board countdown', 'HOTS challenges'], icon: Target, href: '/batch3/home'
  }
];

const capabilities = [
  { icon: Bot, title: 'AI tutor that teaches', copy: 'Guided explanations grounded in the NCERT curriculum—not generic internet answers.' },
  { icon: FlaskConical, title: 'Interactive science labs', copy: 'Experiment with forces, atoms, reactions and cells in safe virtual environments.' },
  { icon: BarChart3, title: 'Progress you can act on', copy: 'Clear insights for students, teachers and school leaders, without spreadsheet overload.' },
  { icon: Trophy, title: 'Motivation that feels earned', copy: 'Streaks, quests and class challenges designed around mastery, not empty screen time.' },
  { icon: BookOpen, title: 'One academic workspace', copy: 'Tasks, notes, exams, concept maps and doubt-solving in one connected learning flow.' },
  { icon: ShieldCheck, title: 'Built for schools', copy: 'Role-based portals, school controls and age-appropriate experiences from day one.' }
];

export const Landing: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<'student' | 'teacher' | 'principal'>('student');

  const roleContent = {
    student: {
      greeting: 'GOOD MORNING, AARAV',
      heading: 'Ready for today’s mission?',
      badge: '🔥 12 day streak',
      eyebrow: 'SCIENCE • CHAPTER 8',
      title: 'Force & Laws of Motion',
      action: 'Continue your interactive lesson',
      icon: Atom,
      cards: [
        { icon: Bot, label: 'ASK YOUR AI COACH', value: '“Why do objects keep moving in space?”', note: 'Let’s discover it together →' },
        { icon: Star, label: 'THIS WEEK', value: '860', note: 'learning points' }
      ]
    },
    teacher: {
      greeting: 'CLASS 7B • SCIENCE',
      heading: 'Your class is on track.',
      badge: '24 of 28 active',
      eyebrow: 'NEXT UP • 10:30 AM',
      title: 'Live lesson: Heat & Temperature',
      action: 'Open lesson workspace',
      icon: Users,
      cards: [
        { icon: ClipboardCheck, label: 'TASKS TO REVIEW', value: '12 submissions', note: '4 need your feedback →' },
        { icon: TrendingUp, label: 'CLASS MASTERY', value: '78%', note: '+6% this week' }
      ]
    },
    principal: {
      greeting: 'SCHOOL OVERVIEW',
      heading: 'Learning is moving forward.',
      badge: 'All systems healthy',
      eyebrow: 'WEEKLY SCHOOL PULSE',
      title: '1,248 active learners',
      action: 'View leadership report',
      icon: School,
      cards: [
        { icon: BarChart3, label: 'ACADEMIC GROWTH', value: '+11.4%', note: 'across all grades' },
        { icon: ShieldCheck, label: 'ENGAGEMENT', value: '92%', note: 'teacher adoption' }
      ]
    }
  };
  const currentRole = roleContent[activeRole];
  const MissionIcon = currentRole.icon;

  return (
    <div className="edu-landing">
      <nav className="edu-nav">
        <Link to="/" className="edu-brand" aria-label="EduAI home">
          <span className="edu-brand-mark"><Sparkles size={17} /></span>
          <span>EduAI</span>
          <span className="edu-school-tag">for schools</span>
        </Link>
        <div className="edu-nav-links">
          <a href="#pathways">Learning paths</a>
          <a href="#platform">Platform</a>
          <Link to="/pricing">Pricing</Link>
          <Link to="/login">Sign in</Link>
        </div>
        <Link to="/register" className="edu-nav-cta">Book a school demo <ArrowRight size={16} /></Link>
        <button className="edu-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X /> : <Menu />}
        </button>
        {menuOpen && (
          <div className="edu-mobile-menu">
            <a href="#pathways" onClick={() => setMenuOpen(false)}>Learning paths</a>
            <a href="#platform" onClick={() => setMenuOpen(false)}>Platform</a>
            <Link to="/pricing">Pricing</Link><Link to="/login">Sign in</Link><Link to="/register">Book a demo</Link>
          </div>
        )}
      </nav>

      <main>
        <section className="edu-hero">
          <div className="edu-hero-copy">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="edu-kicker">
              <span className="edu-live-dot" /> Now onboarding CBSE schools for 2026
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }}>
              One school.<br />Every learner.<br /><em>Built to grow.</em>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .16 }}>
              A complete learning platform that changes with every age—playful for young minds, structured for middle school and focused for board years.
            </motion.p>
            <motion.div className="edu-hero-actions" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .24 }}>
              <Link to="/register" className="edu-primary-btn">See EduAI for your school <ArrowRight size={18} /></Link>
              <a href="#pathways" className="edu-text-btn">Explore student journeys <ChevronRight size={17} /></a>
            </motion.div>
            <motion.div className="edu-trust-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .4 }}>
              <span><Check size={14} /> NCERT aligned</span><span><Check size={14} /> Classes 1–10</span><span><Check size={14} /> Teacher controlled</span>
            </motion.div>
          </div>

          <motion.div className="edu-hero-product" initial={{ opacity: 0, scale: .96, x: 24 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: .7, ease: [0.2, 0.8, 0.2, 1] }}>
            <div className="edu-orbit edu-orbit-one" /><div className="edu-orbit edu-orbit-two" />
            <div className="edu-role-switcher" aria-label="Preview platform by role">
              <button className={activeRole === 'student' ? 'active' : ''} onClick={() => setActiveRole('student')}><Gamepad2 /> Student</button>
              <button className={activeRole === 'teacher' ? 'active' : ''} onClick={() => setActiveRole('teacher')}><Users /> Teacher</button>
              <button className={activeRole === 'principal' ? 'active' : ''} onClick={() => setActiveRole('principal')}><School /> Principal</button>
            </div>
            <div className="edu-product-window">
              <div className="edu-window-top">
                <div className="edu-mini-brand"><Sparkles size={13} /> EduAI</div>
                <span>One platform • Three focused experiences</span>
                <div className="edu-avatar">AK</div>
              </div>
              <div className="edu-dashboard">
                <aside>
                  <div className="active"><Zap size={15} /> Overview</div>
                  <div><BookOpen size={15} /> Learning</div><div><ClipboardCheck size={15} /> Tasks</div>
                  <div><BarChart3 size={15} /> Insights</div>
                </aside>
                <motion.div className="edu-dash-main" key={activeRole} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }}>
                  <div className="edu-dash-welcome">
                    <div><small>{currentRole.greeting}</small><h3>{currentRole.heading}</h3></div>
                    <span>{currentRole.badge}</span>
                  </div>
                  <div className={`edu-mission-card role-${activeRole}`}>
                    <div className="edu-mission-icon"><MissionIcon /></div>
                    <div><small>{currentRole.eyebrow}</small><h4>{currentRole.title}</h4><p>{currentRole.action}</p></div>
                    <button aria-label={currentRole.action}><ArrowRight /></button>
                  </div>
                  <div className="edu-dash-grid">
                    {currentRole.cards.map((card, index) => {
                      const CardIcon = card.icon;
                      return (
                        <div className={index === 0 ? 'edu-ai-card' : 'edu-score-card'} key={card.label}>
                          <div className="edu-card-label"><CardIcon size={14}/>{card.label}</div>
                          {index === 0 ? <><p>{card.value}</p><span>{card.note}</span></> : <><strong>{card.value}</strong><span>{card.note}</span><div className="edu-bars"><i/><i/><i/><i/><i/><i/><i/></div></>}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            </div>
            <motion.div className="edu-float-chip edu-chip-one" animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity }}>
              <Trophy size={17} /> Every learner supported
            </motion.div>
            <motion.div className="edu-float-chip edu-chip-two" animate={{ y: [0, 8, 0] }} transition={{ duration: 4, repeat: Infinity }}>
              <Users size={17} /> One connected school
            </motion.div>
          </motion.div>
        </section>

        <section className="edu-proof">
          <span>Everything your school needs to move learning forward</span>
          <div><strong>10</strong><small>grade levels</small></div><div><strong>3</strong><small>age-specific worlds</small></div>
          <div><strong>16+</strong><small>interactive games</small></div><div><strong>100%</strong><small>NCERT aligned</small></div>
        </section>

        <section id="pathways" className="edu-section edu-pathways">
          <div className="edu-section-head">
            <div><span className="edu-eyebrow">Designed around how children grow</span><h2>Not one interface<br />stretched across ten grades.</h2></div>
            <p>Each stage has its own pace, motivation system and learning tools—while teachers manage everything from one connected platform.</p>
          </div>
          <div className="edu-path-grid">
            {paths.map((path, index) => {
              const Icon = path.icon;
              return (
                <motion.article key={path.range} className="edu-path-card" style={{ '--path-color': path.color, '--path-soft': path.soft } as React.CSSProperties} whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <div className="edu-path-top"><span>{path.range}</span><Icon /></div>
                  <small>{path.label}</small><h3>{path.title}</h3><p>{path.desc}</p>
                  <ul>{path.features.map(f => <li key={f}><Check size={14}/>{f}</li>)}</ul>
                  <Link to={path.href}>Enter this learning world <ArrowRight size={16}/></Link>
                  <div className="edu-path-index">0{index + 1}</div>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section id="platform" className="edu-platform">
          <div className="edu-platform-intro">
            <span className="edu-eyebrow">A serious platform, made delightful</span>
            <h2>Deep learning tools.<br />Zero clutter.</h2>
            <p>Every feature has a job: help a student understand, help a teacher intervene, or help a school see what’s working.</p>
            <Link to="/features" className="edu-light-btn">Explore all features <ArrowRight size={17}/></Link>
          </div>
          <div className="edu-cap-grid">
            {capabilities.map(({ icon: Icon, title, copy }, index) => (
              <motion.div className="edu-cap-card" key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .3 }} transition={{ delay: index * .06 }}>
                <Icon /><h3>{title}</h3><p>{copy}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="edu-school-cta">
          <div className="edu-cta-icon"><School /></div>
          <div><span>Bring your whole school forward</span><h2>Give every child a learning experience built for their next step.</h2></div>
          <div className="edu-cta-actions"><Link to="/register">Book a personalised demo <ArrowRight size={17}/></Link><small>No credit card • Guided setup • CBSE ready</small></div>
        </section>
      </main>

      <footer className="edu-footer">
        <div className="edu-brand"><span className="edu-brand-mark"><Sparkles size={17}/></span><span>EduAI</span></div>
        <p>Learning technology that grows with every student.</p>
        <div><a href="#pathways">Learning paths</a><Link to="/pricing">Pricing</Link><Link to="/login">Portals</Link></div>
        <span>© {new Date().getFullYear()} EduAI Learning Pvt. Ltd.</span>
      </footer>
    </div>
  );
};
