from __future__ import annotations

from typing import Any

from backend.database import MongoDatabase


async def seed_initial_data() -> None:
    db = MongoDatabase()

    # Seed users
    for username in ["Rick", "Morty"]:
        email = f"{username.lower()}@example.com"
        existing = await db.find_one("users", {"username": username})
        if not existing:
            await db.insert_one(
                "users",
                {
                    "username": username,
                    "email": email,
                    "full_name": username,
                    "is_active": True,
                },
            )

    rick = await db.find_one("users", {"username": "Rick"})
    owner_id: str = str(rick["_id"]) if rick and "_id" in rick else "seed"

    # Seed items
    items_to_seed: list[dict[str, Any]] = [
        {"slug": "plumbus", "name": "Plumbus", "title": "Plumbus", "owner_id": owner_id},
        {"slug": "gun", "name": "Portal Gun", "title": "Portal Gun", "owner_id": owner_id},
    ]

    for item in items_to_seed:
        existing_item = await db.find_one("items", {"slug": item["slug"]})
        if not existing_item:
            await db.insert_one("items", item)


