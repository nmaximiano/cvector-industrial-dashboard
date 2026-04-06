from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Facility
from ..schemas import FacilityOut, FacilityWithAssets

router = APIRouter(prefix="/api/facilities", tags=["facilities"])


@router.get("", response_model=list[FacilityOut])
def list_facilities(db: Session = Depends(get_db)):
    return db.query(Facility).all()


@router.get("/{facility_id}", response_model=FacilityWithAssets)
def get_facility(facility_id: int, db: Session = Depends(get_db)):
    facility = (
        db.query(Facility)
        .options(joinedload(Facility.assets))
        .filter(Facility.id == facility_id)
        .first()
    )
    if not facility:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Facility not found")
    return facility
