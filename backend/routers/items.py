from fastapi import APIRouter, Depends, HTTPException

from ..dependencies import get_token_header
from backend.services import item_service

router = APIRouter(
    prefix="/items",
    tags=["items"],
    responses={404: {"description": "Not found"}},
)


@router.get("/")
async def read_items():
    return await item_service.list_items_mapping()


@router.get("/{item_id}")
async def read_item(item_id: str):
    name = await item_service.get_item_name_by_slug(item_id)
    if not name:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"name": name, "item_id": item_id}


@router.put(
    "/{item_id}",
    tags=["custom"],
    responses={403: {"description": "Operation forbidden"}},
)
async def update_item(item_id: str):
    if item_id != "plumbus":
        raise HTTPException(
            status_code=403, detail="You can only update the item: plumbus"
        )
    updated = await item_service.update_item_name_by_slug("plumbus", "The great Plumbus")
    return {"item_id": item_id, "name": "The great Plumbus"}