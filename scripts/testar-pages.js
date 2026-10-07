'use strict';

// Teste local: APIs interceptadas no navegador. Nao acessa Workers, KV ou TSE reais.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { setTimeout: esperar } = require('node:timers/promises');
const { gerar, paginas, paginasPersonalizadas, formatos2022, formatos2026 } = require('./preparar-pages');
const { gerarCodigos } = require('./gerar-entrega-cliente');
const cadastroClientes = require('../personalizados/clientes');
const novasIdentidades = {
    idest: { gradiente: 'linear-gradient(90deg, rgb(15, 62, 99), rgb(19, 91, 143) 42%, rgb(11, 122, 196) 72%, rgb(18, 168, 207))', texto: 'rgb(15, 62, 99)' },
    campograndenews: { fundo: 'rgb(104, 184, 23)', texto: 'rgb(36, 70, 11)', barra: 'rgb(254, 133, 3)', fundoLogo: 'rgb(255, 255, 255)' },
    midiamax: { fundo: 'rgb(3, 44, 69)', texto: 'rgb(3, 44, 69)', barra: 'rgb(3, 44, 69)', fundoLogo: 'rgb(255, 255, 255)' },
    diariodolitoral: { fundo: 'rgb(0, 43, 142)', texto: 'rgb(0, 43, 142)', barra: 'rgb(0, 147, 231)', fundoLogo: 'rgb(255, 255, 255)' },
    gazetasp: { fundo: 'rgb(0, 147, 231)', texto: 'rgb(0, 147, 231)', barra: 'rgb(0, 147, 231)', fundoLogo: 'rgb(255, 255, 255)' },
    diariodoestadoms: { fundo: 'rgb(35, 37, 42)', texto: 'rgb(35, 37, 42)', barra: 'rgb(102, 102, 102)', fundoLogo: 'rgb(255, 255, 255)' },
    jd1noticias: { fundo: 'rgb(16, 37, 57)', texto: 'rgb(16, 37, 57)', barra: 'rgb(102, 183, 252)', fundoLogo: 'rgb(255, 255, 255)' },
    pixnewsms: { fundo: 'rgb(0, 0, 0)', texto: 'rgb(0, 0, 0)', barra: 'rgb(198, 255, 2)', fundoLogo: 'rgb(0, 0, 0)' },
    pulsoms: { fundo: 'rgb(31, 55, 97)', texto: 'rgb(31, 55, 97)', barra: 'rgb(132, 199, 103)', fundoLogo: 'rgb(31, 55, 97)' },
    acritica: { gradiente: 'linear-gradient(270deg, rgb(0, 79, 149) 0.02%, rgb(31, 127, 212) 50.44%, rgb(0, 79, 149) 99.9%)', texto: 'rgb(0, 79, 149)' },
    agenciacidades: { fundo: 'rgb(0, 15, 61)', texto: 'rgb(0, 15, 61)' },
    capitaldopantanal: { gradiente: 'linear-gradient(to right, rgb(203, 18, 37), rgb(158, 26, 39), rgb(116, 14, 24))', texto: 'rgb(116, 14, 24)' }
};
const raiz = path.resolve(__dirname, '..');
const apenasCompactos = process.argv[2] === '--compactos';
const apenasCabecalhos = process.argv[2] === '--cabecalhos';
const clienteCabecalhos = process.argv[3];
const dominio = 'https://apuracao.placardasurnas.com.br';
const portaisClientes = ['portaldeprefeitura.com.br', 'portalmais360.com.br',
    'diariodajaragua.com.br', 'douradosnews.com.br', 'folhape.com.br'];
const tamanho = { index: [1180, 680], horizontal: [1200, 100], '970x250': [970, 250],
    '970x90': [970, 90], '970x250x100': [970, 250], '1260x100': [1260, 100],
    '1260x200': [1260, 200], '320x100': [320, 100], '300x250': [300, 250], '300x600': [300, 600] };

function validarBuild(build) {
    const ler = (arquivo) => fs.readFileSync(path.join(build.destino, arquivo), 'utf8');
    for (const site of Object.keys(novasIdentidades)) {
        const cliente = cadastroClientes[site];
        assert.deepEqual(cliente.dominios, [], `${site}: identidade nao autoriza dominios desconhecidos`);
        assert(fs.readFileSync(path.join(build.destino, cliente.logo.slice(1)))
            .equals(fs.readFileSync(path.join(raiz, cliente.logo.slice(1)))), `${site}: logo original no build`);
        const codigos = gerarCodigos(site);
        assert.equal(codigos.length,10);
        assert(codigos.every(c=>c.site.includes(`site="${site}"`) && c.url.endsWith(`?site=${site}`)
            && c.adManager.includes(c.url)), `${site}: codigos site/Ad Manager corretos`);
    }
    for (const pagina of paginas) {
        const html = ler(pagina);
        assert(html.includes(pagina.startsWith('personalizados/') ? '<title>Apuração 2026' : '<title>Placar das Urnas'),
            `${pagina}: titulo inesperado`);
        assert(!html.includes('paineleleitoralnews.com.br'), `${pagina}: dominio antigo em link publicado`);
        assert(!html.includes('vercel.app'), `${pagina}: dependencia da Vercel`);
        for (const [, url] of html.matchAll(/(?:src|href)="(\/static\/[^\"]+)"/g)) {
            assert(fs.existsSync(path.join(build.destino, url.slice(1))), `${pagina}: recurso ausente ${url}`);
        }
        const fonte = fs.readFileSync(path.join(raiz, pagina), 'utf8');
        const referencias = [...fonte.matchAll(/(?:src|href)="([^\"]+)"/g)].filter(([, url]) => !url.startsWith('https:'));
        assert.equal((html.match(/\/static\//g) || []).length, referencias.length, `${pagina}: referencias nao versionadas`);
        // Migracao nao deve alterar HTML nem ordem de execucao, somente URLs dos recursos.
        let revertido = html;
        for (const [original, versionado] of build.versionados) {
            revertido = revertido.replaceAll(`"${versionado}"`, `"${original}"`);
        }
        assert.equal(revertido, fonte.replace(/src="seguranca.js"/g, 'src="/seguranca.js"'));
    }
    for (const [original, versionado] of build.versionados) {
        assert.equal(ler(versionado.slice(1)), fs.readFileSync(path.join(raiz, original.slice(1)), 'utf8'));
    }
    for (const nome of ['functions', '_worker.js', 'node_modules', '.git', '.env', 'README.md', 'vercel.json', 'entrega', 'scripts']) {
        assert(!fs.existsSync(path.join(build.destino, nome)), `Nao publicar ${nome}`);
    }
    const headers = ler('_headers');
    assert(headers.split(/\r?\n/).every(linha => linha.length <= 2000), 'Linha de _headers excede o limite do Pages.');
    const csp = headers.match(/Content-Security-Policy: (.+)/)[1];
    assert(csp.includes('https://placardasurnas.com.br '));
    assert(csp.includes('https://www.placardasurnas.com.br '));
    assert(!csp.includes('paineleleitoralnews.com.br'));
    assert.equal(csp, JSON.parse(fs.readFileSync(path.join(raiz, 'vercel.json'), 'utf8')).headers[0].headers[0].value);
    assert(headers.includes('max-age=31536000, immutable'));
    assert(!headers.includes('X-Frame-Options'));
    assert(fs.existsSync(path.join(build.destino, '404.html')));
    assert(!fs.existsSync(path.join(build.destino, '2026/assets/dados-2022.json')));
    const widget2026 = ler('js/widget-2026.js');
    const cssClientes = ler('personalizados/identidade.css');
    const inicioLegibilidade=cssClientes.indexOf('/* Legibilidade comum');
    const espelho=cssClientes.slice(inicioLegibilidade,cssClientes.indexOf('body.cliente-indisponivel'))
        .replaceAll('body.cliente-personalizado','body.apuracao-legivel')
        .replaceAll('.cliente-mobile-compacto','.turnos-mobile-compacto');
    const css2026=ler('css/legibilidade-2026.css').split('/* Cabecalho original:')[0];
    assert.equal(css2026.slice(css2026.indexOf('body.apuracao-legivel')).replace(/\r/g,'').trim(),
        espelho.slice(espelho.indexOf('body.apuracao-legivel')).replace(/\r/g,'').trim(),
        'Mesmos ajustes de legibilidade/resumos dos personalizados, sem importar identidade de clientes');
    for(const pagina of paginas) {
        const fonte=fs.readFileSync(path.join(raiz,pagina),'utf8');
        assert.equal(fonte.includes('/css/legibilidade-2026.css'),pagina.startsWith('2026/'),
            `${pagina}: aplicar somente aos dez formatos 2026`);
    }
    const extrairArraste = fonte => fonte.slice(fonte.indexOf('    function configurarArrasteCandidatos('),
        fonte.indexOf('    function iniciar(opcoes = {}) {'));
    const arraste = extrairArraste(ler('js/widget.js'));
    assert(arraste.includes('lista.setPointerCapture'), 'Arraste deve capturar o ponteiro depois do limiar');
    assert.equal(extrairArraste(widget2026), arraste, '2022/2026 devem ter a mesma interacao de arraste');
    assert.equal(extrairArraste(ler('personalizados/js/widget-2026.js')), arraste,
        'Personalizados devem ter a mesma interacao de arraste');
    const preEleicao = ler('js/pre-eleicao-2026.js');
    assert(preEleicao.includes("configuracaoVisual.marca || 'Placar das Urnas'"));
    assert(preEleicao.includes("const LINK_ADQUIRIR = 'https://placardasurnas.com.br/';"));
    assert(!preEleicao.includes('Painel Eleitoral') && !preEleicao.includes('paineleleitoralnews.com.br'));
    assert(!ler('embed.js').includes('Painel eleitoral'));
    assert(!/2022|8787|backend-eleicoes\.enzo|dados-2022/.test(widget2026), 'Widget 2026 nao deve conter fontes historicas.');

    const scripts = new Map();
    for (const endereco of [dominio, 'https://eleicoes-front.vercel.app', 'https://teste.pages.dev']) {
        const classes = new Map();
        vm.runInNewContext(ler('embed.js'), {
            URL, HTMLElement: class {}, console,
            document: { currentScript: { src: `${endereco}/embed.js?v=1` } },
            window: { location: { href: `${endereco}/` } },
            customElements: { get: (nome) => classes.get(nome), define: (nome, classe) => classes.set(nome, classe) },
        });
        for (const [ano, formatos] of [[2022, formatos2022], [2026, formatos2026]]) {
            for (const formato of formatos) {
                const Classe = classes.get('eleicoes-widget');
                const elemento = Object.create(Classe.prototype);
                elemento.getAttribute = (nome) => ({ ano: String(ano), formato, marca: 'Portal', 'cor-primaria': '#123456' })[nome] || null;
                const url = elemento.criarEndereco();
                assert.equal(url.pathname, `/${ano === 2026 ? '2026/' : ''}${formato}.html`);
                assert.equal(url.origin, endereco);
                assert.equal(url.searchParams.get('marca'), 'Portal');
            }
        }
        scripts.set(endereco, classes);
        for (const formato of formatos2026) {
            for (const tag of ['eleicoes-widget', 'previa-eleitoral-2026']) {
                const elemento = Object.create(classes.get(tag).prototype);
                elemento.getAttribute = nome => ({ ano: '2026', formato, site: 'cliente-x' })[nome] ?? null;
                const url = elemento.criarEndereco();
                assert.equal(url.pathname, `/personalizados/${formato}.html`);
                assert.equal(url.searchParams.get('site'), 'cliente-x');
                assert.equal(url.origin, endereco);
                assert(classes.get(tag).observedAttributes.includes('site'));
            }
        }
        for (const [valor, esperado] of [['940', '940'], ['1050', '1050'], ['760', null],
            ['-1', null], ['940abc', null], ['10001', null], ['', null]]) {
            const elemento = Object.create(classes.get('eleicoes-widget').prototype);
            elemento.getAttribute = nome => ({ ano: '2026', formato: '1260x200', breakpoint: valor })[nome] || null;
            assert.equal(elemento.criarEndereco().searchParams.get('breakpoint'), esperado);
            elemento.getAttribute = nome => ({ ano: '2026', formato: '320x100', breakpoint: valor })[nome] || null;
            assert.equal(elemento.criarEndereco().searchParams.get('breakpoint'), null, 'Formato fixo nao deve herdar breakpoint.');
        }
    }
    const entrega = path.join(raiz, 'entrega', 'ad-manager');
    const snippets = fs.readdirSync(entrega).filter((nome) => nome.endsWith('.txt'));
    assert.equal(snippets.length, 10);
    for (const nome of snippets) {
        const snippet = fs.readFileSync(path.join(entrega, nome), 'utf8');
        assert(!/<(?:style|script)\b|sandbox\s*=/i.test(snippet), `${nome}: snippet inadequado`);
        const url = new URL(snippet.match(/src="([^\"]+)"/)[1]);
        assert.equal(url.origin, dominio);
        const formato = path.basename(url.pathname, '.html');
        assert(fs.existsSync(path.join(build.destino, url.pathname.slice(1))));
        assert.equal(Number(snippet.match(/\bwidth="(\d+)"/)[1]), tamanho[formato][0]);
        assert.equal(Number(snippet.match(/\bheight="(\d+)"/)[1]), tamanho[formato][1]);
    }
    const ancestrais = csp.match(/^frame-ancestors (.+);$/)[1].split(/\s+/);
    for (const host of portaisClientes) {
        assert(ancestrais.includes(`https://${host}`), `${host}: CSP ausente`);
        assert(ancestrais.includes(`https://www.${host}`), `${host}: www ausente na CSP`);
        assert(!ancestrais.includes(`https://*.${host}`), `${host}: nao liberar subdominios indiscriminadamente na CSP`);
    }
    for (const [pai, autorizado] of [[`${dominio}/teste`, true], ['https://placardasurnas.com.br/', true],
        ['https://www.placardasurnas.com.br/', true], ['https://www.paineleleitoralnews.com.br/', false],
        ['https://apuracao.paineleleitoralnews.com.br/', false],
        ['https://abc.safeframe.googlesyndication.com/safeframe/', true], ['https://nao-licenciado.example/', false],
        ...portaisClientes.flatMap(host => [[`https://${host}/`, true], [`https://www.${host}/`, true],
            [`https://${host}.nao-licenciado.example/`, false], [`https://falso-${host}/`, false]])]) {
        const documento = { referrer: pai, documentElement: { innerHTML: '<html></html>' } };
        let bloqueado = false;
        try {
            vm.runInNewContext(ler('seguranca.js'), {
                URL, document: documento,
                window: { location: {}, parent: { location: {} } },
            });
        } catch { bloqueado = true; }
        assert.equal(bloqueado, !autorizado);
    }
    assert.equal(paginasPersonalizadas.length, 10);
    for (const pagina of paginasPersonalizadas) {
        const html = ler(pagina);
        const fonte = fs.readFileSync(path.join(raiz, pagina), 'utf8');
        // Somente o novo aviso informativo e compartilhado; manter layouts,
        // API, filtros e calendario de capas isolados nos personalizados.
        const compartilhados=[...fonte.matchAll(/(?:src|href)="(\/(?:css|js)\/[^\"]+)"/g)].map(m=>m[1]);
        assert.deepEqual(compartilhados,['/css/aviso-turnos-2026.css','/js/aviso-turnos-2026.js'], `${pagina}: recurso nao isolado`);
        assert(html.indexOf('personalizados-clientes.') < html.lastIndexOf('personalizados-identidade.'), 'Cadastro deve preceder identidade');
        assert(html.lastIndexOf('personalizados-identidade.') < html.indexOf('personalizados-js-apresentacao.'), 'Identidade deve preceder a apresentacao');
        assert(!fonte.includes('pre-eleicao'), `${pagina}: nao carregar recursos de pre-eleicao`);
    }
    for (const antigo of ['personalizados/js/pre-eleicao-2026.js', 'personalizados/css/pre-eleicao-2026.css']) {
        assert(!fs.existsSync(path.join(build.destino, antigo)), 'Nao distribuir recursos antigos das capas personalizadas');
    }
    for (const pasta of ['css', 'js']) {
        for (const nome of fs.readdirSync(path.join(raiz, 'personalizados', pasta))) {
            assert(!/PreEleicao|pre26|modo-pre-eleicao/.test(ler(`personalizados/${pasta}/${nome}`)),
                `personalizados/${pasta}/${nome}: dependencia de pre-eleicao`);
        }
    }
    const codigosCliente = gerarCodigos('cliente-x');
    const codigosPrimeiraPagina = gerarCodigos('primeira-pagina');
    assert.equal(codigosPrimeiraPagina.length, 10);
    assert(codigosPrimeiraPagina.every(c => c.site.includes('site="primeira-pagina"')
        && c.url.endsWith('?site=primeira-pagina')));
    assert(fs.readFileSync(path.join(build.destino, 'personalizados/logos/primeira-pagina.webp'))
        .equals(fs.readFileSync(path.join(raiz, 'personalizados/logos/primeira-pagina.webp'))),
    'Primeira Pagina: preservar os bytes da logo fornecida');
    assert.equal(codigosCliente.length, 10);
    assert.throws(() => gerarCodigos('../cliente-x'));
    assert.throws(() => gerarCodigos('nao-cadastrado'));
    for (const codigo of codigosCliente) {
        assert(codigo.site.includes('site="cliente-x"') && codigo.site.includes('breakpoint="1050"'));
        assert(codigo.url.includes(`/personalizados/${codigo.formato}.html?site=cliente-x`));
        assert(!/<(?:style|script)\b|sandbox\s*=/i.test(codigo.adManager));
    }
    console.log('Build: 25 HTMLs, recursos isolados/versionados, embed original e personalizado, CSP, licencas e codigos de entrega: OK.');
}

async function testarNavegador(build) {
    const navegador = [process.env.ELEICOES_TEST_BROWSER, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find((arquivo) => arquivo && fs.existsSync(arquivo));
    assert(navegador, 'Chrome/Edge nao encontrado. Informe ELEICOES_TEST_BROWSER.');
    const regras = [];
    for (const linha of fs.readFileSync(path.join(build.destino, '_headers'), 'utf8').split(/\r?\n/)) {
        if (!linha.trim() || linha.trim().startsWith('#')) continue;
        if (!/^\s/.test(linha)) regras.push({ rota: linha.trim(), headers: [] });
        else {
            const [, chave, valor] = linha.match(/^\s+([^:]+):\s*(.+)$/);
            regras.at(-1).headers.push([chave, valor]);
        }
    }
    let origem;
    const servir = (req, res) => {
        const url = new URL(req.url, 'http://local');
        if (url.pathname === '/testar-embed.html') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(fs.readFileSync(path.join(raiz, 'testar-embed.html'), 'utf8'));
            return;
        }
        if (url.pathname === '/teste-embed' || url.pathname === '/teste-iframe') {
            const conteudo = url.pathname === '/teste-embed'
                ? `<script src="${origem}/embed.js"></script><eleicoes-widget ano="2026" formato="1260x200" breakpoint="1050"></eleicoes-widget>`
                : `<iframe src="${origem}/2026/320x100.html" width="320" height="100" scrolling="no" style="border:0;display:block"></iframe>`;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="data:,"></head><body style="margin:0">${conteudo}</body></html>`);
            return;
        }
        let relativo = url.pathname.slice(1);
        if (!relativo || relativo.endsWith('/')) relativo += 'index.html';
        if (url.pathname.endsWith('.html') && paginas.includes(relativo)) {
            const endereco = relativo.endsWith('index.html') ? `/${relativo.slice(0, -10)}` : `/${relativo.slice(0, -5)}`;
            res.writeHead(308, { Location: `${endereco}${url.search}` }); res.end(); return;
        }
        if (paginas.includes(`${relativo}.html`)) relativo += '.html';
        const alvo = path.resolve(build.destino, relativo);
        if (!alvo.startsWith(`${build.destino}${path.sep}`) || !fs.existsSync(alvo) || !fs.statSync(alvo).isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(fs.readFileSync(path.join(build.destino, '404.html'))); return;
        }
        const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
            '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
        res.setHeader('Content-Type', tipos[path.extname(alvo)] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        for (const regra of regras) {
            const [prefixo, sufixo] = regra.rota.split('*');
            if (sufixo === undefined ? url.pathname === prefixo : url.pathname.startsWith(prefixo) && url.pathname.endsWith(sufixo)) {
                for (const [chave, valor] of regra.headers) res.setHeader(chave, valor);
            }
        }
        res.end(fs.readFileSync(alvo));
    };
    const servidor = http.createServer(servir);
    const portal = http.createServer(servir);
    await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));
    origem = `http://127.0.0.1:${servidor.address().port}`;
    await new Promise((resolve) => portal.listen(0, '127.0.0.1', resolve));
    const origemPortal = `http://127.0.0.1:${portal.address().port}`;
    const diretorioTestes = path.join(raiz, '.pages-tests');
    fs.mkdirSync(diretorioTestes, { recursive: true });
    const perfil = fs.mkdtempSync(path.join(diretorioTestes, 'chrome-'));
    const processo = spawn(navegador, ['--headless=new', '--no-first-run', '--no-default-browser-check',
        '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${perfil}`, 'about:blank'],
        { windowsHide: true, stdio: 'ignore' });
    let socket;
    let erroProcesso;
    processo.on('error', (erro) => { erroProcesso = erro; });
    try {
        let portaArquivo;
        for (let tentativa = 0; tentativa < 150; tentativa++) {
            if (erroProcesso) throw erroProcesso;
            try {
                const texto = fs.readFileSync(path.join(perfil, 'DevToolsActivePort'), 'utf8').trim();
                if (/^\d+\r?\n\/devtools\//.test(texto)) { portaArquivo = texto; break; }
            } catch (erro) { if (!['ENOENT', 'EBUSY', 'EPERM', 'EACCES'].includes(erro.code)) throw erro; }
            await esperar(100);
        }
        assert(portaArquivo, 'Navegador nao iniciou em 15 segundos.');
        const [porta, endpoint] = portaArquivo.split(/\r?\n/);
        socket = new WebSocket(`ws://127.0.0.1:${porta}${endpoint}`);
        await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
        const pendentes = new Map();
        const erros = [];
        const chamadasApi = [];
        const rede = [];
        const respostas = [];
        let contador = 0;
        let fase = 'oficial';
        let disponivel = true;
        let cenario2026 = 'normal';
        let quantidadeCandidatos = 8;
        function enviar(method, params = {}, sessionId) {
            return new Promise((resolve, reject) => {
                const id = ++contador;
                const timer = setTimeout(() => { pendentes.delete(id); reject(new Error(`Timeout ${method}`)); }, 10000);
                pendentes.set(id, { resolve, reject, timer });
                socket.send(JSON.stringify({ id, method, params, sessionId }));
            });
        }
        socket.onmessage = ({ data }) => {
            const mensagem = JSON.parse(data);
            if (mensagem.id) {
                const pendente = pendentes.get(mensagem.id);
                if (!pendente) return;
                pendentes.delete(mensagem.id); clearTimeout(pendente.timer);
                mensagem.error ? pendente.reject(new Error(JSON.stringify(mensagem.error))) : pendente.resolve(mensagem.result);
                return;
            }
            if (mensagem.method === 'Runtime.exceptionThrown') erros.push(mensagem.params.exceptionDetails);
            if (mensagem.method === 'Network.requestWillBeSent') rede.push(mensagem.params.request.url);
            if (mensagem.method === 'Network.responseReceived') respostas.push(mensagem.params.response);
            if (mensagem.method === 'Fetch.requestPaused') {
                const { requestId, request } = mensagem.params;
                const url = new URL(request.url);
                chamadasApi.push(url.href);
                const parametros = url.searchParams;
                const ano = Number(parametros.get('ano') || 2026);
                const json = url.pathname === '/api/status-eleicao'
                    ? { ano: 2026, resultadosDisponiveis: disponivel, fase: disponivel ? fase : 'aguardando_tse' }
                    : { ano, turno: Number(parametros.get('turno') || 1), cargo: Number(parametros.get('cargo') || 1),
                        uf: parametros.get('uf') || 'br', fase: ano === 2022 ? 'historico' : fase,
                        finalizado: ano === 2022, percurso: '63,50', atualizacao: '04/10/2026 às 18:30:00', vagas: 1,
                        resumo: { validos: '119.300.788', pctValidos: '95,23', brancos: '2.300.798', pctBrancos: '1,84',
                            nulos: '3.674.249', pctNulos: '2,93', abstencoes: '33.469.244', pctAbstencoes: '21,08' },
                        totalCandidatos: quantidadeCandidatos, candidatos: Array.from({ length: quantidadeCandidatos }, (_, i) => ({ nome: `Candidato Teste ${i + 1}`,
                            numero: String(10 + i), partido: 'TESTE', votos: String(40 - i), votosNumero: 400 - i,
                            total: String(400 - i), situacao: 'Não eleito', eleito: false, foto: '' })) };
                if (ano === 2026) {
                    if (cenario2026 === 'finalizado') { json.finalizado = true; json.percurso = '100,00'; }
                    if (cenario2026 === 'sem-horario') json.atualizacao = null;
                    if (cenario2026 === 'tipografia' && Array.isArray(json.candidatos)) {
                        json.candidatos.forEach(c => { c.total='53.879.538';c.votosNumero=53879538;c.partido='PSDB';c.situacao='2º turno'; });
                    }
                    if (cenario2026 === 'compactos' && Array.isArray(json.candidatos)) {
                        json.candidatos.forEach((c,i)=>{c.votos=['45.16','0.01','100.00','10.05'][i%4];c.partido='REPUBLICANOS';});
                    }
                    if (cenario2026 === 'ano-2022') json.ano = 2022;
                    if (cenario2026 === 'sem-ano') delete json.ano;
                    if (cenario2026 === 'historico') json.fase = 'historico';
                    if (cenario2026 === 'sem-votos' && Array.isArray(json.candidatos)) {
                        json.percurso = '0,00';
                        Object.keys(json.resumo).forEach((campo) => { json.resumo[campo] = campo.startsWith('pct') ? '0,00' : '0'; });
                        json.candidatos.forEach((c) => { c.votos = '0,00'; c.votosNumero = 0; c.total = '0'; });
                    }
                    if (cenario2026 === 'ano-2022' && Array.isArray(json.candidatos)) {
                        json.candidatos.forEach((c) => { c.nome = 'Candidato Historico Indevido'; });
                    }
                }
                enviar('Fetch.fulfillRequest', { requestId, responseCode: ano === 2026 && cenario2026 === 'erro-http' ? 503 : 200,
                    responseHeaders: [{ name: 'Content-Type', value: 'application/json' },
                        { name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Cache-Control', value: 'no-store' }],
                    body: Buffer.from(JSON.stringify(json)).toString('base64') }, mensagem.sessionId)
                    .catch((erro) => erros.push({ text: erro.message }));
            }
        };
        const { targetId } = await enviar('Target.createTarget', { url: 'about:blank' });
        const { sessionId } = await enviar('Target.attachToTarget', { targetId, flatten: true });
        await enviar('Runtime.enable', {}, sessionId);
        await enviar('Network.enable', {}, sessionId);
        await enviar('Page.enable', {}, sessionId);
        // Interceptar inclusive origens de producao para impedir acessos reais acidentais.
        await enviar('Fetch.enable', { patterns: [
            { urlPattern: 'http://127.0.0.1:8787/*' }, { urlPattern: 'http://127.0.0.1:8788/*' },
            { urlPattern: 'https://*.workers.dev/*' },
        ] }, sessionId);
        await enviar('Page.addScriptToEvaluateOnNewDocument', { source: `
            (() => { const Original = Date; const inicio = Original.now();
            window.__testeRelogio = { agora: Original.parse('2026-10-04T18:00:00-03:00') };
            const agora = () => window.__testeRelogio.agora + Original.now() - inicio;
            window.Date = class extends Original { constructor(...args) { super(...(args.length ? args : [agora()])); }
            static now() { return agora(); } }; })();
        ` }, sessionId);
        const avaliar = async (expression) => {
            const retorno = await enviar('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
            if (retorno.exceptionDetails) throw new Error(JSON.stringify(retorno.exceptionDetails));
            return retorno.result.value;
        };
        async function aguardar(expressao) {
            for (let i = 0; i < 150; i++) { if (await avaliar(expressao)) return; await esperar(50); }
            const estado = await avaliar("({url:location.href, titulo:document.title, corpo:document.body?.innerText.slice(0,500), ponteiros:window.__eventosArraste})");
            throw new Error(`Condicao nao atendida: ${expressao}\nEstado: ${JSON.stringify(estado)}\nErros: ${JSON.stringify(erros)}`);
        }
        async function navegar(pagina, largura, consulta = '') {
            await enviar('Emulation.setDeviceMetricsOverride', { width: largura, height: 800, deviceScaleFactor: 1, mobile: false }, sessionId);
            // O index atual recarrega ao cruzar o breakpoint. Deixar essa navegacao
            // terminar antes de pedir outra pagina evita uma corrida no proprio teste.
            await esperar(250);
            await avaliar("if(document.body) document.body.dataset.testeAnterior='1'");
            const url = `${origem}/${pagina}${consulta}`;
            await enviar('Page.navigate', { url }, sessionId);
            const caminho = pagina === 'testar-embed.html' ? `/${pagina}`
                : pagina.endsWith('index.html') ? `/${pagina.slice(0, -10)}` : `/${pagina.replace(/\.html$/, '')}`;
            const esperado = new URL(`${origem}${caminho}${consulta}`);
            if (esperado.searchParams.get('pre-eleicao') === 'teste') esperado.searchParams.delete('reiniciar');
            await aguardar(`location.href === ${JSON.stringify(esperado.href)} && document.body && !document.body.dataset.testeAnterior && (!!document.getElementById('select-cargo') || !!document.querySelector('.pre26-painel,.cliente-aviso,eleicoes-widget'))`);
        }
        if (!apenasCompactos) {
            let casos = 0;
            const clientesTeste = clienteCabecalhos ? [clienteCabecalhos] : Object.keys(cadastroClientes);
            const clientesEmbed = Object.keys(novasIdentidades).filter(site=>!clienteCabecalhos||site===clienteCabecalhos);
            for (const cliente of clientesTeste) {
                for (const formato of formatos2026) {
                    const compacto=['320x100','970x90','970x250x100','1260x100','1260x200'].includes(formato);
                    for (const largura of [...new Set([tamanho[formato][0], 320,
                        ...(novasIdentidades[cliente] && compacto ? [360,390,400] : [])])]) {
                        await navegar(`personalizados/${formato}.html`, largura, `?site=${cliente}`);
                        await aguardar("document.querySelectorAll('.card-cand,.candidato-card').length===8 && document.querySelector('.aviso-turnos') && document.querySelector('.cliente-logo img')?.complete");
                        const contexto = `${cliente}/${formato}/${largura}`;
                        await avaliar("new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))");
                        const identidade = await avaliar(`(() => {
                            const logo=document.querySelector('.cliente-logo img'),nome=document.querySelector('.header-copy h1,.header-copy h2');
                            const header=getComputedStyle(document.querySelector('.widget-header,.bloco-header'));
                            return {nome:nome.textContent,nomeCompleto:nome.scrollWidth<=nome.clientWidth+1,logo:logo.getAttribute('src'),imagem:logo.naturalWidth,
                                icone:document.querySelector('link[rel="icon"]').getAttribute('href'),
                                cores:['--ink','--mint-strong','--mint'].map(v=>getComputedStyle(document.body).getPropertyValue(v).trim()),
                                gradiente:header.backgroundImage,fundo:header.backgroundColor,
                                barra:getComputedStyle(document.getElementById('barra-percurso')).backgroundImage,
                                corBarra:getComputedStyle(document.getElementById('barra-percurso')).backgroundColor,
                                barras:[...document.querySelectorAll('.card-barra-fill,.barra-cand-fill')].map(e=>getComputedStyle(e).backgroundColor),
                                fundoLogo:getComputedStyle(logo.parentElement).backgroundColor,
                                selo:getComputedStyle(logo.parentElement,'::after').content,
                                ajusteLogo:getComputedStyle(logo).objectFit,
                                tamanhoLogo:{largura:getComputedStyle(logo.parentElement).width,altura:getComputedStyle(logo.parentElement).height},
                                logoCompacta:document.body.classList.contains('cliente-mobile-compacto'),
                                zoomLogo:getComputedStyle(logo).transform,
                                corNome:getComputedStyle(nome).color,
                                corAviso:getComputedStyle(document.querySelector('.aviso-turnos')).color,
                                bordaLogo:{largura:getComputedStyle(logo.parentElement).borderTopWidth,
                                    estilo:getComputedStyle(logo.parentElement).borderTopStyle,
                                    cor:getComputedStyle(logo.parentElement).borderTopColor},
                                texto:getComputedStyle(document.querySelector('.card-pct,.percentual')).color};
                        })()`);
                        const configuracao=cadastroClientes[cliente],esperado=novasIdentidades[cliente];
                        assert.equal(identidade.nome,configuracao.nome,contexto);
                        assert.equal(identidade.logo,configuracao.logo,contexto);
                        assert.equal(identidade.icone,configuracao.icone,contexto);
                        assert(identidade.imagem>0,`${contexto}: logo original carregada, sem iniciais de fallback`);
                        assert.deepEqual(identidade.cores,['primaria','destaque','clara'].map(c=>configuracao.cores[c]),contexto);
                        if (cliente==='campograndenews') {
                            assert.equal(identidade.selo,'none',`${contexto}: logo sem iniciais ou sobreposicoes`);
                            assert.equal(identidade.ajusteLogo,'contain',`${contexto}: imagem sem distorcao`);
                            const lado=identidade.logoCompacta?'20px':'34px';
                            assert.deepEqual(identidade.tamanhoLogo,{largura:lado,altura:lado},`${contexto}: logo quadrada no padrao dos demais clientes`);
                            assert.equal(identidade.zoomLogo,'none',`${contexto}: imagem inteira sem zoom especial`);
                            assert.equal(identidade.corNome,'rgb(36, 70, 11)',`${contexto}: contraste do nome sobre verde`);
                            assert.equal(identidade.corAviso,'rgb(36, 70, 11)',`${contexto}: contraste do aviso dos turnos`);
                        }
                        if (['pixnewsms','pulsoms'].includes(cliente)) {
                            assert.deepEqual(identidade.bordaLogo,{largura:'1px',estilo:'solid',cor:esperado.barra},
                                `${contexto}: borda colorida independente da borda geral zerada`);
                        } else if (!configuracao.demonstracao) {
                            assert.equal(identidade.bordaLogo.largura,'0px',`${contexto}: preservar borda zerada dos demais clientes`);
                        }
                        if (esperado) {
                            assert.equal(identidade.texto,esperado.texto,`${contexto}: contraste do percentual`);
                            if (esperado.gradiente) assert.equal(identidade.gradiente,esperado.gradiente,`${contexto}: degrade fornecido`);
                            else {assert.equal(identidade.gradiente,'none',contexto);assert.equal(identidade.fundo,esperado.fundo,contexto);}
                            if (esperado.gradiente) assert.equal(identidade.barra,esperado.gradiente,contexto);
                            if (esperado.barra) {
                                assert.equal(identidade.barra,'none',contexto);
                                assert.equal(identidade.corBarra,esperado.barra,contexto);
                                assert(identidade.barras.length>0&&identidade.barras.every(c=>c===esperado.barra),`${contexto}: cor das barras dos candidatos`);
                                assert.equal(identidade.fundoLogo,esperado.fundoLogo,`${contexto}: contraste da logo`);
                            }
                            if(compacto && largura<=400) assert(identidade.nomeCompleto,`${contexto}: nome completo no mobile`);
                        }
                        for (const aberto of [false, true]) {
                            if (aberto) {
                                const mudou = await avaliar("(() => { const b=document.querySelector('.resumo-toggle'); if(!b || !b.getBoundingClientRect().height) return false; b.click(); return true; })()");
                                if (!mudou) continue;
                            }
                            await avaliar("new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))");
                            const estado = await avaliar(`(() => {
                                const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};};
                                const dentro=(a,b)=>a.x>=b.x-1&&a.right<=b.right+1&&a.y>=b.y-1&&a.bottom<=b.bottom+1;
                                const e=document.querySelector('.aviso-turnos'),aviso=rect(e),titulo=document.querySelector('.header-copy h1,.header-copy h2'),nome=rect(titulo);
                                const range=document.createRange();range.selectNodeContents(titulo);
                                const textoNome=rect({getBoundingClientRect:()=>range.getBoundingClientRect()});
                                const copia=document.querySelector('.header-copy'),header=rect(document.querySelector('.widget-header,.bloco-header'));
                                const lista=document.getElementById('lista-candidatos'),foto=lista.querySelector('.foto-container');
                                return {compacto:document.body.classList.contains('turnos-mobile-compacto'),
                                    deslocamento:getComputedStyle(e).top,alinhamento:getComputedStyle(copia).alignItems,
                                    mesmaLinha:aviso.x>=nome.right-1&&Math.abs(aviso.y+aviso.h/2-nome.y-nome.h/2-1)<0.6,
                                    semCortes:dentro(aviso,header)&&dentro(nome,header)&&e.scrollWidth<=e.clientWidth+1,
                                    semSobreposicao:[...document.querySelectorAll('.controles select')].map(rect).filter(r=>r.w>0)
                                        .every(r=>r.x>=aviso.right||r.right<=aviso.x||r.y>=aviso.bottom||r.bottom<=aviso.y),
                                    fotoCabe:!foto||dentro(rect(foto),rect(lista)),
                                    foto:foto?rect(foto):null,lista:rect(lista),nome,aviso,header,
                                    textoNome,nomeSemRecorte:textoNome.y>=nome.y-0.1&&textoNome.bottom<=nome.bottom+0.1
                                        &&textoNome.y>=header.y-0.1&&textoNome.bottom<=header.bottom+0.1,
                                    altura:rect(document.querySelector('.widget-container,.widget-horizontal')).h};
                            })()`);
                            assert(estado.semCortes && estado.semSobreposicao, `${contexto}: aviso/nome/filtros sem cortes: ${JSON.stringify(estado)}`);
                            assert(estado.nomeSemRecorte,`${contexto}: caixa da fonte inteira, incluindo acentos e descendentes: ${JSON.stringify(estado)}`);
                            if (estado.compacto) assert.equal(estado.deslocamento,'auto',`${contexto}: preservar mobile`);
                            else {
                                assert.equal(estado.deslocamento,'1px',`${contexto}: alinhamento optico`);
                                assert.equal(estado.alinhamento,'center',contexto);
                                if (formato==='1260x200') assert(estado.mesmaLinha,`${contexto}: aviso ao lado e centralizado com o nome: ${JSON.stringify(estado)}`);
                            }
                            const fixo=['320x100','300x250','300x600'].includes(formato);
                            const alturaMobile=['1260x200','1260x100','970x250x100'].includes(formato)?100
                                :['index','horizontal'].includes(formato)?250:tamanho[formato][1];
                            assert.equal(estado.altura,largura<=760&&!fixo?alturaMobile:tamanho[formato][1],`${contexto}: altura preservada`);
                            if (aberto && ['300x250','300x600'].includes(formato)) assert(estado.fotoCabe,`${contexto}: foto inteira com resumo aberto: ${JSON.stringify(estado)}`);
                        }
                        if ((cliente==='correio-do-estado' && formato==='1260x200')
                            || (esperado && ['1260x200','300x250'].includes(formato) && [tamanho[formato][0],320].includes(largura))) {
                            const clip=await avaliar("(() => {const r=document.querySelector('.widget-horizontal,.widget-container').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()");
                            const captura=await enviar('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip},sessionId);
                            fs.writeFileSync(path.join(diretorioTestes,`cabecalho-${cliente}-${formato}-${largura}.png`),Buffer.from(captura.data,'base64'));
                        }
                        casos++;
                    }
                }
            }
            for (const cliente of clientesEmbed) {
                for (const [largura,cenario] of [[1040,'normal'],[1400,'ancestral-estreito']]) {
                    await navegar('testar-embed.html',largura,`?site=${cliente}&formato=1260x200&breakpoint=1050&cenario=${cenario}`);
                    await aguardar("document.querySelector('eleicoes-widget')?.shadowRoot?.querySelector('iframe')?.contentDocument?.querySelectorAll('.card-cand').length===8");
                    const embed=await avaliar(`(() => {const h=document.querySelector('eleicoes-widget'),d=h.shadowRoot.querySelector('iframe').contentDocument;
                        const titulo=d.querySelector('.header-copy h2'),r=titulo.getBoundingClientRect(),range=d.createRange();
                        range.selectNodeContents(titulo);const t=range.getBoundingClientRect(),c=d.querySelector('.bloco-header').getBoundingClientRect();
                        return {cliente:d.body.dataset.cliente,nome:d.querySelector('.header-copy h2').textContent,
                            logo:d.querySelector('.cliente-logo img').getAttribute('src'),altura:h.getBoundingClientRect().height,
                            nomeSemRecorte:t.y>=r.y-0.1&&t.bottom<=r.bottom+0.1&&t.y>=c.y-0.1&&t.bottom<=c.bottom+0.1,
                            mobile:d.body.classList.contains('cliente-mobile-compacto')};})()`);
                    assert.deepEqual(embed,{cliente,nome:cadastroClientes[cliente].nome,logo:cadastroClientes[cliente].logo,altura:100,nomeSemRecorte:true,mobile:true},`${cliente}: embed ${cenario}`);
                }
            }
            assert(chamadasApi.every(url=>new URL(url).searchParams.get('ano')==='2026'&&!new URL(url).searchParams.has('site')),
                'Marca nao pode alterar o ano ou vazar site para a API');
            assert.equal(erros.length,0,JSON.stringify(erros));
            console.log(`Identidades/cabecalhos personalizados: ${casos} cenarios desktop/mobile, ${clientesTeste.length} marcas, logos/cores/percentuais, alinhamento, alturas e resumos preservados; ${clientesEmbed.length*2} embeds com breakpoint/ancestral estreito: OK.`);
            if (apenasCabecalhos) {
                await enviar('Browser.close');
                return;
            }
        }
        // O resumo alto do 1260x100 nao pode cortar a espera na area restante.
        disponivel=false;
        await navegar('2026/1260x100.html',320);
        await aguardar("document.querySelector('.estado-aguardando .estado-descricao')");
        assert(await avaliar(`(() => {
            const e=document.querySelector('.estado-aguardando'),r=e.getBoundingClientRect();
            const l=document.getElementById('lista-candidatos').getBoundingClientRect();
            return r.y>=l.y&&r.bottom<=l.bottom&&[...e.querySelectorAll('strong,.estado-descricao')]
                .every(t=>parseFloat(getComputedStyle(t).fontSize)>=9&&t.getBoundingClientRect().bottom<=r.bottom);
        })()`),'1260x100 mobile: espera inteira e legivel junto ao resumo empilhado');
        disponivel=true;
        // Apenas os tres HTMLs solicitados empilham rotulo, total e percentual.
        // Conferir todas as marcas, modos mobile/desktop e os outros sete formatos.
        cenario2026='normal';
        for (const cliente of ['','cliente-x','correio-do-estado','primeira-pagina']) {
            for(const formato of formatos2026) {
                const empilhado=['300x250','300x600','1260x100'].includes(formato);
                const larguras=[...new Set([tamanho[formato][0],320,...(empilhado?[360,390,400]:[])])];
                for(const largura of larguras) {
                    await navegar(`${cliente?'personalizados':'2026'}/${formato}.html`,largura,cliente?`?site=${cliente}`:'');
                    await aguardar("document.querySelectorAll('.card-cand,.candidato-card').length===8");
                    const contexto=`resumo ${cliente||'2026'}/${formato}/${largura}`;
                    const fechado=await avaliar("document.querySelector('.resumo-votos').getBoundingClientRect().height===0");
                    if(fechado) await avaliar("document.querySelector('.resumo-toggle').click()");
                    await avaliar("new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))");
                    await avaliar("document.getElementById('lista-candidatos').scrollTop=0");
                    const estado=await avaliar(`(() => {
                        const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};};
                        const dentro=(a,b)=>a.x>=b.x-0.5&&a.right<=b.right+0.5&&a.y>=b.y-0.5&&a.bottom<=b.bottom+0.5;
                        const resumo=document.querySelector('.resumo-votos'),r=rect(resumo);
                        return {empilhado:document.body.classList.contains('resumo-empilhado'),
                            espacoBotaoResumo:document.querySelector('.resumo-toggle')
                                ?r.y-rect(document.querySelector('.resumo-toggle')).bottom:null,
                            h:rect(document.querySelector('.widget-horizontal,.widget-container')).h,
                            fotoVisivel:(() => {
                                const lista=document.getElementById('lista-candidatos'),foto=lista.querySelector('.foto-container');
                                const a=rect(foto),b=rect(lista);return {cabe:a.y>=b.y-0.5&&a.bottom<=b.bottom+0.5,foto:a,lista:b};
                            })(),
                            indicadores:[...resumo.querySelectorAll('.resumo-item')].map(e=>{
                                const label=e.firstElementChild,v=e.querySelector('.resumo-valor'),a=rect(label),b=rect(v);
                                const range=document.createRange();range.selectNodeContents(v);
                                const linhas=[...range.getClientRects()].filter(t=>t.width>0&&t.height>0);
                                return {texto:v.innerText,direcao:getComputedStyle(e).flexDirection,
                                    area:rect(e),label:a,valor:b,resumo:r,caixasTexto:linhas.map(t=>({x:t.x,y:t.y,right:t.right,bottom:t.bottom,w:t.width,h:t.height})),
                                    linhas:[...new Set(linhas.map(t=>Math.round(t.y)))].length,
                                    labelAcima:a.bottom<=b.y,
                                    cabe:dentro(rect(e),r)&&dentro(a,rect(e))&&dentro(b,rect(e))&&linhas.every(t=>dentro(t,rect(e)))
                                        &&v.scrollWidth<=v.clientWidth+1&&label.scrollWidth<=label.clientWidth+1};
                            })};
                    })()`);
                    assert.equal(estado.empilhado,empilhado,`${contexto}: somente os tres HTMLs`);
                    assert.equal(estado.indicadores.length,4,contexto);
                    if(empilhado) {
                        assert.equal(estado.h,tamanho[formato][1],`${contexto}: preservar altura externa`);
                        assert(estado.fotoVisivel.cabe,`${contexto}: candidatos continuam visiveis com o resumo aberto: ${JSON.stringify(estado.fotoVisivel)}`);
                        if(['300x250','300x600'].includes(formato)) {
                            assert.equal(estado.espacoBotaoResumo,formato==='300x250'?5:7,`${contexto}: espaco entre botao e resumo`);
                            const [a,b,c,d]=estado.indicadores.map(i=>i.area);
                            assert(Math.abs(a.y-b.y)<1&&Math.abs(c.y-d.y)<1&&c.y>=a.bottom-1&&d.y>=b.bottom-1
                                &&Math.abs(a.x-c.x)<1&&Math.abs(b.x-d.x)<1&&b.x>=a.right-1,
                                `${contexto}: grade de duas linhas e duas colunas`);
                        }
                        for(const indicador of estado.indicadores) {
                            assert.equal(indicador.direcao,'column',contexto);
                            assert.equal(indicador.linhas,2,`${contexto}: total e percentual separados`);
                            assert(indicador.labelAcima&&indicador.cabe,`${contexto}: tres linhas completas sem cortes: ${JSON.stringify(indicador)}`);
                        }
                        assert.equal(estado.indicadores[0].texto,'119.300.788\n(95,23%)',`${contexto}: mostrar total tambem no mobile`);
                        if(largura===tamanho[formato][0]||largura===320) {
                            const clip=await avaliar("(() => {const r=document.querySelector('.widget-horizontal,.widget-container').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()");
                            const captura=await enviar('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip},sessionId);
                            fs.writeFileSync(path.join(diretorioTestes,`resumo-${cliente||'2026'}-${formato}-${largura}.png`),Buffer.from(captura.data,'base64'));
                        }
                    } else {
                        estado.indicadores.forEach(i=>{
                            assert.equal(i.direcao,'row',`${contexto}: manter resumo em linha`);
                            assert(!i.texto.includes('\n'),`${contexto}: nao alterar outros formatos`);
                        });
                    }
                    if(fechado) {
                        await avaliar("document.querySelector('.resumo-toggle').click()");
                        assert(await avaliar("document.querySelector('.resumo-votos').getBoundingClientRect().height===0"),`${contexto}: ocultar resumo preservado`);
                    }
                }
            }
        }
        console.log('Resumos 2026 e personalizados: 300x250/300x600 em grade 2x2; somente estes e 1260x100 com dados em tres linhas; quatro indicadores completos, totais mobile, alturas, espaco do botao e mostrar/ocultar preservados; outros sete formatos em linha: OK.');
        cenario2026='compactos';
        for (const cliente of ['','cliente-x','correio-do-estado','primeira-pagina']) {
            for(const formato of ['320x100','970x90','970x250x100','1260x100','1260x200']) {
                for(const largura of [320,360,390,400]) {
                    await navegar(`${cliente?'personalizados':'2026'}/${formato}.html`,largura,cliente?`?site=${cliente}`:'');
                    await aguardar("document.querySelectorAll('.card-cand').length===8");
                    const estado=await avaliar(`(() => {
                        const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};};
                        const dentro=(a,b)=>a.x>=b.x&&a.right<=b.right&&a.y>=b.y&&a.bottom<=b.bottom;
                        return {altura:rect(document.querySelector('.widget-horizontal')).h,
                            marca:rect(document.querySelector('.brand-mark')).w>0,
                            aviso:rect(document.querySelector('.aviso-turnos')).w>0,
                            cards:[...document.querySelectorAll('.card-cand')].map(c=>{
                                const pct=c.querySelector('.card-pct'),partido=c.querySelector('.card-partido-compacto'),nome=c.querySelector('.card-nome');
                                const p=rect(pct),n=rect(nome),r=rect(c),s=rect(partido);
                                return {texto:pct.textContent,fPct:parseFloat(getComputedStyle(pct).fontSize),fPartido:parseFloat(getComputedStyle(partido).fontSize),
                                    altura:r.h,pctCabe:p.w>0&&p.h>0&&dentro(p,r)&&pct.scrollWidth<=pct.clientWidth+1,
                                    partidoCabe:s.w>0&&s.h>0&&dentro(s,r)&&partido.scrollWidth<=partido.clientWidth+1,
                                    separados:p.x>=n.right&&p.x>=s.right,
                                    urnaOculta:rect(c.querySelector('.card-numero-compacto')).w===0,
                                    totalOculto:rect(c.querySelector('.card-votos')).w===0};
                            })};
                    })()`);
                    const contexto=`percentuais ${cliente||'2026'}/${formato}/${largura}`;
                    assert.equal(estado.altura,formato==='970x90'?90:100,contexto);
                    assert(estado.marca&&estado.aviso,`${contexto}: manter marca e calendario`);
                    estado.cards.forEach((c,i)=>{
                        assert.equal(c.texto,['45,16%','0,01%','100,00%','10,05%'][i%4],contexto);
                        assert.equal(c.fPct,12,contexto);assert.equal(c.fPartido,6.5,contexto);
                        assert.equal(c.altura,formato==='970x90'?34:formato==='1260x100'?31:41,contexto);
                        assert(c.pctCabe&&c.partidoCabe&&c.separados&&c.urnaOculta&&c.totalOculto,`${contexto}: percentual e partido sem cortes: ${JSON.stringify(c)}`);
                    });
                    if(largura===320) {
                        const a=await avaliar("(() => {const r=document.querySelector('.widget-horizontal').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()");
                        const captura=await enviar('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:a},sessionId);
                        fs.writeFileSync(path.join(diretorioTestes,`percentuais-${cliente||'2026'}-${formato}.png`),Buffer.from(captura.data,'base64'));
                        const mouseCompacto=(type,x,y,button='none',buttons=0)=>enviar('Input.dispatchMouseEvent',{type,x,y,button,buttons,clickCount:button==='left'?1:0},sessionId);
                        await mouseCompacto('mouseMoved',319,790);
                        await avaliar("window.__testeRelogio.agora+=3000");
                        await aguardar("document.getElementById('lista-candidatos').scrollLeft>5");
                        const ponto=await avaliar("(() => {const e=document.getElementById('lista-candidatos'),r=e.getBoundingClientRect();e.scrollLeft=50;return {x:r.x+90,y:r.y+r.height/2};})()");
                        await mouseCompacto('mouseMoved',ponto.x,ponto.y);
                        const parado=await avaliar("document.getElementById('lista-candidatos').scrollLeft");
                        await avaliar("window.__testeRelogio.agora+=3000");await esperar(100);
                        assert.equal(await avaliar("document.getElementById('lista-candidatos').scrollLeft"),parado,`${contexto}: hover pausa`);
                        await mouseCompacto('mousePressed',ponto.x,ponto.y,'left',1);
                        await mouseCompacto('mouseMoved',ponto.x-45,ponto.y,'left',1);
                        await mouseCompacto('mouseReleased',ponto.x-45,ponto.y,'left',0);
                        const arrastado=await avaliar("document.getElementById('lista-candidatos').scrollLeft");
                        assert(arrastado>parado+30,`${contexto}: arraste preservado`);
                        await avaliar("window.__testeRelogio.agora+=1000");
                        await aguardar(`document.getElementById('lista-candidatos').scrollLeft>${arrastado+5}`);
                        await mouseCompacto('mouseMoved',319,790);
                    }
                }
            }
        }
        cenario2026='normal';
        assert.equal(erros.length,0,JSON.stringify(erros));
        console.log('Compactos 2026 e personalizados: quatro identidades/cinco formatos/quatro larguras; percentuais 0,01% a 100,00% destacados, partido menor sem cortes, marca/calendario/alturas/hover/arraste/retomada preservados: OK.');
        if(apenasCompactos) {await enviar('Browser.close');return;}

        cenario2026='tipografia';
        for (const cliente of ['','cliente-x','correio-do-estado','primeira-pagina']) {
            for (const formato of formatos2026) {
                for(const viewport of [...new Set([tamanho[formato][0],320])]) {
                    await navegar(`${cliente?'personalizados':'2026'}/${formato}.html`,viewport,cliente?`?site=${cliente}`:'');
                    await aguardar("document.querySelectorAll('.card-cand,.candidato-card').length>0");
                    await avaliar("if(!document.querySelector('.resumo-votos').getBoundingClientRect().height) window.toggleResumo()");
                    await esperar(100);
                    const tipografia=await avaliar(`(() => {
                        const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};};
                        const card=document.querySelector('.card-cand,.candidato-card');
                        const alvos=()=>[...document.querySelector('.card-cand,.candidato-card').querySelectorAll('.card-votos,.votos-absolutos,.numero-cand,.card-partido-compacto')]
                            .filter(e=>rect(e).w>0&&rect(e).h>0).concat([...document.querySelectorAll('.resumo-item > span:first-child')]);
                        const medir=()=>alvos().map(e=>({texto:e.textContent,fonte:parseFloat(getComputedStyle(e).fontSize),r:rect(e),
                            tipo:e.closest('.resumo-item')?'rotulo':e.matches('.numero-cand,.card-partido-compacto')?'partido':'votos'}));
                        const novos=medir();
                        const resumo=document.querySelector('.resumo-votos');
                        const dentro=(a,b)=>a.x>=b.x-1&&a.right<=b.right+1&&a.y>=b.y-1&&a.bottom<=b.bottom+1;
                        const labels=[...document.querySelectorAll('.resumo-item > span:first-child')].filter(e=>rect(e).w>0&&rect(e).h>0);
                        const textos=[...card.querySelectorAll('.card-votos,.votos-absolutos,.numero-cand,.card-partido-compacto')]
                            .filter(e=>rect(e).w>0&&rect(e).h>0);
                        const votos=card.querySelector('.card-votos');
                        const badge=card.querySelector(':scope > .eleito-badge');
                        let semSobreposicao=true;
                        if(votos&&badge&&rect(votos).w>0&&rect(badge).w>0){
                            const range=document.createRange();range.selectNodeContents(votos);
                            const a=range.getBoundingClientRect(),b=badge.getBoundingClientRect();
                            semSobreposicao=a.right<=b.x||a.x>=b.right||a.bottom<=b.y||a.y>=b.bottom;
                        }
                        return {novos,compacto:document.body.matches('.cliente-mobile-compacto,.turnos-mobile-compacto'),widget:document.body.dataset.widget,
                            card:rect(card),labelsCabem:labels.every(e=>rect(e).h>0&&rect(e).y>=rect(resumo).y&&rect(e).bottom<=rect(resumo).bottom),
                            textosCabem:textos.every(e=>dentro(rect(e),rect(card))),semSobreposicao,
                            linhaVotosCompleta:!votos||rect(votos).w===0||votos.scrollWidth<=votos.clientWidth+1,
                            overflow:document.documentElement.scrollWidth>innerWidth,
                            painel:rect(document.querySelector('.widget-container,.widget-horizontal'))};
                    })()`);
                    const contexto=`tipografia ${cliente||'2026'}/${formato}/${viewport}`;
                    assert(tipografia.novos.length>=5,`${contexto}: rotulos e dados do candidato devem permanecer presentes`);
                    const fontes=tipografia.compacto?{votos:9,partido:6.5,rotulo:8}
                        :tipografia.widget==='300x250'?{votos:11,partido:11,rotulo:9.5}
                        :tipografia.widget==='300x600'?{votos:12,partido:12,rotulo:10}
                        :['horizontal','970x250'].includes(tipografia.widget)?{votos:11,partido:11,rotulo:11}
                        :{votos:14,partido:13,rotulo:12};
                    tipografia.novos.forEach(e=>assert.equal(e.fonte,fontes[e.tipo],`${contexto}: aplicar fonte maior em ${e.texto}`));
                    assert(tipografia.labelsCabem&&tipografia.textosCabem&&tipografia.semSobreposicao&&tipografia.linhaVotosCompleta&&!tipografia.overflow,
                        `${contexto}: sem cortes verticais/sobreposicao/overflow da pagina: ${JSON.stringify(tipografia)}`);
                    const fixo=['320x100','300x250','300x600'].includes(formato);
                    const alturaMobile=['1260x200','1260x100','970x250x100'].includes(formato)?100
                        :['index','horizontal'].includes(formato)?250:tamanho[formato][1];
                    assert.equal(tipografia.painel.h,viewport===320&&!fixo?alturaMobile:tamanho[formato][1]);
                    if (['','primeira-pagina'].includes(cliente)&&['1260x200','970x90','300x250','320x100'].includes(formato)) {
                        const p=tipografia.painel;
                        const captura=await enviar('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:p.x,y:p.y,width:p.w,height:p.h,scale:1}},sessionId);
                        fs.writeFileSync(path.join(diretorioTestes,`tipografia-${cliente||'2026'}-${formato}-${viewport}.png`),Buffer.from(captura.data,'base64'));
                    }
                }
            }
        }
        cenario2026='normal';
        console.log('Tipografia 2026 e personalizados: quatro marcas/dez formatos desktop/mobile; fontes ampliadas verificadas, totais com oito digitos e PSDB, resumos e dimensoes, sem cortes/sobreposicao/alturas alteradas: OK.');

        // A data e apenas informativa; nenhum turno/API/calendario e trocado.
        for (const perfil of ['', 'cliente-x', 'correio-do-estado', 'primeira-pagina']) {
            for (const formato of formatos2026) {
                for (const viewport of [...new Set([tamanho[formato][0],320])]) {
                    const pagina=`${perfil?'personalizados':'2026'}/${formato}.html`;
                    await navegar(pagina,viewport,perfil?`?site=${perfil}`:'');
                    await aguardar("document.querySelectorAll('.card-cand,.candidato-card').length>0 && !!document.querySelector('.aviso-turnos')");
                    const aviso=await avaliar(`(() => {
                        const e=document.querySelector('.aviso-turnos'), b=e.getBoundingClientRect();
                        const c=document.querySelector('.widget-header,.bloco-header').getBoundingClientRect();
                        const n=document.querySelector('.header-copy h1,.header-copy h2').getBoundingClientRect();
                        const logo=document.querySelector('.brand-mark').getBoundingClientRect();
                        const copia=document.querySelector('.header-copy').getBoundingClientRect();
                        const filtros=[...document.querySelectorAll('.controles select')].map(e=>e.getBoundingClientRect()).filter(r=>r.width>0);
                        const painel=document.querySelector('.widget-container,.widget-horizontal').getBoundingClientRect();
                        return {quantidade:document.querySelectorAll('.aviso-turnos').length,texto:e.textContent,aria:e.getAttribute('aria-label'),
                            data:e.querySelector('time').dateTime,turno:document.getElementById('select-turno').value,
                            visivel:b.width>0&&b.height>0,cabe:b.x>=c.x-1&&b.right<=c.right+1&&b.y>=c.y-1&&b.bottom<=c.bottom+1,
                            nomeCabe:n.x>=c.x&&n.right<=c.right+1&&n.y>=c.y&&n.bottom<=c.bottom+1,
                            semSobreposicao:filtros.every(r=>r.x>=b.right||r.right<=b.x||r.y>=b.bottom||r.bottom<=b.y),
                            logoVisivel:logo.width>0&&logo.height>0,w:painel.width,h:painel.height,
                            dentroCopia:b.x>=copia.x-1&&b.right<=copia.right+1,
                            labelCompleta:e.scrollWidth<=e.clientWidth+1};
                    })()`);
                    const contexto=`${pagina}/${perfil}/${viewport}`;
                    assert.equal(aviso.quantidade,1, `${contexto}: aviso unico apos DOMContentLoaded`);
                    assert.equal(aviso.data,'2026-10-25');
                    assert.match(aviso.texto,/1º turno.*2º turno: 25\/10/);
                    assert.match(aviso.aria,/onde houver disputa/);
                    assert.equal(aviso.turno,'1');
                    assert(aviso.visivel&&aviso.cabe&&aviso.nomeCabe&&aviso.semSobreposicao&&aviso.logoVisivel&&aviso.labelCompleta&&aviso.dentroCopia,
                        `${contexto}: aviso/nome/logo/filtros devem caber no cabecalho: ${JSON.stringify(aviso)}`);
                    const fixo=['320x100','300x250','300x600'].includes(formato);
                    const alturaMobile=['1260x200','1260x100','970x250x100'].includes(formato)?100
                        :['index','horizontal'].includes(formato)?250:tamanho[formato][1];
                    assert.equal(aviso.h,viewport===320&&!fixo?alturaMobile:tamanho[formato][1]);
                    if (['1260x200','320x100','970x90','300x250'].includes(formato) && ['','primeira-pagina','correio-do-estado'].includes(perfil)) {
                        const clip=await avaliar("(() => {const r=document.querySelector('.widget-container,.widget-horizontal').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()");
                        const captura=await enviar('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip},sessionId);
                        fs.writeFileSync(path.join(diretorioTestes,`turnos-${perfil||'2026'}-${formato}-${viewport}.png`),Buffer.from(captura.data,'base64'));
                    }
                }
            }
        }
        for(const pagina of formatos2022.map(f=>`${f}.html`)) {
            await navegar(pagina,tamanho[path.basename(pagina,'.html')][0]);
            assert.equal(await avaliar("document.querySelectorAll('.aviso-turnos').length"),0,'Nao inserir calendario 2026 no historico');
        }
        console.log('Aviso dos turnos: vinte paginas, tres clientes/identidade original, desktop/mobile; 1o turno preservado, data 25/10 acessivel, sem cortes/sobreposicao; historico intacto: OK.');
        const formatosMarcaCompacta = ['320x100','970x90','970x250x100','1260x100','1260x200'];
        const medirMarcaMobile = `(() => {
            const r=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,w:b.width,h:b.height};};
            const header=document.querySelector('.bloco-header,.widget-header');
            const nome=document.querySelector('.header-copy h1,.header-copy h2');
            const logo=document.querySelector('.cliente-logo img');
            const controles=[...document.querySelectorAll('.controles select')].map(r).filter(b=>b.w>0);
            return {compacto:document.body.classList.contains('cliente-mobile-compacto'),
                resumoEmpilhado:document.body.classList.contains('resumo-empilhado'),header:r(header),
                nome:r(nome),nomeCompleto:nome.scrollWidth<=nome.clientWidth+1,logo:r(logo),imagem:logo.naturalWidth,
                controles,painel:r(document.querySelector('.widget-container,.widget-horizontal')),
                card:r(document.querySelector('.card-cand,.candidato-card')),
                resumo:r(document.querySelector('.resumo-votos')),
                overflow:document.documentElement.scrollWidth>innerWidth};
        })()`;
        function conferirMarcaMobile(m, altura, contexto) {
            assert(m.compacto, `${contexto}: identidade compacta deve acompanhar o modo mobile`);
            assert(m.imagem>0 && m.logo.w>0 && m.logo.h>0, `${contexto}: logo visivel e carregada`);
            assert(m.nome.w>0 && m.nome.h>0 && m.nomeCompleto, `${contexto}: nome completo visivel`);
            assert.equal(m.controles.length,2, `${contexto}: preservar cargo e UF`);
            for (const b of [m.logo,m.nome,...m.controles]) {
                assert(b.x>=m.header.x && b.right<=m.header.right+1 && b.y>=m.header.y && b.bottom<=m.header.bottom+1,
                    `${contexto}: identidade/filtros cortados: ${JSON.stringify(m)}`);
            }
            assert(m.controles.every(b=>b.x>=m.nome.right && b.w>=40 && b.h>=20), `${contexto}: filtros sem sobreposicao`);
            assert.equal(m.painel.h,altura, `${contexto}: manter altura contratada`);
            assert.equal(m.resumo.h,altura===90?20:m.resumoEmpilhado?31:21, `${contexto}: preservar resumo`);
            assert.equal(m.card.h,altura===90?34:m.resumoEmpilhado?31:41, `${contexto}: preservar altura dos cards`);
            assert.equal(m.overflow,false, `${contexto}: sem overflow horizontal`);
        }
        for (const cliente of ['cliente-x','correio-do-estado','primeira-pagina']) {
            for (const formato of formatosMarcaCompacta) {
                for (const viewport of [320,360,390,400]) {
                    await navegar(`personalizados/${formato}.html`,viewport,`?site=${cliente}`);
                    await aguardar("document.querySelectorAll('.card-cand').length>0 && document.querySelector('.cliente-logo img')?.complete");
                    conferirMarcaMobile(await avaliar(medirMarcaMobile),formato==='970x90'?90:100,`${cliente}/${formato}/${viewport}`);
                    if (viewport===320 && ['320x100','970x90'].includes(formato)) {
                        const clip=await avaliar("(() => {const r=document.querySelector('.widget-horizontal').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()");
                        const captura=await enviar('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip},sessionId);
                        fs.writeFileSync(path.join(diretorioTestes,`marca-mobile-${cliente}-${formato}.png`),Buffer.from(captura.data,'base64'));
                    }
                }
            }
            for (const formato of ['300x250','300x600']) {
                await navegar(`personalizados/${formato}.html`,320,`?site=${cliente}`);
                await aguardar("document.querySelectorAll('.candidato-card').length>0");
                const m=await avaliar(medirMarcaMobile);
                assert.equal(m.compacto,false, `${cliente}/${formato}: nao aplicar layout compacto nos verticais`);
                assert.equal(m.painel.w,300);
                assert.equal(m.painel.h,tamanho[formato][1]);
            }
        }
        await navegar('personalizados/1260x200.html',1040,'?site=primeira-pagina&breakpoint=1050');
        await aguardar("document.querySelectorAll('.card-cand').length>0");
        conferirMarcaMobile(await avaliar(medirMarcaMobile),100,'breakpoint personalizado 1050');
        for (const largura of [1100,1040]) {
            await enviar('Emulation.setDeviceMetricsOverride',{width:largura,height:800,deviceScaleFactor:1,mobile:false},sessionId);
            await aguardar(`document.body.classList.contains('cliente-mobile-compacto')===${largura<=1050}`);
            await aguardar(`document.querySelector('.widget-horizontal').getBoundingClientRect().height===${largura<=1050?100:200}`);
            if(largura<=1050) conferirMarcaMobile(await avaliar(medirMarcaMobile),100,'resize volta ao mobile');
            else assert.equal((await avaliar(medirMarcaMobile)).painel.h,200);
        }
        for (const [viewport,cenario] of [[1040,'normal'],[1400,'ancestral-estreito']]) {
            await navegar('testar-embed.html',viewport,`?site=primeira-pagina&formato=1260x200&breakpoint=1050&cenario=${cenario}`);
            await aguardar("document.querySelector('eleicoes-widget')?.shadowRoot?.querySelector('iframe')?.contentDocument?.querySelectorAll('.card-cand').length>0");
            const m=await avaliar(`(() => {const d=document.querySelector('eleicoes-widget').shadowRoot.querySelector('iframe').contentDocument;
                return (function(){const document=d,innerWidth=d.defaultView.innerWidth;return ${medirMarcaMobile};})();})()`);
            conferirMarcaMobile(m,100,`embed ${cenario}`);
        }
        console.log('Identidade mobile: tres clientes, cinco compactos, quatro larguras, breakpoint/resize e ancestral 340px; logo/nome/filtros sem cortes, alturas/cards preservados, verticais intactos: OK.');

        const gradientePrimeiraPagina = 'linear-gradient(90deg, rgb(156, 39, 176) -30%, rgb(255, 87, 34) 130%)';
        for (const formato of formatos2026) {
            for (const viewport of [...new Set([tamanho[formato][0], 320])]) {
                const antes = chamadasApi.length;
                await navegar(`personalizados/${formato}.html`, viewport, '?site=primeira-pagina');
                await aguardar("document.querySelectorAll('.card-cand,.candidato-card').length>0 && document.querySelector('.cliente-logo img')?.complete");
                const marca = await avaliar(`(() => {
                    const logo=document.querySelector('.cliente-logo'), img=logo.querySelector('img');
                    const l=logo.getBoundingClientRect(), i=img.getBoundingClientRect();
                    const cabecalho=document.querySelector('.widget-header,.bloco-header');
                    const painel=document.querySelector('.widget-container,.widget-horizontal').getBoundingClientRect();
                    return {nome:document.querySelector('.header-copy h1,.header-copy h2').textContent,
                        cliente:document.body.dataset.cliente,src:img.getAttribute('src'),imagem:img.naturalWidth,
                        cores:['--ink','--mint-strong','--mint'].map(v=>getComputedStyle(document.body).getPropertyValue(v).trim()),
                        fundoLogo:getComputedStyle(logo).backgroundColor,
                        gradiente:getComputedStyle(cabecalho).backgroundImage,
                        barra:getComputedStyle(document.getElementById('barra-percurso')).backgroundImage,
                        barras:[...document.querySelectorAll('.card-barra-fill,.barra-cand-fill')].map(e=>getComputedStyle(e).backgroundImage),
                        texto:getComputedStyle(document.querySelector('.card-pct,.percentual')).color,
                        logoVisivel:l.width>0&&l.height>0,
                        logoCabe:i.x>=l.x-1&&i.y>=l.y-1&&i.right<=l.right+1&&i.bottom<=l.bottom+1,
                        w:painel.width,h:painel.height,pre:!!document.querySelector('.pre26-painel')};
                })()`);
                assert.equal(marca.nome, 'Primeira Página');
                assert.equal(marca.cliente, 'primeira-pagina');
                assert.equal(marca.src, '/personalizados/logos/primeira-pagina.webp');
                assert(marca.imagem>0, 'Primeira Pagina: logo original deve carregar');
                assert.deepEqual(marca.cores, ['#9C27B0','#FF5722','#F9EBF4']);
                assert.equal(marca.fundoLogo, 'rgb(255, 255, 255)');
                assert.equal(marca.gradiente, gradientePrimeiraPagina, `${formato}: degrade do cabecalho`);
                assert.equal(marca.barra, gradientePrimeiraPagina, `${formato}: degrade do progresso`);
                assert(marca.barras.length>0 && marca.barras.every(b=>b===gradientePrimeiraPagina), `${formato}: degrade das barras dos candidatos`);
                assert.equal(marca.texto,'rgb(129, 33, 147)', `${formato}: texto pequeno deve usar roxo escuro`);
                if (marca.logoVisivel) assert(marca.logoCabe, `${formato}/${viewport}: logo cortada`);
                const fixo=['300x250','300x600','320x100'].includes(formato);
                const alturaMobile=['1260x200','1260x100','970x250x100'].includes(formato) ? 100
                    : ['index','horizontal'].includes(formato) ? 250 : tamanho[formato][1];
                assert.equal(marca.w,fixo ? tamanho[formato][0] : Math.min(tamanho[formato][0],viewport));
                assert.equal(marca.h,viewport===320&&!fixo ? alturaMobile : tamanho[formato][1]);
                assert.equal(marca.pre,false);
                assert(chamadasApi.length>antes);
                assert(chamadasApi.slice(antes).every(url=>new URL(url).searchParams.get('ano')==='2026'
                    && !new URL(url).searchParams.has('site')), 'Identidade nao pode alterar consultas da API');
                if (['1260x200','300x250','970x90'].includes(formato)) {
                    const r=await avaliar(`(() => {const r=document.querySelector('.widget-container,.widget-horizontal').getBoundingClientRect();
                        return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()`);
                    const captura=await enviar('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:r},sessionId);
                    fs.writeFileSync(path.join(diretorioTestes,`primeira-pagina-${formato}-${viewport}.png`),Buffer.from(captura.data,'base64'));
                }
            }
        }
        for (const viewport of [1400,360]) {
            await navegar('testar-embed.html',viewport,'?site=primeira-pagina&formato=1260x200&breakpoint=1050');
            await aguardar("document.querySelector('eleicoes-widget')?.shadowRoot?.querySelector('iframe')?.contentDocument?.querySelectorAll('.card-cand').length>0");
            const estado=await avaliar(`(() => {const host=document.querySelector('eleicoes-widget'),d=host.shadowRoot.querySelector('iframe').contentDocument;
                return {cliente:d.body.dataset.cliente,cor:getComputedStyle(d.body).getPropertyValue('--ink').trim(),altura:host.getBoundingClientRect().height};})()`);
            assert.equal(estado.cliente,'primeira-pagina');
            assert.equal(estado.cor,'#9C27B0');
            assert.equal(estado.altura,viewport===1400?200:100);
        }
        console.log('Primeira Pagina: logo WebP original, degrade exato no cabecalho/barras, dez formatos desktop/mobile e embed responsivo; marcas anteriores preservadas: OK.');

        for (const pagina of paginas.filter(p => !p.startsWith('personalizados/'))) {
            const formato = path.basename(pagina, '.html');
            const [largura] = tamanho[formato];
            for (const viewport of [largura, 360]) {
                await navegar(pagina, viewport);
                await aguardar("document.querySelectorAll('.candidato-card,.card-cand').length > 0");
                assert.equal(await avaliar("document.querySelectorAll('.controles select').length"), 3);
                const controles = await avaliar(`Array.from(document.querySelectorAll('.controles select')).map(e => {
                    const r=e.getBoundingClientRect(); return {id:e.id,w:r.width,h:r.height,x:r.x}; })`);
                // A identidade 2026 atual esconde Turno e fixa o primeiro turno; preservar esse desenho.
                assert(controles.filter((r) => !pagina.startsWith('2026/') || r.id !== 'select-turno')
                    .every((r) => r.w > 0 && r.h > 0), `${pagina}: filtro sem dimensoes`);
                if (pagina.startsWith('2026/')) {
                    assert.equal(await avaliar("document.getElementById('ultima-atualizacao').innerText"),
                        'Fonte: TSE · 04/10 · 18:30', `${pagina}/${viewport}: fonte, dia atual e horario sem segundos`);
                    const linhaAtualizacao = await avaliar(`(() => {
                        const e = document.getElementById('ultima-atualizacao');
                        const r = e.getBoundingClientRect();
                        return { visivel: r.width > 0 && r.height > 0, largura: e.clientWidth, texto: e.scrollWidth };
                    })()`);
                    if (linhaAtualizacao.visivel) assert(linhaAtualizacao.texto <= linhaAtualizacao.largura + 1,
                        `${pagina}/${viewport}: fonte e horario cortados`);
                    assert.equal(await avaliar(`(() => {
                        const aviso = document.querySelector('.aviso-fonte-dados');
                        return aviso.hidden && aviso.textContent === '' && aviso.getBoundingClientRect().height === 0
                            && !document.querySelector('.tem-aviso-dados');
                    })()`), true, `${pagina}/${viewport}: faixa oficial nao deve ocupar espaco`);
                    const resumo = await avaliar(`(() => {
                        const faixa = document.querySelector('.resumo-votos');
                        if (!faixa) return { altura: 0, itens: [] };
                        if (!faixa.getBoundingClientRect().height) document.querySelector('.resumo-toggle')?.click();
                        const r = faixa.getBoundingClientRect();
                        return { altura: r.height, itens: [...faixa.querySelectorAll('.resumo-item')].map(item => {
                            const [rotulo, valor] = item.children;
                            const a = rotulo.getBoundingClientRect(), b = valor.getBoundingClientRect();
                            const i = item.getBoundingClientRect();
                            return { y: i.y, h: i.height, centroRotulo: a.y + a.height / 2,
                                centroValor: b.y + b.height / 2, texto: valor.innerText,
                                cabe: a.x >= i.x - 1 && b.x + b.width <= i.x + i.width + 1 };
                        }) };
                    })()`);
                    if (resumo.altura > 0) {
                        if(['300x250','300x600','1260x100'].includes(formato)) {
                            assert(resumo.itens.every(i=>i.centroRotulo<i.centroValor&&i.texto.includes('\n')&&i.cabe),
                                `${pagina}/${viewport}: tres linhas no resumo sem cortes`);
                            if(formato!=='1260x100'||viewport===1260) {
                                assert(Math.abs(resumo.itens[0].y-resumo.itens[1].y)<1
                                    &&Math.abs(resumo.itens[2].y-resumo.itens[3].y)<1&&resumo.itens[2].y>resumo.itens[0].y,
                                    `${pagina}/${viewport}: resumo em grade 2x2`);
                            }
                        } else {
                            assert(resumo.itens.every(i => Math.abs(i.centroRotulo - i.centroValor) < 2 &&
                                !i.texto.includes('\n') && i.cabe),
                            `${pagina}/${viewport}: resumo empilhado ou cortado ${JSON.stringify(resumo)}`);
                            assert(resumo.itens.every(i => Math.abs(i.y - resumo.itens[0].y) < 1),
                                `${pagina}/${viewport}: as quatro categorias devem compartilhar uma linha`);
                        }
                    }
                    if (formato === '1260x200' && viewport === 1260) {
                        assert.equal(resumo.altura, 22, '1260x200: resumo deve liberar 10px para os candidatos');
                        assert.equal(await avaliar("document.querySelector('.card-cand').getBoundingClientRect().height"), 62);
                        assert.equal(await avaliar(`(() => {
                            const lista = document.getElementById('lista-candidatos').getBoundingClientRect();
                            const card = document.querySelector('.card-cand').getBoundingClientRect();
                            return card.y >= lista.y && card.bottom <= lista.bottom;
                        })()`), true, '1260x200: candidato ampliado deve caber por inteiro');
                    }
                }
            }
        }
        console.log('Navegador: 15 formatos/anos em desktop e mobile, candidatos e filtros atuais preservados: OK.');

        // Eventos reais do navegador: hover, captura do ponteiro e click apos soltar.
        const carrosseis = paginas.filter(p => ['horizontal', '970x250', '970x90',
            '970x250x100', '1260x100', '1260x200', '320x100'].includes(path.basename(p, '.html')));
        async function mouse(tipo, x, y, pressionado = false) {
            await enviar('Input.dispatchMouseEvent', { type: tipo, x, y,
                button: tipo === 'mouseMoved' && !pressionado ? 'none' : 'left', buttons: pressionado ? 1 : 0,
                ...(tipo === 'mouseMoved' ? {} : { clickCount: 1 }) }, sessionId);
        }
        const scrollAtual = () => avaliar("document.getElementById('lista-candidatos').scrollLeft");
        for (const pagina of carrosseis) {
            const formato = path.basename(pagina, '.html');
            for (const viewport of [...new Set([tamanho[formato][0], 320])]) {
                await navegar(pagina, viewport, pagina.startsWith('personalizados/') ? '?site=correio-do-estado' : '');
                await aguardar("document.querySelectorAll('.card-cand').length > 0 && document.querySelector('.arraste-disponivel')");
                await mouse('mouseMoved', viewport - 1, 790);
                await avaliar('window.__testeRelogio.agora += 3000');
                await aguardar("document.getElementById('lista-candidatos').scrollLeft > 15");
                const ponto = await avaliar(`(() => {
                    const e = document.getElementById('lista-candidatos'), r = e.getBoundingClientRect();
                    e.addEventListener('click', () => { window.__cliquesArraste = (window.__cliquesArraste || 0) + 1; });
                    window.__eventosArraste = [];
                    for (const tipo of ['pointerenter','pointerleave','pointerdown','pointermove','pointerup','gotpointercapture','lostpointercapture','pointercancel','blur']) {
                        window.addEventListener(tipo, ev => { window.__eventosArraste.push({ tipo, x:ev.clientX, buttons:ev.buttons,
                            target:ev.target.id || ev.target.tagName, scroll:e.scrollLeft, classe:e.className }); }, true);
                    }
                    return { x: (Math.max(0,r.left) + Math.min(innerWidth,r.right)) / 2, y: r.top + r.height / 2 };
                })()`);
                await mouse('mouseMoved', ponto.x, ponto.y);
                await avaliar("document.getElementById('lista-candidatos').scrollLeft = 160");
                await esperar(180);
                assert.equal(await scrollAtual(), 160, `${pagina}/${viewport}: hover deve pausar`);
                assert.equal(await avaliar("getComputedStyle(document.querySelector('.card-cand')).cursor"), 'grab');
                await mouse('mousePressed', ponto.x, ponto.y, true);
                await mouse('mouseMoved', ponto.x - 70, ponto.y, true);
                assert.equal(await avaliar("getComputedStyle(document.querySelector('.card-cand')).cursor"), 'grabbing');
                assert(Math.abs(await scrollAtual() - 230) < 2, `${pagina}/${viewport}: arraste para esquerda`);
                await mouse('mouseMoved', ponto.x + 40, ponto.y, true);
                // O navegador pode agrupar movimentos consecutivos no proximo frame.
                await aguardar("Math.abs(document.getElementById('lista-candidatos').scrollLeft - 120) < 2");
                const arrasteDireita = await scrollAtual();
                assert(Math.abs(arrasteDireita - 120) < 2, `${pagina}/${viewport}: arraste para direita (scroll=${arrasteDireita})`);
                await mouse('mouseReleased', ponto.x + 40, ponto.y);
                assert.equal(await avaliar("window.__cliquesArraste || 0"), 0, `${pagina}/${viewport}: arraste nao pode clicar`);
                assert.equal(await avaliar("getComputedStyle(document.querySelector('.card-cand')).cursor"), 'grab');
                const aoSoltar = await scrollAtual();
                await avaliar('window.__testeRelogio.agora += 1000');
                await aguardar(`document.getElementById('lista-candidatos').scrollLeft > ${aoSoltar + 5}`);
                // O mouse ainda esta sobre os cards: soltar basta para retomar.
                await mouse('mouseMoved', viewport - 1, 790);
                await mouse('mouseMoved', ponto.x, ponto.y);
                const novaPausa = await scrollAtual();
                await esperar(180);
                assert.equal(await scrollAtual(), novaPausa, `${pagina}/${viewport}: novo hover deve pausar outra vez`);

                if (formato === '970x250' && viewport === 970) {
                    // Um botao real dentro do card ainda aceita click simples e teclado.
                    const botao = await avaliar(`(() => {
                        const lista = document.getElementById('lista-candidatos'); lista.scrollLeft = 0;
                        const b = document.createElement('button'); b.type = 'button'; b.id = 'teste-click-arraste';
                        b.textContent = 'OK'; b.style.cssText = 'position:absolute;right:0;top:0;width:30px;height:20px';
                        b.onclick = () => { window.__cliquesBotao = (window.__cliquesBotao || 0) + 1; };
                        document.querySelector('.card-cand').append(b);
                        const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
                    })()`);
                    await mouse('mouseMoved', botao.x, botao.y);
                    await mouse('mousePressed', botao.x, botao.y, true);
                    await mouse('mouseReleased', botao.x, botao.y);
                    assert.equal(await avaliar('window.__cliquesBotao'), 1, `${pagina}: click simples preservado`);
                    await mouse('mousePressed', botao.x, botao.y, true);
                    await mouse('mouseMoved', botao.x - 60, botao.y, true);
                    await mouse('mouseReleased', botao.x - 60, botao.y);
                    assert.equal(await avaliar('window.__cliquesBotao'), 1, `${pagina}: arrastar botao nao aciona click`);
                    await avaliar("document.getElementById('teste-click-arraste').click()");
                    assert.equal(await avaliar('window.__cliquesBotao'), 2, `${pagina}: ativacao sem mouse preservada`);
                    // Cancelamento/perda de captura nao pode deixar o automatico preso.
                    await mouse('mousePressed', ponto.x, ponto.y, true);
                    await mouse('mouseMoved', ponto.x - 60, ponto.y, true);
                    await avaliar("document.getElementById('lista-candidatos').releasePointerCapture(1)");
                    await mouse('mouseReleased', ponto.x - 60, ponto.y);
                    assert.equal(await avaliar("!!document.querySelector('.arrastando-candidatos')"), false);
                    const cancelado = await scrollAtual();
                    await avaliar('window.__testeRelogio.agora += 1000');
                    await aguardar(`document.getElementById('lista-candidatos').scrollLeft > ${cancelado + 5}`);
                    // Sem overflow, nao oferecer uma mao que nao consegue movimentar.
                    await avaliar("document.getElementById('lista-candidatos').replaceChildren(document.querySelector('.card-cand'))");
                    await aguardar("!document.querySelector('.arraste-disponivel')");
                }
            }
        }
        console.log('Scroll: todos os carrosseis 2022/2026/personalizados em desktop e mobile; hover, mao, arraste bidirecional, retomada sobre os cards, cliques e cancelamento: OK.');

        for (const prefixo of ['', '2026/', 'personalizados/']) {
            const consulta = prefixo === 'personalizados/' ? '?site=correio-do-estado' : '';
            quantidadeCandidatos = 64;
            await navegar(`${prefixo}970x250.html`, 970, consulta);
            await avaliar("const e=document.getElementById('select-cargo');e.value='6';e.dispatchEvent(new Event('change'))");
            await aguardar("document.querySelector('.carregar-mais') && document.querySelectorAll('.card-cand').length === 40");
            const botaoReal = await avaliar(`(() => {
                const e = document.getElementById('lista-candidatos'); e.scrollLeft = e.scrollWidth;
                const r = e.querySelector('.carregar-mais').getBoundingClientRect();
                return { x: r.x + r.width/2, y:r.y + r.height/2 };
            })()`);
            await mouse('mouseMoved', botaoReal.x, botaoReal.y);
            await mouse('mousePressed', botaoReal.x, botaoReal.y, true);
            await mouse('mouseReleased', botaoReal.x, botaoReal.y);
            await aguardar("document.querySelectorAll('.card-cand').length === 64 && !document.querySelector('.carregar-mais')");
            quantidadeCandidatos = 8;
            await navegar(`${prefixo}horizontal.html`, 320, consulta);
            await aguardar("document.querySelector('.arraste-disponivel')");
            await mouse('mouseMoved', 319, 790);
            const toque = await avaliar(`(() => {
                const e = document.getElementById('lista-candidatos'), r = e.getBoundingClientRect();
                e.scrollLeft=160; return { x:160, y:r.y + r.height/2, id:1 };
            })()`);
            await enviar('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 }, sessionId);
            await enviar('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[toque] }, sessionId);
            await avaliar('window.__testeRelogio.agora += 3000');
            await esperar(150);
            assert.equal(await scrollAtual(), 160, `${prefixo}: toque deve pausar o automatico`);
            for (const dx of [30, 60, 100]) {
                await enviar('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{...toque,x:toque.x-dx}] }, sessionId);
                await esperar(40);
            }
            assert(await scrollAtual() > 180, `${prefixo}: rolagem nativa com o dedo preservada`);
            assert.equal(await avaliar("!!document.querySelector('.arrastando-candidatos')"), false,
                `${prefixo}: toque nao deve ser capturado como arraste do mouse`);
            await enviar('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] }, sessionId);
            // Uma pressao sem movimento isola a retomada automatica da inercia nativa.
            await esperar(350);
            await enviar('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[toque] }, sessionId);
            await esperar(150);
            const antesToqueFinal = await scrollAtual();
            await enviar('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] }, sessionId);
            await avaliar('window.__testeRelogio.agora += 1000');
            await aguardar(`document.getElementById('lista-candidatos').scrollLeft > ${antesToqueFinal + 5}`);
            await enviar('Emulation.setTouchEmulationEnabled', { enabled:false }, sessionId);
        }
        console.log('Scroll: botao Carregar mais real e gestos nativos de toque/retomada nas tres versoes: OK.');

        // Mesmo na vespera e com parametros antigos, somente apuracao.
        const relogioSemCapa = await enviar('Page.addScriptToEvaluateOnNewDocument', {
            source: "window.__testeRelogio.agora = Date.parse('2026-10-03T08:00:00-03:00');",
        }, sessionId);
        for (const modo of ['apuracao', 'vespera', 'dia', 'teste']) {
            for (const formato of formatos2026) {
                for (const viewport of [...new Set([tamanho[formato][0], 320])]) {
                    const antes = chamadasApi.length;
                    const consulta = `?site=cliente-x&marca=MarcaIndevida&cor1=%23ff0000${modo === 'apuracao' ? '' : `&pre-eleicao=${modo}`}`;
                    await navegar(`personalizados/${formato}.html`, viewport, consulta);
                    await aguardar("document.querySelectorAll('.card-cand,.candidato-card').length>0");
                    assert.equal(await avaliar("!!document.querySelector('.pre26-painel') || !!window.PreEleicao2026"), false,
                        `${formato}/${modo}: personalizado deve abrir somente a apuracao`);
                    await aguardar("document.querySelector('.cliente-logo img')?.complete");
                    const visual = await avaliar(`(() => {
                        const logo = document.querySelector('.cliente-logo img');
                        const header = document.querySelector('.bloco-header,.widget-header');
                        const titulo = document.querySelector('.header-copy h1,.header-copy h2');
                        return { cliente: document.body.dataset.cliente, nome: titulo?.textContent,
                            logo: logo.getAttribute('src'), imagem: logo.naturalWidth,
                            cor: getComputedStyle(document.body).getPropertyValue('--ink').trim(),
                            fundoHeader: getComputedStyle(header).backgroundColor,
                            marcaNossa: document.body.innerText.includes('Placar das Urnas'),
                            venda: [...document.querySelectorAll('.produto-link')]
                                .some(e => e.getBoundingClientRect().height>0) };
                    })()`);
                    assert.equal(visual.cliente, 'cliente-x');
                    assert.equal(visual.nome, 'Cliente Exemplo', `${formato}/${modo}: nome do cliente sobrescrito`);
                    assert.equal(visual.logo, '/personalizados/logos/cliente-x.svg');
                    assert(visual.imagem > 0, 'Logo deve carregar do proprio Pages');
                    assert.equal(visual.cor, '#15243B', `${formato}/${modo}: cor do cliente nao aplicada`);
                    if (modo === 'apuracao' && formato === '1260x200' && viewport === 1260) assert.equal(visual.fundoHeader, 'rgb(21, 36, 59)');
                    assert(!visual.marcaNossa && !visual.venda, 'White-label nao deve exibir nossa marca ou oferta');
                    assert(chamadasApi.length > antes, 'Apuracao deve consultar a API, sem calendario de capas');
                    assert(chamadasApi.slice(antes).every(url => new URL(url).searchParams.get('ano') === '2026'
                        && !new URL(url).searchParams.has('site')), 'Identidade nao deve fragmentar consultas ao backend');
                    if (modo === 'apuracao' && formato === '1260x200') {
                        const r = await avaliar(`(() => {const r=document.querySelector('.widget-horizontal').getBoundingClientRect();
                            return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()`);
                        const captura = await enviar('Page.captureScreenshot', {format:'png',captureBeyondViewport:true,clip:r}, sessionId);
                        fs.writeFileSync(path.join(diretorioTestes, `personalizado-${modo}-${viewport}.png`), Buffer.from(captura.data,'base64'));
                    }
                }
            }
        }
        await enviar('Page.removeScriptToEvaluateOnNewDocument', {identifier:relogioSemCapa.identifier}, sessionId);
        for (const formato of formatos2026) {
            for (const viewport of [...new Set([tamanho[formato][0], 320])]) {
                await navegar(`personalizados/${formato}.html`, viewport, '?site=correio-do-estado');
                await aguardar("document.querySelectorAll('.card-cand,.candidato-card').length>0");
                await aguardar("document.querySelector('.cliente-logo img')?.complete");
                const marca = await avaliar(`(() => {
                    const logo=document.querySelector('.cliente-logo'), img=logo.querySelector('img');
                    const l=logo.getBoundingClientRect(), i=img.getBoundingClientRect();
                    const cabecalho=document.querySelector('.widget-header,.bloco-header');
                    return {nome:document.querySelector('.header-copy h1,.header-copy h2').textContent,
                        cliente:document.body.dataset.cliente,src:img.getAttribute('src'),imagem:img.naturalWidth,
                        cores:['--ink','--mint-strong','--mint'].map(v=>getComputedStyle(document.body).getPropertyValue(v).trim()),
                        fundoLogo:getComputedStyle(logo).backgroundColor,
                        gradiente:getComputedStyle(cabecalho).backgroundImage,
                        logoVisivel:l.width>0&&l.height>0,
                        logoCabe:i.x>=l.x-1&&i.y>=l.y-1&&i.right<=l.right+1&&i.bottom<=l.bottom+1};
                })()`);
                assert.equal(marca.nome, 'Correio do Estado');
                assert.equal(marca.cliente, 'correio-do-estado');
                assert.equal(marca.src, '/personalizados/logos/correiodoestado.png');
                assert(marca.imagem>0, 'Correio: logo fornecida deve carregar sem alteracao');
                assert.deepEqual(marca.cores, ['#134282','#246AB5','#E8F1FC']);
                assert.equal(marca.fundoLogo, 'rgb(255, 255, 255)');
                if (marca.logoVisivel) assert(marca.logoCabe, `${formato}/${viewport}: logo do Correio cortada`);
                if (formato === '1260x200' && viewport === 1260) assert(marca.gradiente.includes('rgb(19, 66, 130)'));
                if (['1260x200','300x250','970x90'].includes(formato)) {
                    const r=await avaliar(`(() => {const r=document.querySelector('.widget-container,.widget-horizontal').getBoundingClientRect();
                        return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()`);
                    const captura=await enviar('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:r},sessionId);
                    fs.writeFileSync(path.join(diretorioTestes,`correio-${formato}-${viewport}.png`),Buffer.from(captura.data,'base64'));
                }
            }
        }
        // O estilo exclusivo deve continuar correto dentro do embed responsivo.
        for (const viewport of [1400, 360]) {
            await navegar('testar-embed.html', viewport, '?site=correio-do-estado&formato=1260x200&breakpoint=1050');
            await aguardar("document.querySelector('eleicoes-widget')?.shadowRoot?.querySelector('iframe')?.contentDocument?.querySelectorAll('.card-cand').length>0");
            const estado=await avaliar(`(() => {const host=document.querySelector('eleicoes-widget'), d=host.shadowRoot.querySelector('iframe').contentDocument;
                return {cliente:d.body.dataset.cliente,cor:getComputedStyle(d.body).getPropertyValue('--ink').trim(),altura:host.getBoundingClientRect().height};})()`);
            assert.equal(estado.cliente,'correio-do-estado');
            assert.equal(estado.cor,'#134282');
            assert.equal(estado.altura,viewport===1400?200:100);
        }
        console.log('Correio do Estado: logo original, paleta azul exclusiva, dez formatos desktop/mobile e embed responsivo: OK.');

        // Encerrar o embed anterior: trocar a viewport pode recarregar aquele
        // iframe antes da navegacao, sem relacao com o cliente invalido abaixo.
        await navegar('personalizados/1260x200.html', 1260, '?site=inexistente');
        await aguardar("document.querySelector('.cliente-aviso')");
        // site nao e uma URL nem credencial. Sem cadastro, nenhuma consulta.
        for (const site of ['', 'inexistente', '../cliente-x', '__proto__', '<script>alert(1)</script>']) {
            const antes = chamadasApi.length;
            await navegar('personalizados/1260x200.html', 1260, `?site=${encodeURIComponent(site)}`);
            await aguardar("document.querySelector('.cliente-aviso')");
            assert.equal(chamadasApi.length, antes);
            assert.equal(await avaliar("document.querySelectorAll('.card-cand,.candidato-card,.cliente-logo').length"), 0);
        }
        console.log('Personalizados: dez formatos desktop/mobile so com apuracao, mesmo na vespera e com parametros de capa; logos/cores e cliente invalido: OK.');

        const segundoCliente = await enviar('Page.addScriptToEvaluateOnNewDocument', {
            source: `(() => {let cadastro;Object.defineProperty(window,'ClientesPersonalizados2026',{
                configurable:true,get(){return cadastro},set(v){cadastro=v;v['cliente-y-teste']={
                    nome:'Segundo Cliente',logo:'/personalizados/logos/cliente-x.svg',
                    cores:{primaria:'#451A35',destaque:'#DB2777',clara:'#FCE7F3'}}}})})()`,
        }, sessionId);
        await navegar('personalizados/1260x200.html', 1260, '?site=cliente-x');
        await aguardar("document.querySelectorAll('.card-cand').length>0");
        await avaliar(`(() => {const cargo=document.getElementById('select-cargo');cargo.value='3';cargo.dispatchEvent(new Event('change'));
            const uf=document.getElementById('select-uf');uf.value='mt';uf.dispatchEvent(new Event('change'));})()`);
        await aguardar("document.getElementById('lista-candidatos').getAttribute('aria-busy')==='false'");
        await navegar('personalizados/1260x200.html', 1260, '?site=cliente-y-teste');
        await aguardar("document.querySelectorAll('.card-cand').length>0");
        assert.equal(await avaliar("document.getElementById('select-cargo').value"), '1', 'Filtro de outro cliente nao deve vazar');
        assert.equal(await avaliar("getComputedStyle(document.body).getPropertyValue('--ink').trim()"), '#451A35');
        await navegar('personalizados/1260x200.html', 1260, '?site=cliente-x');
        await aguardar("document.querySelectorAll('.card-cand').length>0");
        assert.equal(await avaliar("document.getElementById('select-cargo').value"), '3');
        assert.equal(await avaliar("document.getElementById('select-uf').value"), 'mt');
        await avaliar("document.querySelector('.cliente-logo img').dispatchEvent(new Event('error'))");
        assert.equal(await avaliar("document.querySelector('.cliente-iniciais').textContent"), 'CE', 'Logo indisponivel deve usar iniciais do cliente');

        for (const formato of formatos2026) {
            for (const viewport of [1400, 360]) {
                await navegar('testar-embed.html', viewport, `?site=cliente-x&formato=${formato}&breakpoint=1050&pre-eleicao=vespera&duracao=2&reiniciar=1`);
                await aguardar("document.querySelector('eleicoes-widget')?.shadowRoot?.querySelector('iframe')?.contentDocument?.querySelectorAll('.card-cand,.candidato-card').length>0");
                const resultado = await avaliar(`(() => {
                    const host=document.querySelector('eleicoes-widget'), iframe=host.shadowRoot.querySelector('iframe'), d=iframe.contentDocument;
                    return {url:iframe.src,altura:host.getBoundingClientRect().height,cliente:d.body.dataset.cliente,
                        cor:getComputedStyle(d.body).getPropertyValue('--ink').trim(), titulo:iframe.title};
                })()`);
                assert.equal(new URL(resultado.url).pathname, `/personalizados/${formato}.html`);
                assert.equal(new URL(resultado.url).searchParams.get('site'), 'cliente-x');
                for (const parametro of ['pre-eleicao', 'duracao', 'reiniciar']) {
                    assert(!new URL(resultado.url).searchParams.has(parametro), 'Embed personalizado nao deve encaminhar parametros das capas');
                }
                assert.equal(resultado.cliente, 'cliente-x');
                assert.equal(resultado.cor, '#15243B');
                assert(!resultado.titulo.includes('Placar das Urnas'));
                const alturaMobile = ['970x250x100','1260x100','1260x200'].includes(formato) ? 100
                    : ['index','horizontal'].includes(formato) ? 250 : tamanho[formato][1];
                assert.equal(resultado.altura, viewport === 360 ? alturaMobile : tamanho[formato][1]);
            }
        }
        // Mudar site apos inserir o widget deve trocar somente aquele iframe.
        await avaliar("document.querySelector('eleicoes-widget').setAttribute('site','cliente-y-teste')");
        await aguardar("document.querySelector('eleicoes-widget').shadowRoot.querySelector('iframe').contentDocument?.body?.dataset.cliente==='cliente-y-teste'");
        await enviar('Page.removeScriptToEvaluateOnNewDocument', {identifier:segundoCliente.identifier}, sessionId);
        console.log('Personalizados: filtros/cores separados entre clientes, fallback de logo, dez embeds responsivos e troca de site: OK.');

        await navegar('2026/320x100.html', 1400);
        await aguardar("document.querySelectorAll('.card-cand').length > 0");
        const medidas = await avaliar("(() => {const r=document.querySelector('.widget-320x100').getBoundingClientRect();return {w:r.width,h:r.height};})()");
        assert.deepEqual(medidas, { w: 320, h: 100 });
        async function mudar(campo, valor) {
            await avaliar(`(() => {const e=document.getElementById(${JSON.stringify(campo)});e.value=${JSON.stringify(valor)};e.dispatchEvent(new Event('change'));})()`);
        }
        await mudar('select-cargo', '3');
        await aguardar("!document.getElementById('select-uf').disabled && document.querySelectorAll('.card-cand').length > 0");
        await mudar('select-uf', 'mt');
        await mudar('select-turno', '2');
        await aguardar("document.getElementById('lista-candidatos').getAttribute('aria-busy') === 'false'");
        assert(chamadasApi.some((url) => url.includes('turno=2&cargo=3&uf=mt')));
        console.log('320x100 fixo em desktop de 1400px; filtros cargo, UF e turno: OK.');

        for (const cenario of ['finalizado', 'sem-horario']) {
            cenario2026 = cenario;
            await navegar('2026/1260x200.html', 1260);
            await aguardar("document.querySelectorAll('.card-cand').length > 0");
            assert.equal(await avaliar("document.getElementById('ultima-atualizacao').innerText"),
                cenario === 'sem-horario' ? 'Fonte: TSE · 04/10 · --:--' : 'Fonte: TSE · 04/10 · 18:30');
        }
        cenario2026 = 'normal';
        await navegar('2026/1260x200.html', 1260);
        await aguardar("document.querySelectorAll('.card-cand').length > 0");
        const consultasAntesDaVirada = chamadasApi.length;
        for (const [instante, dia] of [['2026-10-05T02:00:00Z', '04/10'], ['2026-10-05T04:00:00Z', '05/10']]) {
            await avaliar(`window.__testeRelogio.agora = Date.parse(${JSON.stringify(instante)});
                document.dispatchEvent(new Event('visibilitychange'));`);
            assert.equal(await avaliar("document.getElementById('ultima-atualizacao').innerText"),
                `Fonte: TSE · ${dia} · 18:30`, 'Dia atual deve acompanhar Brasilia sem alterar o horario do TSE');
        }
        assert.equal(chamadasApi.length, consultasAntesDaVirada, 'Atualizar o dia nao deve consultar a API');
        const ajudaAtualizacao = await avaliar("document.getElementById('ultima-atualizacao').title");
        assert(ajudaAtualizacao.includes('05/10') && ajudaAtualizacao.includes('04/10/2026'),
            'Distinguir data de exibicao da ultima atualizacao dos dados do TSE');
        console.log('Fonte TSE, dia atual em Brasilia e horario sem segundos; virada do dia sem novas consultas; horario ausente nao e inventado: OK.');

        disponivel = false;
        await navegar('2026/300x250.html', 300);
        await aguardar("document.querySelector('.estado-aguardando')");
        disponivel = true; fase = 'simulado';
        await navegar('2026/1260x200.html', 1260);
        await aguardar("document.querySelector('.aviso-fonte-dados--simulacao')");
        assert.equal(await avaliar("document.querySelector('.aviso-fonte-dados').hidden"), false,
            'O aviso de dados simulados deve continuar visivel');
        fase = 'oficial';
        await mudar('select-cargo', '3');
        await aguardar("document.querySelector('.aviso-fonte-dados').hidden && !document.querySelector('.tem-aviso-dados')");
        console.log('Estados de espera, simulacao e resultados oficiais: OK.');

        // Revisao visual da espera: nunca preencher o banner com candidatos ficticios.
        for (const modoEspera of ['sem-catalogo', 'sem-votos']) {
            disponivel = modoEspera === 'sem-votos';
            cenario2026 = modoEspera === 'sem-votos' ? 'sem-votos' : 'normal';
            const relogioEspera = await enviar('Page.addScriptToEvaluateOnNewDocument', {
                source: `window.__testeRelogio.agora = Date.parse('${modoEspera === 'sem-votos' ? '2026-10-04' : '2026-10-02'}T18:00:00-03:00');`,
            }, sessionId);
            for (const formato of formatos2026) {
                for (const viewport of [...new Set([tamanho[formato][0], 320])]) {
                    await navegar(`2026/${formato}.html`, viewport);
                    await aguardar("document.querySelector('.estado-aguardando .estado-descricao')");
                    const visual = await avaliar(`(() => {
                        const painel = document.querySelector('.widget-container,.widget-horizontal');
                        const lista = document.getElementById('lista-candidatos');
                        const estado = document.querySelector('.estado-aguardando');
                        const icone = estado.querySelector('.estado-icone');
                        const p = painel.getBoundingClientRect(), l = lista.getBoundingClientRect(), r = estado.getBoundingClientRect();
                        const i = icone.getBoundingClientRect();
                        return { painel: {x:p.x,y:p.y,w:p.width,h:p.height}, estado: {x:r.x,y:r.y,w:r.width,h:r.height},
                            lista: {x:l.x,y:l.y,w:l.width,h:l.height}, borda: getComputedStyle(estado).borderTopStyle,
                            icone: {x:i.x,y:i.y,w:i.width,h:i.height,display:getComputedStyle(icone).display},
                            textos: [...estado.querySelectorAll('strong,.estado-descricao')].map(e => {
                                const t = e.getBoundingClientRect(); return {texto:e.innerText,x:t.x,y:t.y,w:t.width,h:t.height,font:parseFloat(getComputedStyle(e).fontSize)};
                            }), candidatos: document.querySelectorAll('.card-cand,.candidato-card').length };
                    })()`);
                    assert.equal(visual.borda, 'solid', `${formato}: espera nao deve parecer um alerta tracejado`);
                    assert.equal(visual.candidatos, 0);
                    assert(visual.estado.y >= visual.lista.y - 1 && visual.estado.y + visual.estado.h <= visual.lista.y + visual.lista.h + 1,
                        `${formato}/${viewport}: espera cortada ${JSON.stringify(visual)}`);
                    assert(visual.textos.every(t => t.w > 0 && t.h > 0 && t.font >= 9 &&
                        t.x >= visual.estado.x && t.x + t.w <= visual.estado.x + visual.estado.w + 1 &&
                        t.y >= visual.estado.y && t.y + t.h <= visual.estado.y + visual.estado.h + 1),
                        `${formato}/${viewport}: texto da espera cortado ${JSON.stringify(visual)}`);
                    if (formato === '970x90') {
                        const i = visual.icone, r = visual.estado;
                        assert(i.display !== 'none' && i.w > 0 && i.h > 0 &&
                            i.x >= r.x && i.x + i.w <= r.x + r.w + 1 &&
                            i.y >= r.y && i.y + i.h <= r.y + r.h + 1,
                        `970x90/${viewport}: relogio oculto ou cortado ${JSON.stringify(visual)}`);
                        assert.equal(visual.painel.h, 90, 'O relogio nao deve mudar a altura do 970x90.');
                    }
                    if ((formato === '1260x200' && [1260, 320].includes(viewport)) || ['320x100', '970x90'].includes(formato)) {
                        const p = visual.painel;
                        const captura = await enviar('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
                            clip: { x: p.x, y: p.y, width: p.w, height: p.h, scale: 1 } }, sessionId);
                        fs.writeFileSync(path.join(diretorioTestes, `espera-${modoEspera}-${formato}-${viewport}.png`), Buffer.from(captura.data, 'base64'));
                    }
                }
            }
            await enviar('Page.removeScriptToEvaluateOnNewDocument', { identifier: relogioEspera.identifier }, sessionId);
        }
        disponivel = true;
        cenario2026 = 'normal';
        console.log('Visual de espera: dez formatos desktop/320px, antes da eleicao e com votos zerados, sem cortes: OK.');

        // Todos os formatos 2026 precisam manter o ano mesmo antes do dia da eleicao.
        const scriptDataAnterior = await enviar('Page.addScriptToEvaluateOnNewDocument', {
            source: "window.__testeRelogio.agora = Date.parse('2026-10-02T18:00:00-03:00');",
        }, sessionId);
        for (const formato of formatos2026) {
            const antes = chamadasApi.length;
            await navegar(`2026/${formato}.html`, tamanho[formato][0]);
            await aguardar("document.querySelectorAll('.candidato-card,.card-cand').length > 0");
            assert(chamadasApi.length > antes, `${formato}: nenhuma consulta 2026`);
            assert(chamadasApi.slice(antes).every((url) => {
                const u = new URL(url); return u.port === '8788' && u.searchParams.get('ano') === '2026';
            }), `${formato}: consultou outra eleicao antes do dia 4`);
        }
        disponivel = false;
        await navegar('2026/320x100.html', 320);
        await aguardar("document.querySelector('.estado-aguardando')");
        assert.equal(await avaliar("document.querySelectorAll('.card-cand,.candidato-card').length"), 0);
        disponivel = true;
        await enviar('Page.removeScriptToEvaluateOnNewDocument', { identifier: scriptDataAnterior.identifier }, sessionId);

        const inicioProtecao = chamadasApi.length;
        for (const cenario of ['ano-2022', 'sem-ano', 'historico', 'erro-http', 'sem-votos']) {
            cenario2026 = cenario;
            await navegar('2026/320x100.html', 320);
            await aguardar("document.getElementById('lista-candidatos').getAttribute('aria-busy') === 'false'");
            assert.equal(await avaliar("document.querySelectorAll('.card-cand,.candidato-card').length"), 0, cenario);
        }
        // Exercitar tambem a validacao da apuracao, depois de um status valido.
        cenario2026 = 'normal';
        await navegar('2026/320x100.html', 320);
        await aguardar("document.querySelectorAll('.card-cand').length > 0");
        cenario2026 = 'ano-2022';
        await mudar('select-cargo', '6');
        await aguardar("document.getElementById('lista-candidatos').getAttribute('aria-busy') === 'false'");
        assert.equal(await avaliar("document.getElementById('lista-candidatos').innerText.includes('Historico Indevido')"), false,
            'Resposta 2022 da apuracao deve ser rejeitada, preservando somente os ultimos dados validos de 2026.');
        cenario2026 = 'normal';
        assert(chamadasApi.slice(inicioProtecao).every((url) => {
            const u = new URL(url); return u.port === '8788' && u.searchParams.get('ano') === '2026';
        }), 'Falha na API causou fallback para outro ano.');
        console.log('2026 exclusivo: dez formatos antes do dia 4; ano errado/ausente, historico, erro e zero votos sem fallback: OK.');

        // Datas alteradas somente no contexto de teste; validar capa sem API e a transicao automatica.
        for (const modo of ['vespera', 'dia']) {
            const antes = chamadasApi.length;
            await navegar('2026/320x100.html', 320, `?pre-eleicao=${modo}`);
            await aguardar("document.querySelector('.pre26-painel')");
            assert.equal(chamadasApi.length, antes, 'Capa pre-eleicao consultou a API.');
        }
        await navegar('2026/320x100.html', 320, '?pre-eleicao=teste&duracao=2&reiniciar=1');
        await aguardar("document.querySelector('.pre26-painel')");
        await aguardar("document.querySelectorAll('.card-cand').length > 0");
        console.log('Capa vespera/dia sem consultas e transicao para apuracao: OK.');

        // Reproduzir o pai de 1260px no mobile e verificar que CSS interno,
        // iframe e altura externa obedecem ao mesmo breakpoint real.
        for (const modo of ['vespera', 'dia']) {
            for (const [largura, cenario, limite, esperado] of [
                [320, 'pai-largo', 940, 320], [360, 'pai-largo', 940, 360],
                [390, 'pai-largo', 940, 390], [400, 'pai-largo', 940, 400],
                [1400, 'ancestral-estreito', 940, 340], [360, 'flex', 940, 360],
                [360, 'grid', 940, 360], [360, 'contents', 940, 360],
                [939, 'normal', 940, 939], [940, 'normal', 940, 940],
                [941, 'normal', 940, 941], [1040, 'normal', 1050, 1040],
                [1051, 'normal', 1050, 1051], [1400, 'normal', 940, 1260],
                [800, 'normal', 'padrao', 800], [760, 'normal', 'padrao', 760],
            ]) {
                const antes = chamadasApi.length;
                await enviar('Emulation.setDeviceMetricsOverride', { width: largura, height: 800, deviceScaleFactor: 1, mobile: false }, sessionId);
                await enviar('Page.navigate', { url: `${origem}/testar-embed.html?pre-eleicao=${modo}&breakpoint=${limite}&cenario=${cenario}` }, sessionId);
                await aguardar("document.querySelector('eleicoes-widget')?.shadowRoot?.querySelector('iframe')?.contentDocument?.querySelector('.pre26-painel')");
                const efetivo = limite === 'padrao' ? 760 : limite;
                const mobile = largura <= efetivo || esperado <= 760;
                const altura = mobile ? 100 : 200;
                await aguardar(`document.querySelector('eleicoes-widget').getBoundingClientRect().height===${altura}`);
                const dimensoes = await avaliar(`(() => {
                    const w=document.querySelector('eleicoes-widget'), f=w.shadowRoot.querySelector('iframe');
                    const r=w.getBoundingClientRect(), p=f.contentDocument.querySelector('.pre26-painel').getBoundingClientRect();
                    return {x:r.x,w:r.width,h:r.height,pw:p.width,ph:p.height,iw:f.contentWindow.innerWidth,
                        breakpoint:f.contentWindow.PreEleicao2026.breakpoint,mobile:w.dataset.embedModo,
                        titulo:f.contentDocument.getElementById('pre26-titulo').textContent};
                })()`);
                assert.equal(dimensoes.w, esperado, `${modo}/${cenario}/${largura}: largura errada`);
                assert.equal(dimensoes.pw, esperado, `${modo}/${cenario}: painel interno largo`);
                assert.equal(dimensoes.iw, esperado);
                assert.equal(dimensoes.ph, altura, `${modo}/${cenario}: altura interna incorreta`);
                assert.equal(dimensoes.breakpoint, efetivo);
                assert.equal(dimensoes.mobile, mobile ? 'mobile' : 'desktop');
                assert(dimensoes.x>=0 && dimensoes.x+dimensoes.w<=largura+1, `${modo}/${cenario}/${largura}: banner fora da area visivel: ${JSON.stringify(dimensoes)}`);
                assert(dimensoes.titulo.includes(modo==='dia' ? 'Hoje' : '1 dia'));
                assert.equal(chamadasApi.length, antes, 'Capa no embed consultou a API.');
                if (largura===360 && cenario==='pai-largo') {
                    const r=await avaliar("(()=>{const r=document.querySelector('eleicoes-widget').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()");
                    const captura=await enviar('Page.captureScreenshot',{format:'png',clip:r},sessionId);
                    fs.writeFileSync(path.join(diretorioTestes,`embed-capa-${modo}-360.png`),Buffer.from(captura.data,'base64'));
                }
            }
        }
        const fixos = ['300x250', '300x600', '320x100'];
        const alturasMobile = { index:250, horizontal:250, '970x250':250,
            '970x90':90, '970x250x100':100, '1260x100':100, '1260x200':100 };
        for (const formato of formatos2026) {
            for (const modo of ['vespera', 'dia', 'apuracao']) {
                for (const viewport of [1400,320,360,390,400]) {
                    const largura = fixos.includes(formato) ? tamanho[formato][0] : Math.min(tamanho[formato][0],viewport);
                    const altura = fixos.includes(formato) || viewport===1400 ? tamanho[formato][1] : alturasMobile[formato];
                    const consulta = modo==='apuracao' ? '' : `&pre-eleicao=${modo}`;
                    const antes=chamadasApi.length;
                    await enviar('Emulation.setDeviceMetricsOverride',{width:viewport,height:900,deviceScaleFactor:1,mobile:false},sessionId);
                    await enviar('Page.navigate',{url:`${origem}/testar-embed.html?formato=${formato}&breakpoint=1050&cenario=${viewport===1400?'normal':'pai-largo'}${consulta}`},sessionId);
                    const pronto = modo==='apuracao' ? "d.querySelectorAll('.card-cand,.candidato-card').length>0" : "!!d.querySelector('.pre26-painel')";
                    await aguardar(`(()=>{const f=document.querySelector('eleicoes-widget')?.shadowRoot?.querySelector('iframe'),d=f?.contentDocument;return !!d && (${pronto}) && document.querySelector('eleicoes-widget').getBoundingClientRect().height===${altura};})()`);
                    const box=await avaliar(`(()=>{const w=document.querySelector('eleicoes-widget'),f=w.shadowRoot.querySelector('iframe'),d=f.contentDocument;
                        const r=w.getBoundingClientRect(),p=d.querySelector(${JSON.stringify(modo==='apuracao'?'.widget-horizontal,.widget-container':'.pre26-painel')}).getBoundingClientRect();
                        const filtros=[...d.querySelectorAll('#select-cargo,#select-uf')].map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height};});
                        const marca=d.querySelector('.pre26-nome,.header-copy h1,.header-copy h2')?.textContent;
                        return {x:r.x,w:r.width,h:r.height,pw:p.width,ph:p.height,mobile:w.dataset.embedModo,filtros,marca};})()`);
                    const detalhe=`${formato}/${modo}/${viewport}: ${JSON.stringify(box)}`;
                    assert.equal(box.marca,'Placar das Urnas',detalhe);
                    assert.equal(box.w,largura,detalhe);
                    assert.equal(box.pw,largura,detalhe);
                    assert.equal(box.ph,altura,detalhe);
                    assert.equal(box.mobile,!fixos.includes(formato)&&viewport<=1050?'mobile':'desktop',detalhe);
                    if(!fixos.includes(formato)) assert(box.x>=0 && box.x+box.w<=viewport+1,detalhe);
                    if(modo==='apuracao') assert(box.filtros.length===2 && box.filtros.every(f=>f.w>0 && f.h>0),detalhe);
                    else assert.equal(chamadasApi.length,antes,`${detalhe}: capa consultou API`);
                    if(modo!=='apuracao' && [1400,360].includes(viewport)) {
                        const clip=await avaliar("(()=>{const r=document.querySelector('eleicoes-widget').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()");
                        const img=await enviar('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip},sessionId);
                        fs.writeFileSync(path.join(diretorioTestes,`embed-todos-${formato}-${modo}-${viewport}.png`),Buffer.from(img.data,'base64'));
                    }
                }
            }
        }
        console.log('Todos os dez banners no embed: desktop 1400px e mobile 320/360/390/400px, capas vespera/dia, apuracao e filtros; formatos fixos preservados: OK.');
        await enviar('Page.navigate', { url: `${origem}/testar-embed.html?pre-eleicao=vespera&breakpoint=940&cenario=oculto` }, sessionId);
        await aguardar("document.querySelector('eleicoes-widget')?.dataset.embedEstado==='aguardando-largura'");
        await avaliar("document.querySelector('.area-teste').style.display='block'");
        await aguardar("document.querySelector('eleicoes-widget')?.dataset.embedEstado==='visivel'");
        await avaliar("document.querySelector('eleicoes-widget').setAttribute('breakpoint','1500')");
        await aguardar("document.querySelector('eleicoes-widget').shadowRoot.querySelector('iframe').contentWindow.PreEleicao2026?.breakpoint===1500 && document.querySelector('eleicoes-widget').getBoundingClientRect().height===100");
        console.log('Embed/capas: pai largo, ancestral estreito, flex/grid/contents, oculto e breakpoint 940/1050 reais, sem recorte nem consultas: OK.');

        await enviar('Emulation.setDeviceMetricsOverride', { width: 1040, height: 800, deviceScaleFactor: 1, mobile: false }, sessionId);
        await enviar('Page.navigate', { url: `${origem}/testar-embed.html?breakpoint=1050&cenario=normal` }, sessionId);
        const documentoEmbed = "document.querySelector('eleicoes-widget').shadowRoot.querySelector('iframe').contentDocument";
        await aguardar("document.querySelector('eleicoes-widget')?.shadowRoot?.querySelector('iframe')?.contentDocument?.querySelectorAll('.card-cand').length>0");
        const estadoEmbed = `(() => {const d=${documentoEmbed},r=d.querySelector('.widget-horizontal').getBoundingClientRect();return {w:r.width,h:r.height,resumo:d.getElementById('votos-validos').innerText,cargo:d.getElementById('select-cargo').value,uf:d.getElementById('select-uf').value};})()`;
        const compacto = await avaliar(estadoEmbed);
        assert.equal(compacto.w, 1040);
        assert.equal(compacto.h, 100);
        assert.equal(compacto.resumo, '95,23%', 'Resumo deve seguir o breakpoint mobile personalizado.');
        await avaliar(`(() => {const d=${documentoEmbed},e=d.getElementById('select-cargo');e.value='3';e.dispatchEvent(new Event('change'));})()`);
        await aguardar(`!${documentoEmbed}.getElementById('select-uf').disabled`);
        await avaliar(`(() => {const d=${documentoEmbed},e=d.getElementById('select-uf');e.value='mt';e.dispatchEvent(new Event('change'));})()`);
        await aguardar(`${documentoEmbed}.getElementById('lista-candidatos').getAttribute('aria-busy')==='false'`);
        await enviar('Emulation.setDeviceMetricsOverride', { width: 1051, height: 800, deviceScaleFactor: 1, mobile: false }, sessionId);
        await aguardar(`(${estadoEmbed}).h===200 && (${estadoEmbed}).resumo.includes('119.300.788')`);
        const desktop = await avaliar(estadoEmbed);
        assert.equal(desktop.w, 1051);
        assert.equal(desktop.resumo, '119.300.788 (95,23%)', 'Resumo desktop deve exibir total e percentual na mesma linha.');
        assert.equal(desktop.cargo, '3');
        assert.equal(desktop.uf, 'mt');
        console.log('Apuracao no embed: breakpoint 1050 sincroniza CSS/resumo/altura, filtros cargo/UF preservados ao redimensionar: OK.');

        await enviar('Page.navigate', { url: `${origemPortal}/teste-embed` }, sessionId);
        await aguardar("document.querySelector('eleicoes-widget')?.shadowRoot?.querySelector('iframe')");
        assert.equal(await avaliar("document.querySelector('eleicoes-widget').shadowRoot.querySelector('iframe').src"), `${origem}/2026/1260x200.html?breakpoint=1050&embed-modo=desktop`);
        for (const [largura, altura] of [[1400, 200], [360, 100]]) {
            await enviar('Emulation.setDeviceMetricsOverride', { width: largura, height: 400, deviceScaleFactor: 1, mobile: false }, sessionId);
            await aguardar(`document.querySelector('eleicoes-widget').getBoundingClientRect().height === ${altura}`);
        }
        // Um iframe simples conserva a medida contratada, independentemente da viewport do portal.
        await enviar('Page.navigate', { url: `${origem}/teste-iframe` }, sessionId);
        await aguardar("document.querySelector('iframe')?.contentDocument?.querySelectorAll('.card-cand').length > 0");
        const frame = await avaliar("(() => {const d=document.querySelector('iframe').contentDocument;const r=d.querySelector('.widget-320x100').getBoundingClientRect();return {w:r.width,h:r.height,f:d.querySelectorAll('.controles select').length};})()");
        assert.deepEqual(frame, { w: 320, h: 100, f: 3 });
        console.log('Embed entre origens distintas, alturas 200/100px e iframe simples 320x100: OK.');
        for (const [arquivo, regra] of [['embed.js', /max-age=300/], [build.versionados.values().next().value.slice(1), /immutable/]]) {
            const resposta = await fetch(`${origem}/${arquivo}`);
            assert.equal(resposta.status, 200); assert.match(resposta.headers.get('cache-control'), regra);
        }
        const ausente = await fetch(`${origem}/2026/assets/ausente.json`);
        assert.equal(ausente.status, 404);
        assert(!rede.some((url) => new URL(url).hostname.endsWith('.vercel.app')));
        assert(chamadasApi.every((url) => new URL(url).hostname === '127.0.0.1'), 'Frontend buscou um Worker de producao.');
        assert.equal(erros.length, 0, `Erros JS: ${JSON.stringify(erros)}`);
        const diagnostico = { paginas: paginas.length, chamadasSimuladas: chamadasApi.length, erros: erros.length,
            respostasEstáticas: respostas.filter((r) => r.url.startsWith(origem)).length };
        fs.writeFileSync(path.join(diretorioTestes, 'resultado-local.json'), JSON.stringify(diagnostico, null, 2));
        console.log('Cache HTTP, 404 real, ausencia de requisicoes a Vercel e ausencia de erros JS: OK.');
        await enviar('Browser.close');
    } finally {
        socket?.close();
        if (processo.exitCode === null) processo.kill();
        await Promise.all([servidor, portal].map((s) => new Promise((resolve) => s.close(resolve))));
    }
}

async function main() {
    assert(process.argv.length===2||(process.argv.length===3&&(apenasCompactos||apenasCabecalhos))
        ||(process.argv.length===4&&apenasCabecalhos&&Object.hasOwn(cadastroClientes,clienteCabecalhos)),
        'Somente execucao local, opcionalmente --compactos ou --cabecalhos [cliente cadastrado].');
    const build = gerar();
    validarBuild(build);
    await testarNavegador(build);
    console.log('Nenhum deploy, DNS, acesso ao TSE ou gravacao no KV de producao.');
}

main().catch((erro) => { console.error(erro); process.exitCode = 1; });
