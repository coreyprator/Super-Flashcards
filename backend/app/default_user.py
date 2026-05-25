"""
default_user.py — Default PL user cache (BWTL08)
Populated at startup from DB; used by voice_clone and admin_repair
to identify the PL user (cprator@cbsware.com) without OAuth.
"""

DEFAULT_PL_EMAIL = "cprator@cbsware.com"

_default_user_id: str | None = None
_default_user_email: str = DEFAULT_PL_EMAIL


def set_default_user(user_id: str, email: str) -> None:
    global _default_user_id, _default_user_email
    _default_user_id = user_id
    _default_user_email = email


def get_default_user_id() -> str | None:
    return _default_user_id


def get_default_user_email() -> str:
    return _default_user_email
