---
title: Documentos
sidebar_position: 8
---

# Type Fields — Documentos

Type Fields para validação de documentos de identificação. Inclui documentos brasileiros (CPF, CNPJ, RG) e tipos genéricos para sistemas multi-locale.

## Resumo

| Classe | Min | Max | Validação extra | Arquivo |
|--------|-----|-----|-----------------|---------|
| `FDocumentId` | 1 | 20 | Alfanumérico; locale `br`: 11 dígitos (CPF) ou 14 (CNPJ) | `document-id.format_vo.ts` |
| `FDocumentCpf` | 11 | 11 | Exatamente 11 dígitos numéricos | `document-cpf.format_vo.ts` |
| `FDocumentCnpj` | 14 | 14 | Exatamente 14 dígitos numéricos | `document-cnpj.format_vo.ts` |
| `FDocumentCpfOrCnpj` | 11 | 14 | 11 dígitos (CPF) ou 14 dígitos (CNPJ) | `document-cpf-or-cnpj.format_vo.ts` |
| `FDocumentRg` | 7 | 14 | Alfanumérico | `document-rg.format_vo.ts` |
| `FDocumentType` | 1 | 20 | Enum `ODocumentType` | `document-type.format_vo.ts` |
| `FDocumentStateRegistration` | 1 | 20 | Apenas dígitos numéricos | `document-state-registration.format_vo.ts` |
| `FDocumentMunicipalRegistration` | 1 | 20 | Apenas dígitos numéricos | `document-municipal-registration.format_vo.ts` |

---

## FDocumentId

Identificador genérico de documento com validação locale-aware. No modo padrão, aceita qualquer string alfanumérica de 1 a 20 caracteres. Com `TypeField.localeRegion = "br"`, valida especificamente CPF (11 dígitos) ou CNPJ (14 dígitos).

```typescript
import { FDocumentId } from "tyforge";

// Modo genérico (qualquer locale)
const result = FDocumentId.create("ABC123456");
// Result<FDocumentId, ExceptionValidation>

const doc = FDocumentId.createOrThrow("ABC123456");
doc.getValue(); // "ABC123456"
```

### Com locale brasileiro

```typescript
import { FDocumentId, TypeField } from "tyforge";

TypeField.configure({ localeRegion: "br" });

// Aceita CPF (11 dígitos)
const cpf = FDocumentId.createOrThrow("12345678901");

// Aceita CNPJ (14 dígitos)
const cnpj = FDocumentId.createOrThrow("12345678000190");

// Rejeita formatos inválidos para locale br
const invalido = FDocumentId.create("ABC123");
// Result com erro: "Brazilian document must be exactly 11 digits (CPF) or 14 digits (CNPJ)"
```

**Regras de validação:**
- Modo genérico: apenas caracteres alfanuméricos (`/^[a-zA-Z0-9]+$/`)
- Locale `br`: exatamente 11 dígitos (CPF) ou 14 dígitos (CNPJ)

---

## FDocumentCpf

Número de CPF brasileiro (Cadastro de Pessoas Físicas). Armazena 11 dígitos numéricos e oferece formatação automática no padrão XXX.XXX.XXX-XX.

```typescript
import { FDocumentCpf } from "tyforge";

const result = FDocumentCpf.create("12345678901");
// Result<FDocumentCpf, ExceptionValidation>

const cpf = FDocumentCpf.createOrThrow("12345678901");
cpf.getValue();  // "12345678901"
cpf.formatted(); // "123.456.789-01"
```

**Regras de validação:**
- Exatamente 11 dígitos numéricos (`/^\d{11}$/`)
- Valores com pontuação ou letras são rejeitados

---

## FDocumentCnpj

Número de CNPJ brasileiro (Cadastro Nacional da Pessoa Jurídica). Armazena 14 dígitos numéricos e oferece formatação automática no padrão XX.XXX.XXX/XXXX-XX.

```typescript
import { FDocumentCnpj } from "tyforge";

const result = FDocumentCnpj.create("12345678000190");
// Result<FDocumentCnpj, ExceptionValidation>

const cnpj = FDocumentCnpj.createOrThrow("12345678000190");
cnpj.getValue();  // "12345678000190"
cnpj.formatted(); // "12.345.678/0001-90"
```

**Regras de validação:**
- Exatamente 14 dígitos numéricos (`/^\d{14}$/`)
- Valores com pontuação ou letras são rejeitados

---

## FDocumentCpfOrCnpj

Aceita tanto CPF (11 dígitos) quanto CNPJ (14 dígitos). Útil para campos onde o tipo de pessoa (física ou jurídica) não é conhecido previamente. Oferece métodos para identificar o tipo do documento.

```typescript
import { FDocumentCpfOrCnpj } from "tyforge";

// Com CPF
const cpf = FDocumentCpfOrCnpj.createOrThrow("12345678901");
cpf.isCpf();     // true
cpf.isCnpj();    // false
cpf.formatted(); // "123.456.789-01"

// Com CNPJ
const cnpj = FDocumentCpfOrCnpj.createOrThrow("12345678000190");
cnpj.isCpf();     // false
cnpj.isCnpj();    // true
cnpj.formatted(); // "12.345.678/0001-90"
```

**Métodos de instância:**
- `isCpf()` — retorna `true` se o documento tem 11 dígitos (CPF)
- `isCnpj()` — retorna `true` se o documento tem 14 dígitos (CNPJ)
- `formatted()` — formata automaticamente no padrão correspondente

**Regras de validação:**
- Deve ser exatamente 11 dígitos (CPF) ou 14 dígitos (CNPJ)
- Apenas dígitos numéricos

---

## FDocumentRg

Número de RG brasileiro (Registro Geral / Carteira de Identidade). Aceita caracteres alfanuméricos entre 7 e 14 posições.

```typescript
import { FDocumentRg } from "tyforge";

const result = FDocumentRg.create("1234567");
// Result<FDocumentRg, ExceptionValidation>

const rg = FDocumentRg.createOrThrow("12345678X");
rg.getValue(); // "12345678X"
```

**Regras de validação:**
- Comprimento entre 7 e 14 caracteres
- Apenas caracteres alfanuméricos (`/^[a-zA-Z0-9]+$/`)

---

## FDocumentType

Tipo de documento de identificação. Validado contra o enum `ODocumentType`.

```typescript
import { FDocumentType, ODocumentType } from "tyforge";

const result = FDocumentType.create(ODocumentType.NATIONAL_ID);
// Result<FDocumentType, ExceptionValidation>

const tipo = FDocumentType.createOrThrow("PASSPORT");
tipo.getValue(); // "PASSPORT"
```

### Constante `ODocumentType`

```typescript
export const ODocumentType = {
  NATIONAL_ID: "NATIONAL_ID",
  DRIVER_LICENSE: "DRIVER_LICENSE",
  PASSPORT: "PASSPORT",
  RESIDENCE_PERMIT: "RESIDENCE_PERMIT",
  TAX_ID: "TAX_ID",
} as const;
```

### Tipos relacionados

```typescript
export type TKeyDocumentType = keyof typeof ODocumentType;
// "NATIONAL_ID" | "DRIVER_LICENSE" | "PASSPORT" | "RESIDENCE_PERMIT" | "TAX_ID"

export type TDocumentType = (typeof ODocumentType)[TKeyDocumentType];
// "NATIONAL_ID" | "DRIVER_LICENSE" | "PASSPORT" | "RESIDENCE_PERMIT" | "TAX_ID"
```

**Regras de validação:**
- Aceita apenas os valores do enum `ODocumentType`
- Qualquer outro valor é rejeitado

---

## FDocumentStateRegistration

Número de inscrição estadual (IE). Armazena apenas dígitos numéricos com comprimento variável (1 a 20 caracteres).

```typescript
import { FDocumentStateRegistration } from "tyforge";

const result = FDocumentStateRegistration.create("1234567890");
// Result<FDocumentStateRegistration, ExceptionValidation>

const ie = FDocumentStateRegistration.createOrThrow("1234567890");
ie.getValue(); // "1234567890"
```

**Regras de validação:**
- Comprimento entre 1 e 20 caracteres
- Apenas dígitos numéricos (`/^\d+$/`)

---

## FDocumentMunicipalRegistration

Número de inscrição municipal (IM). Armazena apenas dígitos numéricos com comprimento variável (1 a 20 caracteres).

```typescript
import { FDocumentMunicipalRegistration } from "tyforge";

const result = FDocumentMunicipalRegistration.create("987654321");
// Result<FDocumentMunicipalRegistration, ExceptionValidation>

const im = FDocumentMunicipalRegistration.createOrThrow("987654321");
im.getValue(); // "987654321"
```

**Regras de validação:**
- Comprimento entre 1 e 20 caracteres
- Apenas dígitos numéricos (`/^\d+$/`)
