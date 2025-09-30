from fastapi import Depends
from fastapi import FastAPI, Security
from .dependencies import get_query_token, get_token_header
from .internals import admin
from .routers import items, users
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from backend.auth import azure_scheme
from backend.config import settings
from backend.clients.mongo_db import mongo_lifespan
from backend.utils.seed import seed_initial_data

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    async with mongo_lifespan():
        await azure_scheme.openid_config.load_config()
        await seed_initial_data()
        yield


app = FastAPI(
    dependencies=[Security(azure_scheme)],
    swagger_ui_oauth2_redirect_url='/oauth2-redirect',
    swagger_ui_init_oauth={
        'usePkceWithAuthorizationCodeGrant': True,
        'clientId': settings.OPENAPI_CLIENT_ID,
        'scopes': settings.SCOPE_NAME,
    },
    lifespan=lifespan,
)

 

 


app.include_router(users.router)
app.include_router(items.router)
app.include_router(
    admin.router,
    prefix="/admin",
    tags=["admin"],
    responses={418: {"description": "I'm a teapot"}},
)

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

 



@app.get("/", dependencies=[Security(azure_scheme)])
async def root():
    return {"message": "Hello Bigger Applications!"}