# Placar das Urnas — Apuração

**Entrega autorizada em 6 de outubro de 2026 — novas marcas:** dez novas identidades personalizadas, ajustes de nomes/bordas e verificações de layout, junto de Correio do Estado e Primeira Página. Destino: Git `eleicoes-front/main` e Cloudflare Pages `eleicoes-front`, em `https://apuracao.placardasurnas.com.br`. Os 108 links dos nove formatos por cliente, sem `index`, estão em [entrega/LINKS-PERSONALIZADOS.md](./entrega/LINKS-PERSONALIZADOS.md). Backend, DNS, cache e licenças não fazem parte desta entrega. O azul incompleto do Diário do Estado MS continua pendente. Os registros de deployments abaixo são históricos; o identificador desta publicação deve ser conferido no painel Pages.

**Ajustes 2026/personalizados publicados com autorização em 6 de outubro de 2026:** deployment `185d5e85-117e-4117-8cef-381dce29c413`, produção/main, source `a224e92`, em `https://apuracao.placardasurnas.com.br`. Inclui Primeira Página, marca mobile, aviso dos turnos, fontes maiores, percentuais nos compactos e resumos 2x2/separados com espaçamento do 300x250. Testes locais completos e integração pública passaram com APIs interceptadas e zero erros. Os 25 HTMLs/recursos correspondem ao build. Permanece a divergência de cache de quatro horas nas URLs sem hash; regras da zona não foram alteradas. Backend, DNS e licenças preservados. Sem novo push pelo agente. Detalhes em [CLOUDFLARE-PAGES.md](./CLOUDFLARE-PAGES.md). Registros abaixo são históricos.

**Personalizados e ajustes publicados com nova autorização em 5 de outubro de 2026:** deployment Pages `2955eb39-1be3-44c6-a4a9-096bde982f8f`, produção em `https://apuracao.placardasurnas.com.br`. Inclui as dez páginas personalizadas, identidade do Correio do Estado, resumo de votos em uma linha, fonte TSE/data/horário sem segundos e arraste nos carrosséis de 2022/2026/personalizados. Testes locais e públicos de layout/integração passaram com APIs interceptadas. Os 25 HTMLs e recursos correspondem ao build; a validação integral de cache continua falhando porque a zona impõe quatro horas aos arquivos sem hash. Domínio do Correio não foi liberado. Backend, DNS e cache não foram alterados. Registro em [CLOUDFLARE-PAGES.md](./CLOUDFLARE-PAGES.md).

**Nova marca publicada com autorização em 5 de outubro de 2026:** banners em `https://apuracao.placardasurnas.com.br` e domínio comercial `https://placardasurnas.com.br/`. Deployment Pages `73947072-91bd-4ec8-a39e-7cc8e61e7ba2`; CORS publicado nos dois Workers. Site principal com/sem `www` e portais existentes liberados na CSP e na licença. Cores, símbolo, filtros, medidas e tags foram preservados. A configuração da zona ainda aumenta o cache dos scripts sem hash de cinco minutos para quatro horas; essa divergência não foi ocultada no teste nem alterada nesta publicação. Consulte [CLOUDFLARE-PAGES.md](./CLOUDFLARE-PAGES.md). Os registros abaixo são históricos. Calendário do segundo turno exige ajuste e testes separados.

Frontend em HTML, CSS e JavaScript puro. Não é necessário executar `npm install`.

## Cloudflare Pages

**Correção do embed publicada com autorização:** deployment `281e0a3b-335d-4a03-a237-e3381ea84dc1`, em `2026-10-03T03:41:01Z` (2 de outubro em Cuiabá). Todos os dez formatos de 2026 passaram nas matrizes local e pública: 150 cenários de desktop/mobile, capas e apuração por matriz, com APIs/datas simuladas somente nos testes. O breakpoint explícito considera a largura da página; contêineres de até 760 px também recebem layout mobile. A largura é limitada à área visível da viewport e dos ancestrais, inclusive quando o pai tem 1260 px no celular. O modo é sincronizado com o iframe, sem transformar banners de 970 px em mobile no desktop somente por terem breakpoint 1050. Formatos fixos e snippets Ad Manager foram preservados. Use a página local `testar-embed.html` descrita abaixo para revisar. Registro e validação pública em [CLOUDFLARE-PAGES.md](./CLOUDFLARE-PAGES.md).

**Cinco portais liberados e publicados:** deployment `4067576a-3af7-412d-ae44-ac60c49f350c`, em `2026-10-03T02:52:27Z`, autorizado separadamente. `portaldeprefeitura.com.br`, `portalmais360.com.br`, `diariodajaragua.com.br`, `douradosnews.com.br` e `folhape.com.br`, com e sem `www`, estão autorizados na licença JS e na CSP. Testes locais e públicos de embed/iframe nas dez origens simuladas passaram; inserções reais em portal/SafeFrame continuam pendentes. Os códigos de integração permanecem iguais; Workers, DNS e cache não foram alterados. Sem commit/push pelo agente. Consulte [CLOUDFLARE-PAGES.md](./CLOUDFLARE-PAGES.md).

**Visual de espera publicado:** deployment `f36b0a5d-74e5-481f-b39e-ecc80f7d9dcd`, em `2026-10-03T02:35:50Z` (2 de outubro em Cuiabá), autorizado separadamente. Painel de espera claro e legível, relógio também no 970×90 mobile e dimensões preservadas. Testes locais e de integração pública com APIs interceptadas passaram, incluindo filtros, embed e iframe. Os arquivos públicos correspondem ao build e os TTLs JS/CSS foram conferidos. Backend, DNS e códigos dos clientes não mudaram. Permanece apenas o resíduo de cache da antiga amostra descrito abaixo; não é usado pelos widgets atuais e não foi limpo. O código continua localmente, sem commit/push pelo agente. Registro detalhado em [CLOUDFLARE-PAGES.md](./CLOUDFLARE-PAGES.md).

**Correção 2026 publicada com nova autorização:** deployment `674ed057-a2ae-4b57-a7a2-d79929123522`, em `2026-10-03T01:49:44Z` (2 de outubro em Cuiabá). As páginas `/2026/` agora usam somente o backend de 2026, rejeitam respostas históricas ou sem o ano correto e não incluem a amostra `2026/assets/dados-2022.json` no build. O domínio já referencia o novo script `/static/js-widget-2026.026006f4e38ecd68.js`, sem fallback histórico. Testes locais, integração pública com API interceptada e CORS real passaram. O inventário estático comparou as 15 páginas e recursos, mas não concluiu integralmente: a URL antiga da amostra ainda retorna um JSON retido no cache; com query inédita retorna 404. O widget novo não consulta essa URL. Limpeza desse resíduo de cache permanece pendente de autorização específica. Workers, DNS e regras de cache não foram alterados. Push no Git não publica o Pages, pois o projeto usa Direct Upload.

Em 2 de outubro de 2026, o frontend e o CORS dos dois Workers foram publicados com autorização. O domínio `https://apuracao.paineleleitoralnews.com.br` foi associado ao Pages com HTTPS ativo e CNAME exclusivo, preservando os seis registros DNS anteriores. Dados históricos da fase atual, filtros, embed e iframe foram verificados no navegador pelo domínio final. A regra de cache foi publicada pelo usuário: URLs sem hash recebem cinco minutos, e recursos com hash recebem um ano; o inventário público das 15 páginas e recursos passou sem divergências. A origem `pages.dev` não está liberada para consultas às APIs. Vercel e clientes antigos foram preservados. O teste real no SafeFrame do Ad Manager ainda está pendente. Consulte [CLOUDFLARE-PAGES.md](./CLOUDFLARE-PAGES.md) para versões, testes e retorno.

```powershell
node scripts/preparar-pages.js
node scripts/testar-pages.js
```

Publicar apenas `dist-pages/`, nunca a raiz do repositório, sempre com nova autorização. O frontend é estático; as consultas continuam nos Workers existentes. O teste local simula as APIs e não consulta o TSE nem grava no KV de produção. O projeto usa Direct Upload: push no Git não atualiza o Pages automaticamente.

## Executar localmente

Na pasta do frontend, inicie um servidor estático:

```powershell
cd C:\Users\Enzo\Projetos\eleicoes-front
py -m http.server 5500
```

Também é possível usar a extensão **Live Server** do VS Code na porta 5500. Acesse o endereço usando `127.0.0.1`, pois os backends precisam liberar exatamente essa origem no CORS:

```text
http://127.0.0.1:5500
```

## Eleições 2022

Inicie o backend de 2022 na porta 8787. As páginas da raiz usam somente esse backend e sempre enviam `ano=2022`:

- `http://127.0.0.1:5500/`
- `http://127.0.0.1:5500/300x250.html`
- `http://127.0.0.1:5500/300x600.html`
- `http://127.0.0.1:5500/horizontal.html`
- `http://127.0.0.1:5500/970x250.html`

## Eleições 2026

Inicie o backend de 2026 na porta 8788:

```powershell
cd C:\Users\Enzo\Projetos\backend-eleicoes\backend-2026
npm run dev
```

As páginas da pasta `/2026/` usam exclusivamente esse backend e sempre enviam `ano=2026`:

- `http://127.0.0.1:5500/2026/`
- `http://127.0.0.1:5500/2026/300x250.html`
- `http://127.0.0.1:5500/2026/300x600.html`
- `http://127.0.0.1:5500/2026/horizontal.html`
- `http://127.0.0.1:5500/2026/970x250.html`
- `http://127.0.0.1:5500/2026/970x90.html`
- `http://127.0.0.1:5500/2026/970x250x100.html`
- `http://127.0.0.1:5500/2026/1260x100.html`
- `http://127.0.0.1:5500/2026/1260x200.html`
- `http://127.0.0.1:5500/2026/320x100.html`

Enquanto os resultados não estiverem disponíveis, as páginas de 2026 mostram o estado de espera e consultam novamente o status a cada 120 segundos. Não existe fallback, amostra local ou consulta ao backend de 2022 dentro dessas páginas.

As respostas de status e apuração precisam informar explicitamente `ano=2026`; dados com fase `historico` também são rejeitados. Em uma falha, preservam-se apenas os últimos dados válidos de 2026, quando disponíveis. O Worker de produção está configurado para o ambiente oficial do TSE. Fixtures usadas nos testes ficam somente no navegador de teste, nunca no build entregue.

Em produção, o frontend de 2022 usa `https://backend-eleicoes.enzo-eleicoes-backend.workers.dev` e o frontend de 2026 usa `https://backend-eleicoes-2026.enzo-eleicoes-backend.workers.dev`.

## Interação dos carrosséis

Nos carrosséis de 2022, 2026 e personalizados, passar o mouse pausa a rolagem e
mostra o cursor de mão aberta. Clicar e arrastar movimenta os candidatos nos dois
sentidos, com mão fechada. Ao soltar um arraste, o automático retoma após 500 ms,
mesmo com o mouse sobre os cards; sair e entrar novamente volta a pausar.
Cliques simples e o botão “Carregar mais” permanecem funcionais. No celular,
o toque conserva a rolagem nativa, pausando enquanto o dedo está na lista.
Sem conteúdo excedente não aparece o cursor de arraste. Listas verticais mantêm
o comportamento anterior. A interação não adiciona consultas à API nem altera
os códigos de incorporação. Publicada no deployment `2955eb39` com autorização.

## Incorporar os widgets em outros sites

Use o incorporador oficial. Ele cria um `iframe` dentro de Shadow DOM, portanto o CSS do site cliente não altera fontes, espaçamentos, cards ou dimensões internas do widget.

```html
<script src="https://apuracao.placardasurnas.com.br/embed.js" defer></script>

<eleicoes-widget ano="2026" formato="300x250"></eleicoes-widget>
```

Formatos disponíveis:

- `300x250`: 300 × 250 px;
- `300x600`: 300 × 600 px;
- `970x250`: até 970 × 250 px no desktop e largura disponível × 250 px no mobile;
- `970x90`: até 970 × 90 px no desktop e largura disponível × 90 px no mobile, disponível para 2026;
- `horizontal`: até 1200 × 100 px no desktop e largura disponível × 250 px no mobile;
- `padrao`/`index`: até 1180 × 680 px no desktop e largura disponível × 250 px no mobile. A altura desktop pode ser personalizada, por exemplo `altura="760"`.

Em 2026, os formatos responsivos ocupam toda a largura disponível em telas de até 760 px e preservam a altura mobile definida para cada formato.
Nas páginas abertas diretamente, somente o banner recebe essas dimensões; a página continua ocupando toda a altura disponível e centraliza o banner na tela.

Para mostrar a demonstração de 2022, use `ano="2022"`. Se o atributo for omitido, o componente abre 2026.

Exemplo do formato horizontal:

```html
<eleicoes-widget ano="2026" formato="horizontal"></eleicoes-widget>
```

O domínio que incorpora o widget também precisa estar autorizado em `seguranca.js` e no `frame-ancestors` de `_headers` (Pages) e `vercel.json` (Vercel). O incorporador não depende de nenhuma folha de estilos do site cliente.

## Banners de 2026

O componente `previa-eleitoral-2026` centraliza os dez formatos em uma única integração. As medidas são:

- `index`: 1180 × 680 px no desktop e largura disponível × 250 px no mobile;
- `horizontal`: 1200 × 100 px no desktop e largura disponível × 250 px no mobile;
- `970x90`: 970 × 90 px no desktop e largura disponível × 90 px no mobile;
- `970x250`: 970 × 250 px no desktop e largura disponível × 250 px no mobile;
- `970x250x100`: 970 × 250 px no desktop e largura disponível × 100 px no mobile;
- `1260x100`: 1260 × 100 px no desktop e largura disponível × 100 px no mobile;
- `1260x200`: 1260 × 200 px no desktop e largura disponível × 100 px no mobile;
- `320x100`: medida fixa de 320 × 100 px em qualquer viewport, destinado exclusivamente a inserções mobile;
- `300x600`: 300 × 600 px no desktop e no mobile;
- `300x250`: 300 × 250 px no desktop e no mobile.

Para incorporar um banner, carregue o mesmo `embed.js` e use o Web Component específico:

```html
<script
  src="https://apuracao.placardasurnas.com.br/embed.js"
  defer>
</script>

<previa-eleitoral-2026
  formato="1260x100"
  breakpoint="1050">
</previa-eleitoral-2026>
```

`breakpoint="940"` determina o layout mobile quando a viewport da página é de até 940 px. Um contêiner de até 760 px também ativa o modo mobile, mesmo numa página desktop. O breakpoint e o modo escolhido são enviados ao iframe por query `breakpoint` e `embed-modo`, sincronizando CSS, JS, capa pré-eleição e altura do embed. Uma página larga com banner de 970 px continua desktop mesmo com breakpoint 1050. Sem o atributo, o padrão permanece 760 px. Formatos fixos e páginas de 2022 conservam o comportamento anterior. O embed considera o espaço visível da viewport e de todos os ancestrais, desconta padding e acompanha mudanças de tamanho; não modifica o CSS do portal. O iframe recarrega somente quando muda de modo ou de atributos, não a cada ajuste de largura; os filtros persistidos são preservados.

Os atributos opcionais `visao`, `marca`, `cor-primaria`, `cor-destaque` e `cor-clara` personalizam a integração. Os aliases `view`, `nome`, `cor1`, `cor2` e `cor3` continuam aceitos. O endereço dos HTMLs é resolvido relativamente ao próprio `embed.js`, por isso o mesmo código funciona em ambiente local, Vercel ou outro domínio de publicação.

## Google Ad Manager

Os snippets prontos ficam em `entrega/ad-manager/`. Eles usam somente um `iframe` com tamanho fixo e não carregam Web Components no código do criativo. O guia `entrega/GUIA-INTEGRACAO.md` separa a integração direta da configuração obrigatória no Ad Manager.

## Modo pré-eleição de 2026

As dez páginas de 2026 ativam automaticamente uma apresentação especial usando o horário de Brasília:

- em 3 de outubro: `1 dia para as Eleições 2026`;
- em 4 de outubro, antes das 8h: destaque para o início da votação e o período das 8h às 17h;
- a partir das 8h de 4 de outubro: a capa é removida e o widget de apuração de 2026 entra em funcionamento;
- antes da véspera e após o início da votação: funcionamento normal dos widgets de apuração.

A apresentação funciona como uma capa do próprio widget e preserva as dimensões de cada formato. O cliente mantém a mesma URL incorporada: as trocas de estado e a entrada na apuração acontecem automaticamente dentro do iframe.

Durante a apresentação especial não são carregados candidatos nem realizadas consultas à API de apuração. Para revisar os dois estados localmente sem alterar o relógio do computador:

```text
http://127.0.0.1:5500/2026/?pre-eleicao=vespera
http://127.0.0.1:5500/2026/?pre-eleicao=dia
```

Os parâmetros de pré-visualização são aceitos somente em `localhost` e `127.0.0.1`.

## Revisar o embed localmente

A página `testar-embed.html` não faz parte do build de produção. Com o servidor local na porta 5500:

```text
http://127.0.0.1:5500/testar-embed.html?pre-eleicao=vespera&breakpoint=940&cenario=pai-largo
http://127.0.0.1:5500/testar-embed.html?pre-eleicao=dia&breakpoint=940&cenario=pai-largo
```

Abra o modo responsivo do navegador e confira 320, 360, 390 e 400 px, além de 940 e 941 px. A página permite simular pai com 1260 px, ancestral estreito, flex, grid, display contents e contêiner inicialmente oculto. Os parâmetros de prévia só são encaminhados pelo embed quando tanto a página de teste quanto o iframe são locais; o embed de produção não permite forçar a capa.

## Banners por cliente

As dez versoes de 2026 tambem possuem copias isoladas em `personalizados/`.
Consulte [o guia de personalizacao e entrega](entrega/PERSONALIZADOS.md).
O exemplo `cliente-x` e demonstracao. A identidade visual do Correio do Estado
esta publicada em `site=correio-do-estado`, sem liberacao do dominio do cliente.
