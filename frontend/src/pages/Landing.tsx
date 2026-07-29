import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { Logo } from '../components/NavBar'

const GITHUB_URL = 'https://github.com/neelansh0725/lendingclub-credit-risk'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

function Section({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={fadeUp}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`mx-auto max-w-6xl px-6 py-20 ${className}`}
    >
      {children}
    </motion.section>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-[var(--brand-tint)] px-3 py-1 text-xs font-bold tracking-wide text-[var(--brand)] uppercase">
      {children}
    </span>
  )
}

function MarketingNav() {
  return (
    <nav className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-base font-bold tracking-tight text-[var(--text-primary)]">Credit Risk</span>
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          <a href="#features" className="rounded-lg px-3.5 py-1.5 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Features
          </a>
          <a href="#how-it-works" className="rounded-lg px-3.5 py-1.5 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            How It Works
          </a>
          <a href="#faq" className="rounded-lg px-3.5 py-1.5 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            FAQ
          </a>
        </div>
        <Link
          to="/predict"
          className="rounded-full bg-[var(--text-primary)] px-4 py-2 text-sm font-bold text-[var(--page)] shadow-sm hover:opacity-90"
        >
          Launch App →
        </Link>
      </div>
    </nav>
  )
}

function HeroPreviewCard() {
  const shapData = [
    { feature: 'term_ 60 months', shap_value: -1.135 },
    { feature: 'verification_status_Source Verified', shap_value: -0.721 },
    { feature: 'sub_grade_C3', shap_value: 0.552 },
    { feature: 'verification_status_Verified', shap_value: 0.533 },
    { feature: 'initial_list_status_f', shap_value: -0.487 },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
      className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
    >
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-raised)] px-5 py-3">
        <Logo />
        <span className="text-sm font-bold text-[var(--text-primary)]">Credit Risk</span>
        <span className="ml-auto rounded-full bg-[var(--border)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
          Example Prediction
        </span>
      </div>
      <div className="p-6">
        <div className="mb-5 flex items-center gap-4">
          <span className="text-4xl font-extrabold tabular-nums tracking-tight text-[var(--text-primary)]">19.3%</span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
            style={{ background: 'var(--status-warning-tint)', color: 'var(--status-warning)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--status-warning)' }} />
            Medium Risk
          </span>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shapData} layout="vertical" margin={{ left: 8, right: 8 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="feature" width={0} hide />
              <Bar dataKey="shap_value" radius={2}>
                {shapData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.shap_value >= 0 ? 'var(--status-critical)' : 'var(--status-good)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-xs text-[var(--text-muted)]">Top 5 SHAP factors for this applicant</p>
      </div>
    </motion.div>
  )
}

function TechStackBar() {
  const stack = ['React + TypeScript', 'FastAPI', 'LightGBM', 'SHAP', 'MongoDB', 'MySQL', 'Tailwind CSS']
  return (
    <div className="border-y border-[var(--border)] bg-[var(--surface-raised)] py-8">
      <p className="mb-4 text-center text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
        Powered by
      </p>
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6">
        {stack.map((t) => (
          <span key={t} className="text-sm font-bold text-[var(--text-secondary)]">
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

function ComparisonColumn({
  title,
  items,
  variant,
}: {
  title: string
  items: string[]
  variant: 'before' | 'after'
}) {
  const isAfter = variant === 'after'
  return (
    <div
      className="flex-1 rounded-2xl border p-6"
      style={
        isAfter
          ? { borderColor: 'var(--status-good)', background: 'var(--status-good-tint)' }
          : { borderColor: 'var(--border)', background: 'var(--surface)' }
      }
    >
      <h3 className="mb-4 text-sm font-bold text-[var(--text-muted)] uppercase">{title}</h3>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: isAfter ? 'var(--status-good)' : 'var(--status-critical)' }}
            >
              {isAfter ? '✓' : '✕'}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl"
        style={{ background: 'var(--gradient-accent)' }}
      >
        {icon}
      </div>
      <h3 className="mb-2 text-base font-bold text-[var(--text-primary)]">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)]">{body}</p>
    </motion.div>
  )
}

function StepCard({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <motion.div variants={fadeUp} className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <span
        className="mb-4 inline-flex rounded-full px-3 py-1 text-xs font-bold text-white"
        style={{ background: 'var(--gradient-accent)' }}
      >
        {step}
      </span>
      <h3 className="mb-2 text-base font-bold text-[var(--text-primary)]">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)]">{body}</p>
    </motion.div>
  )
}

const FAQ_ITEMS = [
  {
    q: 'What model powers the predictions?',
    a: 'A LightGBM gradient-boosting classifier trained on roughly 1.35M resolved LendingClub loans (Fully Paid / Charged Off), achieving 0.7344 AUC-ROC on a held-out test set — benchmarked against a Logistic Regression baseline (0.7204).',
  },
  {
    q: 'How does the explainability work?',
    a: 'Every prediction returns its top 5 SHAP (SHapley Additive exPlanations) factors, showing exactly which applicant attributes pushed the default risk up or down — not just a bare probability.',
  },
  {
    q: 'Can I score more than one applicant at once?',
    a: 'Yes. The Batch Upload page accepts a CSV and scores 1,000+ rows well under a second, with sortable, filterable results and CSV export.',
  },
  {
    q: 'What about secured loans and collateral?',
    a: 'The Collateral Tracker lets you pledge one or more collateral items against a loan, each with its own cumulative repayment target. Recording a repayment re-evaluates every collateral and releases any that have hit their target — one-directionally, so a released item never reverts to held.',
  },
  {
    q: 'Is this a production underwriting system?',
    a: "No — this is a portfolio project demonstrating applied ML and full-stack engineering. It isn't certified for regulatory compliance and doesn't handle live/streaming applications, but the modeling, explainability, and deployment practices are built to a production standard.",
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[var(--border)] py-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left text-sm font-semibold text-[var(--text-primary)]"
      >
        {q}
        <span
          className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm transition-transform"
          style={{ background: 'var(--border)', transform: open ? 'rotate(45deg)' : 'none' }}
        >
          +
        </span>
      </button>
      {open && <p className="mt-3 text-sm text-[var(--text-secondary)]">{a}</p>}
    </div>
  )
}

export default function Landing() {
  return (
    <div>
      <MarketingNav />

      {/* Hero */}
      <div
        className="px-6 pt-20 pb-16 text-center"
        style={{ background: 'linear-gradient(180deg, var(--brand-tint) 0%, var(--page) 70%)' }}
      >
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.5 }}>
          <Eyebrow>ML-Powered Credit Risk Platform</Eyebrow>
          <h1 className="mx-auto mt-5 max-w-3xl text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Credit Risk <span className="align-middle">💳</span> Platform
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-[var(--text-secondary)]">
            Predict loan default probability with an explainable, production-grade ML pipeline — trained on 1.3M+
            real LendingClub loans, with SHAP-powered reasoning behind every score.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/predict"
              className="rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg"
              style={{ background: 'var(--gradient-accent)' }}
            >
              Launch App →
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-6 py-3 text-sm font-bold text-[var(--text-primary)]"
            >
              View on GitHub
            </a>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[var(--text-muted)]">
            <span>⭐ 0.7344 AUC-ROC</span>
            <span>✓ SHAP Explainable</span>
            <span>⚡ &lt;1s Predictions</span>
          </div>
        </motion.div>

        <div className="mt-14">
          <HeroPreviewCard />
        </div>
      </div>

      <TechStackBar />

      {/* Problem / rationale */}
      <Section>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Why This Exists</Eyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Manual underwriting doesn't scale
          </h2>
          <p className="mt-4 text-[var(--text-secondary)]">
            Lenders need to assess default risk before approving credit. Rules-based underwriting is slow,
            inconsistent, and hard to explain to stakeholders — and most ML alternatives trade away
            explainability for accuracy.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <ComparisonColumn
            title="Manual / Rules-Based"
            variant="before"
            items={[
              'Slow, manual review of every application',
              'Inconsistent decisions across reviewers',
              'No clear reasoning to show stakeholders',
              "Doesn't scale to batch volume",
            ]}
          />
          <ComparisonColumn
            title="This Platform"
            variant="after"
            items={[
              'Instant scoring, under 1 second',
              'Consistent, model-driven decisions',
              'SHAP explains every single prediction',
              'Batch scoring for 1,000+ applicants at once',
            ]}
          />
        </div>
      </Section>

      {/* Features */}
      <Section id="features">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Features</Eyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Everything a risk analyst needs
          </h2>
        </div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3"
        >
          <FeatureCard
            icon="⚡"
            title="Instant Predictions"
            body="Get a default probability and risk tier in under a second, with the top 5 SHAP factors explaining why."
          />
          <FeatureCard
            icon="📊"
            title="Batch Scoring"
            body="Upload a CSV of applicants and score 1,000+ rows at once — sortable, filterable, and exportable."
          />
          <FeatureCard
            icon="🔒"
            title="Secured Loan Tracking"
            body="Pledge collateral against a loan and watch it auto-release as repayments hit each target — fully audited."
          />
        </motion.div>
      </Section>

      {/* How it works */}
      <Section id="how-it-works" className="bg-[var(--surface-raised)]">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>How It Works</Eyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            From application to explained score
          </h2>
        </div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="mt-10 flex flex-col gap-5 sm:flex-row"
        >
          <StepCard
            step="STEP 01"
            title="Enter applicant details"
            body="Step through loan terms, applicant profile, and credit bureau attributes in a guided, validated wizard."
          />
          <StepCard
            step="STEP 02"
            title="Get an instant, explained score"
            body="A LightGBM model returns a probability and risk tier, with SHAP breaking down exactly why."
          />
          <StepCard
            step="STEP 03"
            title="Track secured loans"
            body="For secured loans, pledge collateral and watch it release automatically as repayments come in."
          />
        </motion.div>
      </Section>

      {/* FAQ */}
      <Section id="faq">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Frequently asked questions
            </h2>
          </div>
          <div className="mt-8">
            {FAQ_ITEMS.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </Section>

      {/* Final CTA */}
      <Section className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Ready to see it in action?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[var(--text-secondary)]">
          Score an applicant, upload a batch, or explore the model metrics — no signup required.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <Link
            to="/predict"
            className="rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg"
            style={{ background: 'var(--gradient-accent)' }}
          >
            Launch App →
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-6 py-3 text-sm font-bold text-[var(--text-primary)]"
          >
            View on GitHub
          </a>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface-raised)] px-6 py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <Logo />
              <span className="text-base font-bold text-[var(--text-primary)]">Credit Risk</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-[var(--text-secondary)]">
              An ML-driven credit risk platform with built-in explainability, built as a full-stack portfolio
              project.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-bold tracking-wide text-[var(--text-muted)] uppercase">App</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link to="/predict" className="text-[var(--text-secondary)] hover:text-[var(--brand)]">Predict</Link></li>
              <li><Link to="/batch" className="text-[var(--text-secondary)] hover:text-[var(--brand)]">Batch Upload</Link></li>
              <li><Link to="/metrics" className="text-[var(--text-secondary)] hover:text-[var(--brand)]">Metrics</Link></li>
              <li><Link to="/collateral" className="text-[var(--text-secondary)] hover:text-[var(--brand)]">Collateral Tracker</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-bold tracking-wide text-[var(--text-muted)] uppercase">Project</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li><a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--brand)]">GitHub Repo</a></li>
              <li><a href={GITHUB_URL + '#readme'} target="_blank" rel="noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--brand)]">README</a></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t border-[var(--border)] pt-6 text-sm text-[var(--text-muted)]">
          Built by Neelansh Singh.
        </div>
      </footer>
    </div>
  )
}
