# Test Scripts

Organized test scripts for SpringAIS development blocks.

## Structure

```
test_scripts/
├── README.md
└── block_d_vector_embeddings/
    └── test_phase1_setup.py      # Phase 1: Service Setup verification
```

## Usage

### Block D: Vector Embeddings

**Phase 1 - Service Setup Test:**
```bash
cd test_scripts/block_d_vector_embeddings
python test_phase1_setup.py
```

Tests:
- EmbeddingService import
- Config module imports
- OpenAI API connection
- Redis connection

## Adding New Test Scripts

When creating test scripts for new blocks or phases:

1. Create a folder for the block: `test_scripts/block_x_name/`
2. Add test scripts with descriptive names: `test_phase1_setup.py`
3. Update this README with usage instructions

## Guidelines

- Keep test scripts separate from production code
- Organize by block (matches `implementation-tracking/` structure)
- Use descriptive names that indicate what phase/feature is being tested
- Include clear output with ✓/✗ indicators for pass/fail
