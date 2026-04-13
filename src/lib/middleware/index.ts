/**
 * NeuroLink Middleware System
 *
 * This module provides a comprehensive middleware system for NeuroLink that integrates
 * with the AI SDK's wrapLanguageModel functionality. It allows for modular enhancement
 * of language models with features like analytics, guardrails, caching, and more.
 */

// Import types and classes
import { MiddlewareFactory } from "./factory.js";

// Core types and interfaces

// Factory for creating and applying middleware chains
export { MiddlewareFactory };

// Built-in middleware creators
export { createLifecycleMiddleware } from "./builtin/lifecycle.js";

// Export the factory as the default export for clean, direct usage
export default MiddlewareFactory;
