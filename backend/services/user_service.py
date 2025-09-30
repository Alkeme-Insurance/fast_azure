from datetime import datetime, timezone
from typing import Any, Optional

from bson import ObjectId

from backend.database import MongoDatabase
from backend.models import UserCreate, UserUpdate, UserInDB, UserPublic


def _serialize_user(document: dict[str, Any]) -> UserInDB:
    return UserInDB(
        id=str(document["_id"]),
        email=document["email"],
        full_name=document.get("full_name"),
        is_active=document.get("is_active", True),
        created_at=document["created_at"],
        updated_at=document["updated_at"],
    )


async def create_user(data: UserCreate) -> UserPublic:
    now = datetime.now(timezone.utc)
    user_doc = {
        "email": data.email,
        "full_name": data.full_name,
        "is_active": True if data.is_active is None else data.is_active,
        "password_hash": data.password,  # Replace with real hash in production
        "created_at": now,
        "updated_at": now,
    }
    db = MongoDatabase()
    user_doc = await db.insert_one("users", user_doc)
    user = _serialize_user(user_doc)
    return UserPublic(**user.model_dump())


async def get_user_by_id(user_id: str) -> Optional[UserPublic]:
    db = MongoDatabase()
    doc = await db.find_one_by_id("users", user_id)
    if not doc:
        return None
    return UserPublic(**_serialize_user(doc).model_dump())


async def get_user_by_email(email: str) -> Optional[UserPublic]:
    db = MongoDatabase()
    doc = await db.find_one("users", {"email": email})
    if not doc:
        return None
    return UserPublic(**_serialize_user(doc).model_dump())


async def update_user(user_id: str, changes: UserUpdate) -> Optional[UserPublic]:
    update_doc: dict[str, Any] = {k: v for k, v in changes.model_dump(exclude_unset=True).items() if v is not None}
    if not update_doc:
        return await get_user_by_id(user_id)

    update_doc["updated_at"] = datetime.now(timezone.utc)
    db = MongoDatabase()
    await db.update_one_by_id("users", user_id, update_doc)
    return await get_user_by_id(user_id)


async def delete_user(user_id: str) -> bool:
    db = MongoDatabase()
    return await db.delete_one_by_id("users", user_id)


async def list_usernames() -> list[dict[str, str]]:
    db = MongoDatabase()
    docs = await db.find_many("users")
    return [{"username": str(doc.get("username") or doc.get("full_name") or "")} for doc in docs]


