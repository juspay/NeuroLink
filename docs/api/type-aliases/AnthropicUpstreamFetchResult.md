[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AnthropicUpstreamFetchResult

# Type Alias: AnthropicUpstreamFetchResult

> **AnthropicUpstreamFetchResult** = `object`

Defined in: [types/proxy.ts:1122](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1122)

## Properties

### continueLoop

> **continueLoop**: `boolean`

Defined in: [types/proxy.ts:1123](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1123)

---

### retrySameAccount?

> `optional` **retrySameAccount?**: `boolean`

Defined in: [types/proxy.ts:1124](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1124)

---

### transportScope?

> `optional` **transportScope?**: [`ProxyNetworkTransportScope`](ProxyNetworkTransportScope.md)

Defined in: [types/proxy.ts:1125](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1125)

---

### errorCode?

> `optional` **errorCode?**: `string`

Defined in: [types/proxy.ts:1126](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1126)

---

### connectPhase?

> `optional` **connectPhase?**: `boolean`

Defined in: [types/proxy.ts:1129](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1129)

The transport failure happened while connecting, before any request
byte was sent, so retrying it cannot duplicate provider work.

---

### retryAfterMs?

> `optional` **retryAfterMs?**: `number`

Defined in: [types/proxy.ts:1131](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1131)

When set, the caller should wait this many ms before retrying (from upstream retry-after).

---

### cooldownPlan?

> `optional` **cooldownPlan?**: [`AccountCooldownPlan`](AccountCooldownPlan.md)

Defined in: [types/proxy.ts:1133](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1133)

Set on a genuine 429: how long / why to cool this account before rotating.

---

### quota?

> `optional` **quota?**: [`AccountQuota`](AccountQuota.md)

Defined in: [types/proxy.ts:1135](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1135)

Quota snapshot parsed from the response headers (429 or success), if present.

---

### terminalError?

> `optional` **terminalError?**: `object`

Defined in: [types/proxy.ts:1139](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1139)

A terminal upstream rejection already captured and classified by the
fetch layer. The route must finalize it directly instead of feeding it
through the generic non-OK handler a second time.

#### status

> **status**: `number`

#### body

> **body**: `string`

#### headers

> **headers**: `Record`\<`string`, `string`\>

#### errorType

> **errorType**: `"construction_rejection"`

---

### response?

> `optional` **response?**: `Response`

Defined in: [types/proxy.ts:1145](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1145)

---

### lastError

> **lastError**: `unknown`

Defined in: [types/proxy.ts:1146](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1146)

---

### sawRateLimit

> **sawRateLimit**: `boolean`

Defined in: [types/proxy.ts:1147](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1147)

---

### sawNetworkError

> **sawNetworkError**: `boolean`

Defined in: [types/proxy.ts:1148](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1148)

---

### upstreamSpan?

> `optional` **upstreamSpan?**: `Span`

Defined in: [types/proxy.ts:1149](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1149)
