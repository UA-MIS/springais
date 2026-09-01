"""
PCA Model Loader and Saver utilities.

Handles loading and saving PCA models with versioning and metadata.
"""

import json
import logging
import os
import warnings
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import joblib
import sklearn
from sklearn.decomposition import PCA

logger = logging.getLogger(__name__)


class PCAModelNotFoundError(Exception):
    """Raised when PCA model file is not found."""
    pass


class PCAMetadata:
    """PCA model metadata structure."""

    def __init__(
        self,
        version: str,
        n_components: int,
        input_dimensions: int,
        explained_variance_ratio: float,
        training_samples: int,
        random_state: int,
        openai_model: str,
        created_at: str
    ):
        self.version = version
        self.n_components = n_components
        self.input_dimensions = input_dimensions
        self.explained_variance_ratio = explained_variance_ratio
        self.training_samples = training_samples
        self.random_state = random_state
        self.openai_model = openai_model
        self.created_at = created_at

    def to_dict(self) -> Dict[str, Any]:
        """Convert metadata to dictionary."""
        return {
            "version": self.version,
            "n_components": self.n_components,
            "input_dimensions": self.input_dimensions,
            "explained_variance_ratio": self.explained_variance_ratio,
            "training_samples": self.training_samples,
            "random_state": self.random_state,
            "openai_model": self.openai_model,
            "created_at": self.created_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "PCAMetadata":
        """Create metadata from dictionary."""
        return cls(
            version=data["version"],
            n_components=data["n_components"],
            input_dimensions=data["input_dimensions"],
            explained_variance_ratio=data["explained_variance_ratio"],
            training_samples=data["training_samples"],
            random_state=data["random_state"],
            openai_model=data["openai_model"],
            created_at=data["created_at"]
        )


def _default_pca_dir() -> Path:
    """
    Resolve PCA directory robustly across:
    - running from repo root
    - running from backend/ (common dev)
    - running in docker (/app)

    Default expected layout for this repo:
      backend/backend/models/pca/{pca_model_v1.pkl,pca_metadata_v1.json}
    """
    # Allow explicit override
    env_dir = os.getenv("PCA_MODEL_DIR")
    if env_dir:
        return Path(env_dir)

    # Anchor off this file: .../backend/app/utils/pca_loader.py
    backend_dir = Path(__file__).resolve().parents[2]  # .../backend

    # Prefer the repo's current layout (nested "backend/models/pca")
    candidate = backend_dir / "backend" / "models" / "pca"
    if candidate.exists():
        return candidate

    # Fallback for a flatter layout (if repo structure changes later)
    candidate2 = backend_dir / "models" / "pca"
    return candidate2


def get_pca_model_path(version: str = "v1", base_dir: str | os.PathLike | None = None) -> Tuple[Path, Path]:
    """
    Get paths for PCA model and metadata files.

    Args:
        version: Model version (e.g., "v1", "v2")
        base_dir: Base directory for PCA models. If None, uses PCA_MODEL_DIR or repo default.

    Returns:
        Tuple of (model_path, metadata_path)
    """
    base_path = Path(base_dir) if base_dir is not None else _default_pca_dir()
    model_path = base_path / f"pca_model_{version}.pkl"
    metadata_path = base_path / f"pca_metadata_{version}.json"

    return model_path, metadata_path


def load_pca_model(version: str = "v1", base_dir: str | os.PathLike | None = None) -> Tuple[PCA, PCAMetadata]:
    """
    Load PCA model and metadata from disk.

    Args:
        version: Model version to load (default: "v1")
        base_dir: Base directory for PCA models. If None, uses PCA_MODEL_DIR or repo default.

    Returns:
        Tuple of (pca_model, metadata)

    Raises:
        PCAModelNotFoundError: If model or metadata file not found

    Example:
        >>> pca, metadata = load_pca_model("v1")
        >>> print(f"Loaded PCA v{metadata.version}: {metadata.n_components} components")
        >>> reduced = pca.transform([embedding_3072])[0]  # 3072 → 1536
    """
    model_path, metadata_path = get_pca_model_path(version, base_dir)

    # Check if files exist
    if not model_path.exists():
        raise PCAModelNotFoundError(
            f"PCA model not found: {model_path}\n"
            f"Run training script: python scripts/train_pca_model.py"
        )

    if not metadata_path.exists():
        raise PCAModelNotFoundError(
            f"PCA metadata not found: {metadata_path}"
        )

    try:
        # Load PCA model.
        #
        # sklearn signals a cross-version unpickle by emitting
        # InconsistentVersionWarning ("might lead to breaking code or INVALID
        # RESULTS") through the warnings module - which nothing in this app
        # captures, so it lands nowhere. Note the writing version is NOT
        # readable from the loaded object afterwards: BaseEstimator.__setstate__
        # pops `_sklearn_version` off the state once it has checked it. So the
        # only way to observe the skew is to catch the warning here, at load.
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always")
            pca_model = joblib.load(model_path)

        for w in caught:
            if w.category.__name__ == "InconsistentVersionWarning":
                logger.warning(
                    "PCA model %s was pickled by scikit-learn %s but is being "
                    "loaded by %s. sklearn does not guarantee numerical "
                    "equivalence across versions; the vectors this model "
                    "produces may differ from the ones already indexed. "
                    "Re-fit with the running version to remove this risk.",
                    model_path,
                    getattr(w.message, "original_sklearn_version", "unknown"),
                    sklearn.__version__,
                )
            else:
                # Do not let any other load-time warning vanish either.
                logger.warning(
                    "Warning while loading PCA model %s: %s: %s",
                    model_path, w.category.__name__, w.message,
                )

        # Load metadata
        with open(metadata_path, 'r') as f:
            metadata_dict = json.load(f)

        metadata = PCAMetadata.from_dict(metadata_dict)

        # Validate loaded model
        if not isinstance(pca_model, PCA):
            raise ValueError(f"Loaded object is not a PCA model: {type(pca_model)}")

        if pca_model.n_components_ != metadata.n_components:
            raise ValueError(
                f"Model components mismatch: "
                f"model has {pca_model.n_components_}, metadata says {metadata.n_components}"
            )

        # --- functional check ----------------------------------------------
        #
        # Everything above trusts metadata and attributes. Actually run a
        # transform: it is cheap, and it is the only check that proves the
        # unpickled model still does the thing the rest of the system assumes.
        try:
            import numpy as _np

            probe = _np.zeros((1, metadata.input_dimensions))
            out_shape = pca_model.transform(probe).shape
        except Exception as e:
            raise ValueError(
                f"PCA model {model_path} loaded but is not usable: transform() "
                f"raised {e!r}. Refusing to return a model that cannot reduce."
            )

        if out_shape != (1, metadata.n_components):
            raise ValueError(
                f"PCA model {model_path} produced shape {out_shape}, expected "
                f"(1, {metadata.n_components}). The stored model does not match "
                f"its metadata."
            )

        return pca_model, metadata

    except Exception as e:
        raise Exception(f"Failed to load PCA model {version}: {e}")


def save_pca_model(
    pca_model: PCA,
    metadata: PCAMetadata,
    version: str = "v1",
    base_dir: str | os.PathLike | None = None
) -> None:
    """
    Save PCA model and metadata to disk.

    Args:
        pca_model: Trained scikit-learn PCA model
        metadata: PCA metadata object
        version: Model version (default: "v1")
        base_dir: Base directory for PCA models

    Example:
        >>> from sklearn.decomposition import PCA
        >>> pca = PCA(n_components=1536, random_state=42)
        >>> pca.fit(sample_embeddings)  # Train on sample data
        >>>
        >>> metadata = PCAMetadata(
        ...     version="v1",
        ...     n_components=1536,
        ...     input_dimensions=3072,
        ...     explained_variance_ratio=0.96,
        ...     training_samples=5000,
        ...     random_state=42,
        ...     openai_model="text-embedding-3-large",
        ...     created_at="2026-01-15T10:30:00Z"
        ... )
        >>>
        >>> save_pca_model(pca, metadata, version="v1")
    """
    model_path, metadata_path = get_pca_model_path(version, base_dir)

    # Create directory if it doesn't exist
    model_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        # Save PCA model using joblib (efficient for sklearn models)
        joblib.dump(pca_model, model_path)

        # Save metadata as JSON
        with open(metadata_path, 'w') as f:
            json.dump(metadata.to_dict(), f, indent=2)

        print(f"[OK] Saved PCA model {version}:")
        print(f"     Model: {model_path}")
        print(f"     Metadata: {metadata_path}")
        print(f"     Components: {metadata.n_components}")
        print(f"     Variance preserved: {metadata.explained_variance_ratio:.2%}")

    except Exception as e:
        raise Exception(f"Failed to save PCA model {version}: {e}")


def load_pca_model_safe(version: str = "v1", base_dir: str | os.PathLike | None = None) -> Optional[Tuple[PCA, PCAMetadata]]:
    """
    Safely load PCA model, returning None if not found.

    Args:
        version: Model version to load (default: "v1")
        base_dir: Base directory for PCA models. If None, uses PCA_MODEL_DIR or repo default.

    Returns:
        Tuple of (pca_model, metadata) if found, None otherwise

    Example:
        >>> result = load_pca_model_safe("v1")
        >>> if result:
        ...     pca, metadata = result
        ...     print(f"Loaded PCA v{metadata.version}")
        ... else:
        ...     print("PCA model not found, needs training")
    """
    try:
        return load_pca_model(version, base_dir)
    except PCAModelNotFoundError:
        return None
    except Exception as e:
        logger.error(
            "PCA model %s failed to load: %s. Embedding generation will refuse "
            "to run rather than emit vectors in the wrong space.",
            version, e, exc_info=True,
        )
        return None
