---
title: Documentos
sidebar_position: 8
---

# Type Fields — Documentos

Type Fields para validacao de documentos de identificacao. Inclui documentos brasileiros (CPF, CNPJ, RG) e tipos genericos para sistemas multi-locale.

## Resumo

| Classe | Min | Max | Validacao extra | Arquivo |
|--------|-----|-----|-----------------|---------|
| `FDocumentId` | 1 | 20 | Alfanumerico; locale `br`: 11 digitos (CPF) ou 14 (CNPJ) | `document-id.format_vo.ts` |
| `FDocumentCpf` | 11 | 11 | Exatamente 11 digitos numericos | `document-cpf.format_vo.ts` |
| `FDocumentCnpj` | 14 | 14 | Exatamente 14 digitos numericos | `document-cnpj.format_vo.ts` |
| `FDocumentCpfOrCnpj` | 11 | 14 | 11 digitos (CPF) ou 14 digitos (CNPJ) | `document-cpf-or-cnpj.format_vo.ts` |
| `FDocumentRg` | 7 | 14 | Alfanumerico | `document-rg.format_vo.ts` |
| `FDocumentType` | 1 | 20 | Enum `ODocumentType` | `document-type.format_vo.ts` |
| `FDocumentStateRegistration` | 1 | 20 | Apenas digitos numericos | `document-state-registration.format_vo.ts` |
| `FDocumentMunicipalRegistration` | 1 | 20 | Apenas digitos numericos | `document-municipal-registration.format_vo.ts` |

---

## FDocumentId

Identificador generico de documento com validacao locale-aware. No modo padrao, aceita qualquer string alfanumerica de 1 a 20 caracteres. Com `TypeField.locale = "br"`, valida especificamente CPF (11 digitos) ou CNPJ (14 digitos).

```typescript
import { FDocumentId } from "tyforge";

// Modo generico (qualquer locale)
const result = FDocumentId.create("ABC123456");
// Result<FDocumentId, ExceptionValidation>

const doc = FDocumentId.createOrThrow("ABC123456");
doc.getValue(); // "ABC123456"
```

### Com locale brasileiro

```typescript
import { FDocumentId, TypeField } from "tyforge";

TypeField.configure({ locale: "br" });

// Aceita CPF (11 digitos)
const cpf = FDocumentId.createOrThrow("12345678901");

// Aceita CNPJ (14 digitos)
const cnpj = FDocumentId.createOrThrow("12345678000190");

// Rejeita formatos invalidos para locale br
const invalido = FDocumentId.create("ABC123");
// Result com erro: "Brazilian document must be exactly 11 digits (CPF) or 14 digits (CNPJ)"
```

**Regras de validacao:**
- Modo generico: apenas caracteres alfanumericos (`/^[a-zA-Z0-9]+$/`)
- Locale `br`: exatamente 11 digitos (CPF) ou 14 digitos (CNPJ)

---

## FDocumentCpf

Numero de CPF brasileiro (Cadastro de Pessoas Fisicas). Armazena 11 digitos numericos e oferece formatacao automatica no padrao XXX.XXX.XXX-XX.

```typescript
import { FDocumentCpf } from "tyforge";

const result = FDocumentCpf.create("12345678901");
// Result<FDocumentCpf, ExceptionValidation>

const cpf = FDocumentCpf.createOrThrow("12345678901");
cpf.getValue();  // "12345678901"
cpf.formatted(); // "123.456.789-01"
```

**Regras de validacao:**
- Exatamente 11 digitos numericos (`/^\d{11}$/`)
- Valores com pontuacao ou letras sao rejeitados

---

## FDocumentCnpj

Numero de CNPJ brasileiro (Cadastro Nacional da Pessoa Juridica). Armazena 14 digitos numericos e oferece formatacao automatica no padrao XX.XXX.XXX/XXXX-XX.

```typescript
import { FDocumentCnpj } from "tyforge";

const result = FDocumentCnpj.create("12345678000190");
// Result<FDocumentCnpj, ExceptionValidation>

const cnpj = FDocumentCnpj.createOrThrow("12345678000190");
cnpj.getValue();  // "12345678000190"
cnpj.formatted(); // "12.345.678/0001-90"
```

**Regras de validacao:**
- Exatamente 14 digitos numericos (`/^\d{14}$/`)
- Valores com pontuacao ou letras sao rejeitados

---

## FDocumentCpfOrCnpj

Aceita tanto CPF (11 digitos) quanto CNPJ (14 digitos). Util para campos onde o tipo de pessoa (fisica ou juridica) nao e conhecido previamente. Oferece metodos para identificar o tipo do documento.

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

**Metodos de instancia:**
- `isCpf()` — retorna `true` se o documento tem 11 digitos (CPF)
- `isCnpj()` — retorna `true` se o documento tem 14 digitos (CNPJ)
- `formatted()` — formata automaticamente no padrao correspondente

**Regras de validacao:**
- Deve ser exatamente 11 digitos (CPF) ou 14 digitos (CNPJ)
- Apenas digitos numericos

---

## FDocumentRg

Numero de RG brasileiro (Registro Geral / Carteira de Identidade). Aceita caracteres alfanumericos entre 7 e 14 posicoes.

```typescript
import { FDocumentRg } from "tyforge";

const result = FDocumentRg.create("1234567");
// Result<FDocumentRg, ExceptionValidation>

const rg = FDocumentRg.createOrThrow("12345678X");
rg.getValue(); // "12345678X"
```

**Regras de validacao:**
- Comprimento entre 7 e 14 caracteres
- Apenas caracteres alfanumericos (`/^[a-zA-Z0-9]+$/`)

---

## FDocumentType

Tipo de documento de identificacao. Validado contra o enum `ODocumentType`.

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

**Regras de validacao:**
- Aceita apenas os valores do enum `ODocumentType`
- Qualquer outro valor e rejeitado

---

## FDocumentStateRegistration

Numero de inscricao estadual (IE). Armazena apenas digitos numericos com comprimento variavel (1 a 20 caracteres).

```typescript
import { FDocumentStateRegistration } from "tyforge";

const result = FDocumentStateRegistration.create("1234567890");
// Result<FDocumentStateRegistration, ExceptionValidation>

const ie = FDocumentStateRegistration.createOrThrow("1234567890");
ie.getValue(); // "1234567890"
```

**Regras de validacao:**
- Comprimento entre 1 e 20 caracteres
- Apenas digitos numericos (`/^\d+$/`)

---

## FDocumentMunicipalRegistration

Numero de inscricao municipal (IM). Armazena apenas digitos numericos com comprimento variavel (1 a 20 caracteres).

```typescript
import { FDocumentMunicipalRegistration } from "tyforge";

const result = FDocumentMunicipalRegistration.create("987654321");
// Result<FDocumentMunicipalRegistration, ExceptionValidation>

const im = FDocumentMunicipalRegistration.createOrThrow("987654321");
im.getValue(); // "987654321"
```

**Regras de validacao:**
- Comprimento entre 1 e 20 caracteres
- Apenas digitos numericos (`/^\d+$/`)
