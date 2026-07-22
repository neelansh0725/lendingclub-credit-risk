import { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { apiClient } from '../api/client'
import RiskTierBadge from '../components/RiskTierBadge'
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

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 16V4M12 4L7 9M12 4L17 9M5 20H19"
        stroke="var(--brand)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

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
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Batch Upload</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Score a CSV of applicants at once — sort, filter, and export the results.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
          isDragActive
            ? 'border-[var(--brand)] bg-[var(--brand-tint)]'
            : 'border-[var(--border-strong)] bg-[var(--surface)] hover:border-[var(--brand)]'
        }`}
      >
        <input {...getInputProps()} />
        <UploadIcon />
        {isDragActive ? (
          <p className="font-medium text-[var(--text-primary)]">Drop the CSV file here...</p>
        ) : (
          <div>
            <p className="font-medium text-[var(--text-primary)]">Drag and drop a CSV file here</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">or click to select one</p>
          </div>
        )}
      </div>

      {loading && (
        <p className="mt-4 flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--brand)' }}>
          <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: 'var(--brand)' }} />
          Scoring batch...
        </p>
      )}
      {error && <p className="mt-4 text-sm font-medium text-[var(--status-critical)]">{error}</p>}

      {results && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Filter by risk tier:</label>
              <select
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
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
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-sm font-medium text-[var(--text-primary)] shadow-sm hover:bg-[var(--brand-tint)]"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--border)] shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]" style={{ background: 'var(--surface-raised)' }}>
                  {DISPLAY_COLUMNS.map((col) => (
                    <th
                      key={String(col.key)}
                      className={`px-4 py-3 text-left text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase ${col.sortable ? 'cursor-pointer select-none hover:text-[var(--brand)]' : ''}`}
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
                  <tr
                    key={idx}
                    className="border-t border-[var(--border)] bg-[var(--surface)] transition-colors hover:bg-[var(--brand-tint)]/40"
                  >
                    {DISPLAY_COLUMNS.map((col) => (
                      <td key={String(col.key)} className="px-4 py-2.5 text-[var(--text-primary)]">
                        {col.key === 'risk_tier' ? (
                          <RiskTierBadge tier={row.risk_tier} size="sm" />
                        ) : col.key === 'probability' ? (
                          <span className="tabular-nums">{(row.probability * 100).toFixed(1)}%</span>
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
