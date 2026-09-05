[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyReplayComparison

# Type Alias: ProxyReplayComparison

> **ProxyReplayComparison** = `object`

Defined in: [types/proxy.ts:2402](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2402)

Redacted direct-upstream response and comparison with captured evidence.

## Properties

### schemaVersion

> **schemaVersion**: `1`

Defined in: [types/proxy.ts:2403](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2403)

---

### kind

> **kind**: `"neurolink.proxy.replay-comparison"`

Defined in: [types/proxy.ts:2404](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2404)

---

### requestId

> **requestId**: `string`

Defined in: [types/proxy.ts:2405](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2405)

---

### selectedAttempt

> **selectedAttempt**: `number`

Defined in: [types/proxy.ts:2406](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2406)

---

### endpoint

> **endpoint**: `string`

Defined in: [types/proxy.ts:2407](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2407)

---

### request

> **request**: `object`

Defined in: [types/proxy.ts:2408](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2408)

#### method

> **method**: `string`

#### headers

> **headers**: `Record`\<`string`, `string`\>

#### bodySha256

> **bodySha256**: `string`

#### bodyBytes

> **bodyBytes**: `number`

#### usedBodyOverride

> **usedBodyOverride**: `boolean`

---

### captured

> **captured**: \{ `status`: `number` \| `null`; `contentType`: `string` \| `null`; `bodySha256`: `string` \| `null`; `bodyBytes`: `number` \| `null`; `bodyTruncated`: `boolean`; `jsonShape`: `string`[] \| `null`; \} \| `null`

Defined in: [types/proxy.ts:2415](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2415)

---

### direct

> **direct**: `object`

Defined in: [types/proxy.ts:2423](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2423)

#### status

> **status**: `number`

#### headers

> **headers**: `Record`\<`string`, `string`\>

#### contentType

> **contentType**: `string` \| `null`

#### body

> **body**: `string`

#### bodySha256

> **bodySha256**: `string`

#### observedBodyBytes

> **observedBodyBytes**: `number`

#### storedBodyBytes

> **storedBodyBytes**: `number`

#### bodyTruncated

> **bodyTruncated**: `boolean`

#### timeToHeadersMs

> **timeToHeadersMs**: `number`

#### totalMs

> **totalMs**: `number`

#### jsonShape

> **jsonShape**: `string`[] \| `null`

---

### comparison

> **comparison**: `object`

Defined in: [types/proxy.ts:2436](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2436)

#### statusMatches

> **statusMatches**: `boolean` \| `null`

#### contentTypeMatches

> **contentTypeMatches**: `boolean` \| `null`

#### bodyHashMatches

> **bodyHashMatches**: `boolean` \| `null`

#### jsonShapeMatches

> **jsonShapeMatches**: `boolean` \| `null`
