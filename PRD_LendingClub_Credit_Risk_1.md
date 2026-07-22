# Product Requirements Document
## LendingClub Credit Risk Prediction System

**Author:** Neelansh Singh
**Version:** 1.1
**Status:** Draft

---

## 1. Overview

### 1.1 Problem Statement
Lenders need to assess the probability that a loan applicant will default before approving credit. Manual or purely rules-based underwriting is slow, inconsistent, and doesn't scale. This project builds a data-driven credit risk scoring system trained on real-world lending data (LendingClub), exposed through an API and a usable dashboard, with explainability built in so risk drivers are transparent to a human reviewer.

### 1.2 Goals
- Predict probability of loan default from applicant/loan attributes
- Surface *why* a prediction was made (explainability), not just a score
- Support both single-applicant lookups and batch scoring (CSV upload)
- Support secured loans where applicants pledge collateral(s), with each collateral automatically released once a linked repayment target is met
- Ship as a working, deployed, demonstrable full-stack application

### 1.3 Non-Goals
- Not a production-grade underwriting system; no real regulatory compliance certification
- Not handling live/streaming loan applications — batch and on-demand only
- No user authentication/multi-tenant system in v1 (single-user demo tool)

### 1.4 Target Audience
- Primary: this is a portfolio project demonstrating applied ML + full-stack skills for fintech/banking roles
- Secondary framing: a loan officer or risk analyst persona who uploads applicant data and reviews risk scores

---

## 2. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|---------------|------------|
| US-1 | Risk analyst | Enter a single applicant's details | I get an instant default probability + risk tier |
| US-2 | Risk analyst | Upload a CSV of multiple applicants | I can score a batch of loans at once |
| US-3 | Risk analyst | See which factors drove a risk score | I can explain the decision to a stakeholder |
| US-4 | Risk analyst | Filter/sort batch results by risk tier | I can prioritize which applications to review first |
| US-5 | Reviewer (recruiter) | View model performance metrics | I can trust the model isn't just guessing the majority class |
| US-6 | Loan applicant | Pledge one or more collaterals when applying for a secured loan | I can secure a lower risk tier / better terms |
| US-7 | Loan applicant | Assign a repayment target to each collateral | That specific asset gets released back to me once I've paid enough |
| US-8 | Risk analyst | Record repayments against a loan | The system can automatically evaluate which collaterals now qualify for release |
| US-9 | Risk analyst | See the release status of every collateral tied to a loan | I know what's still held and what's already been returned |
| US-10 | Loan applicant | View my collateral release progress | I know how much more I need to repay before each item is released |

---

## 3. Functional Requirements

### 3.1 Data Pipeline
- FR-1: Ingest LendingClub historical loan data (CSV)
- FR-2: Filter to fully-resolved loans only (`Fully Paid`, `Charged Off`); drop `Current`, `Late`, `In Grace Period`
- FR-3: Binarize target: `Charged Off`/`Default` → 1, `Fully Paid` → 0
- FR-4: Clean missing values (drop columns with >50% nulls; impute remainder)
- FR-5: Engineer features: DTI, credit utilization, revolving balance, loan-to-income ratio, credit history length
- FR-6: Encode categorical fields (`grade`, `purpose`, `home_ownership`, `emp_length`, `verification_status`)

### 3.2 Model
- FR-7: Train baseline Logistic Regression model
- FR-8: Train primary LightGBM (or XGBoost) model
- FR-9: Handle class imbalance (SMOTE or class-weighting)
- FR-10: Evaluate using AUC-ROC, Precision, Recall, F1 (not accuracy alone)
- FR-11: Generate SHAP values for per-prediction explainability
- FR-12: Persist trained model artifact (pickle/joblib) for API loading

### 3.3 API
- FR-13: `POST /predict` — single applicant JSON in, returns `{probability, risk_tier, top_shap_factors}`
- FR-14: `POST /batch-predict` — CSV upload in, returns scored results (JSON or downloadable CSV)
- FR-15: `GET /model-metrics` — returns stored evaluation metrics for display on dashboard
- FR-16: `GET /health` — basic health check endpoint

### 3.4 Frontend
- FR-17: Single-applicant form with all model input fields, client-side validation
- FR-18: Result view: probability, risk tier badge (Low/Medium/High), SHAP factor bar chart (top 5 features)
- FR-19: Batch upload page: CSV drag-and-drop, progress state, results table (sortable/filterable by risk tier)
- FR-20: Metrics dashboard page: AUC-ROC, confusion matrix, precision/recall displayed visually
- FR-21: CSV export of batch results

### 3.5 Collateral Management (New)

**Working definition (assumption — flagged for confirmation):** A loan can have one or more collaterals pledged against it. Each collateral has its own **release target** — a cumulative repayment amount for that loan. Once total repayments recorded against the loan reach a given collateral's target, that collateral is automatically marked `Released`. This models real secured-lending behavior (e.g., partial collateral release as a borrower pays down principal), rather than an all-or-nothing collateral hold.

- FR-22: Applicant can add one or more collaterals to a loan application, each with: `type` (vehicle, property, deposit, other), `description`, `estimated_value`, `release_target_amount`
- FR-23: System validates that `release_target_amount` for each collateral does not exceed the total loan amount
- FR-24: Risk analyst can record a repayment against a loan (`amount`, `date`)
- FR-25: On each repayment, system recalculates cumulative repaid amount for that loan
- FR-26: System evaluates all collaterals tied to the loan; any collateral whose `release_target_amount` ≤ cumulative repaid amount is marked `Released` (status change is one-directional — released collateral cannot revert to `Held`)
- FR-27: `GET /loans/{loan_id}/collaterals` — returns all collaterals for a loan with current status (`Held` / `Released`) and remaining amount needed for release
- FR-28: `POST /loans/{loan_id}/repayments` — records a repayment and returns updated collateral statuses
- FR-29: Frontend collateral tracker view: per-loan list of collaterals, each showing a progress bar toward its release target and current status badge
- FR-30: Notification/flag (in-app, not email) when a collateral newly qualifies for release, shown on the next dashboard load

---

## 4. Non-Functional Requirements

- NFR-1: Single prediction should return in <1s
- NFR-2: Batch predict should handle at least 1,000 rows without timing out (async/background processing if needed)
- NFR-3: Codebase should be modular — data pipeline, model training, and API cleanly separated
- NFR-4: Deployed and publicly accessible (Render/Railway for backend, Vercel/Netlify for frontend)
- NFR-5: README with setup instructions, model performance summary, and architecture diagram

---

## 5. Data Model — Collateral Module

Relational structure (loan → many collaterals, loan → many repayments):

**`loans`**
| Field | Type | Notes |
|-------|------|-------|
| id | PK | |
| applicant_name | string | |
| loan_amount | decimal | |
| predicted_risk_tier | string | from FR-13 |
| created_at | datetime | |

**`collaterals`**
| Field | Type | Notes |
|-------|------|-------|
| id | PK | |
| loan_id | FK → loans.id | |
| type | enum (vehicle, property, deposit, other) | |
| description | string | |
| estimated_value | decimal | |
| release_target_amount | decimal | cumulative repayment needed to release this item |
| status | enum (Held, Released) | default `Held` |
| released_at | datetime, nullable | set when status flips to `Released` |

**`repayments`**
| Field | Type | Notes |
|-------|------|-------|
| id | PK | |
| loan_id | FK → loans.id | |
| amount | decimal | |
| paid_at | datetime | |

**Derived value (not stored, computed on read):** `cumulative_repaid = SUM(repayments.amount WHERE loan_id = X)`

---

## 6. Risk Tier Definition (for FR-13/18)

| Tier | Default Probability |
|------|---------------------|
| Low | 0% – 15% |
| Medium | 15% – 40% |
| High | 40%+ |

*(Thresholds are tunable once you see real model output distribution — treat as a starting point.)*

---

## 7. Success Metrics

- Model AUC-ROC ≥ 0.70 (LendingClub credit models commonly land in 0.68–0.75 range — this is realistic, not a toy target)
- Working end-to-end demo: form → prediction → explanation, and CSV → batch results
- Collateral release logic correctly re-evaluates and flips status on every repayment, verified with test cases (partial payment, exact-target payment, overpayment)
- Deployed, publicly linkable application
- README clear enough that a recruiter/interviewer can understand the project in under 2 minutes

---

## 8. Milestones

| Phase | Deliverable |
|-------|-------------|
| 1 | Cleaned dataset + EDA notebook |
| 2 | Feature engineering + imbalance handling |
| 3 | Trained model + SHAP integration + metrics report |
| 4 | FastAPI backend (single + batch endpoints) |
| 5 | React frontend (form, batch upload, metrics dashboard) |
| 6 | Collateral + repayment data model + endpoints (FR-22–28) |
| 7 | Collateral tracker frontend view (FR-29–30) |
| 8 | Deployment + README + polish |

---

## 9. Open Questions
- Full LendingClub dataset (2M+ rows) vs. trimmed subset — decide based on local compute/training time budget
- Whether to expose model retraining via API (out of scope for v1, but worth flagging as a "future work" README section)
- Collateral release model assumes **cumulative repayment thresholds per collateral** (confirm this matches your intent — the alternative is a single "release all collateral once loan is X% repaid" rule, which is simpler but less granular)
- Should overpayment/partial payment edge cases trigger multiple collateral releases in one transaction, or one at a time?
