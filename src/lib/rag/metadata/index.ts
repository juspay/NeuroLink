/**
 * Metadata Extraction Module Exports
 */

// Factory pattern exports
export {
  createMetadataExtractor,
  getAvailableExtractorTypes,
  getExtractorDefaultConfig,
  getExtractorMetadata,
  type MetadataExtractor,
  type MetadataExtractorConfig,
  MetadataExtractorFactory,
  type MetadataExtractorMetadata,
  type MetadataExtractorType,
  metadataExtractorFactory,
} from "./MetadataExtractorFactory.js";
// Registry pattern exports
export {
  getAvailableExtractors,
  getExtractor,
  getRegisteredExtractorMetadata,
  MetadataExtractorRegistry,
  metadataExtractorRegistry,
} from "./MetadataExtractorRegistry.js";
// Core metadata extractor
export { extractMetadata, LLMMetadataExtractor } from "./metadataExtractor.js";
