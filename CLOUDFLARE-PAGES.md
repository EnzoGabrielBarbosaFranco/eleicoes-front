# Apuração no Cloudflare Pages

Estado em 2 de outubro de 2026: frontend publicado com autorização no projeto Pages `eleicoes-front`, CORS publicado nos dois Workers e domínio `apuracao.paineleleitoralnews.com.br` associado e ativo com HTTPS. Foi criado somente o CNAME desse subdomínio, após nova autorização. O usuário publicou a regra de cache limitada aos JS/CSS desse hostname, e os cabeçalhos públicos foram validados. **Nenhum push, desligamento da Vercel ou alteração dos demais registros DNS foi realizado. O teste real no Ad Manager permanece pendente.**

## Domínio final e validação

- Associação Pages: `c6a6d555-b4d1-444b-9245-616d09bd820f`, criada em `2026-10-03T00:57:31Z`; domínio, verificação e validação estão `active`, com certificado HTTPS validado normalmente.
- CNAME: `apuracao.paineleleitoralnews.com.br` → `eleicoes-front.pages.dev`; registro `e6f5a40eaf1cdb2d09e6c7b0b275bb4b`, proxy habilitado, TTL automático.
- Os seis registros anteriores foram comparados antes/depois e permaneceram idênticos. Impressão SHA-256: `06ce7c1b3600686246b14819bb6df8498fdb6aa5ec21463f3d54d3ea7340a51a`.
- Os 15 HTMLs e todos os recursos pelo domínio próprio são idênticos ao build, com parâmetros, CSP e 404 corretos. HTML e JSON mantêm os cabeçalhos esperados; recursos com hash mantêm um ano de cache.
- O navegador confirmou cinco respostas históricas de 2022 com status 200, origem CORS correta e fonte `kv-history`; filtros cargo/UF, 1260×200 em desktop, altura mobile de 100 px, embed entre sites e iframe simples remoto 320×100 passaram sem erros JS e sem dependências da Vercel.
- Esses testes não validam resultados oficiais de 2026: as consultas desse ano foram bloqueadas no teste para não atualizar snapshots. Não houve gravação de snapshots/KV, consulta da apuração oficial, novo deploy ou alteração dos Workers nesta etapa de DNS.
- O teste real no SafeFrame do Ad Manager permanece pendente.

Verificação da integração atual, limitada à base histórica:

```powershell
node scripts/testar-integracao-publica.js
```

### Cache corrigido e verificado

Inicialmente, `embed.js`, `seguranca.js` e URLs antigas `/css/*` e `/js/*` recebiam quatro horas de validade pelo domínio próprio, apesar dos 300 segundos de `_headers`. O usuário criou e publicou pelo painel a regra `Apuracao - respeitar cache Pages`, com filtro restrito a JS/CSS de `apuracao.paineleleitoralnews.com.br`, `Eligible for cache`, Browser TTL em `Respect origin TTL` e sem configuração de Edge TTL.

Após o usuário informar o deploy, em `2026-10-03T01:16Z` (2 de outubro em Cuiabá), o teste `verificar-publicacao-pages.js pages https://apuracao.paineleleitoralnews.com.br` passou integralmente: 15 páginas, todos os recursos idênticos, parâmetros, CSP, 404 e TTLs corretos. `embed.js` retorna `public, max-age=300, must-revalidate`; recursos `/static/` retornam `public, max-age=31536000, immutable`. As expectativas do teste foram preservadas.

O teste de navegador foi repetido e passou: cinco respostas históricas 200 com fonte `kv-history` e CORS correto, filtros cargo/UF, embed remoto desktop/mobile e iframe 320×100, sem erros JS ou dependências da Vercel. Consultas oficiais de 2026 permaneceram bloqueadas no teste; não houve gravação de snapshots/KV, nova publicação pelo agente ou alterações de DNS nesta verificação.

Os acessos do agente continuam retornando 403 para settings/rulesets: a regra foi publicada pelo usuário, não pela API do agente, e seu ID não foi obtido. A configuração foi conferida nas imagens e seu efeito foi confirmado nos cabeçalhos públicos. Não mudar o Browser Cache TTL global, ativar `Cache Everything` indiscriminadamente ou apagar regras existentes. Novas alterações externas exigem nova autorização.

Referências: [Browser Cache TTL](https://developers.cloudflare.com/cache/how-to/edge-browser-cache-ttl/), [Browser TTL em Cache Rules](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/#browser-ttl).

## Registro desta publicação

- Conta: `939d64a1ecf272bba4ce267f59df5f19`.
- Pages Direct Upload: `https://eleicoes-front.pages.dev`; deployment `a5667a72-7b47-4510-ab95-900c771948d4`, publicado em `2026-10-03T00:49:51Z` (2 de outubro no horário de Cuiabá).
- Worker `backend-eleicoes`: versão anterior `2d4a6409-644e-4462-90fa-b658fbec5e26`; versão publicada `4505f492-15bb-4837-918c-47386045a866`.
- Worker `backend-eleicoes-2026`: versão anterior `aaa2c117-7126-44c0-ab87-76653f04d5fd`; versão publicada `c07289af-05c5-4344-a2cc-c670b5d70400`.
- A comparação dos bundles locais com o código então publicado confirmou que a única mudança nos dois Workers foi a nova origem CORS. Configurações, namespace KV e ambiente oficial foram verificados novamente após publicação.
- 29 testes de backend e testes locais dos 15 formatos/anos em desktop/mobile passaram. Capa véspera/dia, transição automática, filtros, embed 200/100 px e iframe 320×100 foram testados com APIs interceptadas.
- No Pages público, os 15 HTMLs e recursos retornaram os mesmos bytes do build local, com parâmetros preservados nos redirects, CSP, cache e 404 correto. Os testes públicos de CORS confirmaram origem nova, antiga, preflight e bloqueio de origem não autorizada.
- Não foram consultados resultados reais do TSE nem alterados snapshots/KV pelos testes de publicação. Posteriormente, o fluxo histórico pelo navegador foi validado no domínio final; o teste real no Ad Manager permanece pendente.
- A consulta DNS inicial em 2 de outubro retornou NXDOMAIN para `apuracao.paineleleitoralnews.com.br`; o registro foi criado depois com autorização, conforme o registro de domínio acima.

Verificações públicas somente leitura, sem consultas de resultados:

```powershell
node scripts/verificar-publicacao-pages.js cors backend-eleicoes
node scripts/verificar-publicacao-pages.js cors backend-eleicoes-2026
node scripts/verificar-publicacao-pages.js pages https://eleicoes-front.pages.dev
```

A URL `pages.dev` serve para verificar arquivos; não está liberada no CORS das APIs e não é o endereço de entrega aos clientes. O domínio próprio, o cache e a integração atual foram verificados. O próximo passo é testar em portal/SafeFrame antes da distribuição ampla. Não mudar os códigos dos clientes silenciosamente.

## Arquitetura preservada

- Frontend: HTML, CSS e JS estáticos no Pages, sem Functions, `_worker.js` ou proxy para a API.
- Backend histórico: Worker `backend-eleicoes` existente.
- Backend atual: Worker `backend-eleicoes-2026` existente.
- KV: bindings e namespace existentes, sem importação, migração de dados ou alteração de chaves.
- A atualização de 120 segundos, os filtros, os layouts, a demonstração histórica e as capas pré-eleição não foram alterados.
- O código atual de 2026 oculta o seletor de turno e usa o primeiro turno inicialmente. A migração conserva esse comportamento.

O backend continua consumindo requisições, CPU e operações KV. Servir o frontend pelo Pages não elimina esses consumos. O usuário informou a contratação do Workers Paid; não houve mudança de plano por estes scripts.

## Build estático

Requer Node 22+:

```powershell
node scripts/preparar-pages.js
node scripts/testar-pages.js
```

O build publica somente os 15 HTMLs (cinco de 2022 e dez de 2026), CSS, JS, amostra JSON, `embed.js`, `seguranca.js`, `404.html` e `_headers`. Os documentos, snippets, testes, scripts de manutenção, backend, `.git` e credenciais não entram em `dist-pages/`.

Scripts e estilos têm hash no nome, mantendo conteúdo e ordem de execução. Esses recursos recebem cache de um ano e `immutable`. Os caminhos antigos de CSS/JS, o incorporador e a amostra JSON continuam disponíveis com cache de cinco minutos, sem `immutable`. O HTML conserva a revalidação padrão do Pages. A capa e a passagem para apuração são executadas no navegador, não dependem de publicar um HTML no momento da eleição.

O gerador verifica limites de 20.000 arquivos e 25 MiB por arquivo e só substitui sua própria pasta `dist-pages`, identificada por marcador. Não guarde arquivos pessoais nessa pasta. Perfis e resultados dos testes ficam em `.pages-tests/`, ignorada pelo Git.

O teste simula rotas do Pages, redirecionamentos e cabeçalhos; intercepta as APIs com dados de teste. Não consulta o TSE nem acessa o KV de produção. Não substitui a validação na hospedagem real ou no SafeFrame do Ad Manager.

## CORS dos Workers

Nos dois projetos de backend, o domínio próprio foi acrescentado à lista de CORS e a origem Vercel foi preservada. A alteração foi publicada com autorização e verificada publicamente. Os testes cobrem ambas as origens, preflight e origem não autorizada.

Executar localmente, nas respectivas pastas:

```powershell
npm test -- --run
```

Não houve mudanças em `wrangler.jsonc`, bindings, TTL das APIs, normalização do TSE ou lógica de snapshots. O CORS novo já vale em produção e foi validado pelo navegador no domínio próprio. O cache do frontend foi corrigido separadamente por regra do usuário; testar no portal/SafeFrame antes da distribuição ampla.

## Etapas externas — exigem autorização específica

As etapas 2 a 5 foram concluídas com autorizações separadas. A integração atual, os arquivos e o cache foram verificados; o teste real no Ad Manager ainda está pendente. Futuras publicações e alterações externas também exigem nova autorização.

1. Revisar mudanças locais nos dois repositórios. Preservar as alterações do frontend que já existiam. Um push pode acionar deploy automático na Vercel; não executar sem autorização.
2. Publicar a alteração de CORS nos Workers `backend-eleicoes` e `backend-eleicoes-2026`, depois conferir a origem `https://apuracao.paineleleitoralnews.com.br` nas respostas públicas. Não usar ambiente simulado como produção.
3. Criar um projeto Pages separado, com nome disponível (sugerido `eleicoes-front`), sem Functions, e publicar somente `dist-pages/`. Um projeto Direct Upload não passa a publicar por push automaticamente.
4. Antes de associar o domínio, verificar se o DNS `apuracao.paineleleitoralnews.com.br` já existe e registrar o valor anterior. Se apontar para outro serviço, parar e confirmar o destino com o usuário.
5. Associar o subdomínio ao projeto Pages antes de alterar o CNAME. Alterar somente esse registro, após autorização para o domínio, sem mexer em `previa`, e-mail, domínio raiz ou nameservers. Conferir certificado e associação ativa.
6. Validar no domínio final os 15 formatos, redirecionamentos com parâmetros, scripts versionados, cache, dados, CORS, capas e embed entre origens. Para testes de API que possam atualizar cache/snapshots em produção, obter autorização antes de executar.
7. Testar em um portal autorizado e em criativos reais desktop/mobile do Ad Manager. Os testes locais não provam o funcionamento em qualquer SafeFrame ou domínio de cliente.
8. Só então distribuir os novos códigos, mantendo a Vercel para retorno e clientes ainda não atualizados.

Se usar primeiro uma URL `*.pages.dev`, ela não estará automaticamente liberada no CORS das APIs. Abrir HTML nessa origem não prova que os dados funcionarão. Autorizar somente a origem exata efetivamente atribuída, com nova alteração/deploy aprovado, ou validar as consultas após a associação ao domínio próprio.

## Integração dos clientes após validação pública

```html
<script src="https://apuracao.paineleleitoralnews.com.br/embed.js" defer></script>
<eleicoes-widget ano="2026" formato="1260x200" breakpoint="1050"></eleicoes-widget>
```

Preferir `eleicoes-widget` para apuração. A tag legada `previa-eleitoral-2026` permanece disponível, mas pode conflitar se o mesmo portal carregar também o embed do projeto de prévias.

No Ad Manager, usar os dez arquivos de `entrega/ad-manager/`: iframe simples de medida fixa, com criativo desktop e mobile 320×100 separados. O slot/GPT deve solicitar o tamanho adequado. Não inserir JavaScript de integração, regras globais `html,body` ou `sandbox` no criativo. O JavaScript interno da página hospedada continua necessário.

O portal deve estar autorizado tanto em `seguranca.js` quanto no `frame-ancestors` de `_headers`. A lista foi preservada, acrescida do domínio próprio, da origem antiga do frontend e dos frames internos do Google. Isso não autoriza todos os portais indiscriminadamente.

## Retorno e atualizações

Não apagar a Vercel ou os Workers anteriores. Se a validação falhar, não distribuir os snippets novos; restaurar o DNS anterior quando houver, ou retirar apenas o registro novo, mediante autorização. Clientes que ainda usam `eleicoes-front.vercel.app` não são migrados automaticamente e continuam consumindo a Vercel.

Atualizações do frontend exigem regenerar o build e obter autorização para publicar. Os nomes dos recursos mudam quando o conteúdo muda; URLs mutáveis podem permanecer em cache por até cinco minutos. Evitar refatorações amplas antes da eleição.

Referências: [arquivos estáticos e Functions](https://developers.cloudflare.com/pages/functions/pricing/), [cabeçalhos](https://developers.cloudflare.com/pages/configuration/headers/), [rotas e 404](https://developers.cloudflare.com/pages/configuration/serving-pages/), [domínio próprio](https://developers.cloudflare.com/pages/configuration/custom-domains/).
