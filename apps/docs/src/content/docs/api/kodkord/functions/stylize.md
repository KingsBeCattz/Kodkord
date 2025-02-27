---
editUrl: false
next: false
prev: false
title: "stylize"
---

> **stylize**(`input`, ...`codes`): `string`

Defined in: [packages/kodkord/src/common/log.ts:183](https://github.com/KingsBeCattz/Kodkord/blob/e64d9a769150751981b0359a2c19703ea8677956/packages/kodkord/src/common/log.ts#L183)

Stylizes the given string by applying the specified ANSI codes.

The function resets specific styles automatically, such as text color, background color,
or other text formatting, based on the provided ANSI codes.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | `string` | The string to be stylized. |
| ...`codes` | [`ANSICodes`](/api/kodkord/enumerations/ansicodes/)[] | ANSI codes to apply to the string. |

## Returns

`string`

The stylized string with the applied ANSI codes.
