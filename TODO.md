# Project Todo List — LendingClub Credit Risk Prediction System

Sequential, atomic tasks derived from the PRD and Tech Stack docs. Complete in order — each task assumes only prior tasks are done.

---

## Phase 0 — Project Scaffolding

- [ ] T1: Create root repo folder `lendingclub-credit-risk/` with `data/raw/`, `data/processed/`, `notebooks/`, `model/`, `backend/`, `frontend/` subfolders
- [ ] T2: Initialize git repo and add root `.gitignore` (venv, node_modules, `*.joblib`, `data/raw/*.csv`, `.env`)
- [ ] T3: Download LendingClub dataset CSV into `data/raw/`
- [ ] T4: Create Python virtual environment and activate it
- [ ] T5: Install data/model dependencies (`pandas numpy scikit-learn lightgbm shap imbalanced-learn joblib jupyter`)
- [ ] T6: Create `notebooks/eda_and_modeling.ipynb` skeleton

---

## Phase 1 — Data Pipeline (FR-1 to FR-6)

- [ ] T7: Load raw CSV into a DataFrame in the notebook and log shape/dtypes (FR-1)
- [ ] T8: Filter rows to `loan_status` in {`Fully Paid`, `Charged Off`} only, dropping all others (FR-2)
- [ ] T9: Create binary target column: `Charged Off`→1, `Fully Paid`→0 (FR-3)
- [ ] T10: Compute null-percentage per column and drop columns with >50% nulls (FR-4)
- [ ] T11: Impute remaining missing values in retained columns (FR-4)
- [ ] T12: Engineer DTI feature
- [ ] T13: Engineer credit utilization feature
- [ ] T14: Engineer revolving balance feature
- [ ] T15: Engineer loan-to-income ratio feature
- [ ] T16: Engineer credit history length feature (FR-5 complete)
- [ ] T17: Encode categorical fields `grade`, `purpose`, `home_ownership`, `emp_length`, `verification_status` (FR-6)
- [ ] T18: Save cleaned/engineered dataset to `data/processed/`
- [ ] T19: Extract shared cleaning/feature-engineering logic from the notebook into `model/preprocess.py`

---

## Phase 2 — Imbalance Handling & Train/Test Split

- [ ] T20: Split processed dataset into train/test sets (stratified on target)
- [ ] T21: Apply SMOTE or class-weighting to the training set only (FR-9)

---

## Phase 3 — Model Training, Evaluation, Explainability (FR-7 to FR-12)

- [ ] T22: Train baseline Logistic Regression model on the training set (FR-7)
- [ ] T23: Evaluate baseline model on test set using AUC-ROC, Precision, Recall, F1 (FR-10)
- [ ] T24: Train primary LightGBM model on the training set (FR-8)
- [ ] T25: Evaluate LightGBM model on test set using AUC-ROC, Precision, Recall, F1 (FR-10)
- [ ] T26: Confirm LightGBM AUC-ROC ≥ 0.70; if not, iterate on features/hyperparameters before proceeding
- [ ] T27: Generate SHAP values for the trained LightGBM model on the test set (FR-11)
- [ ] T28: Save evaluation metrics (AUC-ROC, confusion matrix, precision/recall) to a JSON/file artifact for later API use (feeds FR-15)
- [ ] T29: Move finalized training logic from notebook into `model/train.py`
- [ ] T30: Run `model/train.py` end-to-end and persist trained model to `model/model.joblib` (FR-12)

---

## Phase 4 — Backend Core Setup

- [ ] T31: Install backend dependencies (`fastapi uvicorn pydantic python-multipart`)
- [ ] T32: Create `backend/main.py` with a minimal FastAPI app instance
- [ ] T33: Implement `GET /health` endpoint (FR-16)
- [ ] T34: Run backend locally and confirm `/health` responds and `/docs` renders

---

## Phase 5 — Prediction API (FR-13 to FR-15)

- [ ] T35: Create `backend/schemas.py` with Pydantic request/response models for `/predict`
- [ ] T36: Create `backend/predict.py` that loads `model/model.joblib` at startup
- [ ] T37: Implement single-prediction inference logic (probability + risk tier) in `predict.py`, using the risk tier thresholds (Low 0–15%, Medium 15–40%, High 40%+)
- [ ] T38: Implement SHAP top-factor extraction for a single prediction in `predict.py`
- [ ] T39: Wire up `POST /predict` endpoint returning `{probability, risk_tier, top_shap_factors}` (FR-13)
- [ ] T40: Manually test `POST /predict` via `/docs` with a sample payload and confirm response shape and <1s latency (NFR-1)
- [ ] T41: Implement CSV parsing in `predict.py` for uploaded batch files (`UploadFile` + pandas)
- [ ] T42: Implement batch scoring loop reusing single-prediction logic across all rows
- [ ] T43: Wire up `POST /batch-predict` endpoint accepting CSV upload and returning scored results (FR-14)
- [ ] T44: Test `POST /batch-predict` with a 1,000-row CSV and confirm it completes without timeout (NFR-2); add `BackgroundTasks` handling only if this fails
- [ ] T45: Wire up `GET /model-metrics` endpoint returning the metrics artifact from T28 (FR-15)

---

## Phase 6 — MongoDB Prediction Logging

- [ ] T46: Install `pymongo` and provision a MongoDB instance (local or Atlas)
- [ ] T47: Add MongoDB connection setup in the backend (connection string via env var)
- [ ] T48: Define the document shape for a logged prediction (inputs, probability, risk tier, SHAP factors, timestamp)
- [ ] T49: Insert a MongoDB log entry on every successful `/predict` call
- [ ] T50: Insert MongoDB log entries for each row on every successful `/batch-predict` call

---

## Phase 7 — Frontend Core Setup

- [ ] T51: Scaffold `frontend/` with Vite React-TS template
- [ ] T52: Install frontend dependencies (`axios recharts react-dropzone`)
- [ ] T53: Install and configure Tailwind CSS
- [ ] T54: Create `frontend/src/api/` axios client pointed at the backend base URL (env var)
- [ ] T55: Set up basic page routing/navigation shell (Predict, BatchUpload, Metrics pages)

---

## Phase 8 — Frontend: Single Prediction (FR-17, FR-18)

- [ ] T56: Build the single-applicant form component with all model input fields
- [ ] T57: Add client-side validation to the form (FR-17)
- [ ] T58: Wire form submission to call `POST /predict` via the axios client
- [ ] T59: Build the result view showing probability and risk tier badge (Low/Medium/High)
- [ ] T60: Build the SHAP factor bar chart (top 5 features) using Recharts (FR-18)

---

## Phase 9 — Frontend: Batch Upload (FR-19, FR-21)

- [ ] T61: Build the CSV drag-and-drop upload component using react-dropzone
- [ ] T62: Wire upload to call `POST /batch-predict` and show a progress/loading state
- [ ] T63: Build the results table rendering batch scoring output
- [ ] T64: Add sort-by-risk-tier functionality to the results table
- [ ] T65: Add filter-by-risk-tier functionality to the results table (FR-19 complete)
- [ ] T66: Add CSV export button for batch results (FR-21)

---

## Phase 10 — Frontend: Metrics Dashboard (FR-20)

- [ ] T67: Wire a metrics page to call `GET /model-metrics`
- [ ] T68: Render AUC-ROC value/curve on the metrics page
- [ ] T69: Render confusion matrix visualization on the metrics page
- [ ] T70: Render precision/recall values on the metrics page (FR-20 complete)

---

## Phase 11 — MySQL + SQLAlchemy Data Model (Data Model section 5)

- [ ] T71: Install `sqlalchemy pymysql` and provision a MySQL instance
- [ ] T72: Add `backend/db/session.py` with MySQL connection/session setup (env var for connection string)
- [ ] T73: Define `Loan` SQLAlchemy model (`id`, `applicant_name`, `loan_amount`, `predicted_risk_tier`, `created_at`) in `backend/db/models.py`
- [ ] T74: Define `Collateral` SQLAlchemy model (`id`, `loan_id` FK, `type`, `description`, `estimated_value`, `release_target_amount`, `status`, `released_at`)
- [ ] T75: Define `Repayment` SQLAlchemy model (`id`, `loan_id` FK, `amount`, `paid_at`)
- [ ] T76: Generate and run the initial migration/`create_all()` to build the MySQL schema
- [ ] T77: Manually verify all three tables and foreign keys exist in MySQL

---

## Phase 12 — Collateral & Repayment Backend Logic (FR-22 to FR-28)

- [ ] T78: Create `backend/db/crud.py` with a function to create a loan record
- [ ] T79: Add a function to create one or more collaterals for a loan, validating `release_target_amount` ≤ loan amount (FR-22, FR-23)
- [ ] T80: Add a function to compute `cumulative_repaid` for a loan via `SUM(repayments.amount)` (derived value, Section 5)
- [ ] T81: Add a function to record a new repayment against a loan (FR-24)
- [ ] T82: Add release-check logic: after a repayment, recompute cumulative repaid and mark any collateral with `release_target_amount` ≤ cumulative repaid as `Released`, setting `released_at`, one-directionally (FR-25, FR-26)
- [ ] T83: Write test cases for release logic: partial payment (no release), exact-target payment (release), overpayment (release, no revert) — per Success Metrics section 7
- [ ] T84: Create `backend/routers/collateral.py` and implement `GET /loans/{loan_id}/collaterals` returning status + remaining amount needed (FR-27)
- [ ] T85: Implement `POST /loans/{loan_id}/repayments` returning updated collateral statuses (FR-28)
- [ ] T86: Manually test both endpoints via `/docs` against the test cases from T83

---

## Phase 13 — Frontend: Collateral Tracker (FR-29, FR-30)

- [ ] T87: Build `CollateralProgressBar` component (progress toward release target)
- [ ] T88: Build `StatusBadge` component (Held / Released)
- [ ] T89: Build `RepaymentForm` component to submit a repayment for a loan
- [ ] T90: Build the CollateralTracker page listing all collaterals for a loan with progress bars and status badges (FR-29)
- [ ] T91: Wire RepaymentForm submission to `POST /loans/{loan_id}/repayments` and refresh collateral list on response
- [ ] T92: Add in-app flag/notification shown on next dashboard load when a collateral newly qualifies for release (FR-30)

---

## Phase 14 — Deployment (NFR-4)

- [ ] T93: Add `backend/requirements.txt` pinning all backend dependencies
- [ ] T94: Deploy backend to Render, configuring MongoDB and MySQL connection env vars
- [ ] T95: Confirm deployed backend `/health` and `/docs` are publicly reachable
- [ ] T96: Add `frontend/.env.production` pointing to the deployed backend URL
- [ ] T97: Deploy frontend to Vercel
- [ ] T98: Confirm deployed frontend can successfully call the deployed backend end-to-end (predict, batch, metrics, collateral flows)

---

## Phase 15 — Documentation & Polish (NFR-5)

- [ ] T99: Write README setup instructions (local dev: backend + frontend + DBs)
- [ ] T100: Write README model performance summary (final AUC-ROC, precision/recall, confusion matrix)
- [ ] T101: Create and embed an architecture diagram in the README
- [ ] T102: Add public deployed links (frontend + backend `/docs`) to the README
- [ ] T103: Final pass: verify every FR/NFR in the PRD against the shipped app and check off Success Metrics (Section 7)

---

## Notes / Open Questions Carried Over (Section 9 of PRD — resolve before Phase 1/11 respectively)
- Full dataset vs. trimmed subset — decide before T7 based on local compute budget
- Collateral release model assumes cumulative-per-collateral thresholds (not "release all at X% repaid") — confirm before T82
- Whether overpayment can trigger multiple releases in one transaction — resolved by design in T82/T83 (yes, all qualifying collaterals release together)
