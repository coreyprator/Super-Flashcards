# backend/app/services/spaced_repetition.py
# SM-2 Spaced Repetition Algorithm — Sprint 9 (SF-005)
# Based on SuperMemo SM-2: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2

from datetime import date, timedelta
from dataclasses import dataclass
from typing import Optional


@dataclass
class SM2Result:
    interval: int          # Days until next review
    ease_factor: float     # Updated ease factor
    repetition_count: int  # Updated repetition count
    next_review_date: date # Calculated next review date
    quality: int           # Quality score used
    difficulty: str        # Auto-assigned difficulty level


def calculate_sm2(
    quality: int,
    current_interval: int,
    current_ease_factor: float,
    current_repetition_count: int,
) -> SM2Result:
    """
    Apply SM-2 algorithm to calculate next review schedule.

    Quality scale (mapped from UI):
      0 = Again  (blackout, complete failure)
      2 = Hard   (correct with serious difficulty)
      4 = Good   (correct with some hesitation)
      5 = Easy   (perfect, immediate recall)

    Returns updated SM2Result with next review parameters.
    """
    quality = max(0, min(5, quality))

    if quality >= 3:
        # Successful review
        if current_repetition_count == 0:
            new_interval = 1
        elif current_repetition_count == 1:
            new_interval = 6
        else:
            new_interval = round(current_interval * current_ease_factor)
        new_repetition_count = current_repetition_count + 1
    else:
        # Failed review — reset
        new_interval = 1
        new_repetition_count = 0

    # Update ease factor (applies to all reviews, including failures)
    new_ef = current_ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_ef = max(1.3, new_ef)  # Minimum ease factor

    next_date = date.today() + timedelta(days=new_interval)
    difficulty = _auto_difficulty(new_ef, new_repetition_count)

    return SM2Result(
        interval=new_interval,
        ease_factor=round(new_ef, 4),
        repetition_count=new_repetition_count,
        next_review_date=next_date,
        quality=quality,
        difficulty=difficulty,
    )


def _auto_difficulty(ease_factor: float, repetition_count: int) -> str:
    """
    Derive difficulty from SM-2 ease factor.
    Only assigned after 5+ successful reviews.
    """
    if repetition_count < 5:
        return "unrated"
    if ease_factor > 2.8:
        return "beginner"
    if ease_factor >= 2.0:
        return "intermediate"
    return "advanced"


def due_today_filter(next_review_date: Optional[date]) -> bool:
    """Returns True if a card is due for review today or is overdue or never reviewed."""
    if next_review_date is None:
        return True  # Never reviewed — always include
    return next_review_date <= date.today()
