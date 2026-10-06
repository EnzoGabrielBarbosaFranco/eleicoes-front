(function () {
    'use strict';
    const cliente = window.ClientePersonalizado2026;
    if (!cliente) return;

    const BREAKPOINT_PADRAO = 760;
    const modoEmbed = new URLSearchParams(window.location.search).get('embed-modo');
    const breakpoint = configurarBreakpoint();
    const consultaMobile = modoEmbed === 'mobile' ? 'all'
        : modoEmbed === 'desktop' ? 'not all' : `(max-width: ${breakpoint}px)`;
    const consultaDesktop = modoEmbed === 'desktop' ? 'all'
        : modoEmbed === 'mobile' ? 'not all' : `(min-width: ${breakpoint + 1}px)`;
    window.ApuracaoPersonalizada2026 = { breakpoint, consultaMobile, consultaDesktop };

    aplicarCoresPersonalizadas(obterConfiguracaoVisual());
    const formatoOriginal = document.body.dataset.widget || '';
    const formatoMobileCompacto = document.body.matches('.formato-compacto-100, .formato-970x90, .formato-320x100');
    const mediaMobile = window.matchMedia(consultaMobile);
    function ajustarMarcaMobile() {
        document.body.classList.toggle('cliente-mobile-compacto', formatoMobileCompacto
            && (document.body.classList.contains('formato-320x100') || mediaMobile.matches));
    }
    ajustarMarcaMobile();
    mediaMobile.addEventListener('change', ajustarMarcaMobile);
    const indexCompacto = prepararIndexResponsivo();
    aplicarIdentidadeNormal();
    document.addEventListener('DOMContentLoaded', aplicarIdentidadeNormal, { once: true });
    window.addEventListener('resize', () => {
        if (formatoOriginal !== 'padrao') return;
        if (window.matchMedia(consultaMobile).matches !== indexCompacto) window.location.reload();
    });

    function configurarBreakpoint() {
        // Alinhar CSS e JS internos com o breakpoint do embed, sem tocar no
        // portal cliente nem nas media queries menores de cada formato.
        const informado = Number(new URLSearchParams(window.location.search).get('breakpoint'));
        const efetivo = Number.isInteger(informado) && informado > 0 && informado <= 10000
            ? informado : BREAKPOINT_PADRAO;
        document.documentElement.dataset.embedBreakpoint = String(efetivo);
        const incorporado = modoEmbed === 'mobile' || modoEmbed === 'desktop';
        if (efetivo === BREAKPOINT_PADRAO && !incorporado) return efetivo;
        const limiteMobile = incorporado ? (modoEmbed === 'mobile' ? 10000 : 0) : efetivo;
        const inicioDesktop = incorporado ? (modoEmbed === 'desktop' ? 0 : 10001) : efetivo + 1;
        const adaptar = regras => {
            for (const regra of regras) {
                if (regra.type === CSSRule.MEDIA_RULE) {
                    regra.media.mediaText = regra.media.mediaText
                        .replace(/\(max-width:\s*760px\)/g, `(max-width: ${limiteMobile}px)`)
                        .replace(/\(min-width:\s*761px\)/g, `(min-width: ${inicioDesktop}px)`);
                }
                if (regra.cssRules) adaptar(regra.cssRules);
            }
        };
        for (const folha of document.styleSheets) {
            if (folha.href && new URL(folha.href).origin !== window.location.origin) continue;
            adaptar(folha.cssRules);
        }
        return efetivo;
    }

    function obterPrimeiroParametro(parametros, nomes) {
        for (const nome of nomes) {
            const valor = parametros.get(nome);
            if (valor != null && valor.trim()) return valor.trim();
        }
        return '';
    }

    function obterConfiguracaoVisual() {
        const parametros = new URLSearchParams(window.location.search);
        const visao = obterPrimeiroParametro(parametros, ['visao', 'view']).toLowerCase();

        return {
            marca: cliente.nome,
            visao: visao === 'geral' || visao === 'candidatos' ? visao : 'candidatos',
            primaria: cliente.cores.primaria,
            destaque: cliente.cores.destaque,
            clara: cliente.cores.clara
        };
    }

    function aplicarCoresPersonalizadas(configuracao) {
        const { primaria, destaque, clara } = configuracao;
        const estilo = document.body.style;

        document.body.dataset.visaoInicial = configuracao.visao;
        if (configuracao.marca) document.body.dataset.marcaPersonalizada = configuracao.marca;

        if (primaria) {
            estilo.setProperty('--ink', primaria);
            estilo.setProperty('--ink-soft', primaria);
            estilo.setProperty('--brand-950', primaria);
            estilo.setProperty('--brand-900', primaria);
            estilo.setProperty('--brand-800', primaria);
        }
        if (destaque) {
            estilo.setProperty('--mint-strong', destaque);
            estilo.setProperty('--mint-dark', destaque);
            estilo.setProperty('--brand-700', destaque);
            estilo.setProperty('--success-700', destaque);
            estilo.setProperty('--success-600', destaque);
        }
        if (clara) {
            estilo.setProperty('--mint', clara);
            estilo.setProperty('--brand-100', clara);
            estilo.setProperty('--brand-50', `color-mix(in srgb, ${clara} 24%, #fff)`);
            estilo.setProperty('--success-100', `color-mix(in srgb, ${clara} 48%, #fff)`);
        }
    }

    function prepararIndexResponsivo() {
        const deveUsarFormatoCompacto = formatoOriginal === 'padrao'
            && window.matchMedia(consultaMobile).matches;
        if (!deveUsarFormatoCompacto) return false;

        document.body.dataset.widget = '300x250';
        document.body.classList.add('index-mobile-300x250');

        const statusLabel = document.querySelector('.status-label');
        const statusDot = statusLabel?.querySelector('.status-dot');
        const ultimaAtualizacao = document.getElementById('ultima-atualizacao');
        if (statusLabel && statusDot && ultimaAtualizacao) {
            statusLabel.replaceChildren(statusDot, document.createTextNode('Apuradas '), ultimaAtualizacao);
        }

        const resumo = document.querySelector('.resumo-votos');
        if (resumo && !document.querySelector('.resumo-toggle')) {
            resumo.id = 'bloco-resumo';
            resumo.classList.add('oculto');

            const botao = document.createElement('button');
            botao.type = 'button';
            botao.className = 'resumo-toggle';
            botao.setAttribute('aria-expanded', 'false');
            botao.setAttribute('aria-controls', 'bloco-resumo');
            botao.innerHTML = '<span id="txt-toggle">Ver resumo de votos</span>';
            botao.addEventListener('click', () => window.toggleResumo?.());
            resumo.before(botao);
        }

        return true;
    }

    function aplicarIdentidadeNormal() {
        const cabecalho = document.querySelector('.header-brand');
        if (!cabecalho) return;

        const tituloMarca = cabecalho.querySelector('.header-copy h1, .header-copy h2');
        if (tituloMarca) {
            tituloMarca.textContent = cliente.nome;
            tituloMarca.title = cliente.nome;
        }

        if (!cabecalho.querySelector('.brand-mark')) {
            const marca = document.createElement('span');
            marca.className = 'brand-mark';
            marca.setAttribute('aria-hidden', 'true');
            cabecalho.prepend(marca);
        }
        window.aplicarLogoCliente2026(cabecalho);
        document.body.classList.add('identidade-2026');
        window.AvisoTurnos2026?.aplicar(cabecalho, consultaMobile);
    }
})();
