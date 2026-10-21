# Banners personalizados por cliente

As dez paginas e os recursos de layout foram copiados para `personalizados/`.
Elas usam a mesma API oficial de 2026, mas possuem CSS e JavaScript proprios.
O aviso/calendario dos turnos compartilha dois recursos com /2026/:
css/aviso-turnos-2026.css e js/aviso-turnos-2026.js. Na preparacao local de
20/10/2026, o calendario passa a coordenar a virada automatica para o segundo
turno; os controladores/API/layout continuam separados das capas originais.
Alteracoes futuras de layout/funcoes devem ser feitas nessas copias quando forem
exclusivas dos clientes. Correcoes importantes na versao original precisam ser
replicadas e testadas nas copias; nao existe sincronizacao automatica.

## Conferir a estrutura

Idest e Campo Grande News: push e deploy autorizados em 6 de outubro de 2026.
Destino: Git `eleicoes-front/main` e Cloudflare Pages `eleicoes-front`,
em `https://apuracao.placardasurnas.com.br`. Cadastro de identidade nao libera
dominios de clientes; backend, DNS, cache e licencas ficam fora desta entrega.

- `idest`: Idest, logo PNG original e degrade
  `linear-gradient(90deg,#0f3e63,#135b8f 42%,#0b7ac4 72%,#12a8cf)`
  no cabecalho e nas barras, com textos de destaque em azul-escuro.
- `campograndenews`: Campo Grande News, verde `#68B817`, laranja `#FE8503`
  nas barras e tons escuros nos textos para contraste. Usa a nova logo WebP
  fornecida pelo usuario, sem iniciais CGN sobrepostas. Logo quadrada de
  34x34 px, sem zoom especial; no mobile compacto segue os mesmos 20x20 px
  das outras marcas. Imagem original inteira e proporcao preservadas.

Teste local: `/personalizados/1260x200.html?site=idest` ou
`/personalizados/1260x200.html?site=campograndenews`, trocando o formato
para conferir os demais tamanhos. Nenhum dominio foi autorizado por esse cadastro.
Validacao local por cliente: `node scripts/testar-pages.js --cabecalhos idest`
e `node scripts/testar-pages.js --cabecalhos campograndenews`.
Inclui dez formatos, desktop/mobile, resumos abertos/fechados, logo original,
paleta/degrade, nomes sem recorte, alturas e embeds em ancestral estreito.

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

Ajuste incluido na publicacao autorizada em 20 de outubro de 2026: o 970x250 personalizado
exibe o resumo de votos no desktop sem clicar, como o 970x250x100. A faixa
de 22 px mostra Validos, Brancos, Nulos e Abstencoes com totais/percentuais,
mantendo os cards e os 250 px externos. O mobile conserva seu botao de
mostrar/ocultar e mostra uma grade 2x2 somente com rotulos e percentuais:
Validos/Brancos acima, Nulos/Abstencoes abaixo. Ao abrir, status e espacamentos
ficam compactos e os cards tem 56 px, para preservar os candidatos e a fonte
TSE dentro dos 250 px. Ao voltar ao desktop, os totais absolutos reaparecem.
O 970x250x100 e os originais de /2026/ nao foram alterados.
Validacao: `node scripts/testar-pages.js --resumo-970` (todas as marcas,
comparacao dos dois formatos, desktop/mobile e original 2026 preservado).
Destino autorizado: Git `eleicoes-front/main` e Cloudflare Pages `eleicoes-front`.

Os mesmos ajustes de legibilidade/resumos agora estao tambem nos dez banners
originais de /2026/, em `css/legibilidade-2026.css`, preservando a marca Placar
das Urnas. A folha e ativada apenas na apuracao; capas, relogios e transicoes
de pre-eleicao e os historicos nao recebem essas alteracoes. O teste compara
os estilos com os personalizados e valida as quatro identidades. Publicado.

O aviso publicado anteriormente identifica o 1º turno e informa "2º turno:
25/10" (2026), onde houver disputa. Nos compactos, fica abaixo do nome.
Essa versao anterior era somente informativa. A automacao descrita abaixo
integra a publicacao do frontend autorizada em 20/10/2026.

## Segundo turno automatico — preparacao local em 20/10/2026

- Desde 20/10/2026, os dez formatos de /2026/ e os dez personalizados focam
  exclusivamente no segundo turno, consultando `turno=2`. Exibem a lista
  oficial ja publicada pelo TSE: nome, numero, partido e foto, em ordem
  alfabetica e sem ranking, votos ou percentuais na apresentacao antecipada.
- Em 25/10/2026, 00:00 no horario de Brasilia, habilitam os resultados. Os
  votos/percentuais so aparecem quando chegarem dados validos do segundo
  turno com apuracao; enquanto estiverem zerados, a lista continua sem votos.
- A virada funciona em paginas ja abertas, sem reload; abas suspensas
  sincronizam ao ganhar foco/voltar a ficar visiveis. O cabecalho muda junto.
- Somente Presidente/Governador ficam disponiveis. Se um filtro salvo era
  de outro cargo, o banner passa para Presidente/BR.
- Se a lista ainda nao estiver disponivel, aparece a espera pelo segundo
  turno. Catalogo/arquivo ausente nunca faz reaparecer numeros do primeiro.
- A API da selecao do segundo turno e consultada diretamente a cada 120 s,
  sem depender do status geral (que pode anunciar somente o primeiro turno).
- Toda resposta deve corresponder a ano, turno, cargo e UF pedidos. Ao mudar
  selecao/turno, os dados visuais antigos sao limpos e consultas pendentes
  invalidadas. Contingencia conserva apenas dados da mesma selecao.
- O backend ja separa cache/snapshots por turno. Ha um ajuste local adicional
  em backend-2026/src/tse.js: catalogo com UFs explicitamente publicadas para
  Governador pode responder SEM_DISPUTA_SEGUNDO_TURNO para uma UF ausente;
  catalogo incompleto continua sendo espera. O frontend mostra uma mensagem
  clara, sem candidatos do primeiro turno. Teste puro do backend:
  `node test/testar-segundo-turno.mjs` na pasta backend-2026.
- Nenhum Worker, binding, KV, DNS, cache de producao ou dominio foi alterado
  externamente. O ajuste local do backend tambem exige publicacao autorizada.
- Os personalizados continuam sem capas de pre-eleicao; os historicos 2022
  permanecem intactos. URLs e codigos de incorporacao continuam os mesmos.

Testes locais: `node scripts/testar-calendario-turnos.js`,
`node scripts/testar-pages.js --segundo-turno` e a suite completa
`node scripts/testar-pages.js`. APIs/datas simuladas; sem consultas reais ao TSE.
O usuario confirmou o push/deploy do frontend em 20/10/2026. O backend permanece
fora desta autorizacao; sua alteracao local nao e publicada junto com o Pages.

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
- O ano continua 2026. Desde 20/10, a abertura prioriza os candidatos do segundo
  turno; os resultados desse turno sao liberados a partir de 25/10, quando o TSE
  publicar. Nao existe calendario de capas pre-eleicao nos personalizados.
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

## Consulta dos turnos nos personalizados

- A partir de 20/10, o botao **Ver 1º turno** consulta os resultados do primeiro
  turno dentro do mesmo banner. **Voltar ao 2º turno** retorna a disputa atual.
  Nos tamanhos estreitos, os botoes aparecem como `1º turno`/`2º turno` ou
  `1º`/`2º`, com descricao completa acessivel e ao passar o mouse.
- A escolha do historico permanece enquanto o banner esta aberto, inclusive na
  virada de 25/10. Reabrir o banner prioriza novamente o segundo turno.
- As requisicoes e respostas sao separadas por turno/cargo/UF. Nunca reutilizamos
  votos do primeiro turno como se fossem do segundo.
- Antes da apuracao, o aviso de 25/10 com contagem em dias substitui o resumo
  vazio. A faixa apresenta o cargo/UF selecionados e os dias restantes, sem etapas.
  Os candidatos oficiais aparecem sem votos ou ranking do segundo turno.
  Cada card pode mostrar percentual e total do **1º turno**, em bloco historico
  rotulado, somente se a resposta for finalizada e corresponder ao mesmo ano,
  cargo, UF, numero e nome do candidato. Dados ausentes ou invalidos sao omitidos.
  Ao receber resultados do segundo turno, a mesma faixa central passa a mostrar
  urnas apuradas, barra, resumo de votos e fonte/atualizacao. A moldura dos cards
  e o VS permanecem; o bloco numerico dos candidatos muda para **2º turno** e
  recebe os votos atuais, sem reaproveitar o historico. A ordem alfabetica dos
  dois candidatos permanece estavel durante as atualizacoes.
  Nos mobiles/verticais, o resumo usa 2x2 com rotulos e percentuais. Nos compactos
  de 90/100 px, as urnas tambem aparecem nessa faixa, preservando a altura total.
- Esse contexto historico faz uma consulta adicional ao endpoint ja existente
  por cargo/UF, reutilizada em memoria durante a visita quando valida. Nao cria
  Workers, bindings, armazenamento ou novas chaves de cache no backend. O retorno
  nunca alimenta o resumo ou a barra de urnas do segundo turno.
- A faixa tem movimento decorativo sutil e respeita `prefers-reduced-motion`.
  A rolagem/arraste dos candidatos continua funcionando quando houver overflow.
- Alteracoes desta interface ficam restritas a `/personalizados/`. Validar com
  `node scripts/testar-pages.js --interface-personalizada` ou, para incluir as
  checagens dos banners originais, `node scripts/testar-pages.js --segundo-turno`
  (API e relogio simulados).

## Remocao da simulacao e publicacao autorizada em 20/10/2026

A simulacao visual temporaria foi removida do JavaScript/CSS entregue. O antigo
parametro `simulacao=apuracao` nao ativa dados ficticios nem antecipa a apuracao,
inclusive em localhost. Os testes mantem fixtures somente no navegador de teste,
fora do build publicado: `node scripts/testar-pages.js --apuracao-personalizada`.

A tela de candidatos permanece enquanto nao houver votos do segundo turno.
Em 25/10, os votos validos recebidos da API habilitam a faixa de urnas/resumo
e os resultados atuais dos candidatos. A virada nao e agendada para 17h;
depende dos dados e da proxima consulta, feita a cada 120 segundos.
Resumo e barra reutilizam fontes, cores e gradientes do primeiro turno por marca.

Push e deploy do frontend autorizados explicitamente pelo usuario: Git
`eleicoes-front/main` e Cloudflare Pages `eleicoes-front`, dominio
`https://apuracao.placardasurnas.com.br`. Backend, Workers, KV, DNS, cache e
licencas preservados. Registros anteriores de alteracoes locais sao historicos.
