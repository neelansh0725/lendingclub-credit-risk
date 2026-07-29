import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { apiClient } from '../api/client'
import RiskTierBadge from '../components/RiskTierBadge'
import type { PredictionResponse } from '../types'
import { BUREAU_FIELDS, LOAN_FIELDS, validateField, type FieldConfig } from './predictFields'

const byKey = (keys: string[]) => LOAN_FIELDS.filter((f) => keys.includes(f.key))

const STEPS: { label: string; fields: FieldConfig[] }[] = [
  {
    label: 'Loan Terms',
    fields: byKey(['loan_amnt', 'term', 'int_rate', 'installment', 'grade', 'sub_grade', 'purpose', 'issue_d', 'initial_list_status', 'disbursement_method']),
  },
  {
    label: 'Applicant Profile',
    fields: byKey(['emp_length', 'home_ownership', 'annual_inc', 'verification_status', 'addr_state', 'dti']),
  },
  { label: 'Credit Profile', fields: BUREAU_FIELDS.slice(0, 16) },
  { label: 'Account Activity', fields: BUREAU_FIELDS.slice(16, 32) },
  { label: 'Credit Standing & Limits', fields: BUREAU_FIELDS.slice(32, 48) },
]

const ALL_FIELDS = STEPS.flatMap((s) => s.fields)

function FieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: FieldConfig
  value: string
  error?: string
  onChange: (key: string, value: string) => void
}) {
  const inputClasses =
    'rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] transition-shadow outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-tint)]'

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-[var(--text-secondary)]">{field.label}</span>
      {field.type === 'select' ? (
        <select className={inputClasses} value={value} onChange={(e) => onChange(field.key, e.target.value)}>
          <option value="">Select...</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          step={field.type === 'number' ? field.step : undefined}
          placeholder={field.type === 'date' ? field.placeholder : undefined}
          className={inputClasses}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      )}
      {error && <span className="text-xs font-medium text-[var(--status-critical)]">{error}</span>}
    </label>
  )
}

function StepIndicator({
  currentStep,
  maxStepReached,
  onStepClick,
}: {
  currentStep: number
  maxStepReached: number
  onStepClick: (idx: number) => void
}) {
  return (
    <div className="mb-8 flex items-center">
      {STEPS.map((step, idx) => {
        const isCompleted = idx < maxStepReached
        const isCurrent = idx === currentStep
        const isReachable = idx <= maxStepReached
        return (
          <div key={step.label} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              onClick={() => isReachable && onStepClick(idx)}
              disabled={!isReachable}
              className="flex flex-col items-center gap-2"
              style={{ cursor: isReachable ? 'pointer' : 'default' }}
            >
              <motion.div
                animate={{ scale: isCurrent ? 1.1 : 1 }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={
                  isCompleted
                    ? { background: 'var(--status-good)', color: '#fff' }
                    : isCurrent
                    ? { background: 'var(--gradient-accent)', color: '#fff' }
                    : { background: 'var(--border)', color: 'var(--text-muted)' }
                }
              >
                {isCompleted ? '✓' : idx + 1}
              </motion.div>
              <span
                className="hidden text-center text-xs font-medium sm:block"
                style={{ color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                {step.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div
                className="mx-2 h-0.5 flex-1 rounded"
                style={{ background: idx < maxStepReached ? 'var(--status-good)' : 'var(--border)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Predict() {
  const [currentStep, setCurrentStep] = useState(0)
  const [maxStepReached, setMaxStepReached] = useState(0)
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<PredictionResponse | null>(null)

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const validateStep = (stepIdx: number): boolean => {
    const nextErrors: Record<string, string> = {}
    for (const field of STEPS[stepIdx].fields) {
      const err = validateField(field, values[field.key] ?? '')
      if (err) nextErrors[field.key] = err
    }
    setErrors((prev) => ({ ...prev, ...nextErrors }))
    return Object.keys(nextErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) return
    const next = currentStep + 1
    setCurrentStep(next)
    setMaxStepReached((prev) => Math.max(prev, next))
  }

  const handleBack = () => setCurrentStep((s) => Math.max(0, s - 1))

  const handleStepClick = (idx: number) => {
    if (idx <= maxStepReached) setCurrentStep(idx)
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return
    setSubmitError(null)
    setResult(null)

    const payload: Record<string, string | number> = {}
    for (const field of ALL_FIELDS) {
      payload[field.key] = field.type === 'number' ? Number(values[field.key]) : values[field.key]
    }

    setLoading(true)
    try {
      const { data } = await apiClient.post<PredictionResponse>('/predict', payload)
      setResult(data)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Prediction request failed')
    } finally {
      setLoading(false)
    }
  }

  const chartData = result?.top_shap_factors.map((f) => ({ ...f, absValue: Math.abs(f.shap_value) })) ?? []
  const isLastStep = currentStep === STEPS.length - 1

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Single Applicant Prediction</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Step through an applicant's details to get an instant default probability and explanation.
        </p>
      </motion.div>

      <StepIndicator currentStep={currentStep} maxStepReached={maxStepReached} onStepClick={handleStepClick} />

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <h2 className="mb-5 text-base font-semibold text-[var(--text-primary)]">{STEPS[currentStep].label}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {STEPS[currentStep].fields.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={values[field.key] ?? ''}
                  error={errors[field.key]}
                  onChange={handleChange}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between border-t border-[var(--border)] pt-6">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] disabled:opacity-40"
          >
            Back
          </button>

          <span className="text-xs font-medium text-[var(--text-muted)]">
            Step {currentStep + 1} of {STEPS.length}
          </span>

          {isLastStep ? (
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.03 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className="rounded-lg px-6 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-50"
              style={{ background: 'var(--gradient-accent)' }}
            >
              {loading ? 'Scoring...' : 'Predict Risk'}
            </motion.button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)]"
            >
              Next
            </button>
          )}
        </div>
      </div>

      {submitError && <p className="mt-4 text-sm font-medium text-[var(--status-critical)]">{submitError}</p>}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-md"
        >
          <div className="mb-6 flex items-center gap-4">
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="text-4xl font-extrabold tabular-nums tracking-tight text-[var(--text-primary)]"
            >
              {(result.probability * 100).toFixed(1)}%
            </motion.span>
            <RiskTierBadge tier={result.risk_tier} />
          </div>

          <h2 className="mb-3 text-base font-semibold text-[var(--text-primary)]">Top Risk Factors (SHAP)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} stroke="var(--border-strong)" />
                <YAxis
                  type="category"
                  dataKey="feature"
                  width={180}
                  tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                  stroke="var(--border-strong)"
                />
                <Tooltip
                  formatter={(value) => Number(value).toFixed(4)}
                  contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar dataKey="shap_value" radius={2} animationDuration={600}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.shap_value >= 0 ? 'var(--status-critical)' : 'var(--status-good)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 flex items-center gap-4 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: 'var(--status-critical)' }} />
              Pushes risk up
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: 'var(--status-good)' }} />
              Pushes risk down
            </span>
          </p>
        </motion.div>
      )}
    </div>
  )
}
