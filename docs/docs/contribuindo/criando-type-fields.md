---
title: Criando TypeFields
sidebar_position: 7
---

# Criando TypeFields

Este guia documenta o processo completo para criar um novo TypeField no TyForge. Todo TypeField segue uma estrutura obrigatória com métodos padronizados.

## Quando criar um TypeField

Se o projeto consumidor precisar de um formato que não existe (ex: CPF, CNPJ, telefone, moeda), o TypeField deve ser criado **dentro do TyForge** em `src/type-fields/`. A filosofia do projeto é zero boilerplate: instalar, importar, usar.

## Estrutura obrigatória

Arquivo: `src/type-fields/{nome-em-ingles}.typefield.ts`

O exemplo abaixo mostra a estrutura completa de um TypeField para CPF:

```typescript
import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TCpf = string;
export type TCpfFormatted = string;

export class FCpf extends TypeField<TCpf, TCpfFormatted> {
  override readonly typeInference = "FCpf";

  override readonly config: ITypeFieldConfig<TCpf> = {
    jsonSchemaType: "string",
    serializeAsString: false,
    minLength: 11,
    maxLength: 14,
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

    // Regras de negócio específicas do CPF
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 11) {
      return err(ExceptionValidation.create(fieldPath, "CPF must have exactly 11 digits"));
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

  static createOrThrow(value: TCpf, fieldPath = "Cpf"): FCpf {
    const result = FCpf.create(value, fieldPath);
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
    return this.getValue();
  }

  override toString(): string {
    return this.getValue();
  }

  override getDescription(): string {
    return "Brazilian individual taxpayer identification number (CPF).";
  }

  override getShortDescription(): string {
    return "CPF";
  }
}
```

### Anatomia de cada método

| Método | Tipo | Responsabilidade |
|--------|------|------------------|
| `constructor` | `private` | Recebe `value` e `fieldPath`, repassa ao `super` |
| `validateType` | `static` | Narrowing de tipo — usa `TypeGuard`, retorna `Result<TPrimitive>` |
| `create<T>` | `static` | Validação completa — `validateType` + `validateRules` com `TypeField.createLevel` |
| `createOrThrow` | `static` | Wrapper que faz throw em caso de falha |
| `assign<T>` | `static` | Hidratação — `validateType` + `validateRules` com `TypeField.assignLevel` |
| `validateRules` | `protected override` | Regras de negócio — chama `super.validateRules()` primeiro, depois regras extras |
| `formatted()` | `override` | Representação formatada do valor |
| `toString()` | `override` | Representação textual do valor |
| `getDescription()` | `override` | Descrição longa em inglês |
| `getShortDescription()` | `override` | Descrição curta em inglês |

### Propriedades obrigatórias

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `typeInference` | `override readonly` | Nome da classe como string literal para inferência de tipo |
| `config` | `override readonly ITypeFieldConfig<T>` | Configuração com `jsonSchemaType` e `serializeAsString` obrigatórios |

## Registrar exports

Após criar o arquivo do TypeField, registrar os exports em dois locais.

### 1. `src/type-fields/index.ts`

```typescript
export { FCpf, TCpf, TCpfFormatted } from "./cpf.typefield";
```

Exportar sempre os três artefatos: a classe `F`, o tipo primitivo `T` e o tipo formatado `TFormatted`.

### 2. `src/index.ts`

Na seção de Type Fields:

```typescript
export { FCpf } from "./type-fields/cpf.typefield";
```

Na API pública, exportar apenas a classe.

## Enums como TypeField

TypeFields que representam um conjunto fechado de valores utilizam um objeto `as const` com prefixo `O`:

```typescript
import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export const OPaymentMethod = {
  CREDIT: "credit",
  DEBIT: "debit",
  PIX: "pix",
} as const;

export type TKeyPaymentMethod = keyof typeof OPaymentMethod;
export type TPaymentMethod = (typeof OPaymentMethod)[TKeyPaymentMethod];
export type TPaymentMethodFormatted = string;

export class FPaymentMethod extends TypeField<TPaymentMethod, TPaymentMethodFormatted> {
  override readonly typeInference = "FPaymentMethod";

  override readonly config: ITypeFieldConfig<TPaymentMethod> = {
    jsonSchemaType: "string",
    serializeAsString: false,
    minLength: 1,
    maxLength: 20,
    validateEnum: OPaymentMethod,
  };

  private constructor(value: TPaymentMethod, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(
    value: unknown,
    fieldPath: string,
  ): Result<TPaymentMethod, ExceptionValidation> {
    const str = TypeGuard.isString(value, fieldPath);
    if (isFailure(str)) return err(str.error);
    return TypeField.resolveEnum(OPaymentMethod, str.value, fieldPath);
  }

  static create<T = TPaymentMethod>(
    raw: T,
    fieldPath = "PaymentMethod",
  ): Result<FPaymentMethod, ExceptionValidation> {
    const typed = FPaymentMethod.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FPaymentMethod(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TPaymentMethod, fieldPath = "PaymentMethod"): FPaymentMethod {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TPaymentMethod>(
    value: T,
    fieldPath = "PaymentMethod",
  ): Result<FPaymentMethod, ExceptionValidation> {
    const typed = FPaymentMethod.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FPaymentMethod(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TPaymentMethodFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Payment method type.";
  }

  override getShortDescription(): string {
    return "Payment method";
  }
}
```

### Diferenças em relação ao TypeField padrão

1. **Objeto const `O`:** declarado antes da classe com prefixo `O` e `as const`
2. **Type alias `TKey`:** `keyof typeof O{Nome}` para as chaves do enum
3. **Tipo do valor:** derivado do objeto — `(typeof O{Nome})[TKey{Nome}]`
4. **`validateEnum` no config:** o campo `validateEnum` na configuração habilita validação automática contra o enum pela classe base
5. **`validateType` com `resolveEnum`:** usa `TypeField.resolveEnum()` para validar que o valor pertence ao enum

### Registrar exports de enums

No barrel, exportar também o objeto `O`:

```typescript
// src/type-fields/index.ts
export {
  FPaymentMethod, TPaymentMethod, TPaymentMethodFormatted, OPaymentMethod,
} from "./payment-method.typefield";
```

## TypeFields locale-aware

TypeFields que dependem de localidade (ex: `FBankCode`, `FBankBranch`, `FStateCode`, `FBankAccountNumber`) utilizam `TypeField.localeRegion` para aplicar regras específicas no `validateRules()`. O método `formatted("data")` utiliza `TypeField.localeData` para formatar valores destinados a APIs ou persistência. Não há herança por locale — uma única classe com lógica condicional via `switch` exaustivo:

```typescript
protected override validateRules(
  value: TBankCode,
  fieldPath: string,
  validateLevel: TValidationLevel = "full",
): Result<true, ExceptionValidation> {
  const base = super.validateRules(value, fieldPath, validateLevel);
  if (!base.success) return base;
  if (validateLevel !== "full") return OK_TRUE;

  // Validações genéricas (todos os locales)
  if (!DIGITS_REGEX.test(value)) {
    return err(ExceptionValidation.create(fieldPath, "Bank code must contain only numeric digits"));
  }

  // Validações específicas por locale
  switch (TypeField.localeRegion) {
    case "us":
      break;
    case "br":
      if (!ISPB_REGEX.test(value)) {
        return err(
          ExceptionValidation.create(fieldPath, "ISPB bank code must be exactly 8 numeric digits"),
        );
      }
      break;
    default:
      TypeField.assertNeverLocale(TypeField.localeRegion);
  }

  return OK_TRUE;
}
```

### Regras do padrão locale-aware

- O `switch` deve ser **exaustivo**: todos os locales suportados devem ter um `case`, e o `default` deve chamar `TypeField.assertNeverLocale()` para garantir verificação em tempo de compilação
- Regras de localidade são aplicadas apenas quando `validateLevel === "full"`
- O locale padrão é `"us"` (Estados Unidos)
- Para configurar o locale, usar `TypeField.configure({ localeRegion: "br", localeData: "br" })` no bootstrap da aplicação
- Locales suportados: `"us"` (Estados Unidos), `"br"` (Brasil)
- `localeData` controla formatação para API/persistência via `formatted("data")`

## Checklist de validação

Antes de considerar um TypeField como concluído, verificar **todos** os itens:

- [ ] Arquivo em `src/type-fields/{nome}.typefield.ts`
- [ ] Exporta 2 type aliases: `T{Nome}` + `T{Nome}Formatted`
- [ ] Nome da classe em inglês com prefixo `F`
- [ ] Constructor é `private`
- [ ] `override readonly typeInference` declarado
- [ ] `override readonly config: ITypeFieldConfig<T>` com `jsonSchemaType` e `serializeAsString`
- [ ] `validateType(value, fieldPath)` -- static, retorna `Result<TPrimitive, ExceptionValidation>`
- [ ] `create<T = TPrimitive>(raw: T, fieldPath?)` -- genérico para aceitar `unknown`
- [ ] `createOrThrow(value, fieldPath?)`
- [ ] `assign<T = TPrimitive>(value: T, fieldPath?)` -- genérico para aceitar `unknown`
- [ ] `validateRules(value, fieldPath, validateLevel)` -- protected override, chama `super.validateRules()` + regras extras
- [ ] `formatted()`, `toString()`, `getDescription()`, `getShortDescription()` -- override
- [ ] `TypeGuard` para narrowing (sem `typeof` manual, sem cast)
- [ ] `TypeField.createLevel` / `TypeField.assignLevel` em vez de hardcode
- [ ] Zero `as` casts
- [ ] Zero `any`
- [ ] Zero `!` non-null assertions
- [ ] Zero `tyforge-lint-disable`
- [ ] Exportado em `src/type-fields/index.ts` (3 exports: `F` + `T` + `TFormatted`)
- [ ] Exportado em `src/index.ts`
- [ ] `npm run typecheck` passa
- [ ] `npm run test` passa
- [ ] `npx tyforge-lint` -- zero erros e zero warnings
