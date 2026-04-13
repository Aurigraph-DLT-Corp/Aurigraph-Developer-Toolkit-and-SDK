"""Namespace for /api/v11/compliance endpoints -- regulatory compliance."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from aurigraph_sdk.models import AssessmentResult, ComplianceFramework

if TYPE_CHECKING:
    from aurigraph_sdk.client import AurigraphClient


class ComplianceApi:
    """Regulatory compliance assessment operations."""

    def __init__(self, client: AurigraphClient) -> None:
        self._client = client

    def list_frameworks(self) -> list[ComplianceFramework]:
        """List all available compliance frameworks."""
        data = self._client._get("/compliance/frameworks")
        items: list[dict[str, Any]] = data if isinstance(data, list) else data.get("frameworks", [])  # type: ignore[assignment]
        return [ComplianceFramework.model_validate(f) for f in items]

    def get_framework(self, framework_id: str) -> ComplianceFramework:
        """Get a specific compliance framework by ID.

        Args:
            framework_id: The framework identifier.
        """
        data = self._client._get(f"/compliance/frameworks/{framework_id}")
        return ComplianceFramework.model_validate(data)

    def assess(self, asset_id: str, framework: str) -> AssessmentResult:
        """Run a compliance assessment for an asset against a specific framework.

        Args:
            asset_id: The asset to assess.
            framework: The compliance framework to assess against.

        Returns:
            The assessment result with score and findings.
        """
        data = self._client._post(
            "/compliance/assess", {"assetId": asset_id, "framework": framework}
        )
        return AssessmentResult.model_validate(data)

    def get_assessments(self, asset_id: str) -> list[AssessmentResult]:
        """Get all compliance assessments for an asset.

        Args:
            asset_id: The asset to get assessments for.

        Returns:
            List of assessment results.
        """
        data = self._client._get(f"/compliance/assessments/{asset_id}")
        items: list[dict[str, Any]] = data if isinstance(data, list) else data.get("assessments", [])  # type: ignore[assignment]
        return [AssessmentResult.model_validate(a) for a in items]
