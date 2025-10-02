from __future__ import annotations

from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, Field


class OwnerRef(BaseModel):
    id: str
    name: str


class Milestone(BaseModel):
    title: str
    date: Optional[datetime] = None
    completed: bool = False


class OKR(BaseModel):
    """Objectives and Key Results"""
    objective: str
    key_results: list[str] = Field(default_factory=list, validation_alias="keyResults", serialization_alias="keyResults")


class ProjectBase(BaseModel):
    name: str
    status: Literal["idea", "discovery", "in-progress", "blocked", "done"] = "idea"
    owner: OwnerRef
    stakeholders: list[str] = Field(default_factory=list)
    okr: Optional[OKR] = None
    timeline_start: Optional[datetime] = Field(default=None, validation_alias="timelineStart", serialization_alias="timelineStart")
    timeline_end: Optional[datetime] = Field(default=None, validation_alias="timelineEnd", serialization_alias="timelineEnd")
    milestones: list[Milestone] = Field(default_factory=list)
    risks_assumptions: list[str] = Field(default_factory=list, validation_alias="risksAssumptions", serialization_alias="risksAssumptions")
    next_action: Optional[str] = Field(default=None, validation_alias="nextAction", serialization_alias="nextAction")
    blockers: list[str] = Field(default_factory=list)
    notes: Optional[str] = None
    description: Optional[str] = None
    # Legacy field for backwards compatibility
    due_date: Optional[datetime] = Field(default=None, validation_alias="dueDate", serialization_alias="dueDate")


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[Literal["idea", "discovery", "in-progress", "blocked", "done"]] = None
    owner: Optional[OwnerRef] = None
    stakeholders: Optional[list[str]] = None
    okr: Optional[OKR] = None
    timeline_start: Optional[datetime] = Field(default=None, validation_alias="timelineStart", serialization_alias="timelineStart")
    timeline_end: Optional[datetime] = Field(default=None, validation_alias="timelineEnd", serialization_alias="timelineEnd")
    milestones: Optional[list[Milestone]] = None
    risks_assumptions: Optional[list[str]] = Field(default=None, validation_alias="risksAssumptions", serialization_alias="risksAssumptions")
    next_action: Optional[str] = Field(default=None, validation_alias="nextAction", serialization_alias="nextAction")
    blockers: Optional[list[str]] = None
    notes: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = Field(default=None, validation_alias="dueDate", serialization_alias="dueDate")


class ProjectInDB(ProjectBase):
    id: str


class ProjectPublic(ProjectInDB):
    pass


class ProjectWithBoards(ProjectPublic):
    """Project with its associated boards"""
    board_count: int = Field(default=0, validation_alias="boardCount", serialization_alias="boardCount")
    boards: list[dict] = Field(default_factory=list)  # List of board summaries


