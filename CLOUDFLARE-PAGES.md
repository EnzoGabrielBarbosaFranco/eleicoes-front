# Apuração no Cloudflare Pages

## Idest e Campo Grande News — push e deploy autorizados em 6 de outubro de 2026

Entrega estática no Git `eleicoes-front/main` e Pages `eleicoes-front`, produção/main,
em `https://apuracao.placardasurnas.com.br`: duas identidades, logos originais,
degradê azul do Idest, verde/laranja do Campo Grande News e logo quadrada de
34×34 px sem CGN/zoom (compactos mobile: 20×20 px compartilhados).
Build: 132 arquivos, 1,00 MiB e 25 HTMLs. Relatórios locais em `.pages-tests/`;
testes de navegador usam APIs simuladas, sem consultas reais ao TSE/KV.
O deployment desta entrega deve ser conferido no painel Pages pelo commit.
Workers, DNS, cache e licenças permanecem fora do escopo da publicação.
Lista de entrega atualizada para 14 clientes/126 links, sem index.
Os deployments nas seções abaixo são registros históricos.

## Novas identidades — push e deploy autorizados em 6 de outubro de 2026

Escopo da entrega: dez novas marcas (A Crítica, Agência Cidades, Capital do
Pantanal, JD1 Notícias, Pix News MS, Pulso MS, Diário do Litoral, Gazeta SP,
Diário do Estado MS e Midiamax), seus arquivos originais de logo, correção do
recorte vertical dos nomes e bordas específicas do Pix/Pulso preservadas.
Correio do Estado e Primeira Página continuam no mesmo build.
Lista de entrega: `entrega/LINKS-PERSONALIZADOS.md`, com 108 links e sem index.

Destinos autorizados: Git `eleicoes-front/main` e Pages `eleicoes-front`,
produção/main, domínio `https://apuracao.placardasurnas.com.br`.
Build: 130 arquivos, 0,96 MiB e 25 HTMLs. O identificador do deployment desta
entrega deve ser conferido no painel Pages, associado ao commit desta entrega.
Os identificadores das seções abaixo são registros históricos.

As verificações locais/públicas usam APIs simuladas, sem consultar TSE/KV.
Os relatórios são gerados em `.pages-tests/`, sem envio de perfis do navegador.
Workers, DNS, cache e licenças não fazem parte da autorização atual e não
devem ser alterados. Os domínios dos novos portais precisam ser informados
para futura liberação. No Diário do Estado MS, `#0067B` é inválido (cinco
dígitos); mantêm-se somente os cinzas confirmados.

## Legibilidade 2026 e personalizados — publicação autorizada em 6 de outubro de 2026

Após o usuário informar que fez o push e autorizar especificamente o deploy,
o frontend estático foi publicado no projeto `eleicoes-front`, produção/main,
deployment `185d5e85-117e-4117-8cef-381dce29c413`, source Git `a224e92`, sem
alterações locais pendentes no momento do upload (`--commit-dirty=false`).
URL do deployment: `https://185d5e85.eleicoes-front.pages.dev`.
Domínio final: `https://apuracao.placardasurnas.com.br`.
O build tem 120 arquivos, 0,85 MiB e 25 páginas.

Inclui Primeira Página com logo WebP original/degradê, identidade compacta com
logo/nome, aviso informativo do segundo turno e os ajustes de legibilidade nas
dez páginas 2026 e dez personalizadas: votos/partidos/rótulos maiores,
percentuais destacados nos compactos de 90/100 px e partido menor. Resumos
300x250/300x600 em grade 2x2, dados em três linhas também no 1260x100,
distância de 5 px entre botão/resumo do 300x250 e alturas externas preservadas.
No 300x250 original, Obter widget é ocultado somente enquanto o resumo está
aberto. A espera do 1260x100 mobile cabe na área menor com texto legível.
Marca Placar das Urnas, capas/transições e filtros foram preservados.

Teste local completo: 25 páginas, 1.570 chamadas simuladas, zero erros.
Inventário público: todos os HTMLs/recursos iguais ao build, parâmetros,
CSP/iframe e 404 corretos. **A validação integral de cache continua falhando:**
URLs sem hash retornam `max-age=14400`, não os 300 segundos do build.
Recursos versionados permanecem immutable por um ano; não se relaxou o teste,
alterou regra da zona ou fez purge. Recarga forçada pode ser necessária.

Integração pública passou com 190 respostas simuladas de 2026, zero erros e
zero consultas proibidas. Conferiu os dez formatos desktop/mobile na marca
original e nos três perfis, fontes/percentuais/resumos/espaçamentos, Correio
no embed com hover/arraste/retomada, espera/relógio, 150 cenários de
capas/apuração/embed e as 12 origens licenciadas simuladas. Corrigiram-se
somente no teste esperas por document.body e o resumo da fixture sem votos.
Não foi necessário outro deploy. Resultados oficiais reais e SafeFrame real
não foram validados; nenhum portal real foi consultado ou modificado.

Workers, KV, snapshots, DNS, CORS, cache e licenças não foram alterados.
Nenhum domínio novo do Correio/Primeira Página foi autorizado. Deployment
anterior `2955eb39` preservado; retorno exige nova autorização específica.
O agente não fez novo commit/push: testes e este registro ficaram locais.

## Personalizados, Correio e arraste — publicação autorizada em 5 de outubro de 2026

Após nova autorização específica, o frontend estático foi publicado no Pages
`eleicoes-front`, branch `main`, deployment de produção
`2955eb39-1be3-44c6-a4a9-096bde982f8f`, URL `https://2955eb39.eleicoes-front.pages.dev`.
O domínio final continua sendo `https://apuracao.placardasurnas.com.br`.
O build possui 113 arquivos e 25 HTMLs: cinco históricos de 2022, dez de 2026 e
dez personalizados. O upload usou `--commit-dirty=true`: o Source `d2b126f` no
painel identifica a base Git, não a ausência dos ajustes locais no conteúdo.

Inclui identidade do Correio com a logo PNG original e azul `#134282`, cadastro
por `site`, entrega individual para sites/Ad Manager e recursos isolados dos
personalizados. Somente personalizados não possuem pré-eleição. Inclui também
fonte TSE com data atual/horário sem segundos, resumo em uma linha, remoção da
faixa oficial redundante e arraste com mão nos carrosséis das três versões.
Ao soltar um arraste, o automático retoma mesmo com o mouse sobre os cards.

O teste local concluiu com 25 páginas, 640 consultas simuladas e zero erros.
O teste público passou nos dez formatos do Correio em desktop/320 px, verificando
logo, paleta, dimensões, ausência de capa e embed com hover/arraste/retomada.
Os embeds existentes passaram nos 150 cenários de formatos/fases/larguras, além
das 12 origens licenciadas simuladas. A comparação estática confirmou os bytes
dos 25 HTMLs e recursos, CSP e 404; a logo pública corresponde ao PNG fornecido.

**Cache ainda pendente:** a validação integral do inventário falha expressamente
porque arquivos sem hash e a logo retornam `max-age=14400`, enquanto o build
solicita `max-age=300`. Recursos versionados continuam immutable por um ano.
Não se afrouxou a expectativa do teste, nem se alterou a zona ou fez purge.
Navegadores com o embed antigo em cache podem precisar de recarga forçada.

Os testes interceptaram as APIs com fixtures e bloquearam DNS de Workers/Vercel;
não validam resultados oficiais reais nem SafeFrame real. Nenhum portal real
foi consultado/modificado, nenhum snapshot/KV foi gravado e não houve deploy de
Workers, mudança de DNS/CORS ou liberação do domínio do Correio. A publicação
anterior `73947072` foi preservada; qualquer retorno exige nova autorização.
O usuário autorizou separadamente o envio destas alterações ao Git do frontend.

## Liberação do site principal e publicação autorizada — 5 de outubro de 2026

Após autorização explícita para publicar e enviar os frontends ao Git, o projeto `eleicoes-front` recebeu o deployment de produção `73947072-91bd-4ec8-a39e-7cc8e61e7ba2`, URL `https://73947072.eleicoes-front.pages.dev`, concluído em `2026-10-05T22:35:54Z` (18:35 em Cuiabá). O domínio `apuracao.placardasurnas.com.br` está ativo com HTTPS. CSP e licença permitem o site comercial com/sem `www`, os cinco portais existentes e os frames do Google. A marca e os links são Placar das Urnas. Nenhum DNS ou código do site comercial foi alterado nesta publicação.

CORS publicado nos Workers `backend-eleicoes` (versão `6d62c7c9-4c6c-4ad3-8471-3b0f2ff42eb9`) e `backend-eleicoes-2026` (versão `46f6fab6-7b9e-4ed0-805e-cd0047b38f00`). Namespace KV, TTL de 120 segundos e ambiente oficial do TSE foram preservados. Verificação por GET `/` e OPTIONS passou nas duas APIs; não consulta resultados nem grava snapshots.

Os testes locais passaram nos dois frontends e nos 31 testes de backend. O teste de contingência fixa `Date.now()` somente no teste para eliminar a variação de segundos. As 15 páginas e os recursos públicos correspondem ao build, com CSP correta, parâmetros e 404 da amostra antiga no novo domínio. A primeira consulta após o deploy ainda retornou a CSP anterior; consultas posteriores confirmaram a versão nova.

O teste público de navegador concluiu com sucesso após a propagação: dez formatos em desktop/320/360/390/400 px nas fases véspera/dia/apuração, filtros, alturas, relógio e embed/iframe nas 12 origens simuladas (site principal e cinco portais, com/sem `www`). O teste foi corrigido para reconhecer também iframes no mesmo processo do Chrome: site principal e banners compartilham o domínio registrável, portanto nem sempre geram um target OOPIF separado. A correção é somente do teste, não do banner. Nenhum site de cliente foi consultado ou modificado; APIs receberam fixtures de 2026. Isso não valida resultados reais nem SafeFrame real.

**Pendência real de cache:** URLs JS/CSS sem hash retornam `public, max-age=14400, must-revalidate`, embora o build solicite `max-age=300`. O inventário falha expressamente nessa comparação; não considerar a validação de cache concluída nem relaxar a expectativa. Nenhuma regra de cache, configuração da zona ou purge foi alterado. O teste público de navegador bloqueia DNS para `*.workers.dev` e `*.vercel.app`, além de interceptar APIs com fixtures, para impedir acesso real ao TSE/KV. SafeFrame real e calendário do segundo turno continuam fora desta validação.

Versões anteriores preservadas: Pages `281e0a3b-335d-4a03-a237-e3381ea84dc1`, Worker legado `4505f492-15bb-4837-918c-47386045a866` e Worker 2026 `c07289af-05c5-4344-a2cc-c670b5d70400`. Retorno exige autorização específica; não executado. Os registros abaixo são históricos.

## Cadastro autorizado do novo domínio no Pages — 5 de outubro de 2026

Com autorização específica do usuário, foi associada `apuracao.placardasurnas.com.br` ao projeto existente `eleicoes-front`, na conta `939d64a1ecf272bba4ce267f59df5f19`. Associação `7e06febd-293b-4b5b-be63-ffc8b2a944e1`, confirmada pela API como `pending`, com validação e verificação pendentes. O destino DNS previsto é `eleicoes-front.pages.dev`. A associação antiga foi preservada; nenhum deployment, Worker ou registro DNS foi alterado.

O DNS público do domínio ainda usa os servidores automáticos do Registro.br, e `apuracao` não resolve. A tentativa autorizada de criar a zona Cloudflare recebeu HTTP 403 por falta da permissão `com.cloudflare.api.account.zone.create`; nenhuma zona foi criada. É necessário cadastrar a zona pelo painel (Free) e preparar/autorizar DNS, ou manter o DNS externo com CNAME. A marca e o CORS novos continuam somente locais. Publicação de frontend/Workers, ativação DNS/HTTPS e validação ainda estão pendentes de autorização específica. Não distribuir os snippets como funcionais nesta etapa.

## Placar das Urnas — preparação local em 5 de outubro de 2026

Nova marca e endereço previstos: `https://apuracao.placardasurnas.com.br`, com links comerciais para `https://placardasurnas.com.br/`. Banners, títulos, capas, embed e snippets foram ajustados localmente; cores, símbolo, medidas, filtros, tags e códigos dos projetos Pages/Workers foram preservados. CORS dos dois backends foi preparado localmente para a nova origem em substituição ao domínio anterior, sem mudar dados, cache ou snapshots. A CSP e a licença continuam permitindo os portais clientes existentes e os frames do Google, além do domínio novo com e sem www.

Os testes locais passaram: dez formatos das prévias, 15 páginas/anos da apuração, 150 cenários do embed da apuração com a nova marca e 31 testes dos backends. APIs do navegador foram interceptadas com fixtures; não houve acesso ao TSE/KV de produção. Cores e símbolo foram preservados.

Não houve publicação, push, alteração de DNS/nameservers ou associação de domínio nesta etapa. Antes de entregar aos clientes, autorizar separadamente os deploys e a ativação do domínio, conferir HTTPS/CORS e testar embed, iframe e SafeFrame real. As instalações com o domínio antigo precisam de novos códigos. Calendário e turno não foram alterados nesta troca de marca. Os registros abaixo são históricos e não comprovam a disponibilidade atual.

## Correção mobile do embed — publicada após validação dos dez formatos

O HTML enviado pelo usuário mostrava `data-embed-largura="1260"`, altura 200, modo desktop e breakpoint informado 940, apesar do uso esperado no mobile. A versão anterior media apenas o pai imediato e ignorava o breakpoint informado para a troca estrutural. A correção considera a área visível da viewport e dos ancestrais, evita centralizar o banner na parte invisível de um pai largo e observa os ancestrais com ResizeObserver.

Para os formatos responsivos de 2026, o breakpoint explícito considera a viewport da página. Um contêiner de até 760 px também recebe modo mobile. O breakpoint e o modo escolhido são enviados como queries `breakpoint` e `embed-modo`; a página ajusta somente as media queries estruturais de 760/761 px para ativar o modo escolhido, alinhando CSS, JS, capa, apuração e altura externa. Isso mantém um banner de 970 px em desktop numa página de 1400 px mesmo com breakpoint 1050. Sem atributo, permanece o padrão de 760 px; formatos fixos, Ad Manager sem query e páginas históricas de 2022 preservam o comportamento anterior. Mudança de modo recarrega o iframe conservando filtros persistidos; mudança de largura no mesmo modo não recarrega.

Foi adicionada `testar-embed.html`, excluída da lista de build, com cenários de pai largo, ancestral estreito, flex/grid/contents, oculto e breakpoints reais. A página permite prévias locais de véspera/dia sem alterar o relógio. Os parâmetros de prévia só são encaminhados a iframes locais a partir de uma página também local.

Depois de nova autorização específica do usuário, somente o frontend estático foi publicado no Pages `eleicoes-front`, branch `main`, deployment `281e0a3b-335d-4a03-a237-e3381ea84dc1`, criado em `2026-10-03T03:41:01.550533Z` (2 de outubro em Cuiabá), URL `https://281e0a3b.eleicoes-front.pages.dev`. A API confirmou o deployment como produção do domínio `apuracao.paineleleitoralnews.com.br`. Workers, DNS, cache, códigos dos clientes e repositórios remotos não foram alterados. Nova publicação exige nova autorização específica.

Os testes locais passaram: 15 formatos/anos, capas sem API em 32 cenários de layout/breakpoint, pai largo em 320/360/390/400 px, limites 940/941 e 1050/1051, contêiner oculto e mudança dinâmica de atributo. Capturas das duas capas de 360×100 foram inspecionadas. A apuração com breakpoint 1050 passou em 1040×100 e 1051×200, preservando filtros cargo/UF ao redimensionar e alternando corretamente o resumo mobile/desktop. Ad Manager com iframe fixo e isolamento de 2026 permanecem cobertos. Um teste inicial detectou a margem `!important` do Shadow DOM prevalecendo sobre a margem externa; a regra interna foi corrigida antes da execução final bem-sucedida.

A matriz local foi ampliada para os dez formatos de 2026, nos estados véspera/dia/apuração e em viewport desktop 1400 px e mobile 320/360/390/400 px: 150 cenários, todos aprovados, incluindo largura e altura internas/externas, filtros visíveis, pai largo e preservação dos formatos fixos. Capturas de capas desktop/mobile foram inspecionadas. O inventário público confirmou os bytes das 15 páginas e recursos; a conclusão integral continua falhando apenas no JSON antigo retido em cache, não usado pelos banners atuais. Os TTLs dos 42 recursos foram conferidos separadamente e estão corretos. Nenhum cache foi purgado.

A integração pública também passou nos 150 cenários dos dez formatos, com datas e respostas de API simuladas exclusivamente no navegador de teste, usando os arquivos reais do domínio. Capas, altura do iframe, filtros, pai largo e formatos fixos foram verificados; as dez origens dos cinco portais clientes passaram em embed/iframe. Nenhum portal real foi alterado ou consultado, nenhum resultado real foi validado e nenhum KV/TSE foi acessado. Os testes foram ajustados para aguardar a preparação completa do CDP (evitando usar a data real antes da injeção), reconhecer o redirect de `index.html` para `/2026/` e identificar cada iframe por um token de teste, sem afrouxar as verificações do código publicado. Não foi necessário outro deploy. O teste real no portal/SafeFrame continua sendo uma etapa própria.

## Liberação de cinco portais — publicada

Com autorização específica do usuário para esta liberação, somente o frontend estático foi publicado no Pages `eleicoes-front`, branch `main`, deployment `4067576a-3af7-412d-ae44-ac60c49f350c`, criado em `2026-10-03T02:52:27.325318Z` (2 de outubro em Cuiabá), URL `https://4067576a.eleicoes-front.pages.dev`. A API confirmou esse deployment como produção do domínio `apuracao.paineleleitoralnews.com.br`.

Foram acrescentados `portaldeprefeitura.com.br`, `portalmais360.com.br`, `diariodajaragua.com.br`, `douradosnews.com.br` e `folhape.com.br` à licença de `seguranca.js`. A CSP em `_headers` e `vercel.json` libera as dez origens HTTPS exatas, com e sem `www`, sem wildcard novo de subdomínios e preservando os portais e frames do Google existentes. `vercel.json` foi atualizado somente localmente; não houve publicação na Vercel. O backend não precisa autorizar esses portais no CORS, pois a origem das consultas permanece sendo a página do banner no domínio da apuração.

Os testes locais passaram para os 15 formatos/anos e verificaram licença, CSP e bloqueio de nomes de domínio semelhantes não autorizados. A integração pública passou com embed e iframe nas dez origens dos clientes simuladas pelo navegador, usando HTML, scripts e cabeçalhos reais do Pages. Os documentos de teste das origens clientes foram servidos pelo CDP e as APIs interceptadas com fixtures: nenhum portal real foi consultado ou modificado, nenhum resultado real foi acessado e não houve gravação no KV/TSE. O teste real em cada portal/SafeFrame continua necessário.

O inventário público confirmou as 15 páginas e recursos com os mesmos bytes do build e a CSP atualizada, mas continua falhando no resíduo de cache antigo `/2026/assets/dados-2022.json`, já registrado abaixo e não usado pelos banners atuais. Essa expectativa não foi relaxada e nenhum cache foi purgado. Workers, DNS, regras de cache e códigos dos clientes não foram alterados. Não houve commit/push pelo agente; futuras publicações exigem nova autorização.

## Visual de espera e relógio 970×90 — publicados

Após nova autorização específica, somente o frontend estático foi publicado no Pages `eleicoes-front`, branch `main`, deployment `f36b0a5d-74e5-481f-b39e-ecc80f7d9dcd`, criado em `2026-10-03T02:35:50.977451Z` (2 de outubro em Cuiabá), URL `https://f36b0a5d.eleicoes-front.pages.dev`. A API confirmou esse deployment como produção do domínio `apuracao.paineleleitoralnews.com.br`.

O estado de espera de 2026 passou a usar painel claro, borda sólida, relógio e texto legível, com ajustes compactos para os formatos menores. No 970×90, o relógio permanece visível também no mobile e a altura continua sendo 90 px. A faixa redundante de fonte oficial é ocultada somente durante a espera; com resultados, permanece disponível. Filtros, dados oficiais, isolamento de 2026, capas e transição automática foram preservados.

Os testes locais passaram nos 15 formatos/anos, incluindo os dez formatos de 2026 em dois cenários de espera, desktop e mobile. O teste de integração pública passou com arquivos reais do domínio e APIs interceptadas: 970×90, 1260×200 e 320×100 sem cortes, relógio visível, filtros, embed 200/100 px e iframe simples 320×100, sem erros JS ou dependências da Vercel. As capturas foram inspecionadas. Não houve consulta ao TSE nem gravação de snapshots/KV pelos testes.

O inventário público confirmou os bytes das 15 páginas e de todos os recursos do build; uma verificação separada confirmou os TTLs dos 42 recursos JS/CSS. O script atual publicado é `/static/js-widget-2026.a9d48ac020f73779.js`. A checagem integral do inventário ainda falha exclusivamente porque a URL antiga `/2026/assets/dados-2022.json` retorna 200 do cache; com query `?verificar=f36b0a5d`, retorna 404. Esse arquivo não integra o build nem é consultado pelos widgets de 2026. A expectativa 404 foi preservada e nenhuma limpeza de cache foi realizada.

Workers, DNS, regras de cache e códigos dos clientes não foram alterados nesta publicação. O código e este registro permanecem localmente, sem commit/push pelo agente. Qualquer outra publicação ou limpeza de cache exige nova autorização específica.

## Correção 2026 — publicada; limpeza de resíduo de cache pendente

O código do Git atual já usava exclusivamente o backend de 2026 nas páginas `/2026/`, mas a consulta pública ainda encontrava o script `/static/js-widget-2026.a43a50d1cc69e2ac.js`, com demonstração histórica. Após nova autorização específica, o frontend foi publicado em produção no deployment `674ed057-a2ae-4b57-a7a2-d79929123522`, criado em `2026-10-03T01:49:44.912188Z` (2 de outubro em Cuiabá), URL `https://674ed057.eleicoes-front.pages.dev`. O domínio final já referencia `/static/js-widget-2026.026006f4e38ecd68.js`: fallback, API histórica e amostra 2022 estão ausentes desse script. O Pages usa Direct Upload; push no Git não atualiza o deployment. A descrição de testes históricos abaixo registra somente a migração anterior.

O gerador foi ajustado para não copiar a antiga amostra `2026/assets/dados-2022.json`, cuja pasta já foi removida do código-fonte. O widget agora exige o ano explícito 2026 nas respostas e rejeita a fase histórica. A estrutura de páginas históricas da raiz permanece separada e funcional.

O teste local passou com 15 páginas em desktop/mobile, dez formatos 2026 antes do dia 4 consultando somente a API de 2026, rejeição de ano errado/ausente e fase histórica, indisponibilidade e zero votos sem fallback. Capas, transição, filtros, embed e iframe 320×100 também passaram. O build contém 59 arquivos. As APIs foram interceptadas com fixtures: nenhum resultado real, TSE ou KV de produção foi acessado.

O teste de integração pública passou após a publicação: cinco respostas interceptadas de apuração 2026, filtros cargo/UF, 1260×200 desktop, altura mobile de 100 px, embed remoto e iframe 320×100, zero erros JS, zero consultas proibidas e nenhuma dependência da Vercel. Essa verificação testa o layout com fixtures, não resultados oficiais reais. O CORS real do Worker 2026 passou separadamente por GET `/` e OPTIONS, incluindo origem nova, antiga e bloqueio de origem não autorizada.

O inventário estático comparou os bytes das 15 páginas e dos recursos com o build novo, mas sua conclusão integral falhou na checagem de remoção da amostra: `/2026/assets/dados-2022.json` ainda retorna 200 e JSON retido em cache no domínio próprio e no alias `pages.dev`. A mesma URL com query inédita retorna 404, confirmando sua ausência no build publicado. O widget novo não referencia nem consulta essa amostra. Não relaxar a expectativa 404 do teste. A limpeza desse resíduo exige autorização específica; não foi realizada. A retenção de arquivos em cache após deploy é descrita em [Serving Pages / Asset retention](https://developers.cloudflare.com/pages/configuration/serving-pages/#asset-retention).

O Worker 2026 foi conferido somente por leitura antes desta publicação: `TSE_ENVIRONMENT=oficial`, `TSE_RESULTS_ROOT=https://resultados.tse.jus.br/oficial` e cache de 120 segundos. Nesta publicação, Workers, DNS, regras de cache e códigos dos clientes não foram alterados. Somente o frontend estático foi enviado ao Pages. O registro desta publicação foi atualizado localmente, sem push pelo agente. Qualquer nova publicação exige nova autorização específica.

## Registro da migração anterior

Estado em 2 de outubro de 2026: frontend publicado com autorização no projeto Pages `eleicoes-front`, CORS publicado nos dois Workers e domínio `apuracao.paineleleitoralnews.com.br` associado e ativo com HTTPS. Foi criado somente o CNAME desse subdomínio, após nova autorização. O usuário publicou a regra de cache limitada aos JS/CSS desse hostname, e os cabeçalhos públicos foram validados. **Nenhum push, desligamento da Vercel ou alteração dos demais registros DNS foi realizado. O teste real no Ad Manager permanece pendente.**

## Domínio final e validação

- Associação Pages: `c6a6d555-b4d1-444b-9245-616d09bd820f`, criada em `2026-10-03T00:57:31Z`; domínio, verificação e validação estão `active`, com certificado HTTPS validado normalmente.
- CNAME: `apuracao.paineleleitoralnews.com.br` → `eleicoes-front.pages.dev`; registro `e6f5a40eaf1cdb2d09e6c7b0b275bb4b`, proxy habilitado, TTL automático.
- Os seis registros anteriores foram comparados antes/depois e permaneceram idênticos. Impressão SHA-256: `06ce7c1b3600686246b14819bb6df8498fdb6aa5ec21463f3d54d3ea7340a51a`.
- Os 15 HTMLs e todos os recursos pelo domínio próprio são idênticos ao build, com parâmetros, CSP e 404 corretos. HTML e JSON mantêm os cabeçalhos esperados; recursos com hash mantêm um ano de cache.
- O navegador confirmou cinco respostas históricas de 2022 com status 200, origem CORS correta e fonte `kv-history`; filtros cargo/UF, 1260×200 em desktop, altura mobile de 100 px, embed entre sites e iframe simples remoto 320×100 passaram sem erros JS e sem dependências da Vercel.
- Esses testes não validam resultados oficiais de 2026: as consultas desse ano foram bloqueadas no teste para não atualizar snapshots. Não houve gravação de snapshots/KV, consulta da apuração oficial, novo deploy ou alteração dos Workers nesta etapa de DNS.
- O teste real no SafeFrame do Ad Manager permanece pendente.

Verificação de integração com arquivos públicos e API de 2026 interceptada (executar após a nova publicação):

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
- A atualização de 120 segundos, os filtros, os layouts e as capas pré-eleição são preservados. A demonstração histórica é exclusiva das páginas de 2022 na raiz; nunca deve ser usada nas páginas `/2026/`.
- O código atual de 2026 oculta o seletor de turno e usa o primeiro turno inicialmente. A migração conserva esse comportamento.

O backend continua consumindo requisições, CPU e operações KV. Servir o frontend pelo Pages não elimina esses consumos. O usuário informou a contratação do Workers Paid; não houve mudança de plano por estes scripts.

## Build estático

Requer Node 22+:

```powershell
node scripts/preparar-pages.js
node scripts/testar-pages.js
```

O build publica somente os 15 HTMLs (cinco de 2022 e dez de 2026), CSS, JS, `embed.js`, `seguranca.js`, `404.html` e `_headers`. Não publica amostras de candidatos. Os documentos, snippets, testes, scripts de manutenção, backend, `.git` e credenciais não entram em `dist-pages/`.

Scripts e estilos têm hash no nome, mantendo conteúdo e ordem de execução. Esses recursos recebem cache de um ano e `immutable`. Os caminhos antigos de CSS/JS e o incorporador continuam disponíveis com cache de cinco minutos, sem `immutable`. O HTML conserva a revalidação padrão do Pages. A capa e a passagem para apuração são executadas no navegador, não dependem de publicar um HTML no momento da eleição.

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
