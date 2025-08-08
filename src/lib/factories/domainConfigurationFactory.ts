/**
 * Domain Configuration Factory
 * Creates and manages domain-specific configurations for AI generation
 */

import type {
  DomainType,
  DomainConfig,
  DomainTemplate,
  DomainConfigOptions,
  DomainEvaluationCriteria,
} from "../types/domainTypes.js";
import type { GenerateOptions } from "../types/generateTypes.js";
import { logger } from "../utils/logger.js";

/**
 * Factory for creating domain-specific configurations
 */
export class DomainConfigurationFactory {
  // Eagerly initialized singleton instance for consistency and thread safety
  private static instance: DomainConfigurationFactory =
    new DomainConfigurationFactory();
  private registeredTemplates: Map<DomainType, DomainTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  static getInstance(): DomainConfigurationFactory {
    // Eagerly initialized singleton - thread-safe and consistent across all environments
    return this.instance;
  }

  /**
   * Register a domain template
   */
  registerDomainTemplate(template: DomainTemplate): void {
    logger.debug(`Registering domain template: ${template.domainType}`);
    this.registeredTemplates.set(template.domainType, template);
  }

  /**
   * Create domain configuration
   */
  createDomainConfig(options: DomainConfigOptions): DomainConfig {
    const { domainType, customConfig, includeDefaults = true } = options;

    let baseConfig: Partial<DomainConfig> = {};

    if (includeDefaults) {
      const template = this.registeredTemplates.get(domainType);
      if (template) {
        baseConfig = { ...template.template };
      } else {
        baseConfig = this.createDefaultTemplate(domainType).template;
      }
    }

    const config: DomainConfig = {
      domainType,
      domainName:
        customConfig?.domainName || this.getDomainDisplayName(domainType),
      description:
        customConfig?.description || this.getDefaultDescription(domainType),
      evaluationCriteria:
        customConfig?.evaluationCriteria ||
        this.getDefaultEvaluationCriteria(domainType),
      ...baseConfig,
      ...customConfig,
      metadata: {
        version: "1.0.0",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...customConfig?.metadata,
      },
    };

    if (options.validateDomainData) {
      this.validateDomainConfig(config);
    }

    return config;
  }

  /**
   * Enhance GenerateOptions with domain configuration
   */
  enhanceWithDomain(
    options: GenerateOptions,
    domainConfig: DomainConfig,
  ): GenerateOptions {
    return {
      ...options,
      context: {
        ...options.context,
        domainConfig,
        domainType: domainConfig.domainType,
      },
      factoryConfig: {
        ...options.factoryConfig,
        domainType: domainConfig.domainType,
        enhancementType: "domain-configuration",
      },
    };
  }

  /**
   * Get domain evaluation criteria
   */
  getDomainEvaluationCriteria(
    domainType: DomainType,
  ): DomainEvaluationCriteria {
    const template = this.registeredTemplates.get(domainType);
    return (
      template?.template.evaluationCriteria ||
      this.getDefaultEvaluationCriteria(domainType)
    );
  }

  /**
   * Get available domains
   */
  getAvailableDomains(): DomainType[] {
    return Array.from(this.registeredTemplates.keys());
  }

  /**
   * Check if domain is registered
   */
  isDomainRegistered(domainType: DomainType): boolean {
    return this.registeredTemplates.has(domainType);
  }

  // Private helper methods

  private initializeDefaultTemplates(): void {
    // Healthcare domain
    this.registerDomainTemplate({
      domainType: "healthcare",
      template: {
        domainName: "Healthcare",
        description:
          "Medical and healthcare domain with high accuracy requirements",
        evaluationCriteria: {
          accuracyWeight: 0.4,
          completenessWeight: 0.3,
          relevanceWeight: 0.2,
          terminologyWeight: 0.1,
          domainSpecificRules: [
            "Medical terminology must be accurate",
            "Disclaimers required for medical advice",
            "Evidence-based recommendations preferred",
          ],
          failurePatterns: [
            "Diagnostic claims without evidence",
            "Treatment recommendations without disclaimers",
            "Unqualified medical advice",
          ],
          successPatterns: [
            "Appropriate medical disclaimers",
            "Evidence-based information",
            "Proper medical terminology",
          ],
        },
      },
      isDefault: true,
    });

    // Analytics domain
    this.registerDomainTemplate({
      domainType: "analytics",
      template: {
        domainName: "Analytics",
        description: "Data analytics and business intelligence domain",
        evaluationCriteria: {
          accuracyWeight: 0.35,
          completenessWeight: 0.35,
          relevanceWeight: 0.2,
          terminologyWeight: 0.1,
          domainSpecificRules: [
            "Data accuracy is paramount",
            "Statistical concepts must be correct",
            "Methodology should be transparent",
          ],
          failurePatterns: [
            "Incorrect statistical interpretations",
            "Misleading data visualizations",
            "Unsupported conclusions",
          ],
          successPatterns: [
            "Clear data explanations",
            "Accurate statistical analysis",
            "Transparent methodology",
          ],
        },
      },
      isDefault: true,
    });

    // Generic fallback
    this.registerDomainTemplate({
      domainType: "generic",
      template: {
        domainName: "Generic",
        description: "General-purpose domain configuration",
        evaluationCriteria: {
          accuracyWeight: 0.25,
          completenessWeight: 0.25,
          relevanceWeight: 0.25,
          terminologyWeight: 0.25,
          domainSpecificRules: [],
          failurePatterns: [],
          successPatterns: [],
        },
      },
      isDefault: true,
    });
  }

  private createDefaultTemplate(domainType: DomainType): DomainTemplate {
    return {
      domainType,
      template: {
        domainName: this.getDomainDisplayName(domainType),
        description: this.getDefaultDescription(domainType),
        evaluationCriteria: this.getDefaultEvaluationCriteria(domainType),
      },
    };
  }

  private getDomainDisplayName(domainType: DomainType): string {
    const displayNames: Record<DomainType, string> = {
      healthcare: "Healthcare",
      finance: "Finance",
      analytics: "Analytics",
      ecommerce: "E-commerce",
      education: "Education",
      legal: "Legal",
      technology: "Technology",
      generic: "Generic",
    };
    return displayNames[domainType] || "Unknown";
  }

  private getDefaultDescription(domainType: DomainType): string {
    const descriptions: Record<DomainType, string> = {
      healthcare:
        "Medical and healthcare domain with emphasis on accuracy and safety",
      finance:
        "Financial services domain with focus on accuracy and compliance",
      analytics: "Data analytics and business intelligence domain",
      ecommerce: "E-commerce and retail domain with customer focus",
      education: "Educational domain with emphasis on clarity and accuracy",
      legal: "Legal domain with focus on precision and compliance",
      technology: "Technology domain with emphasis on technical accuracy",
      generic: "General-purpose domain for broad applications",
    };
    return descriptions[domainType] || "Domain-specific configuration";
  }

  private getDefaultEvaluationCriteria(
    domainType: DomainType,
  ): DomainEvaluationCriteria {
    const baseWeights = {
      accuracyWeight: 0.25,
      completenessWeight: 0.25,
      relevanceWeight: 0.25,
      terminologyWeight: 0.25,
    };

    switch (domainType) {
      case "healthcare":
        return {
          ...baseWeights,
          accuracyWeight: 0.4,
          completenessWeight: 0.3,
          relevanceWeight: 0.2,
          terminologyWeight: 0.1,
          domainSpecificRules: [
            "Medical accuracy required",
            "Include disclaimers",
          ],
          failurePatterns: ["Unqualified medical advice", "Diagnostic claims"],
          successPatterns: [
            "Medical disclaimers",
            "Evidence-based information",
          ],
        };

      case "finance":
        return {
          ...baseWeights,
          accuracyWeight: 0.4,
          completenessWeight: 0.2,
          relevanceWeight: 0.3,
          terminologyWeight: 0.1,
          domainSpecificRules: [
            "Financial accuracy required",
            "Risk disclaimers",
          ],
          failurePatterns: [
            "Unqualified financial advice",
            "Guaranteed returns",
          ],
          successPatterns: ["Risk disclaimers", "Regulatory compliance"],
        };

      default:
        return {
          ...baseWeights,
          domainSpecificRules: [],
          failurePatterns: [],
          successPatterns: [],
        };
    }
  }

  private validateDomainConfig(config: DomainConfig): void {
    if (!config.domainType) {
      throw new Error("Domain type is required");
    }

    if (!config.domainName || config.domainName.trim() === "") {
      throw new Error("Domain name cannot be empty");
    }

    if (!config.evaluationCriteria) {
      throw new Error("Evaluation criteria is required");
    }

    logger.debug(`Domain configuration validated: ${config.domainType}`);
  }
}

// Export singleton instance
export const domainConfigurationFactory =
  DomainConfigurationFactory.getInstance();
