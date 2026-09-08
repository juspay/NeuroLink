[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / DetectionTestConfig

# Type Alias: DetectionTestConfig

> **DetectionTestConfig** = `object`

Defined in: [types/providers.ts:2277](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2277)

Configuration object for a detection test wrapper.

## Properties

### test

> **test**: () => `Promise`\<`void`\>

Defined in: [types/providers.ts:2278](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2278)

#### Returns

`Promise`\<`void`\>

---

### index

> **index**: `number`

Defined in: [types/providers.ts:2279](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2279)

---

### testName

> **testName**: `string`

Defined in: [types/providers.ts:2280](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2280)

---

### endpointName

> **endpointName**: `string`

Defined in: [types/providers.ts:2281](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2281)

---

### semaphore

> **semaphore**: `object`

Defined in: [types/providers.ts:2282](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2282)

#### acquire()

> **acquire**(): `Promise`\<`void`\>

##### Returns

`Promise`\<`void`\>

#### release()

> **release**(): `void`

##### Returns

`void`

---

### incrementRateLimit

> **incrementRateLimit**: () => `void`

Defined in: [types/providers.ts:2286](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2286)

#### Returns

`void`

---

### maxRateLimitRetries

> **maxRateLimitRetries**: `number`

Defined in: [types/providers.ts:2287](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2287)

---

### rateLimitState

> **rateLimitState**: `object`

Defined in: [types/providers.ts:2288](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L2288)

#### count

> **count**: `number`
