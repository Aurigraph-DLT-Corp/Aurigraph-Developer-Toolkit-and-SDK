"""Namespace for /api/v11/dmrv endpoints -- Digital MRV (Measurement, Reporting, Verification)."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from aurigraph_sdk.client import AurigraphClient

# Max events per batch request -- matches the V12 server limit.
BATCH_CHUNK_SIZE = 50


class DmrvApi:
    """DMRV (Digital Measurement, Reporting, and Verification) operations."""

    def __init__(self, client: AurigraphClient) -> None:
        self._client = client

    def record_event(self, event: dict[str, Any]) -> dict[str, Any]:
        """Submit a single DMRV measurement event.

        Args:
            event: The DMRV event payload (contractId, deviceId, eventType, value, etc.).

        Returns:
            Receipt confirming the event was recorded.
        """
        return self._client._post("/dmrv/events", event)

    def get_events(
        self,
        contract_id: str | None = None,
        device_id: str | None = None,
        event_type: str | None = None,
        from_timestamp: str | None = None,
        to_timestamp: str | None = None,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        """Query the DMRV audit trail.

        Args:
            contract_id: Filter by contract ID.
            device_id: Filter by device ID.
            event_type: Filter by event type.
            from_timestamp: Start of time range (ISO 8601).
            to_timestamp: End of time range (ISO 8601).
            limit: Maximum number of events to return.

        Returns:
            List of DMRV events matching the filters.
        """
        params: list[str] = []
        if contract_id:
            params.append(f"contractId={contract_id}")
        if device_id:
            params.append(f"deviceId={device_id}")
        if event_type:
            params.append(f"eventType={event_type}")
        if from_timestamp:
            params.append(f"fromTimestamp={from_timestamp}")
        if to_timestamp:
            params.append(f"toTimestamp={to_timestamp}")
        if limit is not None:
            params.append(f"limit={limit}")

        path = "/dmrv/audit-trail"
        if params:
            path += "?" + "&".join(params)

        data = self._client._get(path)
        if isinstance(data, list):  # type: ignore[arg-type]
            return data  # type: ignore[return-value]
        if isinstance(data, dict):
            return data.get("events", data.get("items", data.get("data", [])))
        return []

    def batch_record(self, events: list[dict[str, Any]]) -> dict[str, Any]:
        """Record many events. Automatically splits into chunks of 50.

        Args:
            events: List of DMRV event payloads.

        Returns:
            Merged batch receipt with accepted/rejected counts.
        """
        merged: dict[str, Any] = {"accepted": 0, "rejected": 0, "receipts": [], "errors": []}
        if not events:
            return merged

        for i in range(0, len(events), BATCH_CHUNK_SIZE):
            chunk = events[i : i + BATCH_CHUNK_SIZE]
            result = self._client._post("/dmrv/events/batch", {"events": chunk})
            merged["accepted"] += result.get("accepted", 0)
            merged["rejected"] += result.get("rejected", 0)
            if result.get("receipts"):
                merged["receipts"].extend(result["receipts"])
            if result.get("errors"):
                for err in result["errors"]:
                    err_copy = dict(err)
                    err_copy["index"] = err.get("index", 0) + i
                    merged["errors"].append(err_copy)

        return merged
