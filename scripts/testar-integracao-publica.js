'use strict';

// Somente leitura: usa dados historicos de 2022 do KV. Bloqueia consultas oficiais
// de 2026 para nao atualizar snapshots/TSE durante a verificacao da migracao.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { setTimeout: esperar } = require('node:timers/promises');
const dominio = 'https://apuracao.paineleleitoralnews.com.br';
const raiz = path.resolve(__dirname, '..');

async function main() {
    assert.equal(process.argv.length, 2, 'Este teste nao aceita outros dominios ou argumentos.');
    const navegador = [process.env.ELEICOES_TEST_BROWSER,
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
        .find((arquivo) => arquivo && fs.existsSync(arquivo));
    assert(navegador, 'Chrome/Edge nao encontrado.');
    const servidor = http.createServer((req, res) => {
        const embed = req.url === '/embed';
        const conteudo = embed
            ? `<script src="${dominio}/embed.js" defer></script><eleicoes-widget ano="2026" formato="1260x200" breakpoint="1050"></eleicoes-widget>`
            : `<iframe src="${dominio}/2026/320x100.html" width="320" height="100" scrolling="no" style="display:block;border:0"></iframe>`;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"></head><body style="margin:0">${conteudo}</body></html>`);
    });
    await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));
    const portal = `http://127.0.0.1:${servidor.address().port}`;
    const pasta = path.join(raiz, '.pages-tests');
    fs.mkdirSync(pasta, { recursive: true });
    const perfil = fs.mkdtempSync(path.join(pasta, 'publico-chrome-'));
    const processo = spawn(navegador, ['--headless=new', '--no-first-run', '--no-default-browser-check',
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
        const erros = [];
        const bloqueadas = [];
        const resultados = [];
        const rede = [];
        function enviar(method, params = {}, sessionId) {
            return new Promise((resolve, reject) => {
                const chave = ++id;
                const timer = setTimeout(() => { pendentes.delete(chave); reject(new Error(`Timeout: ${method}`)); }, 10000);
                pendentes.set(chave, { resolve, reject, timer });
                socket.send(JSON.stringify({ id: chave, method, params, sessionId }));
            });
        }
        async function preparar(sessionId, alvo) {
            if (sessoes.has(sessionId)) return;
            sessoes.set(sessionId, alvo);
            await enviar('Runtime.enable', {}, sessionId);
            await enviar('Network.enable', {}, sessionId);
            await enviar('Page.enable', {}, sessionId);
            await enviar('Fetch.enable', { patterns: [{ urlPattern: 'https://*.workers.dev/*' },
                { urlPattern: 'https://*.vercel.app/*' }] }, sessionId);
            await enviar('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true }, sessionId);
            await enviar('Runtime.runIfWaitingForDebugger', {}, sessionId);
        }
        socket.onmessage = ({ data }) => {
            const m = JSON.parse(data);
            if (m.id) {
                const p = pendentes.get(m.id);
                if (!p) return;
                pendentes.delete(m.id); clearTimeout(p.timer);
                m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
                return;
            }
            if (m.method === 'Target.attachedToTarget') {
                preparar(m.params.sessionId, m.params.targetInfo).catch((e) => erros.push(e.message));
            }
            if (m.method === 'Target.detachedFromTarget') sessoes.delete(m.params.sessionId);
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
                const permitido = request.method === 'GET'
                    && url.hostname === 'backend-eleicoes.enzo-eleicoes-backend.workers.dev'
                    && url.searchParams.get('ano') === '2022';
                if (!permitido) bloqueadas.push(url.href);
                enviar(permitido ? 'Fetch.continueRequest' : 'Fetch.failRequest',
                    permitido ? { requestId } : { requestId, errorReason: 'BlockedByClient' }, m.sessionId)
                    .catch((e) => erros.push(e.message));
            }
        };
        const { targetId } = await enviar('Target.createTarget', { url: 'about:blank' });
        const { sessionId } = await enviar('Target.attachToTarget', { targetId, flatten: true });
        await preparar(sessionId, { targetId, type: 'page', url: 'about:blank' });
        async function avaliar(expressao, sessao = sessionId) {
            const r = await enviar('Runtime.evaluate', { expression: expressao, returnByValue: true, awaitPromise: true }, sessao);
            if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
            return r.result.value;
        }
        async function aguardar(fn, detalhe) {
            for (let i = 0; i < 200; i++) {
                if (await fn()) return;
                await esperar(50);
            }
            throw new Error(`Nao confirmou: ${detalhe}; erros=${JSON.stringify(erros)}`);
        }
        const candidatos = "document.querySelectorAll('.card-cand,.candidato-card').length > 0";
        const medidas = "(() => {const r=document.querySelector('.widget-horizontal').getBoundingClientRect();return {w:r.width,h:r.height};})()";
        await enviar('Emulation.setDeviceMetricsOverride', { width: 1400, height: 800, deviceScaleFactor: 1, mobile: false }, sessionId);
        await enviar('Page.navigate', { url: `${dominio}/2026/1260x200.html` }, sessionId);
        await aguardar(() => avaliar(candidatos), 'dados historicos carregados no dominio proprio');
        assert.deepEqual(await avaliar(medidas), { w: 1260, h: 200 });
        await enviar('Emulation.setDeviceMetricsOverride', { width: 360, height: 400, deviceScaleFactor: 1, mobile: false }, sessionId);
        await aguardar(async () => (await avaliar(medidas)).h === 100, 'altura mobile');
        await avaliar("(() => {const e=document.getElementById('select-cargo');e.value='3';e.dispatchEvent(new Event('change'));})()");
        await aguardar(() => avaliar("!document.getElementById('select-uf').disabled"), 'filtro de cargo');
        await avaliar("(() => {const e=document.getElementById('select-uf');e.value='mt';e.dispatchEvent(new Event('change'));})()");
        await aguardar(() => avaliar("document.getElementById('lista-candidatos').getAttribute('aria-busy')==='false' && document.querySelectorAll('.card-cand').length>0"), 'filtro UF MT');
        assert(resultados.some(r => r.url.includes('cargo=3&uf=mt') && r.status === 200));
        console.log('Dominio publico: API historica real, 1260x200 desktop, 100px mobile e filtros cargo/UF: OK.');
        await enviar('Page.navigate', { url: `${portal}/embed` }, sessionId);
        await aguardar(() => avaliar("!!document.querySelector('eleicoes-widget')?.shadowRoot?.querySelector('iframe')"), 'embed entre sites');
        assert.equal(await avaliar("document.querySelector('eleicoes-widget').shadowRoot.querySelector('iframe').src"), `${dominio}/2026/1260x200.html`);
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
        assert.equal(bloqueadas.length, 0, JSON.stringify(bloqueadas));
        assert.equal(erros.length, 0, JSON.stringify(erros));
        assert(resultados.length > 0);
        for (const r of resultados) {
            assert.equal(r.status, 200, r.url);
            const headers = Object.fromEntries(Object.entries(r.headers).map(([k, v]) => [k.toLowerCase(), v]));
            assert.equal(headers['access-control-allow-origin'], dominio);
            assert.equal(headers['x-data-source'], 'kv-history');
        }
        assert(!rede.some(url => new URL(url).hostname.endsWith('.vercel.app')));
        fs.writeFileSync(path.join(pasta, 'integracao-publica.json'), JSON.stringify({ dominio,
            verificadoEm: new Date().toISOString(), respostasHistoricas: resultados.length,
            erros: erros.length, consultas2026: bloqueadas.length, dependenciaVercel: false }, null, 2));
        console.log('CORS real, fonte KV historica, sem erros JS ou dependencias Vercel: OK.');
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
