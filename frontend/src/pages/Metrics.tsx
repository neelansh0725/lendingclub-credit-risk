import { useEffect, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { apiClient } from '../api/client'

interface ModelMetrics {
  auc_roc: number
  precision: number
  recall: number
  f1: number
  confusion_matrix?: [[number, number], [number, number]]
  roc_curve?: { fpr: number[]; tpr: number[] }
}

interface MetricsResponse {
  baseline_logistic_regression: ModelMetrics
  lightgbm: ModelMetrics
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-[var(--text-primary)]">{value}</div>
    </div>
  )
}

function ConfusionMatrix({ matrix }: { matrix: [[number, number], [number, number]] }) {
  const [[tn, fp], [fn, tp]] = matrix
  const total = tn + fp + fn + tp
  const cellStyle = (count: number, isCorrect: boolean) => {
    const intensity = 0.12 + Math.min(0.75, count / total) * 0.7
    const rgb = isCorrect ? 'var(--status-good)' : 'var(--status-critical)'
    return { background: `color-mix(in srgb, ${rgb} ${intensity * 100}%, var(--surface))` }
  }

  return (
    <div className="grid w-fit grid-cols-[auto_1fr_1fr] gap-1.5 text-center text-sm">
      <div />
      <div className="px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">Predicted: No Default</div>
      <div className="px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">Predicted: Default</div>

      <div className="flex items-center px-2 text-xs font-semibold text-[var(--text-secondary)]">Actual: No Default</div>
      <div className="rounded-lg p-4 font-medium text-[var(--text-primary)]" style={cellStyle(tn, true)}>TN: {tn.toLocaleString()}</div>
      <div className="rounded-lg p-4 font-medium text-[var(--text-primary)]" style={cellStyle(fp, false)}>FP: {fp.toLocaleString()}</div>

      <div className="flex items-center px-2 text-xs font-semibold text-[var(--text-secondary)]">Actual: Default</div>
      <div className="rounded-lg p-4 font-medium text-[var(--text-primary)]" style={cellStyle(fn, false)}>FN: {fn.toLocaleString()}</div>
      <div className="rounded-lg p-4 font-medium text-[var(--text-primary)]" style={cellStyle(tp, true)}>TP: {tp.toLocaleString()}</div>
    </div>
  )
}

function ModelSection({ title, metrics }: { title: string; metrics: ModelMetrics }) {
  const rocData = metrics.roc_curve
    ? metrics.roc_curve.fpr.map((fpr, i) => ({ fpr, tpr: metrics.roc_curve!.tpr[i], diagonal: fpr }))
    : []

  return (
    <section className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <h2 className="mb-5 text-base font-semibold text-[var(--text-primary)]">{title}</h2>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="AUC-ROC" value={metrics.auc_roc.toFixed(4)} />
        <StatTile label="Precision" value={metrics.precision.toFixed(4)} />
        <StatTile label="Recall" value={metrics.recall.toFixed(4)} />
        <StatTile label="F1" value={metrics.f1.toFixed(4)} />
      </div>

      {rocData.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-[var(--text-secondary)]">ROC Curve</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocData} margin={{ left: 10, right: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="fpr"
                  type="number"
                  domain={[0, 1]}
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                  stroke="var(--border-strong)"
                  label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5, fill: 'var(--text-muted)', fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  domain={[0, 1]}
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                  stroke="var(--border-strong)"
                  label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => Number(value).toFixed(3)}
                  contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Line type="monotone" dataKey="tpr" stroke="var(--brand)" dot={false} strokeWidth={2} name="ROC" />
                <Line type="monotone" dataKey="diagonal" stroke="var(--border-strong)" strokeDasharray="4 4" dot={false} name="Random baseline" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {metrics.confusion_matrix && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-[var(--text-secondary)]">Confusion Matrix</h3>
          <ConfusionMatrix matrix={metrics.confusion_matrix} />
        </div>
      )}
    </section>
  )
}

export default function Metrics() {
  const [data, setData] = useState<MetricsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiClient
      .get<MetricsResponse>('/model-metrics')
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load metrics'))
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Model Metrics</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Evaluation results for the primary and baseline models on the held-out test set.
        </p>
      </div>

      {error && <p className="text-sm font-medium text-[var(--status-critical)]">{error}</p>}
      {!data && !error && <p className="text-sm text-[var(--text-muted)]">Loading...</p>}

      {data && (
        <>
          <ModelSection title="Primary Model — LightGBM" metrics={data.lightgbm} />
          <ModelSection title="Baseline — Logistic Regression" metrics={data.baseline_logistic_regression} />
        </>
      )}
    </div>
  )
}
