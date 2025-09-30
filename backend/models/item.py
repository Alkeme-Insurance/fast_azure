from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ItemBase(BaseModel):
    title: str = Field(min_length=1)
    description: Optional[str] = None
    owner_id: str


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1)
    description: Optional[str] = None


class ItemInDB(ItemBase):
    id: str
    created_at: datetime
    updated_at: datetime


class ItemPublic(ItemBase):
    id: str
    created_at: datetime
    updated_at: datetime


