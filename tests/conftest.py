"""
Root pytest configuration: establish ONE import root for the whole suite.

Why this file exists
--------------------
The suite previously had two import roots and picked between them by accident
of collection order:

  * ``tests/models/conftest.py`` put ``backend/`` on sys.path and imported
    ``app.*``
  * ``tests/services/*`` put the repo root on sys.path and imported
    ``backend.app.*``

Both "work" alone. Together they are actively harmful, because
``app.models.base`` and ``backend.app.models.base`` are then two distinct
module objects with two distinct SQLAlchemy declarative registries. Importing
both in one process raises::

    InvalidRequestError: Table 'skill_taxonomy' is already defined
    for this MetaData instance

and, before that point, whichever tests happened to be collected without
``backend/`` on the path failed with ``ModuleNotFoundError: No module named
'app'``.

The root chosen here is ``app.*``, because:

  * it is what the application itself uses at runtime - the backend directory
    is mounted at ``/app`` in the container, so ``app`` IS the package root
  * it is already the root used by every test under ``backend/tests/`` and
    ``tests/models/``
  * ``backend/`` has no ``__init__.py``, so ``backend.app`` only ever resolved
    as an implicit namespace package

Test modules should therefore ``from app.services... import ...`` and never
``from backend.app...``.
"""

import os
import sys

_REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_REPO_ROOT)
_BACKEND_DIR = os.path.join(_PROJECT_ROOT, "backend")

# backend/ first so `app` resolves; project root so `tests.*` and `scripts.*`
# remain importable.
for _path in (_BACKEND_DIR, _PROJECT_ROOT):
    if _path not in sys.path:
        sys.path.insert(0, _path)
