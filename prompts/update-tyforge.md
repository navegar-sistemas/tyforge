# Atualização TyForge — tyforge@0.2.19

## Versões para atualizar

```bash
npm install tyforge@0.2.19 @tyforge/http@0.1.15 @tyforge/graphql@0.2.4 @tyforge/websocket@0.1.15
```

Verificar que as versões no `package.json` ficaram pinadas (sem `^`, `~`, `*`). Se o npm adicionou `^`, remover manualmente.

---

## Mudanças que impactam o projeto

### 1. FPassword — `getStrength()` e `isWeak()` (desde 0.2.17)

O arquivo `validators.ts` com `getPasswordStrength()`, `validatePassword()` e `isWeakPassword()` pode ser **removido**. O TyForge agora fornece nativamente:

```typescript
import { FPassword } from "tyforge";
import type { IPasswordStrength } from "tyforge";

// Indicador de força em tempo real (UI)
const strength: IPasswordStrength = FPassword.getStrength(inputValue);
// {
//   length: boolean,     // >= 8 chars
//   uppercase: boolean,  // tem [A-Z]
//   lowercase: boolean,  // tem [a-z]
//   digit: boolean,      // tem [0-9]
//   special: boolean,    // tem caractere especial
// }

// Detecção de senhas previsíveis
const weak: boolean = FPassword.isWeak(inputValue);
// true para: qwerty, 1234, caracteres repetidos, etc.

// Validação completa (create/assign já rejeita senhas fracas)
const result = FPassword.create(inputValue);
```

**Migração:**
1. Remover `validators.ts` (ou o arquivo equivalente com workarounds de password)
2. Substituir chamadas a `getPasswordStrength()` por `FPassword.getStrength()`
3. Substituir chamadas a `isWeakPassword()` por `FPassword.isWeak()`
4. Remover validações manuais de senha — `FPassword.create()` já valida tudo (complexidade + padrões previsíveis)

---

### 2. FIdSeq — IDs sequenciais de banco (desde 0.2.19)

Se o projeto usa `Object.defineProperty` para atribuir IDs gerados pelo banco a entities, esse hack pode ser **removido**:

```typescript
import { FIdSeq, Entity } from "tyforge";
import type { IEntityProps, TEntityId } from "tyforge";

// Entity com ID sequencial
const schema = {
  id: { type: FIdSeq, required: false },
  name: { type: FString },
} satisfies ISchema;

type TProductProps = InferProps<typeof schema>;
type TProductJson = InferJson<typeof schema>;

class Product extends Entity<TProductProps, TProductJson>
  implements TProductProps {
  readonly id: FIdSeq | undefined;
  readonly name: FString;
  // ...

  static create(data: TInput): Result<Product, Exceptions> {
    // ID undefined — banco gera via auto-increment
    return ok(new Product({ name: data.name }));
  }

  static assign(data: TProductJson): Result<Product, Exceptions> {
    // Recria instância com ID do banco — sem hack
    const validated = productValidator.assign(data);
    if (isFailure(validated)) return validated;
    return ok(new Product(validated.value));
  }
}
```

**Migração:**
1. Substituir `FId` por `FIdSeq` nas entities que usam auto-increment
2. Remover `Object.defineProperty(entity, "id", ...)` — usar `assign()` para recriar a instância com o ID do banco
3. O tipo `id` na entity muda de `FId | undefined` para `FIdSeq | undefined`
4. `Repository`, `RepositoryRead`, `RepositoryWrite` e `RepositoryCrud` agora aceitam `TEntityId` (`FId | FIdSeq`) — sem cast necessário

---

### 3. httpNarrow.ts — remover boundary cast

Se o projeto faz `as` cast na resposta do `ServiceHttp`, substituir por validação via schema:

```typescript
// ANTES (cast inseguro)
const response = await service.get({ endpoint: "/users/1" });
if (isSuccess(response)) {
  const data = response.value.data as TUser; // ❌
}

// DEPOIS (validação via schema)
const userSchema = {
  id: { type: FIdSeq },
  name: { type: FString },
  email: { type: FEmail },
} satisfies ISchema;

const userValidator = SchemaBuilder.compile(userSchema);

const response = await service.get({ endpoint: "/users/1" });
if (isSuccess(response)) {
  const parsed = userValidator.create(response.value.data);
  if (isSuccess(parsed)) {
    // parsed.value.name é FString — tipado e validado
  }
}
```

**Migração:**
1. Criar schemas para cada tipo de resposta de API
2. Substituir `as TType` por `SchemaBuilder.compile(schema).create(data)`
3. Tratar o `Result` retornado (a resposta pode não ter o formato esperado)
4. Remover o arquivo `httpNarrow.ts` se ele só continha casts

---

## Checklist pós-atualização

- [ ] `npm install` sem erros
- [ ] Versões pinadas no `package.json` (sem `^`)
- [ ] `validators.ts` removido (workarounds de password)
- [ ] `Object.defineProperty` hack em entities removido
- [ ] `as` casts em respostas HTTP removidos
- [ ] `httpNarrow.ts` removido ou refatorado
- [ ] `npm run typecheck` passa
- [ ] Testes passam
- [ ] App RN compila e funciona
