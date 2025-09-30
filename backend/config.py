from pydantic import AnyHttpUrl, Field, computed_field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    BACKEND_CORS_ORIGINS: list[str | AnyHttpUrl] = ['http://localhost:8000']
    OPENAPI_CLIENT_ID: str = ""
    AZURE_TENANT_ID: str = Field(alias="AZURE_TENANT_ID")
    AZURE_CLIENT_ID: str = Field(alias="AZURE_CLIENT_ID")
    AZURE_CLIENT_SECRET: str | None = Field(default=None, alias="AZURE_CLIENT_SECRET")
    OIDC_ISSUER: str | None = Field(default=None, alias="OIDC_ISSUER")
    OIDC_AUTH_URL: str | None = Field(default=None, alias="OIDC_AUTH_URL")
    OIDC_TOKEN_URL: str | None = Field(default=None, alias="OIDC_TOKEN_URL")
    OIDC_JWKS_URL: str | None = Field(default=None, alias="OIDC_JWKS_URL")
    OIDC_SCOPES: str | None = Field(default=None, alias="OIDC_SCOPES")
    SCOPE_DESCRIPTION: str = "user_impersonation"
    TENANT_ID: str = Field(alias="TENANT_ID")
    OBJECT_ID: str = Field(alias="OBJECT_ID")
    APP_ID_URI: str = Field(alias="APP_ID_URI")
    SCOPE_ID: str = Field(alias="SCOPE_ID")
    CLIENT_SECRET: str | None = Field(default=None, alias="CLIENT_SECRET")
    OIDC_REDIRECT_URI: str | None = Field(default=None, alias="OIDC_REDIRECT_URI")
    APP_ID: str = Field(alias="APP_ID")
    MONGODB_URI: str = Field(default="mongodb://localhost:27017", alias="MONGODB_URI")

    @computed_field
    @property
    def SCOPE_NAME(self) -> str:
        return f'api://{self.AZURE_CLIENT_ID}/{self.SCOPE_DESCRIPTION}'

    @computed_field
    @property
    def SCOPES(self) -> dict:
        return {
            self.SCOPE_NAME: self.SCOPE_DESCRIPTION,
        }

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'
        case_sensitive = True



settings = Settings()



