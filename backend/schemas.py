from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class ApplicantInput(BaseModel):
    """Raw applicant/loan fields, matching exactly the columns that survive
    preprocess.py's null-column drop (see model/preprocess.py LEAKAGE_COLS and
    the >50%-null threshold) — this is the full input surface the model needs.
    """
    # Core loan terms
    loan_amnt: float
    term: str
    int_rate: float
    installment: float
    grade: str
    sub_grade: str
    emp_length: str
    home_ownership: str
    annual_inc: float
    verification_status: str
    issue_d: str
    purpose: str
    addr_state: str
    dti: float
    initial_list_status: str
    disbursement_method: str

    # Credit bureau attributes
    delinq_2yrs: float
    earliest_cr_line: str
    fico_range_low: float
    fico_range_high: float
    inq_last_6mths: float
    open_acc: float
    pub_rec: float
    revol_bal: float
    revol_util: float
    total_acc: float
    acc_now_delinq: float
    tot_coll_amt: float
    tot_cur_bal: float
    acc_open_past_24mths: float
    avg_cur_bal: float
    bc_open_to_buy: float
    bc_util: float
    delinq_amnt: float
    mo_sin_old_il_acct: float
    mo_sin_old_rev_tl_op: float
    mo_sin_rcnt_rev_tl_op: float
    mo_sin_rcnt_tl: float
    mort_acc: float
    mths_since_recent_bc: float
    mths_since_recent_inq: float
    num_accts_ever_120_pd: float
    num_actv_bc_tl: float
    num_actv_rev_tl: float
    num_bc_sats: float
    num_bc_tl: float
    num_il_tl: float
    num_op_rev_tl: float
    num_rev_accts: float
    num_rev_tl_bal_gt_0: float
    num_sats: float
    num_tl_120dpd_2m: float
    num_tl_30dpd: float
    num_tl_90g_dpd_24m: float
    num_tl_op_past_12m: float
    pct_tl_nvr_dlq: float
    percent_bc_gt_75: float
    pub_rec_bankruptcies: float
    tax_liens: float
    tot_hi_cred_lim: float
    total_bal_ex_mort: float
    total_bc_limit: float
    total_il_high_credit_limit: float
    total_rev_hi_lim: float

    class Config:
        json_schema_extra = {
            "example": {
                "loan_amnt": 15000, "term": " 36 months", "int_rate": 13.56,
                "installment": 509.5, "grade": "C", "sub_grade": "C3",
                "emp_length": "5 years", "home_ownership": "RENT",
                "annual_inc": 65000, "verification_status": "Verified",
                "issue_d": "Jan-2018", "purpose": "debt_consolidation",
                "addr_state": "CA", "dti": 18.5, "initial_list_status": "w",
                "disbursement_method": "Cash", "delinq_2yrs": 0,
                "earliest_cr_line": "Aug-2003", "fico_range_low": 690,
                "fico_range_high": 694, "inq_last_6mths": 1, "open_acc": 11,
                "pub_rec": 0, "revol_bal": 12500, "revol_util": 45.2,
                "total_acc": 24, "acc_now_delinq": 0, "tot_coll_amt": 0,
                "tot_cur_bal": 85000, "acc_open_past_24mths": 3,
                "avg_cur_bal": 7727, "bc_open_to_buy": 4200, "bc_util": 62.1,
                "delinq_amnt": 0, "mo_sin_old_il_acct": 120,
                "mo_sin_old_rev_tl_op": 180, "mo_sin_rcnt_rev_tl_op": 8,
                "mo_sin_rcnt_tl": 4, "mort_acc": 1, "mths_since_recent_bc": 10,
                "mths_since_recent_inq": 5, "num_accts_ever_120_pd": 0,
                "num_actv_bc_tl": 3, "num_actv_rev_tl": 5, "num_bc_sats": 4,
                "num_bc_tl": 6, "num_il_tl": 2, "num_op_rev_tl": 7,
                "num_rev_accts": 12, "num_rev_tl_bal_gt_0": 5, "num_sats": 11,
                "num_tl_120dpd_2m": 0, "num_tl_30dpd": 0, "num_tl_90g_dpd_24m": 0,
                "num_tl_op_past_12m": 2, "pct_tl_nvr_dlq": 95.5,
                "percent_bc_gt_75": 25.0, "pub_rec_bankruptcies": 0,
                "tax_liens": 0, "tot_hi_cred_lim": 150000,
                "total_bal_ex_mort": 30000, "total_bc_limit": 15000,
                "total_il_high_credit_limit": 20000, "total_rev_hi_lim": 25000,
            }
        }


class ShapFactor(BaseModel):
    feature: str
    shap_value: float


class PredictionResponse(BaseModel):
    probability: float
    risk_tier: str
    top_shap_factors: List[ShapFactor]


class RepaymentRequest(BaseModel):
    """FR-24: amount, date."""
    amount: float
    paid_at: Optional[datetime] = None


class CollateralResponse(BaseModel):
    """FR-27, FR-28: current status and remaining amount needed for release."""
    id: int
    type: str
    description: str
    estimated_value: float
    release_target_amount: float
    status: str
    released_at: Optional[datetime]
    remaining_amount: float
