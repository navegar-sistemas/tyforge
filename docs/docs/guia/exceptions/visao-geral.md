---
title: Exceptions
sidebar_position: 1
---

# Exceptions

O sistema de excecoes do TyForge segue o padrao **RFC 7807 — Problem Details for HTTP APIs**. Toda excecao carrega metadados estruturados que facilitam o diagnostico e o tratamento de erros tanto no servidor quanto no cliente.

## Classe base: `Exceptions`

Todas as excecoes estendem a classe abstrata `Exceptions`, que por sua vez estende `Error`:

```typescript
abstract class Exceptions extends Error {
  readonly type: string;           // URI do tipo de erro
  readonly title: string;          // Titulo legivel do erro
  readonly detail: string;         // Descricao detalhada
  readonly status: THttpStatus;    // Codigo HTTP (200-504)
  readonly instance: string;       // URI da instancia do erro
  readonly uri: string;            // URI de documentacao
  readonly field?: string;         // Campo que causou o erro (opcional)
  readonly code: string;           // Codigo interno do erro
  readonly additionalFields?: Record<string, unknown>; // Dados extras
  readonly retriable: boolean;     // Se a operacao pode ser retentada (padrao: true)
}
```

## Campos RFC 7807

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `type` | `string` | URI que identifica o tipo de problema |
| `title` | `string` | Resumo legivel do problema |
| `detail` | `string` | Explicacao especifica desta ocorrencia |
| `status` | `THttpStatus` | Codigo de status HTTP |
| `instance` | `string` | URI que identifica esta ocorrencia especifica |
| `uri` | `string` | URI para documentacao do erro |
| `field` | `string?` | Campo relacionado ao erro (util em validacao) |
| `code` | `string` | Codigo interno para identificacao programatica |
| `additionalFields` | `Record<string, unknown>?` | Metadados adicionais |
| `retriable` | `boolean` | Indica se a operacao pode ser retentada (padrao: `true`) |

## Lazy stack trace

As excecoes do TyForge implementam **stack trace lazy** — o stack trace so e capturado quando a propriedade `.stack` e acessada pela primeira vez. Isso melhora significativamente a performance em cenarios de validacao em massa, onde a captura de stack trace seria um custo desnecessario.

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
- Em validacoes que geram excecoes frequentemente (ex.: validacao de lotes), o custo de captura de stack e evitado
- O stack so e calculado quando necessario para logging ou debug

## Cadeia de prototipos

O construtor utiliza `Object.setPrototypeOf(this, new.target.prototype)` para garantir que `instanceof` funcione corretamente, mesmo apos transpilacao para ES5/ES6:

```typescript
constructor(details: ExceptionDetails) {
  super(detail);
  Object.setPrototypeOf(this, new.target.prototype);
}
```

Isso permite verificacoes como:

```typescript
if (error instanceof ExceptionValidation) {
  // Funciona corretamente
}
```

## Serializacao

O metodo `toJSON()` converte a excecao para um objeto compativel com RFC 7807:

```typescript
const excecao = ExceptionValidation.create("email", "Email invalido");

excecao.toJSON();
// {
//   type: "ExceptionValidation",
//   title: "Erro de Validacao",
//   detail: "Email invalido",
//   status: 400,
//   instance: "",
//   uri: "",
//   field: "email",
//   code: "VALIDATION_ERROR",
//   additionalFields: undefined,
//   retriable: true
// }
```

## Proximos passos

- [Tipos de Excecao](/guia/exceptions/tipos) — catalogo completo com factory methods
