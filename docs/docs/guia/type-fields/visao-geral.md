---
title: Type Fields
sidebar_position: 1
---

# Type Fields

**Type Fields** sao Value Objects validados que encapsulam valores primitivos com regras de validacao embutidas. Cada TypeField garante, no momento da criacao, que o valor armazenado respeita suas restricoes — eliminando a necessidade de validacoes manuais dispersas pelo codigo.

## Classe base: `TypeField<TPrimitive, TFormatted>`

Todos os Type Fields estendem a classe abstrata `TypeField<TPrimitive, TFormatted>`:

```typescript
abstract class TypeField<TPrimitive, TFormatted = TPrimitive> {
  abstract readonly typeInference: string;
  abstract readonly config: ITypeFieldConfig<TPrimitive>;

  protected constructor(value: TPrimitive, fieldPath: string);

  // Metodos de instancia
  getValue(): TPrimitive;
  formatted(): TFormatted;
  equals(other?: TypeField<TPrimitive, TFormatted>): boolean;
  toString(): string;
  toInt(): Result<number, ExceptionValidation>;
  isEmpty(): boolean;
  toJSON(): TPrimitive | string;
  getDescription(): string;
  getShortDescription(): string;
  getDocumentationAux(): { value: TPrimitive; formatted: TFormatted; description: string };
}
```

### Metodos estaticos (implementados por cada subclasse)

Toda subclasse concreta implementa dois factory methods com generics:

```typescript
// Retorna Result — caminho seguro (hot path)
static create<T = TPrimitive>(value: T, fieldPath?: string): Result<Instance, ExceptionValidation>;

// Lanca excecao se falhar — conveniencia para try/catch
static createOrThrow(value: TPrimitive, fieldPath?: string): Instance;
```

O generic `<T = TPrimitive>` no metodo `create` permite aceitar `unknown` quando chamado explicitamente pelo `SchemaBuilder`, mantendo type safety quando usado diretamente.

O metodo `create()` retorna um `Result<T, ExceptionValidation>`, permitindo tratamento explicito de erros. O metodo `createOrThrow()` lanca a excecao diretamente, sendo util em contextos onde try/catch e preferido.

### Niveis de validacao (createLevel / assignLevel)

A classe base `TypeField` expoe duas propriedades estaticas protegidas que controlam a profundidade da validacao:

```typescript
protected static readonly createLevel = tyforgeConfig.schema.validate.create;
protected static readonly assignLevel = tyforgeConfig.schema.validate.assign;
```

Esses niveis sao definidos pela [configuracao global](/guia/config/configuracao-global) (`tyforge.config.json`) e afetam como os TypeFields validam valores em cada modo:

| Nivel | Descricao |
|-------|-----------|
| `"full"` | Validacao completa: tipo + faixa/comprimento + enum |
| `"type"` | Apenas verificacao de tipo (sem faixa, comprimento ou enum) |
| `"none"` | Nenhuma validacao — valor aceito sem verificacao |

### Metodo normalize

Antes da validacao, o valor bruto passa pelo metodo `normalize`:

```typescript
protected static normalize(raw: unknown, validateLevel?: TValidationLevel, trim?: boolean): unknown
```

O `normalize` aplica `trim()` em strings por padrao. Quando `validateLevel` e `"none"`, retorna o valor sem modificacao.

TypeFields sensiveis (como `FPassword`, `FBearer`, `FSignature`) usam `trim = false` para preservar espacos significativos no valor original.

## `ITypeFieldConfig` — Configuracao de validacao

A configuracao e um tipo discriminado por `jsonSchemaType`. Cada tipo primitivo possui campos especificos:

| `jsonSchemaType` | Campos adicionais | Descricao |
|------------------|-------------------|-----------|
| `"string"` | `minLength`, `maxLength` | Comprimento minimo e maximo da string |
| `"number"` | `min`, `max`, `decimalPrecision` | Faixa numerica e casas decimais |
| `"boolean"` | — | Verificacao de tipo booleano |
| `"object"` | — | Verificacao de tipo objeto |
| `"array"` | `minItems?`, `maxItems?` | Limites de itens no array |
| `"Date"` | — | Verificacao de tipo Date |

Todos os configs possuem o campo opcional `serializeAsString` e `validateEnum` (para tipos com enum).

### Validacao por enum

O metodo estatico protegido `resolveEnum()` valida valores contra um objeto enum com cache via `WeakMap`:

```typescript
protected static resolveEnum<E extends Record<string, string | number>>(
  enumObj: E,
  raw: unknown,
  fieldPath: string,
): Result<E[keyof E], ExceptionValidation>;
```

## Convencao de nomenclatura

| Convencao | Exemplo |
|-----------|---------|
| Prefixo `F` no nome da classe | `FString`, `FEmail`, `FId` |
| Prefixo `T` no tipo primitivo | `TString`, `TEmail`, `TId` |
| Arquivo com sufixo `.format_vo.ts` | `email.format_vo.ts` |

## Exemplo: criando um TypeField customizado

```typescript
import { TypeField } from "tyforge";
import { ITypeFieldConfig } from "tyforge";
import { Result, ok, err, isFailure } from "tyforge";
import { ExceptionValidation } from "tyforge";

export type TCpf = string;

export class FCpf extends TypeField<TCpf> {
  override readonly typeInference = "FCpf";

  override readonly config: ITypeFieldConfig<TCpf> = {
    jsonSchemaType: "string",
    minLength: 11,
    maxLength: 14,
    serializeAsString: false,
  };

  private constructor(value: TCpf, fieldPath: string) {
    super(value, fieldPath);
  }

  static create(
    raw: TCpf,
    fieldPath = "Cpf",
  ): Result<FCpf, ExceptionValidation> {
    // Validacao customizada aqui
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 11) {
      return err(ExceptionValidation.create(fieldPath, "CPF deve ter 11 digitos"));
    }
    return ok(new FCpf(digits, fieldPath));
  }

  static createOrThrow(raw: TCpf, fieldPath = "Cpf"): FCpf {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override formatted(): string {
    const v = this.getValue();
    return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
  }

  override getDescription(): string {
    return "Cadastro de Pessoa Fisica (CPF)";
  }

  override getShortDescription(): string {
    return "CPF";
  }
}
```

## Proximos passos

- [Strings](/guia/type-fields/string) — FString, FEmail, FPassword, FFullName, FDescription, FText
- [Numericos](/guia/type-fields/numerico) — FInt, FPageNumber, FPageSize, FBoolInt
- [Datas](/guia/type-fields/data) — FDateTimeISOZMillis, FDateTimeISOZ, FDateISODate, FDateISOCompact
- [Identificadores](/guia/type-fields/identificador) — FId, FIdReq, FTraceId, FApiKey, FBearer, FSignature
- [Outros](/guia/type-fields/outros) — FBoolean, FJson, FHttpStatus, FAppStatus, FPublicKeyPem
