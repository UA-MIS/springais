# PCA Models Directory

This directory stores trained PCA (Principal Component Analysis) models for dimensionality reduction of skill embeddings.

## Purpose

OpenAI's text-embedding-3-large model produces 3072-dimensional vectors, but pgvector's HNSW and IVFFlat indexes only support up to 2000 dimensions. We use PCA to reduce embeddings to 1536 dimensions while preserving ~95%+ of the variance.

## Files

- `pca_model_v1.pkl` - Trained PCA transformer (scikit-learn)
- `pca_metadata_v1.json` - Model metadata (variance, n_components, training info)
- `training_sample.npy` - Optional: sample embeddings used for training

## Training

PCA models are trained on a diverse sample of 5000+ skill embeddings during Block D implementation.

See `scripts/train_pca_model.py` for training script.

## Usage

```python
import joblib

# Load PCA model
pca = joblib.load('backend/models/pca/pca_model_v1.pkl')

# Transform embedding: 3072 → 1536
reduced_embedding = pca.transform([full_embedding])[0]
```

## Versioning

When retraining PCA:
1. Save new model as `pca_model_v2.pkl`
2. Update `pca_version` field in skill_embeddings table
3. Document changes in metadata JSON

## Git

PCA model files (`.pkl`, `.npy`) should be committed to Git since they're essential for reproducing embeddings. File sizes are typically <10MB.
