---
title: Strings
sidebar_position: 2
---

# Type Fields — Strings

Type Fields do tipo string encapsulam e validam textos com regras especificas de comprimento, formato e conteudo.

## Resumo

| Classe | Min | Max | Validacao extra | Arquivo |
|--------|-----|-----|-----------------|---------|
| `FString` | 1 | 255 | — | `string.format_vo.ts` |
| `FEmail` | 5 | 200 | Regex RFC 5322 + lowercase/trim | `email.format_vo.ts` |
| `FPassword` | 8 | 128 | Maiuscula + minuscula + digito + especial | `password.format_vo.ts` |
| `FFullName` | 2 | 140 | — | `nome-completo.format_vo.ts` |
| `FDescription` | 1 | 1000 | — | `descricao.format_vo.ts` |
| `FText` | 1 | 4000 | — | `text.format_vo.ts` |
| `FBusinessName` | 1 | 100 | — | `business-name.format_vo.ts` |

---

## FString

Texto generico sem formatacao especifica. Aceita qualquer string entre 1 e 255 caracteres.

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

Endereco de email valido seguindo o padrao RFC 5322. O metodo `formatted()` retorna o valor em lowercase com trim.

```typescript
import { FEmail } from "tyforge";

const result = FEmail.create("Usuario@Email.COM");
// Result<FEmail, ExceptionValidation>

const email = FEmail.createOrThrow("usuario@email.com");
email.getValue();  // "usuario@email.com"
email.formatted(); // "usuario@email.com" (lowercase + trim)
```

**Regras de validacao:**
- Comprimento entre 5 e 200 caracteres
- Deve corresponder ao regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

---

## FPassword

Senha segura para autenticacao de usuarios. Exige complexidade minima para proteger contra ataques de forca bruta.

```typescript
import { FPassword } from "tyforge";

const result = FPassword.create("Senh@Forte1");
// Result<FPassword, ExceptionValidation>

const senha = FPassword.createOrThrow("Senh@Forte1");
senha.getValue(); // "Senh@Forte1"
```

**Regras de validacao:**
- Comprimento entre 8 e 128 caracteres
- Pelo menos uma letra maiuscula (`/[A-Z]/`)
- Pelo menos uma letra minuscula (`/[a-z]/`)
- Pelo menos um digito (`/[0-9]/`)
- Pelo menos um caractere especial (`/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/`)

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

**Regras de validacao:**
- Comprimento entre 2 e 140 caracteres

---

## FDescription

Descricao detalhada com capacidade para textos medios.

```typescript
import { FDescription } from "tyforge";

const result = FDescription.create("Descricao do produto com detalhes completos.");
// Result<FDescription, ExceptionValidation>

const desc = FDescription.createOrThrow("Descricao do produto");
desc.getValue(); // "Descricao do produto"
```

**Regras de validacao:**
- Comprimento entre 1 e 1000 caracteres

---

## FText

Texto longo sem formatacao especifica. Ideal para campos de observacao, comentarios e conteudo extenso.

```typescript
import { FText } from "tyforge";

const result = FText.create("Texto longo com multiplos paragrafos...");
// Result<FText, ExceptionValidation>

const texto = FText.createOrThrow("Conteudo extenso aqui");
texto.getValue(); // "Conteudo extenso aqui"
```

**Regras de validacao:**
- Comprimento entre 1 e 4000 caracteres

---

## FBusinessName

Nome comercial ou razao social de uma empresa. Aceita qualquer string entre 1 e 100 caracteres. Ideal para campos de nome fantasia, razao social ou denominacao comercial.

```typescript
import { FBusinessName } from "tyforge";

const result = FBusinessName.create("Navegar Sistemas Ltda");
// Result<FBusinessName, ExceptionValidation>

const nome = FBusinessName.createOrThrow("Tech Solutions Corp");
nome.getValue(); // "Tech Solutions Corp"
```

**Regras de validacao:**
- Comprimento entre 1 e 100 caracteres
