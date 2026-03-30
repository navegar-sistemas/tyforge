# @tyforge/websocket

Type-safe WebSocket client with Result pattern, reconnection, security hardening, and exception mapping for [TyForge](https://github.com/navegar-sistemas/tyforge).

## Installation

```bash
npm install @tyforge/websocket tyforge
```

## Usage

```typescript
import { ServiceWebSocket } from "@tyforge/websocket";
import { ok } from "tyforge/result";
import { FString, FBoolean, FUrlOrigin } from "tyforge/type-fields";

class ChatService extends ServiceWebSocket {
  protected readonly _classInfo = { name: "ChatService", version: "1.0.0", description: "Chat client" };
  readonly endpoint = FUrlOrigin.createOrThrow("https://ws.example.com");

  protected async getAuthHeaders() {
    return ok({ "Authorization": FString.createOrThrow("Bearer token") });
  }

  async start() {
    await this.connect({ authenticated: FBoolean.createOrThrow(true), reconnect: FBoolean.createOrThrow(true) });
    this.subscribe(FString.createOrThrow("messages"), (data) => console.log(data));
  }
}
```

## Security

- SSRF protection (private IP blocking, DNS rebinding detection, IPv4-mapped IPv6)
- Prototype pollution protection in messages
- Sanitization depth limit (50 levels)
- Message size limit (10MB before JSON.parse)
- Reconnect with exponential backoff, jitter (50-100%), and 30s delay cap

## License

MIT
