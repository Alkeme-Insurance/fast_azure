from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from backend.models.board import BoardCreate, BoardUpdate, BoardPublic, BoardsListResponse, BoardBundle
from backend.models.column import ColumnCreate, ColumnUpdate, ColumnPublic
from backend.models.card import CardCreate, CardUpdate, CardPublic
from backend.services import kanban_service


router = APIRouter(prefix="/api", tags=["kanban"])

@router.get("/boards", response_model=BoardsListResponse)
async def list_boards():
    # simple list of boards
    boards = [
        {"id": str(b["_id"]), **{k: v for k, v in b.items() if k != "_id"}}
        async for b in kanban_service._boards().find({}).sort([("name", 1)])
    ]
    return {"items": [BoardPublic(**b) for b in boards], "total": len(boards)}


@router.get("/boards/{board_id}", response_model=BoardBundle)
async def get_board(board_id: str):
    data = await kanban_service.get_board_with_children(board_id)
    if not data:
        raise HTTPException(status_code=404, detail="Board not found")
    return data


@router.post("/boards", response_model=BoardPublic)
async def post_board(body: BoardCreate):
    return await kanban_service.create_board(body.name, body.project_id, body.description)

@router.patch("/boards/{board_id}")
async def patch_board(board_id: str, body: BoardUpdate):
    ok = await kanban_service.update_board(board_id, body.name, body.project_id, body.description)
    if not ok:
        raise HTTPException(status_code=404, detail="Board not found")
    return {"ok": True}

@router.get("/projects/{project_id}/boards", response_model=BoardsListResponse)
async def list_project_boards(project_id: str):
    """Get all boards for a specific project"""
    boards = await kanban_service.list_boards_by_project(project_id)
    return {"items": boards, "total": len(boards)}

@router.delete("/boards/{board_id}")
async def delete_board(board_id: str):
    ok = await kanban_service.delete_board(board_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Board not found")
    return {"ok": True}


@router.post("/columns", response_model=ColumnPublic)
async def post_column(body: ColumnCreate):
    return await kanban_service.create_column(body.board_id, body.title, body.position)


@router.patch("/columns/{column_id}")
async def patch_column(column_id: str, body: ColumnUpdate):
    ok = await kanban_service.update_column(column_id, title=body.title, position=body.position)
    if not ok:
        raise HTTPException(status_code=404, detail="Column not found")
    return {"ok": True}


@router.delete("/columns/{column_id}")
async def delete_column(column_id: str):
    ok = await kanban_service.delete_column(column_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Column not found")
    return {"ok": True}


@router.post("/cards", response_model=CardPublic)
async def post_card(body: CardCreate):
    # Extract all fields from the Pydantic model
    card_data = body.model_dump(by_alias=True, exclude_unset=True)
    column_id = card_data.pop("columnId")
    title = card_data.pop("title")
    position = card_data.pop("position")
    return await kanban_service.create_card(column_id, title, position, **card_data)


@router.patch("/cards/{card_id}")
async def patch_card(card_id: str, body: CardUpdate):
    # Convert Pydantic model to dict with camelCase keys, excluding unset fields
    update_data = body.model_dump(by_alias=True, exclude_unset=True)
    ok = await kanban_service.update_card(card_id, **update_data)
    if not ok:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"ok": True}


@router.delete("/cards/{card_id}")
async def delete_card(card_id: str):
    ok = await kanban_service.delete_card(card_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"ok": True}


@router.patch("/cards/reorder")
async def patch_cards_reorder(body: dict[str, Any]):
    updates = body.get("updates")
    if not isinstance(updates, list):
        raise HTTPException(status_code=400, detail="updates must be a list")
    await kanban_service.reorder_cards(updates)
    return {"ok": True}


@router.patch("/columns/reorder")
async def patch_columns_reorder(body: dict[str, Any]):
    updates = body.get("updates")
    if not isinstance(updates, list):
        raise HTTPException(status_code=400, detail="updates must be a list")
    await kanban_service.reorder_columns(updates)
    return {"ok": True}


