[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ParsedClaudeError

# Type Alias: ParsedClaudeError

> **ParsedClaudeError** = `object`

Defined in: [types/proxy.ts:3117](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3117)

Parsed shape of a Claude API error body.

## Properties

### errorType?

> `optional` **errorType?**: `string`

Defined in: [types/proxy.ts:3118](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3118)

---

### message?

> `optional` **message?**: `string`

Defined in: [types/proxy.ts:3119](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3119)

---

### errorCode?

> `optional` **errorCode?**: `string`

Defined in: [types/proxy.ts:3122](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3122)

`error.details.error_code`, e.g. "oauth_not_allowed_for_organization".
Absent on payloads that carry no details object.
