package io.aurigraph.v11;

import io.aurigraph.v11.bridge.EthereumBridgeService;
import io.aurigraph.v11.bridge.adapters.EthereumAdapter;
import io.aurigraph.v11.monitoring.SystemMonitoringService;
import io.aurigraph.v11.monitoring.NetworkMonitoringService;
import io.aurigraph.v11.monitoring.MetricsCollectorService;
import io.aurigraph.v11.execution.ParallelTransactionExecutor;
import io.aurigraph.v11.crypto.QuantumCryptoProvider;
import io.aurigraph.v11.crypto.HSMCryptoService;
import io.aurigraph.v11.portal.EnterprisePortalService;
import io.aurigraph.v11.contracts.ActiveContractService;
import io.aurigraph.v11.contracts.SmartContractService;
import io.aurigraph.v11.contracts.enterprise.EnterpriseDashboardService;
import io.aurigraph.v11.blockchain.governance.GovernanceStatsService;
// import io.aurigraph.v11.blockchain.MempoolService;  // Removed - class deleted
import io.aurigraph.v11.storage.LevelDBStorageService;
// import io.aurigraph.v11.api.Phase2BlockchainService;  // Removed - class deleted
import io.quarkus.test.Mock;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import jakarta.inject.Named;
import org.mockito.Mockito;

/**
 * Test bean producer for mocking unimplemented services
 * This prevents CDI unsatisfied dependency errors during testing
 * Added @Named qualifiers to resolve bean ambiguity issues
 */
@ApplicationScoped
public class TestBeansProducer {

    @Produces
    @Mock
    @Named("test-ethereum-bridge")
    @ApplicationScoped
    public EthereumBridgeService ethereumBridgeService() {
        return Mockito.mock(EthereumBridgeService.class);
    }

    @Produces
    @Mock
    @Named("test-system-monitoring")
    @ApplicationScoped
    public SystemMonitoringService systemMonitoringService() {
        return Mockito.mock(SystemMonitoringService.class);
    }

    @Produces
    @Mock
    @Named("test-network-monitoring")
    @ApplicationScoped
    public NetworkMonitoringService networkMonitoringService() {
        return Mockito.mock(NetworkMonitoringService.class);
    }

    // Disabled - MetricsCollectorService not yet implemented
    // @Produces
    // @Mock
    // @ApplicationScoped
    // public MetricsCollectorService metricsCollectorService() {
    //     return Mockito.mock(MetricsCollectorService.class);
    // }

    @Produces
    @Mock
    @Named("test-parallel-transaction-executor")
    @ApplicationScoped
    public ParallelTransactionExecutor parallelTransactionExecutor() {
        return Mockito.mock(ParallelTransactionExecutor.class);
    }

    @Produces
    @Mock
    @Named("test-ethereum-adapter")
    @ApplicationScoped
    public EthereumAdapter ethereumAdapter() {
        return Mockito.mock(EthereumAdapter.class);
    }

    @Produces
    @Mock
    @Named("test-quantum-crypto-provider")
    @ApplicationScoped
    public QuantumCryptoProvider quantumCryptoProvider() {
        return Mockito.mock(QuantumCryptoProvider.class);
    }

    @Produces
    @Mock
    @Named("test-hsm-crypto-service")
    @ApplicationScoped
    public HSMCryptoService hsmCryptoService() {
        return Mockito.mock(HSMCryptoService.class);
    }

    @Produces
    @Mock
    @Named("test-enterprise-portal-service")
    @ApplicationScoped
    public EnterprisePortalService enterprisePortalService() {
        return Mockito.mock(EnterprisePortalService.class);
    }

    @Produces
    @Mock
    @Named("test-active-contract-service")
    @ApplicationScoped
    public ActiveContractService activeContractService() {
        return Mockito.mock(ActiveContractService.class);
    }

    @Produces
    @Mock
    @Named("test-smart-contract-service")
    @ApplicationScoped
    public SmartContractService smartContractService() {
        return Mockito.mock(SmartContractService.class);
    }

    @Produces
    @Mock
    @Named("test-enterprise-dashboard-service")
    @ApplicationScoped
    public EnterpriseDashboardService enterpriseDashboardService() {
        return Mockito.mock(EnterpriseDashboardService.class);
    }

    @Produces
    @Mock
    @Named("test-governance-stats-service")
    @ApplicationScoped
    public GovernanceStatsService governanceStatsService() {
        return Mockito.mock(GovernanceStatsService.class);
    }

    // Disabled - MempoolService not yet implemented
    // @Produces
    // @Mock
    // @ApplicationScoped
    // public MempoolService mempoolService() {
    //     return Mockito.mock(MempoolService.class);
    // }

    @Produces
    @Mock
    @Named("test-leveldb-storage-service")
    @ApplicationScoped
    public LevelDBStorageService levelDBStorageService() {
        return Mockito.mock(LevelDBStorageService.class);
    }

    // Disabled - Phase2BlockchainService not yet implemented
    // @Produces
    // @Mock
    // @ApplicationScoped
    // public Phase2BlockchainService phase2BlockchainService() {
    //     return Mockito.mock(Phase2BlockchainService.class);
    // }
}
