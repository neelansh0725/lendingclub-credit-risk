"""
Scratch script mirroring notebooks/eda_and_modeling.ipynb sections 1-5 (T7-T18).
Run once to validate the pipeline end-to-end; output gets folded back into the
notebook cells, and the finalized logic gets extracted into model/preprocess.py (T19).
"""
import pandas as pd
import numpy as np

RAW_PATH = "data/raw/accepted_2007_to_2018Q4.csv"
PROCESSED_PATH = "data/processed/cleaned_engineered.parquet"

# Columns only populated after a loan resolves — using these would leak the
# outcome directly into the model, so they're excluded before anything else.
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

# ---------------------------------------------------------------------------
# T7: Load raw data, log shape/dtypes (FR-1)
# ---------------------------------------------------------------------------
print("=" * 70)
print("T7: Load raw CSV")
df = pd.read_csv(RAW_PATH, low_memory=False)
print("Raw shape:", df.shape)
print("Dtype counts:\n", df.dtypes.value_counts())

# ---------------------------------------------------------------------------
# T8: Filter to fully-resolved loans only (FR-2)
# ---------------------------------------------------------------------------
print("=" * 70)
print("T8: Filter to Fully Paid / Charged Off")
print("loan_status value counts before filter:\n", df["loan_status"].value_counts())
df = df[df["loan_status"].isin(["Fully Paid", "Charged Off"])].copy()
print("Shape after filter:", df.shape)

# ---------------------------------------------------------------------------
# T9: Binarize target (FR-3)
# ---------------------------------------------------------------------------
print("=" * 70)
print("T9: Binarize target")
df["target"] = (df["loan_status"] == "Charged Off").astype(int)
print("Class balance:\n", df["target"].value_counts(normalize=True))
df = df.drop(columns=["loan_status"])

# ---------------------------------------------------------------------------
# T10: Drop leakage cols + columns with >50% nulls (FR-4)
# ---------------------------------------------------------------------------
print("=" * 70)
print("T10: Drop leakage columns and >50% null columns")
existing_leakage = [c for c in LEAKAGE_COLS if c in df.columns]
df = df.drop(columns=existing_leakage)
print(f"Dropped {len(existing_leakage)} leakage/identifier columns")

null_pct = df.isnull().mean()
high_null_cols = null_pct[null_pct > 0.5].index.tolist()
df = df.drop(columns=high_null_cols)
print(f"Dropped {len(high_null_cols)} columns with >50% nulls:")
print(high_null_cols)
print("Shape after drops:", df.shape)

# ---------------------------------------------------------------------------
# T11: Impute remaining missing values (FR-4)
# ---------------------------------------------------------------------------
print("=" * 70)
print("T11: Impute remaining missing values")
remaining_nulls = df.isnull().sum()
remaining_nulls = remaining_nulls[remaining_nulls > 0]
print(f"{len(remaining_nulls)} columns still have nulls before imputation")

num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
num_cols = [c for c in num_cols if c != "target"]
cat_cols = df.select_dtypes(include=["object"]).columns.tolist()

for c in num_cols:
    if df[c].isnull().any():
        df[c] = df[c].fillna(df[c].median())
for c in cat_cols:
    if df[c].isnull().any():
        df[c] = df[c].fillna("Unknown")

print("Nulls remaining after imputation:", df.isnull().sum().sum())

# ---------------------------------------------------------------------------
# T12-T16: Feature engineering (FR-5)
# ---------------------------------------------------------------------------
print("=" * 70)
print("T12-16: Feature engineering")

# T12: DTI — LendingClub already reports this at origination; keep as-is.
print("DTI (dti) summary:\n", df["dti"].describe())

# T13: Credit utilization — raw revol_util field, already a %.
print("Credit utilization (revol_util) summary:\n", df["revol_util"].describe())

# T14: Revolving balance — raw revol_bal field.
print("Revolving balance (revol_bal) summary:\n", df["revol_bal"].describe())

# T15: Loan-to-income ratio (engineered)
# annual_inc below $1,000 is a data-entry error for a loan applicant, not a real
# income; treat as missing and impute before dividing, then winsorize the tail
# (a few remaining near-zero incomes otherwise blow the ratio up to 5 figures).
income = df["annual_inc"].where(df["annual_inc"] >= 1000, np.nan)
income = income.fillna(income.median())
df["loan_to_income"] = df["loan_amnt"] / income
cap = df["loan_to_income"].quantile(0.995)
df["loan_to_income"] = df["loan_to_income"].clip(upper=cap)
print("loan_to_income summary:\n", df["loan_to_income"].describe())

# T16: Credit history length in months (engineered from issue_d - earliest_cr_line)
df["issue_d_parsed"] = pd.to_datetime(df["issue_d"], format="%b-%Y", errors="coerce")
df["earliest_cr_line_parsed"] = pd.to_datetime(df["earliest_cr_line"], format="%b-%Y", errors="coerce")
df["credit_history_months"] = (
    (df["issue_d_parsed"] - df["earliest_cr_line_parsed"]).dt.days / 30.44
)
df["credit_history_months"] = df["credit_history_months"].fillna(df["credit_history_months"].median())
print("credit_history_months summary:\n", df["credit_history_months"].describe())

df = df.drop(columns=["issue_d", "earliest_cr_line", "issue_d_parsed", "earliest_cr_line_parsed"])

# ---------------------------------------------------------------------------
# T17: Encode categorical fields (FR-6)
# ---------------------------------------------------------------------------
print("=" * 70)
print("T17: Encode categorical fields")

grade_order = {g: i for i, g in enumerate(sorted(df["grade"].unique()))}
df["grade_encoded"] = df["grade"].map(grade_order)

emp_length_order = {
    "< 1 year": 0, "1 year": 1, "2 years": 2, "3 years": 3, "4 years": 4,
    "5 years": 5, "6 years": 6, "7 years": 7, "8 years": 8, "9 years": 9,
    "10+ years": 10, "Unknown": -1,
}
df["emp_length_encoded"] = df["emp_length"].map(emp_length_order).fillna(-1)

onehot_cols = ["purpose", "home_ownership", "verification_status", "sub_grade", "term", "initial_list_status", "addr_state", "disbursement_method"]
onehot_cols = [c for c in onehot_cols if c in df.columns]
df = pd.get_dummies(df, columns=onehot_cols, prefix=onehot_cols)
df = df.drop(columns=["grade", "emp_length"])

print("Shape after encoding:", df.shape)
print("Any remaining object dtype columns:", df.select_dtypes(include=["object"]).columns.tolist())

# ---------------------------------------------------------------------------
# T18: Save cleaned/engineered dataset
# ---------------------------------------------------------------------------
print("=" * 70)
print("T18: Save processed dataset")
df.to_parquet(PROCESSED_PATH, index=False)
print(f"Saved to {PROCESSED_PATH}, final shape: {df.shape}")
