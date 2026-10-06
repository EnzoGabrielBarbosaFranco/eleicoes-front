'use strict';

const fs = require('node:fs');
const path = require('node:path');
const clientes = require('../personalizados/clientes');
const { formatos2026 } = require('./preparar-pages');
const origem = 'https://apuracao.placardasurnas.com.br';
const dimensoes = { index: [1180, 680], horizontal: [1200, 100], '970x90': [970, 90],
    '970x250': [970, 250], '970x250x100': [970, 250], '1260x100': [1260, 100],
    '1260x200': [1260, 200], '320x100': [320, 100], '300x250': [300, 250], '300x600': [300, 600] };

function gerarCodigos(site, breakpoint = 1050) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(site) || !Object.hasOwn(clientes, site)) {
        throw new Error('Cliente nao cadastrado em personalizados/clientes.js.');
    }
    if (!Number.isInteger(breakpoint) || breakpoint < 1 || breakpoint > 10000) throw new Error('Breakpoint invalido.');
    return formatos2026.map(formato => {
        const [largura, altura] = dimensoes[formato];
        const url = `${origem}/personalizados/${formato}.html?site=${encodeURIComponent(site)}`;
        return { formato, url,
            site: `<script src="${origem}/embed.js" defer></script>\n<eleicoes-widget ano="2026" formato="${formato}" breakpoint="${breakpoint}" site="${site}"></eleicoes-widget>\n`,
            adManager: `<iframe src="${url}" width="${largura}" height="${altura}" title="Apuração das Eleições 2026" scrolling="no" style="position:absolute;inset:0;display:block;width:100%;height:100%;margin:0;padding:0;border:0;overflow:hidden"></iframe>\n`
        };
    });
}

function salvarEntrega(site, breakpoint) {
    const codigos = gerarCodigos(site, breakpoint);
    const destino = path.resolve(__dirname, '../entrega/clientes', site);
    if (fs.existsSync(destino)) throw new Error('Entrega ja existe. Revise os arquivos existentes antes de gerar novamente.');
    // Gerar arquivos novos apenas: nunca sobrescrever uma entrega anterior.
    fs.mkdirSync(path.join(destino, 'sites'), { recursive: true });
    fs.mkdirSync(path.join(destino, 'ad-manager'));
    for (const codigo of codigos) {
        fs.writeFileSync(path.join(destino, 'sites', `${codigo.formato}.txt`), codigo.site, { flag: 'wx' });
        fs.writeFileSync(path.join(destino, 'ad-manager', `${codigo.formato}.txt`), codigo.adManager, { flag: 'wx' });
    }
    const aviso = clientes[site].demonstracao
        ? 'ATENCAO: identidade de demonstracao. Nao entregar como marca de um cliente real.\n\n' : '';
    fs.writeFileSync(path.join(destino, 'LEIA-ME.txt'), aviso
        + 'Arquivos locais; gerar esta entrega nao publica os banners.\n'
        + 'Sites: carregar embed.js uma vez por pagina. O atributo site identifica a marca.\n'
        + 'Ad Manager: criativo HTML com iframe, sem embed.js no criativo; tamanho nativo em desktop.\n'
        + 'Mobile no Ad Manager: usar criativo 320x100 e size mapping no portal. O iframe nao aumenta o slot sozinho.\n'
        + 'Antes de distribuir: autorizar os dominios em seguranca.js, _headers e vercel.json; publicar com aprovacao.\n'
        + 'URLs para conferir:\n' + codigos.map(c => c.url).join('\n') + '\n', { flag: 'wx' });
    console.log(`Entrega local: ${destino}\n10 codigos para sites e 10 para Ad Manager. Nenhuma publicacao.`);
}

if (require.main === module) {
    try {
        if (!process.argv[2] || process.argv.length > 4) throw new Error('Uso: node scripts/gerar-entrega-cliente.js cliente-x [breakpoint]');
        salvarEntrega(process.argv[2], process.argv[3] === undefined ? 1050 : Number(process.argv[3]));
    } catch (erro) { console.error(erro.message); process.exitCode = 1; }
}
module.exports = { gerarCodigos };
