[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ParsedClaudeError

# Type Alias: ParsedClaudeError

> **ParsedClaudeError** = `object`

Defined in: [types/proxy.ts:3033](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3033)

Parsed shape of a Claude API error body.

## Properties

### errorType?

> `optional` **errorType?**: `string`

Defined in: [types/proxy.ts:3034](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3034)

---

### message?

> `optional` **message?**: `string`

Defined in: [types/proxy.ts:3035](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3035)

---

### errorCode?

> `optional` **errorCode?**: `string`

Defined in: [types/proxy.ts:3038](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3038)

`error.details.error_code`, e.g. "oauth_not_allowed_for_organization".
Absent on payloads that carry no details object.
