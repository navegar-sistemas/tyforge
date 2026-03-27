---
title: Bancario
sidebar_position: 9
---

# Type Fields — Bancario

Type Fields para dados bancarios e de pagamento. Varios campos sao locale-aware e aplicam regras especificas quando `TypeField.locale` esta configurado como `"br"` (Brasil).

## Resumo

| Classe | Min | Max | Validacao extra | Arquivo |
|--------|-----|-----|-----------------|---------|
| `FBankCode` | 1 | 20 | Numerico; locale `br`: ISPB 8 digitos | `bank-code.format_vo.ts` |
| `FBankBranch` | 1 | 20 | Numerico; locale `br`: 4 digitos | `bank-branch.format_vo.ts` |
| `FBankAccountNumber` | 1 | 34 | Alfanumerico; locale `br`: 1-13 digitos + digito verificador | `bank-account-number.format_vo.ts` |
| `FBankNsu` | 1 | 20 | Alfanumerico | `bank-nsu.format_vo.ts` |
| `FBankE2eId` | 1 | 35 | Alfanumerico | `bank-e2e-id.format_vo.ts` |
| `FEmvQrCodePayload` | 1 | 1000 | String generica | `emv-qr-code-payload.format_vo.ts` |

:::tip Configuracao de locale
Para ativar as validacoes especificas do Brasil, configure o locale no bootstrap da aplicacao:

```typescript
import { TypeField } from "tyforge";

TypeField.configure({ locale: "br" });
```

Isso afeta `FBankCode`, `FBankBranch` e `FBankAccountNumber`.
:::

---

## FBankCode

Codigo de identificacao bancaria. No modo generico, aceita qualquer string numerica de 1 a 20 caracteres. Com locale `"br"`, exige exatamente 8 digitos numericos no formato ISPB (Identificador do Sistema de Pagamentos Brasileiro).

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

// Aceita ISPB de 8 digitos
const itau = FBankCode.createOrThrow("60701190");
itau.getValue(); // "60701190"

// Rejeita formatos invalidos
const invalido = FBankCode.create("123");
// Result com erro: "ISPB bank code must be exactly 8 numeric digits"
```

**Regras de validacao:**
- Apenas digitos numericos (`/^\d+$/`)
- Locale `br`: exatamente 8 digitos numericos (ISPB)

---

## FBankBranch

Numero da agencia bancaria. No modo generico, aceita qualquer string numerica. Com locale `"br"`, exige exatamente 4 digitos.

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

// Aceita agencia de 4 digitos
const ag = FBankBranch.createOrThrow("1234");
ag.getValue(); // "1234"

// Rejeita formatos invalidos
const invalido = FBankBranch.create("12");
// Result com erro: "Brazilian bank branch must be exactly 4 numeric digits"
```

**Regras de validacao:**
- Apenas digitos numericos (`/^\d+$/`)
- Locale `br`: exatamente 4 digitos numericos

---

## FBankAccountNumber

Numero da conta bancaria. No modo generico, aceita strings alfanumericas de ate 34 caracteres. Com locale `"br"`, exige de 1 a 13 digitos numericos, opcionalmente seguidos de digito verificador (`-D`).

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

// Conta com digito verificador
const conta2 = FBankAccountNumber.createOrThrow("12345678-9");
conta2.getValue(); // "12345678-9"
```

**Regras de validacao:**
- Alfanumerico (ate 34 caracteres)
- Locale `br`: 1 a 13 digitos numericos, opcionalmente seguidos de `-D` (digito verificador)

---

## FBankNsu

NSU (Numero Sequencial Unico) — identificador alfanumerico de recibo ou transacao emitido pelo processador de pagamento.

```typescript
import { FBankNsu } from "tyforge";

const result = FBankNsu.create("ABC123456789");
// Result<FBankNsu, ExceptionValidation>

const nsu = FBankNsu.createOrThrow("123456789012");
nsu.getValue(); // "123456789012"
```

**Regras de validacao:**
- Comprimento entre 1 e 20 caracteres
- Apenas caracteres alfanumericos (`/^[a-zA-Z0-9]+$/`)

---

## FBankE2eId

Identificador end-to-end (E2E) para transacoes de pagamento instantaneo. Utilizado para rastrear uma transacao da origem ao destino.

```typescript
import { FBankE2eId } from "tyforge";

const result = FBankE2eId.create("E00000000202301011234abcdefghij");
// Result<FBankE2eId, ExceptionValidation>

const e2e = FBankE2eId.createOrThrow("E00000000202301011234abcdefghij");
e2e.getValue(); // "E00000000202301011234abcdefghij"
```

**Regras de validacao:**
- Comprimento entre 1 e 35 caracteres
- Apenas caracteres alfanumericos (`/^[a-zA-Z0-9]+$/`)

---

## FEmvQrCodePayload

Payload de QR Code no padrao EMV — string codificada contendo dados de pagamento (comerciante, valor, moeda) para processamento de pagamentos instantaneos.

```typescript
import { FEmvQrCodePayload } from "tyforge";

const payload = "00020126580014br.gov.bcb.pix0136a629532e...";
const result = FEmvQrCodePayload.create(payload);
// Result<FEmvQrCodePayload, ExceptionValidation>

const qr = FEmvQrCodePayload.createOrThrow(payload);
qr.getValue(); // string completa do payload
```

**Regras de validacao:**
- Comprimento entre 1 e 1000 caracteres
- Aceita qualquer string valida (a validacao de estrutura EMV e responsabilidade da camada de negocio)
