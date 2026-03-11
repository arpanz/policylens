"""Local embedder using sentence-transformers (BAAI/bge-large-en-v1.5)."""

from sentence_transformers import SentenceTransformer

from rag_engine.utils.logger import get_logger
from .base_embedder import BaseEmbedder

logger = get_logger(__name__)

_BGE_QUERY_PREFIX = (
    "Represent this sentence for searching relevant passages: "
)


class LocalEmbedder(BaseEmbedder):
    """Runs embedding inference locally on CPU via sentence-transformers."""

    def __init__(self, model_name: str = "BAAI/bge-large-en-v1.5") -> None:
        self._model_name = model_name
        logger.info(
            "Loading local embedding model: %s (first run downloads ~1.3GB)",
            model_name,
        )
        self._model = SentenceTransformer(model_name, device="cpu")
        logger.info("Model loaded. Dimension: %d", self.get_dimension())

    # ── BaseEmbedder interface ───────────────────────────────────────

    @property
    def model_id(self) -> str:
        return self._model_name

    def embed_query(self, text: str) -> list[float]:
        """Embed a single query.

        BGE models expect a task-specific prefix on *query* text
        (but NOT on document text) for best retrieval accuracy.
        """
        prefixed = f"{_BGE_QUERY_PREFIX}{text}"
        vector = self._model.encode(
            [prefixed], normalize_embeddings=True
        )[0]
        return vector.tolist()

    def embed_documents(
        self, texts: list[str], batch_size: int = 32
    ) -> list[list[float]]:
        """Embed a list of document texts (no prefix applied)."""
        all_embeddings: list[list[float]] = []
        total_batches = (len(texts) + batch_size - 1) // batch_size

        for i in range(total_batches):
            start = i * batch_size
            batch = texts[start : start + batch_size]
            logger.info(
                "Embedding batch %d/%d (%d docs)",
                i + 1,
                total_batches,
                len(batch),
            )
            vectors = self._model.encode(batch, normalize_embeddings=True)
            all_embeddings.extend(v.tolist() for v in vectors)

        return all_embeddings
