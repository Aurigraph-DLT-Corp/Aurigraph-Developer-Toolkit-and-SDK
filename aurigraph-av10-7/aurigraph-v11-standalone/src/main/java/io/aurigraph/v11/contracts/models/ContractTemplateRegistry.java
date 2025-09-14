package io.aurigraph.v11.contracts.models;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registry for managing contract templates
 */
public class ContractTemplateRegistry {
    
    private static final Map<String, ContractTemplate> templates = new ConcurrentHashMap<>();
    
    static {
        // Initialize with default templates
        initializeDefaultTemplates();
    }
    
    /**
     * Get all available templates
     */
    public static List<ContractTemplate> getAllTemplates() {
        return new ArrayList<>(templates.values());
    }
    
    /**
     * Get a specific template by ID
     */
    public static ContractTemplate getTemplate(String templateId) {
        return templates.get(templateId);
    }
    
    /**
     * Register a new template
     */
    public static void registerTemplate(ContractTemplate template) {
        if (template != null && template.getTemplateId() != null) {
            templates.put(template.getTemplateId(), template);
        }
    }
    
    /**
     * Remove a template
     */
    public static boolean removeTemplate(String templateId) {
        return templates.remove(templateId) != null;
    }
    
    /**
     * Check if template exists
     */
    public static boolean templateExists(String templateId) {
        return templates.containsKey(templateId);
    }
    
    /**
     * Get templates by category
     */
    public static List<ContractTemplate> getTemplatesByCategory(String category) {
        return templates.values().stream()
            .filter(template -> category.equals(template.getCategory()))
            .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
    }
    
    private static void initializeDefaultTemplates() {
        // RWA Template
        ContractTemplate rwaTemplate = new ContractTemplate();
        rwaTemplate.setTemplateId("RWA_STANDARD_V1");
        rwaTemplate.setName("Real World Asset Tokenization");
        rwaTemplate.setCategory("RWA");
        rwaTemplate.setContractType("RWA_TOKENIZATION");
        rwaTemplate.setAssetType("REAL_ESTATE");
        rwaTemplate.setJurisdiction("US_DELAWARE");
        rwaTemplate.setLegalText("This Ricardian Contract represents the tokenization of a real-world asset...");
        rwaTemplate.setDescription("Standard template for tokenizing real-world assets");
        templates.put(rwaTemplate.getTemplateId(), rwaTemplate);
        
        // Carbon Credit Template
        ContractTemplate carbonTemplate = new ContractTemplate();
        carbonTemplate.setTemplateId("CARBON_CREDIT_V1");
        carbonTemplate.setName("Carbon Credit Trading");
        carbonTemplate.setCategory("ENVIRONMENTAL");
        carbonTemplate.setContractType("CARBON_TRADING");
        carbonTemplate.setAssetType("CARBON_CREDIT");
        carbonTemplate.setJurisdiction("INTERNATIONAL");
        carbonTemplate.setLegalText("This Ricardian Contract governs the trading of verified carbon credits...");
        carbonTemplate.setDescription("Template for carbon credit trading and verification");
        templates.put(carbonTemplate.getTemplateId(), carbonTemplate);
        
        // Supply Chain Template
        ContractTemplate supplyTemplate = new ContractTemplate();
        supplyTemplate.setTemplateId("SUPPLY_CHAIN_V1");
        supplyTemplate.setName("Supply Chain Tracking");
        supplyTemplate.setCategory("LOGISTICS");
        supplyTemplate.setContractType("SUPPLY_CHAIN");
        supplyTemplate.setAssetType("SUPPLY_CHAIN");
        supplyTemplate.setJurisdiction("INTERNATIONAL");
        supplyTemplate.setLegalText("This Ricardian Contract tracks goods through the supply chain...");
        supplyTemplate.setDescription("Template for supply chain tracking and verification");
        templates.put(supplyTemplate.getTemplateId(), supplyTemplate);
    }
}