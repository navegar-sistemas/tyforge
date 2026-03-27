---
title: Type Fields
sidebar_position: 1
---

# Type Fields

**Type Fields** são Value Objects validados que encapsulam valores primitivos com regras de validação embutidas. Cada TypeField garante, no momento da criação, que o valor armazenado respeita suas restrições — eliminando a necessidade de validações manuais dispersas pelo código.

:::tip Zero Boilerplate
TyForge inclui TypeFields prontos para padrões comuns: strings, emails, moeda (com aritmética), bancário, autenticação. A filosofia é: instalar, importar, usar — sem código de validação customizado. Se um padrão é recorrente, ele pertence ao TyForge.
:::

:::info Locale-aware
O sistema de locale tem dois eixos: `localeDisplay` (formatação) e `localeRules` (regras de validação). Tipos estritos (`TLocaleDisplay`, `TLocaleRules`) garantem exaustividade em compile-time. Default: `"us"`. Configure via `TypeField.configure({ localeDisplay: "br", localeRules: "br" })`.
:::

## Classe base: `TypeField<TPrimitive, TFormatted>`

Todos os Type Fields estendem a classe abstrata `TypeField<TPrimitive, TFormatted>`:

```typescript
abstract class TypeField<TPrimitive, TFormatted = TPrimitive> {
  abstract readonly typeInference: string;
  abstract readonly config: ITypeFieldConfig<TPrimitive>;

  protected constructor(value: TPrimitive, fieldPath: string);

  // Métodos de instância
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

### Métodos estáticos (implementados por cada subclasse)

Toda subclasse concreta implementa quatro métodos estáticos:

```typescript
// Validação de tipo (narrowing) — retorna o valor tipado ou erro
static validateType(value: unknown, fieldPath: string): Result<TPrimitive, ExceptionValidation>;

// Retorna Result — caminho seguro para dados de entrada (hot path)
static create<T = TPrimitive>(value: T, fieldPath?: string): Result<Instance, ExceptionValidation>;

// Lança exceção se falhar — conveniência para try/catch
static createOrThrow(value: TPrimitive, fieldPath?: string): Instance;

// Retorna Result — caminho seguro para hidratação de dados persistidos
static assign<T = TPrimitive>(value: T, fieldPath?: string): Result<Instance, ExceptionValidation>;
```

O generic `<T = TPrimitive>` nos métodos `create` e `assign` permite aceitar `unknown` quando chamado explicitamente pelo `SchemaBuilder`, mantendo type safety quando usado diretamente.

O método `validateType()` é um método estático que faz narrowing do valor usando `TypeGuard` (ex: `TypeGuard.isString()`). Ele é chamado tanto por `create()` quanto por `assign()` antes de instanciar o TypeField.

O método `create()` retorna um `Result<T, ExceptionValidation>`, permitindo tratamento explícito de erros. Internamente chama `validateType()` + `validateRules()` com `TypeField.createLevel`.

O método `assign()` segue o mesmo fluxo, mas usa `TypeField.assignLevel` para validação. É usado para hidratar dados já persistidos (ex: registros do banco de dados).

O método `createOrThrow()` lança a exceção diretamente, sendo útil em contextos onde try/catch é preferido.

### Métodos de formulário: `formCreate()` / `formAssign()`

TypeFields numéricos e booleanos possuem métodos `formCreate()` e `formAssign()` que normalizam dados de formulário (sempre string) antes de validar:

```typescript
// Formulário envia "42" como string
const result = FInt.formCreate("42");
// normaliza "42" → 42, depois chama FInt.create(42)

const bool = FBoolean.formCreate("true");
// normaliza "true" → true, depois chama FBoolean.create(true)
```

Disponível em: `FInt`, `FFloat`, `FMoney`, `FPageNumber`, `FPageSize`, `FBoolean`.

### Níveis de validação (createLevel / assignLevel)

A classe base `TypeField` expõe duas propriedades estáticas públicas que controlam a profundidade da validação:

```typescript
static createLevel: TValidationLevel = "full";
static assignLevel: TValidationLevel = "type";
```

Esses níveis são definidos com valores padrão hardcoded e podem ser alterados via `TypeField.configure()`. Afetam como os TypeFields validam valores em cada modo:

| Nível | Descrição |
|-------|-----------|
| `"full"` | Validação completa: tipo + faixa/comprimento + enum |
| `"type"` | Apenas verificação de tipo (sem faixa, comprimento ou enum) |
| `"none"` | Nenhuma validação — valor aceito sem verificação |

### Método `TypeField.configure()`

Permite alterar níveis de validação e locales em tempo de execução:

```typescript
static configure(options: {
  create?: TValidationLevel;
  assign?: TValidationLevel;
  localeDisplay?: TLocaleDisplay;
  localeRules?: TLocaleRules;
}): void;
```

Exemplo de uso:

```typescript
import { TypeField } from "tyforge";

// Ajustar validação por ambiente
TypeField.configure({ create: "full", assign: "none" });

// Configurar locale brasileiro (formatação + regras)
TypeField.configure({ localeDisplay: "br", localeRules: "br" });
```

- `localeDisplay` controla formatação (`formatted()`, `formatNumber()`)
- `localeRules` controla regras de validação de negócio (bancário, documentos, estados)

### Validação em duas etapas: `validateType()` + `validateRules()`

Cada TypeField concreto implementa a validação em duas etapas separadas:

1. **`validateType()`** (estático) — faz narrowing do tipo usando `TypeGuard`. Garante que o valor é do tipo primitivo esperado (string, number, boolean, etc).
2. **`validateRules()`** (instância) — valida regras de negócio (comprimento, faixa, enum) conforme o nível de validação (`createLevel` ou `assignLevel`).

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

Essa separação elimina validação dupla — `validateType()` é chamado uma única vez e o resultado tipado é reaproveitado.

## `ITypeFieldConfig` — Configuração de validação

A configuração é um tipo discriminado por `jsonSchemaType`. Cada tipo primitivo possui campos específicos:

| `jsonSchemaType` | Campos adicionais | Descrição |
|------------------|-------------------|-----------|
| `"string"` | `minLength`, `maxLength` | Comprimento mínimo e máximo da string |
| `"number"` | `min`, `max`, `decimalPrecision` | Faixa numérica e casas decimais |
| `"boolean"` | — | Verificação de tipo booleano |
| `"object"` | — | Verificação de tipo objeto |
| `"array"` | `minItems?`, `maxItems?` | Limites de itens no array |
| `"Date"` | — | Verificação de tipo Date |

Todos os configs possuem o campo opcional `serializeAsString` e `validateEnum` (para tipos com enum).

### Validação por enum

O método estático protegido `resolveEnum()` valida valores contra um objeto enum com cache via `WeakMap`:

```typescript
protected static resolveEnum<E extends Record<string, string | number>>(
  enumObj: E,
  raw: unknown,
  fieldPath: string,
): Result<E[keyof E], ExceptionValidation>;
```

## Convenção de nomenclatura

| Convenção | Exemplo |
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
      return err(ExceptionValidation.create(fieldPath, "CPF deve ter 11 dígitos"));
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
    return "Cadastro de Pessoa Física (CPF)";
  }

  override getShortDescription(): string {
    return "CPF";
  }
}
```

## Próximos passos

- [Strings](/guia/type-fields/string) — FString, FEmail, FPassword, FFullName, FDescription, FText, FBusinessName
- [Numéricos](/guia/type-fields/numerico) — FInt, FFloat, FPageNumber, FPageSize, FBoolInt
- [Moeda](/guia/type-fields/moeda) — FMoney, FCurrency
- [Datas](/guia/type-fields/data) — FDateTimeISOZMillis, FDateTimeISOZ, FDateISODate, FDateISOCompact
- [Identificadores](/guia/type-fields/identificador) — FIdentifier, FId, FIdReq, FTraceId, FTransactionId, FDeviceId, FCorrelationId, FReconciliationId, FIdempotencyKey
- [Documentos](/guia/type-fields/documento) — FDocumentId, FDocumentCpf, FDocumentCnpj, FDocumentCpfOrCnpj, FDocumentRg, FDocumentType, FDocumentStateRegistration, FDocumentMunicipalRegistration
- [Bancário](/guia/type-fields/bancario) — FBankCode, FBankBranch, FBankAccountNumber, FBankNsu, FBankE2eId, FEmvQrCodePayload
- [PIX](/guia/type-fields/pix) — FPixKey, FPixKeyType
- [Segurança](/guia/type-fields/seguranca) — FApiKey, FBearer, FSignature, FPublicKeyPem, FCertificateThumbprint, FHashAlgorithm, FTotpCode, FTotpSecret
- [Enums](/guia/type-fields/enums) — FPersonType, FGender, FMaritalStatus, FTransactionStatus, FAppStatus, FHttpStatus, FStateCode
- [Outros](/guia/type-fields/outros) — FBoolean, FJson
