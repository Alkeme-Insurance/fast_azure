from __future__ import annotations

from typing import Any, Optional, Tuple

from bson import ObjectId

from backend.database import MongoDatabase
from backend.models.project import ProjectCreate, ProjectUpdate


def _projects() -> Any:
    return MongoDatabase().collection("projects")


def _mongo_sort(sort_param: Optional[str]) -> Optional[list[tuple[str, int]]]:
    if not sort_param:
        return None
    # supports single key: "name:asc" or "dueDate:desc"
    parts = [p.strip() for p in sort_param.split(",") if p.strip()]
    out: list[tuple[str, int]] = []
    for part in parts:
        if ":" in part:
            field, direction = part.split(":", 1)
            out.append((field, 1 if direction.lower() != "desc" else -1))
        else:
            out.append((part, 1))
    return out or None


def _mongo_filter(filter_param: Optional[str]) -> dict[str, Any]:
    # Example: status:eq:Active or owner.id:eq:1
    if not filter_param:
        return {}
    try:
        field, op, value = filter_param.split(":", 2)
    except ValueError:
        return {}
    if op == "eq":
        return {field: value}
    if op == "ne":
        return {field: {"$ne": value}}
    if op == "in":
        return {field: {"$in": value.split("|")}}
    if op == "contains":
        return {field: {"$regex": value, "$options": "i"}}
    return {}


async def list_projects(
    *, page: int, limit: int, sort: Optional[str], filter: Optional[str]
) -> tuple[list[dict[str, Any]], int]:
    collection = _projects()
    mongo_filter = _mongo_filter(filter)
    sort_spec = _mongo_sort(sort)
    skip = max(page - 1, 0) * max(limit, 0)

    cursor = collection.find(mongo_filter)
    if sort_spec:
        cursor = cursor.sort(sort_spec)
    cursor = cursor.skip(skip).limit(limit)

    items = [
        {
            "id": str(doc["_id"]),
            "name": doc["name"],
            "status": doc["status"],
            "owner": doc["owner"],
            "dueDate": doc.get("dueDate"),
        }
        async for doc in cursor
    ]
    total = await collection.count_documents(mongo_filter)
    return items, total


async def create_project(data: ProjectCreate) -> dict[str, Any]:
    doc = data.model_dump(by_alias=True)
    result = await _projects().insert_one(doc)
    # Normalize ObjectId values inside nested objects if any
    # Use Pydantic's model_dump with custom serializer for ObjectId normalization
    normalized_doc = data.model_dump(mode='json')
    return {"id": str(result.inserted_id), **normalized_doc}


async def get_project(project_id: str) -> Optional[dict[str, Any]]:
    doc = await _projects().find_one({"_id": ObjectId(project_id)})
    if not doc:
        return None
    doc_out: dict[str, Any] = {k: v for k, v in doc.items() if k != "_id"}
    doc_out["id"] = str(doc["_id"])
    return doc_out


async def update_project(project_id: str, changes: ProjectUpdate) -> Optional[dict[str, Any]]:
    update_doc = {k: v for k, v in changes.model_dump(exclude_unset=True, by_alias=True).items()}
    if not update_doc:
        # Return current
        doc = await _projects().find_one({"_id": ObjectId(project_id)})
        return None if not doc else {"id": str(doc["_id"]), **{k: v for k, v in doc.items() if k != "_id"}}
    await _projects().update_one({"_id": ObjectId(project_id)}, {"$set": update_doc})
    doc = await _projects().find_one({"_id": ObjectId(project_id)})
    return None if not doc else {"id": str(doc["_id"]), **{k: v for k, v in doc.items() if k != "_id"}}


async def delete_project(project_id: str) -> bool:
    res = await _projects().delete_one({"_id": ObjectId(project_id)})
    return res.deleted_count == 1


