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
const dominio = 'https://apuracao.paineleleitoralnews.com.br';
const tamanho = { index: [1180, 680], horizontal: [1200, 100], '970x250': [970, 250],
    '970x90': [970, 90], '970x250x100': [970, 250], '1260x100': [1260, 100],
    '1260x200': [1260, 200], '320x100': [320, 100], '300x250': [300, 250], '300x600': [300, 600] };

function validarBuild(build) {
    const ler = (arquivo) => fs.readFileSync(path.join(build.destino, arquivo), 'utf8');
    for (const pagina of paginas) {
        const html = ler(pagina);
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
    const csp = headers.match(/Content-Security-Policy: (.+)/)[1];
    assert.equal(csp, JSON.parse(fs.readFileSync(path.join(raiz, 'vercel.json'), 'utf8')).headers[0].headers[0].value);
    assert(headers.includes('max-age=31536000, immutable'));
    assert(!headers.includes('X-Frame-Options'));
    assert(fs.existsSync(path.join(build.destino, '404.html')));

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
    for (const [pai, autorizado] of [[`${dominio}/teste`, true], ['https://www.paineleleitoralnews.com.br/', true],
        ['https://abc.safeframe.googlesyndication.com/safeframe/', true], ['https://nao-licenciado.example/', false]]) {
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
                enviar('Fetch.fulfillRequest', { requestId, responseCode: 200,
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

        await enviar('Page.navigate', { url: `${origemPortal}/teste-embed` }, sessionId);
        await aguardar("document.querySelector('eleicoes-widget')?.shadowRoot?.querySelector('iframe')");
        assert.equal(await avaliar("document.querySelector('eleicoes-widget').shadowRoot.querySelector('iframe').src"), `${origem}/2026/1260x200.html`);
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
