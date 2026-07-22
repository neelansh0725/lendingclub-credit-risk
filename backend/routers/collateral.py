from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db import crud
from db.session import get_db
from schemas import CollateralResponse, RepaymentRequest

router = APIRouter()


@router.get("/loans/{loan_id}/collaterals", response_model=List[CollateralResponse])
def get_collaterals(loan_id: int, db: Session = Depends(get_db)):
    """FR-27"""
    return crud.get_loan_collaterals(db, loan_id)


@router.post("/loans/{loan_id}/repayments", response_model=List[CollateralResponse])
def post_repayment(loan_id: int, repayment: RepaymentRequest, db: Session = Depends(get_db)):
    """FR-28: records a repayment, returns updated collateral statuses."""
    try:
        crud.record_repayment(db, loan_id, Decimal(str(repayment.amount)), repayment.paid_at)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return crud.get_loan_collaterals(db, loan_id)
