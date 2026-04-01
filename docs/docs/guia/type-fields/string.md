---
title: Strings
sidebar_position: 2
---

# Type Fields — Strings

Type Fields do tipo string encapsulam e validam textos com regras específicas de comprimento, formato e conteúdo.

## Resumo

| Classe | Min | Max | Validação extra | Arquivo |
|--------|-----|-----|-----------------|---------|
| `FString` | 1 | 255 | — | `string.typefield.ts` |
| `FEmail` | 5 | 200 | Regex RFC 5322 + lowercase/trim | `email.typefield.ts` |
| `FPassword` | 8 | 128 | Maiúscula + minúscula + dígito + especial + detecção de padrões previsíveis | `password.typefield.ts` |
| `FFullName` | 2 | 140 | — | `full-name.typefield.ts` |
| `FDescription` | 1 | 500 | — | `description.typefield.ts` |
| `FText` | 1 | 4000 | — | `text.typefield.ts` |
| `FBusinessName` | 1 | 100 | — | `business-name.typefield.ts` |

---

## FString

Texto genérico sem formatação específica. Aceita qualquer string entre 1 e 255 caracteres.

```typescript
import { FString } from "tyforge";

const result = FString.create("Meu texto");
// Result<FString, ExceptionValidation>

const texto = FString.createOrThrow("Meu texto");
texto.getValue(); // "Meu texto"
```

**Config:**

```typescript
{
  jsonSchemaType: "string",
  minLength: 1,
  maxLength: 255,
}
```

---

## FEmail

Endereço de email válido seguindo o padrão RFC 5322. O método `formatted()` retorna o valor em lowercase com trim.

```typescript
import { FEmail } from "tyforge";

const result = FEmail.create("Usuario@Email.COM");
// Result<FEmail, ExceptionValidation>

const email = FEmail.createOrThrow("usuario@email.com");
email.getValue();  // "usuario@email.com"
email.formatted(); // "usuario@email.com" (lowercase + trim)
```

**Regras de validação:**
- Comprimento entre 5 e 200 caracteres
- Deve corresponder ao regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

---

## FPassword

Senha segura para autenticação de usuários. Exige complexidade mínima (NIST SP 800-63B) e rejeita padrões previsíveis.

```typescript
import { FPassword } from "tyforge";

const result = FPassword.create("Senh@Forte1");
// Result<FPassword, ExceptionValidation>

const senha = FPassword.createOrThrow("Senh@Forte1");
senha.getValue(); // "Senh@Forte1"
```

**Regras de validação:**
- Comprimento entre 8 e 128 caracteres
- Pelo menos uma letra maiúscula (`/[A-Z]/`)
- Pelo menos uma letra minúscula (`/[a-z]/`)
- Pelo menos um dígito (`/[0-9]/`)
- Pelo menos um caractere especial (`/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/`)
- Rejeita senhas previsíveis (padrões de teclado, dígitos sequenciais, caracteres repetidos)

### Indicador de força (`getStrength`)

Método estático que retorna o resultado individual de cada regra. Não cria instância — ideal para indicadores de força em tempo real no UI.

```typescript
import { FPassword } from "tyforge";
import type { IPasswordStrength } from "tyforge";

const strength: IPasswordStrength = FPassword.getStrength("Abc1");
// {
//   length: false,     // < 8 chars
//   uppercase: true,   // tem [A-Z]
//   lowercase: true,   // tem [a-z]
//   digit: true,       // tem [0-9]
//   special: false,    // sem caractere especial
// }
```

### Detecção de senhas previsíveis (`isWeak`)

Método estático que detecta senhas que passam as regras individuais mas contêm padrões previsíveis.

```typescript
import { FPassword } from "tyforge";

FPassword.isWeak("Qwerty12!");  // true — padrão de teclado
FPassword.isWeak("Abcd1234!");  // true — dígitos sequenciais
FPassword.isWeak("Abcd4321!");  // true — dígitos descendentes
FPassword.isWeak("aaaa1111");   // true — caracteres repetidos
FPassword.isWeak("K9#mPx2!vR"); // false — sem padrões
```

**Padrões detectados:**
- Caracteres repetidos (≤ 2 caracteres únicos após lowercase)
- Dígitos sequenciais ascendentes (4+ consecutivos: `1234`, `5678`)
- Dígitos sequenciais descendentes (4+ consecutivos: `4321`, `8765`)
- Padrões de teclado: `qwerty`, `qwertz`, `azerty`, `asdfgh`, `zxcvbn`, `!@#$%^`, `1qaz2wsx`, `qazwsx`

---

## FFullName

Nome completo de uma pessoa, incluindo nome e sobrenome.

```typescript
import { FFullName } from "tyforge";

const result = FFullName.create("Maria Silva");
// Result<FFullName, ExceptionValidation>

const nome = FFullName.createOrThrow("Maria Silva");
nome.getValue(); // "Maria Silva"
```

**Regras de validação:**
- Comprimento entre 2 e 140 caracteres

---

## FDescription

Descrição detalhada com capacidade para textos médios.

```typescript
import { FDescription } from "tyforge";

const result = FDescription.create("Descrição do produto com detalhes completos.");
// Result<FDescription, ExceptionValidation>

const desc = FDescription.createOrThrow("Descrição do produto");
desc.getValue(); // "Descrição do produto"
```

**Regras de validação:**
- Comprimento entre 1 e 1000 caracteres

---

## FText

Texto longo sem formatação específica. Ideal para campos de observação, comentários e conteúdo extenso.

```typescript
import { FText } from "tyforge";

const result = FText.create("Texto longo com múltiplos parágrafos...");
// Result<FText, ExceptionValidation>

const texto = FText.createOrThrow("Conteúdo extenso aqui");
texto.getValue(); // "Conteúdo extenso aqui"
```

**Regras de validação:**
- Comprimento entre 1 e 4000 caracteres

---

## FBusinessName

Nome comercial ou razão social de uma empresa. Aceita qualquer string entre 1 e 100 caracteres. Ideal para campos de nome fantasia, razão social ou denominação comercial.

```typescript
import { FBusinessName } from "tyforge";

const result = FBusinessName.create("Navegar Sistemas Ltda");
// Result<FBusinessName, ExceptionValidation>

const nome = FBusinessName.createOrThrow("Tech Solutions Corp");
nome.getValue(); // "Tech Solutions Corp"
```

**Regras de validação:**
- Comprimento entre 1 e 100 caracteres
