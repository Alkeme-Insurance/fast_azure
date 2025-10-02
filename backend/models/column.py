"""Column models for Kanban board columns"""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class ColumnBase(BaseModel):
    """Base column model"""
    board_id: str = Field(validation_alias="boardId", serialization_alias="boardId")
    title: str
    position: int


class ColumnCreate(ColumnBase):
    """Schema for creating a new column"""
    pass


class ColumnUpdate(BaseModel):
    """Schema for updating a column - all fields optional"""
    board_id: Optional[str] = Field(default=None, validation_alias="boardId", serialization_alias="boardId")
    title: Optional[str] = None
    position: Optional[int] = None


class ColumnInDB(ColumnBase):
    """Column model as stored in database with ID"""
    id: str


class ColumnPublic(ColumnInDB):
    """Column model for public API responses"""
    pass

