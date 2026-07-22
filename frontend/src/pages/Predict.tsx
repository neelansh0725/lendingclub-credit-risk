import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { apiClient } from '../api/client'
import type { PredictionResponse } from '../types'
import { ALL_FIELDS, BUREAU_FIELDS, LOAN_FIELDS, validateField, type FieldConfig } from './predictFields'

const RISK_TIER_STYLES: Record<string, string> = {
  Low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  High: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

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
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-gray-700 dark:text-gray-300">{field.label}</span>
      {field.type === 'select' ? (
        <select
          className="rounded border border-gray-300 px-2 py-1.5 dark:border-gray-600 dark:bg-gray-800"
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
        >
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
          className="rounded border border-gray-300 px-2 py-1.5 dark:border-gray-600 dark:bg-gray-800"
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      )}
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </label>
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
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Single Applicant Prediction</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <legend className="col-span-full mb-2 text-lg font-medium">Loan & Applicant Details</legend>
          {LOAN_FIELDS.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={values[field.key] ?? ''}
              error={errors[field.key]}
              onChange={handleChange}
            />
          ))}
        </fieldset>

        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <legend className="col-span-full mb-2 text-lg font-medium">Credit Bureau Attributes</legend>
          {BUREAU_FIELDS.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={values[field.key] ?? ''}
              error={errors[field.key]}
              onChange={handleChange}
            />
          ))}
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className="w-fit rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Scoring...' : 'Predict Risk'}
        </button>

        {submitError && <p className="text-red-600 dark:text-red-400">{submitError}</p>}
      </form>

      {result && (
        <div className="mt-8 rounded border border-gray-200 p-6 dark:border-gray-700">
          <div className="mb-4 flex items-center gap-4">
            <span className="text-3xl font-bold">{(result.probability * 100).toFixed(1)}%</span>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${RISK_TIER_STYLES[result.risk_tier]}`}>
              {result.risk_tier} Risk
            </span>
          </div>

          <h2 className="mb-2 text-lg font-medium">Top Risk Factors (SHAP)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="feature" width={180} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => Number(value).toFixed(4)} />
                <Bar dataKey="shap_value">
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.shap_value >= 0 ? '#dc2626' : '#16a34a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Red bars push risk up, green bars push risk down.
          </p>
        </div>
      )}
    </div>
  )
}
