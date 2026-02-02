/**
 * Streaming Module
 * Exports for data stream protocol and streaming utilities
 */

export {
  // Types
  type DataStreamEventType,
  type DataStreamEvent,
  type TextStartEvent,
  type TextDeltaEvent,
  type TextEndEvent,
  type ToolCallEvent,
  type ToolResultEvent,
  type DataEvent,
  type ErrorEvent,
  type FinishEvent,
  type SSEEventOptions,

  // Writer
  type DataStreamWriterConfig,
  createDataStreamWriter,

  // Response
  type DataStreamResponseConfig,
  DataStreamResponse,
  createDataStreamResponse,

  // Helpers
  pipeAsyncIterableToDataStream,
  createSSEHeaders,
  createNDJSONHeaders,

  // SSE Event Formatting
  formatSSEEvent,

  // WebStreamWriter (Legacy Compatibility)
  BaseDataStreamWriter,
  WebStreamWriter,
} from "./dataStream.js";
