from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .. import models, schemas
from ..deps import get_db, get_current_user
from ..auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserOut)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter_by(email=payload.email).first():
        raise HTTPException(400, "Email already registered")
    user = models.User(email=payload.email, name=payload.name,
                       hashed_password=hash_password(payload.password))
    db.add(user); db.commit(); db.refresh(user)
    return user

@router.post("/login", response_model=schemas.Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    return {"access_token": create_access_token(user.id), "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserOut)
def me(current: models.User = Depends(get_current_user)):
    return current
