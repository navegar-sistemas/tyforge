---
title: Segurança
sidebar_position: 11
---

# Type Fields — Segurança

Type Fields para autenticação, criptografia e segurança. Cobrem API keys, tokens Bearer, assinaturas digitais, certificados, algoritmos de hash e TOTP (autenticação de dois fatores).

## Resumo

| Classe | Min | Max | Validação extra | Arquivo |
|--------|-----|-----|-----------------|---------|
| `FApiKey` | 36 | 36 | UUID v4 válido | `api-key.format_vo.ts` |
| `FBearer` | 100 | 5000 | Prefixo `Bearer ` | `bearer.format_vo.ts` |
| `FSignature` | 64 | 512 | Base64 válido | `signature.format_vo.ts` |
| `FPublicKeyPem` | 100 | 1000 | Headers PEM BEGIN/END + base64 | `public-key-pem.format_vo.ts` |
| `FCertificateThumbprint` | 40 | 64 | Hexadecimal, 40 (SHA-1) ou 64 (SHA-256) chars | `certificate-thumbprint.format_vo.ts` |
| `FHashAlgorithm` | 1 | 30 | Enum `OHashAlgorithm` | `hash-algorithm.format_vo.ts` |
| `FTotpCode` | 6 | 6 | Exatamente 6 dígitos numéricos | `totp-code.format_vo.ts` |
| `FTotpSecret` | 16 | 128 | Base32 válido | `totp-secret.format_vo.ts` |

:::info Dados sensíveis
`FBearer`, `FSignature` e `FPublicKeyPem` preservam whitespace (sem trim) para garantir a integridade de dados sensíveis. Para controlar visibilidade em JSON, utilize `expose: "redacted"` no schema.
:::

---

## FApiKey

Chave de API no formato UUID v4 para autenticação de aplicações cliente.

```typescript
import { FApiKey } from "tyforge";

const result = FApiKey.create("550e8400-e29b-41d4-a716-446655440000");
// Result<FApiKey, ExceptionValidation>

const key = FApiKey.createOrThrow("550e8400-e29b-41d4-a716-446655440000");
key.getValue(); // "550e8400-e29b-41d4-a716-446655440000"
```

### Geração automática

```typescript
import { FApiKey } from "tyforge";

// Gera um novo UUID v4
const novaKey = FApiKey.generate();
novaKey.getValue(); // "xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx"

// Gera apenas a string UUID (sem instância)
const keyStr = FApiKey.generateString();
// "xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx"
```

### Exibição segura

```typescript
import { FApiKey } from "tyforge";

const key = FApiKey.generate();
key.toSafeDisplay(); // "550e8400-****-****-****-446655440000"
```

**Métodos estáticos:**
- `generate()` — cria nova instância com UUID v4 gerado
- `generateString()` — retorna apenas a string UUID v4
- `isValid(value)` — verifica se uma string é um UUID v4 válido

**Métodos de instância:**
- `toSafeDisplay()` — exibe a key com segmentos centrais mascarados

**Regras de validação:**
- Exatamente 36 caracteres
- Deve ser um UUID válido

---

## FBearer

Token de acesso Bearer para autenticação em APIs e serviços. Deve começar com o prefixo `"Bearer "` seguido de um token válido (tipicamente JWT).

```typescript
import { FBearer } from "tyforge";

const token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";

const result = FBearer.create(token);
// Result<FBearer, ExceptionValidation>

const bearer = FBearer.createOrThrow(token);
bearer.getValue(); // string completa com prefixo "Bearer "
```

**Regras de validação:**
- Comprimento entre 100 e 5000 caracteres
- Deve começar com `"Bearer "` (com espaço)
- Deve conter conteúdo válido após o prefixo
- Preserva whitespace (sem trim) para integridade do token

---

## FSignature

Assinatura digital no formato base64. Utilizada para verificação de autenticidade e integridade de dados em comunicações seguras.

```typescript
import { FSignature } from "tyforge";

const sig = "MEUCIQDi9RgKqW8a1Yjqvbka6yFm9s2p4RgBqP5YPYqODM9aigIgXCfR5xgYkScNBlOj3IGOQE4sGBsydKJlTq5DcPvPTQA=";

const result = FSignature.create(sig);
// Result<FSignature, ExceptionValidation>

const assinatura = FSignature.createOrThrow(sig);
assinatura.getValue(); // string base64 completa
```

**Regras de validação:**
- Comprimento entre 64 e 512 caracteres
- Deve ser uma string base64 válida (`/^[A-Za-z0-9+/]+=*$/`)
- Conteúdo base64 (sem whitespace) deve ter no mínimo 64 caracteres
- Preserva whitespace (sem trim) para integridade da assinatura

---

## FPublicKeyPem

Chave pública no formato PEM (Privacy-Enhanced Mail) para autenticação assimétrica.

```typescript
import { FPublicKeyPem } from "tyforge";

const pem = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA...
-----END PUBLIC KEY-----`;

const result = FPublicKeyPem.create(pem);
// Result<FPublicKeyPem, ExceptionValidation>

const chave = FPublicKeyPem.createOrThrow(pem);
chave.getValue(); // string PEM completa
```

**Regras de validação:**
- Comprimento entre 100 e 1000 caracteres
- Deve conter `-----BEGIN PUBLIC KEY-----` e `-----END PUBLIC KEY-----`
- Conteúdo entre os delimitadores deve ser base64 válido com no mínimo 100 caracteres
- Preserva whitespace (sem trim) para integridade da chave

---

## FCertificateThumbprint

Thumbprint (impressão digital) de certificado digital em formato hexadecimal. Aceita SHA-1 (40 caracteres) ou SHA-256 (64 caracteres).

```typescript
import { FCertificateThumbprint } from "tyforge";

// SHA-1 (40 caracteres)
const sha1 = FCertificateThumbprint.createOrThrow(
  "A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2"
);
sha1.getValue(); // "A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2"

// SHA-256 (64 caracteres)
const sha256 = FCertificateThumbprint.createOrThrow(
  "A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2"
);
sha256.getValue(); // string hexadecimal de 64 caracteres
```

**Regras de validação:**
- Apenas caracteres hexadecimais (`/^[0-9A-Fa-f]+$/`)
- Deve ter exatamente 40 caracteres (SHA-1) ou 64 caracteres (SHA-256)

---

## FHashAlgorithm

Identificador de algoritmo criptográfico de hash ou assinatura. Validado contra o enum `OHashAlgorithm`.

```typescript
import { FHashAlgorithm, OHashAlgorithm } from "tyforge";

const result = FHashAlgorithm.create(OHashAlgorithm.ECDSA_P256_SHA256);
// Result<FHashAlgorithm, ExceptionValidation>

const alg = FHashAlgorithm.createOrThrow("Ed25519");
alg.getValue(); // "Ed25519"
```

### Constante `OHashAlgorithm`

```typescript
export const OHashAlgorithm = {
  ECDSA_P256_SHA256: "ECDSA_P256_SHA256",
  ECDSA_P384_SHA384: "ECDSA_P384_SHA384",
  ED25519: "Ed25519",
  RSA_PKCS1_SHA256: "RSA_PKCS1_SHA256",
  RSA_PSS_SHA256: "RSA_PSS_SHA256",
} as const;
```

### Tipos relacionados

```typescript
export type TKeyHashAlgorithm = keyof typeof OHashAlgorithm;
// "ECDSA_P256_SHA256" | "ECDSA_P384_SHA384" | "ED25519" | "RSA_PKCS1_SHA256" | "RSA_PSS_SHA256"

export type THashAlgorithm = (typeof OHashAlgorithm)[TKeyHashAlgorithm];
// "ECDSA_P256_SHA256" | "ECDSA_P384_SHA384" | "Ed25519" | "RSA_PKCS1_SHA256" | "RSA_PSS_SHA256"
```

**Regras de validação:**
- Aceita apenas os valores do enum `OHashAlgorithm`
- Qualquer outro valor é rejeitado

---

## FTotpCode

Código TOTP (Time-based One-Time Password) de 6 dígitos para autenticação de dois fatores.

```typescript
import { FTotpCode } from "tyforge";

const result = FTotpCode.create("123456");
// Result<FTotpCode, ExceptionValidation>

const codigo = FTotpCode.createOrThrow("123456");
codigo.getValue(); // "123456"
```

**Regras de validação:**
- Exatamente 6 caracteres
- Apenas dígitos numéricos (`/^\d{6}$/`)

---

## FTotpSecret

Segredo compartilhado TOTP codificado em base32 para autenticação de dois fatores. Utilizado para gerar e validar códigos TOTP.

```typescript
import { FTotpSecret } from "tyforge";

const result = FTotpSecret.create("JBSWY3DPEHPK3PXP");
// Result<FTotpSecret, ExceptionValidation>

const segredo = FTotpSecret.createOrThrow("JBSWY3DPEHPK3PXP");
segredo.getValue(); // "JBSWY3DPEHPK3PXP"
```

**Regras de validação:**
- Comprimento entre 16 e 128 caracteres
- Deve ser uma string base32 válida (`/^[A-Z2-7]+=*$/`)
