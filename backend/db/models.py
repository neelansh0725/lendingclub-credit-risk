import enum
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Loan(Base):
    __tablename__ = "loans"

    id: Mapped[int] = mapped_column(primary_key=True)
    applicant_name: Mapped[str] = mapped_column(String(255))
    loan_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    predicted_risk_tier: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    collaterals: Mapped[List["Collateral"]] = relationship(back_populates="loan", cascade="all, delete-orphan")
    repayments: Mapped[List["Repayment"]] = relationship(back_populates="loan", cascade="all, delete-orphan")


class CollateralType(str, enum.Enum):
    vehicle = "vehicle"
    property = "property"
    deposit = "deposit"
    other = "other"


class CollateralStatus(str, enum.Enum):
    Held = "Held"
    Released = "Released"


class Collateral(Base):
    __tablename__ = "collaterals"

    id: Mapped[int] = mapped_column(primary_key=True)
    loan_id: Mapped[int] = mapped_column(ForeignKey("loans.id"))
    type: Mapped[CollateralType] = mapped_column(Enum(CollateralType))
    description: Mapped[str] = mapped_column(String(255))
    estimated_value: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    release_target_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    status: Mapped[CollateralStatus] = mapped_column(Enum(CollateralStatus), default=CollateralStatus.Held)
    released_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    loan: Mapped["Loan"] = relationship(back_populates="collaterals")


class Repayment(Base):
    __tablename__ = "repayments"

    id: Mapped[int] = mapped_column(primary_key=True)
    loan_id: Mapped[int] = mapped_column(ForeignKey("loans.id"))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    paid_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    loan: Mapped["Loan"] = relationship(back_populates="repayments")
