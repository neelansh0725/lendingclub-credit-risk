# Tech Stack Document
## LendingClub Credit Risk Prediction System

Chosen to maximize overlap with your existing resume skills (React, FastAPI, Python, MongoDB/MySQL) while adding the minimum new tooling needed for a credible ML project.

---

## 1. Data & Modeling

| Component | Tool | Why |
|-----------|------|-----|
| Data manipulation | **pandas** | Standard, non-negotiable for tabular ML |
| Numerical ops | **NumPy** | Underlies pandas/sklearn |
| Class imbalance | **imbalanced-learn (SMOTE)** | Direct fit for the default/non-default imbalance problem |
| Baseline model | **scikit-learn (LogisticRegression)** | Fast, interpretable baseline |
| Primary model | **LightGBM** | Handles large data + categoricals natively, faster than XGBoost on 800K+ rows, industry-standard for tabular credit models |
| Explainability | **SHAP** | Direct reuse of your XAI experience from the Multimodal AI project; also the standard explainability tool in fintech ML |
| Experimentation | **Jupyter Notebook** | For EDA, feature engineering iteration, model comparison before finalizing the training script |
| Model persistence | **joblib** | Standard for sklearn/LightGBM model serialization |

---

## 2. Backend / API

| Component | Tool | Why |
|-----------|------|-----|
| Framework | **FastAPI** | You already used this in TeamPulse — direct skill reuse; also async-friendly for batch endpoint |
| Validation | **Pydantic** | Ships with FastAPI, enforces clean request/response schemas for `/predict` |
| Batch file handling | **FastAPI `UploadFile` + pandas** | Parse uploaded CSV directly into a DataFrame for scoring |
| Background jobs (optional) | **FastAPI `BackgroundTasks`** | If batch scoring is large enough to need async handling |
| API docs | **FastAPI auto-generated Swagger (`/docs`)** | Free — good to link in your README/demo |

---

## 3. Database

Now that the system tracks **loans, collaterals, and repayments** — entities with strict relationships and running totals — a relational database is the better fit for that half of the app, while the prediction/scoring side still suits a document store.

| Component | Tool | Why |
|-----------|------|-----|
| Store batch results / prediction logs | **MongoDB** | You already have MongoDB experience (SafeEdu, TeamPulse) — prediction results are naturally document-shaped (varying fields per applicant, nested SHAP factor arrays) |
| Store loans, collaterals, repayments | **MySQL** | This module is inherently relational — a loan has many collaterals and many repayments (foreign keys), and release logic depends on `SUM()` aggregation across repayment rows, which SQL handles natively and MongoDB does not do as cleanly |
| ORM | **SQLAlchemy** | Pairs with FastAPI; makes the loan/collateral/repayment relationships and the release-check query straightforward to write and test |

*Recommendation: run both — MongoDB for prediction/scoring history (as originally planned), MySQL for the collateral/repayment ledger. This is also a nice interview talking point: it shows you can pick the right database per data shape rather than defaulting to one for everything.*

---

## 4. Frontend

| Component | Tool | Why |
|-----------|------|-----|
| Framework | **React + TypeScript** | Matches TeamPulse stack exactly |
| Build tool | **Vite** | Already used in your Expense Tracker |
| Styling | **Tailwind CSS** | Already used across SafeEdu/TeamPulse |
| Charts | **Recharts** | For SHAP factor bar charts and metrics dashboard (AUC-ROC curve, confusion matrix visualization) |
| CSV upload UI | **react-dropzone** | Lightweight drag-and-drop for the batch upload page |
| HTTP client | **Axios** | Standard pairing with FastAPI backend |

---

## 5. Deployment

| Component | Tool | Why |
|-----------|------|-----|
| Backend hosting | **Render** (free tier) | Easiest FastAPI deployment, no credit card needed for hobby tier |
| Frontend hosting | **Vercel** | Zero-config React/Vite deployment |
| Model artifact storage | Bundled in backend repo (joblib file) | Simplest for a portfolio-scale project — no need for S3/cloud storage overhead |

---

## 6. Suggested Repo Structure

```
lendingclub-credit-risk/
├── data/
│   ├── raw/                  # original Kaggle CSV (gitignored if large)
│   └── processed/            # cleaned/engineered dataset
├── notebooks/
│   └── eda_and_modeling.ipynb
├── model/
│   ├── train.py              # training script
│   ├── preprocess.py         # shared cleaning/feature engineering (used by train + API)
│   └── model.joblib          # trained artifact
├── backend/
│   ├── main.py                # FastAPI app
│   ├── schemas.py              # Pydantic models
│   ├── predict.py              # loads model, runs inference + SHAP
│   ├── db/
│   │   ├── models.py            # SQLAlchemy models: Loan, Collateral, Repayment
│   │   ├── session.py           # MySQL connection/session setup
│   │   └── crud.py              # loan/collateral/repayment queries + release-check logic
│   ├── routers/
│   │   └── collateral.py        # /loans/{id}/collaterals, /loans/{id}/repayments
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/ (Predict, BatchUpload, Metrics, CollateralTracker)
│   │   ├── components/ (CollateralProgressBar, RepaymentForm, StatusBadge)
│   │   └── api/ (axios client)
│   └── package.json
└── README.md
```

---

## 7. Why This Stack Reads Well on a Resume/Interview

- **Reuses your existing stack** (React/TS, FastAPI, MongoDB) → shows depth, not just breadth
- **LightGBM + SHAP** is the *exact* combination real credit-risk teams use → signals domain awareness, not just "I did a Kaggle tutorial"
- **SMOTE/class-weighting** shows you understand a subtlety (imbalanced classification) that a lot of student projects miss
- **Deployed + documented** shows you can ship, not just train a notebook model

---

## 8. Setup Commands (Quick Reference)

```bash
# Backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn pandas scikit-learn lightgbm shap imbalanced-learn joblib python-multipart
pip install sqlalchemy pymysql pymongo   # collateral/repayment ledger (MySQL) + prediction logs (MongoDB)

# Frontend
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install axios recharts react-dropzone
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
