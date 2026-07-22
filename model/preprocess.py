"""
Shared cleaning/feature-engineering logic for the LendingClub credit risk model.
Used by model/train.py (fits on the full training set) and, later, the API's
predict.py (applies the same fitted artifacts to a single new applicant).
"""
import pandas as pd
import numpy as np

RESOLVED_STATUSES = ["Fully Paid", "Charged Off"]

# Columns only populated after a loan resolves, or pure identifiers — using
# these would leak the outcome directly into the model.
LEAKAGE_COLS = [
    "funded_amnt", "funded_amnt_inv", "out_prncp", "out_prncp_inv",
    "total_pymnt", "total_pymnt_inv", "total_rec_prncp", "total_rec_int",
    "total_rec_late_fee", "recoveries", "collection_recovery_fee",
    "last_pymnt_d", "last_pymnt_amnt", "next_pymnt_d", "last_credit_pull_d",
    "last_fico_range_high", "last_fico_range_low",
    "hardship_flag", "hardship_type", "hardship_reason", "hardship_status",
    "deferral_term", "hardship_amount", "hardship_start_date", "hardship_end_date",
    "payment_plan_start_date", "hardship_length", "hardship_dpd",
    "hardship_loan_status", "orig_projected_additional_accrued_interest",
    "hardship_payoff_balance_amount", "hardship_last_payment_amount",
    "debt_settlement_flag", "debt_settlement_flag_date", "settlement_status",
    "settlement_date", "settlement_amount", "settlement_percentage", "settlement_term",
    "collections_12_mths_ex_med", "chargeoff_within_12_mths",
    "policy_code", "url", "desc", "member_id", "id", "emp_title", "title", "zip_code",
    "pymnt_plan", "application_type",
]

EMP_LENGTH_ORDER = {
    "< 1 year": 0, "1 year": 1, "2 years": 2, "3 years": 3, "4 years": 4,
    "5 years": 5, "6 years": 6, "7 years": 7, "8 years": 8, "9 years": 9,
    "10+ years": 10, "Unknown": -1,
}

ONEHOT_COLS = [
    "purpose", "home_ownership", "verification_status", "sub_grade",
    "term", "initial_list_status", "addr_state", "disbursement_method",
]


def load_raw(raw_path: str) -> pd.DataFrame:
    """FR-1"""
    return pd.read_csv(raw_path, low_memory=False)


def filter_and_binarize_target(df: pd.DataFrame) -> pd.DataFrame:
    """FR-2, FR-3. Training-time only — a single applicant at inference has no loan_status."""
    df = df[df["loan_status"].isin(RESOLVED_STATUSES)].copy()
    df["target"] = (df["loan_status"] == "Charged Off").astype(int)
    return df.drop(columns=["loan_status"])


def drop_leakage_and_high_null_columns(df: pd.DataFrame, null_threshold: float = 0.5):
    """FR-4 (part 1). Returns (df, dropped_columns) — dropped_columns must be persisted
    so the same columns get dropped from a single applicant's payload at inference."""
    existing_leakage = [c for c in LEAKAGE_COLS if c in df.columns]
    df = df.drop(columns=existing_leakage)

    null_pct = df.isnull().mean()
    high_null_cols = null_pct[null_pct > null_threshold].index.tolist()
    df = df.drop(columns=high_null_cols)

    return df, existing_leakage + high_null_cols


def fit_impute_values(df: pd.DataFrame, exclude: tuple = ("target",)) -> dict:
    """FR-4 (part 2). Computes fill values from training data only."""
    fill_values = {}
    num_cols = [c for c in df.select_dtypes(include=[np.number]).columns if c not in exclude]
    cat_cols = df.select_dtypes(include=["object"]).columns.tolist()

    for c in num_cols:
        fill_values[c] = df[c].median()
    for c in cat_cols:
        fill_values[c] = "Unknown"

    return fill_values


def apply_impute(df: pd.DataFrame, fill_values: dict) -> pd.DataFrame:
    df = df.copy()
    for c, val in fill_values.items():
        if c in df.columns:
            df[c] = df[c].fillna(val)
    return df


def engineer_features(
    df: pd.DataFrame,
    income_floor: float = 1000.0,
    loan_to_income_cap: float = None,
    income_median: float = None,
    credit_history_median: float = None,
):
    """FR-5: DTI and credit utilization and revolving balance are kept as-is from
    the raw LendingClub fields (dti, revol_util, revol_bal) — LendingClub already
    reports them at origination. loan_to_income and credit_history_months are
    derived here.

    At training time, call with income_median/credit_history_median=None so they're
    fit from the training data. At inference time on a single row, the median of
    one value is undefined if that value is itself missing, so the caller MUST
    pass the training-fit medians (persisted in preprocess_training_data's
    artifacts) — otherwise a missing field on a lone applicant silently stays NaN.

    Returns (df, loan_to_income_cap, income_median, credit_history_median) — all
    three must be persisted so a single applicant gets the same treatment.
    """
    df = df.copy()

    # annual_inc below income_floor is a data-entry error, not a real income;
    # treat as missing and impute before dividing, or the ratio blows up.
    income = df["annual_inc"].where(df["annual_inc"] >= income_floor, np.nan)
    if income_median is None:
        income_median = income.median()
    income = income.fillna(income_median)
    df["loan_to_income"] = df["loan_amnt"] / income

    if loan_to_income_cap is None:
        loan_to_income_cap = df["loan_to_income"].quantile(0.995)
    df["loan_to_income"] = df["loan_to_income"].clip(upper=loan_to_income_cap)

    df["issue_d_parsed"] = pd.to_datetime(df["issue_d"], format="%b-%Y", errors="coerce")
    df["earliest_cr_line_parsed"] = pd.to_datetime(df["earliest_cr_line"], format="%b-%Y", errors="coerce")
    df["credit_history_months"] = (
        (df["issue_d_parsed"] - df["earliest_cr_line_parsed"]).dt.days / 30.44
    )
    if credit_history_median is None:
        credit_history_median = df["credit_history_months"].median()
    df["credit_history_months"] = df["credit_history_months"].fillna(credit_history_median)

    df = df.drop(columns=["issue_d", "earliest_cr_line", "issue_d_parsed", "earliest_cr_line_parsed"])

    return df, loan_to_income_cap, income_median, credit_history_median


def fit_encode_categoricals(df: pd.DataFrame):
    """FR-6. Fits encodings on training data. Returns (df, schema) where schema
    captures everything needed to encode a single applicant identically at
    inference: grade order, the final one-hot column list, and column order."""
    df = df.copy()

    grade_order = {g: i for i, g in enumerate(sorted(df["grade"].unique()))}
    df["grade_encoded"] = df["grade"].map(grade_order)
    df["emp_length_encoded"] = df["emp_length"].map(EMP_LENGTH_ORDER).fillna(-1)

    onehot_cols = [c for c in ONEHOT_COLS if c in df.columns]
    df = pd.get_dummies(df, columns=onehot_cols, prefix=onehot_cols)
    df = df.drop(columns=["grade", "emp_length"])

    schema = {
        "grade_order": grade_order,
        "onehot_cols": onehot_cols,
        "final_columns": [c for c in df.columns if c != "target"],
    }
    return df, schema


def apply_encode_categoricals(df: pd.DataFrame, schema: dict) -> pd.DataFrame:
    """Encodes a new applicant row using a schema fitted on training data,
    aligning one-hot columns exactly (missing categories -> 0, unseen -> dropped)."""
    df = df.copy()
    df["grade_encoded"] = df["grade"].map(schema["grade_order"])
    df["emp_length_encoded"] = df["emp_length"].map(EMP_LENGTH_ORDER).fillna(-1)

    df = pd.get_dummies(df, columns=[c for c in schema["onehot_cols"] if c in df.columns], prefix=schema["onehot_cols"])
    df = df.drop(columns=["grade", "emp_length"], errors="ignore")

    return df.reindex(columns=schema["final_columns"], fill_value=0)


def preprocess_training_data(raw_path: str):
    """Top-level orchestration for train.py. Returns (df, artifacts) where
    artifacts is everything predict.py needs to preprocess a single applicant
    identically: dropped_columns, fill_values, loan_to_income_cap, encoding schema.
    """
    df = load_raw(raw_path)
    df = filter_and_binarize_target(df)
    df, dropped_columns = drop_leakage_and_high_null_columns(df)
    fill_values = fit_impute_values(df)
    df = apply_impute(df, fill_values)
    df, loan_to_income_cap, income_median, credit_history_median = engineer_features(df)
    df, encoding_schema = fit_encode_categoricals(df)

    artifacts = {
        "dropped_columns": dropped_columns,
        "fill_values": fill_values,
        "loan_to_income_cap": loan_to_income_cap,
        "income_median": income_median,
        "credit_history_median": credit_history_median,
        "encoding_schema": encoding_schema,
    }
    return df, artifacts
