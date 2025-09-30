from fastapi import APIRouter
from backend.services import user_service

router = APIRouter()


@router.get("/users/", tags=["users"], responses={404: {"description": "Not found"}},)
async def read_users():
    return await user_service.list_usernames()


@router.get("/users/me", tags=["users"])
async def read_user_me():
    return {"username": "fakecurrentuser"}


@router.get("/users/{username}", tags=["users"])
async def read_user(username: str):
    return {"username": username}