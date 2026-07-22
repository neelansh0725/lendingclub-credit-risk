"""
Verifies the collateral release logic (FR-25, FR-26) against the PRD's Section 7
success-metric test cases: partial payment, exact-target payment, overpayment.
Also checks FR-23 validation and the one-directional release guarantee.

Run from backend/: python3 -m db.test_release_logic
"""
from decimal import Decimal

from .crud import add_collateral, create_loan, get_loan_collaterals, record_repayment
from .models import CollateralStatus
from .session import SessionLocal


def main():
    db = SessionLocal()

    loan = create_loan(db, applicant_name="Test Case Applicant", loan_amount=Decimal("10000"), predicted_risk_tier="Medium")
    print(f"Created loan {loan.id}, amount=10000")

    collateral_a = add_collateral(db, loan.id, "vehicle", "Car", Decimal("8000"), Decimal("3000"))
    collateral_b = add_collateral(db, loan.id, "deposit", "Savings", Decimal("7000"), Decimal("7000"))
    print(f"Collateral A (target 3000), Collateral B (target 7000)")

    # FR-23: release_target_amount cannot exceed loan amount
    try:
        add_collateral(db, loan.id, "other", "Invalid", Decimal("1000"), Decimal("20000"))
        assert False, "Expected ValueError for release_target_amount > loan_amount"
    except ValueError as e:
        print(f"PASS: FR-23 validation rejected oversized target ({e})")

    # Partial payment: cumulative=1000, neither target met
    record_repayment(db, loan.id, Decimal("1000"))
    statuses = {c["id"]: c["status"] for c in get_loan_collaterals(db, loan.id)}
    assert statuses[collateral_a.id] == "Held"
    assert statuses[collateral_b.id] == "Held"
    print("PASS: partial payment (1000) -> both Held")

    # Exact-target payment: cumulative=3000, A's target exactly met
    record_repayment(db, loan.id, Decimal("2000"))
    statuses = {c["id"]: c["status"] for c in get_loan_collaterals(db, loan.id)}
    assert statuses[collateral_a.id] == "Released", "A should release at exact target"
    assert statuses[collateral_b.id] == "Held"
    print("PASS: exact-target payment (cumulative=3000) -> A Released, B Held")

    # Overpayment: cumulative=13000, well past B's target of 7000
    record_repayment(db, loan.id, Decimal("10000"))
    collaterals = get_loan_collaterals(db, loan.id)
    statuses = {c["id"]: c["status"] for c in collaterals}
    assert statuses[collateral_a.id] == "Released", "A must not revert"
    assert statuses[collateral_b.id] == "Released", "B should release on overpayment"
    remaining = {c["id"]: c["remaining_amount"] for c in collaterals}
    assert remaining[collateral_a.id] == Decimal("0")
    assert remaining[collateral_b.id] == Decimal("0")
    print("PASS: overpayment (cumulative=13000) -> both Released, A did not revert, remaining=0 for both")

    db.close()
    print("\nAll release-logic test cases passed.")


if __name__ == "__main__":
    main()
