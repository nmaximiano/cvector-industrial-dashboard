from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Asset
from ..schemas import AssetOut

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.get("", response_model=list[AssetOut])
def list_assets(
    facility_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Asset)
    if facility_id is not None:
        query = query.filter(Asset.facility_id == facility_id)
    return query.all()
