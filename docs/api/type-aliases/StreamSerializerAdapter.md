[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / StreamSerializerAdapter

# Type Alias: StreamSerializerAdapter

> **StreamSerializerAdapter** = `object`

Defined in: [types/proxy.ts:3284](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3284)

Common adapter interface that hides the differences between
Claude and OpenAI stream serializers from the unified translation engine.

## Methods

### start()

> **start**(): `Iterable`\<`string`\>

Defined in: [types/proxy.ts:3285](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3285)

#### Returns

`Iterable`\<`string`\>

---

### pushDelta()

> **pushDelta**(`text`): `Iterable`\<`string`\>

Defined in: [types/proxy.ts:3286](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3286)

#### Parameters

##### text

`string`

#### Returns

`Iterable`\<`string`\>

---

### pushToolUse()

> **pushToolUse**(`id`, `name`, `input`): `Iterable`\<`string`\>

Defined in: [types/proxy.ts:3287](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3287)

#### Parameters

##### id

`string`

##### name

`string`

##### input

`unknown`

#### Returns

`Iterable`\<`string`\>

---

### finish()

> **finish**(`finishReason`, `usage`): `Iterable`\<`string`\>

Defined in: [types/proxy.ts:3288](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3288)

#### Parameters

##### finishReason

`string`

##### usage

###### input

`number`

###### output

`number`

###### total

`number`

#### Returns

`Iterable`\<`string`\>

---

### emitError()

> **emitError**(`message`): `Iterable`\<`string`\>

Defined in: [types/proxy.ts:3292](https://github.com/juspay/neurolink/blob/release/src/lib/types/proxy.ts#L3292)

#### Parameters

##### message

`string`

#### Returns

`Iterable`\<`string`\>
