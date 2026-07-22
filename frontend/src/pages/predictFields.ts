export type FieldConfig =
  | { key: string; label: string; type: 'number'; min?: number; step?: number }
  | { key: string; label: string; type: 'select'; options: string[] }
  | { key: string; label: string; type: 'date'; placeholder: string }

export const LOAN_FIELDS: FieldConfig[] = [
  { key: 'loan_amnt', label: 'Loan Amount ($)', type: 'number', min: 0, step: 100 },
  { key: 'term', label: 'Term', type: 'select', options: [' 36 months', ' 60 months'] },
  { key: 'int_rate', label: 'Interest Rate (%)', type: 'number', min: 0, step: 0.01 },
  { key: 'installment', label: 'Monthly Installment ($)', type: 'number', min: 0, step: 0.01 },
  { key: 'grade', label: 'Grade', type: 'select', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] },
  {
    key: 'sub_grade', label: 'Sub-grade', type: 'select',
    options: ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5', 'C1', 'C2', 'C3', 'C4', 'C5', 'D1', 'D2', 'D3', 'D4', 'D5', 'E1', 'E2', 'E3', 'E4', 'E5', 'F1', 'F2', 'F3', 'F4', 'F5', 'G1', 'G2', 'G3', 'G4', 'G5'],
  },
  {
    key: 'emp_length', label: 'Employment Length', type: 'select',
    options: ['< 1 year', '1 year', '2 years', '3 years', '4 years', '5 years', '6 years', '7 years', '8 years', '9 years', '10+ years'],
  },
  { key: 'home_ownership', label: 'Home Ownership', type: 'select', options: ['RENT', 'OWN', 'MORTGAGE', 'ANY'] },
  { key: 'annual_inc', label: 'Annual Income ($)', type: 'number', min: 0, step: 100 },
  { key: 'verification_status', label: 'Verification Status', type: 'select', options: ['Not Verified', 'Source Verified', 'Verified'] },
  { key: 'issue_d', label: 'Issue Date', type: 'date', placeholder: 'e.g. Jan-2018' },
  {
    key: 'purpose', label: 'Purpose', type: 'select',
    options: ['car', 'credit_card', 'debt_consolidation', 'home_improvement', 'house', 'major_purchase', 'medical', 'moving', 'other', 'renewable_energy', 'small_business', 'vacation', 'wedding'],
  },
  {
    key: 'addr_state', label: 'State', type: 'select',
    options: ['AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'VT', 'WA', 'WI', 'WV', 'WY'],
  },
  { key: 'dti', label: 'Debt-to-Income Ratio (%)', type: 'number', min: 0, step: 0.01 },
  { key: 'initial_list_status', label: 'Initial List Status', type: 'select', options: ['f', 'w'] },
  { key: 'disbursement_method', label: 'Disbursement Method', type: 'select', options: ['Cash', 'DirectPay'] },
]

export const BUREAU_FIELDS: FieldConfig[] = [
  { key: 'delinq_2yrs', label: 'Delinquencies (2yr)', type: 'number', min: 0, step: 1 },
  { key: 'earliest_cr_line', label: 'Earliest Credit Line', type: 'date', placeholder: 'e.g. Aug-2003' },
  { key: 'fico_range_low', label: 'FICO Range Low', type: 'number', min: 300, step: 1 },
  { key: 'fico_range_high', label: 'FICO Range High', type: 'number', min: 300, step: 1 },
  { key: 'inq_last_6mths', label: 'Inquiries (6mo)', type: 'number', min: 0, step: 1 },
  { key: 'open_acc', label: 'Open Accounts', type: 'number', min: 0, step: 1 },
  { key: 'pub_rec', label: 'Public Records', type: 'number', min: 0, step: 1 },
  { key: 'revol_bal', label: 'Revolving Balance ($)', type: 'number', min: 0, step: 1 },
  { key: 'revol_util', label: 'Revolving Utilization (%)', type: 'number', min: 0, step: 0.1 },
  { key: 'total_acc', label: 'Total Accounts', type: 'number', min: 0, step: 1 },
  { key: 'acc_now_delinq', label: 'Accounts Now Delinquent', type: 'number', min: 0, step: 1 },
  { key: 'tot_coll_amt', label: 'Total Collection Amount ($)', type: 'number', min: 0, step: 1 },
  { key: 'tot_cur_bal', label: 'Total Current Balance ($)', type: 'number', min: 0, step: 1 },
  { key: 'acc_open_past_24mths', label: 'Accounts Opened (24mo)', type: 'number', min: 0, step: 1 },
  { key: 'avg_cur_bal', label: 'Average Current Balance ($)', type: 'number', min: 0, step: 1 },
  { key: 'bc_open_to_buy', label: 'Bankcard Open-to-Buy ($)', type: 'number', min: 0, step: 1 },
  { key: 'bc_util', label: 'Bankcard Utilization (%)', type: 'number', min: 0, step: 0.1 },
  { key: 'delinq_amnt', label: 'Delinquent Amount ($)', type: 'number', min: 0, step: 1 },
  { key: 'mo_sin_old_il_acct', label: 'Months Since Oldest Installment Acct', type: 'number', min: 0, step: 1 },
  { key: 'mo_sin_old_rev_tl_op', label: 'Months Since Oldest Revolving Acct', type: 'number', min: 0, step: 1 },
  { key: 'mo_sin_rcnt_rev_tl_op', label: 'Months Since Recent Revolving Acct', type: 'number', min: 0, step: 1 },
  { key: 'mo_sin_rcnt_tl', label: 'Months Since Recent Account', type: 'number', min: 0, step: 1 },
  { key: 'mort_acc', label: 'Mortgage Accounts', type: 'number', min: 0, step: 1 },
  { key: 'mths_since_recent_bc', label: 'Months Since Recent Bankcard', type: 'number', min: 0, step: 1 },
  { key: 'mths_since_recent_inq', label: 'Months Since Recent Inquiry', type: 'number', min: 0, step: 1 },
  { key: 'num_accts_ever_120_pd', label: 'Accounts Ever 120+ Days Past Due', type: 'number', min: 0, step: 1 },
  { key: 'num_actv_bc_tl', label: 'Active Bankcard Accounts', type: 'number', min: 0, step: 1 },
  { key: 'num_actv_rev_tl', label: 'Active Revolving Accounts', type: 'number', min: 0, step: 1 },
  { key: 'num_bc_sats', label: 'Satisfactory Bankcard Accounts', type: 'number', min: 0, step: 1 },
  { key: 'num_bc_tl', label: 'Bankcard Accounts', type: 'number', min: 0, step: 1 },
  { key: 'num_il_tl', label: 'Installment Accounts', type: 'number', min: 0, step: 1 },
  { key: 'num_op_rev_tl', label: 'Open Revolving Accounts', type: 'number', min: 0, step: 1 },
  { key: 'num_rev_accts', label: 'Revolving Accounts', type: 'number', min: 0, step: 1 },
  { key: 'num_rev_tl_bal_gt_0', label: 'Revolving Accounts With Balance', type: 'number', min: 0, step: 1 },
  { key: 'num_sats', label: 'Satisfactory Accounts', type: 'number', min: 0, step: 1 },
  { key: 'num_tl_120dpd_2m', label: 'Accounts 120 Days Past Due (2mo)', type: 'number', min: 0, step: 1 },
  { key: 'num_tl_30dpd', label: 'Accounts 30 Days Past Due', type: 'number', min: 0, step: 1 },
  { key: 'num_tl_90g_dpd_24m', label: 'Accounts 90+ Days Past Due (24mo)', type: 'number', min: 0, step: 1 },
  { key: 'num_tl_op_past_12m', label: 'Accounts Opened (12mo)', type: 'number', min: 0, step: 1 },
  { key: 'pct_tl_nvr_dlq', label: 'Percent Accounts Never Delinquent', type: 'number', min: 0, step: 0.1 },
  { key: 'percent_bc_gt_75', label: 'Percent Bankcards > 75% Utilized', type: 'number', min: 0, step: 0.1 },
  { key: 'pub_rec_bankruptcies', label: 'Public Record Bankruptcies', type: 'number', min: 0, step: 1 },
  { key: 'tax_liens', label: 'Tax Liens', type: 'number', min: 0, step: 1 },
  { key: 'tot_hi_cred_lim', label: 'Total High Credit Limit ($)', type: 'number', min: 0, step: 1 },
  { key: 'total_bal_ex_mort', label: 'Total Balance (excl. Mortgage) ($)', type: 'number', min: 0, step: 1 },
  { key: 'total_bc_limit', label: 'Total Bankcard Limit ($)', type: 'number', min: 0, step: 1 },
  { key: 'total_il_high_credit_limit', label: 'Total Installment Credit Limit ($)', type: 'number', min: 0, step: 1 },
  { key: 'total_rev_hi_lim', label: 'Total Revolving High Limit ($)', type: 'number', min: 0, step: 1 },
]

export const ALL_FIELDS: FieldConfig[] = [...LOAN_FIELDS, ...BUREAU_FIELDS]

const DATE_PATTERN = /^[A-Z][a-z]{2}-\d{4}$/

export function validateField(field: FieldConfig, rawValue: string): string | null {
  if (rawValue.trim() === '') return 'Required'

  if (field.type === 'number') {
    const num = Number(rawValue)
    if (Number.isNaN(num)) return 'Must be a number'
    if (field.min !== undefined && num < field.min) return `Must be ≥ ${field.min}`
  }

  if (field.type === 'date' && !DATE_PATTERN.test(rawValue)) {
    return 'Format: Mon-YYYY (e.g. Jan-2018)'
  }

  return null
}
