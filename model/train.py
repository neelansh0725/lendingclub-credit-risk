"""
Training script for the LendingClub credit risk model.
Run from the project root: python model/train.py

Pipeline: raw CSV -> preprocess.preprocess_training_data -> stratified split ->
SMOTE (train only) -> baseline Logistic Regression (comparison only) ->
primary LightGBM (persisted) -> evaluate both on the untouched test set ->
SHAP sanity check -> persist model + preprocessing artifacts + metrics.
"""
import json
import time

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
import shap
from imblearn.over_sampling import SMOTE
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score, roc_curve
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from preprocess import preprocess_training_data

RAW_PATH = "data/raw/accepted_2007_to_2018Q4.csv"
MODEL_PATH = "model/model.joblib"
METRICS_PATH = "model/metrics.json"

LGBM_PARAMS = dict(n_estimators=500, learning_rate=0.05, num_leaves=63, random_state=42, n_jobs=-1, verbose=-1)


def main():
    print("Preprocessing raw data...")
    df, preprocess_artifacts = preprocess_training_data(RAW_PATH)

    X = df.drop(columns=["target"])
    y = df["target"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    print(f"Train shape: {X_train.shape}, Test shape: {X_test.shape}")

    print("Applying SMOTE to training set...")
    X_train_res, y_train_res = SMOTE(random_state=42).fit_resample(X_train, y_train)
    print(f"Balanced train shape: {X_train_res.shape}")

    metrics = {}

    print("Training baseline Logistic Regression...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_res)
    X_test_scaled = scaler.transform(X_test)
    lr = LogisticRegression(max_iter=1000, random_state=42)
    lr.fit(X_train_scaled, y_train_res)
    lr_proba = lr.predict_proba(X_test_scaled)[:, 1]
    lr_pred = (lr_proba >= 0.5).astype(int)
    metrics["baseline_logistic_regression"] = {
        "auc_roc": roc_auc_score(y_test, lr_proba),
        "precision": precision_score(y_test, lr_pred),
        "recall": recall_score(y_test, lr_pred),
        "f1": f1_score(y_test, lr_pred),
    }
    print("Baseline metrics:", metrics["baseline_logistic_regression"])

    print("Training primary LightGBM model...")
    start = time.time()
    gbm = lgb.LGBMClassifier(**LGBM_PARAMS)
    gbm.fit(X_train_res, y_train_res)
    print(f"LightGBM trained in {time.time() - start:.1f}s")

    gbm_proba = gbm.predict_proba(X_test)[:, 1]
    gbm_pred = (gbm_proba >= 0.5).astype(int)

    # Downsample the ROC curve to ~100 points for the metrics dashboard (FR-20 /
    # tech stack doc explicitly call for an AUC-ROC curve, not just the scalar).
    fpr, tpr, _ = roc_curve(y_test, gbm_proba)
    curve_idx = np.linspace(0, len(fpr) - 1, min(100, len(fpr))).astype(int)

    metrics["lightgbm"] = {
        "auc_roc": roc_auc_score(y_test, gbm_proba),
        "precision": precision_score(y_test, gbm_pred),
        "recall": recall_score(y_test, gbm_pred),
        "f1": f1_score(y_test, gbm_pred),
        "confusion_matrix": confusion_matrix(y_test, gbm_pred).tolist(),
        "roc_curve": {"fpr": fpr[curve_idx].tolist(), "tpr": tpr[curve_idx].tolist()},
    }
    print("LightGBM metrics (excl. roc_curve):", {k: v for k, v in metrics["lightgbm"].items() if k != "roc_curve"})

    auc = metrics["lightgbm"]["auc_roc"]
    print(f"AUC-ROC target (>= 0.70): {'PASS' if auc >= 0.70 else 'FAIL'} ({auc:.4f})")

    print("Sanity-checking SHAP on a test sample...")
    sample = X_test.sample(min(2000, len(X_test)), random_state=42)
    explainer = shap.TreeExplainer(gbm)
    shap_values = explainer.shap_values(sample)
    sv = shap_values[1] if isinstance(shap_values, list) else shap_values
    top_features = pd.Series(np.abs(sv).mean(axis=0), index=sample.columns).sort_values(ascending=False).head(10)
    print("Top 10 SHAP features:\n", top_features)

    print(f"Persisting model + preprocessing artifacts to {MODEL_PATH}...")
    joblib.dump({
        "model": gbm,
        "feature_columns": list(X_train.columns),
        "preprocess_artifacts": preprocess_artifacts,
    }, MODEL_PATH)

    print(f"Saving metrics to {METRICS_PATH}...")
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    print("Done.")


if __name__ == "__main__":
    main()
