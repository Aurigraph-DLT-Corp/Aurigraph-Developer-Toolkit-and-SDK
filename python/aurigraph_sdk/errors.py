"""Aurigraph SDK error types — RFC 7807 Problem+JSON error handling.

All V12 API errors conform to RFC 7807 (application/problem+json).
"""

from __future__ import annotations

from pydantic import AliasGenerator, BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ProblemDetails(BaseModel):
    """RFC 7807 Problem Details response shape."""

    model_config = ConfigDict(
        extra="allow",
        populate_by_name=True,
        alias_generator=AliasGenerator(validation_alias=to_camel),
    )

    type: str = "about:blank"
    title: str = ""
    status: int = 0
    detail: str | None = None
    instance: str | None = None
    error_code: str | None = None
    trace_id: str | None = None
    request_id: str | None = None
    service: str | None = None
    timestamp: str | None = None


class AurigraphError(Exception):
    """Base error thrown by AurigraphClient."""

    def __init__(
        self,
        message: str,
        status: int = 0,
        problem: ProblemDetails | None = None,
        url: str | None = None,
    ) -> None:
        super().__init__(message)
        self.status = status
        self.problem = problem
        self.url = url


class AurigraphClientError(AurigraphError):
    """Thrown on HTTP 4xx responses (application-level validation). Not retryable."""

    pass


class AurigraphServerError(AurigraphError):
    """Thrown on HTTP 5xx responses (server errors). Retryable."""

    pass


class AurigraphNetworkError(AurigraphError):
    """Thrown when request times out or transport throws. Retryable."""

    def __init__(self, message: str, url: str | None = None) -> None:
        super().__init__(message, status=0, url=url)


class AurigraphConfigError(AurigraphError):
    """Thrown when SDK config is invalid (missing baseUrl etc.)."""

    def __init__(self, message: str) -> None:
        super().__init__(message, status=0)
