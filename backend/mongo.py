import os
from datetime import datetime, timezone

from pymongo import MongoClient

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")

_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
_db = _client["lendingclub_credit_risk"]
predictions_collection = _db["predictions"]


def log_single_prediction(inputs: dict, result: dict):
    """T48 document shape: raw inputs, prediction output, timestamp."""
    predictions_collection.insert_one({
        "type": "single",
        "inputs": inputs,
        "probability": result["probability"],
        "risk_tier": result["risk_tier"],
        "top_shap_factors": result["top_shap_factors"],
        "logged_at": datetime.now(timezone.utc),
    })


def log_batch_predictions(records: list):
    """T50: one document per scored row in a batch upload."""
    now = datetime.now(timezone.utc)
    docs = [
        {
            "type": "batch",
            "inputs": {k: v for k, v in r.items() if k not in ("probability", "risk_tier")},
            "probability": r["probability"],
            "risk_tier": r["risk_tier"],
            "logged_at": now,
        }
        for r in records
    ]
    if docs:
        predictions_collection.insert_many(docs)
