from __future__ import annotations

from backend.database import MongoDatabase


async def ensure_indexes() -> None:
    db = MongoDatabase()
    await db.collection("projects").create_index([("owner.id", 1), ("status", 1), ("dueDate", 1)])
    await db.collection("boards").create_index([("projectId", 1)])  # For querying boards by project
    await db.collection("columns").create_index([("boardId", 1), ("position", 1)])
    await db.collection("cards").create_index([("columnId", 1), ("position", 1)])
    await db.collection("cards").create_index([("boardId", 1)])


