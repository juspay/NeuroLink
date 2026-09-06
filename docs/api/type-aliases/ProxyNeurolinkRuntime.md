[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ProxyNeurolinkRuntime

# Type Alias: ProxyNeurolinkRuntime

> **ProxyNeurolinkRuntime** = `object`

Defined in: [types/proxy.ts:3268](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3268)

Handle for a NeuroLink runtime created by the proxy start command.
The `neurolink` field is typed structurally (only the method used by the
proxy layer is exposed) so types/proxy.ts does not depend on the full
NeuroLink class.

## Properties

### neurolink

> **neurolink**: `object`

Defined in: [types/proxy.ts:3269](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3269)

#### getToolRegistry()

> **getToolRegistry**(): [`MCPToolRegistry`](../classes/MCPToolRegistry.md)

##### Returns

[`MCPToolRegistry`](../classes/MCPToolRegistry.md)

---

### logsDir

> **logsDir**: `string`

Defined in: [types/proxy.ts:3272](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3272)
