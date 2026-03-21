---
title: Datas
sidebar_position: 4
---

# Type Fields — Datas

Type Fields de data encapsulam valores `Date` com formatos ISO 8601 especificos. Todos estendem a classe abstrata `FDate`, que por sua vez estende `TypeField<Date, string>`.

Todos os campos de data aceitam tanto `string` quanto `Date` no metodo `create()`. O valor e armazenado internamente como `Date` e formatado conforme o formato especifico via `toString()` e `formatted()`.

## Resumo

| Classe | Formato de saida | Exemplo | Arquivo |
|--------|-----------------|---------|---------|
| `FDateTimeISOZMillis` | `YYYY-MM-DDTHH:mm:ss.sssZ` | `2024-01-15T10:30:00.000Z` | `date.format_vo.ts` |
| `FDateTimeISOZ` | `YYYY-MM-DDTHH:mm:ssZ` | `2024-01-15T10:30:00Z` | `date.format_vo.ts` |
| `FDateISODate` | `YYYY-MM-DD` | `2024-01-15` | `date.format_vo.ts` |
| `FDateISOCompact` | `YYYYMMDD` | `20240115` | `date.format_vo.ts` |
| `FDateTimeISOCompact` | `YYYYMMDDTHH:mm:ss` | `20240115T10:30:00` | `date.format_vo.ts` |
| `FDateTimeISOFullCompact` | `YYYYMMDDHHmmss` | `20240115103000` | `date.format_vo.ts` |

---

## FDateTimeISOZMillis

Formato ISO 8601 completo com fuso Zulu e milissegundos. E o formato mais preciso disponivel.

```typescript
import { FDateTimeISOZMillis } from "tyforge";

// A partir de string
const result = FDateTimeISOZMillis.create("2024-01-15T10:30:00.000Z");
// Result<FDateTimeISOZMillis, ExceptionValidation>

// A partir de Date
const fromDate = FDateTimeISOZMillis.create(new Date());

// Gerar data atual como instancia
const agora = FDateTimeISOZMillis.generate();
agora.toString(); // "2024-01-15T10:30:00.000Z"

// Gerar data atual como string (sem wrapper)
const str = FDateTimeISOZMillis.generateToString();
// "2024-01-15T10:30:00.000Z"
```

**Metodos estaticos adicionais:**
- `generate()` — cria instancia com `new Date()` atual
- `generateToString(date?)` — retorna string formatada sem criar instancia
- `createOrThrow(date)` — lanca excecao se a data for invalida

---

## FDateTimeISOZ

Formato ISO 8601 UTC sem milissegundos.

```typescript
import { FDateTimeISOZ } from "tyforge";

const result = FDateTimeISOZ.create("2024-01-15T10:30:00Z");
// Result<FDateTimeISOZ, ExceptionValidation>

const data = FDateTimeISOZ.createOrThrow(new Date());
data.toString(); // "2024-01-15T10:30:00Z"
```

**Metodos estaticos adicionais:**
- `generateDateString(date?)` — retorna string no formato UTC sem milissegundos

---

## FDateISODate

Formato ISO 8601 somente data (sem componente de hora).

```typescript
import { FDateISODate } from "tyforge";

const result = FDateISODate.create("2024-01-15");
// Result<FDateISODate, ExceptionValidation>

const data = FDateISODate.createOrThrow("2024-01-15");
data.toString(); // "2024-01-15"
```

---

## FDateISOCompact

Formato ISO 8601 compacto sem separadores.

```typescript
import { FDateISOCompact } from "tyforge";

const result = FDateISOCompact.create("20240115");
// Result<FDateISOCompact, ExceptionValidation>

const data = FDateISOCompact.createOrThrow(new Date());
data.toString(); // "20240115"
```

---

## FDateTimeISOCompact

Formato ISO 8601 compacto com separador `T` e hora.

```typescript
import { FDateTimeISOCompact } from "tyforge";

const result = FDateTimeISOCompact.create("20240115T10:30:00");
// Result<FDateTimeISOCompact, ExceptionValidation>
```

---

## FDateTimeISOFullCompact

Formato ISO 8601 totalmente compacto, sem nenhum separador.

```typescript
import { FDateTimeISOFullCompact } from "tyforge";

const result = FDateTimeISOFullCompact.create("20240115103000");
// Result<FDateTimeISOFullCompact, ExceptionValidation>
```

---

## Classe base `FDate`

Todas as classes de data estendem `FDate`, que fornece a infraestrutura comum:

```typescript
abstract class FDate extends TypeField<Date, string> {
  // Config compartilhado
  static readonly config: ITypeFieldConfig<Date> = { jsonSchemaType: "Date" };

  // Cada subclasse implementa a formatacao
  protected abstract formatValue(date: Date): string;

  // toString(), formatted(), getDescription() e getShortDescription()
  // delegam para formatValue()
}
```

O `toJSON()` de domain models com campos `FDate` respeita a configuracao `{ date: 'string' | 'date' }` — quando `date: 'string'`, o valor e serializado via `toString()` no formato especifico da subclasse.
