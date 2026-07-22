import sys
from pathlib import Path

import joblib
import pandas as pd
import shap

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "model"))
from preprocess import apply_encode_categoricals, apply_impute, engineer_features

MODEL_PATH = Path(__file__).resolve().parent.parent / "model" / "model.joblib"

_bundle = joblib.load(MODEL_PATH)
_model = _bundle["model"]
_feature_columns = _bundle["feature_columns"]
_artifacts = _bundle["preprocess_artifacts"]
_explainer = shap.TreeExplainer(_model)

# PRD Section 6 risk tier thresholds
def _risk_tier(probability: float) -> str:
    if probability < 0.15:
        return "Low"
    if probability < 0.40:
        return "Medium"
    return "High"


def _preprocess_df(df: pd.DataFrame) -> pd.DataFrame:
    """FR-14 (part 1): shared preprocessing path for both a single applicant
    (wrapped in a 1-row DataFrame) and a batch CSV upload."""
    df = apply_impute(df, _artifacts["fill_values"])
    df, _, _, _ = engineer_features(
        df,
        loan_to_income_cap=_artifacts["loan_to_income_cap"],
        income_median=_artifacts["income_median"],
        credit_history_median=_artifacts["credit_history_median"],
    )
    df = apply_encode_categoricals(df, _artifacts["encoding_schema"])
    return df.reindex(columns=_feature_columns, fill_value=0)


def predict_single(applicant_dict: dict) -> dict:
    """FR-13: returns {probability, risk_tier, top_shap_factors} for one applicant."""
    X = _preprocess_df(pd.DataFrame([applicant_dict]))

    probability = float(_model.predict_proba(X)[0, 1])
    risk_tier = _risk_tier(probability)

    shap_values = _explainer.shap_values(X)
    sv = shap_values[1] if isinstance(shap_values, list) else shap_values
    row_shap = pd.Series(sv[0], index=X.columns).sort_values(key=abs, ascending=False)
    top_shap_factors = [
        {"feature": feat, "shap_value": float(val)}
        for feat, val in row_shap.head(5).items()
    ]

    return {
        "probability": probability,
        "risk_tier": risk_tier,
        "top_shap_factors": top_shap_factors,
    }


def predict_batch(raw_df: pd.DataFrame) -> pd.DataFrame:
    """FR-14 (part 2): scores every row in an uploaded CSV. Returns the original
    columns plus probability/risk_tier (no per-row SHAP — FR-19's batch results
    table only calls for sortable/filterable scores, not explanations)."""
    X = _preprocess_df(raw_df.copy())
    probabilities = _model.predict_proba(X)[:, 1]

    result = raw_df.copy()
    result["probability"] = probabilities
    result["risk_tier"] = [_risk_tier(p) for p in probabilities]
    # NaN isn't valid JSON (Starlette's encoder rejects it) — a batch CSV
    # legitimately has missing values in some raw columns, so convert to null.
    return result.astype(object).where(pd.notnull(result), None)
