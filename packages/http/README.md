# @tyforge/http

Type-safe HTTP client with Result pattern, security hardening, and exception mapping for [TyForge](https://github.com/navegar-sistemas/tyforge).

## Installation

```bash
npm install @tyforge/http tyforge
```

## Usage

```typescript
import { ServiceHttp } from "@tyforge/http";
import { ok } from "tyforge/result";
import { FString, FUrlOrigin, FUrlPath } from "tyforge/type-fields";

class MyApi extends ServiceHttp {
  protected readonly _classInfo = { name: "MyApi", version: "1.0.0", description: "API client" };
  readonly endpoint = FUrlOrigin.createOrThrow("https://api.example.com");

  protected async getAuthHeaders() {
    return ok({ "Authorization": FString.createOrThrow("Bearer token") });
  }

  getUsers() {
    return this.get(FUrlPath.createOrThrow("users"));
  }
}
```

## Security

- SSRF protection (private IP blocking, DNS rebinding detection)
- CRLF injection prevention in headers
- Redirect blocking (`redirect: "error"`)
- Response size limit (10MB)
- Prototype pollution protection in headers

## License

MIT
