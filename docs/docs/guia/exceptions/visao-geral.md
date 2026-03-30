---
title: Exceptions
sidebar_position: 1
---

# Exceptions

O sistema de exceções do TyForge segue o padrão **RFC 7807 — Problem Details for HTTP APIs**. Toda exceção carrega metadados estruturados que facilitam o diagnóstico e o tratamento de erros tanto no servidor quanto no cliente.

## Classe base: `Exceptions`

Todas as exceções estendem a classe abstrata `Exceptions`, que por sua vez estende `Error`:

```typescript
abstract class Exceptions extends Error {
  readonly type: string;           // URI do tipo de erro
  readonly title: string;          // Título legível do erro
  readonly detail: string;         // Descrição detalhada
  readonly status: THttpStatus;    // Código HTTP (200-504)
  readonly instance: string;       // URI da instância do erro
  readonly uri: string;            // URI de documentação
  readonly field?: string;         // Campo que causou o erro (opcional)
  readonly code: string;           // Código interno do erro
  readonly additionalFields?: Record<string, unknown>; // Dados extras
  readonly retriable: boolean;     // Se a operação pode ser retentada (padrão: true)
}
```

## Campos RFC 7807

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `type` | `string` | URI que identifica o tipo de problema |
| `title` | `string` | Resumo legível do problema |
| `detail` | `string` | Explicação específica desta ocorrência |
| `status` | `THttpStatus` | Código de status HTTP |
| `instance` | `string` | URI que identifica esta ocorrência específica |
| `uri` | `string` | URI para documentação do erro |
| `field` | `string?` | Campo relacionado ao erro (útil em validação) |
| `code` | `string` | Código interno para identificação programática |
| `additionalFields` | `Record<string, unknown>?` | Metadados adicionais |
| `retriable` | `boolean` | Indica se a operação pode ser retentada (padrão: `true`) |

## Lazy stack trace

As exceções do TyForge implementam **stack trace lazy** — o stack trace só é capturado quando a propriedade `.stack` é acessada pela primeira vez. Isso melhora significativamente a performance em cenários de validação em massa, onde a captura de stack trace seria um custo desnecessário.

```typescript
abstract class Exceptions extends Error {
  private _lazyStack: string | undefined;
  private _stackCaptured = false;

  override get stack(): string | undefined {
    if (!this._stackCaptured) {
      this._lazyStack = new Error(this.title).stack;
      this._stackCaptured = true;
    }
    return this._lazyStack;
  }
}
```

**Impacto na performance:**
- Em validações que geram exceções frequentemente (ex.: validação de lotes), o custo de captura de stack é evitado
- O stack só é calculado quando necessário para logging ou debug

## Cadeia de protótipos

O construtor utiliza `Object.setPrototypeOf(this, new.target.prototype)` para garantir que `instanceof` funcione corretamente, mesmo após transpilação para ES5/ES6:

```typescript
constructor(details: ExceptionDetails) {
  super(detail);
  Object.setPrototypeOf(this, new.target.prototype);
}
```

Isso permite verificações como:

```typescript
if (error instanceof ExceptionValidation) {
  // Funciona corretamente
}
```

## Serialização

O método `toJSON()` converte a exceção para um objeto compatível com RFC 7807:

```typescript
const excecao = ExceptionValidation.create("email", "Email inválido");

excecao.toJSON();
// {
//   type: "ExceptionValidation",
//   title: "Erro de Validação",
//   detail: "Email inválido",
//   status: 400,
//   instance: "",
//   uri: "",
//   field: "email",
//   code: "VALIDATION_ERROR",
//   additionalFields: undefined,
//   retriable: true
// }
```

## Próximos passos

- [Tipos de Exceção](/guia/exceptions/tipos) — catálogo completo com factory methods
