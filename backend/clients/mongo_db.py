from typing import AsyncGenerator
from contextlib import asynccontextmanager

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from backend.config import settings


_mongo_client: AsyncIOMotorClient | None = None


def get_mongo_client() -> AsyncIOMotorClient:
    global _mongo_client
    if _mongo_client is None:
        uri = settings.MONGODB_URI
        # Use the URI as-is (will be 'mongo' in Docker, 'localhost' when running locally)
        _mongo_client = AsyncIOMotorClient(uri)
    return _mongo_client


def get_database(db_name: str = "appdb") -> AsyncIOMotorDatabase:
    client = get_mongo_client()
    return client[db_name]


@asynccontextmanager
async def mongo_lifespan() -> AsyncGenerator[None, None]:
    try:
        yield
    finally:
        global _mongo_client
        if _mongo_client is not None:
            _mongo_client.close()
            _mongo_client = None


