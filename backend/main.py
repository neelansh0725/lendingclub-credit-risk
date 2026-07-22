import io
import json
import os
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from mongo import log_batch_predictions, log_single_prediction
from predict import predict_batch, predict_single
from routers.collateral import router as collateral_router
from schemas import ApplicantInput, PredictionResponse

METRICS_PATH = Path(__file__).resolve().parent.parent / "model" / "metrics.json"

app = FastAPI(title="LendingClub Credit Risk API")

# Local dev origins always allowed; the deployed frontend's origin (e.g. a
# Vercel URL) is added via FRONTEND_ORIGIN so this doesn't need a code change
# per deploy.
allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
if os.environ.get("FRONTEND_ORIGIN"):
    allowed_origins.append(os.environ["FRONTEND_ORIGIN"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResponse)
def predict(applicant: ApplicantInput):
    inputs = applicant.model_dump()
    result = predict_single(inputs)
    log_single_prediction(inputs, result)
    return result


@app.post("/batch-predict")
async def batch_predict(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents), low_memory=False)
    result_df = predict_batch(df)
    records = result_df.to_dict(orient="records")
    log_batch_predictions(records)
    return records


@app.get("/model-metrics")
def model_metrics():
    with open(METRICS_PATH) as f:
        return json.load(f)


app.include_router(collateral_router)
