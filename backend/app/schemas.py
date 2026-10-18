from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=6)

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    class Config: from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class GroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)

class GroupOut(BaseModel):
    id: int
    name: str
    owner_id: int
    class Config: from_attributes = True

class MemberAdd(BaseModel):
    user_id: int

class SplitIn(BaseModel):
    user_id: int
    share_cents: int = Field(ge=0)

class ExpenseCreate(BaseModel):
    description: str = Field(min_length=1, max_length=255)
    paid_by: int
    amount_cents: int = Field(gt=0)
    splits: List[SplitIn]

    @field_validator("splits")
    @classmethod
    def splits_not_empty(cls, v):
        if not v:
            raise ValueError("At least one split required")
        return v

    def model_post_init(self, __context):
        total = sum(s.share_cents for s in self.splits)
        if total != self.amount_cents:
            raise ValueError(f"Sum of splits ({total}) must equal amount_cents ({self.amount_cents})")

class ExpenseOut(BaseModel):
    id: int
    description: str
    paid_by: int
    amount_cents: int
    created_at: datetime
    class Config: from_attributes = True

class BalanceOut(BaseModel):
    user_id: int
    net_cents: int
