"""App settings — reads from .env via pydantic-settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    # required — will error if missing
    llama_cloud_api_key: str
    moonshot_api_key: str
    supabase_url: str
    supabase_service_key: str

    # kimi / moonshot
    kimi_base_url: str = "https://api.moonshot.ai/v1"
    kimi_model: str = "kimi-k2.5"

    # optional provider keys
    openai_api_key: str = ""
    jina_api_key: str = ""
    cohere_api_key: str = ""

    # supabase / vector store
    vector_table_name: str = "policy_chunks"
    vector_store_provider: str = "supabase"

    # embedding — local by default
    embedding_provider: str = "local"
    embedding_model: str = "BAAI/bge-large-en-v1.5"
    embedding_dimension: int = 1024

    # llm
    llm_provider: str = "kimi"
    llm_model: str = "kimi-k2.5"

    # reranker
    reranker_provider: str = "cross_encoder"

    debug: bool = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings: Settings = get_settings()
