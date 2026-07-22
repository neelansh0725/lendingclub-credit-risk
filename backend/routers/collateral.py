from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db import crud
from db.session import get_db
from schemas import (
    CollateralCreateRequest,
    CollateralResponse,
    LoanCreateRequest,
    LoanResponse,
    RepaymentRequest,
)

router = APIRouter()


@router.post("/loans", response_model=LoanResponse)
def create_loan(loan: LoanCreateRequest, db: Session = Depends(get_db)):
    return crud.create_loan(db, loan.applicant_name, Decimal(str(loan.loan_amount)), loan.predicted_risk_tier)


@router.post("/loans/{loan_id}/collaterals", response_model=List[CollateralResponse])
def add_collaterals(loan_id: int, collaterals: List[CollateralCreateRequest], db: Session = Depends(get_db)):
    """FR-22, FR-23: pledge one or more collaterals against a loan."""
    try:
        for c in collaterals:
            crud.add_collateral(
                db, loan_id, c.type, c.description,
                Decimal(str(c.estimated_value)), Decimal(str(c.release_target_amount)),
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return crud.get_loan_collaterals(db, loan_id)


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
