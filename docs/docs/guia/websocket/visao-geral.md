---
title: WebSocket Client
sidebar_position: 1
---

# WebSocket Client

O TyForge fornece uma classe base abstrata `ServiceWebSocket` para construir clientes WebSocket type-safe com Result pattern, reconnect automático e proteção contra SSRF/DNS rebinding.

## Conceito

`ServiceWebSocket` estende `ServiceBase` e encapsula a API nativa `WebSocket` (Node.js >=24) com:

- Conversão automática de `https://` para `wss://` (e `http://localhost` para `ws://`)
- Validação DNS contra ranges privados antes da conexão
- Reconnect automático com backoff exponencial, jitter e delay cap de 30s
- Sanitização de mensagens contra prototype pollution com limite de profundidade
- Subscribe/unsubscribe para eventos tipados
- Timeout configurável na conexão
- Retorno sempre via Result pattern

## Criando um cliente WebSocket

```typescript
import { ServiceWebSocket, ExceptionWebSocket } from "@tyforge/websocket";
import { ok, isFailure } from "tyforge/result";
import { FString, FInt, FBoolean, FUrlOrigin } from "tyforge/type-fields";
import type { Result } from "tyforge/result";
import type { Exceptions } from "tyforge/exceptions";

class ChatService extends ServiceWebSocket {
  protected readonly _classInfo = { name: "ChatService", version: "1.0.0", description: "Chat WebSocket client" };
  readonly endpoint = FUrlOrigin.createOrThrow("https://chat.api.com");

  protected async getAuthHeaders(): Promise<Result<Record<string, FString>, Exceptions>> {
    return ok({ "Authorization": FString.createOrThrow("Bearer my-token") });
  }

  async connectToChat(): Promise<void> {
    const result = await this.connect({
      authenticated: FBoolean.createOrThrow(true),
      timeout: FInt.createOrThrow(5000),
      reconnect: FBoolean.createOrThrow(true),
      maxReconnectAttempts: FInt.createOrThrow(5),
    });
    if (isFailure(result)) throw result.error;
  }

  async sendMessage(text: string): Promise<void> {
    const result = await this.send(
      FString.createOrThrow("chat.message"),
      { text },
    );
    if (isFailure(result)) throw result.error;
  }

  onMessage(handler: (data: Record<string, unknown>) => void): void {
    this.subscribe(FString.createOrThrow("chat.message"), handler);
  }
}
```

## Segurança

| Proteção | Descrição |
|----------|-----------|
| DNS rebinding | `validateEndpointDns()` resolve hostname e valida contra IPs privados antes da conexão |
| IPs privados | Bloqueia 10.x, 172.16-31.x, 192.168.x, 169.254.x, 127.x, CGNAT, IPv6 link-local/ULA |
| IPv4-mapped IPv6 | Detecta `::ffff:10.0.0.1` e re-valida o IPv4 embutido |
| Prototype pollution | `sanitizeMessage()` recursiva com `DANGEROUS_KEYS` filtering |
| Profundidade | Limite de 50 níveis na sanitização — retorna `Result` com erro explícito |
| Tamanho | Mensagens acima de 10MB são descartadas antes do `JSON.parse` |

## Reconnect

O reconnect automático usa backoff exponencial com jitter:

- Base delay: 1s, dobrando a cada tentativa
- Delay cap: 30s (nunca excede)
- Jitter: 50-100% do delay calculado (previne thundering herd)
- Tentativas configuráveis via `maxReconnectAttempts` (default: 3)

## ExceptionWebSocket

| Factory Method | Código | Status | Retriable |
|---------------|--------|--------|-----------|
| `connectionFailed()` | `WS_CONNECTION_FAILED` | 502 | Sim |
| `connectionTimeout()` | `WS_CONNECTION_TIMEOUT` | 504 | Sim |
| `disconnected()` | `WS_DISCONNECTED` | 503 | Sim |
| `sendFailed(event)` | `WS_SEND_FAILED` | 502 | Sim |
| `subscriptionFailed(event)` | `WS_SUBSCRIPTION_FAILED` | 400 | Não |
| `authFailed(cause?)` | `WS_AUTH_FAILED` | 401 | Não |
| `invalidMessage()` | `WS_INVALID_MESSAGE` | 400 | Não |
| `invalidParams(detail)` | `WS_INVALID_PARAMS` | 400 | Não |

## Instalação

```bash
npm install @tyforge/websocket
```

```typescript
import { ServiceWebSocket, ServiceWebSocketSecurity, ExceptionWebSocket } from "@tyforge/websocket";
```
