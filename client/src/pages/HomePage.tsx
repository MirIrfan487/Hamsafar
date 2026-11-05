import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { ArchRings, Bloom, Sprig } from '../components/Decor'

// Surah An-Nur 24:32 — Arabic from the Shamela library; English translation by Pickthall (public domain)
const VERSE_AR =
  'وَأَنْكِحُوا الْأَيَامَى مِنْكُمْ وَالصَّالِحِينَ مِنْ عِبَادِكُمْ وَإِمَائِكُمْ إِنْ يَكُونُوا فُقَرَاءَ يُغْنِهِمُ اللَّهُ مِنْ فَضْلِهِ وَاللَّهُ وَاسِعٌ عَلِيمٌ'
const VERSE_EN =
  'And marry such of you as are solitary and the pious of your slaves and maid-servants. If they be poor, Allah will enrich them of His bounty. Allah is of ample means, Aware.'

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
      <ProfileSection />
      <TrustSection />
      <FeaturesSection />
      <HowItWorksSection />
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

  const fieldClass =
    'mt-1 w-full rounded-lg border-0 bg-transparent px-0 py-1 text-sm font-medium text-ink focus:ring-0 focus-visible:outline-none'

  return (
    <section className="relative overflow-hidden bg-peach-100">
      <div className="pointer-events-none absolute -left-10 top-16 h-28 w-28 rounded-full bg-peach-200/70" />
      <div className="pointer-events-none absolute -right-8 top-40 h-24 w-24 rounded-full bg-peach-200/70" />
      <Sprig className="pointer-events-none absolute left-2 top-[58%] hidden w-44 lg:block" />
      <Sprig className="pointer-events-none absolute right-2 top-[52%] hidden w-44 lg:block" flip />

      <div className="relative mx-auto max-w-6xl px-4 pt-14 text-center sm:pt-20">
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
          Find a spouse who shares your deen
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-ink-soft">
          Verified profiles, families involved, and photos that only the people you choose can see.
        </p>

        <form
          onSubmit={handleSearch}
          className="mx-auto mt-8 grid max-w-3xl gap-4 rounded-2xl bg-white p-4 text-left shadow-[0_18px_50px_-20px_rgba(91,22,217,0.25)] sm:grid-cols-[1fr_1fr_1.2fr_auto] sm:items-end sm:gap-0 sm:divide-x sm:divide-peach-100 sm:p-3"
        >
          <label className="block sm:px-4">
            <span className="text-xs text-ink-soft">I'm looking for</span>
            <select value={lookingFor} onChange={(e) => setLookingFor(e.target.value as 'Bride' | 'Groom')} className={fieldClass}>
              <option value="Bride">A bride</option>
              <option value="Groom">A groom</option>
            </select>
          </label>
          <label className="block sm:px-4">
            <span className="text-xs text-ink-soft">Marital status</span>
            <select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} className={fieldClass}>
              <option value="Any">Any</option>
              <option value="NeverMarried">Never married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
          </label>
          <label className="block sm:px-4">
            <span className="text-xs text-ink-soft">City</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Srinagar"
              className={`${fieldClass} placeholder:text-gray-400`}
            />
          </label>
          <div className="sm:pl-3">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-6 py-3 text-sm font-semibold text-white hover:bg-accent-600"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M13.5 13.5 18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Search
            </button>
          </div>
        </form>

        <ArchRings className="mx-auto mt-12 w-64 sm:w-80" />
      </div>
    </section>
  )
}

// ---------------- Quran verse (the centrepiece) ----------------

function VerseSection() {
  return (
    <section className="relative overflow-hidden bg-white py-20">
      <Bloom className="pointer-events-none absolute left-[8%] top-10 w-8" petal="var(--color-sage-300)" />
      <Sprig className="pointer-events-none absolute bottom-6 right-[6%] hidden w-36 sm:block" flip />

      <figure className="relative mx-auto max-w-3xl px-4 text-center">
        <p dir="rtl" lang="ar" className="font-arabic text-3xl leading-[2.1] text-brand-800 sm:text-4xl">
          {VERSE_AR}
        </p>
        <blockquote className="mx-auto mt-6 max-w-2xl text-lg italic leading-relaxed text-ink">“{VERSE_EN}”</blockquote>
        <figcaption className="mt-4 text-sm text-ink-soft">Surah An-Nur, 24:32 (translation: Pickthall)</figcaption>
      </figure>
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
        <div className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_-20px_rgba(34,30,51,0.25)]">
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
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-sm text-brand-700">
            <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="4" y="9" width="12" height="8" rx="2" />
              <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
            </svg>
            Photo shown after she accepts your interest
          </div>
        </div>
        <div className="absolute -right-3 -top-4 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-sage-500 shadow-md sm:-right-8">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="m5 10.5 3.2 3L15 6.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Verified by our team
        </div>
      </div>

      <div className="max-w-md">
        <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Create a profile in a few minutes</h2>
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
        <h2 className="max-w-md text-3xl font-bold tracking-tight text-ink sm:text-4xl">Built for trust, not swiping</h2>
        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map((p) => (
            <div key={p.title}>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-600">
                <TrustIcon name={p.icon} />
              </div>
              <h3 className="mt-4 font-semibold text-ink">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------- Features ----------------

function FeaturesSection() {
  return (
    <section id="features" className="mx-auto grid max-w-6xl scroll-mt-20 items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
      <div className="max-w-md">
        <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Search the way families do</h2>
        <p className="mt-4 text-ink-soft">Filters for the things that matter in a Muslim marriage.</p>
        <ul className="mt-6 space-y-3">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm text-ink">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white">
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
        <div className="rounded-2xl bg-brand-600 p-5 text-white shadow-[0_24px_60px_-24px_rgba(91,22,217,0.55)]">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Matches in Kashmir</p>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs">Age 24–30</span>
          </div>
          <ul className="mt-4 space-y-3">
            {SAMPLE_MATCHES.map((m) => (
              <li key={m.name} className="flex items-center gap-3 rounded-xl bg-white p-3 text-ink">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-peach-100 text-sm font-bold text-brand-700">
                  {m.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="truncate text-xs text-ink-soft">
                    {m.age} years, {m.city}, {m.work}
                  </p>
                </div>
                <span className="rounded-full bg-accent-500 px-3 py-1.5 text-xs font-semibold text-white">Send interest</span>
              </li>
            ))}
          </ul>
        </div>
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
        className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold text-white ${
          n % 2 === 1 ? 'bg-accent-500' : 'bg-brand-600'
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
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">How it works</h2>
          <p className="mt-3 text-ink-soft">Four steps from sign-up to nikah.</p>
        </div>

        <div className="mt-12 grid items-center gap-10 md:grid-cols-[1fr_minmax(0,320px)_1fr]">
          <ol className="space-y-10 md:text-right">
            <Step n={1} {...STEPS[0]} />
            <Step n={2} {...STEPS[1]} />
          </ol>
          <ArchRings tone="sage" className="mx-auto hidden w-full max-w-[300px] md:block" />
          <ol start={3} className="space-y-10">
            <Step n={3} {...STEPS[2]} />
            <Step n={4} {...STEPS[3]} />
          </ol>
        </div>
      </div>
    </section>
  )
}
