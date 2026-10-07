# Banners personalizados por cliente

As dez paginas e os recursos de layout foram copiados para `personalizados/`.
Elas usam a mesma API oficial de 2026, mas possuem CSS e JavaScript proprios.
Somente o aviso informativo dos turnos compartilha dois recursos de apresentacao
com /2026/: css/aviso-turnos-2026.css e js/aviso-turnos-2026.js. Esse aviso nao
altera filtros, chamadas, resultados nem o calendario das capas.
Alteracoes futuras de layout/funcoes devem ser feitas nessas copias quando forem
exclusivas dos clientes. Correcoes importantes na versao original precisam ser
replicadas e testadas nas copias; nao existe sincronizacao automatica.

## Conferir a estrutura

Identidades incluidas na entrega com push e deploy autorizados em 6 de outubro de 2026:

- `midiamax`: Midiamax, logo PNG fornecida, azul-escuro `#032C45`
  (equivalente a `rgb(3 44 69 / 1)`) no cabecalho e nos destaques, com branco.
- `diariodolitoral`: Diario do Litoral, logo WebP fornecida, azul principal
  `#002B8E`, azul de destaque `#0093E7` e branco.
- `gazetasp`: Gazeta SP, logo WebP fornecida, somente azul `#0093E7` e branco.
  O azul substitui o antigo `#212121` no cabecalho e nos destaques.
- `diariodoestadoms`: Diario do Estado MS, logo PNG fornecida, fundo principal
  `#23252A` e cinza `#666666`. Azul pendente: `#0067B` foi informado com cinco
  digitos. A previa usa somente os tons confirmados, sem inventar um azul.
- `jd1noticias`: JD1 Noticias, logo PNG fornecida, azul-escuro `#102539`,
  azul-claro `#66B7FC` e branco.
- `pixnewsms`: Pix News MS, logo PNG fornecida sobre preto, verde-limao `#C6FF02`
  nas barras e branco; percentuais/textos pequenos em preto para contraste.
- `pulsoms`: Pulso MS, logo PNG fornecida sobre azul `#1F3761`, verde `#84C767`
  nas barras e branco; percentuais/textos pequenos em azul-escuro.
- `acritica`: A Critica, logo WebP fornecida, branco e degrade
  `linear-gradient(270deg, #004F95 0.02%, #1F7FD4 50.44%, #004F95 99.9%)`
  no cabecalho e nas barras; textos de destaque em `#004F95`.
- `agenciacidades`: Agencia Cidades, logo PNG fornecida, azul-marinho `#000F3D`;
  azul complementar `#245CB8` nas barras e superfices claras.
- `capitaldopantanal`: Capital do Pantanal, logo PNG fornecida e degrade
  `linear-gradient(to right,#cb1225,#9e1a27,#740e18)` no cabecalho e nas barras.

Todas possuem os dez formatos. Para conferir no servidor local, usar
`/personalizados/1260x200.html?site=acritica` (ou outra chave acima), ou
`/testar-embed.html?site=acritica&formato=1260x200&breakpoint=1050`.
Os dominios desses portais ainda precisam ser informados e autorizados;
o cadastro da identidade nao libera acesso nem publica os banners.

`primeira-pagina` tem uma identidade publicada com a logo WebP
fornecida e o degrade `linear-gradient(90deg, #9c27b0 -30%, #ff5722 130%)`
no cabecalho e nas barras. Os textos pequenos usam roxo escuro para contraste.
A identidade foi publicada; o dominio do portal ainda nao foi autorizado.
Teste local: `/testar-embed.html?site=primeira-pagina&formato=1260x200&breakpoint=1050`.

`cliente-x` usa nome, logo, icone e cores de demonstracao.
`correio-do-estado` possui uma identidade publicada com a logo fornecida, azul
institucional `#134282`, azul de destaque `#246AB5` e azul claro `#E8F1FC`.
O dominio do Correio ainda precisa ser informado/autorizado antes da distribuicao.
Destino da entrega autorizada: Cloudflare Pages `eleicoes-front`, producao/main:
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
transicoes nem calendario de pre-eleicao. As capas originais em /2026/ foram preservadas.
A retirada da marca/"Obter widget" nao remove a fonte TSE nem os alertas de simulacao.
Nos personalizados compactos mobile de 90/100 px, logo e nome ficam na mesma
linha dos filtros, sem aumentar a altura do banner. O modo acompanha
o breakpoint real do embed. O 320x100 sempre usa essa linha compacta.
Os formatos 300x250/300x600 e os demais cabecalhos mantem o layout anterior.
Esta melhoria mobile foi publicada em 6 de outubro de 2026.

Votos/partido e os rotulos Validos, Brancos, Nulos e Abstencoes usam fontes
maiores em todas as marcas e formatos personalizados, com escala propria nos
compactos. Nos mobile de 90/100 px, cards de 180 px priorizam o percentual
de votos (12 px) na direita em vez do numero de urna; o partido fica menor
(6.5 px) abaixo do nome. Os totais absolutos ficam nos layouts maiores.
Alturas de 90/100 px, resumo, identidade, aviso e rolagem continuam iguais.
Ajuste publicado no deployment `185d5e85`.

Somente os HTMLs 300x250, 300x600 e 1260x100 usam `resumo-empilhado`:
rotulo, total de votos e percentual em tres linhas por indicador, em todas as
marcas. Os outros formatos (inclusive o index responsivo) continuam em linha.
Nos 300x250 e 300x600 a grade e 2x2: Validos/Brancos acima, Nulos/Abstencoes
abaixo. O 1260x100 conserva sua grade de desktop/mobile.
No 1260x100 mobile, o resumo tem 31 px e os cards 31 px, conservando os 100 px
do banner, a identidade, os filtros, o percentual e a rolagem dos candidatos.
O botao de mostrar/ocultar resumo permanece nos verticais. Somente enquanto o
resumo do 300x250 estiver aberto, os filtros ficam lado a lado, as margens
internas ficam compactas e a contagem de candidatos fica oculta para conservar
espaco para a lista. Ajuste publicado no deployment `185d5e85`.
No 300x250, o botao fica separado do resumo aberto por 5 px; o 300x600
mantem os 7 px anteriores. A altura externa dos banners continua igual.

Os mesmos ajustes de legibilidade/resumos agora estao tambem nos dez banners
originais de /2026/, em `css/legibilidade-2026.css`, preservando a marca Placar
das Urnas. A folha e ativada apenas na apuracao; capas, relogios e transicoes
de pre-eleicao e os historicos nao recebem essas alteracoes. O teste compara
os estilos com os personalizados e valida as quatro identidades. Publicado.

O cabecalho tambem identifica o 1º turno e informa "2º turno: 25/10" (2026),
onde houver disputa, conforme o TSE. Nos compactos, a data fica abaixo do nome
na mesma linha de altura dos filtros. Esse ajuste foi publicado e e informativo:
nao habilita consultas do segundo turno automaticamente.

Correcao incluida nesta entrega: nomes dos clientes possuem folga vertical
para nao recortar acentos/descendentes com `overflow: hidden`. Margens negativas
compensam essa folga, preservando alturas, aviso dos turnos e espaco dos cards.
O teste dos cabecalhos mede a caixa real do texto, nao apenas o elemento.

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

Trocar `site` por `primeira-pagina` ou `correio-do-estado` para ver cada marca.
No tester, escolher conteiner `Normal` e usar o modo responsivo do navegador
em 320/360/390/400 px. O cenario `Ancestral com 340 px` deixa a area de teste
a esquerda de proposito: o embed centraliza dentro desses 340 px, nao da janela.
Conferir logo/nome e filtros na mesma linha nos compactos, sem alterar a altura.

Os testes automatizados interceptam as APIs com dados ficticios, sem TSE/KV real.
Links antigos com parametros de capa sao ignorados nos personalizados.
Para abrir interativamente a apuracao, o backend local precisa estar na porta 8788.
