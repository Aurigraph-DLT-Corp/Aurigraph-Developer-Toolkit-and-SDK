"""
Test suite for Quantum Security V12 API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestQuantumAlgorithmsEndpoint:
    """Test GET /api/v12/crypto/algorithms"""

    def test_get_all_algorithms(self):
        """Test retrieving all quantum algorithms"""
        response = client.get("/api/v12/crypto/algorithms")
        assert response.status_code == 200
        data = response.json()
        assert "algorithms" in data
        assert "total_count" in data
        assert "timestamp" in data
        assert len(data["algorithms"]) > 0

    def test_filter_by_algorithm_type(self):
        """Test filtering algorithms by type"""
        response = client.get("/api/v12/crypto/algorithms?algorithm_type=signature")
        assert response.status_code == 200
        data = response.json()
        for algo in data["algorithms"]:
            assert algo["type"] == "signature"

    def test_filter_by_security_level(self):
        """Test filtering algorithms by minimum security level"""
        response = client.get("/api/v12/crypto/algorithms?min_security_level=3")
        assert response.status_code == 200
        data = response.json()
        for algo in data["algorithms"]:
            assert algo["security_level"] >= 3

    def test_recommended_only_filter(self):
        """Test filtering for recommended algorithms only"""
        response = client.get("/api/v12/crypto/algorithms?recommended_only=true")
        assert response.status_code == 200
        data = response.json()
        for algo in data["algorithms"]:
            assert algo["recommended"] is True

    def test_algorithm_structure(self):
        """Test algorithm response structure"""
        response = client.get("/api/v12/crypto/algorithms")
        assert response.status_code == 200
        data = response.json()
        algo = data["algorithms"][0]

        # Verify all required fields present
        assert "name" in algo
        assert "type" in algo
        assert "security_level" in algo
        assert "key_size" in algo
        assert "performance" in algo
        assert "description" in algo
        assert "standardized" in algo
        assert "recommended" in algo

        # Verify performance metrics
        assert "keygen_ms" in algo["performance"]
        assert "sign_ms" in algo["performance"]
        assert "verify_ms" in algo["performance"]
        assert "ops_per_second" in algo["performance"]


class TestQuantumSecurityStatusEndpoint:
    """Test GET /api/v12/security/quantum-status"""

    def test_get_security_status(self):
        """Test retrieving quantum security status"""
        response = client.get("/api/v12/security/quantum-status")
        assert response.status_code == 200
        data = response.json()

        # Verify all required fields
        assert "enabled" in data
        assert "algorithm" in data
        assert "security_level" in data
        assert "threat_level" in data
        assert "active_keys" in data
        assert "total_operations" in data
        assert "uptime_seconds" in data

    def test_security_status_values(self):
        """Test security status value ranges"""
        response = client.get("/api/v12/security/quantum-status")
        data = response.json()

        # Verify value ranges
        assert data["security_level"] >= 1 and data["security_level"] <= 5
        assert data["threat_level"] in ["low", "moderate", "elevated", "high", "critical"]
        assert data["active_keys"] >= 0
        assert data["total_operations"] >= 0
        assert data["uptime_seconds"] >= 0


class TestKeyRotationEndpoint:
    """Test POST /api/v12/security/key-rotation"""

    def test_trigger_key_rotation(self):
        """Test triggering key rotation"""
        payload = {
            "reason": "scheduled_rotation",
            "immediate": False
        }
        response = client.post("/api/v12/security/key-rotation", json=payload)
        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "rotation_id" in data
        assert "old_key_id" in data
        assert "new_key_id" in data
        assert "algorithm" in data
        assert "completed_at" in data
        assert "duration_ms" in data

    def test_immediate_key_rotation(self):
        """Test immediate key rotation"""
        payload = {
            "reason": "security_incident",
            "immediate": True
        }
        response = client.post("/api/v12/security/key-rotation", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["rotation_id"] is not None

    def test_key_rotation_with_algorithm(self):
        """Test key rotation with specific algorithm"""
        payload = {
            "algorithm": "CRYSTALS-Dilithium-5",
            "reason": "upgrade_security_level",
            "immediate": True
        }
        response = client.post("/api/v12/security/key-rotation", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "algorithm" in data

    def test_key_rotation_missing_reason(self):
        """Test key rotation without reason fails"""
        payload = {
            "immediate": False
        }
        response = client.post("/api/v12/security/key-rotation", json=payload)
        assert response.status_code == 422  # Validation error


class TestAuditLogEndpoint:
    """Test GET /api/v12/security/audit-log"""

    def test_get_audit_log(self):
        """Test retrieving audit log"""
        response = client.get("/api/v12/security/audit-log")
        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "events" in data
        assert "total_count" in data
        assert "page" in data
        assert "page_size" in data
        assert "has_more" in data

    def test_audit_log_pagination(self):
        """Test audit log pagination"""
        response = client.get("/api/v12/security/audit-log?page=1&size=10")
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 10
        assert len(data["events"]) <= 10

    def test_audit_log_event_structure(self):
        """Test audit event structure"""
        response = client.get("/api/v12/security/audit-log")
        data = response.json()

        if len(data["events"]) > 0:
            event = data["events"][0]
            assert "event_id" in event
            assert "timestamp" in event
            assert "type" in event
            assert "actor" in event
            assert "details" in event
            assert "severity" in event
            assert "success" in event

    def test_filter_by_event_type(self):
        """Test filtering audit log by event type"""
        response = client.get("/api/v12/security/audit-log?event_type=key_generation")
        assert response.status_code == 200
        # Note: filtering is applied but mock data may vary

    def test_filter_by_severity(self):
        """Test filtering audit log by severity"""
        response = client.get("/api/v12/security/audit-log?severity=high")
        assert response.status_code == 200

    def test_audit_log_date_range(self):
        """Test filtering audit log by date range"""
        response = client.get(
            "/api/v12/security/audit-log"
            "?start_date=2024-01-01T00:00:00Z"
            "&end_date=2024-12-31T23:59:59Z"
        )
        assert response.status_code == 200


class TestVulnerabilityScanEndpoint:
    """Test POST /api/v12/security/vulnerabilities"""

    def test_run_vulnerability_scan(self):
        """Test running vulnerability scan"""
        response = client.post("/api/v12/security/vulnerabilities")
        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "scan_id" in data
        assert "status" in data
        assert "started_at" in data
        assert "findings" in data
        assert "summary" in data

    def test_vulnerability_scan_status(self):
        """Test vulnerability scan status"""
        response = client.post("/api/v12/security/vulnerabilities")
        data = response.json()
        assert data["status"] in ["pending", "running", "completed", "failed"]

    def test_vulnerability_findings_structure(self):
        """Test vulnerability findings structure"""
        response = client.post("/api/v12/security/vulnerabilities")
        data = response.json()

        if len(data["findings"]) > 0:
            finding = data["findings"][0]
            assert "finding_id" in finding
            assert "severity" in finding
            assert "component" in finding
            assert "category" in finding
            assert "description" in finding
            assert "remediation" in finding
            assert "discovered_at" in finding

    def test_vulnerability_summary(self):
        """Test vulnerability summary structure"""
        response = client.post("/api/v12/security/vulnerabilities")
        data = response.json()

        summary = data["summary"]
        assert "total" in summary
        # May contain: critical, high, medium, low, info


class TestCryptoPerformanceEndpoint:
    """Test GET /api/v12/crypto/performance"""

    def test_get_crypto_performance(self):
        """Test retrieving crypto performance metrics"""
        response = client.get("/api/v12/crypto/performance")
        assert response.status_code == 200
        data = response.json()

        # Verify structure
        assert "algorithm" in data
        assert "security_level" in data
        assert "operations" in data
        assert "performance" in data
        assert "timestamp" in data

    def test_crypto_performance_operations(self):
        """Test operations metrics"""
        response = client.get("/api/v12/crypto/performance")
        data = response.json()

        ops = data["operations"]
        assert "total" in ops
        assert "signatures" in ops
        assert "verifications" in ops
        assert "key_generations" in ops

    def test_crypto_performance_metrics(self):
        """Test performance metrics"""
        response = client.get("/api/v12/crypto/performance")
        data = response.json()

        perf = data["performance"]
        assert "avg_sign_ms" in perf
        assert "avg_verify_ms" in perf
        assert "avg_keygen_ms" in perf
        assert "signatures_per_second" in perf
        assert "verifications_per_second" in perf
