'use strict';

// Teste local: APIs interceptadas no navegador. Nao acessa Workers, KV ou TSE reais.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { setTimeout: esperar } = require('node:timers/promises');
const { gerar, paginas, formatos2022, formatos2026 } = require('./preparar-pages');
const raiz = path.resolve(__dirname, '..');
const dominio = 'https://apuracao.placardasurnas.com.br';
const portaisClientes = ['portaldeprefeitura.com.br', 'portalmais360.com.br',
    'diariodajaragua.com.br', 'douradosnews.com.br', 'folhape.com.br'];
const tamanho = { index: [1180, 680], horizontal: [1200, 100], '970x250': [970, 250],
    '970x90': [970, 90], '970x250x100': [970, 250], '1260x100': [1260, 100],
    '1260x200': [1260, 200], '320x100': [320, 100], '300x250': [300, 250], '300x600': [300, 600] };

function validarBuild(build) {
    const ler = (arquivo) => fs.readFileSync(path.join(build.destino, arquivo), 'utf8');
    for (const pagina of paginas) {
        const html = ler(pagina);
        assert(html.includes('<title>Placar das Urnas'), `${pagina}: titulo sem a nova marca`);
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
    console.log('Build: 15 HTMLs, recursos identicos a fonte, origem do embed, CSP, licencas, 404 e 10 snippets: OK.');
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
            '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
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
                        resumo: { validos: '1.000', pctValidos: '90,00', brancos: '50', pctBrancos: '5,00',
                            nulos: '50', pctNulos: '5,00', abstencoes: '100', pctAbstencoes: '10,00' },
                        totalCandidatos: 8, candidatos: Array.from({ length: 8 }, (_, i) => ({ nome: `Candidato Teste ${i + 1}`,
                            numero: String(10 + i), partido: 'TESTE', votos: String(40 - i), votosNumero: 400 - i,
                            total: String(400 - i), situacao: 'Não eleito', eleito: false, foto: '' })) };
                if (ano === 2026) {
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
            const estado = await avaliar("({url:location.href, titulo:document.title, corpo:document.body?.innerText.slice(0,500)})");
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
            const caminho = pagina.endsWith('index.html') ? `/${pagina.slice(0, -10)}` : `/${pagina.replace(/\.html$/, '')}`;
            const esperado = new URL(`${origem}${caminho}${consulta}`);
            if (esperado.searchParams.get('pre-eleicao') === 'teste') esperado.searchParams.delete('reiniciar');
            await aguardar(`location.href === ${JSON.stringify(esperado.href)} && document.body && !document.body.dataset.testeAnterior && (!!document.getElementById('select-cargo') || !!document.querySelector('.pre26-painel'))`);
        }
        for (const pagina of paginas) {
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
            }
        }
        console.log('Navegador: 15 formatos/anos em desktop e mobile, candidatos e filtros atuais preservados: OK.');
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

        disponivel = false;
        await navegar('2026/300x250.html', 300);
        await aguardar("document.querySelector('.estado-aguardando')");
        disponivel = true; fase = 'simulado';
        await navegar('2026/1260x200.html', 1260);
        await aguardar("document.querySelector('.aviso-fonte-dados--simulacao')");
        fase = 'oficial';
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
        assert(!compacto.resumo.includes('\n'), 'Resumo deve seguir o breakpoint mobile personalizado.');
        await avaliar(`(() => {const d=${documentoEmbed},e=d.getElementById('select-cargo');e.value='3';e.dispatchEvent(new Event('change'));})()`);
        await aguardar(`!${documentoEmbed}.getElementById('select-uf').disabled`);
        await avaliar(`(() => {const d=${documentoEmbed},e=d.getElementById('select-uf');e.value='mt';e.dispatchEvent(new Event('change'));})()`);
        await aguardar(`${documentoEmbed}.getElementById('lista-candidatos').getAttribute('aria-busy')==='false'`);
        await enviar('Emulation.setDeviceMetricsOverride', { width: 1051, height: 800, deviceScaleFactor: 1, mobile: false }, sessionId);
        await aguardar(`(${estadoEmbed}).h===200 && (${estadoEmbed}).resumo.includes('\\n')`);
        const desktop = await avaliar(estadoEmbed);
        assert.equal(desktop.w, 1051);
        assert(desktop.resumo.includes('\n'), 'Resumo deve voltar ao formato desktop.');
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
    assert.equal(process.argv.length, 2, 'Este teste aceita somente execucao local, sem argumentos.');
    const build = gerar();
    validarBuild(build);
    await testarNavegador(build);
    console.log('Nenhum deploy, DNS, acesso ao TSE ou gravacao no KV de producao.');
}

main().catch((erro) => { console.error(erro); process.exitCode = 1; });
