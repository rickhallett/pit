"""Database base configuration."""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from pit_api.config import config

engine = create_engine(config.DATABASE_URL, echo=config.DEBUG)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency for getting database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
