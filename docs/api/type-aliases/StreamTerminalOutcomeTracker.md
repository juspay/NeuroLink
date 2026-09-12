[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / StreamTerminalOutcomeTracker

# Type Alias: StreamTerminalOutcomeTracker

> **StreamTerminalOutcomeTracker** = `object`

Defined in: [types/proxy.ts:2596](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2596)

First-writer-wins tracker for an upstream streaming response.

## Properties

### outcome

> **outcome**: `Promise`\<[`StreamTerminalOutcome`](StreamTerminalOutcome.md)\>

Defined in: [types/proxy.ts:2597](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2597)

---

### complete

> **complete**: () => `void`

Defined in: [types/proxy.ts:2598](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2598)

#### Returns

`void`

---

### fail

> **fail**: (`message`) => `void`

Defined in: [types/proxy.ts:2599](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2599)

#### Parameters

##### message

`string`

#### Returns

`void`

---

### cancel

> **cancel**: () => `void`

Defined in: [types/proxy.ts:2600](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2600)

#### Returns

`void`
