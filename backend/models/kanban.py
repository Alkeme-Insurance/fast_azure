"""
Kanban models - Re-exports from board, column, and card modules for backward compatibility
"""
from __future__ import annotations

# Re-export all models from board, column, and card modules
from backend.models.board import (
    BoardBase,
    BoardBundle,
    BoardCreate,
    BoardInDB,
    BoardPublic,
    BoardsListResponse,
    BoardUpdate,
)
from backend.models.card import (
    CardBase,
    CardCreate,
    CardInDB,
    CardPublic,
    CardUpdate,
    ChecklistItem,
    Label,
)
from backend.models.column import (
    ColumnBase,
    ColumnCreate,
    ColumnInDB,
    ColumnPublic,
    ColumnUpdate,
)

__all__ = [
    # Board models
    "BoardBase",
    "BoardCreate",
    "BoardUpdate",
    "BoardInDB",
    "BoardPublic",
    "BoardsListResponse",
    "BoardBundle",
    # Column models
    "ColumnBase",
    "ColumnCreate",
    "ColumnUpdate",
    "ColumnInDB",
    "ColumnPublic",
    # Card models
    "Label",
    "ChecklistItem",
    "CardBase",
    "CardCreate",
    "CardUpdate",
    "CardInDB",
    "CardPublic",
]


