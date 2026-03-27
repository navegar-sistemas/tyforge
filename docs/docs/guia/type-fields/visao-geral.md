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

Toda subclasse concreta implementa quatro metodos estaticos:

```typescript
// Validacao de tipo (narrowing) — retorna o valor tipado ou erro
static validateType(value: unknown, fieldPath: string): Result<TPrimitive, ExceptionValidation>;

// Retorna Result — caminho seguro para dados de entrada (hot path)
static create<T = TPrimitive>(value: T, fieldPath?: string): Result<Instance, ExceptionValidation>;

// Lanca excecao se falhar — conveniencia para try/catch
static createOrThrow(value: TPrimitive, fieldPath?: string): Instance;

// Retorna Result — caminho seguro para hidratacao de dados persistidos
static assign<T = TPrimitive>(value: T, fieldPath?: string): Result<Instance, ExceptionValidation>;
```

O generic `<T = TPrimitive>` nos metodos `create` e `assign` permite aceitar `unknown` quando chamado explicitamente pelo `SchemaBuilder`, mantendo type safety quando usado diretamente.

O metodo `validateType()` e um metodo estatico que faz narrowing do valor usando `TypeGuard` (ex: `TypeGuard.isString()`). Ele e chamado tanto por `create()` quanto por `assign()` antes de instanciar o TypeField.

O metodo `create()` retorna um `Result<T, ExceptionValidation>`, permitindo tratamento explicito de erros. Internamente chama `validateType()` + `validateRules()` com `TypeField.createLevel`.

O metodo `assign()` segue o mesmo fluxo, mas usa `TypeField.assignLevel` para validacao. E usado para hidratar dados ja persistidos (ex: registros do banco de dados).

O metodo `createOrThrow()` lanca a excecao diretamente, sendo util em contextos onde try/catch e preferido.

### Niveis de validacao (createLevel / assignLevel)

A classe base `TypeField` expoe duas propriedades estaticas publicas que controlam a profundidade da validacao:

```typescript
static createLevel: TValidationLevel = "full";
static assignLevel: TValidationLevel = "type";
```

Esses niveis sao definidos com valores padrao hardcoded e podem ser alterados via `TypeField.configure()`. Afetam como os TypeFields validam valores em cada modo:

| Nivel | Descricao |
|-------|-----------|
| `"full"` | Validacao completa: tipo + faixa/comprimento + enum |
| `"type"` | Apenas verificacao de tipo (sem faixa, comprimento ou enum) |
| `"none"` | Nenhuma validacao — valor aceito sem verificacao |

### Metodo `TypeField.configure()`

Permite alterar os niveis de validacao em tempo de execucao:

```typescript
static configure(levels: { create?: TValidationLevel; assign?: TValidationLevel }): void;
```

Exemplo de uso:

```typescript
import { TypeField } from "tyforge";

TypeField.configure({ create: "full", assign: "none" });
```

Isso e util para ajustar o comportamento de validacao por ambiente (ex: desabilitar validacao no `assign` em producao para maximizar performance).

### Validacao em duas etapas: `validateType()` + `validateRules()`

Cada TypeField concreto implementa a validacao em duas etapas separadas:

1. **`validateType()`** (estatico) — faz narrowing do tipo usando `TypeGuard`. Garante que o valor e do tipo primitivo esperado (string, number, boolean, etc).
2. **`validateRules()`** (instancia) — valida regras de negocio (comprimento, faixa, enum) conforme o nivel de validacao (`createLevel` ou `assignLevel`).

```typescript
// Exemplo do fluxo interno de FString.create()
static create<T = TString>(raw: T, fieldPath = "String"): Result<FString, ExceptionValidation> {
  const typed = FString.validateType(raw, fieldPath);        // etapa 1: narrowing
  if (isFailure(typed)) return err(typed.error);
  const instance = new FString(typed.value, fieldPath);
  const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel); // etapa 2: regras
  if (!rules.success) return err(rules.error);
  return ok(instance);
}
```

Essa separacao elimina validacao dupla — `validateType()` e chamado uma unica vez e o resultado tipado e reaproveitado.

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
import { TypeField, TValidationLevel } from "tyforge";
import { ITypeFieldConfig } from "tyforge";
import { Result, ok, err, isFailure, OK_TRUE } from "tyforge";
import { ExceptionValidation } from "tyforge";
import { TypeGuard } from "tyforge";

export type TCpf = string;
export type TCpfFormatted = string;

export class FCpf extends TypeField<TCpf, TCpfFormatted> {
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

  protected override validateRules(
    value: TCpf,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    // Business rules specific to CPF format
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 11) {
      return err(ExceptionValidation.create(fieldPath, "CPF deve ter 11 digitos"));
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TCpf, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TCpf>(raw: T, fieldPath = "Cpf"): Result<FCpf, ExceptionValidation> {
    const typed = FCpf.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FCpf(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TCpf, fieldPath = "Cpf"): FCpf {
    const result = FCpf.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TCpf>(value: T, fieldPath = "Cpf"): Result<FCpf, ExceptionValidation> {
    const typed = FCpf.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FCpf(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override formatted(): TCpfFormatted {
    const v = this.getValue();
    return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
  }

  override toString(): string {
    return this.getValue();
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
