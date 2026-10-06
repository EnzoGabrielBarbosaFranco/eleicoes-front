# Banners personalizados por cliente

As dez paginas e os recursos de layout foram copiados para `personalizados/`.
Elas usam a mesma API oficial de 2026, mas possuem CSS e JavaScript proprios.
Alteracoes futuras de layout/funcoes devem ser feitas nessas copias quando forem
exclusivas dos clientes. Correcoes importantes na versao original precisam ser
replicadas e testadas nas copias; nao existe sincronizacao automatica.

## Conferir a estrutura

`cliente-x` usa nome, logo, icone e cores de demonstracao.
`correio-do-estado` possui uma identidade publicada com a logo fornecida, azul
institucional `#134282`, azul de destaque `#246AB5` e azul claro `#E8F1FC`.
O dominio do Correio ainda precisa ser informado/autorizado antes da distribuicao.
Publicacao autorizada no Pages `eleicoes-front`, deployment `2955eb39`:
https://apuracao.placardasurnas.com.br/personalizados/1260x200.html?site=correio-do-estado

```text
personalizados/
  clientes.js             cadastro publico de identidades
  identidade.js           seleciona e valida ?site=...
  identidade.css          acabamento exclusivo das marcas
  logos/                  logos e icones locais
  css/                    copias dos estilos dos dez formatos
  js/                     copias das funcoes dos banners
  1260x200.html            e outros nove formatos
```

Formatos: `index`, `horizontal`, `970x90`, `970x250`, `970x250x100`,
`1260x100`, `1260x200`, `320x100`, `300x250` e `300x600`.
Preservam dimensoes, filtros, carrossel e dados exclusivos de 2026.
Os personalizados exibem apenas a apuracao: nao possuem capas, contagem regressiva,
transicoes nem calendario de pre-eleicao. As versoes originais em /2026/ continuam iguais.
A retirada da marca/"Obter widget" nao remove a fonte TSE nem os alertas de simulacao.
Nos layouts compactos que ja ocultavam o cabecalho, a logo permanece oculta para
nao reduzir o espaco dos candidatos. Nos cabecalhos visiveis, aparece a logo.

## Cadastrar depois, quando houver uma marca real

1. Colocar logo e icone em `personalizados/logos/`, com nomes simples, sem espacos.
   PNG, SVG, WebP e JPEG sao aceitos. Preferir logo transparente, com boa legibilidade.
   Para atualizar uma imagem, usar um novo nome de arquivo e atualizar o cadastro;
   isso evita que caches antigos mantenham a imagem anterior.
2. Adicionar em `personalizados/clientes.js` uma chave unica, como `portal-exemplo`:

```js
'portal-exemplo': {
    nome: 'Portal Exemplo',
    logo: '/personalizados/logos/portal-exemplo-v1.png',
    icone: '/personalizados/logos/portal-exemplo-icone-v1.png',
    cores: {
        primaria: '#15243B', // fundo escuro / identidade principal
        destaque: '#D97706', // progresso e destaques
        clara: '#FDE8C8'     // superficies claras
    },
    dominios: ['portal-exemplo.com.br']
}
```

O campo `icone` e opcional; se omitido, a logo sera o icone da pagina.
As cores usam `#RRGGBB`. Conferir contraste e imagens em todos os formatos.
Em caso de falha de imagem, mostramos iniciais do cliente, nunca nossa logo.
As marcas vem do cadastro: parametros de nome/cores no URL nao sobrescrevem a identidade.

3. Autorizar o dominio real e suas variantes necessarias em `seguranca.js` e
   `frame-ancestors` de `_headers` / `vercel.json`. `dominios` no cadastro e
   informativo: nao libera acesso automaticamente. Nao usar `*` na CSP.
   O dominio do iframe continua igual, portanto o CORS do Worker nao muda.
4. Executar `node scripts/testar-pages.js` e revisar os formatos desktop e mobile.
5. Gerar uma entrega nova:

```powershell
node scripts/gerar-entrega-cliente.js portal-exemplo 1050
```

O gerador cria `entrega/clientes/portal-exemplo/` com dez codigos para sites,
dez para Ad Manager e instrucoes. Recusa sobrescrever uma entrega existente.
Ele nao publica, nao altera DNS nem libera dominios.
6. Pedir autorizacao especifica para publicar e para enviar ao Git antes de distribuir.

## Codigo para site comum

```html
<script src="https://apuracao.placardasurnas.com.br/embed.js" defer></script>
<eleicoes-widget ano="2026" formato="1260x200" breakpoint="1050" site="cliente-x"></eleicoes-widget>
```

Carregar `embed.js` uma vez por pagina. Trocar `formato` para outro tamanho.
O atributo `site` seleciona `/personalizados/`; sem ele, o embed existente continua
usando `/2026/` normalmente. Com `site`, o ano e sempre 2026.
O breakpoint continua responsivo; os formatos fixos continuam fixos.

## URL direta e Ad Manager

```text
https://apuracao.placardasurnas.com.br/personalizados/1260x200.html?site=cliente-x
```

```html
<iframe src="https://apuracao.placardasurnas.com.br/personalizados/1260x200.html?site=cliente-x"
  width="1260" height="200" title="Apuração das Eleições 2026" scrolling="no"
  style="position:absolute;inset:0;display:block;width:100%;height:100%;margin:0;padding:0;border:0;overflow:hidden"></iframe>
```

Ad Manager: usar criativo HTML com iframe, tamanho nativo e sem `embed.js`
no criativo. O slot/SafeFrame e controlado pelo portal, nao pelo iframe.
Para mobile, entregar tambem `320x100` e configurar size mapping no GPT/Ad Manager.
Validar no Ad Manager real antes de vender como homologado nesse ambiente.

## Limites e isolamento

- O identificador `site` e publico, nao e senha nem mecanismo de autenticacao.
  Continuam valendo as restricoes atuais de dominio; elas nao vinculam uma marca
  exclusivamente a um cliente. Se for preciso controle por contrato, implementar
  autorizacao adicional em outra etapa, especialmente para SafeFrames.
- Sem cliente, com cliente inexistente ou configuracao invalida, mostramos um aviso
  e nao consultamos a API. Os filtros salvos sao separados por identificador.
- Logos, cadastro e recursos sao estaticos no Pages. Cada visita ainda consulta
  dados conforme o intervalo atual; a personalizacao nao adiciona `site` a API nem
  cria novos Workers/chaves de cache. Isso nao elimina o custo das consultas existentes.
- `cliente-x` e demonstracao. O Correio do Estado tem identidade visual publicada;
  isso nao significa liberacao do dominio do cliente para incorporar os banners.
- O ano e o primeiro turno foram preservados. Preparar as consultas do segundo
  turno e uma tarefa separada; nao existe calendario de capas nos personalizados.
- Links e codigos de producao acima so ficam disponiveis depois de um deploy aprovado.

## Teste local do embed

Na mesma origem local usada para testar o projeto:

```text
/testar-embed.html?site=cliente-x&formato=1260x200&breakpoint=1050
/personalizados/1260x200.html?site=cliente-x
/personalizados/320x100.html?site=cliente-x
```

Os testes automatizados interceptam as APIs com dados ficticios, sem TSE/KV real.
Links antigos com parametros de capa sao ignorados nos personalizados.
Para abrir interativamente a apuracao, o backend local precisa estar na porta 8788.
