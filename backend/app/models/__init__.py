"""
SQLAlchemy models for ALOT! platform
Import all models here for Alembic auto-detection
"""
from app.models.user import User, AdminUser
from app.models.product import ProductClass
from app.models.room import Room, RoomEntry, RoomEntryPurchase
from app.models.draw import LotteryDraw
from app.models.credit import UserUniversalCredit, CreditTransaction
from app.models.trivia import RoomTriviaAttempt
from app.models.reveal import Reveal
from app.models.host import Host
from app.models.audit import AuditLog

__all__ = [
    "User",
    "AdminUser",
    "ProductClass",
    "Room",
    "RoomEntry",
    "RoomEntryPurchase",
    "LotteryDraw",
    "UserUniversalCredit",
    "CreditTransaction",
    "RoomTriviaAttempt",
    "Reveal",
    "Host",
    "AuditLog",
]
