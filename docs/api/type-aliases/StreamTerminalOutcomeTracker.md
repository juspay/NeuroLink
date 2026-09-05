[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / StreamTerminalOutcomeTracker

# Type Alias: StreamTerminalOutcomeTracker

> **StreamTerminalOutcomeTracker** = `object`

Defined in: [types/proxy.ts:2532](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2532)

First-writer-wins tracker for an upstream streaming response.

## Properties

### outcome

> **outcome**: `Promise`\<[`StreamTerminalOutcome`](StreamTerminalOutcome.md)\>

Defined in: [types/proxy.ts:2533](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2533)

---

### complete

> **complete**: () => `void`

Defined in: [types/proxy.ts:2534](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2534)

#### Returns

`void`

---

### fail

> **fail**: (`message`) => `void`

Defined in: [types/proxy.ts:2535](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2535)

#### Parameters

##### message

`string`

#### Returns

`void`

---

### cancel

> **cancel**: () => `void`

Defined in: [types/proxy.ts:2536](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2536)

#### Returns

`void`
