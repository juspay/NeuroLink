[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyReplayBundle

# Type Alias: ProxyReplayBundle

> **ProxyReplayBundle** = `object`

Defined in: [types/proxy.ts:2429](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2429)

Deterministic, redacted reconstruction of one captured proxy request.

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:2430](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2430)

---

### kind

> **kind**: `"neurolink.proxy.replay-bundle"`

Defined in: [types/proxy.ts:2431](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2431)

---

### requestId

> **requestId**: `string`

Defined in: [types/proxy.ts:2432](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2432)

---

### selectedAttempt

> **selectedAttempt**: `number`

Defined in: [types/proxy.ts:2433](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2433)

---

### source

> **source**: `object`

Defined in: [types/proxy.ts:2434](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2434)

#### logsDirectory

> **logsDirectory**: `string`

#### indexFiles

> **indexFiles**: `string`[]

---

### completeness

> **completeness**: `object`

Defined in: [types/proxy.ts:2438](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2438)

#### captures

> **captures**: `number`

#### phasesPresent

> **phasesPresent**: `string`[]

#### missingRequiredPhases

> **missingRequiredPhases**: `string`[]

#### truncatedCaptures

> **truncatedCaptures**: `number`

#### artifactsWithIssues

> **artifactsWithIssues**: `number`

#### replayable

> **replayable**: `boolean`

#### blockers

> **blockers**: `string`[]

---

### request

> **request**: `object`

Defined in: [types/proxy.ts:2447](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2447)

#### method

> **method**: `string`

#### url

> **url**: `string` \| `null`

#### headers

> **headers**: `Record`\<`string`, `string`\>

#### requiredHeaderInputs

> **requiredHeaderInputs**: `string`[]

#### body

> **body**: `string` \| `null`

#### bodySha256

> **bodySha256**: `string` \| `null`

#### bodyTruncated

> **bodyTruncated**: `boolean`

#### contentType

> **contentType**: `string` \| `null`

#### account

> **account**: `string` \| `null`

#### accountType

> **accountType**: `string` \| `null`

#### model

> **model**: `string` \| `null`

#### stream

> **stream**: `boolean` \| `null`

---

### capturedResponse

> **capturedResponse**: [`ProxyReplayCapture`](ProxyReplayCapture.md) \| `null`

Defined in: [types/proxy.ts:2461](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2461)

---

### captures

> **captures**: [`ProxyReplayCapture`](ProxyReplayCapture.md)[]

Defined in: [types/proxy.ts:2462](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2462)
