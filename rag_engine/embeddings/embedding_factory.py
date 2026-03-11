"""Factory function to instantiate the configured embedder."""

from rag_engine.utils.logger import get_logger
from .base_embedder import BaseEmbedder

logger = get_logger(__name__)


def get_embedder(provider: str | None = None) -> BaseEmbedder:
    """Return an embedder instance for the requested provider.

    Parameters
    ----------
    provider : str | None
        One of ``"local"``, ``"jina"``, ``"openai"``, ``"cohere"``.
        Falls back to ``settings.embedding_provider`` when *None*.
    """
    from rag_engine.config.settings import settings

    if provider is None:
        provider = settings.embedding_provider

    provider = provider.strip().lower()

    if provider == "local":
        from .local_embedder import LocalEmbedder

        model_name = settings.embedding_model
        logger.info("Instantiating LocalEmbedder (model=%s)", model_name)
        return LocalEmbedder(model_name=model_name)

    if provider == "jina":
        from .jina_embedder import JinaEmbedder

        logger.info("Instantiating JinaEmbedder")
        return JinaEmbedder()

    if provider == "openai":
        raise NotImplementedError(
            "OpenAI embeddings skipped — use EMBEDDING_PROVIDER=local"
        )

    if provider == "cohere":
        raise NotImplementedError(
            "Cohere embeddings skipped — use EMBEDDING_PROVIDER=local"
        )

    # default fallback
    logger.warning(
        "Unknown embedding provider '%s' — falling back to LocalEmbedder",
        provider,
    )
    from .local_embedder import LocalEmbedder

    return LocalEmbedder()
