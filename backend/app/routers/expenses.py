from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from collections import defaultdict
from .. import models, schemas
from ..deps import get_db, get_current_user

router = APIRouter(prefix="/groups/{group_id}", tags=["expenses"])

def _require_member(db, group_id, user_id):
    if not db.query(models.GroupMember).filter_by(group_id=group_id, user_id=user_id).first():
        raise HTTPException(403, "Not a member of this group")

@router.post("/expenses", response_model=schemas.ExpenseOut, status_code=201)
def create_expense(group_id: int, payload: schemas.ExpenseCreate,
                   db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    _require_member(db, group_id, current.id)
    if not db.get(models.User, payload.paid_by):
        raise HTTPException(404, "Payer not found")
    for s in payload.splits:
        if not db.get(models.User, s.user_id):
            raise HTTPException(404, f"Split user {s.user_id} not found")
    expense = models.Expense(group_id=group_id, paid_by=payload.paid_by,
                             description=payload.description, amount_cents=payload.amount_cents)
    db.add(expense); db.flush()
    for s in payload.splits:
        db.add(models.ExpenseSplit(expense_id=expense.id, user_id=s.user_id, share_cents=s.share_cents))
    db.commit(); db.refresh(expense)
    return expense

@router.get("/expenses", response_model=list[schemas.ExpenseOut])
def list_expenses(group_id: int, db: Session = Depends(get_db),
                  current: models.User = Depends(get_current_user)):
    _require_member(db, group_id, current.id)
    return db.query(models.Expense).filter_by(group_id=group_id).all()

@router.get("/balances", response_model=list[schemas.BalanceOut])
def balances(group_id: int, db: Session = Depends(get_db),
             current: models.User = Depends(get_current_user)):
    _require_member(db, group_id, current.id)
    net = defaultdict(int)
    for e in db.query(models.Expense).filter_by(group_id=group_id).all():
        net[e.paid_by] += e.amount_cents
        for s in e.splits:
            net[s.user_id] -= s.share_cents
    return [schemas.BalanceOut(user_id=uid, net_cents=amt) for uid, amt in net.items()]
