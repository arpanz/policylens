"""Retry decorator w/ exponential backoff."""

import time
import functools
from typing import Callable, ParamSpec, Tuple, Type, TypeVar

from .logger import get_logger

logger = get_logger(__name__)

P = ParamSpec("P")
R = TypeVar("R")


def with_retry(
    max_retries: int = 3,
    delay: float = 1.0,
    backoff: float = 2.0,
    exceptions: Tuple[Type[BaseException], ...] = (Exception,),
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @functools.wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            current_delay = delay
            last_exception: BaseException | None = None

            for attempt in range(1, max_retries + 1):
                try:
                    return func(*args, **kwargs)  # type: ignore[arg-type]
                except exceptions as exc:
                    last_exception = exc
                    if attempt == max_retries:
                        logger.error(
                            "Function '%s' failed after %d attempts: %s",
                            func.__name__,
                            max_retries,
                            exc,
                        )
                        raise
                    logger.warning(
                        "Function '%s' attempt %d/%d failed: %s — retrying in %.1fs",
                        func.__name__,
                        attempt,
                        max_retries,
                        exc,
                        current_delay,
                    )
                    time.sleep(current_delay)
                    current_delay *= backoff

            raise last_exception  # type: ignore[misc]

        return wrapper  # type: ignore[return-value]

    return decorator
