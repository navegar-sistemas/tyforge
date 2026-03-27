---
title: Bancário
sidebar_position: 9
---

# Type Fields — Bancário

Type Fields para dados bancários e de pagamento. Vários campos são locale-aware e aplicam regras específicas quando `TypeField.locale` está configurado como `"br"` (Brasil).

## Resumo

| Classe | Min | Max | Validação extra | Arquivo |
|--------|-----|-----|-----------------|---------|
| `FBankCode` | 1 | 20 | Numérico; locale `br`: ISPB 8 dígitos | `bank-code.format_vo.ts` |
| `FBankBranch` | 1 | 20 | Numérico; locale `br`: 4 dígitos | `bank-branch.format_vo.ts` |
| `FBankAccountNumber` | 1 | 34 | Alfanumérico; locale `br`: 1-13 dígitos + dígito verificador | `bank-account-number.format_vo.ts` |
| `FBankNsu` | 1 | 20 | Alfanumérico | `bank-nsu.format_vo.ts` |
| `FBankE2eId` | 1 | 35 | Alfanumérico | `bank-e2e-id.format_vo.ts` |
| `FEmvQrCodePayload` | 1 | 1000 | String genérica | `emv-qr-code-payload.format_vo.ts` |

:::tip Configuração de locale
Para ativar as validações específicas do Brasil, configure o locale no bootstrap da aplicação:

```typescript
import { TypeField } from "tyforge";

TypeField.configure({ locale: "br" });
```

Isso afeta `FBankCode`, `FBankBranch` e `FBankAccountNumber`.
:::

---

## FBankCode

Código de identificação bancária. No modo genérico, aceita qualquer string numérica de 1 a 20 caracteres. Com locale `"br"`, exige exatamente 8 dígitos numéricos no formato ISPB (Identificador do Sistema de Pagamentos Brasileiro).

```typescript
import { FBankCode } from "tyforge";

const result = FBankCode.create("00000000");
// Result<FBankCode, ExceptionValidation>

const banco = FBankCode.createOrThrow("00000000");
banco.getValue(); // "00000000"
```

### Com locale brasileiro

```typescript
import { FBankCode, TypeField } from "tyforge";

TypeField.configure({ locale: "br" });

// Aceita ISPB de 8 dígitos
const itau = FBankCode.createOrThrow("60701190");
itau.getValue(); // "60701190"

// Rejeita formatos inválidos
const invalido = FBankCode.create("123");
// Result com erro: "ISPB bank code must be exactly 8 numeric digits"
```

**Regras de validação:**
- Apenas dígitos numéricos (`/^\d+$/`)
- Locale `br`: exatamente 8 dígitos numéricos (ISPB)

---

## FBankBranch

Número da agência bancária. No modo genérico, aceita qualquer string numérica. Com locale `"br"`, exige exatamente 4 dígitos.

```typescript
import { FBankBranch } from "tyforge";

const result = FBankBranch.create("0001");
// Result<FBankBranch, ExceptionValidation>

const agencia = FBankBranch.createOrThrow("0001");
agencia.getValue(); // "0001"
```

### Com locale brasileiro

```typescript
import { FBankBranch, TypeField } from "tyforge";

TypeField.configure({ locale: "br" });

// Aceita agência de 4 dígitos
const ag = FBankBranch.createOrThrow("1234");
ag.getValue(); // "1234"

// Rejeita formatos inválidos
const invalido = FBankBranch.create("12");
// Result com erro: "Brazilian bank branch must be exactly 4 numeric digits"
```

**Regras de validação:**
- Apenas dígitos numéricos (`/^\d+$/`)
- Locale `br`: exatamente 4 dígitos numéricos

---

## FBankAccountNumber

Número da conta bancária. No modo genérico, aceita strings alfanuméricas de até 34 caracteres. Com locale `"br"`, exige de 1 a 13 dígitos numéricos, opcionalmente seguidos de dígito verificador (`-D`).

```typescript
import { FBankAccountNumber } from "tyforge";

const result = FBankAccountNumber.create("123456");
// Result<FBankAccountNumber, ExceptionValidation>

const conta = FBankAccountNumber.createOrThrow("123456");
conta.getValue(); // "123456"
```

### Com locale brasileiro

```typescript
import { FBankAccountNumber, TypeField } from "tyforge";

TypeField.configure({ locale: "br" });

// Conta simples
const conta1 = FBankAccountNumber.createOrThrow("12345678");

// Conta com dígito verificador
const conta2 = FBankAccountNumber.createOrThrow("12345678-9");
conta2.getValue(); // "12345678-9"
```

**Regras de validação:**
- Alfanumérico (até 34 caracteres)
- Locale `br`: 1 a 13 dígitos numéricos, opcionalmente seguidos de `-D` (dígito verificador)

---

## FBankNsu

NSU (Número Sequencial Único) — identificador alfanumérico de recibo ou transação emitido pelo processador de pagamento.

```typescript
import { FBankNsu } from "tyforge";

const result = FBankNsu.create("ABC123456789");
// Result<FBankNsu, ExceptionValidation>

const nsu = FBankNsu.createOrThrow("123456789012");
nsu.getValue(); // "123456789012"
```

**Regras de validação:**
- Comprimento entre 1 e 20 caracteres
- Apenas caracteres alfanuméricos (`/^[a-zA-Z0-9]+$/`)

---

## FBankE2eId

Identificador end-to-end (E2E) para transações de pagamento instantâneo. Utilizado para rastrear uma transação da origem ao destino.

```typescript
import { FBankE2eId } from "tyforge";

const result = FBankE2eId.create("E00000000202301011234abcdefghij");
// Result<FBankE2eId, ExceptionValidation>

const e2e = FBankE2eId.createOrThrow("E00000000202301011234abcdefghij");
e2e.getValue(); // "E00000000202301011234abcdefghij"
```

**Regras de validação:**
- Comprimento entre 1 e 35 caracteres
- Apenas caracteres alfanuméricos (`/^[a-zA-Z0-9]+$/`)

---

## FEmvQrCodePayload

Payload de QR Code no padrão EMV — string codificada contendo dados de pagamento (comerciante, valor, moeda) para processamento de pagamentos instantâneos.

```typescript
import { FEmvQrCodePayload } from "tyforge";

const payload = "00020126580014br.gov.bcb.pix0136a629532e...";
const result = FEmvQrCodePayload.create(payload);
// Result<FEmvQrCodePayload, ExceptionValidation>

const qr = FEmvQrCodePayload.createOrThrow(payload);
qr.getValue(); // string completa do payload
```

**Regras de validação:**
- Comprimento entre 1 e 1000 caracteres
- Aceita qualquer string válida (a validação de estrutura EMV é responsabilidade da camada de negócio)
