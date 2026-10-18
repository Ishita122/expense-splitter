from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..deps import get_db, get_current_user

router = APIRouter(prefix="/groups", tags=["groups"])

def _is_member(db, group_id, user_id):
    return db.query(models.GroupMember).filter_by(group_id=group_id, user_id=user_id).first() is not None

@router.post("", response_model=schemas.GroupOut)
def create_group(payload: schemas.GroupCreate, db: Session = Depends(get_db),
                 current: models.User = Depends(get_current_user)):
    group = models.Group(name=payload.name, owner_id=current.id)
    db.add(group); db.flush()
    db.add(models.GroupMember(group_id=group.id, user_id=current.id))
    db.commit(); db.refresh(group)
    return group

@router.get("", response_model=list[schemas.GroupOut])
def list_groups(db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    return (db.query(models.Group)
              .join(models.GroupMember)
              .filter(models.GroupMember.user_id == current.id)
              .all())

@router.post("/{group_id}/members", status_code=201)
def add_member(group_id: int, payload: schemas.MemberAdd,
               db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    if not _is_member(db, group_id, current.id):
        raise HTTPException(403, "Not a member of this group")
    if not db.get(models.User, payload.user_id):
        raise HTTPException(404, "User not found")
    if _is_member(db, group_id, payload.user_id):
        raise HTTPException(400, "Already a member")
    db.add(models.GroupMember(group_id=group_id, user_id=payload.user_id))
    db.commit()
    return {"ok": True}
