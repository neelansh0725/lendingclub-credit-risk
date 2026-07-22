import { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { apiClient } from '../api/client'
import { downloadCsv } from '../utils/csv'

interface BatchResultRow {
  loan_amnt: number
  grade: string
  sub_grade: string
  purpose: string
  annual_inc: number
  dti: number
  probability: number
  risk_tier: 'Low' | 'Medium' | 'High'
  [key: string]: unknown
}

type SortKey = 'probability' | 'risk_tier' | 'loan_amnt' | 'annual_inc' | 'dti'
type SortDir = 'asc' | 'desc'

const RISK_TIER_ORDER = { Low: 0, Medium: 1, High: 2 }

const RISK_TIER_STYLES: Record<string, string> = {
  Low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  High: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

const DISPLAY_COLUMNS: { key: keyof BatchResultRow; label: string; sortable?: SortKey }[] = [
  { key: 'loan_amnt', label: 'Loan Amount', sortable: 'loan_amnt' },
  { key: 'grade', label: 'Grade' },
  { key: 'sub_grade', label: 'Sub-grade' },
  { key: 'purpose', label: 'Purpose' },
  { key: 'annual_inc', label: 'Annual Income', sortable: 'annual_inc' },
  { key: 'dti', label: 'DTI', sortable: 'dti' },
  { key: 'probability', label: 'Probability', sortable: 'probability' },
  { key: 'risk_tier', label: 'Risk Tier', sortable: 'risk_tier' },
]

export default function BatchUpload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<BatchResultRow[] | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('probability')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [tierFilter, setTierFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setResults(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await apiClient.post<BatchResultRow[]>('/batch-predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch prediction failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  })

  const filteredSorted = useMemo(() => {
    if (!results) return []
    const filtered = tierFilter === 'All' ? results : results.filter((r) => r.risk_tier === tierFilter)
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'risk_tier') {
        cmp = RISK_TIER_ORDER[a.risk_tier] - RISK_TIER_ORDER[b.risk_tier]
      } else {
        cmp = (a[sortKey] as number) - (b[sortKey] as number)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [results, sortKey, sortDir, tierFilter])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Batch Upload</h1>

      <div
        {...getRootProps()}
        className={`cursor-pointer rounded border-2 border-dashed p-10 text-center transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-300 dark:border-gray-600'
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the CSV file here...</p>
        ) : (
          <p>Drag and drop a CSV file here, or click to select one</p>
        )}
      </div>

      {loading && <p className="mt-4 text-blue-600 dark:text-blue-400">Scoring batch...</p>}
      {error && <p className="mt-4 text-red-600 dark:text-red-400">{error}</p>}

      {results && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Filter by risk tier:</label>
              <select
                className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value as typeof tierFilter)}
              >
                <option value="All">All ({results.length})</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <button
              onClick={() => downloadCsv('batch_results.csv', filteredSorted)}
              className="rounded bg-gray-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {DISPLAY_COLUMNS.map((col) => (
                    <th
                      key={String(col.key)}
                      className={`px-3 py-2 text-left font-medium ${col.sortable ? 'cursor-pointer select-none' : ''}`}
                      onClick={col.sortable ? () => handleSort(col.sortable!) : undefined}
                    >
                      {col.label}
                      {col.sortable === sortKey && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSorted.map((row, idx) => (
                  <tr key={idx} className="border-t border-gray-100 dark:border-gray-800">
                    {DISPLAY_COLUMNS.map((col) => (
                      <td key={String(col.key)} className="px-3 py-2">
                        {col.key === 'risk_tier' ? (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${RISK_TIER_STYLES[row.risk_tier]}`}>
                            {row.risk_tier}
                          </span>
                        ) : col.key === 'probability' ? (
                          `${(row.probability * 100).toFixed(1)}%`
                        ) : (
                          String(row[col.key] ?? '')
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
