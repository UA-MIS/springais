"""
Quick test script for Phase 1: Service Setup

Run this to verify:
- OpenAI client configuration
- Redis client configuration
- EmbeddingService imports

Usage:
    python test_phase1_setup.py
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path (go up 2 levels: test_scripts/block_d -> project root, then to backend)
project_root = Path(__file__).parent.parent.parent
backend_path = project_root / "backend"
sys.path.insert(0, str(backend_path))


async def main():
    print("=" * 60)
    print("BLOCK D - PHASE 1: Service Setup Verification")
    print("=" * 60)
    print()

    # Test 1: Import EmbeddingService
    print("[1/4] Testing EmbeddingService import...")
    try:
        from app.services import EmbeddingService, SimilarSkill
        print("✓ EmbeddingService imported successfully")
        print(f"  - Class: {EmbeddingService.__name__}")
        print(f"  - Methods: {[m for m in dir(EmbeddingService) if not m.startswith('_')]}")
    except ImportError as e:
        print(f"✗ Import failed: {e}")
        print("  → Run: pip install -r requirements.txt")
        return

    print()

    # Test 2: Import config module
    print("[2/4] Testing config module...")
    try:
        from app.config import get_openai_client, get_redis_client, test_all_connections
        print("✓ Config module imported successfully")
        print("  - Functions: get_openai_client, get_redis_client, test_all_connections")
    except ImportError as e:
        print(f"✗ Import failed: {e}")
        return

    print()

    # Test 3: Test OpenAI connection
    print("[3/4] Testing OpenAI API connection...")
    try:
        from app.config import test_openai_connection
        openai_ok = await test_openai_connection()
        if openai_ok:
            print("✓ OpenAI API connected successfully")
        else:
            print("✗ OpenAI API connection failed")
            print("  → Check OPENAI_API_KEY in .env file")
    except Exception as e:
        print(f"✗ OpenAI test failed: {e}")
        print("  → Ensure OPENAI_API_KEY is set in .env")

    print()

    # Test 4: Test Redis connection
    print("[4/4] Testing Redis connection...")
    try:
        from app.config import test_redis_connection
        redis_ok = await test_redis_connection()
        if redis_ok:
            print("✓ Redis connected successfully")
        else:
            print("✗ Redis connection failed")
            print("  → Start Redis: docker-compose up -d redis")
    except Exception as e:
        print(f"✗ Redis test failed: {e}")
        print("  → Ensure Redis is running and REDIS_URL is correct in .env")

    print()
    print("=" * 60)
    print("Phase 1 Setup Complete!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("  - Phase 2: Implement caching (Tasks 3-5)")
    print("  - Phase 3: Set up PCA model (Tasks 6-8)")


if __name__ == "__main__":
    asyncio.run(main())
