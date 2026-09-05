[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AnthropicUpstreamFetchResult

# Type Alias: AnthropicUpstreamFetchResult

> **AnthropicUpstreamFetchResult** = `object`

Defined in: [types/proxy.ts:1099](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1099)

## Properties

### continueLoop

> **continueLoop**: `boolean`

Defined in: [types/proxy.ts:1100](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1100)

---

### retrySameAccount?

> `optional` **retrySameAccount?**: `boolean`

Defined in: [types/proxy.ts:1101](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1101)

---

### transportScope?

> `optional` **transportScope?**: [`ProxyNetworkTransportScope`](ProxyNetworkTransportScope.md)

Defined in: [types/proxy.ts:1102](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1102)

---

### errorCode?

> `optional` **errorCode?**: `string`

Defined in: [types/proxy.ts:1103](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1103)

---

### connectPhase?

> `optional` **connectPhase?**: `boolean`

Defined in: [types/proxy.ts:1106](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1106)

The transport failure happened while connecting, before any request
byte was sent, so retrying it cannot duplicate provider work.

---

### retryAfterMs?

> `optional` **retryAfterMs?**: `number`

Defined in: [types/proxy.ts:1108](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1108)

When set, the caller should wait this many ms before retrying (from upstream retry-after).

---

### cooldownPlan?

> `optional` **cooldownPlan?**: [`AccountCooldownPlan`](AccountCooldownPlan.md)

Defined in: [types/proxy.ts:1110](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1110)

Set on a genuine 429: how long / why to cool this account before rotating.

---

### quota?

> `optional` **quota?**: [`AccountQuota`](AccountQuota.md)

Defined in: [types/proxy.ts:1112](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1112)

Quota snapshot parsed from the response headers (429 or success), if present.

---

### terminalError?

> `optional` **terminalError?**: `object`

Defined in: [types/proxy.ts:1116](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1116)

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

Defined in: [types/proxy.ts:1122](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1122)

---

### lastError

> **lastError**: `unknown`

Defined in: [types/proxy.ts:1123](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1123)

---

### sawRateLimit

> **sawRateLimit**: `boolean`

Defined in: [types/proxy.ts:1124](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1124)

---

### sawNetworkError

> **sawNetworkError**: `boolean`

Defined in: [types/proxy.ts:1125](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1125)

---

### upstreamSpan?

> `optional` **upstreamSpan?**: `Span`

Defined in: [types/proxy.ts:1126](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L1126)
