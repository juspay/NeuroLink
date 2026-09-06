[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ServerConfigFile

# Type Alias: ServerConfigFile

> **ServerConfigFile** = `object`

Defined in: [types/cli.ts:1332](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1332)

Server configuration file format

## Properties

### port?

> `optional` **port?**: `number`

Defined in: [types/cli.ts:1333](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1333)

---

### host?

> `optional` **host?**: `string`

Defined in: [types/cli.ts:1334](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1334)

---

### framework?

> `optional` **framework?**: [`ServerFramework`](ServerFramework.md)

Defined in: [types/cli.ts:1335](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1335)

---

### basePath?

> `optional` **basePath?**: `string`

Defined in: [types/cli.ts:1336](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1336)

---

### cors?

> `optional` **cors?**: `object`

Defined in: [types/cli.ts:1337](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1337)

#### enabled?

> `optional` **enabled?**: `boolean`

#### origins?

> `optional` **origins?**: `string`[]

#### methods?

> `optional` **methods?**: `string`[]

#### headers?

> `optional` **headers?**: `string`[]

#### credentials?

> `optional` **credentials?**: `boolean`

#### maxAge?

> `optional` **maxAge?**: `number`

---

### rateLimit?

> `optional` **rateLimit?**: `object`

Defined in: [types/cli.ts:1345](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1345)

#### enabled?

> `optional` **enabled?**: `boolean`

#### windowMs?

> `optional` **windowMs?**: `number`

#### maxRequests?

> `optional` **maxRequests?**: `number`

#### message?

> `optional` **message?**: `string`

#### skipPaths?

> `optional` **skipPaths?**: `string`[]

---

### bodyParser?

> `optional` **bodyParser?**: `object`

Defined in: [types/cli.ts:1352](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1352)

#### enabled?

> `optional` **enabled?**: `boolean`

#### maxSize?

> `optional` **maxSize?**: `string`

#### jsonLimit?

> `optional` **jsonLimit?**: `string`

#### urlEncoded?

> `optional` **urlEncoded?**: `boolean`

---

### logging?

> `optional` **logging?**: `object`

Defined in: [types/cli.ts:1358](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1358)

#### enabled?

> `optional` **enabled?**: `boolean`

#### level?

> `optional` **level?**: `"debug"` \| `"info"` \| `"warn"` \| `"error"`

#### includeBody?

> `optional` **includeBody?**: `boolean`

#### includeResponse?

> `optional` **includeResponse?**: `boolean`

---

### timeout?

> `optional` **timeout?**: `number`

Defined in: [types/cli.ts:1364](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1364)

---

### enableMetrics?

> `optional` **enableMetrics?**: `boolean`

Defined in: [types/cli.ts:1365](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1365)

---

### enableSwagger?

> `optional` **enableSwagger?**: `boolean`

Defined in: [types/cli.ts:1366](https://github.com/juspay/neurolink/blob/release/src/lib/types/cli.ts#L1366)
