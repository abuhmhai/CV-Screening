"""Optional semantic similarity via sentence-transformers.

The model is loaded lazily on first use. If sentence-transformers (or the model
weights) are unavailable, all helpers degrade to a no-op so the rule-based
pipeline keeps working without semantic enrichment.
"""
import logging
from functools import lru_cache
from typing import List, Optional

logger = logging.getLogger(__name__)

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
SIMILARITY_THRESHOLD = 0.72


@lru_cache(maxsize=1)
def _load_model():  # pragma: no cover - heavy/optional dependency
    try:
        from sentence_transformers import SentenceTransformer

        return SentenceTransformer(MODEL_NAME)
    except Exception as exc:
        logger.warning("Sentence-transformers unavailable, semantic matching disabled: %s", exc)
        return None


def is_available() -> bool:
    return _load_model() is not None


def _cosine(a, b) -> float:
    import numpy as np

    denom = (np.linalg.norm(a) * np.linalg.norm(b)) or 1.0
    return float(np.dot(a, b) / denom)


def semantic_matches(candidates: List[str], reference: List[str]) -> List[str]:
    """Return items from `candidates` that are semantically close to any item
    in `reference` (e.g. recover "react" ~ "react.js")."""
    model = _load_model()
    if model is None or not candidates or not reference:
        return []

    try:
        cand_emb = model.encode(candidates, convert_to_numpy=True)
        ref_emb = model.encode(reference, convert_to_numpy=True)
    except Exception as exc:  # pragma: no cover
        logger.warning("Embedding encode failed: %s", exc)
        return []

    matched: List[str] = []
    for i, cand in enumerate(candidates):
        best = max((_cosine(cand_emb[i], ref_emb[j]) for j in range(len(reference))), default=0.0)
        if best >= SIMILARITY_THRESHOLD:
            matched.append(cand)
    return matched
