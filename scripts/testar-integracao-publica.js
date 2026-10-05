'use strict';

// Somente leitura: carrega os arquivos publicos e intercepta a API com fixtures
// exclusivas de 2026. Nao consulta resultados reais, KV ou TSE.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { setTimeout: esperar } = require('node:timers/promises');
const dominio = 'https://apuracao.placardasurnas.com.br';
const raiz = path.resolve(__dirname, '..');
const tamanhos = { index:[1180,680,250],horizontal:[1200,100,250], '970x250':[970,250,250],
    '970x90':[970,90,90],'970x250x100':[970,250,100],'1260x100':[1260,100,100],
    '1260x200':[1260,200,100],'320x100':[320,100,100],'300x250':[300,250,250],'300x600':[300,600,600] };
const formatosFixos = ['320x100','300x250','300x600'];
const portaisClientes = ['placardasurnas.com.br', 'portaldeprefeitura.com.br', 'portalmais360.com.br',
    'diariodajaragua.com.br', 'douradosnews.com.br', 'folhape.com.br']
    .flatMap(host => [`https://${host}`, `https://www.${host}`]);
function criarPaginaPortal(embed, opcoes = {}) {
    const formato = Object.hasOwn(tamanhos,opcoes.formato) ? opcoes.formato : (embed ? '1260x200' : '320x100');
    const [largura,altura] = tamanhos[formato];
    const token = String(opcoes.token || '').replace(/[^a-zA-Z0-9]/g,'');
    const marca = token ? ` marca="${token}"` : '';
    const conteudo = embed
        ? `<script src="${dominio}/embed.js" defer></script><eleicoes-widget ano="2026" formato="${formato}" breakpoint="1050"${marca}></eleicoes-widget>`
        : `<iframe src="${dominio}/2026/${formato}.html" width="${largura}" height="${altura}" scrolling="no" style="display:block;border:0"></iframe>`;
    const estilo = opcoes.cenario==='pai-largo' ? 'width:1260px' : '';
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"></head><body style="margin:0"><div class="propaganda" style="${estilo}">${conteudo}</div></body></html>`;
}

async function main() {
    assert.equal(process.argv.length, 2, 'Este teste nao aceita outros dominios ou argumentos.');
    const navegador = [process.env.ELEICOES_TEST_BROWSER,
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
        .find((arquivo) => arquivo && fs.existsSync(arquivo));
    assert(navegador, 'Chrome/Edge nao encontrado.');
    const servidor = http.createServer((req, res) => {
        const url = new URL(req.url,'http://local');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(criarPaginaPortal(url.pathname === '/embed',Object.fromEntries(url.searchParams)));
    });
    await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));
    const portal = `http://127.0.0.1:${servidor.address().port}`;
    const pasta = path.join(raiz, '.pages-tests');
    fs.mkdirSync(pasta, { recursive: true });
    const perfil = fs.mkdtempSync(path.join(pasta, 'publico-chrome-'));
    const processo = spawn(navegador, ['--headless=new', '--no-first-run', '--no-default-browser-check',
        // Segunda barreira: sem resolucao DNS para APIs reais, mesmo se o CDP falhar.
        '--host-resolver-rules=MAP *.workers.dev ~NOTFOUND, MAP *.vercel.app ~NOTFOUND',
        '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${perfil}`, 'about:blank'],
        { windowsHide: true, stdio: 'ignore' });
    let socket;
    let erroProcesso;
    processo.on('error', (erro) => { erroProcesso = erro; });
    const pendentes = new Map();
    try {
        let textoPorta;
        for (let i = 0; i < 150; i++) {
            if (erroProcesso) throw erroProcesso;
            try {
                const texto = fs.readFileSync(path.join(perfil, 'DevToolsActivePort'), 'utf8').trim();
                if (/^\d+\r?\n\/devtools\//.test(texto)) { textoPorta = texto; break; }
            } catch (e) { if (!['ENOENT', 'EBUSY', 'EPERM', 'EACCES'].includes(e.code)) throw e; }
            await esperar(100);
        }
        assert(textoPorta, 'Chrome nao iniciou.');
        const [porta, endpoint] = textoPorta.split(/\r?\n/);
        socket = new WebSocket(`ws://127.0.0.1:${porta}${endpoint}`);
        await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
        let id = 0;
        const sessoes = new Map();
        const preparacoes = new Map();
        const erros = [];
        const bloqueadas = [];
        const resultados = [];
        const rede = [];
        let modoApi = 'com-votos';
        let dataTeste = '2026-10-04T18:00:00-03:00';
        function enviar(method, params = {}, sessionId) {
            return new Promise((resolve, reject) => {
                const chave = ++id;
                const timer = setTimeout(() => { pendentes.delete(chave); reject(new Error(`Timeout: ${method}`)); }, 10000);
                pendentes.set(chave, { resolve, reject, timer, method });
                socket.send(JSON.stringify({ id: chave, method, params, sessionId }));
            });
        }
        function preparar(sessionId, alvo) {
            // O evento de attach e a chamada explicita podem ocorrer juntos.
            // Ambos precisam aguardar a injecao do relogio e o bloqueio da API.
            if (preparacoes.has(sessionId)) return preparacoes.get(sessionId);
            const pronto = (async () => {
            sessoes.set(sessionId, alvo);
            await enviar('Runtime.enable', {}, sessionId);
            await enviar('Network.enable', {}, sessionId);
            await enviar('Page.enable', {}, sessionId);
            await enviar('Page.addScriptToEvaluateOnNewDocument', { source: `
                (() => { const Original = Date; const inicio = Original.now();
                const agora = () => Original.parse(${JSON.stringify(dataTeste)}) + Original.now() - inicio;
                window.Date = class extends Original { constructor(...args) { super(...(args.length ? args : [agora()])); }
                static now() { return agora(); } }; })();
            ` }, sessionId);
            await enviar('Fetch.enable', { patterns: [{ urlPattern: 'https://*.workers.dev/*' },
                { urlPattern: 'https://*.vercel.app/*' },
                ...portaisClientes.map(origin => ({ urlPattern: `${origin}/*` }))] }, sessionId);
            await enviar('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true }, sessionId);
            await enviar('Runtime.runIfWaitingForDebugger', {}, sessionId);
            })();
            preparacoes.set(sessionId, pronto);
            return pronto;
        }
        socket.onmessage = ({ data }) => {
            const m = JSON.parse(data);
            if (m.id) {
                const p = pendentes.get(m.id);
                if (!p) return;
                pendentes.delete(m.id); clearTimeout(p.timer);
                m.error ? p.reject(new Error(`${p.method}: ${JSON.stringify(m.error)}`)) : p.resolve(m.result);
                return;
            }
            if (m.method === 'Target.attachedToTarget') {
                preparar(m.params.sessionId, m.params.targetInfo).catch((e) => erros.push(e.message));
            }
            if (m.method === 'Target.detachedFromTarget') {
                sessoes.delete(m.params.sessionId);
                preparacoes.delete(m.params.sessionId);
            }
            if (m.method === 'Page.frameNavigated' && sessoes.has(m.sessionId)) {
                const alvo = sessoes.get(m.sessionId);
                if (!m.params.frame.parentId || alvo.type === 'iframe') alvo.url = m.params.frame.url;
            }
            if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails);
            if (m.method === 'Network.requestWillBeSent') rede.push(m.params.request.url);
            if (m.method === 'Network.responseReceived') {
                const r = m.params.response;
                if (r.url.includes('/api/apuracao')) resultados.push(r);
            }
            if (m.method === 'Fetch.requestPaused') {
                const { requestId, request } = m.params;
                const url = new URL(request.url);
                // Documento de teste servido pelo CDP na origem do cliente, sem
                // consultar, alterar ou publicar qualquer coisa no portal real.
                if (portaisClientes.includes(url.origin)) {
                    const modo = url.pathname.match(/^\/__teste-licenca-eleicoes\/(embed|iframe)$/)?.[1];
                    const body = modo ? criarPaginaPortal(modo === 'embed',Object.fromEntries(url.searchParams)) : '';
                    enviar('Fetch.fulfillRequest', { requestId, responseCode: modo ? 200 : 404,
                        responseHeaders: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' },
                            { name: 'Cache-Control', value: 'no-store' }],
                        body: Buffer.from(body).toString('base64') }, m.sessionId)
                        .catch(e => erros.push(e.message));
                    return;
                }
                const permitido = request.method === 'GET'
                    && url.hostname === 'backend-eleicoes-2026.enzo-eleicoes-backend.workers.dev'
                    && url.searchParams.get('ano') === '2026'
                    && ['/api/status-eleicao', '/api/apuracao'].includes(url.pathname);
                if (!permitido) {
                    bloqueadas.push(url.href);
                    enviar('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }, m.sessionId)
                        .catch((e) => erros.push(e.message));
                    return;
                }
                const json = url.pathname === '/api/status-eleicao'
                    ? { ano: 2026, fase: modoApi === 'aguardando' ? 'aguardando_tse' : 'oficial', resultadosDisponiveis: modoApi !== 'aguardando' }
                    : { ano: 2026, fase: 'oficial', turno: Number(url.searchParams.get('turno')),
                        cargo: Number(url.searchParams.get('cargo')), uf: url.searchParams.get('uf'),
                        percurso: '63,50', atualizacao: '04/10/2026 as 18:30:00', finalizado: false, vagas: 1,
                        totalCandidatos: 3, candidatos: Array.from({ length: 3 }, (_, i) => ({
                            nome: `Fixture 2026 ${i + 1}`, numero: String(10 + i), partido: 'TESTE',
                            votos: String(40 - i), votosNumero: 400 - i, total: String(400 - i),
                            situacao: 'Nao eleito', eleito: false, foto: '',
                        })) };
                if (modoApi === 'sem-votos' && json.candidatos) {
                    json.percurso = '0,00';
                    json.candidatos.forEach(c => { c.votos = '0,00'; c.votosNumero = 0; c.total = '0'; });
                }
                enviar('Fetch.fulfillRequest', { requestId, responseCode: 200,
                    responseHeaders: [{ name: 'Content-Type', value: 'application/json' },
                        { name: 'Access-Control-Allow-Origin', value: dominio },
                        { name: 'Cache-Control', value: 'no-store' },
                        { name: 'X-Data-Source', value: 'fixture-2026-teste' }],
                    body: Buffer.from(JSON.stringify(json)).toString('base64') }, m.sessionId)
                    .catch((e) => erros.push(e.message));
            }
        };
        const { targetId } = await enviar('Target.createTarget', { url: 'about:blank' });
        const { sessionId } = await enviar('Target.attachToTarget', { targetId, flatten: true });
        await preparar(sessionId, { targetId, type: 'page', url: 'about:blank' });
        async function avaliar(expressao, sessao = sessionId) {
            let r;
            try {
                r = await enviar('Runtime.evaluate', { expression: expressao, returnByValue: true, awaitPromise: true }, sessao);
            } catch(erro) {
                if(sessao!==sessionId && /Session with given id not found|Cannot find context|Execution context was destroyed/.test(erro.message)) return undefined;
                throw erro;
            }
            if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
            return r.result.value;
        }
        async function aguardar(fn, detalhe) {
            for (let i = 0; i < 400; i++) {
                if (await fn()) return;
                await esperar(50);
            }
            const diagnostico = await avaliar("({url:location.href,agora:new Date().toISOString(),modo:window.PreEleicao2026,corpo:document.body?.innerText.slice(0,500),scripts:[...document.scripts].map(s=>s.src)})");
            throw new Error(`Nao confirmou: ${detalhe}; estado=${JSON.stringify(diagnostico)}; respostas=${JSON.stringify(resultados.map(r=>({url:r.url,status:r.status})))}; erros=${JSON.stringify(erros)}`);
        }
        const candidatos = "document.querySelectorAll('.card-cand,.candidato-card').length > 0";
        const medidas = "(() => {const r=document.querySelector('.widget-horizontal').getBoundingClientRect();return {w:r.width,h:r.height};})()";
        await enviar('Emulation.setDeviceMetricsOverride', { width: 1400, height: 800, deviceScaleFactor: 1, mobile: false }, sessionId);
        await enviar('Page.navigate', { url: `${dominio}/2026/1260x200.html` }, sessionId);
        await aguardar(() => avaliar(candidatos), 'fixture 2026 carregada no dominio proprio');
        assert.deepEqual(await avaliar(medidas), { w: 1260, h: 200 });
        await enviar('Emulation.setDeviceMetricsOverride', { width: 360, height: 400, deviceScaleFactor: 1, mobile: false }, sessionId);
        await aguardar(async () => (await avaliar(medidas)).h === 100, 'altura mobile');
        await avaliar("(() => {const e=document.getElementById('select-cargo');e.value='3';e.dispatchEvent(new Event('change'));})()");
        await aguardar(() => avaliar("!document.getElementById('select-uf').disabled"), 'filtro de cargo');
        await avaliar("(() => {const e=document.getElementById('select-uf');e.value='mt';e.dispatchEvent(new Event('change'));})()");
        await aguardar(() => avaliar("document.getElementById('lista-candidatos').getAttribute('aria-busy')==='false' && document.querySelectorAll('.card-cand').length>0"), 'filtro UF MT');
        assert(resultados.some(r => r.url.includes('cargo=3&uf=mt') && r.status === 200));
        console.log('Dominio publico com API interceptada de 2026: 1260x200 desktop, 100px mobile e filtros cargo/UF: OK.');
        for (const modo of ['aguardando', 'sem-votos']) {
            modoApi = modo;
            for (const [formato, largura, altura] of [
                ['970x90', 970, 90], ['970x90', 320, 90],
                ['1260x200', 1260, 200], ['1260x200', 320, 100], ['320x100', 320, 100],
            ]) {
                await enviar('Emulation.setDeviceMetricsOverride', { width: largura, height: 400, deviceScaleFactor: 1, mobile: false }, sessionId);
                await avaliar("if(document.body) document.body.dataset.testeAnterior='1'");
                await enviar('Page.navigate', { url: `${dominio}/2026/${formato}.html` }, sessionId);
                await aguardar(() => avaliar(`location.pathname==='/2026/${formato}' && !document.body.dataset.testeAnterior && !!document.querySelector('.estado-aguardando .estado-descricao')`), `espera ${modo} ${formato}/${largura}`);
                const visual = await avaliar(`(() => {
                    const painel = document.querySelector('.widget-horizontal').getBoundingClientRect();
                    const estado = document.querySelector('.estado-aguardando');
                    const r = estado.getBoundingClientRect(), i = estado.querySelector('.estado-icone').getBoundingClientRect();
                    const textos = [...estado.querySelectorAll('strong,.estado-descricao')].map(e => { const t=e.getBoundingClientRect(); return {x:t.x,y:t.y,w:t.width,h:t.height}; });
                    return { painel:{x:painel.x,y:painel.y,w:painel.width,h:painel.height},
                        estado:{x:r.x,y:r.y,w:r.width,h:r.height}, icone:{x:i.x,y:i.y,w:i.width,h:i.height},
                        borda:getComputedStyle(estado).borderTopStyle, textos };
                })()`);
                const p = visual.painel, r = visual.estado, i = visual.icone;
                assert.equal(p.h, altura, `${formato}: altura alterada`);
                assert.equal(visual.borda, 'solid');
                assert(r.y >= p.y && r.y+r.h <= p.y+p.h+1, `${formato}: mensagem cortada`);
                assert(i.w > 0 && i.h > 0 && i.x >= r.x && i.x+i.w <= r.x+r.w+1 && i.y >= r.y && i.y+i.h <= r.y+r.h+1,
                    `${formato}/${largura}: relogio oculto ou cortado`);
                assert(visual.textos.every(t => t.w>0 && t.h>0 && t.x>=r.x && t.x+t.w<=r.x+r.w+1 && t.y>=r.y && t.y+t.h<=r.y+r.h+1),
                    `${formato}/${largura}: texto cortado`);
                const captura = await enviar('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
                    clip: { x:p.x, y:p.y, width:p.w, height:p.h, scale:1 } }, sessionId);
                fs.writeFileSync(path.join(pasta, `publico-espera-${modo}-${formato}-${largura}.png`), Buffer.from(captura.data, 'base64'));
            }
        }
        modoApi = 'com-votos';
        console.log('Visual publico 970x90, 1260x200 e 320x100: relogio visivel, alturas preservadas e espera sem cortes em desktop/mobile: OK.');
        await enviar('Page.navigate', { url: `${portal}/embed` }, sessionId);
        await aguardar(() => avaliar("!!document.querySelector('eleicoes-widget')?.shadowRoot?.querySelector('iframe')"), 'embed entre sites');
        assert.equal(await avaliar("document.querySelector('eleicoes-widget').shadowRoot.querySelector('iframe').src"), `${dominio}/2026/1260x200.html?breakpoint=1050&embed-modo=mobile`);
        for (const [width, height] of [[1400, 200], [360, 100]]) {
            await enviar('Emulation.setDeviceMetricsOverride', { width, height: 400, deviceScaleFactor: 1, mobile: false }, sessionId);
            await aguardar(() => avaliar(`document.querySelector('eleicoes-widget').getBoundingClientRect().height===${height}`), 'altura do embed');
        }
        await aguardar(async () => {
            const filho = [...sessoes].find(([, a]) => a.type === 'iframe' && a.url.startsWith(`${dominio}/2026/1260x200`));
            return filho && await avaliar(candidatos, filho[0]);
        }, 'candidatos no iframe do embed remoto');
        await enviar('Page.navigate', { url: `${portal}/iframe` }, sessionId);
        await aguardar(async () => {
            const filho = [...sessoes].find(([, a]) => a.type === 'iframe' && a.url.startsWith(`${dominio}/2026/320x100`));
            return filho && await avaliar(candidatos, filho[0]);
        }, 'iframe simples remoto');
        const filho = [...sessoes].find(([, a]) => a.type === 'iframe' && a.url.startsWith(`${dominio}/2026/320x100`));
        assert.deepEqual(await avaliar(medidas, filho[0]), { w: 320, h: 100 });
        assert.equal(await avaliar("document.querySelectorAll('.controles select').length", filho[0]), 3);
        console.log('Embed remoto 200/100px e iframe simples remoto 320x100 com dados/candidatos: OK.');
        for(const estado of ['vespera','dia','apuracao']) {
            dataTeste = estado==='vespera' ? '2026-10-03T12:00:00-03:00'
                : estado==='dia' ? '2026-10-04T07:00:00-03:00' : '2026-10-04T18:00:00-03:00';
            for(const [formato,[nativa,desktop,mobile]] of Object.entries(tamanhos)) {
                for(const viewport of [1400,320,360,390,400]) {
                    const token=`teste${formato.replace(/[^a-zA-Z0-9]/g,'')}${estado}${viewport}`;
                    await enviar('Emulation.setDeviceMetricsOverride',{width:viewport,height:900,deviceScaleFactor:1,mobile:false},sessionId);
                    await enviar('Page.navigate',{url:`${portal}/embed?formato=${formato}&cenario=${viewport===1400?'normal':'pai-largo'}&estado=${estado}&token=${token}`},sessionId);
                    const largura=formatosFixos.includes(formato) ? nativa : Math.min(viewport,nativa);
                    const altura=viewport===1400 || formatosFixos.includes(formato) ? desktop : mobile;
                    const verificar = estado==='apuracao' ? candidatos : "!!document.querySelector('.pre26-painel')";
                    let sessaoFilho;
                    await aguardar(async()=>{
                        const caminho=formato==='index' ? '/2026/' : `/2026/${formato}`;
                        sessaoFilho=[...sessoes].find(([,a])=>a.type==='iframe' && a.url.startsWith(dominio)
                            && [caminho,`/2026/${formato}.html`].includes(new URL(a.url).pathname)
                            && new URL(a.url).searchParams.get('marca')===token)?.[0];
                        return sessaoFilho && await avaliar(verificar,sessaoFilho);
                    },`${formato}/${estado}/${viewport} publicado`);
                    const box=await avaliar(`(()=>{const r=document.querySelector(${JSON.stringify(estado==='apuracao'?'.widget-horizontal,.widget-container':'.pre26-painel')}).getBoundingClientRect();
                        return {w:r.width,h:r.height,iw:innerWidth,titulo:document.querySelector('.pre26-texto h1')?.textContent,
                            filtros:[...document.querySelectorAll('#select-cargo,#select-uf')].map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height};})};})()`,sessaoFilho);
                    const detalhe=`${formato}/${estado}/${viewport}: ${JSON.stringify(box)}`;
                    assert.equal(box.w,largura,detalhe);
                    assert.equal(box.h,altura,detalhe);
                    assert.equal(box.iw,largura,detalhe);
                    if(estado==='apuracao') assert(box.filtros.length===2 && box.filtros.every(f=>f.w>0 && f.h>0),detalhe);
                    else assert(box.titulo.includes(estado==='vespera'?'1 dia':'Hoje'),detalhe);
                    const host=await avaliar("(()=>{const r=document.querySelector('eleicoes-widget').getBoundingClientRect();return {x:r.x,w:r.width,h:r.height};})()");
                    assert.equal(host.h,altura,detalhe);
                    if(!formatosFixos.includes(formato)) assert(host.x>=0 && host.x+host.w<=viewport+1,detalhe);
                }
            }
        }
        dataTeste='2026-10-04T18:00:00-03:00';
        console.log('Todos os dez banners publicados no embed: desktop e 320/360/390/400px, capas vespera/dia, apuracao e filtros; pai largo corrigido e formatos fixos preservados: OK.');
        for (const origemCliente of portaisClientes) {
            for (const modo of ['embed', 'iframe']) {
                const urlPai = `${origemCliente}/__teste-licenca-eleicoes/${modo}`;
                await enviar('Page.navigate', { url: urlPai }, sessionId);
                await aguardar(() => avaliar(`location.href===${JSON.stringify(urlPai)}`), 'origem de teste do cliente');
                const formato = modo === 'embed' ? '1260x200' : '320x100';
                await aguardar(async () => {
                    const sessaoFilho = [...sessoes].find(([, a]) => a.type === 'iframe' && a.url.startsWith(`${dominio}/2026/${formato}`));
                    return sessaoFilho && await avaliar(`document.referrer===${JSON.stringify(`${origemCliente}/`)} && (${candidatos})`, sessaoFilho[0]);
                }, `${origemCliente}: ${modo} autorizado pela CSP e pela licenca`);
            }
        }
        console.log('Site principal e cinco portais com/sem www: embed e iframe autorizados pela CSP/licenca. Origens simuladas; nenhum portal real consultado ou alterado: OK.');
        assert.equal(bloqueadas.length, 0, JSON.stringify(bloqueadas));
        assert.equal(erros.length, 0, JSON.stringify(erros));
        assert(resultados.length > 0);
        for (const r of resultados) {
            assert.equal(r.status, 200, r.url);
            const headers = Object.fromEntries(Object.entries(r.headers).map(([k, v]) => [k.toLowerCase(), v]));
            assert.equal(headers['access-control-allow-origin'], dominio);
            assert.equal(headers['x-data-source'], 'fixture-2026-teste');
            assert.equal(new URL(r.url).searchParams.get('ano'), '2026');
        }
        assert(!rede.some(url => new URL(url).hostname.endsWith('.vercel.app')));
        fs.writeFileSync(path.join(pasta, 'integracao-publica.json'), JSON.stringify({ dominio,
            verificadoEm: new Date().toISOString(), respostasSimuladas2026: resultados.length,
            origensClientesSimuladas: portaisClientes,
            erros: erros.length, consultasProibidas: bloqueadas.length, dependenciaVercel: false,
            resultadosOficiaisReaisValidados: false }, null, 2));
        console.log('2026 exclusivo, APIs reais interceptadas, sem erros JS ou dependencias Vercel: OK.');
        await enviar('Browser.close');
    } finally {
        socket?.close();
        for (const p of pendentes.values()) clearTimeout(p.timer);
        if (processo.exitCode === null) processo.kill();
        await new Promise(resolve => servidor.close(resolve));
    }
    console.log('Nenhum deploy, alteracao de DNS, consulta oficial ao TSE ou gravacao de snapshots/KV.');
}

main().catch(erro => { console.error(erro); process.exitCode = 1; });
