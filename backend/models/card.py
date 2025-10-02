"""Card models for Kanban board cards"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class Label(BaseModel):
    """Label/Tag for categorizing cards"""
    name: str
    color: str  # hex color code


class ChecklistItem(BaseModel):
    """Checklist item/subtask within a card"""
    text: str
    completed: bool = False


class CardBase(BaseModel):
    """Base card model with all fields"""
    column_id: str = Field(validation_alias="columnId", serialization_alias="columnId")
    board_id: Optional[str] = Field(default=None, validation_alias="boardId", serialization_alias="boardId")
    title: str
    position: int
    description: Optional[str] = None
    project_id: Optional[str] = Field(default=None, validation_alias="projectId", serialization_alias="projectId")
    
    # Extended card properties
    assignees: list[str] = Field(default_factory=list)  # List of usernames or IDs
    labels: list[Label] = Field(default_factory=list)  # Colored category tags
    due_date: Optional[datetime] = Field(default=None, validation_alias="dueDate", serialization_alias="dueDate")
    checklist: list[ChecklistItem] = Field(default_factory=list)  # Subtasks
    attachment_count: int = Field(default=0, validation_alias="attachmentCount", serialization_alias="attachmentCount")
    comment_count: int = Field(default=0, validation_alias="commentCount", serialization_alias="commentCount")


class CardCreate(CardBase):
    """Schema for creating a new card"""
    pass


class CardUpdate(BaseModel):
    """Schema for updating a card - all fields optional"""
    column_id: Optional[str] = Field(default=None, validation_alias="columnId", serialization_alias="columnId")
    title: Optional[str] = None
    position: Optional[int] = None
    description: Optional[str] = None
    project_id: Optional[str] = Field(default=None, validation_alias="projectId", serialization_alias="projectId")
    assignees: Optional[list[str]] = None
    labels: Optional[list[Label]] = None
    due_date: Optional[datetime] = Field(default=None, validation_alias="dueDate", serialization_alias="dueDate")
    checklist: Optional[list[ChecklistItem]] = None
    attachment_count: Optional[int] = Field(default=None, validation_alias="attachmentCount", serialization_alias="attachmentCount")
    comment_count: Optional[int] = Field(default=None, validation_alias="commentCount", serialization_alias="commentCount")


class CardInDB(CardBase):
    """Card model as stored in database with ID"""
    id: str


class CardPublic(CardInDB):
    """Card model for public API responses"""
    pass

