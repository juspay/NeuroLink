[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / SSEInterceptorResult

# Type Alias: SSEInterceptorResult

> **SSEInterceptorResult** = `object`

Defined in: [types/proxy.ts:2629](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2629)

Result of createSSEInterceptor: the pass-through stream and a telemetry promise.

## Properties

### stream

> **stream**: `TransformStream`\<`Uint8Array`, `Uint8Array`\>

Defined in: [types/proxy.ts:2630](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2630)

---

### telemetry

> **telemetry**: `Promise`\<[`SSETelemetry`](SSETelemetry.md)\>

Defined in: [types/proxy.ts:2631](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L2631)
