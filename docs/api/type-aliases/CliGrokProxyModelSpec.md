[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / CliGrokProxyModelSpec

# Type Alias: CliGrokProxyModelSpec

> **CliGrokProxyModelSpec** = `object`

Defined in: [types/proxyClient.ts:106](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L106)

One Grok Build picker entry the proxy writer emits under `[model.<id>]`.

`contextWindow` is Grok's compaction limit and must be <= the upstream
model's window. `supportsReasoningEffort` is false when Grok's `xhigh`
would become Anthropic adaptive thinking that the model rejects.

## Properties

### id

> **id**: `string`

Defined in: [types/proxyClient.ts:107](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L107)

---

### name

> **name**: `string`

Defined in: [types/proxyClient.ts:108](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L108)

---

### apiBackend

> **apiBackend**: `"messages"` \| `"chat_completions"`

Defined in: [types/proxyClient.ts:109](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L109)

---

### contextWindow

> **contextWindow**: `number`

Defined in: [types/proxyClient.ts:110](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L110)

---

### maxCompletionTokens

> **maxCompletionTokens**: `number`

Defined in: [types/proxyClient.ts:111](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L111)

---

### supportsReasoningEffort

> **supportsReasoningEffort**: `boolean`

Defined in: [types/proxyClient.ts:112](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxyClient.ts#L112)
