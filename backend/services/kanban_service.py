from __future__ import annotations

from typing import Any, Optional

from bson import ObjectId

from backend.database import MongoDatabase
from backend.models.kanban import BoardPublic, ColumnPublic, CardPublic


def _db() -> MongoDatabase:
    return MongoDatabase()


def _boards():
    return _db().collection("boards")


def _columns():
    return _db().collection("columns")


def _cards():
    return _db().collection("cards")


async def get_board_with_children(board_id: str) -> dict[str, Any] | None:
    board = await _boards().find_one({"_id": ObjectId(board_id)})
    if not board:
        return None
    columns = [ColumnPublic(id=str(c["_id"]), **{k: v for k, v in c.items() if k != "_id"}) async for c in _columns().find({"boardId": board_id}).sort([("position", 1)])]
    cards = [CardPublic(id=str(c["_id"]), **{k: v for k, v in c.items() if k != "_id"}) async for c in _cards().find({"boardId": board_id})]
    return {
        "board": BoardPublic(id=str(board["_id"]), **{k: v for k, v in board.items() if k != "_id"}),
        "columns": columns,
        "cards": cards,
    }


async def create_board(name: str, project_id: Optional[str] = None, description: Optional[str] = None) -> BoardPublic:
    doc = {"name": name}
    if project_id:
        doc["projectId"] = project_id
    if description:
        doc["description"] = description
    result = await _boards().insert_one(doc)
    return BoardPublic(id=str(result.inserted_id), **doc)

async def update_board(board_id: str, name: Optional[str] = None, project_id: Optional[str] = None, description: Optional[str] = None) -> bool:
    updates = {}
    if name:
        updates["name"] = name
    if project_id is not None:
        updates["projectId"] = project_id
    if description is not None:
        updates["description"] = description
    if not updates:
        return False
    res = await _boards().update_one({"_id": ObjectId(board_id)}, {"$set": updates})
    return res.matched_count == 1

async def delete_board(board_id: str) -> bool:
    # Optionally cascade delete columns/cards; for now, just board
    res = await _boards().delete_one({"_id": ObjectId(board_id)})
    return res.deleted_count == 1


async def list_boards_by_project(project_id: str) -> list[BoardPublic]:
    """Get all boards for a specific project"""
    boards = [
        BoardPublic(id=str(b["_id"]), **{k: v for k, v in b.items() if k != "_id"})
        async for b in _boards().find({"projectId": project_id}).sort([("name", 1)])
    ]
    return boards


async def create_column(board_id: str, title: str, position: int) -> ColumnPublic:
    doc = {"boardId": board_id, "title": title, "position": position}
    result = await _columns().insert_one(doc)
    return ColumnPublic(id=str(result.inserted_id), **doc)


async def update_column(column_id: str, *, title: Optional[str] = None, position: Optional[int] = None) -> bool:
    update: dict[str, Any] = {}
    if title is not None:
        update["title"] = title
    if position is not None:
        update["position"] = position
    if not update:
        return True
    res = await _columns().update_one({"_id": ObjectId(column_id)}, {"$set": update})
    return res.matched_count == 1


async def delete_column(column_id: str) -> bool:
    res = await _columns().delete_one({"_id": ObjectId(column_id)})
    return res.deleted_count == 1


async def create_card(column_id: str, title: str, position: int, **extras: Any) -> CardPublic:
    # Resolve boardId from column
    col = await _columns().find_one({"_id": ObjectId(column_id)})
    board_id = col.get("boardId") if col else None
    doc = {"columnId": column_id, "boardId": board_id, "title": title, "position": position, **extras}
    result = await _cards().insert_one(doc)
    return CardPublic(id=str(result.inserted_id), **doc)


async def update_card(card_id: str, **changes: Any) -> bool:
    # Allow moving across columns by changing columnId/position
    res = await _cards().update_one({"_id": ObjectId(card_id)}, {"$set": changes})
    return res.matched_count == 1


async def delete_card(card_id: str) -> bool:
    res = await _cards().delete_one({"_id": ObjectId(card_id)})
    return res.deleted_count == 1


async def reorder_cards(updates: list[dict[str, Any]]) -> None:
    # updates: [{id, columnId, position}, ...]
    if not updates:
        return
    bulk_ops = []
    for upd in updates:
        card_id = upd["id"]
        set_doc: dict[str, Any] = {}
        if "columnId" in upd:
            set_doc["columnId"] = upd["columnId"]
        if "position" in upd:
            set_doc["position"] = int(upd["position"])
        if not set_doc:
            continue
        bulk_ops.append({"filter": {"_id": ObjectId(card_id)}, "update": {"$set": set_doc}})
    for op in bulk_ops:
        await _cards().update_one(op["filter"], op["update"]) 


async def reorder_columns(updates: list[dict[str, Any]]) -> None:
    # updates: [{id, position}, ...]
    if not updates:
        return
    for upd in updates:
        col_id = upd["id"]
        pos = int(upd["position"]) if "position" in upd else None
        if pos is None:
            continue
        await _columns().update_one({"_id": ObjectId(col_id)}, {"$set": {"position": pos}})


