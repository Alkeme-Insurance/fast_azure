from __future__ import annotations

from typing import Any, Iterable, Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase

from backend.clients.mongo_db import get_database


class MongoDatabase:
    """
    Thin CRUD wrapper around Motor to centralize Mongo interactions.
    Services should depend on this class, not Motor directly.
    """

    def __init__(self, db_name: str = "appdb") -> None:
        self._db: AsyncIOMotorDatabase = get_database(db_name)

    def collection(self, name: str) -> AsyncIOMotorCollection:
        return self._db[name]

    # Create
    async def insert_one(self, collection: str, document: dict[str, Any]) -> dict[str, Any]:
        result = await self.collection(collection).insert_one(document)
        document["_id"] = result.inserted_id
        return document

    # Read
    async def find_one_by_id(self, collection: str, id_value: str) -> Optional[dict[str, Any]]:
        if not ObjectId.is_valid(id_value):
            return None
        return await self.collection(collection).find_one({"_id": ObjectId(id_value)})

    async def find_one(self, collection: str, filter: dict[str, Any]) -> Optional[dict[str, Any]]:
        return await self.collection(collection).find_one(filter)

    async def find_many(
        self,
        collection: str,
        filter: Optional[dict[str, Any]] = None,
        *,
        limit: int = 100,
        skip: int = 0,
        sort: Optional[Iterable[tuple[str, int]]] = None,
    ) -> list[dict[str, Any]]:
        cursor = self.collection(collection).find(filter or {})
        if sort:
            cursor = cursor.sort(list(sort))
        if skip:
            cursor = cursor.skip(skip)
        if limit:
            cursor = cursor.limit(limit)
        return [doc async for doc in cursor]

    # Update
    async def update_one_by_id(self, collection: str, id_value: str, update: dict[str, Any]) -> bool:
        if not ObjectId.is_valid(id_value):
            return False
        result = await self.collection(collection).update_one({"_id": ObjectId(id_value)}, {"$set": update})
        return result.matched_count == 1

    # Delete
    async def delete_one_by_id(self, collection: str, id_value: str) -> bool:
        if not ObjectId.is_valid(id_value):
            return False
        result = await self.collection(collection).delete_one({"_id": ObjectId(id_value)})
        return result.deleted_count == 1


