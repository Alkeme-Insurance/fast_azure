from datetime import datetime, timezone
from typing import Any, Optional

from bson import ObjectId

from backend.database import MongoDatabase
from backend.models import ItemCreate, ItemUpdate, ItemInDB, ItemPublic


def _serialize_item(document: dict[str, Any]) -> ItemInDB:
    return ItemInDB(
        id=str(document["_id"]),
        title=document["title"],
        description=document.get("description"),
        owner_id=str(document["owner_id"]),
        created_at=document["created_at"],
        updated_at=document["updated_at"],
    )


async def create_item(data: ItemCreate) -> ItemPublic:
    now = datetime.now(timezone.utc)
    item_doc = {
        "title": data.title,
        "description": data.description,
        "owner_id": ObjectId(data.owner_id) if ObjectId.is_valid(data.owner_id) else data.owner_id,
        "created_at": now,
        "updated_at": now,
    }
    db = MongoDatabase()
    item_doc = await db.insert_one("items", item_doc)
    item = _serialize_item(item_doc)
    return ItemPublic(**item.model_dump())


async def get_item_by_id(item_id: str) -> Optional[ItemPublic]:
    db = MongoDatabase()
    doc = await db.find_one_by_id("items", item_id)
    if not doc:
        return None
    return ItemPublic(**_serialize_item(doc).model_dump())


async def update_item(item_id: str, changes: ItemUpdate) -> Optional[ItemPublic]:
    update_doc: dict[str, Any] = {k: v for k, v in changes.model_dump(exclude_unset=True).items() if v is not None}
    if not update_doc:
        return await get_item_by_id(item_id)

    update_doc["updated_at"] = datetime.now(timezone.utc)
    db = MongoDatabase()
    await db.update_one_by_id("items", item_id, update_doc)
    return await get_item_by_id(item_id)


async def delete_item(item_id: str) -> bool:
    db = MongoDatabase()
    return await db.delete_one_by_id("items", item_id)


async def list_items_mapping() -> dict[str, dict[str, str]]:
    db = MongoDatabase()
    docs = await db.find_many("items")
    result: dict[str, dict[str, str]] = {}
    for doc in docs:
        slug = doc.get("slug")
        name = doc.get("name") or doc.get("title")
        if slug and name:
            result[str(slug)] = {"name": str(name)}
    return result


async def get_item_name_by_slug(slug: str) -> Optional[str]:
    db = MongoDatabase()
    doc = await db.find_one("items", {"slug": slug})
    if not doc:
        return None
    return str(doc.get("name") or doc.get("title") or "")


async def update_item_name_by_slug(slug: str, new_name: str) -> bool:
    db = MongoDatabase()
    updated = await db.collection("items").update_one({"slug": slug}, {"$set": {"name": new_name}})
    return updated.matched_count == 1


