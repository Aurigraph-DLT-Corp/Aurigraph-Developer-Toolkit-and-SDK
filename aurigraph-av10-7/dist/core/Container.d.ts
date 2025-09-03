/**
 * AV10-7 Dependency Injection Container
 *
 * Configures dependency injection for all AV10-7 components including
 * the revolutionary Quantum Nexus functionality.
 *
 * @version 10.0.0
 * @author Aurigraph Team
 * @license MIT
 */
import { Container } from 'inversify';
import 'reflect-metadata';
import { AV10Node } from './AV10Node';
import { QuantumNexus } from './QuantumNexus';
import { QuantumNexusController } from '../api/QuantumNexusController';
import { MonitoringAPIServer } from '../api/MonitoringAPIServer';
declare const container: Container;
export { container };
/**
 * Container factory for creating configured instances
 */
export declare class ContainerFactory {
    /**
     * Create a fully configured AV10 Node with Quantum Nexus
     */
    static createAV10Node(): Promise<AV10Node>;
    /**
     * Create a standalone Quantum Nexus instance
     */
    static createQuantumNexus(): Promise<QuantumNexus>;
    /**
     * Create a monitoring API server with quantum endpoints
     */
    static createMonitoringAPIServer(): MonitoringAPIServer;
    /**
     * Create a quantum nexus controller
     */
    static createQuantumNexusController(): QuantumNexusController;
    /**
     * Get container instance for manual dependency resolution
     */
    static getContainer(): Container;
}
/**
 * Quantum Nexus Service Locator
 * Provides easy access to quantum-specific services
 */
export declare class QuantumServiceLocator {
    /**
     * Get the quantum nexus instance
     */
    static getQuantumNexus(): QuantumNexus;
    /**
     * Get the AV10 node with quantum capabilities
     */
    static getAV10Node(): AV10Node;
    /**
     * Get the quantum nexus controller
     */
    static getQuantumController(): QuantumNexusController;
    /**
     * Get quantum configuration values
     */
    static getQuantumConfig(): any;
}
/**
 * Initialize the container with quantum nexus capabilities
 */
export declare function initializeQuantumContainer(): Promise<void>;
export default container;
//# sourceMappingURL=Container.d.ts.map