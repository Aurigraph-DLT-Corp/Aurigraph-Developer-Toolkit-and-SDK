"""Aurigraph DLT SDK — Async Client.

Async counterpart of :class:`AurigraphClient`. Uses ``httpx.AsyncClient``
for non-blocking HTTP transport. All public methods are ``async def``.

Example::

    from aurigraph_sdk import AsyncAurigraphClient

    async with AsyncAurigraphClient(
        base_url="https://dlt.aurigraph.io",
        api_key="your-api-key",
        app_id="your-app-id",
    ) as client:
        health = await client.health()
        stats = await client.stats()
        nodes = await client.nodes.list()
"""

from __future__ import annotations

import asyncio
import logging
import random
from typing import Any, TypeVar

import httpx

from aurigraph_sdk.errors import (
    AurigraphClientError,
    AurigraphConfigError,
    AurigraphError,
    AurigraphNetworkError,
    AurigraphServerError,
    ProblemDetails,
)
from aurigraph_sdk.idempotency import generate_idempotency_key
from aurigraph_sdk.models import HealthResponse, PlatformStats
from aurigraph_sdk.namespaces.async_assets import AsyncAssetsApi

logger = logging.getLogger("aurigraph_sdk")

T = TypeVar("T")

API_PREFIX = "/api/v11"


class AsyncAurigraphClient:
    """Async Python SDK client for the Aurigraph DLT V12 platform (V11 API).

    Mirrors :class:`AurigraphClient` exactly but all methods are ``async``.

    Args:
        base_url: Platform URL (e.g. ``https://dlt.aurigraph.io``).
        api_key: Raw API key for ``ApiKey appId:rawKey`` auth.
        app_id: Application ID for paired API key auth.
        jwt_token: JWT bearer token (takes precedence over API key).
        timeout: Request timeout in seconds. Default 10.
        max_retries: Max retry attempts for 5xx / network errors. Default 3.
    """

    def __init__(
        self,
        base_url: str,
        api_key: str | None = None,
        app_id: str | None = None,
        jwt_token: str | None = None,
        timeout: float = 10.0,
        max_retries: int = 3,
    ) -> None:
        if not base_url:
            raise AurigraphConfigError("AsyncAurigraphClient: base_url is required")

        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._app_id = app_id
        self._jwt_token = jwt_token
        self._timeout = timeout
        self._max_retries = max(1, max_retries)
        self._http = httpx.AsyncClient(timeout=timeout)

        # Namespace instances (created once at init)
        self._assets = AsyncAssetsApi(self)

    # ── Namespace accessors ───────────────────────────────────────────────────
    # Note: Only assets is implemented as async for now. The remaining 12
    # async namespace classes are deferred (ADTS-12 follow-up).

    @property
    def assets(self) -> AsyncAssetsApi:
        """Asset-agnostic RWA operations — works with any asset type."""
        return self._assets

    # ── Top-level convenience methods ─────────────────────────────────────────

    async def health(self) -> HealthResponse:
        """Get platform health status."""
        return HealthResponse.model_validate(await self._get("/health"))

    async def stats(self) -> PlatformStats:
        """Get platform statistics."""
        return PlatformStats.model_validate(await self._get("/stats"))

    async def close(self) -> None:
        """Close the underlying async HTTP client."""
        await self._http.aclose()

    async def __aenter__(self) -> AsyncAurigraphClient:
        return self

    async def __aexit__(self, *args: Any) -> None:
        await self.close()

    # ── Core async request methods (used by namespace classes) ────────────────

    async def _get(self, path: str) -> dict[str, Any]:
        """Send a GET request and return the JSON response as a dict."""
        return await self._request("GET", path)

    async def _post(self, path: str, body: dict[str, Any] | None = None) -> dict[str, Any]:
        """Send a POST request and return the JSON response as a dict."""
        return await self._request("POST", path, body=body)

    async def _put(self, path: str, body: dict[str, Any] | None = None) -> dict[str, Any]:
        """Send a PUT request and return the JSON response as a dict."""
        return await self._request("PUT", path, body=body)

    async def _delete(self, path: str) -> dict[str, Any]:
        """Send a DELETE request and return the JSON response as a dict."""
        return await self._request("DELETE", path)

    async def _request(
        self,
        method: str,
        path: str,
        body: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Execute an async HTTP request with retry, auth, and idempotency.

        Args:
            method: HTTP method (GET, POST, PUT, DELETE).
            path: API path relative to /api/v11 (e.g. "/health").
            body: Optional JSON request body.

        Returns:
            Parsed JSON response as a dict.

        Raises:
            AurigraphClientError: On 4xx responses.
            AurigraphServerError: On 5xx responses after retries exhausted.
            AurigraphNetworkError: On transport / timeout errors.
        """
        url = f"{self._base_url}{API_PREFIX}{path}"
        headers = self._build_headers(method, path, body)

        last_error: AurigraphError | None = None

        for attempt in range(1, self._max_retries + 1):
            try:
                logger.debug("-> [attempt %d/%d] %s %s", attempt, self._max_retries, method, url)

                response = await self._http.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=body,
                )

                status = response.status_code
                logger.debug("<- %d %s %s (%d bytes)", status, method, url, len(response.content))

                if 200 <= status < 300:
                    if not response.content:
                        return {}
                    return response.json()  # type: ignore[no-any-return]

                # Parse RFC 7807 problem details
                problem = self._parse_problem(response)
                title = problem.title if problem else ""
                msg = f"{method} {path} failed: {status} {title}"

                if 400 <= status < 500:
                    raise AurigraphClientError(msg, status, problem, url)

                last_error = AurigraphServerError(msg, status, problem, url)
                if attempt < self._max_retries:
                    await self._backoff(attempt)
                    continue
                raise last_error

            except AurigraphClientError:
                raise  # 4xx — never retry
            except AurigraphError:
                raise
            except httpx.HTTPError as exc:
                last_error = AurigraphNetworkError(
                    f"{method} {path} network error: {exc}", url
                )
                if attempt < self._max_retries:
                    logger.debug("  network error, retrying: %s", exc)
                    await self._backoff(attempt)
                    continue
                raise last_error from exc

        if last_error is not None:
            raise last_error
        raise AurigraphNetworkError(f"request failed with no error: {method} {path}", url)

    def _build_headers(
        self,
        method: str,
        path: str,
        body: dict[str, Any] | None,
    ) -> dict[str, str]:
        """Build request headers with auth and idempotency."""
        headers: dict[str, str] = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "aurigraph-python-sdk/1.3.0",
        }

        # Auth precedence: JWT > paired ApiKey > legacy X-API-Key
        if self._jwt_token:
            headers["Authorization"] = f"Bearer {self._jwt_token}"
        elif self._app_id and self._api_key:
            headers["Authorization"] = f"ApiKey {self._app_id}:{self._api_key}"
        elif self._api_key:
            headers["X-API-Key"] = self._api_key

        # Idempotency key for mutating requests
        if method.upper() != "GET" and body is not None:
            key = generate_idempotency_key(f"{method} {path}", body)
            headers["Idempotency-Key"] = key

        return headers

    @staticmethod
    def _parse_problem(response: httpx.Response) -> ProblemDetails | None:
        """Try to parse an RFC 7807 problem details body."""
        try:
            data = response.json()
            if isinstance(data, dict):
                return ProblemDetails.model_validate(data)
        except Exception:
            pass
        return None

    @staticmethod
    async def _backoff(attempt: int) -> None:
        """Exponential backoff with jitter (async)."""
        base = 0.2 * (2 ** (attempt - 1))
        jitter = random.uniform(0, 0.1)  # noqa: S311
        delay = base + jitter
        logger.debug("  backing off %.3fs before retry", delay)
        await asyncio.sleep(delay)
