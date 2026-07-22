import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "mysql+pymysql://root@localhost/lendingclub_credit_risk"
    "?unix_socket=" + os.path.join(
        os.path.dirname(__file__), "..", "..", "data", "mysql", "mysql.sock"
    ),
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
