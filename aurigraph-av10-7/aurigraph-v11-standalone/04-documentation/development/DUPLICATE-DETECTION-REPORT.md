# Duplicate & Blocker Detection Report

**Date**: 2025-11-01 11:49:45
**Total Critical Issues**: 0
**Total Warnings**: 0

---

## Scan Results

### REST Endpoints
[0;34m🔍 Scanning REST endpoints...[0m
[0;31m⚠️  DUPLICATE ENDPOINTS DETECTED[0m
[1;33m  Path: @Path("/advanced-settings")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/EnterpriseSettingsResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/alerts")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/BridgeStatusResource.java
    • src/main/java/io/aurigraph/v11/api/NetworkMonitoringResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/algorithms")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/CryptoApiResource.java
    • src/main/java/io/aurigraph/v11/api/QuantumCryptoResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/audit-trail")[0m
  Files:
    • src/main/java/io/aurigraph/v11/portal/PortalAPIGateway.java
    • src/main/java/io/aurigraph/v11/security/SecurityAuditService.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/blocks")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/BlockchainApiResource.java
    • src/main/java/io/aurigraph/v11/portal/PortalAPIGateway.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/channels")[0m
  Files:
    • src/main/java/io/aurigraph/v11/demo/api/ChannelNodeResource.java
    • src/main/java/io/aurigraph/v11/portal/PortalAPIGateway.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/contracts/templates")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/Phase2BlockchainResource.java
    • src/main/java/io/aurigraph/v11/portal/PortalAPIGateway.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/create")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/CompositeTokenResource.java
    • src/main/java/io/aurigraph/v11/tokens/TokenResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/deploy")[0m
  Files:
    • src/main/java/io/aurigraph/v11/contracts/ActiveContractResource.java
    • src/main/java/io/aurigraph/v11/smartcontract/SmartContractResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/events")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/LiveNetworkResource.java
    • src/main/java/io/aurigraph/v11/api/NetworkTopologyApiResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/governance/proposals")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/Phase2BlockchainResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/health")[0m
  Files:
    • src/main/java/io/aurigraph/v11/AurigraphResource.java
    • src/main/java/io/aurigraph/v11/analytics/AnalyticsResource.java
    • src/main/java/io/aurigraph/v11/api/CompositeTokenResource.java
    • src/main/java/io/aurigraph/v11/api/LiveDataResource.java
    • src/main/java/io/aurigraph/v11/api/LiveNetworkResource.java
    • src/main/java/io/aurigraph/v11/api/NetworkMonitoringResource.java
    • src/main/java/io/aurigraph/v11/api/NetworkResource.java
    • src/main/java/io/aurigraph/v11/api/SystemInfoResource.java
    • src/main/java/io/aurigraph/v11/contracts/ActiveContractResource.java
    • src/main/java/io/aurigraph/v11/demo/api/ChannelNodeResource.java
    • src/main/java/io/aurigraph/v11/portal/PortalAPIGateway.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/info")[0m
  Files:
    • src/main/java/io/aurigraph/v11/AurigraphResource.java
    • src/main/java/io/aurigraph/v11/demo/api/ChannelNodeResource.java
    • src/main/java/io/aurigraph/v11/portal/PortalAPIGateway.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/metrics")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/AIApiResource.java
    • src/main/java/io/aurigraph/v11/api/ConsensusApiResource.java
    • src/main/java/io/aurigraph/v11/api/CryptoApiResource.java
    • src/main/java/io/aurigraph/v11/api/SecurityApiResource.java
    • src/main/java/io/aurigraph/v11/api/gateway/ApiGateway.java
    • src/main/java/io/aurigraph/v11/contracts/ActiveContractResource.java
    • src/main/java/io/aurigraph/v11/contracts/defi/DeFiIntegrationService.java
    • src/main/java/io/aurigraph/v11/demo/api/ChannelNodeResource.java
    • src/main/java/io/aurigraph/v11/governance/GovernanceResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/network")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/BlockchainApiResource.java
    • src/main/java/io/aurigraph/v11/api/Sprint10ConfigurationResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/nodes")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/ConsensusApiResource.java
    • src/main/java/io/aurigraph/v11/api/Phase2BlockchainResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/optimization-metrics")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/AIApiResource.java
    • src/main/java/io/aurigraph/v11/api/PerformanceApiResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/peers")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/NetworkMonitoringResource.java
    • src/main/java/io/aurigraph/v11/api/NetworkResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/performance")[0m
  Files:
    • src/main/java/io/aurigraph/v11/AurigraphResource.java
    • src/main/java/io/aurigraph/v11/analytics/AnalyticsResource.java
    • src/main/java/io/aurigraph/v11/api/AIApiResource.java
    • src/main/java/io/aurigraph/v11/api/BridgeStatusResource.java
    • src/main/java/io/aurigraph/v11/api/CryptoApiResource.java
    • src/main/java/io/aurigraph/v11/api/QuantumCryptoResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/proposals")[0m
  Files:
    • src/main/java/io/aurigraph/v11/governance/GovernanceResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/rbac/roles")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/Phase4EnterpriseResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/reports")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/CarbonTrackingResource.java
    • src/main/java/io/aurigraph/v11/api/Phase4EnterpriseResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/sdk/info")[0m
  Files:
    • src/main/java/io/aurigraph/v11/contracts/ActiveContractResource.java
    • src/main/java/io/aurigraph/v11/smartcontract/SmartContractResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/settings")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/Sprint10ConfigurationResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/sources")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/ExternalAPITokenizationResource.java
    • src/main/java/io/aurigraph/v11/api/PriceFeedResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/sources/{id}")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/ExternalAPITokenizationResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/staking/info")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/Phase2BlockchainResource.java
    • src/main/java/io/aurigraph/v11/portal/PortalAPIGateway.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/statistics")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/BridgeStatusResource.java
    • src/main/java/io/aurigraph/v11/api/NetworkMonitoringResource.java
    • src/main/java/io/aurigraph/v11/smartcontract/SmartContractResource.java
    • src/main/java/io/aurigraph/v11/tokenization/traceability/TokenTraceabilityResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/stats")[0m
  Files:
    • src/main/java/io/aurigraph/v11/AurigraphResource.java
    • src/main/java/io/aurigraph/v11/api/BlockchainApiResource.java
    • src/main/java/io/aurigraph/v11/api/BridgeApiResource.java
    • src/main/java/io/aurigraph/v11/api/CompositeTokenResource.java
    • src/main/java/io/aurigraph/v11/api/DataFeedResource.java
    • src/main/java/io/aurigraph/v11/api/FeedTokenResource.java
    • src/main/java/io/aurigraph/v11/api/LiveChannelApiResource.java
    • src/main/java/io/aurigraph/v11/api/NetworkResource.java
    • src/main/java/io/aurigraph/v11/mobile/MobileAppResource.java
    • src/main/java/io/aurigraph/v11/tokens/TokenResource.java
    • src/main/java/io/aurigraph/v11/verification/VerificationCertificateResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/status")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/AIApiResource.java
    • src/main/java/io/aurigraph/v11/api/BridgeStatusResource.java
    • src/main/java/io/aurigraph/v11/api/ConsensusApiResource.java
    • src/main/java/io/aurigraph/v11/api/CryptoApiResource.java
    • src/main/java/io/aurigraph/v11/api/EnterpriseResource.java
    • src/main/java/io/aurigraph/v11/api/HSMStatusResource.java
    • src/main/java/io/aurigraph/v11/api/OracleStatusResource.java
    • src/main/java/io/aurigraph/v11/api/RWAApiResource.java
    • src/main/java/io/aurigraph/v11/api/SecurityApiResource.java
    • src/main/java/io/aurigraph/v11/api/gateway/ApiGateway.java
    • src/main/java/io/aurigraph/v11/security/SecurityAuditService.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/summary")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/BridgeHistoryResource.java
    • src/main/java/io/aurigraph/v11/api/CarbonTrackingResource.java
    • src/main/java/io/aurigraph/v11/api/NodeManagementResource.java
    • src/main/java/io/aurigraph/v11/api/OracleStatusResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/system/status")[0m
  Files:
    • src/main/java/io/aurigraph/v11/AurigraphResource.java
    • src/main/java/io/aurigraph/v11/portal/PortalAPIGateway.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/tenants")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/Phase4EnterpriseResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/tokens")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/RWAApiResource.java
    • src/main/java/io/aurigraph/v11/portal/PortalAPIGateway.java
    • src/main/java/io/aurigraph/v11/tokenization/traceability/TokenTraceabilityResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/tokens/{tokenId}")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/RWAApiResource.java
    • src/main/java/io/aurigraph/v11/tokenization/traceability/TokenTraceabilityResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/transactions")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/BlockchainApiResource.java
    • src/main/java/io/aurigraph/v11/api/ExternalAPITokenizationResource.java
    • src/main/java/io/aurigraph/v11/api/Sprint9AnalyticsResource.java
    • src/main/java/io/aurigraph/v11/portal/PortalAPIGateway.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/transactions/{id}")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/ExternalAPITokenizationResource.java
    • src/main/java/io/aurigraph/v11/portal/PortalAPIGateway.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/transfer")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/BridgeApiResource.java
    • src/main/java/io/aurigraph/v11/api/RWAApiResource.java
    • src/main/java/io/aurigraph/v11/tokens/TokenResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/transfers")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/CrossChainBridgeResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/users/{userId}")[0m
  Files:
    • src/main/java/io/aurigraph/v11/mobile/MobileAppResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/validators")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/BlockchainApiResource.java
    • src/main/java/io/aurigraph/v11/api/Phase2BlockchainResource.java
    • src/main/java/io/aurigraph/v11/api/Sprint9AnalyticsResource.java
    • src/main/java/io/aurigraph/v11/live/LiveDataResource.java
    • src/main/java/io/aurigraph/v11/portal/PortalAPIGateway.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/{compositeId}/secondary-tokens/{tokenType}")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/CompositeTokenResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/{contractId}")[0m
  Files:
    • src/main/java/io/aurigraph/v11/contracts/ActiveContractResource.java
    • src/main/java/io/aurigraph/v11/contracts/RicardianContractResource.java
    • src/main/java/io/aurigraph/v11/smartcontract/SmartContractResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/{contractId}/activate")[0m
  Files:
    • src/main/java/io/aurigraph/v11/contracts/ActiveContractResource.java
    • src/main/java/io/aurigraph/v11/contracts/RicardianContractResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/{contractId}/execute")[0m
  Files:
    • src/main/java/io/aurigraph/v11/contracts/ActiveContractResource.java
    • src/main/java/io/aurigraph/v11/smartcontract/SmartContractResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/{contractId}/executions")[0m
  Files:
    • src/main/java/io/aurigraph/v11/contracts/ActiveContractResource.java
    • src/main/java/io/aurigraph/v11/smartcontract/SmartContractResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/{contractId}/pause")[0m
  Files:
    • src/main/java/io/aurigraph/v11/contracts/ActiveContractResource.java
    • src/main/java/io/aurigraph/v11/smartcontract/SmartContractResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/{contractId}/resume")[0m
  Files:
    • src/main/java/io/aurigraph/v11/contracts/ActiveContractResource.java
    • src/main/java/io/aurigraph/v11/smartcontract/SmartContractResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/{contractId}/sign")[0m
  Files:
    • src/main/java/io/aurigraph/v11/contracts/ActiveContractResource.java
    • src/main/java/io/aurigraph/v11/contracts/RicardianContractResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/{contractId}/state")[0m
  Files:
    • src/main/java/io/aurigraph/v11/contracts/ActiveContractResource.java
    • src/main/java/io/aurigraph/v11/smartcontract/SmartContractResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/{id}")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/ChannelResource.java
    • src/main/java/io/aurigraph/v11/api/DataFeedResource.java
    • src/main/java/io/aurigraph/v11/api/LiveChannelApiResource.java
    • src/main/java/io/aurigraph/v11/api/ValidatorResource.java
    • src/main/java/io/aurigraph/v11/demo/api/DemoResource.java
    • src/main/java/io/aurigraph/v11/user/RoleResource.java
    • src/main/java/io/aurigraph/v11/user/UserResource.java
    • src/main/java/io/aurigraph/v11/verification/VerificationCertificateResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/{id}/data")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/DataFeedResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/{id}/messages")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/ChannelResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: .*}")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/AIApiResource.java
    • src/main/java/io/aurigraph/v11/api/BlockchainApiResource.java
    • src/main/java/io/aurigraph/v11/api/BridgeHistoryResource.java
    • src/main/java/io/aurigraph/v11/api/BridgeStatusResource.java
    • src/main/java/io/aurigraph/v11/api/ChannelResource.java
    • src/main/java/io/aurigraph/v11/api/CompositeTokenResource.java
    • src/main/java/io/aurigraph/v11/api/CrossChainBridgeResource.java
    • src/main/java/io/aurigraph/v11/api/DataFeedResource.java
    • src/main/java/io/aurigraph/v11/api/EnterpriseSettingsResource.java
    • src/main/java/io/aurigraph/v11/api/ExternalAPITokenizationResource.java
    • src/main/java/io/aurigraph/v11/api/FeedTokenResource.java
    • src/main/java/io/aurigraph/v11/api/LiveChannelApiResource.java
    • src/main/java/io/aurigraph/v11/api/NodeManagementResource.java
    • src/main/java/io/aurigraph/v11/api/OracleStatusResource.java
    • src/main/java/io/aurigraph/v11/api/Phase2BlockchainResource.java
    • src/main/java/io/aurigraph/v11/api/Phase2ComprehensiveApiResource.java
    • src/main/java/io/aurigraph/v11/api/Phase4EnterpriseResource.java
    • src/main/java/io/aurigraph/v11/api/PriceFeedResource.java
    • src/main/java/io/aurigraph/v11/api/RWAApiResource.java
    • src/main/java/io/aurigraph/v11/api/SecurityApiResource.java
    • src/main/java/io/aurigraph/v11/api/ValidatorResource.java
    • src/main/java/io/aurigraph/v11/api/gateway/ApiGateway.java
    • src/main/java/io/aurigraph/v11/contracts/ActiveContractResource.java
    • src/main/java/io/aurigraph/v11/contracts/ContractCompiler.java
    • src/main/java/io/aurigraph/v11/contracts/RicardianContractResource.java
    • src/main/java/io/aurigraph/v11/contracts/SmartContractService.java
    • src/main/java/io/aurigraph/v11/contracts/defi/DeFiIntegrationService.java
    • src/main/java/io/aurigraph/v11/contracts/enterprise/EnterpriseDashboardService.java
    • src/main/java/io/aurigraph/v11/demo/api/ChannelNodeResource.java
    • src/main/java/io/aurigraph/v11/demo/api/DemoResource.java
    • src/main/java/io/aurigraph/v11/governance/GovernanceResource.java
    • src/main/java/io/aurigraph/v11/live/LiveDataResource.java
    • src/main/java/io/aurigraph/v11/mobile/MobileAppResource.java
    • src/main/java/io/aurigraph/v11/portal/PortalAPIGateway.java
    • src/main/java/io/aurigraph/v11/registry/RegistryResource.java
    • src/main/java/io/aurigraph/v11/security/LevelDBValidator.java
    • src/main/java/io/aurigraph/v11/smartcontract/SmartContractResource.java
    • src/main/java/io/aurigraph/v11/tokenization/traceability/TokenTraceabilityResource.java
    • src/main/java/io/aurigraph/v11/tokens/TokenResource.java
    • src/main/java/io/aurigraph/v11/user/Role.java
    • src/main/java/io/aurigraph/v11/user/RoleResource.java
    • src/main/java/io/aurigraph/v11/user/RoleService.java
    • src/main/java/io/aurigraph/v11/user/UserResource.java
    • src/main/java/io/aurigraph/v11/verification/VerificationCertificateResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/api/v11/ai")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/AIApiResource.java
    • src/main/java/io/aurigraph/v11/api/AIModelMetricsApiResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/api/v11/analytics")[0m
  Files:
    • src/main/java/io/aurigraph/v11/analytics/AnalyticsResource.java
    • src/main/java/io/aurigraph/v11/api/Sprint9AnalyticsResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/api/v11/blockchain")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/BlockchainSearchApiResource.java
    • src/main/java/io/aurigraph/v11/api/NetworkTopologyApiResource.java
    • src/main/java/io/aurigraph/v11/api/Phase2BlockchainResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/api/v11/bridge")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/BridgeApiResource.java
    • src/main/java/io/aurigraph/v11/api/BridgeStatusResource.java
    • src/main/java/io/aurigraph/v11/api/BridgeTransferApiResource.java
    • src/main/java/io/aurigraph/v11/api/CrossChainBridgeResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/api/v11/consensus")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/ConsensusApiResource.java
    • src/main/java/io/aurigraph/v11/api/ConsensusDetailsApiResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/api/v11/datafeeds")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/DataFeedResource.java
    • src/main/java/io/aurigraph/v11/api/PriceFeedResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/api/v11/enterprise")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/EnterpriseResource.java
    • src/main/java/io/aurigraph/v11/api/EnterpriseSettingsResource.java
    • src/main/java/io/aurigraph/v11/api/Phase4EnterpriseResource.java
    • src/main/java/io/aurigraph/v11/contracts/enterprise/EnterpriseDashboardService.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/api/v11/live")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/LiveDataResource.java
    • src/main/java/io/aurigraph/v11/live/LiveDataResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/api/v11/rwa")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/RWAApiResource.java
    • src/main/java/io/aurigraph/v11/api/RWAPortfolioApiResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/api/v11/security")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/SecurityApiResource.java
    • src/main/java/io/aurigraph/v11/api/SecurityAuditApiResource.java
  Severity: CRITICAL - Will cause build failure

[1;33m  Path: @Path("/api/v11/validators")[0m
  Files:
    • src/main/java/io/aurigraph/v11/api/ValidatorManagementApiResource.java
    • src/main/java/io/aurigraph/v11/api/ValidatorResource.java
  Severity: CRITICAL - Will cause build failure

FAILED

### Docker Containers
[0;34m🔍 Scanning Docker containers...[0m
[0;32m✅ No duplicate containers found[0m
[0;31m⚠️  DUPLICATE PORT BINDINGS DETECTED[0m
[1;33m  Port: 24224[0m
  Severity: CRITICAL - Port conflict
FAILED

### File Declarations
[0;34m🔍 Scanning file declarations...[0m
[0;31m⚠️  DUPLICATE FILE DECLARATIONS DETECTED[0m
[1;33m  File: AIApiPerformanceTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/api/AIApiPerformanceTest.java
    • src/test.bak/java/io/aurigraph/v11/api/AIApiPerformanceTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: ActiveContract.java[0m
  Locations:
    • src/main/java/io/aurigraph/v11/contracts/ActiveContract.java
    • src/main/java/io/aurigraph/v11/contracts/models/ActiveContract.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: AnomalyDetectionServiceTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/ai/AnomalyDetectionServiceTest.java
    • src/test.bak/java/io/aurigraph/v11/ai/AnomalyDetectionServiceTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: AvalancheAdapterTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/bridge/adapters/AvalancheAdapterTest.java
    • src/test.bak/java/io/aurigraph/v11/bridge/adapters/AvalancheAdapterTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: BSCAdapterTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/bridge/adapters/BSCAdapterTest.java
    • src/test.bak/java/io/aurigraph/v11/bridge/adapters/BSCAdapterTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: BaseTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/BaseTest.java
    • src/test.bak/java/io/aurigraph/v11/BaseTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: BridgeIntegrationTestProfile.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/bridge/BridgeIntegrationTestProfile.java
    • src/test.bak/java/io/aurigraph/v11/bridge/BridgeIntegrationTestProfile.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: BridgeTransaction.java[0m
  Locations:
    • src/main/java/io/aurigraph/v11/bridge/BridgeTransaction.java
    • src/main/java/io/aurigraph/v11/models/BridgeTransaction.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: Channel.java[0m
  Locations:
    • src/main/java/io/aurigraph/v11/demo/models/Channel.java
    • src/main/java/io/aurigraph/v11/channels/models/Channel.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: CompositeTokenRequest.java[0m
  Locations:
    • src/main/java/io/aurigraph/v11/contracts/composite/CompositeTokenRequest.java
    • src/main/java/io/aurigraph/v11/api/CompositeTokenRequest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: ComprehensiveApiEndpointTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/ComprehensiveApiEndpointTest.java
    • src/test.bak/java/io/aurigraph/v11/ComprehensiveApiEndpointTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: ConsensusServiceImpl.java[0m
  Locations:
    • src/main/java-disabled/ConsensusServiceImpl.java
    • src/main/java/io/aurigraph/v11/grpc/ConsensusServiceImpl.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: ContractExecution.java[0m
  Locations:
    • src/main/java/io/aurigraph/v11/contracts/ContractExecution.java
    • src/main/java/io/aurigraph/v11/smartcontract/ContractExecution.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: ContractStatus.java[0m
  Locations:
    • src/main/java/io/aurigraph/v11/contracts/models/ContractStatus.java
    • src/main/java/io/aurigraph/v11/contracts/ContractStatus.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: CosmosAdapterTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/bridge/adapters/CosmosAdapterTest.java
    • src/test.bak/java/io/aurigraph/v11/bridge/adapters/CosmosAdapterTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: CrossChainBridgeTestProfile.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/bridge/CrossChainBridgeTestProfile.java
    • src/test.bak/java/io/aurigraph/v11/bridge/CrossChainBridgeTestProfile.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: DemoResourceIntegrationTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/demo/api/DemoResourceIntegrationTest.java
    • src/test.bak/java/io/aurigraph/v11/demo/api/DemoResourceIntegrationTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: DilithiumSignatureServiceTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/crypto/DilithiumSignatureServiceTest.java
    • src/test.bak/java/io/aurigraph/v11/crypto/DilithiumSignatureServiceTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: EndpointIntegrationTests.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/integration/EndpointIntegrationTests.java
    • src/test.bak/java/io/aurigraph/v11/integration/EndpointIntegrationTests.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: EnterprisePortalServiceTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/portal/EnterprisePortalServiceTest.java
    • src/test.bak/java/io/aurigraph/v11/portal/EnterprisePortalServiceTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: EnterpriseSettingsResourceTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/api/EnterpriseSettingsResourceTest.java
    • src/test.bak/java/io/aurigraph/v11/api/EnterpriseSettingsResourceTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: EthereumAdapterTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/bridge/adapters/EthereumAdapterTest.java
    • src/test.bak/java/io/aurigraph/v11/bridge/adapters/EthereumAdapterTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: EthereumBridgeServiceTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/bridge/EthereumBridgeServiceTest.java
    • src/test.bak/java/io/aurigraph/v11/bridge/EthereumBridgeServiceTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: GovernanceServiceTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/governance/GovernanceServiceTest.java
    • src/test.bak/java/io/aurigraph/v11/governance/GovernanceServiceTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: GrpcServiceTestProfile.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/GrpcServiceTestProfile.java
    • src/test.bak/java/io/aurigraph/v11/GrpcServiceTestProfile.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: HSMCryptoTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/crypto/HSMCryptoTest.java
    • src/test.bak/java/io/aurigraph/v11/crypto/HSMCryptoTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: HighPerformanceGrpcService.java[0m
  Locations:
    • src/main/java-disabled/HighPerformanceGrpcService.java
    • src/main/java/io/aurigraph/v11/grpc/HighPerformanceGrpcService.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: HighPerformanceGrpcServiceTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/grpc/HighPerformanceGrpcServiceTest.java
    • src/test.bak/java/io/aurigraph/v11/grpc/HighPerformanceGrpcServiceTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: HyperRAFTConsensusServiceTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/consensus/HyperRAFTConsensusServiceTest.java
    • src/test.bak/java/io/aurigraph/v11/consensus/HyperRAFTConsensusServiceTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: IntegrationTestBase.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/IntegrationTestBase.java
    • src/test.bak/java/io/aurigraph/v11/IntegrationTestBase.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: IntegrationTestSuite.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/integration/IntegrationTestSuite.java
    • src/test.bak/java/io/aurigraph/v11/integration/IntegrationTestSuite.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: KyberKeyEncapsulationTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/crypto/KyberKeyEncapsulationTest.java
    • src/test.bak/java/io/aurigraph/v11/crypto/KyberKeyEncapsulationTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: LendingProtocolService.java[0m
  Locations:
    • src/main/java/io/aurigraph/v11/contracts/defi/LendingProtocolService.java
    • src/main/java/io/aurigraph/v11/defi/services/LendingProtocolService.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: LevelDBRepository.java[0m
  Locations:
    • src/main/java/io/aurigraph/v11/repository/LevelDBRepository.java
    • src/main/java/io/aurigraph/v11/storage/LevelDBRepository.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: LiquidityPoolManager.java[0m
  Locations:
    • src/main/java/io/aurigraph/v11/bridge/LiquidityPoolManager.java
    • src/main/java/io/aurigraph/v11/contracts/defi/LiquidityPoolManager.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: LiveDataResource.java[0m
  Locations:
    • src/main/java/io/aurigraph/v11/live/LiveDataResource.java
    • src/main/java/io/aurigraph/v11/api/LiveDataResource.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: LogReplicationTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/consensus/LogReplicationTest.java
    • src/test.bak/java/io/aurigraph/v11/consensus/LogReplicationTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: MLIntegrationTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/ai/MLIntegrationTest.java
    • src/test.bak/java/io/aurigraph/v11/ai/MLIntegrationTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: MLLoadBalancerTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/ai/MLLoadBalancerTest.java
    • src/test.bak/java/io/aurigraph/v11/ai/MLLoadBalancerTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: ModelTestBase.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/ModelTestBase.java
    • src/test.bak/java/io/aurigraph/v11/ModelTestBase.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: NISTVectorTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/crypto/NISTVectorTest.java
    • src/test.bak/java/io/aurigraph/v11/crypto/NISTVectorTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: NetworkMonitoringServiceTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/monitoring/NetworkMonitoringServiceTest.java
    • src/test.bak/java/io/aurigraph/v11/monitoring/NetworkMonitoringServiceTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: Node.java[0m
  Locations:
    • src/main/java/io/aurigraph/v11/demo/nodes/Node.java
    • src/main/java/io/aurigraph/v11/models/Node.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: NodeManagementResourceTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/api/NodeManagementResourceTest.java
    • src/test.bak/java/io/aurigraph/v11/api/NodeManagementResourceTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: NodeStatus.java[0m
  Locations:
    • src/main/java/io/aurigraph/v11/demo/models/NodeStatus.java
    • src/main/java/io/aurigraph/v11/demo/state/NodeStatus.java
    • src/main/java/io/aurigraph/v11/models/NodeStatus.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: NodeType.java[0m
  Locations:
    • src/main/java/io/aurigraph/v11/demo/models/NodeType.java
    • src/main/java/io/aurigraph/v11/demo/state/NodeType.java
    • src/main/java/io/aurigraph/v11/models/NodeType.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: OnlineLearningServiceTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/ai/OnlineLearningServiceTest.java
    • src/test/java/io/aurigraph/v11/OnlineLearningServiceTest.java
    • src/test.bak/java/io/aurigraph/v11/ai/OnlineLearningServiceTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: ParallelTransactionExecutorTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/execution/ParallelTransactionExecutorTest.java
    • src/test.bak/java/io/aurigraph/v11/execution/ParallelTransactionExecutorTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: PerformanceOptimizationTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/PerformanceOptimizationTest.java
    • src/test.bak/java/io/aurigraph/v11/PerformanceOptimizationTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: PerformanceTests.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/integration/PerformanceTests.java
    • src/test.bak/java/io/aurigraph/v11/integration/PerformanceTests.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: Phase1EndpointsTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/api/Phase1EndpointsTest.java
    • src/test.bak/java/io/aurigraph/v11/api/Phase1EndpointsTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: Phase2EndpointsTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/api/Phase2EndpointsTest.java
    • src/test.bak/java/io/aurigraph/v11/api/Phase2EndpointsTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: Phase4AOptimizationTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/performance/Phase4AOptimizationTest.java
    • src/test.bak/java/io/aurigraph/v11/performance/Phase4AOptimizationTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: PolkadotAdapterTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/bridge/adapters/PolkadotAdapterTest.java
    • src/test.bak/java/io/aurigraph/v11/bridge/adapters/PolkadotAdapterTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: PolygonAdapterTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/bridge/adapters/PolygonAdapterTest.java
    • src/test.bak/java/io/aurigraph/v11/bridge/adapters/PolygonAdapterTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: PredictiveTransactionOrderingTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/ai/PredictiveTransactionOrderingTest.java
    • src/test.bak/java/io/aurigraph/v11/ai/PredictiveTransactionOrderingTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: QuantumCryptoBenchmarkTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/crypto/QuantumCryptoBenchmarkTest.java
    • src/test.bak/java/io/aurigraph/v11/crypto/QuantumCryptoBenchmarkTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: QuantumCryptoService.java[0m
  Locations:
    • src/main/java/io/aurigraph/v11/crypto/QuantumCryptoService.java
    • src/main/java/io/aurigraph/v11/services/QuantumCryptoService.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: QuantumCryptoServiceTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/crypto/QuantumCryptoServiceTest.java
    • src/test.bak/java/io/aurigraph/v11/crypto/QuantumCryptoServiceTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: RaftLeaderElectionTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/consensus/RaftLeaderElectionTest.java
    • src/test.bak/java/io/aurigraph/v11/consensus/RaftLeaderElectionTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: SecurityConfiguration.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/SecurityConfiguration.java
    • src/test.bak/java/io/aurigraph/v11/SecurityConfiguration.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: ServiceTestBase.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/ServiceTestBase.java
    • src/test.bak/java/io/aurigraph/v11/ServiceTestBase.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: SmartContract.java[0m
  Locations:
    • src/main/java/io/aurigraph/v11/contracts/models/SmartContract.java
    • src/main/java/io/aurigraph/v11/smartcontract/SmartContract.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: SmartContractService.java[0m
  Locations:
    • src/main/java/io/aurigraph/v11/contracts/SmartContractService.java
    • src/main/java/io/aurigraph/v11/smartcontract/SmartContractService.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: SmartContractServiceTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/contracts/SmartContractServiceTest.java
    • src/test.bak/java/io/aurigraph/v11/contracts/SmartContractServiceTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: SmartContractTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/contracts/SmartContractTest.java
    • src/test.bak/java/io/aurigraph/v11/contracts/SmartContractTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: SolanaAdapterTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/bridge/adapters/SolanaAdapterTest.java
    • src/test.bak/java/io/aurigraph/v11/bridge/adapters/SolanaAdapterTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: SystemMonitoringServiceTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/monitoring/SystemMonitoringServiceTest.java
    • src/test.bak/java/io/aurigraph/v11/monitoring/SystemMonitoringServiceTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: TestDataBuilder.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/integration/TestDataBuilder.java
    • src/test.bak/java/io/aurigraph/v11/integration/TestDataBuilder.java
    • src/test.bak/java/io/aurigraph/v11/tokenization/TestDataBuilder.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: Token.java[0m
  Locations:
    • src/main/java/io/aurigraph/v11/tokenization/aggregation/models/Token.java
    • src/main/java/io/aurigraph/v11/tokens/models/Token.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: TokenEndpointsIntegrationTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/TokenEndpointsIntegrationTest.java
    • src/test.bak/java/io/aurigraph/v11/TokenEndpointsIntegrationTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: TokenEndpointsTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/TokenEndpointsTest.java
    • src/test.bak/java/io/aurigraph/v11/TokenEndpointsTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: TokenRegistryServiceTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/models/TokenRegistryServiceTest.java
    • src/test.bak/java/io/aurigraph/v11/models/TokenRegistryServiceTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: TokenType.java[0m
  Locations:
    • src/main/java/io/aurigraph/v11/contracts/composite/TokenType.java
    • src/main/java/io/aurigraph/v11/models/TokenType.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: TransactionServiceTestProfile.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/TransactionServiceTestProfile.java
    • src/test.bak/java/io/aurigraph/v11/TransactionServiceTestProfile.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: WebSocketBroadcasterTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/websocket/WebSocketBroadcasterTest.java
    • src/test.bak/java/io/aurigraph/v11/websocket/WebSocketBroadcasterTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: WebSocketDTOTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/websocket/WebSocketDTOTest.java
    • src/test.bak/java/io/aurigraph/v11/websocket/WebSocketDTOTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: WebSocketIntegrationTest.java[0m
  Locations:
    • src/test/java/io/aurigraph/v11/websocket/WebSocketIntegrationTest.java
    • src/test.bak/java/io/aurigraph/v11/websocket/WebSocketIntegrationTest.java
  Severity: WARNING - May cause compilation issues

[1;33m  File: YieldFarmingService.java[0m
  Locations:
    • src/main/java/io/aurigraph/v11/contracts/defi/YieldFarmingService.java
    • src/main/java/io/aurigraph/v11/defi/services/YieldFarmingService.java
  Severity: WARNING - May cause compilation issues

### Dependencies
[0;34m🔍 Scanning for circular dependencies...[0m
[1;33m⚠️  POTENTIAL CIRCULAR DEPENDENCIES DETECTED[0m
  Dependency: {
  Severity: WARNING - Monitor in integration testing

### Port Assignments
[0;34m🔍 Scanning port assignments...[0m
Found ports in application.properties: 0
8081
9003
9004
9005
9099
[0;32m✅ Port 9003 assigned to Quarkus HTTP[0m
[0;32m✅ Port 9004 assigned to gRPC[0m

---

## Action Items

- [ ] Review all critical issues above
- [ ] Consolidate duplicate endpoints if found
- [ ] Fix container port conflicts if found
- [ ] Remove duplicate file declarations if found
- [ ] Review circular dependencies if found

---

**Report Generated**: Sat Nov  1 11:49:45 IST 2025
**Severity Level**: OK

