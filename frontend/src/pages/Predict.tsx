import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { apiClient } from '../api/client'
import RiskTierBadge from '../components/RiskTierBadge'
import type { PredictionResponse } from '../types'
import { ALL_FIELDS, BUREAU_FIELDS, LOAN_FIELDS, validateField, type FieldConfig } from './predictFields'

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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <h2 className="mb-5 text-base font-semibold text-[var(--text-primary)]">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">{children}</div>
    </div>
  )
}

export default function Predict() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<PredictionResponse | null>(null)

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setResult(null)

    const nextErrors: Record<string, string> = {}
    for (const field of ALL_FIELDS) {
      const err = validateField(field, values[field.key] ?? '')
      if (err) nextErrors[field.key] = err
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

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

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Single Applicant Prediction</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Enter an applicant's loan and credit bureau details to get an instant default probability and explanation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <SectionCard title="Loan & Applicant Details">
          {LOAN_FIELDS.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={values[field.key] ?? ''}
              error={errors[field.key]}
              onChange={handleChange}
            />
          ))}
        </SectionCard>

        <SectionCard title="Credit Bureau Attributes">
          {BUREAU_FIELDS.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={values[field.key] ?? ''}
              error={errors[field.key]}
              onChange={handleChange}
            />
          ))}
        </SectionCard>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-hover)] disabled:opacity-50"
          >
            {loading ? 'Scoring...' : 'Predict Risk'}
          </button>
          {submitError && <p className="text-sm font-medium text-[var(--status-critical)]">{submitError}</p>}
        </div>
      </form>

      {result && (
        <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-4">
            <span className="text-4xl font-bold tabular-nums text-[var(--text-primary)]">
              {(result.probability * 100).toFixed(1)}%
            </span>
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
                <Bar dataKey="shap_value" radius={2}>
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
        </div>
      )}
    </div>
  )
}
