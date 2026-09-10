[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / StreamResult

# Type Alias: StreamResult

> **StreamResult** = `object`

Defined in: [types/stream.ts:878](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L878)

Stream function result type - Primary output format for streaming
Future-ready for multi-modal outputs while maintaining text focus

## Properties

### knowledge?

> `optional` **knowledge?**: [`KnowledgeGroundingMetadata`](KnowledgeGroundingMetadata.md)

Defined in: [types/stream.ts:880](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L880)

Knowledge-grounding diagnostics for this turn (present only when grounding ran).

---

### stream

> **stream**: `AsyncIterable`\<\{ `content`: `string`; `reasoning?`: `string`; \} \| [`StreamNoOutputSentinel`](StreamNoOutputSentinel.md) \| \{ `type`: `"audio"`; `audio`: [`AudioChunk`](AudioChunk.md); \} \| \{ `type`: `"tts_audio"`; `audio`: [`TTSChunk`](TTSChunk.md); \} \| \{ `type`: `"image"`; `imageOutput`: \{ `base64`: `string`; \}; \} \| \{ `content`: `string`; `type?`: `"preliminary"` \| `"final"`; \}\>

Defined in: [types/stream.ts:881](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L881)

---

### provider?

> `optional` **provider?**: `string`

Defined in: [types/stream.ts:896](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L896)

---

### model?

> `optional` **model?**: `string`

Defined in: [types/stream.ts:897](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L897)

---

### usage?

> `optional` **usage?**: [`TokenUsage`](TokenUsage.md)

Defined in: [types/stream.ts:900](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L900)

---

### finishReason?

> `optional` **finishReason?**: `string`

Defined in: [types/stream.ts:903](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L903)

---

### stopReason?

> `optional` **stopReason?**: [`GenerateStopReason`](GenerateStopReason.md)

Defined in: [types/stream.ts:912](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L912)

Why the agentic turn ended (see GenerateStopReason). For background-loop
streams (the native Vertex paths and the native Anthropic stream path)
prefer `metadata.stopReason` after draining the stream — this top-level
field may be a getter that resolves late, and wrapper spreads can
snapshot it before the loop finishes.

---

### rawFinishReason?

> `optional` **rawFinishReason?**: `string`

Defined in: [types/stream.ts:914](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L914)

Verbatim provider finish/stop reason for the turn's terminal model call.

---

### toolCalls?

> `optional` **toolCalls?**: [`StreamToolCall`](StreamToolCall.md)[]

Defined in: [types/stream.ts:917](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L917)

---

### toolResults?

> `optional` **toolResults?**: [`StreamToolResult`](StreamToolResult.md)[]

Defined in: [types/stream.ts:918](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L918)

---

### toolEvents?

> `optional` **toolEvents?**: `AsyncIterable`\<[`ToolExecutionEvent`](ToolExecutionEvent.md)\>

Defined in: [types/stream.ts:921](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L921)

---

### toolExecutions?

> `optional` **toolExecutions?**: [`ToolExecutionSummary`](ToolExecutionSummary.md)[]

Defined in: [types/stream.ts:922](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L922)

---

### toolsUsed?

> `optional` **toolsUsed?**: `string`[]

Defined in: [types/stream.ts:923](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L923)

---

### metadata?

> `optional` **metadata?**: `object`

Defined in: [types/stream.ts:926](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L926)

#### streamId?

> `optional` **streamId?**: `string`

#### startTime?

> `optional` **startTime?**: `number`

#### totalChunks?

> `optional` **totalChunks?**: `number`

#### estimatedDuration?

> `optional` **estimatedDuration?**: `number`

#### responseTime?

> `optional` **responseTime?**: `number`

#### preliminaryTime?

> `optional` **preliminaryTime?**: `number`

#### fallback?

> `optional` **fallback?**: `boolean`

#### totalToolExecutions?

> `optional` **totalToolExecutions?**: `number`

#### toolExecutionTime?

> `optional` **toolExecutionTime?**: `number`

#### hasToolErrors?

> `optional` **hasToolErrors?**: `boolean`

#### guardrailsBlocked?

> `optional` **guardrailsBlocked?**: `boolean`

#### error?

> `optional` **error?**: `string`

#### finishReason?

> `optional` **finishReason?**: `string`

#### stopReason?

> `optional` **stopReason?**: [`GenerateStopReason`](GenerateStopReason.md)

#### rawFinishReason?

> `optional` **rawFinishReason?**: `string`

#### stepsUsed?

> `optional` **stepsUsed?**: `number`

#### thoughtSignature?

> `optional` **thoughtSignature?**: `string`

#### thoughts?

> `optional` **thoughts?**: `object`[]

---

### analytics?

> `optional` **analytics?**: [`AnalyticsData`](AnalyticsData.md) \| `Promise`\<[`AnalyticsData`](AnalyticsData.md)\>

Defined in: [types/stream.ts:956](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L956)

---

### evaluation?

> `optional` **evaluation?**: [`EvaluationData`](EvaluationData.md) \| `Promise`\<[`EvaluationData`](EvaluationData.md)\>

Defined in: [types/stream.ts:957](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L957)

---

### events?

> `optional` **events?**: `object`[]

Defined in: [types/stream.ts:960](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L960)

#### Index Signature

\[`key`: `string`\]: `unknown`

#### type

> **type**: `string`

#### seq

> **seq**: `number`

#### timestamp

> **timestamp**: `number`

---

### workflow?

> `optional` **workflow?**: `object`

Defined in: [types/stream.ts:968](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L968)

#### originalResponse

> **originalResponse**: `string`

#### processedResponse

> **processedResponse**: `string`

#### ensembleResponses

> **ensembleResponses**: `object`[]

#### judgeScores?

> `optional` **judgeScores?**: `object`

##### judgeScores.scores

> **scores**: `Record`\<`string`, `number`\>

##### judgeScores.reasoning?

> `optional` **reasoning?**: `string`

##### judgeScores.selectedModel

> **selectedModel**: `string`

#### selectedModel

> **selectedModel**: `string`

#### metrics

> **metrics**: `object`

##### metrics.totalTime

> **totalTime**: `number`

##### metrics.ensembleTime

> **ensembleTime**: `number`

##### metrics.judgeTime?

> `optional` **judgeTime?**: `number`

##### metrics.conditioningTime?

> `optional` **conditioningTime?**: `number`

#### workflowId

> **workflowId**: `string`

#### workflowName

> **workflowName**: `string`

---

### transcription?

> `optional` **transcription?**: [`STTResult`](STTResult.md)

Defined in: [types/stream.ts:996](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L996)

STT transcription result (when stt option is used)

---

### audio?

> `optional` **audio?**: `Promise`\<[`TTSResult`](TTSResult.md) \| `undefined`\>

Defined in: [types/stream.ts:1022](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L1022)

Streaming TTS result (when `tts.enabled`). `stream()` synthesizes the AI
response incrementally; `useAiResponse` continues to select input vs
response synthesis for non-streaming generation.
Resolves with the synthesized audio after the caller drains `stream` to
completion; like other stream-final fields, it remains pending while the
lazy stream is unconsumed. It resolves with the aggregate of whatever
segments were synthesized: a synthesis failure part-way through still
resolves with the earlier segments rather than discarding them. It resolves
to undefined only when no segment was produced — TTS was not enabled, no
handler resolved for the requested provider, the model stream errored, every
synthesis failed, or the caller stopped draining `stream` before it ended
(an abandoned stream settles undefined rather than a partial aggregate).
Audio is also yielded incrementally as ordered
`tts_audio` chunks. Each chunk, including the final one, contains only its
own buffered segment. The aggregate is a byte concatenation of those
independently synthesized segments, so what it is depends on the format's
framing: for frame- or sample-stream formats (`mp3`, `mpeg`, `mpga`,
`pcm16`) it is one playable stream; for header-bearing container formats
(`wav`, `flac`, `m4a`, `mp4`, `webm`) it is not a valid file, because each
segment carries its own header; for `ogg`/`opus` it is a chained stream that
some decoders read only through its first segment. Use the individual chunk
buffers when each segment must be a valid container file.

---

### ttsMetadata?

> `optional` **ttsMetadata?**: [`TTSMetadata`](TTSMetadata.md)

Defined in: [types/stream.ts:1029](https://github.com/juspay/neurolink/blob/release/src/lib/types/stream.ts#L1029)

Outcome metadata for streaming TTS synthesis. This is a mutable reference
whose success and latency fields are finalized asynchronously; read it
after draining `stream`.
