'use strict';

// Verificacao somente leitura: arquivos estaticos e rotas de CORS que nao consultam KV/TSE.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { paginas } = require('./preparar-pages');
const raiz = path.resolve(__dirname, '..');
const destino = path.join(raiz, 'dist-pages');
const dominio = 'https://apuracao.paineleleitoralnews.com.br';

async function buscar(url, opcoes = {}) {
    return fetch(url, { ...opcoes, signal: AbortSignal.timeout(20000) });
}

async function verificarCors(worker) {
    const origem = `https://${worker}.enzo-eleicoes-backend.workers.dev`;
    // '/' e OPTIONS nao atualizam snapshots, nem acessam KV ou TSE.
    for (const cliente of [dominio, 'https://eleicoes-front.vercel.app', 'https://nao-autorizado.example']) {
        for (const method of ['GET', 'OPTIONS']) {
            const resposta = await buscar(`${origem}/`, {
                method, headers: { Origin: cliente, ...(method === 'OPTIONS' ? {
                    'Access-Control-Request-Method': 'GET',
                } : {}) },
            });
            assert.equal(resposta.status, method === 'OPTIONS' ? 204 : 200, `${worker}: ${method}`);
            assert.equal(resposta.headers.get('access-control-allow-origin'),
                cliente.endsWith('.example') ? null : cliente, `${worker}: CORS ${cliente}`);
            assert.match(resposta.headers.get('vary') || '', /Origin/i);
            await resposta.arrayBuffer();
        }
    }
    console.log(`${worker}: origem nova e antiga, preflight e origem nao autorizada: OK.`);
}

async function verificarPages(endereco) {
    const base = new URL(endereco);
    assert.equal(base.protocol, 'https:');
    assert(!base.username && !base.password && base.pathname === '/' && !base.search && !base.hash);
    assert(base.hostname === 'eleicoes-front.pages.dev' || base.origin === dominio,
        'Destino deve ser o Pages eleicoes-front ou o dominio proprio autorizado.');
    const csp = fs.readFileSync(path.join(destino, '_headers'), 'utf8')
        .match(/Content-Security-Policy: (.+)/)[1];
    const divergenciasCache = [];
    for (const pagina of paginas) {
        const resposta = await buscar(new URL(`${pagina}?marca=Teste%20Pages&cor-primaria=%23123456`, base));
        assert.equal(resposta.status, 200, pagina);
        assert.match(resposta.headers.get('content-type') || '', /text\/html/);
        assert.equal(resposta.headers.get('content-security-policy'), csp);
        assert.equal(resposta.headers.get('x-frame-options'), null, `${pagina}: iframe bloqueado`);
        const url = new URL(resposta.url);
        const caminho = pagina.endsWith('index.html') ? `/${pagina.slice(0, -10)}` : `/${pagina.slice(0, -5)}`;
        assert.equal(url.origin, base.origin);
        assert.equal(url.pathname, caminho);
        assert.equal(url.searchParams.get('marca'), 'Teste Pages');
        assert.equal(url.searchParams.get('cor-primaria'), '#123456');
        assert.equal(await resposta.text(), fs.readFileSync(path.join(destino, pagina), 'utf8'), `${pagina}: conteudo diferente`);
    }
    const marcador = JSON.parse(fs.readFileSync(path.join(destino, '.pages-build.json'), 'utf8'));
    for (const recurso of ['embed.js', 'seguranca.js',
        ...Object.keys(marcador.versionados).map((url) => url.slice(1)),
        ...Object.values(marcador.versionados).map((url) => url.slice(1))]) {
        const resposta = await buscar(new URL(recurso, base));
        assert.equal(resposta.status, 200, recurso);
        assert(Buffer.from(await resposta.arrayBuffer()).equals(fs.readFileSync(path.join(destino, recurso))), `${recurso}: bytes diferentes`);
        const atual = resposta.headers.get('cache-control') || '';
        const esperado = recurso.startsWith('static/') ? /max-age=31536000,\s*immutable/ : /max-age=300/;
        if (!esperado.test(atual)) divergenciasCache.push({ recurso, atual, esperado: esperado.source });
    }
    const ausente = await buscar(new URL('2026/assets/arquivo-inexistente.json', base));
    assert.equal(ausente.status, 404, 'JSON inexistente nao pode retornar HTML com status 200.');
    await ausente.arrayBuffer();
    const amostraAntiga = await buscar(new URL('2026/assets/dados-2022.json', base));
    assert.equal(amostraAntiga.status, 404, 'Nao distribuir a amostra historica nas paginas de 2026.');
    await amostraAntiga.arrayBuffer();
    console.log(`${base.origin}: 15 paginas e todos os recursos identicos, parametros, CSP e 404: OK.`);
    // Continuar o inventario em caso de TTL divergente, sem aceitar silenciosamente
    // o cache incorreto. Assim o diagnostico identifica todos os caminhos afetados.
    if (divergenciasCache.length) {
        console.error(JSON.stringify({ divergenciasCache }, null, 2));
        assert.fail('O cache publico diverge do build. Nao considerar a validacao completa.');
    }
    console.log(`${base.origin}: 15 paginas, parametros, recursos identicos, CSP, cache e 404: OK.`);
}

async function main() {
    const [modo, alvo] = process.argv.slice(2);
    assert.equal(process.argv.length, 4,
        'Uso: node scripts/verificar-publicacao-pages.js cors backend-eleicoes OU pages https://eleicoes-front.pages.dev');
    if (modo === 'cors') {
        assert(['backend-eleicoes', 'backend-eleicoes-2026'].includes(alvo));
        await verificarCors(alvo);
    } else {
        assert.equal(modo, 'pages');
        await verificarPages(alvo);
    }
    console.log('Sem deploy, alteracao de DNS, consulta ao TSE ou alteracao de snapshots/KV.');
}

main().catch((erro) => { console.error(erro); process.exitCode = 1; });
