# React Native + TyForge

Template de prompt para projetos React Native que utilizam TyForge. Copie este arquivo para a raiz do projeto e ajuste conforme necessário.

## Build & Development Commands

```bash
npx expo start                  # inicia Metro bundler
npx expo start --android        # abre no Android
npx expo start --ios            # abre no iOS
npx expo start --clear          # limpa cache do Metro
npx expo prebuild                # gera projetos nativos (bare workflow)
npx expo run:ios                 # build nativo iOS
npx expo run:android             # build nativo Android
eas build --platform ios         # build de produção iOS
eas build --platform android     # build de produção Android
eas update                       # OTA update via EAS
npm run typecheck                # tsc --noEmit
npm run test                     # jest
npm run test:e2e                 # detox (se configurado)
```

## Architecture

### Estrutura de pastas

```
src/
  app/                   # screens e navegação
    (tabs)/              # tab navigator (Expo Router)
    (auth)/              # auth flow screens
    _layout.tsx          # root layout
  components/            # componentes reutilizáveis (sem estado de negócio)
    ui/                  # primitivos de UI (Button, Input, Card, Modal)
    forms/               # componentes de formulário com validação
    lists/               # componentes de lista otimizados
  hooks/                 # hooks customizados
  services/              # classes que estendem ServiceHttp, ServiceGraphQL, ServiceWebSocket
  domain/                # Entities, Aggregates, ValueObjects, DTOs, Events
  stores/                # Zustand stores (ou Redux slices)
  theme/                 # tokens de design, paleta, tipografia, espaçamentos
  utils/                 # funções utilitárias puras (sem dependências de RN)
  constants/             # constantes da aplicação
  i18n/                  # internacionalização
  types/                 # tipos globais compartilhados
```

### Princípios

- **Feature-based**: agrupar por feature quando a complexidade justificar (`src/features/checkout/`)
- **Screens são composição**: uma screen importa componentes, hooks e services — nunca contém lógica de negócio diretamente
- **Hooks encapsulam lógica**: `useAuth()`, `useCart()`, `useForm()` — nunca `useState` + `useEffect` soltos em screens
- **Services são classes**: estendem `ServiceHttp` ou `ServiceGraphQL` do TyForge — nunca fetch manual
- **Domain models validam**: TypeFields e DTOs garantem integridade — nunca primitivos plain em boundaries

## TyForge Integration

### Pacotes compatíveis com React Native

| Pacote | Suporte | Observação |
|--------|---------|------------|
| `tyforge` | Completo | Barrel principal, Result, TypeFields, Schema, Exceptions, Domain Models |
| `tyforge/result` | Completo | `ok()`, `err()`, `isSuccess()`, `isFailure()`, combinadores |
| `tyforge/type-fields` | Completo | Todos os TypeFields funcionam em Hermes |
| `tyforge/schema` | Completo | Validação sequencial (parallel degrada para sequencial automaticamente) |
| `tyforge/exceptions` | Completo | Todas as exceções e RFC 7807 |
| `tyforge/tools` | Completo | TypeGuard, ToolObjectTransform |
| `@tyforge/http` | Completo | Fetch API nativa do React Native |
| `@tyforge/graphql` | Completo | `graphql-request` usa fetch nativo |
| `@tyforge/websocket` | Completo | WebSocket API nativa do React Native |
| `tyforge/config` | Bloqueado | Requer `node:fs` — usar `TypeField.configure()` diretamente |
| `tyforge/tools/network-security` | Bloqueado | Requer `node:dns` — DNS validation desabilitada por default |
| `tyforge/infrastructure/service-base` | Bloqueado | Import via barrel principal (`tyforge`) em vez do subpath |

### Configuração do Metro

Metro não suporta `exports` do package.json nativamente. Configurar `metro.config.js` com resolução manual:

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: false,
  resolveRequest: (context, moduleName, platform) => {
    const tyforgeBase = path.resolve(__dirname, "node_modules", "tyforge", "dist");
    const subpaths = {
      "tyforge/result": path.join(tyforgeBase, "result", "index.js"),
      "tyforge/type-fields": path.join(tyforgeBase, "type-fields", "index.js"),
      "tyforge/tools": path.join(tyforgeBase, "tools", "index.js"),
      "tyforge/exceptions": path.join(tyforgeBase, "exceptions", "index.js"),
      "tyforge/schema": path.join(tyforgeBase, "schema", "index.js"),
      "tyforge/infrastructure/service-base": path.join(tyforgeBase, "infrastructure", "service.base.js"),
    };
    if (subpaths[moduleName]) {
      return { filePath: subpaths[moduleName], type: "sourceFile" };
    }
    if (moduleName === "uuid") {
      const candidates = [
        path.resolve(__dirname, "node_modules", "tyforge", "node_modules", "uuid", "dist", "index.js"),
        path.resolve(__dirname, "node_modules", "uuid", "dist", "index.js"),
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) return { filePath: c, type: "sourceFile" };
      }
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
```

### Bootstrap da aplicação

No entry point (`App.tsx` ou `_layout.tsx`), configurar locale dos TypeFields:

```typescript
import { TypeField } from "tyforge";

// Antes de qualquer create/assign
TypeField.configure({
  localeDisplay: "br",
  localeRegion: "br",
  localeData: "br",
});
```

### Criando Services

Services herdam de `ServiceHttp` ou `ServiceGraphQL`. O `validateEndpointDns()` retorna `true` por default (DNS validation não disponível em RN):

```typescript
import { ServiceHttp } from "@tyforge/http";
import { FUrlOrigin, FString } from "tyforge";
import { ok } from "tyforge/result";
import type { Result } from "tyforge/result";
import type { Exceptions } from "tyforge/exceptions";

class ApiUsuarios extends ServiceHttp {
  protected readonly _classInfo = { name: "ApiUsuarios", version: "1.0.0", description: "API de usuários" };
  readonly endpoint = FUrlOrigin.createOrThrow("https://api.meuapp.com");

  protected async getAuthHeaders(): Promise<Result<Record<string, FString>, Exceptions>> {
    const token = await SecureStore.getItemAsync("auth_token");
    if (!token) return ok({});
    return ok({ "Authorization": FString.createOrThrow(`Bearer ${token}`) });
  }

  async buscarUsuario(id: string) {
    return this.get(DtoReqBuscarUsuario.create({ id }));
  }
}
```

### Result Pattern em componentes

Nunca fazer `throw` em componentes. Usar Result pattern e mapear para UI:

```typescript
function TelaUsuario({ id }: { id: string }) {
  const { data, error, loading } = useQuery(() => apiUsuarios.buscarUsuario(id));

  if (loading) return <ActivityIndicator />;
  if (error) return <TelaErro exception={error} />;
  return <PerfilUsuario usuario={data} />;
}
```

### Validação de formulários com TypeFields

TypeFields validam em tempo real. Criar hook `useTypedForm`:

```typescript
function useCampo<F extends TypeField>(Field: { create(v: unknown): Result<F, Exceptions> }) {
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState<string | undefined>();

  const onChange = (texto: string) => {
    setValor(texto);
    const result = Field.create(texto);
    setErro(isFailure(result) ? result.error.detail : undefined);
  };

  return { valor, erro, onChange, valido: erro === undefined && valor.length > 0 };
}

// Uso
function FormularioCadastro() {
  const nome = useCampo(FString);
  const email = useCampo(FEmail);
  const cpf = useCampo(FDocumentCpf);

  return (
    <View>
      <TextInput value={nome.valor} onChangeText={nome.onChange} />
      {nome.erro && <Text style={styles.erro}>{nome.erro}</Text>}
      {/* ... */}
    </View>
  );
}
```

## Navigation

### React Navigation / Expo Router

- Usar Expo Router (file-based) para novos projetos, React Navigation para projetos existentes
- Screens em `src/app/` seguem a convenção de pastas do Expo Router
- Cada screen é um componente default export (exceção à regra de named exports do TyForge — exigido pelo Expo Router)
- Deep linking configurado em `app.json` (`scheme`, `intentFilters`)
- Auth flow com grupos protegidos: `(auth)/` para telas autenticadas, `(public)/` para login/registro

### Tipagem de navegação

```typescript
// types/navigation.ts
export type TRootStackParamList = {
  Home: undefined;
  UserProfile: { userId: string };
  Settings: undefined;
};

// Nunca navegar com params não tipados
navigation.navigate("UserProfile", { userId: user.id.getValue() });
```

## State Management

### Zustand (recomendado)

```typescript
import { create } from "zustand";

interface IAuthStore {
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: () => boolean;
}

const useAuthStore = create<IAuthStore>((set, get) => ({
  token: null,
  setToken: (token) => set({ token }),
  isAuthenticated: () => get().token !== null,
}));
```

- Um store por domínio: `useAuthStore`, `useCartStore`, `useUserStore`
- Stores nunca importam componentes React
- Stores podem importar Services e domain models do TyForge
- Persistência via `zustand/middleware` + `expo-secure-store` para dados sensíveis, `AsyncStorage` para não sensíveis
- Selectors para evitar re-renders: `const token = useAuthStore((s) => s.token)`

## Styling

### StyleSheet obrigatório

```typescript
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", color: "#111" },
});
```

- Sempre `StyleSheet.create()` — nunca objetos inline em `style={}`
- Zero CSS-in-JS (styled-components, emotion) — overhead de runtime inaceitável em RN
- Zero NativeWind/Tailwind em produção a menos que o projeto já use — adicionar dependência de styling é decisão arquitetural
- Tokens de design centralizados em `src/theme/tokens.ts`
- Dark mode via `useColorScheme()` + theme provider
- Espaçamentos múltiplos de 4: 4, 8, 12, 16, 20, 24, 32, 40, 48
- Fontes carregadas via `expo-font` — nunca hardcoded font family

### Responsividade

```typescript
import { Dimensions, PixelRatio } from "react-native";

const { width } = Dimensions.get("window");
const isSmallDevice = width < 375;
```

- Usar `flex` para layouts fluidos
- `Dimensions` apenas para breakpoints, nunca para sizing direto
- `PixelRatio.roundToNearestPixel()` para bordas precisas

## Performance

### Regras críticas

- **FlatList/FlashList**: sempre para listas. Nunca `.map()` dentro de `ScrollView` para listas dinâmicas
- **keyExtractor**: retorna string estável (nunca index). Usar `item.id.getValue()` para entidades TyForge
- **getItemLayout**: fornecer quando itens têm altura fixa
- **React.memo**: em componentes de lista e componentes que recebem callbacks
- **useCallback/useMemo**: para callbacks e computações passadas como props. Nunca em computações triviais
- **Image**: usar `expo-image` (não `Image` nativo) — cache automático, placeholder, transição
- **Hermes**: sempre habilitado (default no Expo 50+). Verificar com `global.HermesInternal`
- **New Architecture (Fabric/JSI)**: habilitar quando todas as dependências suportarem
- **InteractionManager**: operações pesadas após animações completarem
- **Lazy loading**: `React.lazy()` + `Suspense` para screens pesadas

### Animações

- `react-native-reanimated` para animações performáticas (roda na UI thread)
- Nunca `Animated` API nativa para animações complexas — overhead de bridge
- `LayoutAnimation` para transições simples de layout
- `requestAnimationFrame` nunca em loop infinito

### Bundle

- **Tree shaking**: TyForge é ESM — imports nomeados são tree-shakeable pelo Metro
- **Lazy imports**: `const { Camera } = await import("expo-camera")` para módulos pesados
- **Assets**: imagens em @1x, @2x, @3x. WebP preferido sobre PNG
- **Hermes bytecode**: build de produção pré-compila JS para bytecode

## Testing

### Jest + React Native Testing Library

```bash
npm run test                    # jest
npm run test -- --watch         # watch mode
npm run test -- --coverage      # coverage report
```

```typescript
import { render, fireEvent, waitFor } from "@testing-library/react-native";

describe("FormularioCadastro", () => {
  it("valida email com TypeField", async () => {
    const { getByTestId, queryByText } = render(<FormularioCadastro />);
    fireEvent.changeText(getByTestId("email-input"), "invalido");
    await waitFor(() => {
      expect(queryByText(/email/i)).toBeTruthy();
    });
  });
});
```

- Testar comportamento, não implementação
- Mock de Services com Result pattern: `jest.spyOn(apiUsuarios, "buscarUsuario").mockResolvedValue(ok(usuario))`
- Mock de stores com Zustand: `useAuthStore.setState({ token: "fake-token" })`
- Snapshot tests apenas para componentes estáticos de UI
- Nunca mockar TypeFields — são puros e rápidos

### Detox (E2E)

- Flows críticos: login, cadastro, checkout, pagamento
- Rodar em CI com EAS Build
- Fixtures com dados reais validados por TyForge DTOs

## Security

### Armazenamento

- **expo-secure-store**: tokens, credenciais, dados sensíveis (Keychain no iOS, EncryptedSharedPreferences no Android)
- **AsyncStorage**: preferências de UI, cache não sensível. Nunca tokens ou PII
- **MMKV**: cache de alta performance para dados não sensíveis que precisam de velocidade
- Nunca armazenar dados sensíveis em state do React — limpar ao desmontar

### Rede

- HTTPS obrigatório — `FUrlOrigin` do TyForge já rejeita HTTP em produção (exceto localhost)
- Certificate pinning via `expo-network` ou configuração nativa para apps críticos
- Timeout em todas as requests — configurar via DTO do TyForge: `{ timeout: 30000 }`
- Token refresh com interceptor — implementar no `getAuthHeaders()` do Service

### Autenticação

- Biometria via `expo-local-authentication` — nunca substituir autenticação do servidor
- Token JWT armazenado em SecureStore, nunca em AsyncStorage
- Refresh token com rotação — invalidar no servidor ao detectar reuso
- Logout limpa SecureStore, stores e cache de navegação

### Código

- Ofuscação habilitada em produção (Hermes bytecode já oferece proteção básica)
- Nunca hardcodar API keys, secrets ou endpoints de staging no código
- Variáveis de ambiente via `expo-constants` + `app.config.ts` — nunca em `.env` commitado
- ProGuard/R8 habilitado no Android para builds de produção

## Accessibility

- Toda interação tem `accessibilityLabel` descritivo
- Botões usam `accessibilityRole="button"`
- Imagens decorativas: `accessibilityElementsHidden={true}`
- Imagens informativas: `accessibilityLabel` com descrição
- Formulários: `accessibilityHint` para instrução adicional
- Contraste mínimo 4.5:1 (WCAG AA)
- Touch targets mínimo 44x44 pontos
- Testar com VoiceOver (iOS) e TalkBack (Android)

## Convenções de Nomenclatura

Seguir prefixos do TyForge para domain models:

| Prefixo | Uso | Exemplo |
|---------|-----|---------|
| `F` | TypeFields | `FString`, `FEmail` |
| `T` | Types | `TUserProps`, `TRootStackParamList` |
| `I` | Interfaces | `IAuthStore`, `IApiResponse` |
| `O` | Objetos const (`as const`) | `OAppRoutes`, `OThemeColors` |
| `Dto` | DTOs de input | `DtoLogin`, `DtoCriarUsuario` |
| `DtoReq` | DTOs de request | `DtoReqBuscarUsuario` |
| `DtoRes` | DTOs de response | `DtoResPerfilUsuario` |
| `Exception` | Exceções | `ExceptionAuth`, `ExceptionNetwork` |

### Componentes React Native

- Componentes: PascalCase sem prefixo — `UserProfile`, `LoginForm`, `CartItem`
- Screens: sufixo `Screen` — `HomeScreen`, `SettingsScreen`, `CheckoutScreen`
- Hooks: prefixo `use` — `useAuth`, `useCart`, `useForm`
- Stores: prefixo `use` + sufixo `Store` — `useAuthStore`, `useCartStore`
- Services: sem sufixo `Service` — `ApiUsuarios`, `ApiProdutos` (a classe já estende `ServiceHttp`)
- Arquivos de componente: PascalCase — `UserProfile.tsx`, `LoginForm.tsx`
- Arquivos de hook: camelCase — `useAuth.ts`, `useCart.ts`
- Arquivos de service: camelCase — `api-usuarios.ts`, `api-produtos.ts`
- Arquivos de store: camelCase — `auth.store.ts`, `cart.store.ts`
- Arquivos de tipo: camelCase — `navigation.types.ts`, `api.types.ts`

## Proibicoes

- Zero `any` — tipagem forte via TyForge TypeFields e tipos inferidos
- Zero `as` cast (exceto `as const`) — usar TypeGuard ou narrowing
- Zero `!` non-null assertion — verificar nullability explicitamente
- Zero `fetch()` direto — usar `ServiceHttp` ou `ServiceGraphQL` do TyForge
- Zero `console.log` em produção — usar sistema de logging (Sentry, etc.)
- Zero `AsyncStorage` para dados sensíveis — usar `expo-secure-store`
- Zero `JSON.parse()` sem validação — usar DTOs do TyForge para deserializar
- Zero inline styles — sempre `StyleSheet.create()`
- Zero `.map()` em `ScrollView` para listas dinâmicas — usar `FlatList`/`FlashList`
- Zero `useEffect` para lógica de negócio — encapsular em hooks ou services
- Zero `setTimeout`/`setInterval` em componentes sem cleanup
- Zero imports relativos que saem de `src/` — configurar path aliases no `tsconfig.json`
- Zero `Platform.OS` espalhado — centralizar em `src/utils/platform.ts` ou componentes platform-specific (`.ios.tsx`, `.android.tsx`)
- Zero `Dimensions.get()` em render — usar hooks (`useWindowDimensions`)
- Zero `new Date()` para formatação — usar `Intl.DateTimeFormat` ou biblioteca de datas
- Zero HTTP em produção — `FUrlOrigin` do TyForge garante HTTPS

## Qualidade Obrigatória

Antes de considerar qualquer trabalho como concluído:

1. `npm run typecheck` — zero erros
2. `npm run test` — zero falhas
3. `npx expo doctor` — zero incompatibilidades de versão
4. Testar em iOS E Android (simulator/emulator no mínimo)
5. Verificar performance com Flipper/React DevTools — zero re-renders desnecessários
6. Testar com font scale grande (acessibilidade)
7. Testar com dark mode

## Platform-Specific Code

Quando necessário código específico por plataforma:

```
ComponentName.tsx          # compartilhado (default)
ComponentName.ios.tsx      # iOS only
ComponentName.android.tsx  # Android only
```

Metro resolve automaticamente pelo sufixo. Nunca `if (Platform.OS === "ios")` em blocos grandes — usar arquivos separados.

Para diferenças pequenas (1-2 linhas):

```typescript
import { Platform } from "react-native";

const shadowStyle = Platform.select({
  ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  android: { elevation: 4 },
});
```

## Error Boundaries

Cada navigator/tab deve ter um Error Boundary:

```typescript
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Reportar para Sentry/Bugsnag
  }

  render() {
    if (this.state.hasError) return <TelaErroGenerico onRetry={() => this.setState({ hasError: false })} />;
    return this.props.children;
  }
}
```

## Deep Linking

```typescript
// app.json
{
  "expo": {
    "scheme": "meuapp",
    "android": {
      "intentFilters": [{
        "action": "VIEW",
        "data": [{ "scheme": "https", "host": "meuapp.com", "pathPrefix": "/" }],
        "category": ["BROWSABLE", "DEFAULT"]
      }]
    },
    "ios": {
      "associatedDomains": ["applinks:meuapp.com"]
    }
  }
}
```

- Usar Expo Router linking config para mapear URLs para screens
- Validar params de deep link com TypeFields antes de navegar
- Nunca confiar em params externos — tratar como input não validado

## Internacionalização (i18n)

- `expo-localization` para detectar locale do dispositivo
- `i18next` + `react-i18next` para traduções
- Chaves de tradução em inglês: `t("auth.login.title")`
- Arquivos de tradução em `src/i18n/locales/{lang}.json`
- RTL support: testar layout com árabe/hebraico
- Datas e moedas formatadas via TypeFields: `FMoney`, `FCurrency`, `FDate`
- `TypeField.configure({ localeDisplay: "br" })` alinhado com locale do dispositivo

## Git Commits

- Conventional Commits: `feat(auth): adiciona login biométrico`
- Escopo por feature ou camada: `feat(cart)`, `fix(navigation)`, `refactor(theme)`
- Descrição em português, lowercase, sem ponto final
