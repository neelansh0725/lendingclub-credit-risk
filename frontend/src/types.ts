export interface ApplicantInput {
  loan_amnt: number
  term: string
  int_rate: number
  installment: number
  grade: string
  sub_grade: string
  emp_length: string
  home_ownership: string
  annual_inc: number
  verification_status: string
  issue_d: string
  purpose: string
  addr_state: string
  dti: number
  initial_list_status: string
  disbursement_method: string
  delinq_2yrs: number
  earliest_cr_line: string
  fico_range_low: number
  fico_range_high: number
  inq_last_6mths: number
  open_acc: number
  pub_rec: number
  revol_bal: number
  revol_util: number
  total_acc: number
  acc_now_delinq: number
  tot_coll_amt: number
  tot_cur_bal: number
  acc_open_past_24mths: number
  avg_cur_bal: number
  bc_open_to_buy: number
  bc_util: number
  delinq_amnt: number
  mo_sin_old_il_acct: number
  mo_sin_old_rev_tl_op: number
  mo_sin_rcnt_rev_tl_op: number
  mo_sin_rcnt_tl: number
  mort_acc: number
  mths_since_recent_bc: number
  mths_since_recent_inq: number
  num_accts_ever_120_pd: number
  num_actv_bc_tl: number
  num_actv_rev_tl: number
  num_bc_sats: number
  num_bc_tl: number
  num_il_tl: number
  num_op_rev_tl: number
  num_rev_accts: number
  num_rev_tl_bal_gt_0: number
  num_sats: number
  num_tl_120dpd_2m: number
  num_tl_30dpd: number
  num_tl_90g_dpd_24m: number
  num_tl_op_past_12m: number
  pct_tl_nvr_dlq: number
  percent_bc_gt_75: number
  pub_rec_bankruptcies: number
  tax_liens: number
  tot_hi_cred_lim: number
  total_bal_ex_mort: number
  total_bc_limit: number
  total_il_high_credit_limit: number
  total_rev_hi_lim: number
}

export interface ShapFactor {
  feature: string
  shap_value: number
}

export interface PredictionResponse {
  probability: number
  risk_tier: 'Low' | 'Medium' | 'High'
  top_shap_factors: ShapFactor[]
}
