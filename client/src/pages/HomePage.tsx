import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { ArchRings, Bloom, HeroArch, Sprig } from '../components/Decor'
import Reveal3D from '../components/Reveal3D'
import Tilt3D from '../components/Tilt3D'
import { DEVELOPER, MARRIAGE_VERSE } from '../utils/verse'

const TRUST_POINTS = [
  { icon: 'shield', title: 'Every profile is checked', text: 'Our team reviews each profile and photo before other members can see it.' },
  { icon: 'eye', title: 'You control your photos', text: 'Show photos to all members, only to people you accept, or to no one.' },
  { icon: 'chat', title: 'Contact after mutual interest', text: 'Chat opens only when both sides accept, so there are no unwanted messages.' },
  { icon: 'family', title: 'Family friendly', text: 'Parents and siblings can create and manage a profile for a family member.' },
] as const

const FEATURES = [
  'Filter by age, height and marital status',
  'Search by city and state',
  'Filter by sect and religious practice',
  'See education, profession and family details',
  'Private chat after an interest is accepted',
  'One simple plan: ₹299 a month',
]

const STEPS = [
  { title: 'Create your profile', text: 'Register free and add your details, family background and partner preferences.' },
  { title: 'Search profiles', text: 'Use filters for age, city, education and religious practice to find suitable matches.' },
  { title: 'Send an interest', text: 'When both sides accept, you can chat and bring your families into the conversation.' },
  { title: 'Nikah', text: 'When both families are happy, go ahead with the nikah in the way of the Sunnah.' },
]

// Everything here must stay true to how the site really works. Change it when the rules change.
const JOURNEYS = [
  { title: 'Marrying for the first time', text: 'Begin with clear intentions, and with your family beside you.' },
  { title: 'Marrying later in life', text: 'There is no deadline on finding a good companion.' },
  { title: 'Divorced or widowed', text: 'Start again with dignity, among people who respect your story.' },
  { title: 'Living away from home', text: 'Stay close to your roots, wherever work or study has taken you.' },
]

const FAQS = [
  {
    question: 'How do you check profiles?',
    answer:
      'Our team reads every profile and looks at every photo before other members can see them. We do not check government ID, so please take your time and involve your families before making any decision.',
  },
  {
    question: 'Who can see my photos?',
    answer: 'You decide. Show them to all members, only to people whose interest you accept, or to no one.',
  },
  {
    question: 'Who can see my phone number and email?',
    answer: 'They never appear on your profile or in search. Only a member you are connected with, and who has Premium, can see them.',
  },
  {
    question: 'How does messaging work?',
    answer: 'Chat opens once an interest has been accepted, so nobody can message you out of the blue. Both members need Premium to read and send messages.',
  },
  {
    question: 'What does Hamsafar cost?',
    answer:
      'Registering, creating a profile, searching and sending interests are free. Premium is ₹299 a month and adds chat and contact details. It does not renew automatically.',
  },
  {
    question: 'Can my parents create a profile for me?',
    answer: 'Yes. Parents and siblings can create and manage a profile for a son, daughter, brother or sister.',
  },
  {
    question: 'Is there an age limit?',
    answer: 'Yes. Every member must be at least 18 years old.',
  },
  {
    question: 'What if someone behaves badly?',
    answer: 'You can block or report any member from their profile. A block hides you from each other, and our team reviews every report.',
  },
]

// Sample rows for the illustration in the Features section
const SAMPLE_MATCHES = [
  { initials: 'AK', name: 'Ayesha K.', age: 27, city: 'Srinagar', work: 'Teacher' },
  { initials: 'MS', name: 'Mariam S.', age: 25, city: 'Baramulla', work: 'Doctor' },
  { initials: 'HR', name: 'Hafsa R.', age: 29, city: 'Anantnag', work: 'Engineer' },
]

export default function HomePage() {
  return (
    <>
      <Hero />
      <VerseSection />
      <JourneysSection />
      <DeveloperSection />
      <ProfileSection />
      <TrustSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FaqSection />
      <ClosingSection />
    </>
  )
}

// ---------------- Hero with search ----------------

function Hero() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [lookingFor, setLookingFor] = useState<'Bride' | 'Groom'>('Bride')
  const [maritalStatus, setMaritalStatus] = useState('Any')
  const [city, setCity] = useState('')

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    // Profiles are visible to members only. Visitors register first (we pre-fill what we can).
    // Members go straight to search (gender is automatic: they always see the opposite gender).
    if (user) {
      const params = new URLSearchParams()
      if (maritalStatus !== 'Any') params.append('maritalStatuses', maritalStatus)
      if (city.trim()) params.set('city', city.trim())
      navigate(`/search?${params.toString()}`)
    } else {
      navigate('/register', { state: { lookingFor, maritalStatus, city } })
    }
  }

  const labelClass = 'text-xs font-semibold uppercase tracking-[0.14em] text-white/70'
  const fieldClass =
    'mt-1.5 w-full rounded-lg border border-white/20 bg-brand-900/70 px-3 py-2.5 text-sm font-medium text-white scheme-dark placeholder:text-white/50 hover:border-white/40'

  return (
    <section className="on-dark relative overflow-hidden border-b border-gold/25 bg-linear-to-br from-brand-900 via-brand-800 to-brand-700 text-white">
      <div className="pointer-events-none absolute -right-24 top-1/4 hidden h-96 w-96 rounded-full bg-gold/10 blur-3xl lg:block" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:py-16 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <div>
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
            Marriage in the way of the Sunnah
            <span className="hidden h-px w-10 bg-gold sm:block" aria-hidden="true" />
            <span className="hidden h-1.5 w-1.5 rotate-45 bg-gold sm:block" aria-hidden="true" />
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            Find a spouse who
            <span className="block italic text-gold">shares your deen</span>
          </h1>
          <p className="mt-5 max-w-lg leading-relaxed text-white/80">
            Hamsafar means a companion for the journey. Meet sincere Muslims with your family beside you, on a site where our team reviews every profile and you decide who sees your photos.
          </p>

          <form onSubmit={handleSearch} className="relative mt-9 rounded-2xl border border-white/15 bg-white/5 p-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)] sm:p-6">
            <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-gold" aria-hidden="true" />
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className={labelClass}>Looking for</span>
                <select value={lookingFor} onChange={(e) => setLookingFor(e.target.value as 'Bride' | 'Groom')} className={fieldClass}>
                  <option value="Bride">A bride</option>
                  <option value="Groom">A groom</option>
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Marital status</span>
                <select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} className={fieldClass}>
                  <option value="Any">Any</option>
                  <option value="NeverMarried">Never married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>City</span>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Srinagar" className={fieldClass} />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-lg bg-accent-500 px-6 py-3 text-sm font-bold text-brand-900 hover:bg-accent-400"
              >
                Search profiles
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 10h12M11 5l5 5-5 5" />
                </svg>
              </button>
              <Link to="/search" className="text-xs font-semibold uppercase tracking-[0.12em] text-gold hover:text-accent-400">
                Advanced search
              </Link>
            </div>
          </form>
        </div>

        <HeroArch className="mx-auto w-64 sm:w-80 lg:w-full lg:max-w-md" />
      </div>
    </section>
  )
}

// ---------------- Quran verse (the centrepiece) ----------------

function VerseSection() {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-brand-900 via-brand-800 to-dusk py-20 text-white md:py-24">
      {/* soft glows and faint flowers for depth */}
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-brand-400/25 blur-3xl" aria-hidden="true" />
      <Bloom className="pointer-events-none absolute left-[7%] top-12 w-10 opacity-25" petal="#ffffff" center="var(--color-gold)" />
      <Bloom className="pointer-events-none absolute bottom-14 right-[8%] hidden w-14 opacity-20 sm:block" petal="#ffffff" center="var(--color-gold)" />

      <figure className="relative mx-auto max-w-3xl px-4 text-center">
        <div className="mx-auto mb-8 flex items-center justify-center gap-3" aria-hidden="true">
          <span className="h-px w-16 bg-linear-to-r from-transparent to-gold" />
          <span className="h-2 w-2 rotate-45 bg-gold" />
          <span className="h-px w-16 bg-linear-to-l from-transparent to-gold" />
        </div>
        <p dir="rtl" lang="ar" className="font-arabic text-3xl leading-[2.1] text-white sm:text-4xl">
          {MARRIAGE_VERSE.arabic}
        </p>
        <blockquote className="mx-auto mt-6 max-w-2xl text-lg italic leading-relaxed text-white/85">“{MARRIAGE_VERSE.english}”</blockquote>
        <figcaption className="mt-4 text-sm font-medium tracking-wide text-gold">{MARRIAGE_VERSE.reference}</figcaption>
      </figure>
    </section>
  )
}

// ---------------- Who Hamsafar is for ----------------

function JourneysSection() {
  return (
    <section id="who" className="scroll-mt-20 bg-peach-50 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">A companion for every journey</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Everyone comes to marriage from a different place. Hamsafar is for all Muslims who are serious about nikah, whatever road brought them here.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {JOURNEYS.map((j, i) => (
            <Reveal3D key={j.title} delay={i * 120}>
              <div className="h-full rounded-2xl border border-peach-200 bg-white p-6">
                <span className="block h-2 w-2 rotate-45 bg-accent-500" aria-hidden="true" />
                <h3 className="mt-4 font-display text-xl font-bold text-ink">{j.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{j.text}</p>
              </div>
            </Reveal3D>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------- Developer (own row, plain page background) ----------------
// Photo file: client/public/developer.jpg (if it is missing, the initials are shown)
// The quotes are the developer's own promise for the platform, not member reviews.
// When real members give feedback (with permission), they can be added with their names.
function DeveloperSection() {
  const [photoFailed, setPhotoFailed] = useState(false)

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-[1.4fr_1fr] md:py-20">
      {/* Left: quotes in a box with slightly rounded corners */}
      <div className="order-2 rounded-xl border border-peach-200 p-6 sm:p-8 md:order-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-600">Our promise to you</p>
        <ul className="mt-6 space-y-6">
          {DEVELOPER.promises.map((text) => (
            <li key={text} className="border-l-4 border-brand-200 pl-4">
              <p className="text-lg italic leading-relaxed text-ink">“{text}”</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 border-t border-peach-100 pt-4 text-sm font-semibold text-ink-soft">— {DEVELOPER.name}</p>
      </div>

      {/* Right: photo and name */}
      <div className="order-1 text-center md:order-2">
        <div className="mx-auto h-52 w-52 rounded-full bg-linear-to-br from-gold via-accent-400 to-brand-500 p-1.5 md:h-60 md:w-60">
          {photoFailed ? (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-brand-800 text-5xl font-bold text-white" aria-hidden="true">
              {DEVELOPER.initials}
            </div>
          ) : (
            <img
              src={DEVELOPER.photo}
              alt={`Photo of ${DEVELOPER.name}`}
              onError={() => setPhotoFailed(true)}
              className="h-full w-full rounded-full border-4 border-white object-cover"
            />
          )}
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-accent-600">Designed and developed by</p>
        <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">{DEVELOPER.name}</h2>
        <p className="mt-1 font-medium text-brand-700">Founder and sole developer</p>
      </div>
    </section>
  )
}

// ---------------- Create a profile ----------------

function ProfileSection() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
      {/* Illustration: a sample profile card */}
      <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
        <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-peach-100" />
        <Tilt3D maxTilt={8}>
          <div className="rounded-2xl bg-white p-6 transform-3d shadow-[0_18px_50px_-20px_rgba(14,29,54,0.25)]">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-brand-400 to-accent-400 text-xl font-bold text-white">
                AK
              </div>
              <div>
                <p className="font-semibold text-ink">Ayesha K.</p>
                <p className="text-sm text-ink-soft">Profile created by her father</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium">
              {['27 years', 'Srinagar', 'MBA', 'Teacher', 'Never married'].map((t) => (
                <span key={t} className="rounded-full bg-peach-50 px-3 py-1 text-ink-soft ring-1 ring-peach-200">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-5 flex translate-z-6 items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-sm text-brand-700">
              <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="4" y="9" width="12" height="8" rx="2" />
                <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
              </svg>
              Photo shown after she accepts your interest
            </div>
          </div>
          <div className="absolute -right-3 -top-4 flex translate-z-12 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-sage-500 shadow-md sm:-right-8">
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="m5 10.5 3.2 3L15 6.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Verified by our team
          </div>
        </Tilt3D>
      </div>

      <div className="max-w-md">
        <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Create a profile in a few minutes</h2>
        <p className="mt-4 leading-relaxed text-ink-soft">
          Add your basics, education, family and what you are looking for. Parents and siblings can create a profile for a son,
          daughter, brother or sister.
        </p>
        <Link
          to="/register"
          className="mt-7 inline-block rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Create a free profile
        </Link>
      </div>
    </section>
  )
}

// ---------------- Why families trust us ----------------

function TrustIcon({ name }: { name: (typeof TRUST_POINTS)[number]['icon'] }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" {...common}>
      {name === 'shield' && (
        <>
          <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </>
      )}
      {name === 'eye' && (
        <>
          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
      {name === 'chat' && (
        <>
          <path d="M4 5h16v11H9l-5 4V5Z" />
          <path d="M8 10h8M8 13h5" />
        </>
      )}
      {name === 'family' && (
        <>
          <circle cx="8" cy="7" r="2.5" />
          <circle cx="16" cy="7" r="2.5" />
          <circle cx="12" cy="14" r="2" />
          <path d="M3.5 20c0-3 2-5 4.5-5M20.5 20c0-3-2-5-4.5-5M8.5 21c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5" />
        </>
      )}
    </svg>
  )
}

function TrustSection() {
  return (
    <section id="why" className="relative scroll-mt-20 overflow-hidden bg-peach-100 py-16 md:py-20">
      <Bloom className="pointer-events-none absolute right-[7%] top-8 w-10" petal="var(--color-sage-300)" center="var(--color-accent-400)" />
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="max-w-md font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Built for trust, not swiping</h2>
        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map((p, i) => (
            <Reveal3D key={p.title} delay={i * 120}>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-600">
                <TrustIcon name={p.icon} />
              </div>
              <h3 className="mt-4 font-semibold text-ink">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{p.text}</p>
            </Reveal3D>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------- Features ----------------

function FeaturesSection() {
  return (
    <section id="features" className="mx-auto grid max-w-6xl scroll-mt-20 grid-cols-1 items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
      <div className="max-w-md">
        <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Search the way families do</h2>
        <p className="mt-4 text-ink-soft">Filters for the things that matter in a Muslim marriage.</p>
        <ul className="mt-6 space-y-3">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm text-ink">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 text-brand-900">
                <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                  <path d="m5 10.5 3.2 3L15 6.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {f}
            </li>
          ))}
        </ul>
        <a
          href="#how-it-works"
          className="mt-8 inline-block rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          See how it works
        </a>
      </div>

      {/* Illustration: sample search results */}
      <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
        <Tilt3D maxTilt={8}>
          <div className="rounded-2xl bg-brand-600 p-5 text-white transform-3d shadow-[0_24px_60px_-24px_rgba(14,29,54,0.55)]">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Matches in Kashmir</p>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs">Age 24–30</span>
            </div>
            <ul className="mt-4 space-y-3 transform-3d">
              {SAMPLE_MATCHES.map((m) => (
                <li key={m.name} className="flex translate-z-6 items-center gap-3 rounded-xl bg-white p-3 text-ink">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-peach-100 text-sm font-bold text-brand-700">
                    {m.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{m.name}</p>
                    <p className="truncate text-xs text-ink-soft">
                      {m.age} years, {m.city}, {m.work}
                    </p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-accent-500 px-2.5 py-1.5 text-xs font-semibold text-brand-900">Send interest</span>
                </li>
              ))}
            </ul>
          </div>
        </Tilt3D>
        <Sprig className="absolute -bottom-8 -left-10 w-36" />
      </div>
    </section>
  )
}

// ---------------- How it works (a real 4-step sequence) ----------------

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <li>
      <span
        className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold ${
          n % 2 === 1 ? 'bg-accent-500 text-brand-900' : 'bg-brand-600 text-white'
        }`}
      >
        {n}
      </span>
      <h3 className="mt-2 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{text}</p>
    </li>
  )
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">How it works</h2>
          <p className="mt-3 text-ink-soft">Four steps from sign-up to nikah.</p>
        </div>

        <div className="mt-12 grid items-center gap-10 md:grid-cols-[1fr_minmax(0,320px)_1fr]">
          <ol className="space-y-10 md:text-right">
            <Step n={1} {...STEPS[0]} />
            <Step n={2} {...STEPS[1]} />
          </ol>
          <ArchRings className="mx-auto hidden w-full max-w-[300px] md:block" />
          <ol start={3} className="space-y-10">
            <Step n={3} {...STEPS[2]} />
            <Step n={4} {...STEPS[3]} />
          </ol>
        </div>
      </div>
    </section>
  )
}

// ---------------- Questions (details = the browser's own open and close, works with the keyboard) ----------------

function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 bg-peach-50 py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Questions families ask</h2>
          <p className="mt-3 text-ink-soft">Straight answers about safety, privacy and cost.</p>
        </div>
        <div className="mt-10 space-y-3">
          {FAQS.map((f) => (
            <details key={f.question} className="group rounded-xl border border-peach-200 bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {f.question}
                <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-accent-600 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M10 4v12M4 10h12" />
                </svg>
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-ink-soft">{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------- Closing invitation ----------------

function ClosingSection() {
  const { user } = useAuth()
  return (
    <section className="on-dark relative overflow-hidden bg-linear-to-br from-brand-900 via-brand-800 to-brand-700 py-16 text-center text-white md:py-20">
      <Bloom className="pointer-events-none absolute left-[8%] top-10 w-10 opacity-25" petal="#ffffff" center="var(--color-gold)" />
      <div className="relative mx-auto max-w-2xl px-4">
        <div className="mx-auto mb-6 flex items-center justify-center gap-3" aria-hidden="true">
          <span className="h-px w-16 bg-linear-to-r from-transparent to-gold" />
          <span className="h-2 w-2 rotate-45 bg-gold" />
          <span className="h-px w-16 bg-linear-to-l from-transparent to-gold" />
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Begin your journey <span className="italic text-gold">with sincerity</span>
        </h2>
        <p className="mt-4 leading-relaxed text-white/80">
          Nobody should walk this road alone. Take the first step today, and bring your family with you.
        </p>
        <Link
          to={user ? '/search' : '/register'}
          className="mt-8 inline-block rounded-lg bg-accent-500 px-7 py-3 text-sm font-bold text-brand-900 hover:bg-accent-400"
        >
          {user ? 'Search profiles' : 'Create a free profile'}
        </Link>
      </div>
    </section>
  )
}
