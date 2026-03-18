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
    # moonshot-v1-8k = fast (5-8s), reliable, not overloaded
    # kimi-k2.5 = slow reasoning model (30-40s), avoid for production
    kimi_base_url: str = "https://api.moonshot.ai/v1"
    kimi_model: str = "moonshot-v1-8k"

    # optional provider keys
    openai_api_key: str = ""
    jina_api_key: str = ""
    cohere_api_key: str = ""

    # supabase / vector store
    vector_table_name: str = "policy_chunks"
    vector_store_provider: str = "supabase"

    # embedding
    embedding_provider: str = "jina"
    embedding_model: str = "jina-embeddings-v3"
    embedding_dimension: int = 768

    # llm
    llm_provider: str = "kimi"
    llm_model: str = "moonshot-v1-8k"

    # reranker
    reranker_provider: str = "cross_encoder"

    # backend integration
    port: int = 4000
    python_api_url: str = "http://localhost:8000"

    debug: bool = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings: Settings = get_settings()
