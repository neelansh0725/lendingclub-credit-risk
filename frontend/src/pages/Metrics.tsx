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
    <div className="rounded border border-gray-200 p-4 dark:border-gray-700">
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}

function ConfusionMatrix({ matrix }: { matrix: [[number, number], [number, number]] }) {
  const [[tn, fp], [fn, tp]] = matrix
  const total = tn + fp + fn + tp
  const cellStyle = (count: number, isCorrect: boolean) => {
    const intensity = Math.round((count / total) * 100)
    const base = isCorrect ? '34,197,94' : '239,68,68'
    return { backgroundColor: `rgba(${base}, ${0.15 + intensity / 150})` }
  }

  return (
    <div className="grid w-fit grid-cols-[auto_1fr_1fr] gap-1 text-center text-sm">
      <div />
      <div className="px-2 py-1 font-medium">Predicted: No Default</div>
      <div className="px-2 py-1 font-medium">Predicted: Default</div>

      <div className="flex items-center px-2 font-medium">Actual: No Default</div>
      <div className="rounded p-4" style={cellStyle(tn, true)}>TN: {tn}</div>
      <div className="rounded p-4" style={cellStyle(fp, false)}>FP: {fp}</div>

      <div className="flex items-center px-2 font-medium">Actual: Default</div>
      <div className="rounded p-4" style={cellStyle(fn, false)}>FN: {fn}</div>
      <div className="rounded p-4" style={cellStyle(tp, true)}>TP: {tp}</div>
    </div>
  )
}

function ModelSection({ title, metrics }: { title: string; metrics: ModelMetrics }) {
  const rocData = metrics.roc_curve
    ? metrics.roc_curve.fpr.map((fpr, i) => ({ fpr, tpr: metrics.roc_curve!.tpr[i], diagonal: fpr }))
    : []

  return (
    <section className="mb-10">
      <h2 className="mb-3 text-xl font-medium">{title}</h2>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="AUC-ROC" value={metrics.auc_roc.toFixed(4)} />
        <StatTile label="Precision" value={metrics.precision.toFixed(4)} />
        <StatTile label="Recall" value={metrics.recall.toFixed(4)} />
        <StatTile label="F1" value={metrics.f1.toFixed(4)} />
      </div>

      {rocData.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 font-medium">ROC Curve</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocData} margin={{ left: 10, right: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fpr" type="number" domain={[0, 1]} label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5 }} />
                <YAxis type="number" domain={[0, 1]} label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => Number(value).toFixed(3)} />
                <Line type="monotone" dataKey="tpr" stroke="#2563eb" dot={false} strokeWidth={2} name="ROC" />
                <Line type="monotone" dataKey="diagonal" stroke="#9ca3af" strokeDasharray="4 4" dot={false} name="Random baseline" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {metrics.confusion_matrix && (
        <div>
          <h3 className="mb-2 font-medium">Confusion Matrix</h3>
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
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Model Metrics</h1>

      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
      {!data && !error && <p className="text-gray-500 dark:text-gray-400">Loading...</p>}

      {data && (
        <>
          <ModelSection title="Primary Model: LightGBM" metrics={data.lightgbm} />
          <ModelSection title="Baseline: Logistic Regression" metrics={data.baseline_logistic_regression} />
        </>
      )}
    </div>
  )
}
