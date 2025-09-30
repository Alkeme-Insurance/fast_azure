from typing import AsyncGenerator
from contextlib import asynccontextmanager

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from urllib.parse import urlparse, urlunparse

from backend.config import settings


_mongo_client: AsyncIOMotorClient | None = None


def get_mongo_client() -> AsyncIOMotorClient:
    global _mongo_client
    if _mongo_client is None:
        uri = settings.MONGODB_URI
        # If host is 'mongo' (compose service name) but we're outside docker, prefer localhost
        try:
            parsed = urlparse(uri)
            host = parsed.hostname or ""
            if host == "mongo":
                parsed = parsed._replace(netloc=uri.replace("mongodb://", "")
                                         .replace("mongo", "localhost", 1))
                uri = urlunparse(parsed)
        except Exception:
            pass
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


