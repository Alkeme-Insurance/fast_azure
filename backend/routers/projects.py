from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query

from backend.services import projects_service
from backend.models.project import ProjectCreate, ProjectUpdate


router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("")
async def list_projects(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    sort: Optional[str] = Query(None),
    filter: Optional[str] = Query(None),
):
    items, total = await projects_service.list_projects(page=page, limit=limit, sort=sort, filter=filter)
    return {"items": items, "total": total}


@router.post("")
async def create_project(body: ProjectCreate):
    return await projects_service.create_project(body)

@router.get("/{project_id}")
async def get_project(project_id: str):
    proj = await projects_service.get_project(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return proj


@router.patch("/{project_id}")
async def patch_project(project_id: str, body: ProjectUpdate):
    updated = await projects_service.update_project(project_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    ok = await projects_service.delete_project(project_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"ok": True}


