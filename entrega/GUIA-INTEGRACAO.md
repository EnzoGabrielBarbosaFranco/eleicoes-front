# Integração dos banners eleitorais

Há duas integrações diferentes. Não misture os códigos de uma com a outra.

**Domínio ativo e cache validado:** `apuracao.paineleleitoralnews.com.br` está conectado ao Pages com HTTPS, e dados da fase histórica atual, filtros, embed e iframe foram verificados no navegador. Os arquivos sem hash recebem cinco minutos de cache; os versionados recebem um ano. O teste em SafeFrame real do Ad Manager ainda é necessário. Não substituir o domínio por `pages.dev`: essa origem não está autorizada nas APIs.

## 1. Portal sem Google Ad Manager

Carregue o `embed.js` deste projeto uma vez e adicione quantos componentes forem necessários. A URL das páginas é resolvida relativamente ao próprio script.

```html
<script src="https://apuracao.paineleleitoralnews.com.br/embed.js" defer></script>

<eleicoes-widget ano="2026" formato="970x250"></eleicoes-widget>
```

A tag legada `previa-eleitoral-2026` continua disponível. Prefira `eleicoes-widget`, especialmente se o portal também usa o projeto de prévias: dois scripts não podem registrar implementações diferentes da mesma tag no documento.

```html
<script src="https://apuracao.paineleleitoralnews.com.br/embed.js" defer></script>

<previa-eleitoral-2026
  formato="1260x200"
  breakpoint="1050">
</previa-eleitoral-2026>
```

O atributo `breakpoint` é preservado por compatibilidade. O HTML interno muda estruturalmente em 760 px; por isso a altura externa sempre acompanha a largura real entregue ao iframe e não força a altura mobile entre 761 e 1050 px. Isso evita cortar o conteúdo. Uma coluna estreita em uma janela larga continua recebendo o layout e a altura compactos.

Personalização aceita:

```html
<previa-eleitoral-2026
  formato="970x250"
  marca="Diário"
  cor-primaria="#07182d"
  cor-destaque="#23c98c"
  cor-clara="#9cf2cf">
</previa-eleitoral-2026>
```

Os aliases antigos `nome`, `cor1`, `cor2`, `cor3` e `view` continuam aceitos. A visualização atual é única e centrada nos candidatos; `visao`/`view` são mantidos somente para compatibilidade de URL.

Formatos de 2026: `index`/`padrao`, `horizontal`, `970x90`, `970x250`, `970x250x100`, `1260x100`, `1260x200`, `320x100`, `300x250` e `300x600`.

Em 2022 existem somente as páginas `index`, `horizontal`, `970x250`, `300x250` e `300x600`. O incorporador não cria nem solicita rotas inexistentes de 2022.

## 2. Google Ad Manager

Use apenas o conteúdo do arquivo `.txt` correspondente, dentro de um criativo personalizado de código Standard. Esses códigos contêm somente um `iframe`; não carregam `embed.js`, Web Components ou GPT.

Exemplo de produto desktop contratado em 970 × 250:

- criativo desktop: `ad-manager/970x250.txt`;
- tamanho-alvo do criativo e do inventário: 970 × 250.

Entrega mobile correspondente:

- criativo mobile: `ad-manager/mobile-320x100.txt`;
- tamanho-alvo do criativo e do inventário: 320 × 100.

O criativo desktop e o criativo mobile precisam ser cadastrados separadamente. A tag GPT do portal deve solicitar o tamanho correto em cada faixa de viewport por meio do `sizeMapping` do próprio portal. Não coloque código GPT dentro do criativo.

Os produtos 300 × 250 e 300 × 600 são formatos fixos independentes e não são substituídos por 320 × 100.

Reserve no slot exatamente a altura contratada para evitar mudança de layout. Se o portal reservar 110 px para um criativo de 100 px, a faixa restante pertence ao slot externo e precisa ser corrigida pontualmente no CSS do portal; não estique o banner.

## Checklist do Ad Manager

1. Selecione código `Standard` no criativo personalizado.
2. Cadastre o tamanho-alvo igual ao arquivo escolhido.
3. Cadastre o criativo desktop e o 320 × 100 mobile separadamente.
4. Garanta que o inventário e o `sizeMapping` da tag GPT solicitem os mesmos tamanhos.
5. Mantenha scripts permitidos dentro da página hospedada; não adicione `sandbox` ao iframe do snippet.
6. Autorize o domínio final do portal em `seguranca.js` e em `frame-ancestors` de `_headers` (Pages) e `vercel.json` (Vercel) antes da publicação. Os frames internos `*.safeframe.googlesyndication.com` estão previstos; o domínio do portal também precisa estar na lista.
7. Faça a prévia no Ad Manager e depois um teste no portal. O teste local deste projeto simula iframes aninhados, mas não substitui um SafeFrame real.

## Hospedagem

O frontend está publicado em `https://apuracao.paineleleitoralnews.com.br`, com cache validado. Os snippets locais apontam para esse endereço, mas não foram enviados aos clientes. Validar no portal/SafeFrame antes da distribuição ampla. Novas publicações e mudanças externas exigem autorização explícita, conforme `../CLOUDFLARE-PAGES.md`.

Clientes que já usam `eleicoes-front.vercel.app` precisam receber o novo endereço para sair da Vercel. O domínio `vercel.app` não pode ser transferido para Pages via DNS. Mantenha a versão antiga funcionando durante a transição.
