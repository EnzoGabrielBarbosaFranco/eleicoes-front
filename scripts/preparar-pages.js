'use strict';

// Gera somente arquivos estaticos. Nao publica nem acessa Workers, KV ou TSE.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const raiz = path.resolve(__dirname, '..');
const destino = path.join(raiz, 'dist-pages');
const marcador = '.pages-build.json';
const gerador = 'eleicoes-front-pages-v1';
const formatos2022 = ['index', 'horizontal', '970x250', '300x250', '300x600'];
const formatos2026 = [...formatos2022, '970x90', '970x250x100', '1260x100', '1260x200', '320x100'];
const paginas = [...formatos2022.map((nome) => `${nome}.html`),
    ...formatos2026.map((nome) => `2026/${nome}.html`)];
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 16);

function ler(arquivo) {
    const alvo = path.join(raiz, arquivo);
    if (fs.lstatSync(alvo).isSymbolicLink()) throw new Error(`Link simbolico nao permitido: ${arquivo}`);
    return fs.readFileSync(alvo);
}

function listar(pasta) {
    if (fs.lstatSync(path.join(raiz, pasta)).isSymbolicLink()) throw new Error(`Link simbolico nao permitido: ${pasta}`);
    return fs.readdirSync(path.join(raiz, pasta), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
        .flatMap((entrada) => {
            const arquivo = `${pasta}/${entrada.name}`;
            if (entrada.isSymbolicLink()) throw new Error(`Link simbolico nao permitido: ${arquivo}`);
            return entrada.isDirectory() ? listar(arquivo) : [arquivo];
        });
}

function gerar() {
    const arquivos = new Map();
    const versionados = new Map();
    // Lista permitida: nunca copiar o repositorio inteiro, credenciais, backend ou entrega.
    for (const pasta of ['css', 'js', '2026/assets']) {
        for (const arquivo of listar(pasta)) {
            if (!/\.(css|js|json)$/.test(arquivo)) throw new Error(`Recurso inesperado: ${arquivo}`);
            arquivos.set(arquivo, ler(arquivo));
        }
    }
    arquivos.set('seguranca.js', ler('seguranca.js'));
    for (const [arquivo, bytes] of [...arquivos]) {
        if (!/\.(css|js)$/.test(arquivo)) continue;
        const extensao = path.extname(arquivo);
        const slug = arquivo.slice(0, -extensao.length).replaceAll('/', '-');
        const url = `/static/${slug}.${hash(bytes)}${extensao}`;
        versionados.set(`/${arquivo}`, url);
        arquivos.set(url.slice(1), bytes);
    }
    for (const pagina of paginas) {
        const html = ler(pagina).toString('utf8').replace(/\b(href|src)="([^"\s]+)"/g, (atributo, nome, valor) => {
            if (/^(?:https?:|data:|#)/.test(valor)) return atributo;
            const recurso = path.posix.normalize(path.posix.join('/', path.posix.dirname(pagina), valor));
            const chave = valor.startsWith('/') ? valor : recurso;
            if (!versionados.has(chave)) throw new Error(`Referencia nao processada: ${pagina}: ${valor}`);
            return `${nome}="${versionados.get(chave)}"`;
        });
        arquivos.set(pagina, Buffer.from(html));
    }
    for (const arquivo of ['embed.js', '_headers', '404.html']) arquivos.set(arquivo, ler(arquivo));
    arquivos.set(marcador, Buffer.from(JSON.stringify({ gerador, paginas, versionados: Object.fromEntries(versionados) }, null, 2)));
    if (arquivos.size > 20000) throw new Error('Mais de 20.000 arquivos no build.');
    for (const [arquivo, bytes] of arquivos) {
        if (bytes.length > 25 * 1024 * 1024) throw new Error(`Mais de 25 MiB por arquivo: ${arquivo}`);
    }
    if (path.dirname(destino) !== raiz || path.basename(destino) !== 'dist-pages') throw new Error('Destino inseguro.');
    if (fs.existsSync(destino)) {
        if (fs.lstatSync(destino).isSymbolicLink() || !fs.existsSync(path.join(destino, marcador)) ||
            JSON.parse(fs.readFileSync(path.join(destino, marcador), 'utf8')).gerador !== gerador) {
            throw new Error('dist-pages nao e um build conhecido. Mova essa pasta manualmente.');
        }
        fs.rmSync(destino, { recursive: true });
    }
    fs.mkdirSync(destino);
    fs.writeFileSync(path.join(destino, marcador), arquivos.get(marcador));
    for (const [arquivo, bytes] of arquivos) {
        const alvo = path.join(destino, arquivo);
        fs.mkdirSync(path.dirname(alvo), { recursive: true });
        fs.writeFileSync(alvo, bytes);
    }
    console.log(`Build Pages: ${arquivos.size} arquivos, ${(Array.from(arquivos.values()).reduce((s, b) => s + b.length, 0) / 1024 / 1024).toFixed(2)} MiB; 15 paginas.`);
    console.log('Somente build local. Nenhuma publicacao, DNS ou chamada ao backend.');
    return { destino, paginas, versionados };
}

if (require.main === module) gerar();
module.exports = { gerar, paginas, formatos2022, formatos2026 };
