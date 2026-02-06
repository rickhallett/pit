"""Database base configuration."""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from pit_api.config import config

engine = create_engine(config.DATABASE_URL, echo=config.DEBUG)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Usage pattern for Flask routes:
#
#   db = SessionLocal()
#   try:
#       # ... use db ...
#   finally:
#       db.close()
