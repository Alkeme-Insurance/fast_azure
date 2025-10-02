"""Board models for Kanban boards"""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from backend.models.card import CardPublic
from backend.models.column import ColumnPublic


class BoardBase(BaseModel):
    """Base board model"""
    name: str
    project_id: Optional[str] = Field(default=None, validation_alias="projectId", serialization_alias="projectId")
    description: Optional[str] = None


class BoardCreate(BoardBase):
    """Schema for creating a new board"""
    pass


class BoardUpdate(BaseModel):
    """Schema for updating a board"""
    name: Optional[str] = None
    project_id: Optional[str] = Field(default=None, validation_alias="projectId", serialization_alias="projectId")
    description: Optional[str] = None


class BoardInDB(BoardBase):
    """Board model as stored in database with ID"""
    id: str


class BoardPublic(BoardInDB):
    """Board model for public API responses"""
    pass


class BoardsListResponse(BaseModel):
    """Response model for listing boards"""
    items: list[BoardPublic]
    total: int


class BoardBundle(BaseModel):
    """Complete board data with columns and cards"""
    board: BoardPublic
    columns: list[ColumnPublic]
    cards: list[CardPublic]

