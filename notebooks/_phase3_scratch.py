"""
Scratch script mirroring notebook sections 6-11 (T22-T28): baseline LR, primary
LightGBM, evaluation, SHAP. Trains on SMOTE-balanced data, evaluates on the
untouched original-distribution test set.
"""
import time
import json
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, precision_score, recall_score, f1_score, confusion_matrix
import lightgbm as lgb

train_df = pd.read_parquet("data/processed/train_smote.parquet")
test_df = pd.read_parquet("data/processed/test.parquet")

X_train, y_train = train_df.drop(columns=["target"]), train_df["target"]
X_test, y_test = test_df.drop(columns=["target"]), test_df["target"]

# Align column order defensively (parquet preserves it, but be explicit).
X_test = X_test[X_train.columns]

metrics = {}

# ---------------------------------------------------------------------------
# T22: Baseline Logistic Regression (FR-7)
# ---------------------------------------------------------------------------
print("=" * 70)
print("T22: Train baseline Logistic Regression")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

start = time.time()
lr = LogisticRegression(max_iter=1000, random_state=42)
lr.fit(X_train_scaled, y_train)
print(f"LR trained in {time.time() - start:.1f}s")

# ---------------------------------------------------------------------------
# T23: Evaluate baseline (FR-10)
# ---------------------------------------------------------------------------
print("=" * 70)
print("T23: Evaluate baseline Logistic Regression")
lr_proba = lr.predict_proba(X_test_scaled)[:, 1]
lr_pred = (lr_proba >= 0.5).astype(int)

lr_metrics = {
    "auc_roc": roc_auc_score(y_test, lr_proba),
    "precision": precision_score(y_test, lr_pred),
    "recall": recall_score(y_test, lr_pred),
    "f1": f1_score(y_test, lr_pred),
}
print("Baseline LR metrics:", lr_metrics)
metrics["baseline_logistic_regression"] = lr_metrics

# ---------------------------------------------------------------------------
# T24: Primary LightGBM model (FR-8)
# ---------------------------------------------------------------------------
print("=" * 70)
print("T24: Train primary LightGBM model")
start = time.time()
gbm = lgb.LGBMClassifier(
    n_estimators=500,
    learning_rate=0.05,
    num_leaves=63,
    random_state=42,
    n_jobs=-1,
    verbose=-1,
)
gbm.fit(X_train, y_train)
print(f"LightGBM trained in {time.time() - start:.1f}s")

# ---------------------------------------------------------------------------
# T25: Evaluate LightGBM (FR-10)
# ---------------------------------------------------------------------------
print("=" * 70)
print("T25: Evaluate LightGBM")
gbm_proba = gbm.predict_proba(X_test)[:, 1]
gbm_pred = (gbm_proba >= 0.5).astype(int)

cm = confusion_matrix(y_test, gbm_pred)
gbm_metrics = {
    "auc_roc": roc_auc_score(y_test, gbm_proba),
    "precision": precision_score(y_test, gbm_pred),
    "recall": recall_score(y_test, gbm_pred),
    "f1": f1_score(y_test, gbm_pred),
    "confusion_matrix": cm.tolist(),
}
print("LightGBM metrics:", gbm_metrics)
metrics["lightgbm"] = gbm_metrics

# ---------------------------------------------------------------------------
# T26: Confirm AUC-ROC >= 0.70 (Success Metrics, Section 7)
# ---------------------------------------------------------------------------
print("=" * 70)
print("T26: Check AUC-ROC target")
target_met = gbm_metrics["auc_roc"] >= 0.70
print(f"AUC-ROC = {gbm_metrics['auc_roc']:.4f}, target >= 0.70: {'PASS' if target_met else 'FAIL'}")

# ---------------------------------------------------------------------------
# T28: Save evaluation metrics artifact (feeds FR-15 /model-metrics)
# ---------------------------------------------------------------------------
print("=" * 70)
print("T28: Save metrics artifact")
with open("model/metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)
print("Saved model/metrics.json")
