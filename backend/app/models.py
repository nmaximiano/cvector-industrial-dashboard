from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from .database import Base


class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)

    assets = relationship("Asset", back_populates="facility")


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)

    facility = relationship("Facility", back_populates="assets")
    readings = relationship("SensorReading", back_populates="asset")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    metric_name = Column(String(100), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    timestamp = Column(DateTime, nullable=False)

    asset = relationship("Asset", back_populates="readings")
