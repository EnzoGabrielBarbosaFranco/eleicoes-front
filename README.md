# Eleições Frontend

Frontend em HTML, CSS e JavaScript puro. Não é necessário executar `npm install`.

## Cloudflare Pages

**Correção local, ainda não publicada:** o Git atual já separa 2026 de 2022, mas o deployment Pages `a5667a72-7b47-4510-ab95-900c771948d4` ainda serve o widget anterior com demonstração histórica. O build local agora usa somente o backend de 2026 nas páginas `/2026/`, rejeita respostas históricas ou sem o ano correto e não distribui a amostra `2026/assets/dados-2022.json`. Os testes locais passaram; falta nova autorização para publicar esse build e verificar os arquivos públicos. Push no Git não faz essa publicação, pois o projeto usa Direct Upload.

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

## Incorporar os widgets em outros sites

Use o incorporador oficial. Ele cria um `iframe` dentro de Shadow DOM, portanto o CSS do site cliente não altera fontes, espaçamentos, cards ou dimensões internas do widget.

```html
<script src="https://apuracao.paineleleitoralnews.com.br/embed.js" defer></script>

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
  src="https://apuracao.paineleleitoralnews.com.br/embed.js"
  defer>
</script>

<previa-eleitoral-2026
  formato="1260x100"
  breakpoint="1050">
</previa-eleitoral-2026>
```

O atributo `breakpoint` continua aceito para compatibilidade. O breakpoint estrutural dos HTMLs é `760px`; por isso a altura externa acompanha a largura útil realmente entregue ao iframe. Entre 761 e 1050 px o desenho desktop é preservado quando há espaço, sem cortar o conteúdo. Uma coluna estreita em uma janela larga recebe automaticamente o desenho e a altura compactos. O banner observa mudanças do contêiner, desconta seu padding e não depende do CSS do portal.

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
