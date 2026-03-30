# @tyforge/graphql

Type-safe GraphQL client with Result pattern, introspection blocking, and exception mapping for [TyForge](https://github.com/navegar-sistemas/tyforge).

## Installation

```bash
npm install @tyforge/graphql tyforge
```

## Usage

```typescript
import { ServiceGraphQL } from "@tyforge/graphql";
import { ok } from "tyforge/result";
import { FString, FUrlOrigin } from "tyforge/type-fields";

class MyGraphQL extends ServiceGraphQL {
  protected readonly _classInfo = { name: "MyGraphQL", version: "1.0.0", description: "GraphQL client" };
  readonly endpoint = FUrlOrigin.createOrThrow("https://api.example.com/graphql");

  protected async getAuthHeaders() {
    return ok({ "Authorization": FString.createOrThrow("Bearer token") });
  }
}
```

## Security

- Introspection query blocking
- SSRF protection (private IP blocking, DNS rebinding detection)
- Prototype pollution protection in variables
- Sanitization depth limit (50 levels)
- Response size limit (10MB)
- Redirect blocking (`redirect: "error"`)
- Timeout validation (1-300000ms)

## License

MIT
