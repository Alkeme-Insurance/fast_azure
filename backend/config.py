from pydantic import AnyHttpUrl, Field, computed_field, field_validator, ConfigDict
from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        case_sensitive=True,
    )
    #Update this to load from env
    # Use str type and parse manually to avoid Pydantic list parsing issues
    BACKEND_CORS_ORIGINS: str = 'http://localhost:8000,http://127.0.0.1:8000,http://localhost:5173,http://127.0.0.1:5173'
    
    def get_cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string"""
        if isinstance(self.BACKEND_CORS_ORIGINS, str):
            return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(',')]
        return self.BACKEND_CORS_ORIGINS
    OPENAPI_CLIENT_ID: str = ""
    AZURE_TENANT_ID: str | None = Field(default=None, alias="AZURE_TENANT_ID")
    AZURE_CLIENT_ID: str | None = Field(default=None, alias="AZURE_CLIENT_ID")
    AZURE_CLIENT_SECRET: str | None = Field(default=None, alias="AZURE_CLIENT_SECRET")
    OIDC_ISSUER: str | None = Field(default=None, alias="OIDC_ISSUER")
    OIDC_AUTH_URL: str | None = Field(default=None, alias="OIDC_AUTH_URL")
    OIDC_TOKEN_URL: str | None = Field(default=None, alias="OIDC_TOKEN_URL")
    OIDC_JWKS_URL: str | None = Field(default=None, alias="OIDC_JWKS_URL")
    OIDC_SCOPES: str | None = Field(default=None, alias="OIDC_SCOPES")
    SCOPE_DESCRIPTION: str = "user_impersonation"
    TENANT_ID: str | None = Field(default=None, alias="TENANT_ID")
    OBJECT_ID: str | None = Field(default=None, alias="OBJECT_ID")
    APP_ID_URI: str | None = Field(default=None, alias="APP_ID_URI")
    SCOPE_ID: str | None = Field(default=None, alias="SCOPE_ID")
    CLIENT_SECRET: str | None = Field(default=None, alias="CLIENT_SECRET")
    OIDC_REDIRECT_URI: str | None = Field(default=None, alias="OIDC_REDIRECT_URI")
    APP_ID: str | None = Field(default=None, alias="APP_ID")
    MONGODB_URI: str = Field(default="mongodb://localhost:27017", alias="MONGODB_URI")

    @computed_field
    @property
    def SCOPE_NAME(self) -> str:
        if self.AZURE_CLIENT_ID:
            return f'api://{self.AZURE_CLIENT_ID}/{self.SCOPE_DESCRIPTION}'
        return ''

    @computed_field
    @property
    def SCOPES(self) -> dict:
        if self.SCOPE_NAME:
            return {
                self.SCOPE_NAME: self.SCOPE_DESCRIPTION,
            }
        return {}




settings = Settings()



