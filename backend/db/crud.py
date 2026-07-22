from datetime import datetime, timezone
from decimal import Decimal
from typing import List

from sqlalchemy import func
from sqlalchemy.orm import Session

from .models import Collateral, CollateralStatus, Loan, Repayment


def create_loan(db: Session, applicant_name: str, loan_amount: Decimal, predicted_risk_tier: str) -> Loan:
    loan = Loan(applicant_name=applicant_name, loan_amount=loan_amount, predicted_risk_tier=predicted_risk_tier)
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan


def add_collateral(
    db: Session, loan_id: int, type: str, description: str, estimated_value: Decimal, release_target_amount: Decimal
) -> Collateral:
    loan = db.get(Loan, loan_id)
    if loan is None:
        raise ValueError(f"Loan {loan_id} not found")
    if release_target_amount > loan.loan_amount:
        # FR-23
        raise ValueError("release_target_amount cannot exceed the total loan amount")

    collateral = Collateral(
        loan_id=loan_id,
        type=type,
        description=description,
        estimated_value=estimated_value,
        release_target_amount=release_target_amount,
        status=CollateralStatus.Held,
    )
    db.add(collateral)
    db.commit()
    db.refresh(collateral)
    return collateral


def get_cumulative_repaid(db: Session, loan_id: int) -> Decimal:
    """Section 5 derived value: SUM(repayments.amount WHERE loan_id = X), not stored."""
    total = db.query(func.sum(Repayment.amount)).filter(Repayment.loan_id == loan_id).scalar()
    return total if total is not None else Decimal("0")


def evaluate_collateral_releases(db: Session, loan_id: int) -> List[Collateral]:
    """FR-25, FR-26: recompute cumulative repaid, release any Held collateral whose
    target is now met. Only queries Held rows, so a Released collateral is never
    revisited — status change is structurally one-directional."""
    cumulative = get_cumulative_repaid(db, loan_id)
    held = (
        db.query(Collateral)
        .filter(Collateral.loan_id == loan_id, Collateral.status == CollateralStatus.Held)
        .all()
    )

    newly_released = []
    for collateral in held:
        if collateral.release_target_amount <= cumulative:
            collateral.status = CollateralStatus.Released
            collateral.released_at = datetime.now(timezone.utc)
            newly_released.append(collateral)

    if newly_released:
        db.commit()
    return newly_released


def record_repayment(db: Session, loan_id: int, amount: Decimal, paid_at: datetime = None) -> Repayment:
    """FR-24. Recalculates cumulative repaid and evaluates releases (FR-25, FR-26)."""
    loan = db.get(Loan, loan_id)
    if loan is None:
        raise ValueError(f"Loan {loan_id} not found")

    repayment = Repayment(loan_id=loan_id, amount=amount, paid_at=paid_at or datetime.now(timezone.utc))
    db.add(repayment)
    db.commit()
    db.refresh(repayment)

    evaluate_collateral_releases(db, loan_id)
    return repayment


def get_loan_collaterals(db: Session, loan_id: int) -> List[dict]:
    """FR-27: every collateral for a loan with status and remaining amount needed."""
    cumulative = get_cumulative_repaid(db, loan_id)
    collaterals = db.query(Collateral).filter(Collateral.loan_id == loan_id).all()

    result = []
    for c in collaterals:
        remaining = (
            max(Decimal("0"), c.release_target_amount - cumulative)
            if c.status == CollateralStatus.Held
            else Decimal("0")
        )
        result.append({
            "id": c.id,
            "type": c.type.value,
            "description": c.description,
            "estimated_value": c.estimated_value,
            "release_target_amount": c.release_target_amount,
            "status": c.status.value,
            "released_at": c.released_at,
            "remaining_amount": remaining,
        })
    return result
