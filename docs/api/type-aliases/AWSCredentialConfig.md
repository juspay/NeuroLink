[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / AWSCredentialConfig

# Type Alias: AWSCredentialConfig

> **AWSCredentialConfig** = `object`

Defined in: [types/providers.ts:136](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L136)

AWS Credential Configuration for Bedrock provider

## Properties

### region?

> `optional` **region?**: `string`

Defined in: [types/providers.ts:137](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L137)

---

### profile?

> `optional` **profile?**: `string`

Defined in: [types/providers.ts:138](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L138)

---

### roleArn?

> `optional` **roleArn?**: `string`

Defined in: [types/providers.ts:139](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L139)

---

### roleSessionName?

> `optional` **roleSessionName?**: `string`

Defined in: [types/providers.ts:140](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L140)

---

### timeout?

> `optional` **timeout?**: `number`

Defined in: [types/providers.ts:141](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L141)

---

### ~~maxRetries?~~

> `optional` **maxRetries?**: `number`

Defined in: [types/providers.ts:143](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L143)

#### Deprecated

Prefer maxAttempts to match AWS SDK v3 config

---

### maxAttempts?

> `optional` **maxAttempts?**: `number`

Defined in: [types/providers.ts:145](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L145)

Number of attempts as per AWS SDK v3 ("retry-mode")

---

### enableDebugLogging?

> `optional` **enableDebugLogging?**: `boolean`

Defined in: [types/providers.ts:146](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L146)

---

### endpoint?

> `optional` **endpoint?**: `string`

Defined in: [types/providers.ts:148](https://github.com/juspay/neurolink/blob/release/src/lib/types/providers.ts#L148)

Optional service endpoint override (e.g., VPC/Gov endpoints)
