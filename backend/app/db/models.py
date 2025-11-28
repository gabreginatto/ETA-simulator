"""
SQLAlchemy ORM models for SludgeSim.
Uses JSONB columns for nested structures to maintain flexibility.
"""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Text, DateTime, Date, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class ProjectModel(Base):
    """SQLAlchemy model for projects."""

    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    plant_configuration: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    jar_test_id: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "plant_configuration": self.plant_configuration,
            "jar_test_id": self.jar_test_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class JarTestModel(Base):
    """SQLAlchemy model for jar tests."""

    __tablename__ = "jar_tests"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    sample: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    polymer: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    doses: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, nullable=False)
    analysis: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            "id": self.id,
            "date": self.date.isoformat(),
            "sample": self.sample,
            "polymer": self.polymer,
            "doses": self.doses,
            "analysis": self.analysis,
            "notes": self.notes,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class JarTestCounterModel(Base):
    """Model to track jar test ID counter for sequential IDs."""

    __tablename__ = "jar_test_counter"

    year: Mapped[int] = mapped_column(primary_key=True)
    counter: Mapped[int] = mapped_column(default=0)
