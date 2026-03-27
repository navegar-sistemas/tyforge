---
title: PIX
sidebar_position: 10
---

# Type Fields — PIX

Type Fields para o sistema de pagamentos instantaneos PIX do Banco Central do Brasil. Cobrem chaves PIX multi-formato e o enum de tipo de chave.

## Resumo

| Classe | Min | Max | Validacao extra | Arquivo |
|--------|-----|-----|-----------------|---------|
| `FPixKey` | 1 | 77 | CPF, CNPJ, telefone, email ou EVP | `pix-key.format_vo.ts` |
| `FPixKeyType` | 1 | 10 | Enum `OPixKeyType` | `pix-key-type.format_vo.ts` |

---

## FPixKey

Chave PIX multi-formato. Aceita os cinco tipos de chave definidos pelo Banco Central: CPF, CNPJ, telefone, email e EVP (chave aleatoria).

```typescript
import { FPixKey } from "tyforge";

const result = FPixKey.create("12345678901");
// Result<FPixKey, ExceptionValidation>
```

### Chave CPF (11 digitos)

```typescript
import { FPixKey } from "tyforge";

const cpf = FPixKey.createOrThrow("12345678901");
cpf.getValue(); // "12345678901"
```

### Chave CNPJ (14 digitos)

```typescript
import { FPixKey } from "tyforge";

const cnpj = FPixKey.createOrThrow("12345678000190");
cnpj.getValue(); // "12345678000190"
```

### Chave telefone (prefixo +)

```typescript
import { FPixKey } from "tyforge";

const telefone = FPixKey.createOrThrow("+5511999998888");
telefone.getValue(); // "+5511999998888"
```

### Chave email (contem @)

```typescript
import { FPixKey } from "tyforge";

const email = FPixKey.createOrThrow("usuario@exemplo.com");
email.getValue(); // "usuario@exemplo.com"
```

### Chave EVP (aleatoria, 32-36 alfanumericos)

```typescript
import { FPixKey } from "tyforge";

const evp = FPixKey.createOrThrow("a629532e-7693-4846-852d-1bbff57b00a9");
evp.getValue(); // "a629532e-7693-4846-852d-1bbff57b00a9"
```

**Regras de validacao:**
- Comprimento entre 1 e 77 caracteres
- Caracteres permitidos: alfanumericos, `@`, `.`, `+`, `-`, `_`
- Deve corresponder a pelo menos um dos formatos:
  - **CPF**: exatamente 11 digitos numericos
  - **CNPJ**: exatamente 14 digitos numericos
  - **Telefone**: inicia com `+`
  - **Email**: contem `@`
  - **EVP**: 32 a 36 caracteres alfanumericos (incluindo hifens)

---

## FPixKeyType

Tipo da chave PIX. Validado contra o enum `OPixKeyType`.

```typescript
import { FPixKeyType, OPixKeyType } from "tyforge";

const result = FPixKeyType.create(OPixKeyType.CPF);
// Result<FPixKeyType, ExceptionValidation>

const tipo = FPixKeyType.createOrThrow("EMAIL");
tipo.getValue(); // "EMAIL"
```

### Constante `OPixKeyType`

```typescript
export const OPixKeyType = {
  CPF: "CPF",
  CNPJ: "CNPJ",
  EMAIL: "EMAIL",
  PHONE: "PHONE",
  EVP: "EVP",
} as const;
```

### Tipos relacionados

```typescript
export type TKeyPixKeyType = keyof typeof OPixKeyType;
// "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP"

export type TPixKeyType = (typeof OPixKeyType)[TKeyPixKeyType];
// "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP"
```

### Exemplo com schema

```typescript
import { FPixKey, FPixKeyType, ISchema } from "tyforge";

const schema = {
  pixKey: { type: FPixKey },
  pixKeyType: { type: FPixKeyType },
} satisfies ISchema;
```

**Regras de validacao:**
- Aceita apenas os valores do enum: `"CPF"`, `"CNPJ"`, `"EMAIL"`, `"PHONE"` ou `"EVP"`
- Qualquer outro valor e rejeitado
