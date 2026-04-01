---                                                                                        
  Falhas Confirmadas (20 riscos, 0 vulnerabilidades)                                         
                                                                                             
  Alta Prioridade                                                                            

  ────────────────────────────────────────                                                   
  #: 2                                                                                       
  Falha: validateEndpointDns() é no-op — retorna true hardcoded, DNS rebinding protection    
  100%                                                                                       
    opt-in                                                        
  Arquivo: infrastructure/service.base.ts:14
  ────────────────────────────────────────
  #: 3                                                                                       
  Falha: Sem crypto.timingSafeEqual — nenhum utility de comparação timing-safe. Consumidores
    podem usar === para tokens                                                               
  Arquivo: Codebase-wide                                          
  ────────────────────────────────────────
  #: 4                                                                                       
  Falha: SSRF localhost bypass incondicional — resolveAndValidate() isenta localhost sem
    checar NODE_ENV                                                                          
  Arquivo: tools/network-security.tool.ts:37-39                   

  Média Prioridade                                                                           
  
  ┌─────┬─────────────────────────────────────────┬──────────────────────────────────────┐   
  │  #  │                  Falha                  │               Arquivo                │
  ├─────┼─────────────────────────────────────────┼──────────────────────────────────────┤   
  │     │ Sem timeout default em HTTP/GraphQL —   │                                      │
  │ 5   │ AbortController só criado se timeout    │ service-http.base.ts:95,             │   
  │     │ fornecido. Permite slow-SSRF e          │ service-graphql.base.ts:81           │   
  │     │ connection exhaustion                   │                                      │
  ├─────┼─────────────────────────────────────────┼──────────────────────────────────────┤   
  │     │ GraphQL sem response size limit —       │                                      │
  │ 6   │ graphql-request lê response inteira sem │ service-graphql.base.ts              │   
  │     │  limite de bytes                        │                                      │
  ├─────┼─────────────────────────────────────────┼──────────────────────────────────────┤   
  │     │ Sem .npmrc com ignore-scripts=true —    │                                      │
  │ 7   │ deps terceiras podem executar           │ Raiz do projeto                      │   
  │     │ postinstall malicioso                   │                                      │
  ├─────┼─────────────────────────────────────────┼──────────────────────────────────────┤   
  │     │ Sem CI pipeline — security checks       │                                      │
  │ 8   │ dependem de pre-commit hooks, bypass    │ Raiz do projeto                      │   
  │     │ com --no-verify                         │                                      │
  ├─────┼─────────────────────────────────────────┼──────────────────────────────────────┤   
  │ 9   │ Docker base image não pinada por digest │ Dockerfile.sandbox:1                 │   
  │     │  — FROM node:24-slim é tag flutuante    │                                      │
  ├─────┼─────────────────────────────────────────┼──────────────────────────────────────┤   
  │     │ ExceptionAuth.userNotFound() permite    │                                      │   
  │ 10  │ user enumeration — retorna              │ exceptions/auth.exception.ts:93      │
  │     │ tipo/título/código distintos de         │                                      │   
  │     │ invalidCredentials()                    │                                      │
  ├─────┼─────────────────────────────────────────┼──────────────────────────────────────┤
  │     │ ExceptionGeneric.data é enumerable —    │                                      │   
  │ 11  │ this.data = data sem                    │ exceptions/generic.exception.ts:23   │
  │     │ Object.defineProperty. Aparece em       │                                      │   
  │     │ JSON.stringify()                        │                                      │
  ├─────┼─────────────────────────────────────────┼──────────────────────────────────────┤
  │ 12  │ noUncheckedIndexedAccess ausente —      │ undefined`                           │
  │     │ indexed access retorna T em vez de `T   │                                      │   
  └─────┴─────────────────────────────────────────┴──────────────────────────────────────┘
                                                                                             
  Baixa Prioridade                                                                           
  
  ┌─────┬──────────────────────────────────────────────┬──────────────────────────────────┐  
  │  #  │                    Falha                     │             Arquivo              │
  ├─────┼──────────────────────────────────────────────┼──────────────────────────────────┤  
  │ 13  │ TOCTOU em hook-setup-native — race entre     │ hooks/hook-setup-native.ts:20-48 │
  │     │ lstatSync e writeFileSync para symlink check │                                  │  
  ├─────┼──────────────────────────────────────────────┼──────────────────────────────────┤  
  │ 14  │ Config writes não atômicos — writeFileSync   │ lint-config-writer.ts:29         │
  │     │ direto sem write-then-rename                 │                                  │  
  ├─────┼──────────────────────────────────────────────┼──────────────────────────────────┤
  │ 15  │ Linter sem file size check — readFileSync    │ linter.ts:23                     │  
  │     │ sem limit de tamanho                         │                                  │  
  ├─────┼──────────────────────────────────────────────┼──────────────────────────────────┤
  │ 16  │ .mcp.json tracked no git — gitignored mas já │ .mcp.json                        │  
  │     │  commitado, git rm --cached necessário       │                                  │  
  ├─────┼──────────────────────────────────────────────┼──────────────────────────────────┤
  │ 17  │ Docker override com @latest — npm install -g │ Dockerfile.sandbox.override:4    │  
  │     │  @anthropic-ai/claude-code@latest não pinado │                                  │  
  ├─────┼──────────────────────────────────────────────┼──────────────────────────────────┤
  │ 18  │ Sem healthcheck no docker-compose —          │ docker-compose.sandbox.yml       │  
  │     │ container sem monitoramento de saúde         │                                  │  
  ├─────┼──────────────────────────────────────────────┼──────────────────────────────────┤
  │     │ execSync em format.ts e git.tool.ts — shell  │                                  │  
  │ 19  │ spawn com strings estáticas (preferível      │ format.ts:18, git.tool.ts:6      │  
  │     │ execFileSync)                                │                                  │
  ├─────┼──────────────────────────────────────────────┼──────────────────────────────────┤  
  │ 20  │ Stale versions em examples/ — tyforge:       │ examples/package.json            │
  │     │ "0.2.11" vs atual 0.2.17                     │                                  │  
  └─────┴──────────────────────────────────────────────┴──────────────────────────────────┘